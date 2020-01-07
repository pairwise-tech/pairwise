import { Controller, Get, Req, UseGuards, Res } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { UserService, GenericUserProfile } from "src/user/user.service";
import { FacebookProfileWithCredentials } from "./strategies/facebook.strategy";
import { AuthService } from "./auth.service";
import { GitHubProfileWithCredentials } from "./strategies/github.strategy";
import ENV from "src/tools/server-env";
import { GoogleProfileWithCredentials } from "./strategies/google.strategy";

/**
 * TODO: Move the actual user creation logic to the authService.
 */
@Controller("auth")
export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @UseGuards(AuthGuard("facebook"))
  @Get("facebook")
  async facebook(@Req() req) {
    /* passport handles redirection to the SSO provider */
  }

  @UseGuards(AuthGuard("facebook"))
  @Get("facebook/callback")
  async facebookLogin(
    @Req() req: Request & { user: FacebookProfileWithCredentials },
    @Res() res,
  ) {
    const profile = req.user.profile._json;
    const email = profile.email;
    const profileImageUrl = profile.picture.data.url;
    const { first_name, last_name } = profile;
    const name = `${first_name} ${last_name}`;
    const userProfile: GenericUserProfile = {
      email,
      profileImageUrl,
      displayName: name,
      givenName: first_name,
      familyName: last_name,
    };

    console.log(`Authenticating user {email: ${email}} using Google Strategy`);
    const user = await this.userService.findOrCreateUser(userProfile);
    const { accessToken } = this.authService.getJwtAccessToken(user);
    return res.redirect(`${ENV.CLIENT_URL}?accessToken=${accessToken}`);
  }

  @UseGuards(AuthGuard("github"))
  @Get("github")
  async github(@Req() req) {
    /* passport handles redirection to the SSO provider */
  }

  @UseGuards(AuthGuard("github"))
  @Get("github/callback")
  async githubLogin(
    @Req() req: Request & { user: GitHubProfileWithCredentials },
    @Res() res,
  ) {
    const profile = req.user.profile._json;

    const email = profile.email;
    const profileImageUrl = profile.avatar_url;

    /* Whatever! */
    const [firstName = "", lastName = ""] = profile.name.split(" ");
    const userProfile: GenericUserProfile = {
      email,
      profileImageUrl,
      givenName: firstName,
      familyName: lastName,
      displayName: profile.name,
    };

    console.log(`Authenticating user {email: ${email}} using GitHub Strategy`);
    const user = await this.userService.findOrCreateUser(userProfile);
    const { accessToken } = this.authService.getJwtAccessToken(user);
    return res.redirect(`${ENV.CLIENT_URL}?accessToken=${accessToken}`);
  }

  @UseGuards(AuthGuard("google"))
  @Get("google")
  async google(@Req() req) {
    /* passport handles redirection to the SSO provider */
  }

  @UseGuards(AuthGuard("google"))
  @Get("google/callback")
  async googleLogin(
    @Req() req: Request & { user: GoogleProfileWithCredentials },
    @Res() res,
  ) {
    const profile = req.user.profile._json;
    const email = profile.email;
    const profileImageUrl = profile.picture;
    const userProfile: GenericUserProfile = {
      email,
      profileImageUrl,
      displayName: profile.name,
      givenName: profile.given_name,
      familyName: profile.family_name,
    };

    console.log(`Authenticating user {email: ${email}} using Google Strategy`);
    const user = await this.userService.findOrCreateUser(userProfile);
    const { accessToken } = this.authService.getJwtAccessToken(user);
    return res.redirect(`${ENV.CLIENT_URL}?accessToken=${accessToken}`);
  }
}
