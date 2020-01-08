import { Request, Controller, UseGuards, Get } from "@nestjs/common";
import { UserService } from "./user.service";
import { AuthGuard } from "@nestjs/passport";
import { AuthenticatedRequest } from "src/types";

/**
 * TODO:
 *
 * - Add apis for updating user information: name, profile image...
 * - Add api for updating last attempted challenge id
 */
@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard("jwt"))
  @Get("profile")
  async getProfile(@Request() req: AuthenticatedRequest) {
    const { email } = req.user;
    return this.userService.findUserByEmailAndReturnProfile(email);
  }
}
