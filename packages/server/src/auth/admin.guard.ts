import { AuthGuard } from "@nestjs/passport";
import { UnauthorizedException, BadRequestException } from "@nestjs/common";
import getenv from "getenv";
import { UserProfile } from "@pairwise/common";

/**
 * Hard-coded list of administrators emails.
 */
const WHITELISTED_ADMIN_EMAILS = getenv.array(
  "WHITELISTED_ADMIN_EMAILS",
  "string",
  [],
);

const ADMIN_EMAILS = new Set(WHITELISTED_ADMIN_EMAILS);

/**
 * Hard-coded Admin Access Token. This is dangerous!!! This should be fully
 * removed in the future once a proper admin UI exists. This allows us to
 * manually conduct admin user access using a simple script.
 */
const ADMIN_TOKEN = getenv(
  "DANGEROUSLY_WHITELISTED_PUBLIC_ADMIN_ACCESS_TOKEN",
  "",
);

/**
 * Returns true is the provided email is whitelisted as an admin user.
 */
export const isAdminEmail = (email: string) => {
  return ADMIN_EMAILS.has(email);
};

/**
 * Admin authentication guard. Requires jwt authentication and then only
 * allows whitelisted admin email addresses.
 */
export class AdminAuthGuard extends AuthGuard("jwt") {
  constructor() {
    super();
  }

  public handleRequest(err, user, info, context) {
    try {
      // Allow whitelisted users to pass:
      if (user) {
        const { email } = user.profile;
        if (isAdminEmail(email)) {
          return user;
        }
      }

      // Allow whitelisted admin access tokens to pass:
      const requestHeaders = context.args[0].headers;
      const requestToken = requestHeaders.admin_access_token;

      if (Boolean(ADMIN_TOKEN) && requestToken === ADMIN_TOKEN) {
        // Welcome to the world of Technical Debt! This is a fake user!
        // We should not allow manual usage of the admin API like this
        // but this is a temporary measure to get us off the ground without
        // a proper admin UI. I do not think any admin APIs currently use
        // the req.user object but it is possible they could try and it will
        // not exist for the admin requests using the temporary access token
        // so we create an obviously fake user profile here to return. All
        // of this should be removed once the proper admin UI is created.
        const FAKE_ADMIN_PROFILE: UserProfile = {
          uuid: "admin_uuid",
          email: "admin-access-token-user@pairwise.tech",
          givenName: "ADMIN",
          familyName: "ADMIN",
          avatarUrl: "ADMIN",
          displayName: "FIXED ADMIN USER",
        };

        const FAKE_ADMIN_USER = {
          profile: FAKE_ADMIN_PROFILE,
          payments: [],
          settings: {},
          courses: {},
          progress: {},
        };

        return FAKE_ADMIN_USER;
      }
    } catch (err) {
      throw new BadRequestException();
    }

    throw new UnauthorizedException("Go away");
  }
}
