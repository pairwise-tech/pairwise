import http from "http";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import mockAuth from "./mock-auth";

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
 * Facebook authentication request.
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
 * Request for a GitHun access token.
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
});
