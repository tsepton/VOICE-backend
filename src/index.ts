import { loadImage } from "canvas";
import express, { json, Request, urlencoded } from "express";
import path from "path";
import Heatmap, { DataPoint } from "./heatmap.ts";

const port = process.env.PORT || 8000;
const app = express();

app.use(urlencoded({ extended: true }));
app.use(json());

app.get(
  "/ask",
  async (req: Request<{ image: string; gaze: DataPoint[] }>, res) => {
    const base64 = req.body.image.contains("data:image/png;base64,")
      ? req.body.image
      : `data:image/png;base64,${req.body.image}`;
    const image = await loadImage(base64);

    // TODO - optimize this
    console.time("heatmap generation");
    const outputPath: string = path.join(
      "generated",
      `heatmap-${Date.now()}.png`
    );
    const heatmap = new Heatmap(image);
    heatmap.generate(req.body.gaze);
    heatmap.save(outputPath);
    console.timeEnd("heatmap generation");

    res.status(200).json({ answer: "TODO" });
  }
);

app.listen(port, () => {
  console.log(`Server is listening at port ${port}`);
});
