import { Request as ExpressRequest } from "express";
import {
  Headers,
  Controller,
  UseGuards,
  Post,
  Req,
  Body,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthenticatedRequest } from "../types";
import { PaymentsService } from "./payments.service";
import { PaymentRequestDto } from "@pairwise/common";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(AuthGuard("jwt"))
  @Post("/checkout")
  public createCoursePaymentIntent(
    @Body() body: PaymentRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const { courseId, plan } = body;
    return this.paymentsService.handleCreatePaymentIntent(
      req.user,
      courseId,
      plan,
    );
  }

  // Stripe webhook endpoint. Stripe will send all webhook events here,
  // currently we only rely on this for the checkout session completed
  // event.
  @Post("/stripe-webhook")
  public async coursePaymentSuccessStripeWebhook(
    @Headers("stripe-signature") signature,
    @Req() request: ExpressRequest,
  ) {
    return this.paymentsService.handleStripeCheckoutSuccessWebhook(
      request,
      signature,
    );
  }
}
