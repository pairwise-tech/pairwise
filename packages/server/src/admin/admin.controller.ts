import { Request, Controller, UseGuards, Get, Param } from "@nestjs/common";
import { AdminAuthGuard } from "src/auth/admin.guard";
import { AuthenticatedRequest } from "src/types";
import { AdminService } from "./admin.service";
import { SlackService } from "src/slack/slack.service";

@Controller("admin")
export class AdminController {
  constructor(
    private readonly adminService: AdminService,

    private readonly slackService: SlackService,
  ) {}

  /* Placeholder/test admin endpoint */
  @UseGuards(AdminAuthGuard)
  @Get()
  async adminIndex(@Request() req: AuthenticatedRequest) {
    const adminUserEmail = req.user.profile.email;
    this.slackService.postAdminActionAwarenessMessage({
      adminUserEmail,
      message: `Admin user request for /admin`,
    });

    return this.adminService.adminEndpoint();
  }

  @UseGuards(AdminAuthGuard)
  @Get("/feedback/:challengeId")
  async getFeedbackForChallenge(
    @Param() params,
    @Request() req: AuthenticatedRequest,
  ) {
    const { challengeId } = params;

    const adminUserEmail = req.user.profile.email;
    this.slackService.postAdminActionAwarenessMessage({
      adminUserEmail,
      message: `Admin user request for admin/feedback/${challengeId}`,
    });

    return this.adminService.getFeedbackForChallenge(challengeId);
  }
}
