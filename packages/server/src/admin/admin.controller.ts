import { Request, Controller, UseGuards, Get, Param } from "@nestjs/common";
import { AdminAuthGuard } from "src/auth/admin.guard";
import { AuthenticatedRequest } from "src/types";
import { AdminService } from "./admin.service";
import { SlackService } from "src/slack/slack.service";
import { UserService } from "src/user/user.service";

@Controller("admin")
export class AdminController {
  constructor(
    private readonly adminService: AdminService,

    private readonly userService: UserService,

    private readonly slackService: SlackService,
  ) {}

  /* Placeholder/test admin endpoint */
  @UseGuards(AdminAuthGuard)
  @Get()
  async adminIndex(@Request() req: AuthenticatedRequest) {
    this.postAdminStatusMessage(
      req.user.profile.email,
      `Admin user request received for /admin`,
    );

    return this.adminService.adminEndpoint();
  }

  @UseGuards(AdminAuthGuard)
  @Get("/users")
  async getAllUsers(@Request() req: AuthenticatedRequest) {
    this.postAdminStatusMessage(
      req.user.profile.email,
      `Admin user request received for admin/users`,
    );

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
    this.postAdminStatusMessage(
      req.user.profile.email,
      `Admin user request received for admin/feedback/${challengeId}`,
    );

    return this.adminService.getFeedbackForChallenge(challengeId);
  }

  private postAdminStatusMessage(adminUserEmail: string, message: string) {
    this.slackService.postAdminActionAwarenessMessage({
      message,
      adminUserEmail,
    });
  }
}
