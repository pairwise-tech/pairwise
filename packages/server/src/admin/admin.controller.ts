import axios from "axios";
import {
  Request,
  Controller,
  UseGuards,
  Get,
  Param,
  Post,
  Body,
  Delete,
  InternalServerErrorException,
  BadRequestException,
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
import { createInverseChallengeMapping } from "@pairwise/common";
import ENV from "../tools/server-env";
import { captureSentryException } from "../tools/sentry-utils";
import { SUCCESS_CODES } from "../tools/constants";

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

    // Delete supports userEmail or uuid to identify a user for deletion.
    const { userEmail, uuid } = body;

    if (userEmail && uuid) {
      throw new BadRequestException(
        "Please supply only one user identifying parameter at a time.",
      );
    }

    try {
      if (userEmail) {
        const result = await this.userService.adminDeleteUserByEmail(userEmail);
        this.slackService.postAdminActionAwarenessMessage({ adminUserEmail });
        return result;
      } else if (uuid) {
        const result = await this.userService.adminDeleteUserByUuid(uuid);
        this.slackService.postAdminActionAwarenessMessage({ adminUserEmail });
        return result;
      }
    } catch (err) {
      this.handleError(err, { adminUserEmail });
    }
  }

  @UseGuards(AdminAuthGuard)
  @Get("/progress")
  public retrieveLiveProgressRecords() {
    return this.progressService.retrieveProgressRecords();
  }

  @UseGuards(AdminAuthGuard)
  @Post("/migration-backdoor")
  public async adminBackdoorAPI() {
    await this.userService.adminEmailMigrationMethod();
    return SUCCESS_CODES.OK;
  }

  // Log the error to Slack and throw an exception in response
  private handleError(err: Error, options: AdminRequestOptions) {
    this.slackService.postAdminErrorMessage({ ...options, error: err.message });
    // Rethrow the original error
    throw err;
  }

  @Get("/pull-requests/:pull")
  async fetchPullRequestFileDiff(@Param() params) {
    try {
      // Fetch the pull request diff
      const diff = await this.fetchPullRequestDiff(params.pull);

      // Find the course JSON file in the diff
      const courseDiffFile = diff.find(
        x =>
          x.filename ===
          "packages/common/src/courses/01_fullstack_typescript.json",
      );

      if (courseDiffFile) {
        const { sha, patch } = courseDiffFile;
        /**
         * Extract all the git file annotations which denote changed line
         * numbers in the diff.
         */
        const lineDiffs = patch
          .split("\n")
          .filter(x => /@@(.*)@@/.test(x))
          .map(x => x.match(/\+(.*)\,/).pop());

        /**
         * Fetch the blob for the course JSON in file in this PR. Convert
         * it to formatted JSON and split it by line so we can iterate
         * through it with reference to the line numbers.
         */
        const blob = await this.fetchFileBlob(sha);
        const blobJSON = JSON.stringify(blob, null, 2);
        const jsonByLines = blobJSON.split("\n");

        /**
         * Iterate through the JSON by line number and extract all the
         * challenge ids which overlap with line numbers from the diff.
         */
        let currentChallengeId = null;
        const challengeIds = [];
        const lineNumberSet = new Set(lineDiffs.map(line => +line));

        for (let i = 1; i < jsonByLines.length + 1; i++) {
          const lineNumber = i;
          const line = jsonByLines[lineNumber - 1];
          if (line.includes(`"id":`)) {
            const id = line.match(/\"id\": \"(.*)\"/).pop();
            currentChallengeId = id;
          }

          if (lineNumberSet.has(lineNumber)) {
            challengeIds.push(currentChallengeId);
          }
        }

        /**
         * Lookup up the original challenge (if it exists) and the updated
         * challenge.
         */
        const courses = this.contentService.fetchAllCoursesForAdmin();
        const originalChallengeMap = createInverseChallengeMapping(courses);
        const pullRequestChallengeMap = createInverseChallengeMapping([blob]);

        /**
         * Map over the identified altered challenge ids from the pull request
         * and construct content context to return in the response.
         */
        const prDiffContext = challengeIds.map(id => {
          // May be undefined if updated challenge is new:
          const originalChallengeMeta = originalChallengeMap[id];
          // May be undefined if updated challenge is a deletion:
          const updatedChallengeMeta = pullRequestChallengeMap[id];

          // One of them should exist...
          const existing = originalChallengeMap
            ? originalChallengeMap
            : updatedChallengeMeta;

          const { moduleId, courseId } = existing;
          const originalChallenge = originalChallengeMeta
            ? originalChallengeMeta.challenge
            : null;
          const updatedChallenge = updatedChallengeMeta
            ? updatedChallengeMeta.challenge
            : null;

          return {
            id,
            moduleId,
            courseId,
            updatedChallenge,
            originalChallenge,
          };
        });

        return prDiffContext;
      } else {
        return "Course JSON has not been modified in this PR.";
      }
    } catch (err) {
      captureSentryException(err);
      throw new InternalServerErrorException(err);
    }
  }

  private async fetchPullRequestDiff(pullRequestNumber: number) {
    const url = `https://api.github.com/repos/pairwise-tech/pairwise/pulls/${pullRequestNumber}/files`;
    const result = await axios.get(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        authorization: `token ${ENV.GITHUB_API_TOKEN}`,
      },
    });
    return result.data;
  }

  private async fetchFileBlob(fileSHA: string) {
    const url = `https://api.github.com/repos/pairwise-tech/pairwise/git/blobs/${fileSHA}`;
    const result = await axios.get(url, {
      headers: {
        Accept: "application/vnd.github.VERSION.raw",
        authorization: `token ${ENV.GITHUB_API_TOKEN}`,
      },
    });
    return result.data;
  }
}
