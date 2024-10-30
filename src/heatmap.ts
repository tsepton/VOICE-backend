import { Canvas, CanvasRenderingContext2D, createCanvas } from "canvas";
import fs from "fs";

export interface DataPoint {
  x: number;
  y: number;
  radius: number;
  value: number;
}

export default class Heatmap {
  private canvas: Canvas;
  private ctx: CanvasRenderingContext2D;

  constructor(width: number, height: number) {
    this.canvas = createCanvas(width, height);
    this.ctx = this.canvas.getContext("2d");

    // Example gradient for the heatmap
    const gradient = this.ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, "blue");
    gradient.addColorStop(0.5, "green");
    gradient.addColorStop(1, "red");

    // Set up canvas background
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);
  }

  addDataPoint(points: DataPoint[]) {
    points.forEach((point) => {
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 0, 0, ${point.value})`;
      this.ctx.fill();
    });
  }

  save(outputPath: string) {
    const buffer = this.canvas.toBuffer("image/png");
    fs.writeFileSync(outputPath, buffer);
    console.log(`Heatmap saved at ${outputPath}`);
  }
}
