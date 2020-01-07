import getenv from "getenv";

/** ===========================================================================
 * Environment Variables Configuration
 * ============================================================================
 */

/* Services: */
const CLIENT_APP_URL = getenv.string("CLIENT_APP_URL");
const SERVER_HOST_URL = getenv.string("SERVER_HOST_URL");

/* Auth: */
const JWT_SECRET = getenv.string("JWT_SECRET");
const FB_APP_CLIENT_ID = getenv.string("FB_APP_CLIENT_ID");
const FB_APP_CLIENT_SECRET = getenv.string("FB_APP_CLIENT_SECRET");
const FB_PROFILE_URL = getenv.string("FB_PROFILE_URL", "");
const GITHUB_APP_CLIENT_ID = getenv.string("GITHUB_APP_CLIENT_ID");
const GITHUB_APP_CLIENT_SECRET = getenv.string("GITHUB_APP_CLIENT_SECRET");
const GITHUB_PROFILE_URL = getenv.string("GITHUB_PROFILE_URL", "");
const GITHUB_TOKEN_URL = getenv.string("GITHUB_TOKEN_URL", "");
const GITHUB_AUTHORIZATION_URL = getenv.string("GITHUB_AUTHORIZATION_URL", "");
const GOOGLE_CLIENT_ID = getenv.string("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = getenv.string("GOOGLE_CLIENT_SECRET");
const GOOGLE_PROFILE_URL = getenv.string("GOOGLE_PROFILE_URL", "");
const GOOGLE_TOKEN_URL = getenv.string("GOOGLE_TOKEN_URL", "");
const GOOGLE_AUTHORIZATION_URL = getenv.string("GOOGLE_AUTHORIZATION_URL", "");

const ENV = {
  CLIENT_APP_URL,
  SERVER_HOST_URL,
  JWT_SECRET,
  FB_PROFILE_URL,
  FB_APP_CLIENT_ID,
  FB_APP_CLIENT_SECRET,
  GITHUB_APP_CLIENT_ID,
  GITHUB_APP_CLIENT_SECRET,
  GITHUB_PROFILE_URL,
  GITHUB_TOKEN_URL,
  GITHUB_AUTHORIZATION_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_PROFILE_URL,
  GOOGLE_TOKEN_URL,
  GOOGLE_AUTHORIZATION_URL,
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default ENV;
