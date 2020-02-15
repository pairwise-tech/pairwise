import { Request } from "express";
import {
  Headers,
  Controller,
  UseGuards,
  Post,
  Param,
  Req,
  Body,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthenticatedRequest } from "src/types";
import { PaymentsService } from "./payments.service";
import { AdminAuthGuard } from "src/auth/admin.guard";
import { SUCCESS_CODES } from "src/tools/constants";

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

  // An admin API to allow admin users to effectively purchase a course for
  // a user. This may have actual utility, e.g. to allow us to gift the
  // course for free to early beta testers or friends. In addition, it is
  // helpful as a workaround to test the payments flow using Cypress.
  @UseGuards(AdminAuthGuard)
  @Post("/admin-purchase-course")
  async purchaseCourseForUser(@Body() body) {
    const { userEmail, courseId } = body;
    await this.paymentsService.handlePurchaseCourseByAdmin(userEmail, courseId);
    return SUCCESS_CODES.OK;
  }
}
