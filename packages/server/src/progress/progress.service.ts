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
import { SUCCESS_CODES } from "../tools/constants";
import { RequestUser } from "../types";
import {
  validateAndSanitizeProgressItem,
  validateChallengeProgressDto,
} from "../tools/validation";
import { captureSentryException } from "../tools/sentry-utils";
import { STATUS_CODES } from "http";

@Injectable()
export class ProgressService {
  // Real-time user challenge progress tracking:
  time: number;
  challenges = 0;
  progress: { [uuid: string]: { challengeIds: Set<string> } } = {};

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

      console.log(
        "No progress entity exists, creating and inserting a new one!",
      );
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

    // Track user progress record
    this.addToProgressRecord(user.profile.uuid, challengeId);

    return result;
  }

  public async updateUserProgressHistoryAnonymous(
    uuid: string,
    challengeProgressDto: ProgressDto,
  ): Promise<string> {
    validateChallengeProgressDto(challengeProgressDto);
    const { challengeId } = challengeProgressDto;

    // Track user progress record
    this.addToProgressRecord(uuid, challengeId);

    return STATUS_CODES.OK;
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
          `Persisting user course progress for courseId: ${courseId}`,
        );

        const newProgressEntry: Partial<Progress> = {
          user: user.profile,
          courseId,
          progress: JSON.stringify(progress),
        };
        await this.progressRepository.insert(newProgressEntry);
      } catch (err) {
        captureSentryException(err);
      }
    }

    return SUCCESS_CODES.OK;
  }

  addToProgressRecord = (uuid: string, challengeId: string) => {
    if (!challengeId || !uuid) {
      return;
    }

    if (!this.time) {
      this.time = Date.now();
    }

    const records = this.progress;
    if (uuid in records) {
      const record = records[uuid];
      if (!record.challengeIds.has(challengeId)) {
        this.challenges++;
        record.challengeIds.add(challengeId);
      }
    } else {
      this.challenges++;
      records[uuid] = {
        challengeIds: new Set([challengeId]),
      };
    }
  };

  /**
   * TODO: Anonymize user uuids to random names.
   */
  public async retrieveProgressRecords() {
    const records = this.progress;

    if (!this.time) {
      return "No records yet...";
    }

    const now = Date.now();

    const since = (time: number) => {
      const seconds = (now - new Date(time).getTime()) / 1000;
      return seconds;
    };

    const data = Object.values(records).map(x => Array.from(x.challengeIds));
    const last = since(this.time);
    const status = `${this.challenges} challenges updated in the last ${last} seconds.`;

    return {
      status,
      records: data,
    };
  }
}
