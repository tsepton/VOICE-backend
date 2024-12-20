import { Express, json, Request, urlencoded } from "express";
import { WebSocketServer } from "ws";
import * as domain from "./domain.ts";
import { Question } from "./types/exposed.ts";
import { tryCatch } from "./types/internal.ts";
import { process } from "./validators.ts";

export function initHttp(app: Express) {
  // Configurations
  app.use(json({ limit: "200mb" }));
  app.use(urlencoded({ extended: true, limit: "200mb" }));

  // Middlewares
  app.use((req, res, next) => {
    console.log(`Route accessed: ${req.method} ${req.originalUrl}`);
    next();
  });

  app.use((req, res, next) => {
    res.on("finish", () => {
      console.log(
        `Response sent: ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`
      );
    });
    next();
  });

  // Routes
  app.get("/status", (_, res) => {
    res.status(200).json({ message: "alive" });
  });

  app.post("/question", async (req: Request<Question>, res) => {
    (await process(req?.body)).match(
      (error) => {
        res.status(error.code).json(error);
      },
      async (question) => {
        (await tryCatch(() => domain.askWithHeatmap(question))).match(
          (error) => res.status(error.code).json(error),
          (answer) => res.status(200).json({ answer })
        );
      }
    );
  });

  app.post("/question-temp", async (req: Request<Question>, res) => {
    (await process(req?.body)).match(
      (error) => {
        res.status(error.code).json(error);
      },
      async (question) => {
        (await tryCatch(() => domain.askWithTextDescription(question))).match(
          (error) => res.status(error.code).json(error),
          (answer) => res.status(200).json({ answer })
        );
      }
    );
  });
}

export function initWebsocket(wss: WebSocketServer) {
  wss.on("connection", (ws, req) => {
    console.log(`WebSocket connection established on ${req.url}`);

    if (req.url === "/status") ws.send(JSON.stringify({ message: "alive" }));
    else if (req.url === "/question") {
      ws.on("message", async (message) => {
        console.log(`Websocket message received on ${req.url}:`, message);

        (await tryCatch(() => JSON.parse(message.toString()))).match(
          (error) => ws.send(JSON.stringify(error)),
          async (question) => {
            (await process(question)).match(
              (error) => ws.send(JSON.stringify(error)),
              async (question) => {
                (await tryCatch(() => domain.askWithHeatmap(question))).match(
                  (error) => ws.send(JSON.stringify(error)),
                  (answer) => ws.send(JSON.stringify(answer))
                );
              }
            );
          }
        );
      });
    }

    ws.on("close", () => {
      console.log(`WebSocket connection closed on ${req.url}`);
    });
  });
}
