import { Controller, Get, Req, UseGuards, Res, Post } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { FacebookProfileWithCredentials } from "./strategies/facebook.strategy";
import { AuthService, LoginFailureCodes, Strategy } from "./auth.service";
import { GitHubProfileWithCredentials } from "./strategies/github.strategy";
import ENV from "src/tools/server-env";
import { GoogleProfileWithCredentials } from "./strategies/google.strategy";
import querystring from "querystring";
import { ERROR_CODES } from "src/tools/constants";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("email")
  public async handleEmailLoginRequest(@Req() req) {
    // Handle request to login in directly by email
    this.authService.handleEmailLoginRequest(req.body.email);
  }

  @UseGuards(AuthGuard("facebook"))
  @Get("facebook")
  public async facebook(@Req() req) {
    /* passport handles redirection to the SSO provider */
  }

  @UseGuards(AuthGuard("facebook"))
  @Get("facebook/callback")
  public async facebookLogin(
    @Req() req: Request & { user: FacebookProfileWithCredentials },
    @Res() res,
  ) {
    const result = await this.authService.handleFacebookSignin(req.user);

    if (result.value) {
      const { token, accountCreated } = result.value;
      const params = this.getQueryParams(token, accountCreated);
      return res.redirect(`${ENV.CLIENT_URL}/authenticated?${params}`);
    } else {
      return this.handleLoginError(res, result.error, "Facebook");
    }
  }

  @UseGuards(AuthGuard("github"))
  @Get("github")
  public async github(@Req() req) {
    /* passport handles redirection to the SSO provider */
  }

  @UseGuards(AuthGuard("github"))
  @Get("github/callback")
  public async githubLogin(
    @Req() req: Request & { user: GitHubProfileWithCredentials },
    @Res() res,
  ) {
    const result = await this.authService.handleGitHubSignin(req.user);

    if (result.value) {
      const { token, accountCreated } = result.value;
      const params = this.getQueryParams(token, accountCreated);
      return res.redirect(`${ENV.CLIENT_URL}/authenticated?${params}`);
    } else {
      return this.handleLoginError(res, result.error, "GitHub");
    }
  }

  @UseGuards(AuthGuard("google"))
  @Get("google")
  public async google(@Req() req) {
    /* passport handles redirection to the SSO provider */
  }

  @UseGuards(AuthGuard("google"))
  @Get("google/callback")
  public async googleLogin(
    @Req() req: Request & { user: GoogleProfileWithCredentials },
    @Res() res,
  ) {
    const result = await this.authService.handleGoogleSignin(req.user);

    if (result.value) {
      const { token, accountCreated } = result.value;
      const params = this.getQueryParams(token, accountCreated);
      return res.redirect(`${ENV.CLIENT_URL}/authenticated?${params}`);
    } else {
      return this.handleLoginError(res, result.error, "Google");
    }
  }

  private getQueryParams(accessToken: string, accountCreated: boolean) {
    const params = querystring.stringify({
      accessToken,
      accountCreated,
    });

    return params;
  }

  /**
   * Parse these URLs on the client and show appropriate toasts for login failures.
   */
  private handleLoginError(
    @Res() res,
    err: LoginFailureCodes,
    strategy: Strategy,
  ) {
    if (err === ERROR_CODES.SSO_EMAIL_NOT_FOUND) {
      return res.redirect(
        `${ENV.CLIENT_URL}/authentication-failure?emailError=true&strategy=${strategy}`,
      );
    }

    return res.redirect(
      `${ENV.CLIENT_URL}/authentication-failure?emailError=false&strategy=${strategy}`,
    );
  }
}
