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
        return result.numberOfTimesCompleted;
      } else {
        return 0;
      }
    } catch (err) {
      return 0;
    }
  }

  public async incrementChallengeCompletionCount(challengeId: string) {
    const result = await this.challengeMetaRepository.findOne({
      challengeId,
    });

    const count = !!result ? result.numberOfTimesCompleted : 0;

    await this.challengeMetaRepository
      .createQueryBuilder("challengeMeta")
      .update(ChallengeMeta)
      .where({ uuid: result.uuid })
      .set({ numberOfTimesCompleted: count })
      .execute();
  }
}
