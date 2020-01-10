import { Injectable, BadRequestException } from "@nestjs/common";
import {
  IFeedbackDto,
  feedbackTypeSet,
  challengeUtilityClass,
} from "@pairwise/common";
import { Feedback } from "./feedback.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RequestUser } from "src/types";
import { SUCCESS_CODES, ERROR_CODES } from "src/tools/constants";

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepository: Repository<Feedback>,
  ) {}

  async getFeedbackForChallenge(challengeId: string) {
    return this.feedbackRepository.find({
      where: {
        challengeId,
      },
    });
  }

  async getFeedbackForUser(userId: string) {
    return this.feedbackRepository.find({
      where: {
        user: userId,
      },
    });
  }

  async recordUserFeedback(user: RequestUser, feedbackDto: IFeedbackDto) {
    if (!challengeUtilityClass.challengeIdIsValid(feedbackDto.challengeId)) {
      throw new BadRequestException(ERROR_CODES.INVALID_CHALLENGE_ID);
    } else if (!feedbackTypeSet.has(feedbackDto.type)) {
      throw new BadRequestException(ERROR_CODES.INVALID_FEEDBACK_TYPE);
    }

    const feedback = {
      ...feedbackDto,
      user: user.profile,
    };

    await this.feedbackRepository.insert(feedback);

    return SUCCESS_CODES.OK;
  }
}
