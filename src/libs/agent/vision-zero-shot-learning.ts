import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { Agent } from "./agent.ts";

export abstract class BaseZeroShotLearning implements Agent {

  public abstract name: string;
  
  protected abstract _llm: BaseChatModel;

  protected abstract _system: string;

  public async prompt(
    query: string,
    original: string,
    heatmap: string,
    history: BaseMessage[] 
  ): Promise<BaseMessage[]> {
    const images = [original, heatmap].map((uri) => ({
      type: "image_url",
      image_url: {
        url: uri,
      },
    }));

    const updatedQuery = [
      `The user asked "${query}" `,
      `To help you answer this question, you may need `,
      `1. to use the two images below, `,
      `2. or/and to use chat history. `,
    ].join("\n\n");

    const previous = history.length
      ? history
      : [
          new SystemMessage({
            content: this._system,
          }),
        ];

    const user = new HumanMessage({
      content: [
        {
          type: "text",
          text: updatedQuery,
        },
        ...images,
      ],
    });

    const answer: BaseMessage = await this._llm.invoke([...previous, user]);

    return [...previous, user, answer];
  }
}
