import { Injectable } from "@nestjs/common";
import { IFeedbackDto } from "@pairwise/common";
import { Feedback } from "./feedback.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RequestUser } from "src/types";
import { SUCCESS_CODES } from "src/tools/constants";
import { validateFeedbackDto } from "src/tools/validation";
import { SlackService } from "src/tools/slack";

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

    const feedback = {
      ...feedbackDto,
      user: user ? user.profile : null,
    };

    await this.feedbackRepository.insert(feedback);

    let message: string;
    if (feedback.user) {
      message = `Feedback for challenge \`${feedback.challengeId}\` of type \`${feedback.type}\` submitted by **${feedback.user.displayName}** (${feedback.user.email}):\n> ${feedback.feedback}`;
    } else {
      message = `Feedback for challenge \`${feedback.challengeId}\` of type \`${feedback.type}\` was submitted by an unauthenticated user:\n> ${feedback.feedback}`;
    }
    await new SlackService().postMessageToChannel("feedback", message);
    return SUCCESS_CODES.OK;
  }
}
