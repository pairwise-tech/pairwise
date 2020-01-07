import { Controller, Get, Req, UseGuards, Res } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { FacebookProfileWithCredentials } from "./strategies/facebook.strategy";
import { AuthService } from "./auth.service";
import { GitHubProfileWithCredentials } from "./strategies/github.strategy";
import ENV from "src/tools/server-env";
import { GoogleProfileWithCredentials } from "./strategies/google.strategy";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
    const accessToken = await this.authService.handleFacebookSignin(req.user);
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
    const accessToken = await this.authService.handleGitHubSignin(req.user);
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
    const accessToken = await this.authService.handleGoogleSignin(req.user);
    return res.redirect(`${ENV.CLIENT_URL}?accessToken=${accessToken}`);
  }
}
