import {
  Request,
  Controller,
  UseGuards,
  Get,
  Body,
  Post,
  Delete,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { AuthGuard } from "@nestjs/passport";
import { AuthenticatedRequest } from "src/types";
import { UserUpdateOptions } from "@pairwise/common";
import { AdminAuthGuard } from "src/auth/admin.guard";
import { slackService, SlackService } from "src/slack/slack.service";

@Controller("user")
export class UserController {
  private readonly slackService: SlackService = slackService;

  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard("jwt"))
  @Get("profile")
  async getProfile(@Request() req: AuthenticatedRequest) {
    const { email } = req.user.profile;
    return this.userService.findUserByEmailGetFullProfile(email);
  }

  @UseGuards(AuthGuard("jwt"))
  @Post("profile")
  async updateProfile(
    @Body() updateDetails: UserUpdateOptions,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.userService.updateUser(req.user, updateDetails);
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

    return this.userService.adminGetAllUsers();
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
    return this.userService.adminDeleteUserByEmail(userEmail);
  }
}
