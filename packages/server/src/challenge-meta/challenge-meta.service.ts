import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ChallengeMeta, ContentUtility } from "@pairwise/common";
import { ChallengeMeta as ChallengeMetaEntity } from "./challenge-meta.entity";
import { ERROR_CODES } from "../tools/constants";

@Injectable()
export class ChallengeMetaService {
  constructor(
    @InjectRepository(ChallengeMetaEntity)
    private readonly challengeMetaRepository: Repository<ChallengeMetaEntity>,
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
    const emptyMeta: ChallengeMeta = {
      challengeId,
      numberOfTimesAttempted: 0,
      numberOfTimesCompleted: 0,
    };

    const result = await this.lookupChallengeMeta(challengeId);
    if (result) {
      return result;
    } else {
      return emptyMeta;
    }
  }

  /**
   * Resets attempted and completed counts to 0 for a challenge meta.
   */
  public async resetChallengeMeta(challengeId: string) {
    await this.challengeMetaRepository
      .createQueryBuilder("challengeMeta")
      .update(ChallengeMetaEntity)
      .where({ challengeId })
      .set({ numberOfTimesAttempted: 0, numberOfTimesCompleted: 0 })
      .execute();

    return this.lookupChallengeMeta(challengeId);
  }

  /**
   * Return all existing challenge meta entries.
   */
  public async fetchAllChallengeMeta() {
    return this.challengeMetaRepository.find();
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
        .update(ChallengeMetaEntity)
        .where({ uuid: result.uuid })
        .set({ numberOfTimesAttempted: count })
        .execute();
    }
  }

  /**
   * Completions count as attempts. Upon completion, the attempted and
   * completed counts are both incremented.
   */
  public async incrementChallengeCompletionCount(challengeId: string) {
    const result = await this.lookupChallengeMeta(challengeId);

    if (!result) {
      const meta = {
        challengeId,
        numberOfTimesAttempted: 1,
        numberOfTimesCompleted: 1,
      };
      await this.challengeMetaRepository.insert(meta);
    } else {
      const attempted = result.numberOfTimesAttempted + 1;
      const completed = result.numberOfTimesCompleted + 1;

      await this.challengeMetaRepository
        .createQueryBuilder("challengeMeta")
        .update(ChallengeMetaEntity)
        .where({ uuid: result.uuid })
        .set({
          numberOfTimesAttempted: attempted,
          numberOfTimesCompleted: completed,
        })
        .execute();
    }
  }
}
