import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Progress } from "./progress.entity";
import { ProgressDto } from "./progress.dto";
import {
  challengeUtilityClass,
  ChallengeStatus,
  UserCourseStatus,
  UserCourseProgress,
} from "@pairwise/common";
import { ERROR_CODES, SUCCESS_CODES } from "src/tools/constants";
import { RequestUser } from "src/types";

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(Progress)
    private readonly progressRepository: Repository<Progress>,
  ) {}

  async fetchProgressHistoryForCourse(courseId: string) {
    return this.progressRepository.find({ courseId });
  }

  async fetchUserProgress(uuid: string) {
    const result = await this.progressRepository.find({
      where: {
        user: uuid,
      },
    });

    return result;
  }

  async updateUserProgressHistory(
    requestUser: RequestUser,
    challengeProgressDto: ProgressDto,
  ) {
    console.log("Service handling update challenge code:");
    const { courseId, challengeId, complete } = challengeProgressDto;
    const user = requestUser;

    /**
     * Validate the input request:
     */
    if (!challengeUtilityClass.courseIdIsValid(courseId)) {
      throw new BadRequestException(ERROR_CODES.INVALID_COURSE_ID);
    } else if (
      !challengeUtilityClass.challengeIdInCourseIsValid(courseId, challengeId)
    ) {
      throw new BadRequestException(ERROR_CODES.INVALID_CHALLENGE_ID);
    } else if (!user) {
      throw new BadRequestException(ERROR_CODES.MISSING_USER);
    }

    console.log(
      `Updating challengeProgress for courseId: ${courseId}, challengeId: ${challengeId}`,
    );

    const statusObject: ChallengeStatus = {
      complete,
    };

    const status = {
      [challengeId]: statusObject,
    };

    const existingEntry = await this.progressRepository.findOne({
      courseId,
      user: user.profile,
    });

    if (existingEntry === undefined) {
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
      const updatedCourseProgress: UserCourseStatus = {
        ...JSON.parse(existingEntry.progress),
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

    return this.fetchProgressHistoryForCourse(courseId);
  }

  async persistUserCourseProgress(
    courseProgress: UserCourseProgress,
    user: RequestUser,
  ) {
    /**
     * TODO: Validation!
     */
    for (const entity of courseProgress) {
      try {
        const { courseId, progress } = entity;
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
        console.log(
          "[BULK ERROR]: Error occurring processing one of the user course progress insertions",
          err,
        );
      }
    }

    return SUCCESS_CODES.OK;
  }
}
