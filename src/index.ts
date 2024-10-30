import express, { json, urlencoded } from "express";
import path from "path";
import Heatmap from "./heatmap.ts";

const port = process.env.PORT || 8000;
const app = express();

app.use(urlencoded({ extended: true }));
app.use(json());

app.get("/", (req, res) => {
  // TODO - this should come from the request
  const width = 800;
  const height = 800;
  const dataPoints = [
    { x: 100, y: 150, radius: 50, value: 0.5 },
    { x: 300, y: 250, radius: 300, value: 0.8 },
    { x: 500, y: 350, radius: 90, value: 1.0 },
  ];

  const outputPath: string = path.join(
    "generated",
    `heatmap-${Date.now()}.png`
  );
  const heatmap = new Heatmap(width, height);
  heatmap.addDataPoint(dataPoints);
  heatmap.save(outputPath);

  res.status(200).json({ msg: "Heatmap generated" });
});

app.listen(port, () => {
  console.log(`Server is listening at port ${port}`);
});
