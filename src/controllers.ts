import { loadImage } from "canvas";
import { Express, Request } from "express";
import * as manager from "./manager.ts";
import { Question, StarePoint } from "./types/exposed.ts";
import { AggregatedStarePoint, ProcessedQuestion } from "./types/internal.ts";

export default function initControllers(app: Express) {
  app.get("/", (_, res) => {
    console.info("Server is up and running!");
    res.status(200).json({ message: "Server is up and running!" });
  });

  app.get("/ask", async (req: Request<Question>, res) => {
    // TODO - use express validator instead
    if (req.body.query.trim() == "") {
      res.status(400).json({ error: "Query is empty." });
      return;
    }
  
    if (!req.body.gaze.length) {
      res.status(400).json({ error: "Gaze is empty." });
      return;
    }
  
    if (
      !req.body.image.startsWith("data:image/jpg;base64,") &&
      !req.body.image.startsWith("data:image/jpeg;base64,") &&
      !req.body.image.startsWith("data:image/png;base64,")
    ) {
      res.status(400).json({ error: "Image is invalid." });
      return;
    }

    const processed: ProcessedQuestion = {
      query: req.body.query,
      image: await loadImage(req.body.image),
      gaze: processGaze(req.body.gaze),
    };

    res.status(200).json({ answer: await manager.ask(processed) });
  });

}

// TODO - this should be process(Request<Question>): ProcessedQuestion {}
function processGaze(gaze: StarePoint[]): AggregatedStarePoint[] {
  // TODO
  return gaze.map((point) => ({
    x: point.x,
    y: point.y,
    value: 1,
    radius: 20,
  }));
}
