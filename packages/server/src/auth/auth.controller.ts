import { Controller, Get, Req, UseGuards, Res } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { UserService, GenericUserProfile } from "src/user/user.service";
import { FacebookProfileWithCredentials } from "./strategies/facebook.strategy";
import { AuthService } from "./auth.service";
import { GitHubProfileWithCredentials } from "./strategies/github.strategy";
import ENV from "src/tools/server-env";
import { GoogleProfileWithCredentials } from "./strategies/google.strategy";

/**
 * TODO: Add profileImageUrl from Facebook.
 */
@Controller("auth")
export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @UseGuards(AuthGuard("facebook"))
  @Get("facebook")
  async authenticateFacebook(@Req() req) {
    /* do nothing */
  }

  @UseGuards(AuthGuard("facebook"))
  @Get("facebook/callback")
  async getTokenAfterFaceboookSignin(
    @Req() req: Request & { user: FacebookProfileWithCredentials },
    @Res() res,
  ) {
    console.log("FACEBOOK USER:");
    console.log(req.user);
    // const profile = req.user.profile._json;
    // const email = profile.email;
    // const profileImageUrl = profile.picture;
    // const userProfile: GenericUserProfile = {
    //   email,
    //   profileImageUrl,
    //   displayName: profile.name,
    //   givenName: profile.given_name,
    //   familyName: profile.family_name,
    // };

    // console.log(`Authenticating user {email: ${email}} using Google Strategy`);
    // const user = await this.userService.findOrCreateUser(userProfile);
    // const { accessToken } = this.authService.getJwtAccessToken(user);
    // return res.redirect(`${ENV.CLIENT_APP_URL}?accessToken=${accessToken}`);
  }

  // @UseGuards(AuthGuard("facebook-token"))
  // @Get("facebook")
  // async getTokenAfterFacebookSignIn(
  //   @Req() req: Request & { user: FacebookProfileWithCredentials },
  // ) {
  //   console.log(req.user);
  //   const data = req.user;
  //   const email = data.profile.emails[0].value;
  //   const userProfile: GenericUserProfile = {
  //     email: data.profile.emails[0].value,
  //     displayName: data.profile.displayName,
  //     givenName: data.profile.name.givenName,
  //     familyName: data.profile.name.familyName,
  //   };

  //   console.log(
  //     `Authenticating user {email: ${email}} using Facebook Strategy`,
  //   );
  //   const user = await this.userService.findOrCreateUser(userProfile);
  //   const token = this.authService.getJwtAccessToken(user);
  //   return token;
  // }

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
    return res.redirect(`${ENV.CLIENT_APP_URL}?accessToken=${accessToken}`);
  }

  @UseGuards(AuthGuard("google"))
  @Get("google")
  async authenticateGoogle(@Req() req) {
    /* do nothing */
  }

  @UseGuards(AuthGuard("google"))
  @Get("google/callback")
  async getTokenAfterGoogleSignin(
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
    return res.redirect(`${ENV.CLIENT_APP_URL}?accessToken=${accessToken}`);
  }
}
