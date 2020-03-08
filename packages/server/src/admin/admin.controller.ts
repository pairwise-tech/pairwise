import { Request, Controller, UseGuards, Get, Param } from "@nestjs/common";
import { AdminAuthGuard } from "src/auth/admin.guard";
import { AuthenticatedRequest } from "src/types";
import { AdminService } from "./admin.service";

@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /* Placeholder/test admin endpoint */
  @UseGuards(AdminAuthGuard)
  @Get()
  public async adminIndex(@Request() req: AuthenticatedRequest) {
    return this.adminService.adminEndpoint();
  }

  @UseGuards(AdminAuthGuard)
  @Get("/feedback/:challengeId")
  public async getFeedbackForChallenge(
    @Param() params,
    @Request() req: AuthenticatedRequest,
  ) {
    const { challengeId } = params;
    return this.adminService.getFeedbackForChallenge(challengeId);
  }
}
