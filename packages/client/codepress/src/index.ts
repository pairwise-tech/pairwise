import http from "http";
import app from "./app";

const PORT = process.env.REACT_APP_CODEPRESS_PORT || 3001;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Codepress listening at http://localhost:${PORT}`);
});
