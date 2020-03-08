import { Controller, Get, Req, UseGuards, Res } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { FacebookProfileWithCredentials } from "./strategies/facebook.strategy";
import { AuthService } from "./auth.service";
import { GitHubProfileWithCredentials } from "./strategies/github.strategy";
import ENV from "src/tools/server-env";
import { GoogleProfileWithCredentials } from "./strategies/google.strategy";
import querystring from "querystring";
import { ERROR_CODES } from "src/tools/constants";

type Strategy = "GitHub" | "Facebook" | "Google";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
    try {
      const {
        token,
        accountCreated,
      } = await this.authService.handleFacebookSignin(req.user);

      const params = this.getQueryParams(token, accountCreated);
      return res.redirect(`${ENV.CLIENT_URL}/authenticated?${params}`);
    } catch (e) {
      this.handleLoginError(res, e, "Facebook");
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
    try {
      const {
        token,
        accountCreated,
      } = await this.authService.handleGitHubSignin(req.user);

      const params = this.getQueryParams(token, accountCreated);
      return res.redirect(`${ENV.CLIENT_URL}/authenticated?${params}`);
    } catch (e) {
      return this.handleLoginError(res, e, "GitHub");
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
    try {
      const {
        token,
        accountCreated,
      } = await this.authService.handleGoogleSignin(req.user);

      const params = this.getQueryParams(token, accountCreated);
      return res.redirect(`${ENV.CLIENT_URL}/authenticated?${params}`);
    } catch (e) {
      this.handleLoginError(res, e, "Google");
    }
  }

  private getQueryParams(accessToken: string, accountCreated: boolean) {
    const params = querystring.stringify({
      accessToken,
      accountCreated,
    });

    return params;
  }

  private handleLoginError(@Res() res, e: Error, strategy: Strategy) {
    if (e.message === ERROR_CODES.SSO_EMAIL_NOT_FOUND) {
      console.log(`[Login Err] ${e.message}: ${strategy}`);
      return res.redirect(
        `${ENV.CLIENT_URL}/authentication-failure?emailError=true&strategy=${strategy}`,
      );
    }
    console.log(
      `[Login Err] An unknown error occurred: ${e.name}: ${e.message}`,
    );
    return res.redirect(
      `${ENV.CLIENT_URL}/authentication-failure?emailError=false&strategy=${strategy}`,
    );
  }
}
