import { Module } from "@nestjs/common";
import { WebSocketsGatewayService } from "./websockets.service";

@Module({
  providers: [WebSocketsGatewayService],
  exports: [WebSocketsGatewayService],
})
export class WebSocketsModule {}
