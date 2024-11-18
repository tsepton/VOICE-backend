import { Canvas, CanvasRenderingContext2D, createCanvas, Image } from "canvas";
import fs from "fs";
import { AggregatedStarePoint } from "../../types/internal.ts";

export interface GazeProcessor {
  generate(data: AggregatedStarePoint[]): Promise<void>;
  saveOnDisk(outputPath: string): void;
  getBuffer(): Buffer;
  get(mime: "png" | "jpeg"): string;
}

export abstract class BaseGazeProcessor implements GazeProcessor {
  public abstract generate(data: AggregatedStarePoint[]): Promise<void>;

  protected canvas: Canvas;
  protected ctx: CanvasRenderingContext2D;

  protected width: number;
  protected height: number;

  public constructor(image: Image) {
    this.width = image.width;
    this.height = image.height;
    this.canvas = createCanvas(this.width, this.height);
    this.ctx = this.canvas.getContext("2d");

    this.ctx.drawImage(image, 0, 0, this.width, this.height);
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

  public get(mime: "png" | "jpeg"): string {
    const type = mime === "png" ? "image/png" : ("image/jpeg" as "image/png");
    return this.canvas.toDataURL(type);
  }
}
