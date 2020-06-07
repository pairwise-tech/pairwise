import {
  Request,
  Controller,
  UseGuards,
  Get,
  Body,
  Post,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { AuthGuard } from "@nestjs/passport";
import { AuthenticatedRequest } from "src/types";
import { ILastActiveIdsDto, UserUpdateOptions } from "@pairwise/common";
import { AdminAuthGuard } from "src/auth/admin.guard";
import { slackService, SlackService } from "src/slack/slack.service";

@Controller("user")
export class UserController {
  private readonly slackService: SlackService = slackService;

  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard("jwt"))
  @Get("profile")
  public async getProfile(@Request() req: AuthenticatedRequest) {
    const { uuid } = req.user.profile;
    return this.userService.findUserByUuidGetFullProfile(uuid);
  }

  @UseGuards(AuthGuard("jwt"))
  @Post("profile")
  public async updateProfile(
    @Body() updateDetails: UserUpdateOptions,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.userService.updateUser(req.user, updateDetails);
  }

  @UseGuards(AuthGuard("jwt"))
  @Post("active-challenge-ids")
  public async updateLastActiveChallengeIds(
    @Body() activeIds: ILastActiveIdsDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const { courseId, challengeId } = activeIds;
    return this.userService.updateLastActiveChallengeIds(
      req.user,
      courseId,
      challengeId,
    );
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

    const { userUuid } = body;
    return this.userService.adminDeleteUserByUuid(userUuid);
  }
}
