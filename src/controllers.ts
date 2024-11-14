import { Express, json, Request, urlencoded } from "express";
import { WebSocketServer } from "ws";
import * as domain from "./domain.ts";
import { Question } from "./types/exposed.ts";
import { tryCatch } from "./types/internal.ts";
import { process } from "./validators.ts";

export function initHttp(app: Express) {

  // Configurations
  app.use(json({limit: '200mb'}));
  app.use(urlencoded({ extended: true, limit: '200mb' }));
  
  // Middlewares
  app.use((req, res, next) => {
    console.log(`Route accessed: ${req.method} ${req.originalUrl}`);
    // console.log(`Request body: ${JSON.stringify(req.body)}`);
    next();
  });
  
  app.use((req, res, next) => {
    res.on('finish', () => {
      console.log(`Response sent: ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`);
    });
    next();
  });
  
  // Routes
  app.get("/", (_, res) => {
    res.status(200).json({ message: "Server is up and running!" });
  });

  app.get("/ask", async (req: Request<Question>, res) => {
    (await process(req)).match(
      (error) => {
        res.status(error.code).json(error);
      },
      async (question) => {
        (await tryCatch(() => domain.ask(question))).match(
          (error) => {
            res.status(error.code).json(error);
          },
          (answer) => {
            res.status(200).json({ answer });
          }
        );
      }
    );
  });
}

export function initWebsocket(wss: WebSocketServer) {
  wss.on("connection", (ws, req) => {
    console.log(`WebSocket connection established on ${req.url}`);
  
    ws.on("message", (message) => {
      console.log(`Received WebSocket message on ${req.url}:`, message);
  
      // TODO - Implement WebSocket message handling

      ws.send(`Echo: ${message}`);
    });
  
    ws.on("close", () => {
      console.log(`WebSocket connection closed on ${req.url}`);
    });
  });
}