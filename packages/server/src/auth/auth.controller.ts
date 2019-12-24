import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { UserService } from "src/user/user.service";
import { ProfileWithCredentials } from "./facebook.strategy";

@Controller("auth")
export class AuthController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard("facebook-token"))
  @Get("facebook")
  async getTokenAfterFacebookSignIn(@Req() req) {
    const data = req.user as ProfileWithCredentials;
    const user = await this.userService.findOrCreateUser(data.profile);
    return { user, accessToken: data.accessToken };
  }
}
