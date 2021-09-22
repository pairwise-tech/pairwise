import { AuthGuard } from "@nestjs/passport";
import { UnauthorizedException } from "@nestjs/common";
import getenv from "getenv";
import { UserProfile } from "@pairwise/common";
import { isAdminEmail } from "./admin-auth";

/**
 * Hard-coded Admin Access Token. This is dangerous!!! Use with caution.
 */
const ADMIN_TOKEN = getenv(
  "DANGEROUSLY_WHITELISTED_PUBLIC_ADMIN_ACCESS_TOKEN",
  "",
);

/**
 * Admin access token authentication must be explicitly enabled
 * at the deployment level.
 */
const ENABLE_ADMIN_ACCESS_TOKEN_AUTHENTICATION = getenv.bool(
  "ENABLE_ADMIN_ACCESS_TOKEN_AUTHENTICATION",
  false,
);

/**
 * Admin authentication guard. Requires jwt authentication and then only
 * allows whitelisted admin email addresses.
 */
export class AdminAuthGuard extends AuthGuard("jwt") {
  constructor() {
    super();
  }

  public handleRequest(err, user, info, context) {
    // Allow whitelisted users to pass:
    if (user) {
      if (isAdminEmail(user.profile.email)) {
        return user;
      } else {
        throw new UnauthorizedException("Go away");
      }
    }

    // Ensure the admin token authentication is allowed
    if (!ENABLE_ADMIN_ACCESS_TOKEN_AUTHENTICATION) {
      throw new UnauthorizedException("Go away");
    }

    // Allow whitelisted admin access tokens to pass:
    const requestHeaders = context.args[0].headers;
    const requestToken = requestHeaders.admin_access_token;

    if (!!ADMIN_TOKEN && requestToken === ADMIN_TOKEN) {
      return getFakeAdminUser();
    } else {
      throw new UnauthorizedException("Go away");
    }
  }
}

/**
 * Create a fake user profile for requests which rely on the
 * hard-coded admin token for authentication.
 */
const getFakeAdminUser = () => {
  const FAKE_ADMIN_PROFILE: UserProfile = {
    uuid: "admin_uuid",
    email: "admin-access-token-user@pairwise.tech",
    emailVerified: false,
    givenName: "ADMIN",
    familyName: "ADMIN",
    username: "ADMIN-TOKEN-USER-USERNAME",
    avatarUrl: "ADMIN",
    githubAccountId: "admin-account-id",
    facebookAccountId: "admin-account-id",
    googleAccountId: "admin-account-id",
    coachingSessions: 0,
    optInPublicProfile: false,
    optInShareAnonymousGeolocationActivity: false,
  };

  const FAKE_ADMIN_USER = {
    profile: FAKE_ADMIN_PROFILE,
    payments: [],
    settings: {},
    courses: {},
    progress: {},
  };

  return FAKE_ADMIN_USER;
};
