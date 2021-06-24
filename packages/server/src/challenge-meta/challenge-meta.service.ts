import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RequestUser } from "../types";
import { ChallengeMeta } from "./challenge-meta.entity";

@Injectable()
export class ChallengeMetaService {
  constructor(
    @InjectRepository(ChallengeMeta)
    private readonly challengeMetaRepository: Repository<ChallengeMeta>,
  ) {}

  public async fetchChallengeMeta(user: RequestUser, challengeId: string) {
    try {
      const result = await this.challengeMetaRepository.findOne({
        challengeId,
      });
      if (result) {
        return result;
      } else {
        return 0;
      }
    } catch (err) {
      return 0;
    }
  }
}
