import {
  Request,
  Controller,
  UseGuards,
  Get,
  Param,
  Post,
  Body,
  Delete,
} from "@nestjs/common";
import { AdminAuthGuard } from "src/auth/admin.guard";
import { AuthenticatedRequest } from "src/types";
import { AdminService } from "./admin.service";
import { SlackService } from "src/slack/slack.service";
import { UserService } from "src/user/user.service";
import { PaymentsService } from "src/payments/payments.service";
import { FeedbackService } from "src/feedback/feedback.service";

// HTTP Methods
export type HTTP_METHOD = "GET" | "PUT" | "POST" | "DELETE";

// Helper type for consistency and accuracy in report status alerts in
// messages to Slack
export type ADMIN_URLS =
  | "admin"
  | "admin/users"
  | "admin/feedback/:challengeId"
  | "admin/purchase-course"
  | "admin/refund-course";

@Controller("admin")
export class AdminController {
  constructor(
    private readonly adminService: AdminService,

    private readonly userService: UserService,

    private readonly feedbackService: FeedbackService,

    private readonly slackService: SlackService,

    private readonly paymentsService: PaymentsService,
  ) {}

  /* Placeholder/test admin endpoint */
  @UseGuards(AdminAuthGuard)
  @Get()
  async adminIndex(@Request() req: AuthenticatedRequest) {
    this.postAdminStatusMessage(req, "GET", "admin");

    return this.adminService.adminEndpoint();
  }

  @UseGuards(AdminAuthGuard)
  @Get("/users")
  async getAllUsers(@Request() req: AuthenticatedRequest) {
    this.postAdminStatusMessage(req, "GET", "admin/users");

    return this.userService.adminGetAllUsers();
  }

  @UseGuards(AdminAuthGuard)
  @Delete("/users")
  async deleteUser(@Body() body, @Request() req: AuthenticatedRequest) {
    this.postAdminStatusMessage(req, "DELETE", "admin/users");

    const { userEmail } = body;
    return this.userService.adminDeleteUserByEmail(userEmail);
  }

  @UseGuards(AdminAuthGuard)
  @Get("/feedback/:challengeId")
  async getFeedbackForChallenge(
    @Param() params,
    @Request() req: AuthenticatedRequest,
  ) {
    const { challengeId } = params;

    // Post status message to Slack
    this.postAdminStatusMessage(req, "POST", "admin/feedback/:challengeId");

    return this.feedbackService.getFeedbackForChallenge(challengeId);
  }

  // An admin API to allow admin users to effectively purchase a course for
  // a user. This may have actual utility, e.g. to allow us to gift the
  // course for free to early beta testers or friends. In addition, it is
  // helpful as a workaround to test the payments flow using Cypress.
  @UseGuards(AdminAuthGuard)
  @Post("/purchase-course")
  async purchaseCourseForUser(
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
  @Post("/refund-course")
  async refundCourseForUser(
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
