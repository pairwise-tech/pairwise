import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Progress } from "./progress.entity";
import { ProgressDto } from "./progress.dto";
import {
  ChallengeStatus,
  UserCourseStatus,
  UserCourseProgress,
  IProgressDto,
} from "@pairwise/common";
import { SUCCESS_CODES } from "src/tools/constants";
import { RequestUser } from "src/types";
import {
  validateAndSanitizeProgressItem,
  validateChallengeProgressDto,
} from "src/tools/validation";
import { captureSentryException } from "src/tools/sentry-utils";

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(Progress)
    private readonly progressRepository: Repository<Progress>,
  ) {}

  public async fetchProgressHistoryForCourse(courseId: string) {
    return this.progressRepository.findOne({ courseId });
  }

  public async fetchUserProgress(uuid: string) {
    const result = await this.progressRepository.find({
      where: {
        user: uuid,
      },
    });

    return result;
  }

  public async updateUserProgressHistory(
    requestUser: RequestUser,
    challengeProgressDto: ProgressDto,
  ): Promise<IProgressDto> {
    validateChallengeProgressDto(challengeProgressDto);

    const {
      courseId,
      challengeId,
      complete,
      timeCompleted,
    } = challengeProgressDto;
    const user = requestUser;

    console.log(
      `Updating challengeProgress for courseId: ${courseId}, challengeId: ${challengeId}`,
    );

    const existingEntry = await this.progressRepository.findOne({
      courseId,
      user: user.profile,
    });

    if (existingEntry === undefined) {
      const statusObject: ChallengeStatus = {
        complete,
        timeCompleted,
      };

      const status: UserCourseStatus = {
        [challengeId]: statusObject,
      };

      console.log("No entity exists, creating and inserting a new one!");
      const newProgressEntry: Partial<Progress> = {
        user: user.profile,
        courseId,
        progress: JSON.stringify(status),
      };

      /**
       * Insert:
       */
      await this.progressRepository.insert(newProgressEntry);
    } else {
      const existingProgress: UserCourseStatus = JSON.parse(
        existingEntry.progress,
      );
      const existingStatus = existingProgress[challengeId];

      // Preserve the original time completed, if a second request is
      // received for a challenge progress update
      let timestamp = timeCompleted;
      if (existingStatus) {
        timestamp = existingStatus.timeCompleted;
      }

      const statusObject: ChallengeStatus = {
        complete,
        timeCompleted: timestamp,
      };

      const status = {
        [challengeId]: statusObject,
      };

      const updatedCourseProgress: UserCourseStatus = {
        ...existingProgress,
        ...status,
      };

      /**
       * Update:
       */
      await this.progressRepository
        .createQueryBuilder("userCourseProgress")
        .update(Progress)
        .where({ uuid: existingEntry.uuid })
        .set({ progress: JSON.stringify(updatedCourseProgress) })
        .execute();
    }

    // Return the progress dto
    const result: IProgressDto = {
      courseId,
      challengeId,
      complete,
      timeCompleted,
    };
    return result;
  }

  public async persistUserCourseProgress(
    courseProgress: UserCourseProgress,
    user: RequestUser,
  ) {
    for (const entity of courseProgress) {
      try {
        /**
         * If the entity is totally mal-formed, this validation method will
         * throw and this entry will be skipped. Otherwise, it will check
         * and sanitize all the challenge status entries, excluding any
         * mal-formed ones.
         */
        const sanitizedEntity = validateAndSanitizeProgressItem(entity);
        const { courseId, progress } = sanitizedEntity;

        console.log(
          `[BULK]: Persisting user course progress for courseId: ${courseId}`,
        );

        const newProgressEntry: Partial<Progress> = {
          user: user.profile,
          courseId,
          progress: JSON.stringify(progress),
        };
        await this.progressRepository.insert(newProgressEntry);
      } catch (err) {
        captureSentryException(err);
        console.log(
          "[BULK ERROR]: Error occurring processing one of the user course progress insertions",
          err,
        );
      }
    }

    return SUCCESS_CODES.OK;
  }
}
