import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import { initWebsocket } from "./controllers.ts";

const app = express();
const host = process.env.HOST || "0.0.0.0";
const port: number = +(process.env.PORT || 3000);

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

initWebsocket(wss);

server.listen(3000, host, () => {
  console.log(`Server is listening at ${host}:${port}`);
});
