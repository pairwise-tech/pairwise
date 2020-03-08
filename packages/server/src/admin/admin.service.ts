import { Injectable } from "@nestjs/common";
import { FeedbackService } from "src/feedback/feedback.service";

@Injectable()
export class AdminService {
  constructor(private readonly feedbackService: FeedbackService) {}

  public adminEndpoint() {
    return "Admin Service";
  }

  public getFeedbackForChallenge(challengeId: string) {
    return this.feedbackService.getFeedbackForChallenge(challengeId);
  }
}
