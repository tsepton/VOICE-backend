import { Image } from "canvas";

export interface AggregatedStarePoint {
  x: number;
  y: number;
  radius: number;
  value: number;
}

export interface ProcessedQuestion {
  query: string;
  image: Image;
  gaze: AggregatedStarePoint[];
}
