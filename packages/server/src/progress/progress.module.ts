import { Module } from "@nestjs/common";
import { ProgressController } from "./progress.controller";
import { ProgressService } from "./progress.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Progress } from "./progress.entity";
import { ChallengeMetaModule } from "../challenge-meta/challenge-meta.module";
import { RedisServiceModule } from "../redis/redis.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Progress]),
    ChallengeMetaModule,
    RedisServiceModule,
  ],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
