import {
  Request,
  Controller,
  UseGuards,
  Get,
  Param,
  Post,
  Body,
} from "@nestjs/common";
import { AdminAuthGuard } from "src/auth/admin.guard";
import { AuthenticatedRequest } from "src/types";
import { AdminService } from "./admin.service";
import { SlackService } from "src/slack/slack.service";
import { UserService } from "src/user/user.service";
import { PaymentsService } from "src/payments/payments.service";

// Helper type for consistency and accuracy in report status alerts in
// messages to Slack
type AdminUrls =
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

    private readonly slackService: SlackService,

    private readonly paymentsService: PaymentsService,
  ) {}

  /* Placeholder/test admin endpoint */
  @UseGuards(AdminAuthGuard)
  @Get()
  async adminIndex(@Request() req: AuthenticatedRequest) {
    this.postAdminStatusMessage(req, "admin");

    return this.adminService.adminEndpoint();
  }

  @UseGuards(AdminAuthGuard)
  @Get("/users")
  async getAllUsers(@Request() req: AuthenticatedRequest) {
    this.postAdminStatusMessage(req, "admin/users");

    return this.userService.adminGetAllUsers();
  }

  @UseGuards(AdminAuthGuard)
  @Get("/feedback/:challengeId")
  async getFeedbackForChallenge(
    @Param() params,
    @Request() req: AuthenticatedRequest,
  ) {
    const { challengeId } = params;

    // Post status message to Slack
    this.postAdminStatusMessage(req, "admin/feedback/:challengeId");

    return this.adminService.getFeedbackForChallenge(challengeId);
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
    this.postAdminStatusMessage(req, "admin/purchase-course");

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
    this.postAdminStatusMessage(req, "admin/refund-course");

    const { userEmail, courseId } = body;
    return this.paymentsService.handleRefundCourseByAdmin(userEmail, courseId);
  }

  private postAdminStatusMessage(req: AuthenticatedRequest, path: AdminUrls) {
    const adminUserEmail = req.user.profile.email;
    const message = `[ADMIN]: Request received for API: "${path}"`;
    this.slackService.postAdminActionAwarenessMessage({
      message,
      adminUserEmail,
    });
  }
}
