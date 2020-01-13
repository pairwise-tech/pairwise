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
import { ERROR_CODES } from "src/tools/constants";
import { RequestUser } from "src/types";
import { UserService } from "src/user/user.service";

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(Progress)
    private readonly userProgressRepository: Repository<Progress>,
  ) {}

  async fetchProgressHistoryForCourse(courseId: string) {
    return this.userProgressRepository.find({ courseId });
  }

  async fetchUserProgress(user: RequestUser) {
    const result = await this.userProgressRepository.find({
      where: {
        user: user.profile.uuid,
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

    const existingEntry = await this.userProgressRepository.findOne({
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
      await this.userProgressRepository.insert(newProgressEntry);
    } else {
      const updatedCourseProgress: UserCourseStatus = {
        ...JSON.parse(existingEntry.progress),
        ...status,
      };

      /**
       * Update:
       */
      await this.userProgressRepository
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
    for (const entity of courseProgress) {
      const { courseId, progress } = entity;
      console.log(
        `[BULK]: Persisting user course progress for courseId: ${courseId}`,
      );
      const newProgressEntry: Partial<Progress> = {
        user: user.profile,
        courseId,
        progress: JSON.stringify(progress),
      };
      await this.userProgressRepository.insert(newProgressEntry);
    }
  }
}
