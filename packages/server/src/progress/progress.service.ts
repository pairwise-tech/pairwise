import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/user/user.entity";
import { Repository } from "typeorm";
import { UserCourseProgress } from "./userCourseProgress.entity";
import {
  UserCourseProgressDto,
  IUserCourseProgressDto,
} from "./userCourseProgress.dto";
import { UserCodeBlobDto } from "./userCodeBlob.dto";

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(UserCourseProgress)
    private readonly userProgressRepository: Repository<UserCourseProgress>,
  ) {}

  async updateChallengeCode(challengeProgressDto: UserCourseProgressDto) {
    console.log("Service handling update challenge code:");

    const { courseId, challengeId, passed } = challengeProgressDto;

    console.log(
      `Updating challengeProgress for courseId: ${courseId}, challengeId: ${challengeId}`,
    );

    const status: IUserCourseProgressDto = {
      passed,
      challengeId,
    };

    const existingProgress = await this.userProgressRepository.findOne({
      courseId,
    });
  }

  async updateUserCodeHistory(updateUserCodeHistory: UserCodeBlobDto) {
    console.log("Updating user code history:");
    console.log(updateUserCodeHistory);
  }
}
