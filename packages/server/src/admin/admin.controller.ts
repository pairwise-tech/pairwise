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
import { slackService, SlackService } from "src/slack/slack.service";
import { FeedbackService } from "src/feedback/feedback.service";
import { UserService } from "src/user/user.service";

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
  private readonly slackService: SlackService = slackService;

  constructor(
    private readonly userService: UserService,

    private readonly adminService: AdminService,

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
  @Get("/admin")
  async getAllUsers(@Request() req: AuthenticatedRequest) {
    const adminUserEmail = req.user.profile.email;
    this.slackService.postAdminActionAwarenessMessage({
      httpMethod: "GET",
      requestPath: "admin/users",
      adminUserEmail,
    });

    // return this.userService.adminGetAllUsers();
  }

  @UseGuards(AdminAuthGuard)
  @Post("/admin/delete")
  async deleteUser(@Body() body, @Request() req: AuthenticatedRequest) {
    const adminUserEmail = req.user.profile.email;
    this.slackService.postAdminActionAwarenessMessage({
      httpMethod: "DELETE",
      requestPath: "admin",
      adminUserEmail,
    });

    const { userEmail } = body;
    // return this.userService.adminDeleteUserByEmail(userEmail);
  }
}
