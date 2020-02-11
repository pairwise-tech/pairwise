import { Controller, Req, Body, Post, UseGuards } from "@nestjs/common";
import { AuthenticatedRequest } from "src/types";
import { FeedbackService } from "./feedback.service";
import { IFeedbackDto } from "@pairwise/common";
import { CustomJwtAuthGuard } from "src/auth/jwt.guard";

@Controller("feedback")
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @UseGuards(CustomJwtAuthGuard)
  @Post()
  submitUserFeedback(
    @Body() feedbackDto: IFeedbackDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.feedbackService.saveUserFeedback(req.user, feedbackDto);
  }
}
