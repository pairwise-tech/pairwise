import getenv from "getenv";

/** ===========================================================================
 * Environment Variables Configuration
 * ============================================================================
 */

const NODE_ENV = getenv.string("NODE_ENV", "");

const TEST = NODE_ENV === "test";
const DEVELOPMENT = NODE_ENV === "development";
const PRODUCTION = NODE_ENV === "production";

const ENV = {
  TEST,
  DEVELOPMENT,
  PRODUCTION,
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default ENV;
