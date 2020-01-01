import http from "http";
import bodyParser from "body-parser";
import faker from "faker";
import cors from "cors";
import express from "express";
import morgan from "morgan";

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
  const first = faker.name.firstName();
  const last = faker.name.lastName();
  const name = `${first} ${last}`;

  const profile = {
    name,
    first_name: first,
    last_name: last,
    id: faker.random.uuid(),
    email: faker.internet.email(),
  };

  res.json(profile);
});

/** ===========================================================================
 * Run the Server
 * ============================================================================
 */

const PORT = 7000;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Mock server listening at http://localhost:${PORT}`);
});
