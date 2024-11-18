import { AggregatedStarePoint } from "../../types/internal.ts";
import { BaseGazeProcessor } from "./gaze-processor.ts";

export default class Pointer extends BaseGazeProcessor {
  public async generate(data: AggregatedStarePoint[]): Promise<void> {
    throw new Error("Method not implemented.");
  }

  private _getMaxIntensityPoint(): { x: number; y: number } {
    return { x: 0, y: 0 }; // TODO
  }
}
