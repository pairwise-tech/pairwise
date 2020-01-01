import http from "http";
import bodyParser from "body-parser";
import faker from "faker";
import cors from "cors";
import express from "express";
import morgan from "morgan";

const app = express();

// @ts-ignore
app.use(morgan("dev"));
app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => res.send("hi!"));

app.get("/facebook/profile", (req, res) => {
  const first = faker.name.firstName();
  const last = faker.name.lastName();
  const result = {
    id: faker.random.uuid(),
    name: `${first} ${last}`,
    first_name: first,
    last_name: last,
    email: faker.internet.email(),
  };

  res.json(result);
});

const PORT = 7000;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Mock server listening at http://localhost:${PORT}`);
});
