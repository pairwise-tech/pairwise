import {
  Request,
  Controller,
  UseGuards,
  Get,
  Param,
  Post,
  Body,
  Delete,
  BadRequestException,
  Query,
  Req,
  Res,
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
import {
  fetchPullRequestCourseContent,
  parsePullRequestDiff,
} from "../tools/pull-request-diff-utils";
import { BlobService } from "../blob/blob.service";
import { SUCCESS_CODES } from "../tools/constants";
import { AuthService } from "../auth/auth.service";
import { AdminPurchaseCourseDto } from "@pairwise/common";
import { captureSentryException } from "../tools/sentry-utils";
import { ChallengeMetaService } from "../challenge-meta/challenge-meta.service";

@Controller("admin")
export class AdminController {
  private readonly slackService: SlackService = slackService;

  constructor(
    private readonly adminService: AdminService,

    private readonly authService: AuthService,

    private readonly userService: UserService,

    private readonly paymentsService: PaymentsService,

    private readonly feedbackService: FeedbackService,

    private readonly progressService: ProgressService,

    private readonly blobService: BlobService,

    private readonly contentService: ContentService,

    private readonly challengeMetaService: ChallengeMetaService,
  ) {}

  /* Placeholder/test admin endpoint */
  @UseGuards(AdminAuthGuard)
  @Get()
  public async adminIndex(@Request() req: AuthenticatedRequest) {
    const adminUserEmail = req.user.profile.email;
    try {
      const result = await this.adminService.adminIndex();
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
    @Body() body: AdminPurchaseCourseDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const adminUserEmail = req.user.profile.email;
    try {
      const result = await this.paymentsService.handlePurchaseCourseByAdmin(
        body,
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
  @Get("/users/blob")
  async getUserCodeBlob(
    @Request() req: AuthenticatedRequest,
    @Query("uuid") uuid: string,
    @Query("challengeId") challengeId: string,
  ) {
    const adminUserEmail = req.user.profile.email;

    try {
      const user = await this.userService.findUserByUuidGetFullProfile(uuid);
      const blob = await this.blobService.fetchUserCodeBlobForChallengeByAdmin(
        user.profile,
        challengeId,
      );
      this.slackService.postAdminActionAwarenessMessage({ adminUserEmail });
      return blob;
    } catch (err) {
      this.handleError(err, { adminUserEmail });
    }
  }

  @UseGuards(AdminAuthGuard)
  @Delete("/users/:uuid")
  async deleteUser(@Param() params, @Request() req: AuthenticatedRequest) {
    const adminUserEmail = req.user.profile.email;

    try {
      const { uuid } = params;
      if (uuid) {
        const result = await this.userService.adminDeleteUserByUuid(uuid);
        await this.slackService.postAdminActionAwarenessMessage({
          adminUserEmail,
        });
        return result;
      }
      {
        throw new BadRequestException("No uuid provided.");
      }
    } catch (err) {
      this.handleError(err, { adminUserEmail });
    }
  }

  @UseGuards(AdminAuthGuard)
  @Get("/progress")
  public fetchLiveProgressRecords() {
    return this.progressService.fetchRecentProgressRecords();
  }

  @UseGuards(AdminAuthGuard)
  @Get("/progress/all/:courseId")
  public fetchProgressForAllUsers(@Param() params) {
    return this.progressService.adminFetchAllUserProgress(params.courseId);
  }

  @UseGuards(AdminAuthGuard)
  @Post("/reset-challenge-meta/:id")
  public resetChallengeMeta(@Param() params, @Req() req: AuthenticatedRequest) {
    return this.challengeMetaService.resetChallengeMeta(params.id);
  }

  @UseGuards(AdminAuthGuard)
  @Get("/challenge-meta")
  public fetchAllChallengeMeta(@Req() req: AuthenticatedRequest) {
    return this.challengeMetaService.fetchAllChallengeMeta();
  }

  @UseGuards(AdminAuthGuard)
  @Get("/coaching-sessions/complete/:uuid")
  public async revokeCoachingSession(@Param() params) {
    return this.userService.markCoachingSessionAsCompleteForUser(params.uuid);
  }

  @UseGuards(AdminAuthGuard)
  @Get("/pull-requests/:pull")
  async fetchPullRequestFileDiff(@Param() params) {
    const courses = this.contentService.fetchAllCoursesForAdmin();
    return parsePullRequestDiff(params.pull, courses);
  }

  @UseGuards(AdminAuthGuard)
  @Get("/logout")
  public logout(@Req() req: Request, @Res() res) {
    // @ts-ignore
    this.authService.invalidateJwtAccessToken(req.headers.authorization);
    return res.send(SUCCESS_CODES.OK);
  }

  @UseGuards(AdminAuthGuard)
  @Get("/pull-requests/courses/:pull")
  async fetchPullRequestDiffCourseList(@Param() params) {
    const courses = this.contentService.fetchAllCoursesForAdmin();
    return fetchPullRequestCourseContent(params.pull, courses);
  }

  // Log the error to Slack and throw an exception in response
  private handleError(err: Error, options: AdminRequestOptions) {
    captureSentryException(err);

    this.slackService.postAdminErrorMessage({ ...options, error: err.message });
    // Rethrow the original error
    throw err;
  }
}
