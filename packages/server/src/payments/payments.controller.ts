import { Controller, UseGuards, Post, Param, Req } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthenticatedRequest } from "src/types";
import { PaymentsService } from "./payments.service";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(AuthGuard("jwt"))
  @Post("/:courseId")
  purchaseCourse(@Param() params, @Req() req: AuthenticatedRequest) {
    const { courseId } = params;
    return this.paymentsService.handlePurchaseCourseRequest(req.user, courseId);
  }
}
