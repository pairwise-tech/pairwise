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
import { ProgressService } from "../progress/progress.service";
import { ContentService } from "../content/content.service";

@Controller("admin")
export class AdminController {
  private readonly slackService: SlackService = slackService;

  constructor(
    private readonly adminService: AdminService,

    private readonly userService: UserService,

    private readonly paymentsService: PaymentsService,

    private readonly feedbackService: FeedbackService,

    private readonly progressService: ProgressService,

    private readonly contentService: ContentService,
  ) {}

  /* Placeholder/test admin endpoint */
  @UseGuards(AdminAuthGuard)
  @Get()
  public async adminIndex(@Request() req: AuthenticatedRequest) {
    const adminUserEmail = req.user.profile.email;
    try {
      const result = await this.adminService.adminEndpoint();
      this.slackService.postAdminActionAwarenessMessage({ adminUserEmail });
      return result;
    } catch (err) {
      this.handleError(err, { adminUserEmail });
    }
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
    const adminUserEmail = req.user.profile.email;
    try {
      const { userEmail, courseId } = body;
      const result = await this.paymentsService.handlePurchaseCourseByAdmin(
        userEmail,
        courseId,
      );
      this.slackService.postAdminActionAwarenessMessage({ adminUserEmail });
      return result;
    } catch (err) {
      this.handleError(err, { adminUserEmail });
    }
  }

  // An admin API to handle refunding a course for a user.
  @UseGuards(AdminAuthGuard)
  @Post("/refund-course")
  public async refundCourseForUser(
    @Body() body,
    @Request() req: AuthenticatedRequest,
  ) {
    const adminUserEmail = req.user.profile.email;
    const { userEmail, courseId } = body;

    try {
      const result = await this.paymentsService.handleRefundCourseByAdmin(
        userEmail,
        courseId,
      );
      this.slackService.postAdminActionAwarenessMessage({ adminUserEmail });
      return result;
    } catch (err) {
      this.handleError(err, { adminUserEmail });
    }
  }

  @UseGuards(AdminAuthGuard)
  @Get("/payments")
  public async getAllPaymentRecords(@Request() req: AuthenticatedRequest) {
    const adminUserEmail = req.user.profile.email;

    try {
      const result = await this.paymentsService.fetchAllPaymentRecords();
      this.slackService.postAdminActionAwarenessMessage({ adminUserEmail });
      return result;
    } catch (err) {
      this.handleError(err, { adminUserEmail });
    }
  }

  @UseGuards(AdminAuthGuard)
  @Get("/content")
  public async getAllCourses(@Request() req: AuthenticatedRequest) {
    const adminUserEmail = req.user.profile.email;

    try {
      const result = await this.contentService.fetchAllCoursesForAdmin();
      this.slackService.postAdminActionAwarenessMessage({ adminUserEmail });
      return result;
    } catch (err) {
      this.handleError(err, { adminUserEmail });
    }
  }

  @UseGuards(AdminAuthGuard)
  @Get("/feedback")
  public async getAllFeedback(@Request() req: AuthenticatedRequest) {
    const adminUserEmail = req.user.profile.email;

    try {
      const result = await this.feedbackService.getAllFeedback();
      this.slackService.postAdminActionAwarenessMessage({ adminUserEmail });
      return result;
    } catch (err) {
      this.handleError(err, { adminUserEmail });
    }
  }

  @UseGuards(AdminAuthGuard)
  @Get("/feedback/:challengeId")
  public async getFeedbackForChallenge(
    @Param() params,
    @Request() req: AuthenticatedRequest,
  ) {
    const adminUserEmail = req.user.profile.email;
    const { challengeId } = params;

    try {
      const result = await this.feedbackService.getFeedbackForChallenge(
        challengeId,
      );
      this.slackService.postAdminActionAwarenessMessage({ adminUserEmail });
      return result;
    } catch (err) {
      this.handleError(err, { adminUserEmail });
    }
  }

  @UseGuards(AdminAuthGuard)
  @Delete("/feedback/:uuid")
  public async deleteFeedbackByUuid(
    @Param() params,
    @Request() req: AuthenticatedRequest,
  ) {
    const adminUserEmail = req.user.profile.email;
    const { uuid } = params;

    try {
      const result = await this.feedbackService.deleteFeedbackByUuid(uuid);
      this.slackService.postAdminActionAwarenessMessage({ adminUserEmail });
      return result;
    } catch (err) {
      this.handleError(err, { adminUserEmail });
    }
  }

  @UseGuards(AdminAuthGuard)
  @Get("/user/:email")
  async getUser(@Param() params, @Request() req: AuthenticatedRequest) {
    const adminUserEmail = req.user.profile.email;
    const { email } = params;

    try {
      const result = await this.userService.adminGetUser(email);
      this.slackService.postAdminActionAwarenessMessage({ adminUserEmail });
      return result;
    } catch (err) {
      this.handleError(err, { adminUserEmail });
    }
  }

  @UseGuards(AdminAuthGuard)
  @Get("/users")
  async getAllUsers(@Request() req: AuthenticatedRequest) {
    const adminUserEmail = req.user.profile.email;

    try {
      const result = await this.userService.adminGetAllUsers();
      this.slackService.postAdminActionAwarenessMessage({ adminUserEmail });
      return result;
    } catch (err) {
      this.handleError(err, { adminUserEmail });
    }
  }

  @UseGuards(AdminAuthGuard)
  @Post("/users/delete")
  async deleteUser(@Body() body, @Request() req: AuthenticatedRequest) {
    const adminUserEmail = req.user.profile.email;
    const { userEmail } = body;

    try {
      const result = await this.userService.adminDeleteUserByEmail(userEmail);
      this.slackService.postAdminActionAwarenessMessage({ adminUserEmail });
      return result;
    } catch (err) {
      this.handleError(err, { adminUserEmail });
    }
  }

  @UseGuards(AdminAuthGuard)
  @Get("/progress")
  public retrieveLiveProgressRecords() {
    return this.progressService.retrieveProgressRecords();
  }

  // Log the error to Slack and throw an exception in response
  private handleError(err: Error, options: AdminRequestOptions) {
    this.slackService.postAdminErrorMessage({ ...options, error: err.message });
    // Rethrow the original error
    throw err;
  }
}
