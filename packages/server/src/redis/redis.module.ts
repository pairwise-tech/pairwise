import { Module } from "@nestjs/common";
import { WebSocketsModule } from "../websockets/websockets.module";
import { RedisClientService } from "./redis.service";

@Module({
  imports: [WebSocketsModule],
  providers: [RedisClientService],
  exports: [RedisClientService],
})
export class RedisServiceModule {}
