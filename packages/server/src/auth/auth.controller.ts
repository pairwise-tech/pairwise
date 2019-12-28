import { Controller, Get, Req, UseGuards, Res } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { UserService, GenericUserProfile } from "src/user/user.service";
import { FacebookProfileWithCredentials } from "./strategies/facebook.strategy";
import { AuthService } from "./auth.service";
import { GitHubProfileWithCredentials } from "./strategies/github.strategy";
import ENV from "src/tools/env";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @UseGuards(AuthGuard("facebook-token"))
  @Get("facebook")
  async getTokenAfterFacebookSignIn(
    @Req() req: Request & { user: FacebookProfileWithCredentials },
  ) {
    const data = req.user;

    const email = data.profile.emails[0].value;
    console.log(
      `Authenticating user {email: ${email}} using Facebook Strategy`,
    );

    const userProfile: GenericUserProfile = {
      email: data.profile.emails[0].value,
      displayName: data.profile.displayName,
      givenName: data.profile.name.givenName,
      familyName: data.profile.name.familyName,
    };
    const user = await this.userService.findOrCreateUser(userProfile);
    const token = this.authService.getJwtAccessToken(user);
    return token;
  }

  @UseGuards(AuthGuard("github"))
  @Get("github")
  async authenticateGithub(@Req() req) {
    /* do nothing */
  }

  @UseGuards(AuthGuard("github"))
  @Get("github/callback")
  async getTokenAfterGithubSignIn(
    @Req() req: Request & { user: GitHubProfileWithCredentials },
    @Res() res,
  ) {
    const data = req.user;

    /* Whatever! */
    const [firstName = "", lastName = ""] = data.profile.displayName.split(" ");
    const email = data.profile.emails[0].value;
    console.log(`Authenticating user {email: ${email}} using GitHub Strategy`);

    const userProfile: GenericUserProfile = {
      email,
      displayName: data.profile.displayName,
      givenName: firstName,
      familyName: lastName,
    };
    const user = await this.userService.findOrCreateUser(userProfile);
    const { accessToken } = this.authService.getJwtAccessToken(user);
    return res.redirect(`${ENV.CLIENT_APP_URL}?accessToken=${accessToken}`);
  }
}
