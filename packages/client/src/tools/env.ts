import getenv from "getenv";

/** ===========================================================================
 * Environment Variables Configuration
 * ============================================================================
 */

const NODE_ENV = getenv.string("NODE_ENV", "");
const DEV_MODE = getenv.bool("REACT_APP_DEV", false);

const FACEBOOK_APP_ID = getenv.string("REACT_APP_FACEBOOK_APP_ID");
const GITHUB_APP_ID = getenv.string("REACT_APP_GITHUB_APP_ID");
const GOOGLE_APP_ID = getenv.string("REACT_APP_GOOGLE_APP_ID");

const HOST = getenv.string("REACT_APP_HOST", "http://localhost:9000");

const TEST = NODE_ENV === "test";
const DEVELOPMENT = NODE_ENV === "development";
const PRODUCTION = NODE_ENV === "production";

const ENV = {
  HOST,
  TEST,
  DEVELOPMENT,
  PRODUCTION,
  DEV_MODE,
  FACEBOOK_APP_ID,
  GITHUB_APP_ID,
  GOOGLE_APP_ID,
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default ENV;
