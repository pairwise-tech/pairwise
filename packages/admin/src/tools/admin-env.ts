import getenv from "getenv";

/** ===========================================================================
 * Environment Variables Configuration
 * ============================================================================
 */

export const UNSPECIFIED_ENV_GUARD = "@@INVALID_DEV_ENV_VALUE";

export const NODE_ENV = getenv.string("NODE_ENV", UNSPECIFIED_ENV_GUARD);
export const TEST = NODE_ENV === "test";
export const DEVELOPMENT = NODE_ENV === "development";
export const PRODUCTION = NODE_ENV === "production";

export const DEV = getenv.bool("REACT_APP_DEV", false);
export const HOST = getenv.string("REACT_APP_HOST", "http://localhost:9000");
