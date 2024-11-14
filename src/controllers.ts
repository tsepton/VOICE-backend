import { Express, Request } from "express";
import * as domain from "./domain.ts";
import { Question } from "./types/exposed.ts";
import { tryCatch } from "./types/internal.ts";
import { process } from "./validators.ts";

export default function initControllers(app: Express) {
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
