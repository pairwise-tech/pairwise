import { Controller, Req, Body, Post, UseGuards } from "@nestjs/common";
import { AuthenticatedRequest } from "src/types";
import { FeedbackService } from "./feedback.service";
import { IFeedbackDto, IGenericFeedback } from "@pairwise/common";
import { CustomJwtAuthGuard } from "src/auth/jwt.guard";

@Controller("feedback")
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @UseGuards(CustomJwtAuthGuard)
  @Post()
  public submitUserFeedback(
    @Body() feedbackDto: IFeedbackDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.feedbackService.saveUserFeedback(req.user, feedbackDto);
  }

  @UseGuards(CustomJwtAuthGuard)
  @Post("/general")
  public sendFeedbackToSlack(
    @Body() feedbackDto: IGenericFeedback,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.feedbackService.sendFeedbackToSlack(feedbackDto, req.user);
  }
}
