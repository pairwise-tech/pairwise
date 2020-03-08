import { Request as ExpressRequest } from "express";
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

  @UseGuards(AuthGuard("jwt"))
  @Post("/checkout/:courseId")
  createCoursePaymentIntent(@Param() params, @Req() req: AuthenticatedRequest) {
    const { courseId } = params;
    return this.paymentsService.handleCreatePaymentIntent(req.user, courseId);
  }

  // Stripe webhook endpoint. Stripe will send all webhook events here,
  // currently we only rely on this for the checkout session completed
  // event.
  @Post("/stripe-webhook")
  async coursePaymentSuccessStripeWebhook(
    @Headers("stripe-signature") signature,
    @Req() request: ExpressRequest,
  ) {
    return this.paymentsService.handleStripeCheckoutSuccessWebhook(
      request,
      signature,
    );
  }
}
