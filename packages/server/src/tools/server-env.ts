import getenv from "getenv";

/** ===========================================================================
 * Environment Variables Configuration
 * ============================================================================
 */

/* Services: */
const CLIENT_URL = getenv.string("CLIENT_URL");
const SERVER_HOST_URL = getenv.string("SERVER_HOST_URL");
const HTTPS = getenv.bool("HTTPS", false);

/* Stripe */
const STRIPE_API_KEY = getenv.string("STRIPE_API_KEY");
const STRIPE_SECRET_KEY = getenv.string("STRIPE_SECRET_KEY");

const STRIPE_SUCCESS_URL = getenv.string("STRIPE_SUCCESS_URL");
const STRIPE_CANCEL_URL = getenv.string("STRIPE_CANCEL_URL");

/* Auth: */
const JWT_SECRET = getenv.string("JWT_SECRET");
const FACEBOOK_CLIENT_ID = getenv.string("FACEBOOK_CLIENT_ID");
const FACEBOOK_CLIENT_SECRET = getenv.string("FACEBOOK_CLIENT_SECRET");
const FACEBOOK_PROFILE_URL = getenv.string("FACEBOOK_PROFILE_URL", "");
const FACEBOOK_TOKEN_URL = getenv.string("FACEBOOK_TOKEN_URL", "");
const FACEBOOK_AUTHORIZATION_URL = getenv.string(
  "FACEBOOK_AUTHORIZATION_URL",
  "",
);
const GITHUB_CLIENT_ID = getenv.string("GITHUB_CLIENT_ID");
const GITHUB_CLIENT_SECRET = getenv.string("GITHUB_CLIENT_SECRET");
const GITHUB_PROFILE_URL = getenv.string("GITHUB_PROFILE_URL", "");
const GITHUB_TOKEN_URL = getenv.string("GITHUB_TOKEN_URL", "");
const GITHUB_AUTHORIZATION_URL = getenv.string("GITHUB_AUTHORIZATION_URL", "");
const GOOGLE_CLIENT_ID = getenv.string("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = getenv.string("GOOGLE_CLIENT_SECRET");
const GOOGLE_PROFILE_URL = getenv.string("GOOGLE_PROFILE_URL", "");
const GOOGLE_TOKEN_URL = getenv.string("GOOGLE_TOKEN_URL", "");
const GOOGLE_AUTHORIZATION_URL = getenv.string("GOOGLE_AUTHORIZATION_URL", "");

const ENV = {
  HTTPS,
  CLIENT_URL,
  SERVER_HOST_URL,
  STRIPE_API_KEY,
  STRIPE_SECRET_KEY,
  STRIPE_SUCCESS_URL,
  STRIPE_CANCEL_URL,
  JWT_SECRET,
  FACEBOOK_CLIENT_ID,
  FACEBOOK_CLIENT_SECRET,
  FACEBOOK_PROFILE_URL,
  FACEBOOK_TOKEN_URL,
  FACEBOOK_AUTHORIZATION_URL,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
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
