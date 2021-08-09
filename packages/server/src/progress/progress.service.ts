import shortid from "shortid";
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
  ContentUtility,
} from "@pairwise/common";
import { SUCCESS_CODES } from "../tools/constants";
import { RequestUser } from "../types";
import {
  validateAndSanitizeProgressItem,
  validateChallengeProgressDto,
} from "../tools/validation-utils";
import { captureSentryException } from "../tools/sentry-utils";
import { ChallengeMetaService } from "../challenge-meta/challenge-meta.service";

type User = "Anonymous User" | "Pairwise User";

@Injectable()
export class ProgressService {
  // Real-time user challenge progress tracking:
  time: number;
  challenges = 0;
  uuidMap = new Map<string, string>();
  progress: { [id: string]: { user: string; challengeIds: Set<string> } } = {};

  constructor(
    @InjectRepository(Progress)
    private readonly progressRepository: Repository<Progress>,

    private readonly challengeMetaService: ChallengeMetaService,
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

    const { complete, courseId, challengeId, timeCompleted } =
      challengeProgressDto;
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

      if (complete) {
        // Increment the challenge completion count
        this.challengeMetaService.incrementChallengeCompletionCount(
          challengeId,
        );
      }

      /**
       * Insert:
       */
      await this.progressRepository.insert(newProgressEntry);
    } else {
      const existingProgress: UserCourseStatus = JSON.parse(
        existingEntry.progress,
      );
      const existingStatus = existingProgress[challengeId];

      /**
       * The challenge is either complete for the first time, if was possibly
       * incomplete before and is now complete. Figure it out and increment
       * the number of challenge completions accordingly.
       */
      const FIRST_COMPLETE = !existingStatus && complete;
      const COMPLETED_ON_RETRY =
        existingStatus && !existingStatus.complete && complete;

      if (FIRST_COMPLETE || COMPLETED_ON_RETRY) {
        this.challengeMetaService.incrementChallengeCompletionCount(
          challengeId,
        );
      }

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
    this.addToProgressRecord(user.profile.uuid, "Pairwise User", challengeId);

    return result;
  }

  public async updateUserProgressHistoryAnonymous(
    uuid: string,
    challengeProgressDto: ProgressDto,
  ): Promise<string> {
    validateChallengeProgressDto(challengeProgressDto);
    const { challengeId } = challengeProgressDto;

    // Track user progress record
    this.addToProgressRecord(uuid, "Anonymous User", challengeId);

    return SUCCESS_CODES.OK;
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

  addToProgressRecord = (uuid: string, user: User, challengeId: string) => {
    if (!challengeId || !uuid) {
      return;
    }

    if (!this.time) {
      this.time = Date.now();
    }

    const records = this.progress;

    let id;
    if (this.uuidMap.has(uuid)) {
      id = this.uuidMap.get(uuid);
    } else {
      // Generate id for Anonymous users
      id = user === "Pairwise User" ? uuid : shortid();
      this.uuidMap.set(uuid, id);
    }

    if (id in records) {
      const record = records[id];
      if (!record.challengeIds.has(challengeId)) {
        this.challenges++;
        record.challengeIds.add(challengeId);
      }
    } else {
      this.challenges++;
      records[id] = {
        challengeIds: new Set([challengeId]),
        user: user === "Anonymous User" ? `${user} - ${id}` : id,
      };
    }
  };

  public async retrieveProgressRecords() {
    const records = this.progress;

    if (!this.time) {
      return "No records yet...";
    }

    const now = Date.now();

    const hoursSince = (time: number) => {
      const hours = (now - new Date(time).getTime()) / 1000 / 60 / 60;
      return hours.toFixed(2);
    };

    let count = 0;

    const data = Object.values(records).map((x) => {
      const challenges = Array.from(x.challengeIds).map((id) => {
        count++;

        // Add the challenge title for context
        const { challenge } = ContentUtility.deriveChallengeContextFromId(id);
        return `${id} - ${challenge.title}`;
      });

      return {
        user: x.user,
        challenges,
      };
    });

    const users = Object.keys(records).length;
    const last = hoursSince(this.time);
    const status = `${count} challenges updated in the last ${last} hours by ${users} users.`;

    return {
      status,
      records: data,
    };
  }
}
