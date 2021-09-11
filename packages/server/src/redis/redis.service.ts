import { Injectable } from "@nestjs/common";
import IORedis from "ioredis";
import { RedisService } from "nestjs-redis";
import { Ok, Err, Result } from "@pairwise/common";

enum REDIS_CACHE_KEYS {
  PROGRESS = "PROGRESS",
}

interface ProgressEntry {
  user: string;
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

@Injectable()
export class RedisClientService {
  client: IORedis.Redis | null = null;

  constructor(private readonly redisService: RedisService) {
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      const client = await this.redisService.getClient("redis");
      this.client = client;
    } catch (err) {
      console.log("Failed to initialize Redis Client, error: ", err);
    }
  }

  public async getProgressCacheData(): Promise<
    Result<ProgressCacheData, Error>
  > {
    try {
      const json = await this.client.get(REDIS_CACHE_KEYS.PROGRESS);

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

  public async setProgressCacheData(data: ProgressCacheData) {
    try {
      const client = this.client;
      const json = this.serializeProgressCache(data);
      client.set(REDIS_CACHE_KEYS.PROGRESS, json);
    } catch (err) {
      console.log("Failed to set progress cache data in Redis, err: ", err);
    }
  }

  private async initializeProgressCache() {
    const json = this.serializeProgressCache(progressCacheDefaultData);
    await this.client.set(REDIS_CACHE_KEYS.PROGRESS, json);
  }

  private deserializeProgressCache(
    rawData: RawProgressCacheData,
  ): ProgressCacheData {
    const progress: ProgressMap = {};
    for (const [k, v] of Object.entries(rawData.progress)) {
      const entry: ProgressEntry = {
        user: v.user,
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
      progress[k] = {
        user: v.user,
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
