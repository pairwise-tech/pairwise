import http from "http";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import mockAuth from "./mock-auth";
import dotenv from "dotenv";

dotenv.config();

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

const app = express();

app.use(morgan("dev"));
app.use(cors());
app.use(bodyParser.json());

const SERVER = process.env.SERVER_URL || "http://127.0.0.1:9000";

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
  res.redirect(`${SERVER}/auth/facebook/callback?code=4c409cbcfbd1e11cb6f3`);
});

/**
 * Request for a Facebook access token.
 */
app.post("/facebook/token", (req, res) => {
  res.json(mockAuth.getFacebookAccessToken());
});

/**
 * Authenticated Facebook request for a user profile.
 */
app.get("/facebook/profile", (req, res) => {
  const profile = mockAuth.generateNewFacebookProfile();
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
  res.send(
    "access_token=61d5cfb6d0853016109fa997f85f4ad8fa2d5a44&scope=user%3Aemail&token_type=bearer",
  );
});

/**
 * Authenticated GitHub request for a user profile.
 */
app.get("/github/profile", (req, res) => {
  const profile = mockAuth.generateNewGitHubProfile();
  res.json(profile);
});

/**
 * [GET] request for a Google access token.
 */
app.get("/google/token", (req, res) => {
  res.redirect(
    `${SERVER}/auth/google/callback?code=vAExoIBVcI3vY26dV5b0KCWm2L95z9IW3P4pEu7HbLCq2TLMpyQv89B9zBe95Bj6worI74a81JEWN&scope=email+profile+https://www.googleapis.com/auth/userinfo.profile+https://www.googleapis.com/auth/userinfo.email+openid?authuser=0&session_state=1dbd561a75553a324b87c0a0452692ae39ecda66..14cb&prompt=consent`,
  );
});

/**
 * [POST] request for a Google access token.
 */
app.post("/google/token", (req, res) => {
  res.json(mockAuth.getGoogleAccessToken());
});

/**
 * Authenticated GitHub request for a user profile.
 */
app.get("/google/profile", (req, res) => {
  const profile = mockAuth.generateNewGoogleProfile();
  res.json(profile);
});

/** ===========================================================================
 * Run the Server
 * ============================================================================
 */

const PORT = 7000;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(
    `\n- Mock external services listening at http://localhost:${PORT}`,
  );
  console.log(`- Using server host url: ${SERVER}`);
});
