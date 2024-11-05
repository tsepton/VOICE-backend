import { loadImage } from "canvas";
import express, { json, Request, urlencoded } from "express";
import path from "path";
import { Question } from "./api-types.ts";
import Heatmap from "./heatmap.ts";

const app = express();
const host = process.env.HOST || "0.0.0.0";
const port: number = +(process.env.PORT || 3000);

app.use(urlencoded({ extended: true }));
app.use(json());

app.get("/ask", async (req: Request<Question>, res) => {
  const image = await loadImage(req.body.image);

  // TODO - optimize this
  console.time("heatmap generation");
  const outputPath: string = path.join(
    "generated",
    `heatmap-${Date.now()}.jpg`
  );
  const heatmap = new Heatmap(image);
  heatmap.generate(req.body.gaze);
  heatmap.saveOnDisk(outputPath);
  console.timeEnd("heatmap generation");

  res.status(200).json({ answer: "TODO" });
});

app.listen(3000, host, () => {
  console.log(`Server is listening at ${host}:${port}`);
});
