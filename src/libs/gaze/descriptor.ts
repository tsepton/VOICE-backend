import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { AggregatedStarePoint } from "../../types/internal.ts";
import { GazeToDescriptionProcessor } from "./gaze-processor.ts";

export class LLMBasedImageDescription implements GazeToDescriptionProcessor {
  private _llm: BaseChatModel = undefined as any; // TODO

  private _lookedAt: string[] = [];

  private _notLookedAt: string[] = [];

  public get(): string[] {
    return this._lookedAt;
  }

  public getAllOther(): string[] {
    return this._notLookedAt;
  }

  public async process(data: AggregatedStarePoint[]): Promise<void> {}

  private async _askModel() {
    throw new Error("Not implemented");
  }
}
