import {
  CacheUpdateMessage,
  RealTimeUpdateEvent,
  SocketEvents,
  SocketEventTypes,
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
   * Handling broadcasting event.
   */
  private broadcastMessage(event: SocketEvents) {
    this.server.send(event);
  }

  /**
   * Broadcast realtime update.
   */
  public broadcastRealTimeUpdate(update: CacheUpdateMessage) {
    const event: RealTimeUpdateEvent = {
      type: SocketEventTypes.REAL_TIME_CHALLENGE_UPDATE,
      payload: update,
    };
    this.broadcastMessage(event);
  }

  /**
   * Example handler for Socket messages defined as "event".
   */
  @SubscribeMessage("event")
  public async handleEvent(@MessageBody() data: any): Promise<WsResponse<any>> {
    return data;
  }
}
