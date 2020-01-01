import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserCourseProgressEntity } from "./userCourseProgress.entity";
import { UserCourseProgressDto } from "./userCourseProgress.dto";
import { UserCodeBlobDto } from "./userCodeBlob.dto";
import { UserService } from "src/user/user.service";
import { challengeUtilityClass } from "@prototype/common";
import { UserCodeBlobEntity } from "./userCodeBlob.entity";
import { RequestUser } from "src/types";
import { ERROR_CODES, SUCCESS_CODES } from "src/tools/constants";

@Injectable()
export class ProgressService {
  constructor(
    private readonly userService: UserService,

    @InjectRepository(UserCourseProgressEntity)
    private readonly userProgressRepository: Repository<
      UserCourseProgressEntity
    >,

    @InjectRepository(UserCodeBlobEntity)
    private readonly userCodeBlobRepository: Repository<UserCodeBlobEntity>,
  ) {}

  async fetchUserChallengeProgress(requestUser: RequestUser) {
    const user = await this.userService.findUserByEmail(requestUser.email);

    const result = await this.userProgressRepository.find({
      where: {
        user: user.uuid,
      },
    });

    return result;
  }

  async updateUserProgressHistory(
    requestUser: RequestUser,
    challengeProgressDto: UserCourseProgressDto,
  ) {
    console.log("Service handling update challenge code:");
    const { courseId, challengeId, passed } = challengeProgressDto;

    /**
     * Validate the input request:
     */
    if (!challengeUtilityClass.courseIdIsValid(courseId)) {
      throw new BadRequestException(ERROR_CODES.INVALID_COURSE_ID);
    } else if (
      !challengeUtilityClass.challengeIdInCourseIsValid(courseId, challengeId)
    ) {
      throw new BadRequestException(ERROR_CODES.INVALID_CHALLENGE_ID);
    }

    console.log(
      `Updating challengeProgress for courseId: ${courseId}, challengeId: ${challengeId}`,
    );

    const status = {
      [challengeId]: {
        passed,
      },
    };

    const user = await this.userService.findUserByEmail(requestUser.email);

    const existingEntry = await this.userProgressRepository.findOne({
      courseId,
      user,
    });

    /* TODO: Validate input data. */

    if (existingEntry === undefined) {
      console.log("No entity exists, creating and inserting a new one!");
      const newProgressEntry = {
        user,
        courseId,
        progress: JSON.stringify(status),
      };

      /**
       * Insert:
       */
      await this.userProgressRepository.insert(newProgressEntry);
    } else {
      const updatedCourseProgress = {
        ...JSON.parse(existingEntry.progress),
        ...status,
      };

      /**
       * Update:
       */
      await this.userProgressRepository
        .createQueryBuilder("userCourseProgress")
        .update(UserCourseProgressEntity)
        .where({ uuid: existingEntry.uuid })
        .set({ progress: JSON.stringify(updatedCourseProgress) })
        .execute();
    }

    return this.fetchProgressHistoryForCourse(courseId);
  }

  async fetchProgressHistoryForCourse(courseId: string) {
    return this.userProgressRepository.find({ courseId });
  }

  async updateUserCodeHistory(
    challengeCodeDto: UserCodeBlobDto,
    requestUser: RequestUser,
  ) {
    if (
      !challengeUtilityClass.challengeIdIsValid(challengeCodeDto.challengeId)
    ) {
      throw new BadRequestException(ERROR_CODES.INVALID_CHALLENGE_ID);
    }

    const user = await this.userService.findUserByEmail(requestUser.email);
    const existingBlob = await this.userCodeBlobRepository.findOne({
      user,
      challengeId: challengeCodeDto.challengeId,
    });

    /**
     * Upsert (no typeorm method exist, ha, ha):
     */
    if (existingBlob) {
      await this.userCodeBlobRepository.update(
        {
          uuid: existingBlob.uuid,
        },
        challengeCodeDto,
      );
    } else {
      await this.userCodeBlobRepository.insert({
        user,
        challengeId: challengeCodeDto.challengeId,
        dataBlob: challengeCodeDto.dataBlob,
      });
    }

    return SUCCESS_CODES.OK;
  }

  async fetchUserCodeHistory(requestUser: RequestUser, challengeId: string) {
    const user = await this.userService.findUserByEmail(requestUser.email);
    const codeHistory = await this.userCodeBlobRepository.findOne({
      user,
      challengeId,
    });

    if (codeHistory) {
      return codeHistory;
    } else {
      throw new NotFoundException(
        "No history found for this challenge for this user.",
      );
    }
  }
}
