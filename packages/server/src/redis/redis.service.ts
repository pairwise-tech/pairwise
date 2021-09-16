import { Injectable } from "@nestjs/common";
import IORedis from "ioredis";
import { RedisService } from "nestjs-redis";
import {
  CacheUpdateMessage,
  Ok,
  Err,
  Result,
  assertUnreachable,
} from "@pairwise/common";
import ENV from "../tools/server-env";
import shortid from "shortid";
import { WebSocketsGatewayService } from "../websockets/websockets.service";
import { ProgressDto } from "../progress/progress.dto";

/** ===========================================================================
 * Redis Types and Config
 * ============================================================================
 */

enum REDIS_CACHE_KEYS {
  RECENT_PROGRESS_HISTORY = "RECENT_PROGRESS_HISTORY",
  SERVICE_IDENTIFIER = "SERVICE_IDENTIFIER",
}

enum PUB_SUB_CHANNELS {
  CACHE_UPDATE_CHANNEL = "CACHE_UPDATE_CHANNEL",
}

export const REDIS_CLIENT_CONFIG = {
  CLIENT: ENV.REDIS_NAME,
  PUBLISHER: `${ENV.REDIS_NAME}-publisher`,
  SUBSCRIBER: `${ENV.REDIS_NAME}-subscriber`,
};

/** ===========================================================================
 * Progress Updates Types and Config
 * ============================================================================
 */

interface ProgressEntry {
  user: string;
  lastUpdated: number;
  challengeIds: Set<string>;
}

interface ProgressMap {
  [id: string]: ProgressEntry;
}

interface ProgressCacheData {
  time: number;
  challenges: number;
  uuidMap: Map<string, string>;
  progress: ProgressMap;
}

interface RawProgressMap {
  [id: string]: {
    user: string;
    lastUpdated: number;
    challengeIds: Array<string>;
  };
}

interface RawProgressCacheData {
  time: number;
  challenges: number;
  uuidMap: { [key: string]: string };
  progress: RawProgressMap;
}

const progressCacheDefaultData: ProgressCacheData = {
  time: Date.now(),
  challenges: 0,
  uuidMap: new Map(),
  progress: {},
};

/** ===========================================================================
 * Redis Client Service
 * ----------------------------------------------------------------------------
 * NOTE: This code is subject to a race condition if the Cloud Run server
 * is deployed as multiple instances and two separate instances query
 * the cache and then write to the cache. It should be possible to mitigate
 * this problem using Redis client multi/pipeline transaction utils.
 * ============================================================================
 */

@Injectable()
export class RedisClientService {
  /**
   * Generate a random id to identify this running Cloud run instance. This
   * is used to keep only a single instance connected with web sockets.
   */
  serviceId = shortid();

  client: IORedis.Redis | null = null;
  publisherClient: IORedis.Redis | null = null;
  subscriberClient: IORedis.Redis | null = null;

  constructor(
    private readonly redisService: RedisService,
    private readonly websocketsService: WebSocketsGatewayService,
  ) {
    this.initializePrimaryClient();
    this.initializePubSubClients();
  }

  private async initializePrimaryClient() {
    try {
      const client = await this.redisService.getClient(
        REDIS_CLIENT_CONFIG.CLIENT,
      );

      this.client = client;
    } catch (err) {
      console.log("Failed to initialize Redis Client, error: ", err);
    }
  }

  private async initializePubSubClients() {
    try {
      this.publisherClient = await this.redisService.getClient(
        REDIS_CLIENT_CONFIG.PUBLISHER,
      );
      this.subscriberClient = await this.redisService.getClient(
        REDIS_CLIENT_CONFIG.SUBSCRIBER,
      );

      this.initializeRedisSubscriber(this.subscriberClient);
    } catch (err) {
      console.log("Failed to initialize Redis PubSub Client, error: ", err);
    }
  }

  private async initializeRedisSubscriber(subscriberClient: IORedis.Redis) {
    /**
     * Only maintain 1 listener for N server deployments, override
     * whatever service id was already in place.
     */
    this.client.set(REDIS_CACHE_KEYS.SERVICE_IDENTIFIER, this.serviceId);

    // Subscribe to messages
    subscriberClient.on("message", this.handleRedisSubscriptionMessages);
    subscriberClient.subscribe(PUB_SUB_CHANNELS.CACHE_UPDATE_CHANNEL);
  }

  private handlePublishMessage<MessageType>(
    channel: PUB_SUB_CHANNELS,
    message: MessageType,
  ) {
    this.publisherClient.publish(channel, JSON.stringify(message));
  }

  private handleDeserializeMessage<MessageType>(
    message: string,
  ): Result<MessageType, string> {
    try {
      const result: MessageType = JSON.parse(message);
      if (result) {
        return new Ok(result);
      } else {
        throw new Error("No message data found");
      }
    } catch (err) {
      return new Err("Failed to parse message.");
    }
  }

  private handleRedisSubscriptionMessages = async (
    channel: PUB_SUB_CHANNELS,
    message: string,
  ) => {
    const id = await this.client.get(REDIS_CACHE_KEYS.SERVICE_IDENTIFIER);

    /**
     * Restrict message handlers to only a single instance, to handle
     * Cloud Run scaling and restarting the server.
     */
    if (String(id) !== this.serviceId) {
      /**
       * Disconnect any existing web socket clients and close the connection.
       */
      this.websocketsService.disconnectServer();

      console.log(
        "This is not the primary Redis subscriber, disregarding event.",
      );
      return;
    }

    switch (channel) {
      /**
       * Cache updates could be used to trigger realtime user activity
       * push updates to the apps.
       */
      case PUB_SUB_CHANNELS.CACHE_UPDATE_CHANNEL:
        const result =
          this.handleDeserializeMessage<CacheUpdateMessage>(message);

        if (result.value) {
          this.websocketsService.broadcastRealTimeUpdate(result.value);
        }
        break;
      default:
        assertUnreachable(channel);
    }
  };

  public async getProgressCacheData(): Promise<
    Result<ProgressCacheData, Error>
  > {
    try {
      const json = await this.client.get(
        REDIS_CACHE_KEYS.RECENT_PROGRESS_HISTORY,
      );

      // If no value exists, initialize it and then recurse on the current
      // function. This theoretically should only happen once, on the first
      // time the server interacts with Redis.
      if (json === null) {
        await this.initializeProgressCache();
        return this.getProgressCacheData();
      }

      const parsed: RawProgressCacheData = JSON.parse(json);
      const result = this.deserializeProgressCache(parsed);

      return new Ok(result);
    } catch (err) {
      console.log("Failed to get progress cache data from Redis, err: ", err);
      return new Err(err);
    }
  }

  public async setProgressCacheData(
    data: ProgressCacheData,
    progressDto: ProgressDto,
  ) {
    try {
      const { complete, challengeId } = progressDto;
      const client = this.client;
      const json = this.serializeProgressCache(data);

      // Update cache
      client.set(REDIS_CACHE_KEYS.RECENT_PROGRESS_HISTORY, json);

      const message: CacheUpdateMessage = {
        data: {
          complete,
          challengeId,
        },
      };

      // Publish update event
      this.handlePublishMessage<CacheUpdateMessage>(
        PUB_SUB_CHANNELS.CACHE_UPDATE_CHANNEL,
        message,
      );
    } catch (err) {
      console.log("Failed to set progress cache data in Redis, err: ", err);
    }
  }

  private async initializeProgressCache() {
    const json = this.serializeProgressCache(progressCacheDefaultData);
    await this.client.set(REDIS_CACHE_KEYS.RECENT_PROGRESS_HISTORY, json);
  }

  private deserializeProgressCache(
    rawData: RawProgressCacheData,
  ): ProgressCacheData {
    const progress: ProgressMap = {};
    for (const [k, v] of Object.entries(rawData.progress)) {
      const entry: ProgressEntry = {
        user: v.user,
        lastUpdated: v.lastUpdated,
        challengeIds: new Set(v.challengeIds),
      };
      progress[k] = entry;
    }

    const result: ProgressCacheData = {
      ...rawData,
      progress,
      uuidMap: new Map(Object.entries(rawData.uuidMap)),
    };

    return result;
  }

  private serializeProgressCache(data: ProgressCacheData) {
    const progress: RawProgressMap = {};

    for (const [k, v] of Object.entries(data.progress)) {
      const now = Date.now();
      const ONE_DAY_TIME = 24 * 60 * 60 * 1000;

      // Skip and exclude the entry if last updated exceeds one day
      if (now - v.lastUpdated > ONE_DAY_TIME) {
        // Remove from uuidMap
        data.uuidMap.delete(k);

        continue;
      }

      progress[k] = {
        user: v.user,
        lastUpdated: v.lastUpdated,
        challengeIds: Array.from(v.challengeIds),
      };
    }

    const result = {
      ...data,
      progress,
      uuidMap: Object.fromEntries(data.uuidMap),
    };

    return JSON.stringify(result);
  }
}
