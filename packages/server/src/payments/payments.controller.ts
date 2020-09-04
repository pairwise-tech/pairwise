import { Request as ExpressRequest } from "express";
import {
  Headers,
  Controller,
  UseGuards,
  Post,
  Param,
  Req,
  Request,
  Body,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthenticatedRequest } from "../types";
import { PaymentsService } from "./payments.service";
import { AdminAuthGuard } from "../auth/admin.guard";
import { HTTP_METHOD, ADMIN_URLS } from "../admin/admin.controller";
import { SlackService, slackService } from "../slack/slack.service";

@Controller("payments")
export class PaymentsController {
  private readonly slackService: SlackService = slackService;

  constructor(private readonly paymentsService: PaymentsService) {}

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
  @Post("/admin/purchase-course")
  public async purchaseCourseForUser(
    @Body() body,
    @Request() req: AuthenticatedRequest,
  ) {
    this.postAdminStatusMessage(req, "POST", "admin/purchase-course");

    const { userEmail, courseId } = body;
    return this.paymentsService.handlePurchaseCourseByAdmin(
      userEmail,
      courseId,
    );
  }

  // An admin API to handle refunding a course for a user.
  @UseGuards(AdminAuthGuard)
  @Post("/admin/refund-course")
  public async refundCourseForUser(
    @Body() body,
    @Request() req: AuthenticatedRequest,
  ) {
    this.postAdminStatusMessage(req, "POST", "admin/refund-course");

    const { userEmail, courseId } = body;
    return this.paymentsService.handleRefundCourseByAdmin(userEmail, courseId);
  }

  private postAdminStatusMessage(
    req: AuthenticatedRequest,
    httpMethod: HTTP_METHOD,
    requestPath: ADMIN_URLS,
  ) {
    const adminUserEmail = req.user.profile.email;
    this.slackService.postAdminActionAwarenessMessage({
      httpMethod,
      requestPath,
      adminUserEmail,
    });
  }
}
