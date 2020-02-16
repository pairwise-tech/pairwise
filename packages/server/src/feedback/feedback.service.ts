import { Injectable, Inject } from "@nestjs/common";
import { IFeedbackDto } from "@pairwise/common";
import { Feedback } from "./feedback.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RequestUser } from "src/types";
import { SUCCESS_CODES } from "src/tools/constants";
import { validateFeedbackDto } from "src/tools/validation";
import { SlackService } from "src/slack/slack.service";

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepository: Repository<Feedback>,

    private readonly slackService: SlackService,
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

    /* Post feedback to Slack feedback channel */
    const message = this.slackService.formatFeedbackMessageUtil(feedback, user);
    this.slackService.postMessageToChannel("feedback", message);

    return SUCCESS_CODES.OK;
  }
}
