import getenv from "getenv";

/** ===========================================================================
 * Environment Variables Configuration
 * ============================================================================
 */

const JWT_SECRET = getenv.string("JWT_SECRET");
const FB_APP_CLIENT_ID = getenv.string("FB_APP_CLIENT_ID");
const FB_APP_CLIENT_SECRET = getenv.string("FB_APP_CLIENT_SECRET");
const FB_OAUTH_PROFILE_URL = getenv.string("FB_OAUTH_PROFILE_URL", "");
const GITHUB_APP_CLIENT_ID = getenv.string("GITHUB_APP_CLIENT_ID");
const GITHUB_APP_CLIENT_SECRET = getenv.string("GITHUB_APP_CLIENT_SECRET");
const GITHUB_OAUTH_PROFILE_URL = getenv.string("GITHUB_OAUTH_PROFILE_URL", "");
const GITHUB_OAUTH_TOKEN_URL = getenv.string("GITHUB_OAUTH_TOKEN_URL", "");
const GITHUB_OAUTH_AUTHORIZATION_URL = getenv.string(
  "GITHUB_OAUTH_AUTHORIZATION_URL",
  "",
);
const CLIENT_APP_URL = getenv.string("CLIENT_APP_URL");
const SERVER_HOST_URL = getenv.string("SERVER_HOST_URL");

const ENV = {
  JWT_SECRET,
  CLIENT_APP_URL,
  SERVER_HOST_URL,
  FB_OAUTH_PROFILE_URL,
  FB_APP_CLIENT_ID,
  FB_APP_CLIENT_SECRET,
  GITHUB_APP_CLIENT_ID,
  GITHUB_APP_CLIENT_SECRET,
  GITHUB_OAUTH_PROFILE_URL,
  GITHUB_OAUTH_TOKEN_URL,
  GITHUB_OAUTH_AUTHORIZATION_URL,
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default ENV;
