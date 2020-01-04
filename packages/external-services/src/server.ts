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
 * GitHub authentication request.
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
