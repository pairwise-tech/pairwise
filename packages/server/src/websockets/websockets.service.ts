import {
  CacheUpdateMessage,
  ConnectedUsersUpdateEvent,
  RealTimeUpdateEvent,
  SocketServerEventTypes,
  SocketServerEvents,
  SocketClientEventTypes,
} from "@pairwise/common";
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from "@nestjs/websockets";
import { Server } from "socket.io";

/**
 * NestJS websocket gateway.
 *
 * https://docs.nestjs.com/websockets/gateways
 */
@WebSocketGateway()
export class WebSocketsGatewayService {
  @WebSocketServer()
  server: Server;

  public disconnectServer() {
    this.server.close();
  }

  /**
   * Get all connected clients. This includes connected admins.
   *
   * NOTE: Workspace clients only connect on the /leaderboard route currently.
   * This does not represent all current users.
   */
  public async getConnectedClientCount() {
    const allSocketsSet = await this.server.allSockets();
    return allSocketsSet.size;
  }

  /**
   * Handling broadcasting event.
   */
  private broadcastMessage(event: SocketServerEvents) {
    this.server.send(event);
  }

  /**
   * Broadcast connected clients update.
   */
  public async broadcastConnectedClientsUpdate() {
    const clients = await this.getConnectedClientCount();
    const event: ConnectedUsersUpdateEvent = {
      type: SocketServerEventTypes.CONNECTED_USER_COUNT_UPDATE,
      payload: {
        connectedClients: clients,
      },
    };

    this.broadcastMessage(event);
  }

  /**
   * Broadcast realtime update.
   */
  public broadcastRealTimeUpdate(update: CacheUpdateMessage) {
    const event: RealTimeUpdateEvent = {
      type: SocketServerEventTypes.REAL_TIME_CHALLENGE_UPDATE,
      payload: update,
    };
    this.broadcastMessage(event);
  }

  /**
   * Broadcast new client connection update to all clients.
   */
  @SubscribeMessage(SocketClientEventTypes.WORKSPACE_CLIENT_CONNECTED)
  public async handleClientConnectionEvent(): Promise<void> {
    await this.broadcastConnectedClientsUpdate();
  }

  /**
   * Example handler for Socket messages defined as "event".
   */
  @SubscribeMessage("event")
  public async handleEvent(@MessageBody() data: any): Promise<WsResponse<any>> {
    return data;
  }
}
