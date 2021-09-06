import http from "http";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import authUtils from "./auth-utils";
import { purchaseCourseForUserByAdmin } from "./admin-auth-utils";
import { PORT, SERVER } from "./config";

/** ===========================================================================
 * Setup
 * ============================================================================
 */

const app = express();

app.use(morgan("dev"));
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/** ===========================================================================
 * API Endpoints
 * ----------------------------------------------------------------------------
 * Add REST endpoints here which will override external service API requests
 * in the e2e test environment.
 * ============================================================================
 */

app.get("/", (req, res) =>
  res.send("The external services server is running!"),
);

/**
 * Facebook authorization request.
 */
app.get("/facebook/authorize", (req, res) => {
  res.redirect(`${SERVER}/auth/facebook/callback?code=as7d6f0sa6f0sa76f0fas`);
});

/**
 * Request for a Facebook access token.
 */
app.post("/facebook/token", (req, res) => {
  res.json(authUtils.getFacebookAccessToken());
});

/**
 * Authenticated Facebook request for a user profile.
 *
 * NOTE: Since actual SSO providers can return profiles without emails,
 * we set the FB email to be undefined to test this behavior.
 */
app.get("/facebook/profile", (req, res) => {
  const profile = authUtils.generateNewFacebookProfile();
  res.json(profile);
});

/**
 * GitHub authorization request.
 */
app.get("/github/authorize", (req, res) => {
  res.redirect(`${SERVER}/auth/github/callback?code=4c409cbcfbd1e11cb6f3`);
});

/**
 * Request for a GitHub access token.
 */
app.post("/github/token", (req, res) => {
  res.send(authUtils.getGitHubAccessToken());
});

/**
 * Authenticated GitHub request for a user profile.
 */
app.get("/github/profile", (req, res) => {
  const profile = authUtils.generateNewGitHubProfile();
  res.json(profile);
});

/**
 * [GET] request for a Google access token.
 */
app.get("/google/token", (req, res) => {
  res.redirect(
    `${SERVER}/auth/google/callback?code=${authUtils.getGoogleCallbackCode()}`,
  );
});

/**
 * [POST] request for a Google access token.
 */
app.post("/google/token", (req, res) => {
  res.json(authUtils.getGoogleAccessToken());
});

/**
 * [GET] Fixed Google admin user profile.
 *
 * NOTE: The Google SSO login in development/testing creates a user with
 * the fixed admin email, which can be used for testing admin features
 * locally.
 */
app.get("/google/profile", (req, res) => {
  const profile = authUtils.generateGoogleAdminProfile();
  res.json(profile);
});

/**
 * [GET] request for a Google access token for ADMIN login.
 */
app.get("/google-admin/token", (req, res) => {
  res.redirect(
    `${SERVER}/auth/google-admin/callback?code=${authUtils.getGoogleCallbackCode()}`,
  );
});

/**
 * [POST] request for a Google access token for ADMIN login.
 */
app.post("/google-admin/token", (req, res) => {
  res.json(authUtils.getGoogleAccessToken());
});

/**
 * [GET] Fixed Google admin user profile.
 */
app.get("/google-admin/profile", (req, res) => {
  const profile = authUtils.generateGoogleAdminProfile();
  res.json(profile);
});

/**
 * Admin API to handle purchasing a course for a user.
 */
app.post("/admin/purchase-course", async (req, res) => {
  const { email, plan } = req.body;
  const result = await purchaseCourseForUserByAdmin(email, plan);
  res.send(result);
});

/** ===========================================================================
 * Run the Server
 * ============================================================================
 */

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`\n- External services listening at: http://localhost:${PORT}`);
  console.log(`- Using server host url: ${SERVER}`);
});
