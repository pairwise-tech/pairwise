import { Module } from "@nestjs/common";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
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

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(typeormOptions),
    RedisModule.register(redisClientOptions),
    RedisServiceModule,
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
