import { Injectable } from "@nestjs/common";
import { IFeedbackDto } from "@pairwise/common";
import { Feedback } from "./feedback.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RequestUser } from "src/types";
import { SUCCESS_CODES } from "src/tools/constants";
import { validateFeedbackDto } from "src/tools/validation";

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

  async saveUserFeedback(user: RequestUser, feedbackDto: IFeedbackDto) {
    /* Validate the request */
    validateFeedbackDto(feedbackDto);

    const feedback = user
      ? {
          ...feedbackDto,
          user: user.profile,
        }
      : feedbackDto;

    await this.feedbackRepository.insert(feedback);

    return SUCCESS_CODES.OK;
  }
}
