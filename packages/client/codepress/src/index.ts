import http from "http";
import app from "./app";

const PORT = process.env.CODEPRESS_PORT || 3001;

const server = http.createServer(app);

server.listen(3001, () => {
  console.log(`Codepress listening at http://localhost:${PORT}`);
});
