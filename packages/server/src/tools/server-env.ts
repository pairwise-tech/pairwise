import getenv from "getenv";

/** ===========================================================================
 * Environment Variables Configuration
 * ============================================================================
 */

const JWT_SECRET = getenv.string("JWT_SECRET");
const FB_OAUTH_SERVICE_URL = getenv.string("FB_OAUTH_SERVICE_URL", "");
const FB_APP_CLIENT_ID = getenv.string("FB_APP_CLIENT_ID");
const FB_APP_CLIENT_SECRET = getenv.string("FB_APP_CLIENT_SECRET");
const GITHUB_APP_CLIENT_ID = getenv.string("GITHUB_APP_CLIENT_ID");
const GITHUB_APP_CLIENT_SECRET = getenv.string("GITHUB_APP_CLIENT_SECRET");
const GITHUB_OAUTH_SERVICE_URL = getenv.string("GITHUB_OAUTH_SERVICE_URL");
const CLIENT_APP_URL = getenv.string("CLIENT_APP_URL");
const SERVER_HOST_URL = getenv.string("SERVER_HOST_URL");

const ENV = {
  JWT_SECRET,
  CLIENT_APP_URL,
  SERVER_HOST_URL,
  FB_OAUTH_SERVICE_URL,
  FB_APP_CLIENT_ID,
  FB_APP_CLIENT_SECRET,
  GITHUB_APP_CLIENT_ID,
  GITHUB_APP_CLIENT_SECRET,
  GITHUB_OAUTH_SERVICE_URL,
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default ENV;
