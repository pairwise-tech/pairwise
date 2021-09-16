import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ContentUtility } from "@pairwise/common";
import { ChallengeMeta } from "./challenge-meta.entity";
import { ERROR_CODES } from "../tools/constants";

@Injectable()
export class ChallengeMetaService {
  constructor(
    @InjectRepository(ChallengeMeta)
    private readonly challengeMetaRepository: Repository<ChallengeMeta>,
  ) {}

  private async lookupChallengeMeta(challengeId: string) {
    if (!ContentUtility.challengeIdIsValid(challengeId)) {
      throw new BadRequestException(ERROR_CODES.INVALID_PARAMETERS);
    }

    return this.challengeMetaRepository.findOne({
      challengeId,
    });
  }

  public async fetchChallengeMeta(challengeId: string) {
    const emptyMeta = {
      challengeId,
      numberOfTimesCompleted: 0,
    };

    const result = await this.lookupChallengeMeta(challengeId);
    if (result) {
      return result;
    } else {
      return emptyMeta;
    }
  }

  public async incrementChallengeAttemptedCount(challengeId: string) {
    const result = await this.lookupChallengeMeta(challengeId);

    if (!result) {
      const meta = {
        challengeId,
        numberOfTimesAttempted: 1,
      };
      await this.challengeMetaRepository.insert(meta);
    } else {
      const count = result.numberOfTimesAttempted + 1;

      await this.challengeMetaRepository
        .createQueryBuilder("challengeMeta")
        .update(ChallengeMeta)
        .where({ uuid: result.uuid })
        .set({ numberOfTimesAttempted: count })
        .execute();
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
