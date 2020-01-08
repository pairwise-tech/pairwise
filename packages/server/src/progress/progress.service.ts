import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserCourseProgress } from "./userCourseProgress.entity";
import { UserCourseProgressDto } from "./userCourseProgress.dto";
import {
  challengeUtilityClass,
  ChallengeStatus,
  IUserCodeBlobDto,
  UserCourseStatus,
} from "@pairwise/common";
import { UserCodeBlob } from "./userCodeBlob.entity";
import { ERROR_CODES, SUCCESS_CODES } from "src/tools/constants";
import { validateCodeBlob } from "src/tools/validation";
import { RequestUser } from "src/types";
import { UserService } from "src/user/user.service";

@Injectable()
export class ProgressService {
  constructor(
    private readonly userService: UserService,

    @InjectRepository(UserCourseProgress)
    private readonly userProgressRepository: Repository<UserCourseProgress>,

    @InjectRepository(UserCodeBlob)
    private readonly userCodeBlobRepository: Repository<UserCodeBlob>,
  ) {}

  async fetchUserProgress(user: RequestUser) {
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
      user,
    });

    if (existingEntry === undefined) {
      console.log("No entity exists, creating and inserting a new one!");
      const newProgressEntry: Partial<UserCourseProgress> = {
        user,
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
        .update(UserCourseProgress)
        .where({ uuid: existingEntry.uuid })
        .set({ progress: JSON.stringify(updatedCourseProgress) })
        .execute();
    }

    return this.fetchProgressHistoryForCourse(courseId);
  }

  async fetchProgressHistoryForCourse(courseId: string) {
    return this.userProgressRepository.find({ courseId });
  }

  async fetchUserCodeBlob(user: RequestUser, challengeId: string) {
    /* Verify the challenge id is valid */
    if (!challengeUtilityClass.challengeIdIsValid(challengeId)) {
      throw new BadRequestException(ERROR_CODES.INVALID_UPDATE_DETAILS);
    }

    /**
     * [SIDE EFFECT!]
     *
     * Update the lastActiveChallengeId on this user to be this challenge
     * which they are fetching user code history for.
     */
    await this.userService.updateLastActiveChallengeId(user, challengeId);

    const codeHistory = await this.userCodeBlobRepository.findOne({
      user,
      challengeId,
    });

    if (codeHistory) {
      /**
       * Deserialize data blog before sending back to the client.
       */
      const deserialized = {
        ...codeHistory,
        dataBlob: JSON.parse(codeHistory.dataBlob),
      };
      return deserialized;
    } else {
      throw new NotFoundException(
        "No history found for this challenge for this user.",
      );
    }
  }

  async updateUserCodeBlob(
    challengeCodeDto: IUserCodeBlobDto,
    user: RequestUser,
  ) {
    /* Validate everything in the code blob */
    validateCodeBlob(challengeCodeDto);

    const existingBlob = await this.userCodeBlobRepository.findOne({
      user,
      challengeId: challengeCodeDto.challengeId,
    });

    const blob = {
      challengeId: challengeCodeDto.challengeId,
      dataBlob: JSON.stringify(challengeCodeDto.dataBlob),
    };

    /**
     * Upsert (no typeorm method exist, ha, ha):
     */
    if (existingBlob) {
      await this.userCodeBlobRepository.update(
        {
          uuid: existingBlob.uuid,
        },
        blob,
      );
    } else {
      await this.userCodeBlobRepository.insert({
        user,
        challengeId: challengeCodeDto.challengeId,
        dataBlob: JSON.stringify(challengeCodeDto.dataBlob),
      });
    }

    return SUCCESS_CODES.OK;
  }
}
