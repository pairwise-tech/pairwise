import { Module } from "@nestjs/common";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { AppService } from "./app.service";
import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./user/user.module";
import { ContentModule } from "./content/content.module";
import { ProgressModule } from "./progress/progress.module";
import { PaymentsModule } from "./payments/payments.module";
import { AdminModule } from "./admin/admin.module";
import { FeedbackModule } from "./feedback/feedback.module";
import { BlobModule } from "./blob/blob.module";
import ENV from "./tools/server-env";
import { RedisModule, RedisModuleOptions } from "nestjs-redis";
import { ChallengeMetaModule } from "./challenge-meta/challenge-meta.module";
import { RedisServiceModule } from "./redis/redis.module";
import { REDIS_CLIENT_CONFIG } from "./redis/redis.service";
import { WebSocketsModule } from "./websockets/websockets.module";

/**
 * NOTE: The TypeORM options are ALL supplied here. You cannot mix and match
 * options, i.e. specify some options here and provide others via environment
 * variables. Everything must go into this config object.
 */
const typeormOptions: TypeOrmModuleOptions = {
  type: "postgres",
  host: ENV.TYPEORM_HOST,
  port: ENV.TYPEORM_PORT,
  username: ENV.TYPEORM_USERNAME,
  password: ENV.TYPEORM_PASSWORD,
  database: ENV.TYPEORM_DATABASE,
  autoLoadEntities: true,
};

/**
 * Configure Redis client.
 */
const redisClientOptions: RedisModuleOptions = {
  name: ENV.REDIS_NAME,
  port: ENV.REDIS_PORT,
  host: ENV.REDIS_HOST,
  password: ENV.REDIS_PASSWORD,
};

/**
 * Multiple clients are required because clients cannot share
 * capabilities when using pub/sub.
 */
const redisMultiClientOptions: RedisModuleOptions[] = [
  {
    ...redisClientOptions,
    name: REDIS_CLIENT_CONFIG.CLIENT,
  },
  {
    ...redisClientOptions,
    name: REDIS_CLIENT_CONFIG.PUBLISHER,
  },
  {
    ...redisClientOptions,
    name: REDIS_CLIENT_CONFIG.SUBSCRIBER,
  },
];

@Module({
  imports: [
    TypeOrmModule.forRoot(typeormOptions),
    RedisModule.register(redisMultiClientOptions),
    RedisServiceModule,
    WebSocketsModule,
    AuthModule,
    BlobModule,
    UsersModule,
    AdminModule,
    ContentModule,
    ProgressModule,
    PaymentsModule,
    FeedbackModule,
    ChallengeMetaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
