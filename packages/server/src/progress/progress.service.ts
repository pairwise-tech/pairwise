import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserCourseProgress } from "./userCourseProgress.entity";
import {
  UserCourseProgressDto,
  IUserCourseProgressDto,
} from "./userCourseProgress.dto";
import { UserCodeBlobDto } from "./userCodeBlob.dto";
import { UserService } from "src/user/user.service";
import { challengeUtilityClass } from "@prototype/common";

@Injectable()
export class ProgressService {
  constructor(
    private readonly userService: UserService,

    @InjectRepository(UserCourseProgress)
    private readonly userProgressRepository: Repository<UserCourseProgress>,
  ) {}

  async updateUserProgressHistory(challengeProgressDto: UserCourseProgressDto) {
    console.log("Service handling update challenge code:");
    const { courseId, challengeId, passed } = challengeProgressDto;

    /**
     * Validate the input request:
     */
    if (!challengeUtilityClass.courseIdIsValid(courseId)) {
      throw new BadRequestException("The courseId is invalid");
    } else if (
      !challengeUtilityClass.challengeIdInCourseIsValid(courseId, challengeId)
    ) {
      throw new BadRequestException("The challengeId is invalid");
    }

    console.log(
      `Updating challengeProgress for courseId: ${courseId}, challengeId: ${challengeId}`,
    );

    const status = {
      [challengeId]: {
        passed,
      },
    };

    const existingEntry = await this.userProgressRepository.findOne({
      courseId,
    });

    /* TODO: Replace with request user: */
    const user = await this.userService.findUserByEmail(
      "sean.smith.2009@gmail.com",
    );

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

  async updateUserCodeHistory(updateUserCodeHistory: UserCodeBlobDto) {
    console.log("Updating user code history:");
    console.log(updateUserCodeHistory);
  }
}
