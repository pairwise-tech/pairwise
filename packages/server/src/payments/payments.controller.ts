import { Request } from "express";
import {
  Headers,
  Controller,
  UseGuards,
  Post,
  Param,
  Req,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthenticatedRequest } from "src/types";
import { PaymentsService } from "./payments.service";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Stripe webhook endpoint:
  @Post("/checkout-success")
  async coursePaymentSuccessStripeWebhook(
    @Headers("stripe-signature") signature,
    @Req() request: Request,
  ) {
    return this.paymentsService.handleStripeCheckoutSuccessWebhook(
      request,
      signature,
    );
  }

  @UseGuards(AuthGuard("jwt"))
  @Post("/checkout/:courseId")
  createCoursePaymentIntent(@Param() params, @Req() req: AuthenticatedRequest) {
    const { courseId } = params;
    return this.paymentsService.handleCreatePaymentIntent(req.user, courseId);
  }
}
