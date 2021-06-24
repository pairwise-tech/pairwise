import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChallengeMetaController } from "./challenge-meta.controller";
import { ChallengeMeta } from "./challenge-meta.entity";
import { ChallengeMetaService } from "./challenge-meta.service";

@Module({
  imports: [TypeOrmModule.forFeature([ChallengeMeta])],
  controllers: [ChallengeMetaController],
  providers: [ChallengeMetaService],
})
export class ChallengeMetaModule {}
