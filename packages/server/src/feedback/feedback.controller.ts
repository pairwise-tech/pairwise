import { Controller, UseGuards, Get, Req, Body, Post } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthenticatedRequest } from "src/types";
import { FeedbackService } from "./feedback.service";
import { FeedbackDto } from "@pairwise/common";

@Controller("feedback")
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @UseGuards(AuthGuard("jwt"))
  @Post()
  fetchUserChallengeProgress(
    @Body() feedbackDto: FeedbackDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.feedbackService.recordUserFeedback(req.user, feedbackDto);
  }
}
