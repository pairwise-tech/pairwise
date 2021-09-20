import getenv from "getenv";

/** ===========================================================================
 * Environment Variables Configuration
 * ============================================================================
 */

export const UNSPECIFIED_ENV_GUARD = "@@INVALID_DEV_ENV_VALUE";

// Environment
export const NODE_ENV = getenv.string("NODE_ENV", UNSPECIFIED_ENV_GUARD);
export const DEV = getenv.bool("REACT_APP_DEV", false);
export const CODEPRESS = getenv.bool("REACT_APP_CODEPRESS", false);
export const HIDE_EMBEDS = getenv.bool("REACT_APP_HIDE_EMBEDS", false);
export const DISABLE_AD_ANALYTICS = getenv.bool("DISABLE_AD_ANALYTICS", false);
export const HOST = getenv.string("REACT_APP_HOST", "http://localhost:9000");
export const REACT_APP_WEB_SOCKET_HOST = getenv.string(
  "REACT_APP_WEB_SOCKET_HOST",
  "http://localhost:9000",
);

export const CODEPRESS_PORT = getenv.string("REACT_APP_CODEPRESS_PORT", "3001");
export const CODEPRESS_HOST = getenv.string(
  "REACT_APP_CODEPRESS_HOST",
  `http://localhost:${CODEPRESS_PORT}`,
);

export const STRIPE_API_KEY = getenv.string("REACT_APP_STRIPE_API_KEY", "");

export const TEST = NODE_ENV === "test";
export const DEVELOPMENT = NODE_ENV === "development";
export const PRODUCTION = NODE_ENV === "production";

// Sentry
export const SENTRY_DSN = getenv.string("REACT_APP_SENTRY_DSN", "");
