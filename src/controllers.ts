import { Express, Request } from "express";
import * as manager from "./manager.ts";
import { Question } from "./types/exposed.ts";
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
        res.status(200).json({ answer: await manager.ask(question) });
      }
    );
  });
}
