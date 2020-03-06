import { AuthGuard } from "@nestjs/passport";
import { UnauthorizedException, BadRequestException } from "@nestjs/common";
import getenv = require("getenv");

/**
 * Hard-coded list of administrators emails.
 */
const WHITELISTED_ADMIN_EMAILS = new Set(["sean.smith.2009@gmail.com"]);

/**
 * Hard-coded Admin Access Token. This is dangerous!!!
 */
const ADMIN_TOKEN = getenv(
  "DANGEROUSLY_WHITELISTED_PUBLIC_ADMIN_ACCESS_TOKEN",
  "",
);

/**
 * Admin authentication guard. Requires jwt authentication and then only
 * allows whitelisted admin email addresses.
 */
export class AdminAuthGuard extends AuthGuard("jwt") {
  constructor() {
    super();
  }

  handleRequest(err, user, info, context) {
    try {
      // Allow whitelisted users to pass:
      if (user) {
        const { email } = user.profile;
        if (WHITELISTED_ADMIN_EMAILS.has(email)) {
          return user;
        }
      }

      // Allow whitelisted admin access tokens to pass:
      const requestHeaders = context.args[0].headers;
      const requestToken = requestHeaders.admin_access_token;

      if (requestToken === ADMIN_TOKEN) {
        // NOTE: No real user in this case!
        return {};
      }
    } catch (err) {
      throw new BadRequestException();
    }

    throw new UnauthorizedException("Go away");
  }
}
