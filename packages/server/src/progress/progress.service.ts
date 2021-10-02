import shortid from "shortid";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Progress } from "./progress.entity";
import { ProgressDto } from "./progress.dto";
import {
  RecentProgressRecord,
  RecentProgressAdminDto,
  ChallengeStatus,
  UserCourseStatus,
  UserCourseProgress,
  IProgressDto,
  ContentUtility,
  RecentProgressPublicStats,
} from "@pairwise/common";
import { SUCCESS_CODES } from "../tools/constants";
import { RequestUser } from "../types";
import {
  validateAndSanitizeProgressItem,
  validateChallengeProgressDto,
} from "../tools/validation-utils";
import { captureSentryException } from "../tools/sentry-utils";
import { ChallengeMetaService } from "../challenge-meta/challenge-meta.service";
import { RedisClientService } from "../redis/redis.service";
import { User } from "../user/user.entity";

type ProgressRecordUser = "Anonymous User" | "Pairwise User";

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(Progress)
    private readonly progressRepository: Repository<Progress>,

    private readonly challengeMetaService: ChallengeMetaService,

    private readonly redisClientService: RedisClientService,
  ) {}

  public async fetchProgressHistoryForCourse(courseId: string) {
    return this.progressRepository.findOne({ courseId });
  }

  public async adminFetchAllUserProgress(courseId: string) {
    const result = await this.progressRepository
      .createQueryBuilder("progress")
      .select("progress.progress")
      .where({ courseId })
      .getMany();

    let max = -1;
    const progressDateSeries = {};

    const progressMap = result.reduce((map, entry) => {
      const { progress } = entry;

      // Summarize challenge progress history for all users
      const progressData: UserCourseStatus = JSON.parse(progress);
      for (const x of Object.values(progressData)) {
        const key = new Date(x.timeCompleted).toDateString();
        const value = (progressDateSeries[key] || 0) + 1;
        progressDateSeries[key] = value;
      }

      const completedCount = Object.keys(progressData).length;
      max = Math.max(completedCount, max);
      const key = String(completedCount);
      const existing = key in map ? map[key] : 0;
      return {
        ...map,
        [key]: existing + 1,
      };
    }, {} as { [key: string]: number });

    let data = [];
    for (const [key, value] of Object.entries(progressMap)) {
      data.push({
        userCount: value,
        progressCount: Number(key),
      });
    }

    let completedCount = 0;
    const normalizedResultsData = [];

    // Normalize data set to fill in all x-axis values
    while (completedCount <= max) {
      const key = String(completedCount);
      if (key in progressMap) {
        const userCount = progressMap[key];
        normalizedResultsData.push({
          userCount,
          progressCount: completedCount,
        });
      } else {
        normalizedResultsData.push({
          userCount: 0,
          progressCount: completedCount,
        });
      }

      completedCount = completedCount + 1;
    }

    const sortedProgress = normalizedResultsData.sort((a, b) => {
      return a.userCount - b.userCount;
    });

    return {
      userProgressDistribution: sortedProgress,
      globalChallengeProgressSeries: progressDateSeries,
    };
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

    // Record challenge attempt in challenge meta
    if (!complete) {
      this.challengeMetaService.incrementChallengeAttemptedCount(challengeId);
    }

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
    this.addToProgressRecord(
      user.profile.uuid,
      "Pairwise User",
      challengeProgressDto,
    );

    return result;
  }

  public async updateUserProgressHistoryAnonymous(
    uuid: string,
    challengeProgressDto: ProgressDto,
  ): Promise<string> {
    validateChallengeProgressDto(challengeProgressDto);

    // Record challenge meta counts for anonymous users too
    const { complete, challengeId } = challengeProgressDto;
    if (complete) {
      this.challengeMetaService.incrementChallengeCompletionCount(challengeId);
    } else {
      this.challengeMetaService.incrementChallengeAttemptedCount(challengeId);
    }

    // Track user progress record
    this.addToProgressRecord(uuid, "Anonymous User", challengeProgressDto);

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

  public async addToProgressRecord(
    uuid: string,
    user: ProgressRecordUser,
    progressDto: ProgressDto,
  ) {
    const { challengeId } = progressDto;

    if (!challengeId || !uuid) {
      return;
    } else if (!ContentUtility.challengeIdIsValid(challengeId)) {
      captureSentryException(
        `Invalid challenge ID received in addToProgressRecord: ${challengeId}`,
      );
      return;
    }

    const cachedData = await this.redisClientService.getProgressCacheData();

    if (cachedData.value) {
      const data = cachedData.value;

      let id;
      if (data.uuidMap.has(uuid)) {
        id = data.uuidMap.get(uuid);
      } else {
        // Generate id for Anonymous users
        id = user === "Pairwise User" ? uuid : shortid();
        data.uuidMap.set(uuid, id);
      }

      if (id in data.progress) {
        const record = data.progress[id];
        if (!record.challengeIds.has(challengeId)) {
          data.challenges++;
          record.challengeIds.add(challengeId);
        }

        // Updated last updated time
        data.progress[id] = {
          ...record,
          lastUpdated: Date.now(),
        };
      } else {
        data.challenges++;
        data.progress[id] = {
          lastUpdated: Date.now(),
          challengeIds: new Set([challengeId]),
          user: user === "Anonymous User" ? `${user} - ${id}` : id,
        };
      }

      // Update the cache data
      this.redisClientService.setProgressCacheData(data, progressDto);
    }
  }

  public async fetchRecentProgressRecordsForWorkspace() {
    const records = await this.fetchRecentProgressRecords();
    const { totalUsersCount, completedChallengesCount } = records.stats;

    const stats: RecentProgressPublicStats = {
      totalUsersCount,
      completedChallengesCount,
    };

    return stats;
  }

  public async fetchRecentProgressRecords() {
    const cachedData = await this.redisClientService.getProgressCacheData();

    if (cachedData.value) {
      const data = cachedData.value;
      const records = data.progress;

      if (data.uuidMap.size === 0) {
        // Default empty result
        return {
          stats: {
            moreThanThreeCount: 0,
            registeredUserCount: 0,
            totalUsersCount: 0,
            completedChallengesCount: 0,
          },
          records: [],
          statusMessage: "No records yet...",
        };
      }

      let count = 0;
      let moreThanThreeCount = 0;
      let moreThanThreeTotalChallenges = 0;
      let registeredUserCount = 0;

      const progressRecords: RecentProgressRecord[] = Object.values(
        records,
      ).map((entry) => {
        if (!entry.user.includes("Anonymous")) {
          registeredUserCount++;
        }

        if (entry.challengeIds.size >= 3) {
          moreThanThreeCount++;
          moreThanThreeTotalChallenges += entry.challengeIds.size;
        }

        const challenges = Array.from(entry.challengeIds)
          .map((id) => {
            count++;

            // Add the challenge title for context
            const challengeContext =
              ContentUtility.deriveChallengeContextFromId(id);
            if (challengeContext) {
              const { challenge } = challengeContext;
              return `${id} - ${challenge.title}`;
            } else {
              // This shouldn't happen...?
              captureSentryException(
                `Received null challenge context: ${JSON.stringify(
                  challengeContext,
                )}, challenge id: ${id}`,
              );
              return null;
            }
          })
          .filter(Boolean);

        return {
          challenges,
          user: entry.user,
        };
      });

      const usersCount = Object.keys(records).length;

      // Health ratio is the percent of all challenges comprised by users
      // completing more than three challenges, i.e. a proxy for stickier
      // user traction.
      const healthRatio = (moreThanThreeTotalChallenges / count) * 100;

      const stats = {
        healthRatio,
        moreThanThreeCount,
        registeredUserCount,
        totalUsersCount: usersCount,
        completedChallengesCount: count,
        moreThanThreeTotalChallenges,
      };

      const statusMessage = `${count} challenges updated in the last 24 hours by ${usersCount} users. ${moreThanThreeCount} records include 3 or more challenges (for a total of ${moreThanThreeTotalChallenges} challenges). ${registeredUserCount} are registered users.`;

      const result: RecentProgressAdminDto = {
        stats,
        statusMessage,
        records: progressRecords,
      };

      return result;
    }
  }
}
