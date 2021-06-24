import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ChallengeMeta } from "./challenge-meta.entity";

@Injectable()
export class ChallengeMetaService {
  constructor(
    @InjectRepository(ChallengeMeta)
    private readonly challengeMetaRepository: Repository<ChallengeMeta>,
  ) {}

  private async lookupChallengeMeta(challengeId: string) {
    return this.challengeMetaRepository.findOne({
      challengeId,
    });
  }

  public async fetchChallengeMeta(challengeId: string) {
    const emptyMeta = {
      challengeId,
      numberOfTimesCompleted: 0,
    };

    try {
      const result = await this.lookupChallengeMeta(challengeId);
      if (result) {
        return result;
      } else {
        return emptyMeta;
      }
    } catch (err) {
      return emptyMeta;
    }
  }

  public async incrementChallengeCompletionCount(challengeId: string) {
    const result = await this.lookupChallengeMeta(challengeId);

    if (!result) {
      const meta = {
        challengeId,
        numberOfTimesCompleted: 1,
      };
      await this.challengeMetaRepository.insert(meta);
    } else {
      const count = result.numberOfTimesCompleted + 1;

      await this.challengeMetaRepository
        .createQueryBuilder("challengeMeta")
        .update(ChallengeMeta)
        .where({ uuid: result.uuid })
        .set({ numberOfTimesCompleted: count })
        .execute();
    }
  }
}
