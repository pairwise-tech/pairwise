import { AuthGuard } from "@nestjs/passport";
import { UnauthorizedException } from "@nestjs/common";

/**
 * Hard-coded list of administrators emails.
 */
const WHITELISTED_ADMIN_EMAILS = new Set(["sean.smith.2009@gmail.com"]);

/**
 * Admin authentication guard. Requires jwt authentication and then only
 * allows whitelisted admin email addresses.
 */
export class AdminAuthGuard extends AuthGuard("jwt") {
  constructor() {
    super();
  }

  handleRequest(err, user, info, context) {
    if (user) {
      const { email } = user.profile;
      if (WHITELISTED_ADMIN_EMAILS.has(email)) {
        return user;
      }
    }

    throw new UnauthorizedException("Go away");
  }
}
