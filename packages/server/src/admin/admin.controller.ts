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
import {
  slackService,
  SlackService,
  AdminRequestOptions,
} from "../slack/slack.service";
import { FeedbackService } from "../feedback/feedback.service";
import { UserService } from "../user/user.service";
import { PaymentsService } from "../payments/payments.service";
import { SUCCESS_CODES } from "../tools/constants";

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
    const options: AdminRequestOptions = {
      httpMethod: "GET",
      requestPath: "admin",
      adminUserEmail,
    };

    try {
      const result = await this.adminService.adminEndpoint();
      this.slackService.postAdminActionAwarenessMessage(options);
      return result;
    } catch (err) {
      this.handleError(err, options);
    }
  }

  /* admin authentication endpoint */
  @UseGuards(AdminAuthGuard)
  @Get("/authenticate")
  public async adminLogin(@Request() req: AuthenticatedRequest) {
    return SUCCESS_CODES.OK;
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
    const { userEmail, courseId } = body;
    const options: AdminRequestOptions = {
      httpMethod: "POST",
      requestPath: "admin/purchase-course",
      adminUserEmail: req.user.profile.email,
    };

    try {
      const result = await this.paymentsService.handlePurchaseCourseByAdmin(
        userEmail,
        courseId,
      );
      this.slackService.postAdminActionAwarenessMessage(options);
      return result;
    } catch (err) {
      this.handleError(err, options);
    }
  }

  // An admin API to handle refunding a course for a user.
  @UseGuards(AdminAuthGuard)
  @Post("/refund-course")
  public async refundCourseForUser(
    @Body() body,
    @Request() req: AuthenticatedRequest,
  ) {
    const { userEmail, courseId } = body;
    const options: AdminRequestOptions = {
      httpMethod: "POST",
      requestPath: "admin/refund-course",
      adminUserEmail: req.user.profile.email,
    };

    try {
      const result = await this.paymentsService.handleRefundCourseByAdmin(
        userEmail,
        courseId,
      );
      this.slackService.postAdminActionAwarenessMessage(options);
      return result;
    } catch (err) {
      this.handleError(err, options);
    }
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
    const options: AdminRequestOptions = {
      httpMethod: "POST",
      requestPath: "admin/feedback/:challengeId",
      adminUserEmail,
    };

    try {
      const result = await this.feedbackService.getFeedbackForChallenge(
        challengeId,
      );
      this.slackService.postAdminActionAwarenessMessage(options);
      return result;
    } catch (err) {
      this.handleError(err, options);
    }
  }

  @UseGuards(AdminAuthGuard)
  @Get("/user/:email")
  async getUser(@Param() params, @Request() req: AuthenticatedRequest) {
    const { email } = params;
    const adminUserEmail = req.user.profile.email;
    const options: AdminRequestOptions = {
      httpMethod: "GET",
      requestPath: "admin/user",
      adminUserEmail,
    };

    try {
      const result = await this.userService.adminGetUser(email);
      this.slackService.postAdminActionAwarenessMessage(options);
      return result;
    } catch (err) {
      this.handleError(err, options);
    }
  }

  @UseGuards(AdminAuthGuard)
  @Get("/users")
  async getAllUsers(@Request() req: AuthenticatedRequest) {
    const adminUserEmail = req.user.profile.email;
    const options: AdminRequestOptions = {
      httpMethod: "GET",
      requestPath: "admin/users",
      adminUserEmail,
    };

    try {
      const result = await this.userService.adminGetAllUsers();
      this.slackService.postAdminActionAwarenessMessage(options);
      return result;
    } catch (err) {
      this.handleError(err, options);
    }
  }

  @UseGuards(AdminAuthGuard)
  @Post("/users/delete")
  async deleteUser(@Body() body, @Request() req: AuthenticatedRequest) {
    const adminUserEmail = req.user.profile.email;
    const { userEmail } = body;
    const options: AdminRequestOptions = {
      httpMethod: "DELETE",
      requestPath: "admin",
      adminUserEmail,
    };

    try {
      const result = await this.userService.adminDeleteUserByEmail(userEmail);
      this.slackService.postAdminActionAwarenessMessage(options);
      return result;
    } catch (err) {
      this.handleError(err, options);
    }
  }

  // Log the error to Slack and throw an exception in response
  private handleError(err: Error, options: AdminRequestOptions) {
    this.slackService.postAdminErrorMessage({ ...options, error: err.message });
    // Rethrow the original error
    throw err;
  }
}
