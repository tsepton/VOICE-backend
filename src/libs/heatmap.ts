import { Canvas, CanvasRenderingContext2D, createCanvas, Image } from "canvas";
import fs from "fs";
import { AggregatedStarePoint } from "../types/internal.ts";

export default class Heatmap {
  private canvas: Canvas;
  private ctx: CanvasRenderingContext2D;

  private width: number;
  private height: number;

  public constructor(image: Image) {
    this.width = image.width;
    this.height = image.height;
    this.canvas = createCanvas(this.width, this.height);
    this.ctx = this.canvas.getContext("2d");

    this.ctx.drawImage(image, 0, 0, this.width, this.height);
  }

  public get(mime: 'png' | 'jpeg'): string {
    const type = mime === 'png' ? 'image/png' : 'image/jpeg' as 'image/png';
    return this.canvas.toDataURL(type);
  }

  public getBuffer(): Buffer {
    // Note : Buffer an encoded PNG image.
    return this.canvas.toBuffer();
  }

  public saveOnDisk(outputPath: string): void {
    fs.writeFile(outputPath, this.getBuffer(), () =>
      console.log(`Heatmap saved at ${outputPath}`)
    );
  }

  public async generate(data: AggregatedStarePoint[]): Promise<void> {
    const gaussian = (dist: number, radius: number) => {
      const sigma = radius / 3;
      return Math.exp(-(dist * dist) / (2 * sigma * sigma));
    };

    const intensityGrid = new Array(this.height)
      .fill(0)
      .map(() => new Array(this.width).fill(1));
    data.forEach((point) => {
      const { x, y, value, radius } = point;

      // Loop over a neighborhood around the data point within the radius
      for (
        let i = Math.max(0, y - radius);
        i < Math.min(this.height, y + radius);
        i++
      ) {
        for (
          let j = Math.max(0, x - radius);
          j < Math.min(this.width, x + radius);
          j++
        ) {
          const dist = Math.sqrt((i - y) ** 2 + (j - x) ** 2);
          if (dist < radius) {
            intensityGrid[i][j] += value * gaussian(dist, radius);
          }
        }
      }
    });

    // Normalize the intensity values to be in range 0-1 for color mapping
    const maxIntensity = this._getMaxIntensity(intensityGrid);
    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        intensityGrid[i][j] /= maxIntensity;
      }
    }

    // Render the heatmap onto the canvas by mapping intensities to colors
    intensityGrid.forEach((row, y) => {
      row.forEach((intensity, x) => {
        const color = this._getColorForIntensity(intensity);
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = intensity;
        this.ctx.fillRect(x, y, 1, 1);
      });
    });
  }

  private _getColorForIntensity(intensity: number) {
    const hue = (1 - intensity) * 240; // Map 0-1 intensity to a hue value (blue to red)
    return `hsl(${hue}, 100%, 50%)`;
  }

  private _getMaxIntensity(intensityGrid: number[][]) {
    let maxIntensity = -Infinity;

    for (let row of intensityGrid) {
      for (let value of row) {
        if (value > maxIntensity) {
          maxIntensity = value;
        }
      }
    }

    return maxIntensity;
  }
}
