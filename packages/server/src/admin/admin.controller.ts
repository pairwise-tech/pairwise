import { Request, Controller, UseGuards, Get, Param } from "@nestjs/common";
import { AdminAuthGuard } from "src/auth/admin.guard";
import { AuthenticatedRequest } from "src/types";
import { AdminService } from "./admin.service";

@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @UseGuards(AdminAuthGuard)
  @Get()
  async getProfile(@Request() req: AuthenticatedRequest) {
    return this.adminService.adminEndpoint();
  }

  @UseGuards(AdminAuthGuard)
  @Get("/feedback/:challengeId")
  async getFeedbackForChallenge(
    @Param() params,
    @Request() req: AuthenticatedRequest,
  ) {
    const { challengeId } = params;
    return this.adminService.getFeedbackForChallenge(challengeId);
  }
}
