require("dotenv").config();
import getenv from "getenv";

/** ===========================================================================
 * Environment Variables Configuration
 * ============================================================================
 */

// Port
const PORT = getenv.int("PORT", 9000);

// Environment
const ENVIRONMENT = getenv.string("ENVIRONMENT");

const VALID_ENVIRONMENTS = new Set(["development", "production"]);

// Validate ENVIRONMENT variable. Is there any way to do this with getenv?
if (!VALID_ENVIRONMENTS.has(ENVIRONMENT)) {
  throw new Error(
    `Invalid ENVIRONMENT variable specified, received: "${ENVIRONMENT}". The only environments are "development" and "production" 😎.`,
  );
}

const DEVELOPMENT = ENVIRONMENT === "development";
const PRODUCTION = ENVIRONMENT === "production";

// Services
const CLIENT_URL = getenv.string("CLIENT_URL");
const SERVER_HOST_URL = getenv.string("SERVER_HOST_URL");
const HTTPS = getenv.bool("HTTPS", false);

// Stripe
const STRIPE_SECRET_KEY = getenv.string("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SIGNING_SECRET = getenv.string(
  "STRIPE_WEBHOOK_SIGNING_SECRET",
);

// Auth
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

// Slack
const SLACK_API_TOKEN = getenv.string("SLACK_API_TOKEN", "");
const SLACK_ADMIN_IDS = getenv.array("SLACK_ADMIN_IDS", "string", []);

// Google Email Service Account Credentials
const GOOGLE_EMAIL_ACCOUNT_CLIENT_ID = getenv.string(
  "GOOGLE_EMAIL_ACCOUNT_CLIENT_ID",
  "",
);
const GOOGLE_EMAIL_ACCOUNT_PRIVATE_KEY = getenv.string(
  "GOOGLE_EMAIL_ACCOUNT_PRIVATE_KEY",
  "",
);

// Pairwise checkout logo for Stripe checkout page
const PAIRWISE_CHECKOUT_ICON = getenv.string(
  "PAIRWISE_CHECKOUT_ICON",
  "https://user-images.githubusercontent.com/18126719/76193397-d6c50b00-621e-11ea-8533-d6c258fe21af.png",
);

// Sentry
const SENTRY_DSN = getenv.string("SENTRY_DSN", "");

// Typeorm Configuration
const TYPEORM_PORT = getenv.int("TYPEORM_PORT", 5432);
const TYPEORM_HOST = getenv.string("TYPEORM_HOST");
const TYPEORM_USERNAME = getenv.string("TYPEORM_USERNAME");
const TYPEORM_PASSWORD = getenv.string("TYPEORM_PASSWORD");
const TYPEORM_DATABASE = getenv.string("TYPEORM_DATABASE");

const ENV = {
  PORT,
  DEVELOPMENT,
  PRODUCTION,
  HTTPS,
  CLIENT_URL,
  SERVER_HOST_URL,
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SIGNING_SECRET,
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
  SLACK_API_TOKEN,
  SLACK_ADMIN_IDS,
  GOOGLE_EMAIL_ACCOUNT_CLIENT_ID,
  GOOGLE_EMAIL_ACCOUNT_PRIVATE_KEY,
  SENTRY_DSN,
  PAIRWISE_CHECKOUT_ICON,
  TYPEORM_PORT,
  TYPEORM_HOST,
  TYPEORM_USERNAME,
  TYPEORM_PASSWORD,
  TYPEORM_DATABASE,
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default ENV;
