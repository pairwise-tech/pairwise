import { Request as ExpressRequest } from "express";
import {
  Headers,
  Controller,
  UseGuards,
  Post,
  Param,
  Req,
  Body,
  Request,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthenticatedRequest } from "src/types";
import { PaymentsService } from "./payments.service";
import { AdminAuthGuard } from "src/auth/admin.guard";
import { SlackService } from "src/slack/slack.service";

@Controller("payments")
export class PaymentsController {
  constructor(
    private readonly slackService: SlackService,

    private readonly paymentsService: PaymentsService,
  ) {}

  @UseGuards(AuthGuard("jwt"))
  @Post("/checkout/:courseId")
  public createCoursePaymentIntent(
    @Param() params,
    @Req() req: AuthenticatedRequest,
  ) {
    const { courseId } = params;
    return this.paymentsService.handleCreatePaymentIntent(req.user, courseId);
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

  // An admin API to allow admin users to effectively purchase a course for
  // a user. This may have actual utility, e.g. to allow us to gift the
  // course for free to early beta testers or friends. In addition, it is
  // helpful as a workaround to test the payments flow using Cypress.
  @UseGuards(AdminAuthGuard)
  @Post("/admin-purchase-course")
  public async purchaseCourseForUser(
    @Body() body,
    @Request() req: AuthenticatedRequest,
  ) {
    const adminUserEmail = req.user.profile.email;
    this.slackService.postAdminActionAwarenessMessage({
      adminUserEmail,
      message: `Admin user request to purchase a course for user!`,
    });

    const { userEmail, courseId } = body;
    return this.paymentsService.handlePurchaseCourseByAdmin(
      userEmail,
      courseId,
    );
  }

  // An admin API to handle refunding a course for a user.
  @UseGuards(AdminAuthGuard)
  @Post("/admin-refund-course")
  public async refundCourseForUser(
    @Body() body,
    @Request() req: AuthenticatedRequest,
  ) {
    const adminUserEmail = req.user.profile.email;
    this.slackService.postAdminActionAwarenessMessage({
      adminUserEmail,
      message: `Admin user request to purchase a course for user!`,
    });

    const { userEmail, courseId } = body;
    return this.paymentsService.handleRefundCourseByAdmin(userEmail, courseId);
  }
}
