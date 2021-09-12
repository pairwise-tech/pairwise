import { Module } from "@nestjs/common";
import { RedisClientService } from "./redis.service";

@Module({
  providers: [RedisClientService],
  exports: [RedisClientService],
})
export class RedisServiceModule {}
