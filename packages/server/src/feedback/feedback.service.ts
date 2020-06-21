import { Injectable, BadRequestException } from "@nestjs/common";
import { IFeedbackDto, IGenericFeedback } from "@pairwise/common";
import { Feedback } from "./feedback.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RequestUser } from "src/types";
import { SUCCESS_CODES } from "src/tools/constants";
import { validateFeedbackDto } from "src/tools/validation";
import { SlackService, slackService } from "src/slack/slack.service";

@Injectable()
export class FeedbackService {
  private readonly slackService: SlackService = slackService;

  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepository: Repository<Feedback>,
  ) {}

  public async getFeedbackForChallenge(challengeId: string) {
    return this.feedbackRepository.find({
      where: {
        challengeId,
      },
    });
  }

  public async getFeedbackForUser(userId: string) {
    return this.feedbackRepository.find({
      where: {
        user: userId,
      },
    });
  }

  public async saveUserFeedback(user: RequestUser, feedbackDto: IFeedbackDto) {
    /* Validate the request */
    validateFeedbackDto(feedbackDto);

    const feedback = {
      ...feedbackDto,
      user: user ? user.profile : null,
    };

    await this.feedbackRepository.insert(feedback);

    /* Post feedback to Slack feedback channel */
    this.slackService.postFeedbackMessage({ feedbackDto, user });

    return SUCCESS_CODES.OK;
  }

  public async sendFeedbackToSlack(
    feedbackDto: IGenericFeedback,
    user?: RequestUser,
  ) {
    // Require that a message string is present
    if (!feedbackDto.message) {
      throw new BadRequestException("No message sent in feedback");
    }

    this.slackService.postGenericFeedbackMessage({ feedbackDto, user });

    return SUCCESS_CODES.OK;
  }
}
