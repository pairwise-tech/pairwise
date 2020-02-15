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
import { PaymentsService } from "src/payments/payments.service";
import { SUCCESS_CODES } from "src/tools/constants";

@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /* Placeholder/test admin endpoint */
  @UseGuards(AdminAuthGuard)
  @Get()
  async adminIndex(@Request() req: AuthenticatedRequest) {
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

  @UseGuards(AdminAuthGuard)
  @Post("/course-pay")
  async purchaseCourseForUser(@Body() body) {
    const { courseId, userEmail } = body;
    // await this.paymentsService.handlePurchaseCourseByAdmin(courseId, userEmail);
    return SUCCESS_CODES.OK;
  }
}
