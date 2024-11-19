import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOpenAI } from "@langchain/openai";
import { TextBasedAssistant } from "./assistant.ts";

export default class GazePointAR implements TextBasedAssistant {
  public async prompt(
    query: string,
    gazedAt: string[],
    // pointedAt: string[],
    otherObjects: string[]
  ): Promise<string> {
    const message = [
      `The user asked "${query}" `,
      `To help you answer this question, here is what the user looked at: ${gazedAt.join(
        ", "
      )}`,
      // `The user also pointed at the following objects: ${pointedAt.join(", ")}`,
      `Finally, here are all other objects in the user's view: ${otherObjects.join(
        ", "
      )}`,
      `Use the information above when answering the user's question ` +
        `"${query}". You should answer this question in one sentence. ` +
        `As part of your answer, include a short explanation. ` +
        `Even if you do not have enough information or an exact answer ` +
        `is unknown, you should do your best to provide an estimate ` +
        `or a range of possible answers.`,
    ].join("\n\n");

    const answer = await this._llm.invoke(message);
    return answer.content as string;
  }

  protected _llm: BaseChatModel = new ChatOpenAI({
    model: "gpt-3.5-turbo",
    temperature: 0,
    maxTokens: undefined,
    timeout: undefined,
    maxRetries: 2,
    apiKey: process.env.OPENAI_API_KEY,
  });
}
