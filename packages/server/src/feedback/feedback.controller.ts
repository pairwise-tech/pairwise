import { Controller, Req, Body, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthenticatedRequest } from "src/types";
import { FeedbackService } from "./feedback.service";
import { IFeedbackDto } from "@pairwise/common";

@Controller("feedback")
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @UseGuards(AuthGuard("jwt"))
  @Post()
  submitUserFeedback(
    @Body() feedbackDto: IFeedbackDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.feedbackService.saveUserFeedback(req.user, feedbackDto);
  }
}
