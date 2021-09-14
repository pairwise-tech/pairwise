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
   * TODO: Create shared type information for possible socket events.
   */
  public broadcastMessage(message: any) {
    this.server.send(message);
  }

  /**
   * Example handler for Socket messages defined as "event".
   */
  @SubscribeMessage("event")
  async handleEvent(@MessageBody() data: any): Promise<WsResponse<any>> {
    return data;
  }
}
