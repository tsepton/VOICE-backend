import { Canvas, CanvasRenderingContext2D, createCanvas, Image } from "canvas";
import fs from "fs";
import { AggregatedStarePoint } from "../../types/internal.ts";

export interface GazeProcessor {
  process(data: AggregatedStarePoint[]): Promise<void>;
}

export interface GazeToImageProcessor extends GazeProcessor {
  saveOnDisk(outputPath: string): void;
  getBuffer(): Buffer;
  get(mime: "png" | "jpeg"): string;
}

export interface GazeToDescriptionProcessor extends GazeProcessor {
  get(): string[];
  getAllOther(): string[];
}

export abstract class BaseGazeToImageProcessor implements GazeToImageProcessor {
  public abstract process(data: AggregatedStarePoint[]): Promise<void>;

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
    
    // Flip the canvas vertically so that the origin is at the bottom-left corner
    // Default is at the top-left corner
    this.ctx.translate(0, this.ctx.canvas.height); 
    this.ctx.scale(1, -1); 
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
