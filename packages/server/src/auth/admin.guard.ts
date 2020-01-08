import { AuthGuard } from "@nestjs/passport";
import { UnauthorizedException } from "@nestjs/common";

/**
 * Hard-coded list of administrators emails.
 */
const WHITELISTED_ADMIN_EMAILS = new Set(["sean.smith.2009@gmail.com"]);

/**
 * Hard-coded list of allowed origins.
 */
const WHITELISTED_ADMIN_ORIGINS = new Set([
  "http://127.0.0.1:3000",
  "http://localhost:3000",
]);

/**
 * Admin authentication guard. Requires jwt authentication and then only
 * allows whitelisted admin email addresses.
 */
export class AdminAuthGuard extends AuthGuard("jwt") {
  constructor() {
    super();
  }

  handleRequest(err, user, info: Error, context: any) {
    if (user) {
      const { email } = user;
      const headers = context.args[0].headers;
      const { origin } = headers;
      if (
        WHITELISTED_ADMIN_ORIGINS.has(origin) &&
        WHITELISTED_ADMIN_EMAILS.has(email)
      ) {
        return user;
      }
    }

    throw new UnauthorizedException("Go away");
  }
}
