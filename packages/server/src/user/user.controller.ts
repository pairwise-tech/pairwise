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
import { AuthenticatedRequest } from "../types";
import { ILastActiveIdsDto, UserUpdateOptions } from "@pairwise/common";

@Controller("user")
export class UserController {
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
    return this.userService.updateLastActiveChallengeIds(req.user, activeIds);
  }
}
