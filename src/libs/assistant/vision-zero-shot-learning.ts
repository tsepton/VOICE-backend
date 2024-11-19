import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { VisionBasedAssistant } from "./assistant.ts";

export abstract class BaseZeroShotLearningWithVision implements VisionBasedAssistant {
  protected abstract _llm: BaseChatModel;

  protected abstract _system: string;

  public async prompt(
    query: string,
    original: string,
    heatmap: string
  ): Promise<string> {

    const images = [original, heatmap].map((uri) => ({
      type: "image_url",
      image_url: {
        url: uri,
      },
    }));

    const answer = await this._llm.invoke([
      new SystemMessage({
        content: this._system,
      }),
      new HumanMessage({
        content: [
          {
            type: "text",
            text: query,
          },
          ...images,
        ],
      }),
    ]);

    return answer.content as string; // FIXME - temporary
  }
}
