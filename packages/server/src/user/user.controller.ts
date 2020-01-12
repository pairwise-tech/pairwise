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
import { UserUpdateOptions } from "@pairwise/common";

@Controller("user")
export class UserController {
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
}
