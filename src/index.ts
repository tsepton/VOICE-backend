import { loadImage } from "canvas";
import express, { json, urlencoded } from "express";
import path from "path";
import Heatmap from "./heatmap.ts";

const port = process.env.PORT || 8000;
const app = express();

app.use(urlencoded({ extended: true }));
app.use(json());

app.get("/", async (req, res) => {
  // TODO - this should come from the request
  const dataPoints = [
    { x: 100, y: 150, radius: 50, value: 0.1 },
    { x: 300, y: 250, radius: 300, value: 0.8 },
    { x: 500, y: 350, radius: 90, value: 1.0 },
    { x: 20, y: 350, radius: 90, value: 0.95 },
    { x: 56, y: 82, radius: 90, value: 0.9 },
  ];
  // const base64 =
  //   "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";
  // const image = loadImage(`data:image/png;base64,${base64}`);

  const image = await loadImage('temp.png'); // Assuming you have an image file

  console.time("runHeatmap");
  const outputPath: string = path.join(
    "generated",
    `heatmap-${Date.now()}.png`
  );
  const heatmap = new Heatmap(image);
  heatmap.generate(dataPoints);
  heatmap.save(outputPath);
  console.timeEnd("runHeatmap");

  res.status(200).json({ msg: "Heatmap generated" });
});

app.listen(port, () => {
  console.log(`Server is listening at port ${port}`);
});
