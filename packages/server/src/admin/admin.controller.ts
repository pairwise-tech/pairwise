import {
  Request,
  Controller,
  UseGuards,
  Get,
  Param,
  Post,
  Body,
} from "@nestjs/common";
import { AdminAuthGuard } from "../auth/admin.guard";
import { AuthenticatedRequest } from "../types";
import { AdminService } from "./admin.service";
import { slackService, SlackService } from "../slack/slack.service";
import { FeedbackService } from "../feedback/feedback.service";
import { UserService } from "../user/user.service";
import { PaymentsService } from "../payments/payments.service";

// HTTP Methods
export type HTTP_METHOD = "GET" | "PUT" | "POST" | "DELETE";

// Helper type for consistency and accuracy in report status alerts in
// messages to Slack
export type ADMIN_URLS =
  | "admin"
  | "admin/user"
  | "admin/users"
  | "admin/feedback/:challengeId"
  | "admin/purchase-course"
  | "admin/refund-course";

@Controller("admin")
export class AdminController {
  private readonly slackService: SlackService = slackService;

  constructor(
    private readonly adminService: AdminService,

    private readonly userService: UserService,

    private readonly paymentsService: PaymentsService,

    private readonly feedbackService: FeedbackService,
  ) {}

  /* Placeholder/test admin endpoint */
  @UseGuards(AdminAuthGuard)
  @Get()
  public async adminIndex(@Request() req: AuthenticatedRequest) {
    const adminUserEmail = req.user.profile.email;
    this.slackService.postAdminActionAwarenessMessage({
      httpMethod: "GET",
      requestPath: "admin",
      adminUserEmail,
    });

    return this.adminService.adminEndpoint();
  }

  // An admin API to allow admin users to effectively purchase a course for
  // a user. This may have actual utility, e.g. to allow us to gift the
  // course for free to early beta testers or friends. In addition, it is
  // helpful as a workaround to test the payments flow using Cypress.
  @UseGuards(AdminAuthGuard)
  @Post("/purchase-course")
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
  @Post("/refund-course")
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

  @UseGuards(AdminAuthGuard)
  @Get("/feedback/:challengeId")
  public async getFeedbackForChallenge(
    @Param() params,
    @Request() req: AuthenticatedRequest,
  ) {
    const { challengeId } = params;

    // Post status message to Slack
    const adminUserEmail = req.user.profile.email;
    this.slackService.postAdminActionAwarenessMessage({
      httpMethod: "POST",
      requestPath: "admin/feedback/:challengeId",
      adminUserEmail,
    });

    return this.feedbackService.getFeedbackForChallenge(challengeId);
  }

  @UseGuards(AdminAuthGuard)
  @Get("/user/:email")
  async getUser(@Param() params, @Request() req: AuthenticatedRequest) {
    const { email } = params;
    const adminUserEmail = req.user.profile.email;
    this.slackService.postAdminActionAwarenessMessage({
      httpMethod: "GET",
      requestPath: "admin/user",
      adminUserEmail,
    });

    return this.userService.adminGetUser(email);
  }

  @UseGuards(AdminAuthGuard)
  @Get("/users")
  async getAllUsers(@Request() req: AuthenticatedRequest) {
    const adminUserEmail = req.user.profile.email;
    this.slackService.postAdminActionAwarenessMessage({
      httpMethod: "GET",
      requestPath: "admin/users",
      adminUserEmail,
    });

    return this.userService.adminGetAllUsers();
  }

  @UseGuards(AdminAuthGuard)
  @Post("/users/delete")
  async deleteUser(@Body() body, @Request() req: AuthenticatedRequest) {
    const adminUserEmail = req.user.profile.email;
    this.slackService.postAdminActionAwarenessMessage({
      httpMethod: "DELETE",
      requestPath: "admin",
      adminUserEmail,
    });

    const { userEmail } = body;
    return this.userService.adminDeleteUserByEmail(userEmail);
  }
}
