import {
  Controller,
  Get,
  Req,
  UseGuards,
  Res,
  Post,
  Param,
  Body,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { FacebookProfileWithCredentials } from "./strategies/facebook.strategy";
import { AuthService, SigninStrategy } from "./auth.service";
import { GitHubProfileWithCredentials } from "./strategies/github.strategy";
import ENV from "../tools/server-env";
import { GoogleProfileWithCredentials } from "./strategies/google.strategy";
import querystring from "querystring";
import { SUCCESS_CODES } from "../tools/constants";
import { captureSentryException } from "../tools/sentry-utils";
import { AuthenticatedRequest } from "../types";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("email")
  public async handleEmailLoginRequest(@Req() req) {
    // Just call the method, we don't want to wait for it. It takes a
    // while to actually send the email, so just respond immediately to
    // the user.
    this.authService.handleEmailLoginRequest(req.body.email);
    return SUCCESS_CODES.OK;
  }

  @UseGuards(AuthGuard("jwt"))
  @Post("update-email")
  public async updateUserEmailRequest(
    @Body() body: { email: string },
    @Req() req: AuthenticatedRequest,
  ) {
    const { email } = body;
    await this.authService.sendEmailVerificationMessage(req.user, email);
    return SUCCESS_CODES.OK;
  }

  @Get("update-email/:payload")
  public async updateUserEmail(@Param("payload") payload, @Res() res) {
    await this.authService.handleUserUpdateEmailRequest(payload);
    return res.redirect(`${ENV.CLIENT_URL}/account?emailUpdated=true`);
  }

  @Get("magic-link/:token")
  public async emailLogin(@Param("token") magicEmailToken, @Res() res) {
    const result = await this.authService.handleEmailLoginVerification(
      magicEmailToken,
    );
    if (result.value) {
      const { token, accountCreated } = result.value;
      const params = this.getQueryParams(token, accountCreated);
      return res.redirect(`${ENV.CLIENT_URL}/authenticated?${params}`);
    } else {
      return this.handleLoginError(res, "Email");
    }
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
      const baseUrl = this.getRedirectUrl(req);
      return res.redirect(`${baseUrl}?${params}`);
    } else {
      return this.handleLoginError(res, "Facebook");
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
      const baseUrl = this.getRedirectUrl(req);
      return res.redirect(`${baseUrl}?${params}`);
    } else {
      return this.handleLoginError(res, "GitHub");
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
      const baseUrl = this.getRedirectUrl(req);
      return res.redirect(`${baseUrl}?${params}`);
    } else {
      return this.handleLoginError(res, "Google");
    }
  }

  @UseGuards(AuthGuard("google-admin"))
  @Get("admin")
  public async googleAdmin(@Req() req) {
    /* passport handles redirection to the SSO provider */
  }

  @UseGuards(AuthGuard("google-admin"))
  @Get("google-admin/callback")
  public async googleAdminLogin(
    @Req() req: Request & { user: GoogleProfileWithCredentials },
    @Res() res,
  ) {
    const result = await this.authService.handleGoogleAdminSignin(req.user);

    // Client URL here is the admin client
    const clientUrl = ENV.ADMIN_CLIENT_URL;

    if (result.value) {
      const { token, accountCreated } = result.value;
      const params = this.getQueryParams(token, accountCreated);
      return res.redirect(`${clientUrl}?${params}`);
    } else {
      return res.redirect(
        `${clientUrl}/authentication-failure?strategy=google`,
      );
    }
  }

  /**
   * Process logout.
   */
  @UseGuards(AuthGuard("jwt"))
  @Get("logout")
  public logout(@Req() req: Request & { logout: () => void }, @Res() res) {
    req.logout();
    return res.send(SUCCESS_CODES.OK);
  }

  /**
   * Stringify the parameters into query parameters.
   */
  private getQueryParams(accessToken: string, accountCreated: boolean) {
    const params = querystring.stringify({
      accessToken,
      accountCreated,
    });

    return params;
  }

  /**
   * Get the referrer URL from the request, or default to the client URL if
   * the request referrer appears to be invalid.
   */
  private getRedirectUrl = (req: Request) => {
    // eslint-disable-next-line
    // @ts-ignore
    const referrerUrl: string | undefined = req.headers.referer;
    const clientUrl = ENV.CLIENT_URL;

    if (typeof referrerUrl === "string" && referrerUrl.includes(clientUrl)) {
      return referrerUrl;
    } else {
      captureSentryException(
        new Error(
          `Received invalid referrer in user logic redirect! Received: ${referrerUrl}`,
        ),
      );
      return clientUrl;
    }
  };

  /**
   * Parse these URLs on the client and show appropriate toasts for login failures.
   */
  private handleLoginError(@Res() res, strategy: SigninStrategy) {
    return res.redirect(
      `${ENV.CLIENT_URL}/authentication-failure?strategy=${strategy}`,
    );
  }
}
