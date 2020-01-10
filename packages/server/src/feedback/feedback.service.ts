import { Injectable } from "@nestjs/common";
import { FeedbackDto } from "@pairwise/common";
import { Feedback } from "./feedback.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RequestUser } from "src/types";
import { SUCCESS_CODES } from "src/tools/constants";

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepository: Repository<Feedback>,
  ) {}

  async recordUserFeedback(user: RequestUser, feedbackDto: FeedbackDto) {
    const feedback = {
      ...feedbackDto,
      user: user.profile,
    };

    await this.feedbackRepository.insert(feedback);

    return SUCCESS_CODES.OK;
  }
}
