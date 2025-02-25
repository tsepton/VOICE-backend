// import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { ReActAgent } from "./ReActAgent.ts";

export default class OpenAIAgent extends ReActAgent {
  protected _executor: any;

  public readonly name: string = "OpenAIAgent";

  protected get _system() {
    return [
      "Answer the user questions as best you can.",
      "",
      "Use the provided images as context to answer the question. " +
        "You should answer the question in one sentence. " +
        "Do not describe the image, answer the question. ",
      "Even if you do not have enough information or an exact answer " +
        "is unknown, you should do your best to provide an estimate " +
        "or a range of possible answers.",
      "Images you receive are always in pairs: an original image and a modified version with a heatmap overlay. " +
        "The original is a photo taken from the user's personal point-of-view. " +
        "The heatmap is built using the user gaze data. The user does not know about it. " +
        "Brighter areas are the one where the user laid his eyes on and therefore " +
        "should be used to disambiguate pronouns in the user question or request. " +
        "Pronouns may not refer to the most prominent object in the image. " +
        "Give more importance to objects under the brighter areas for pronoun disambiguation. ",
      "",
      "You have access to the following tools: " +
        `${this._tools.map((t) => t.name)}`, // FIXME ! it does not know about the args for now
      "Use the following format: ",
      "Question: the input question you must answer ",
      "Thought: you should always think about what to do ",
      `Action: the action to take, should be one of [${this._tools.map((t) => t.name)}]`,
      "Action Input: the input to the action",
      "Observation: the result of the action",
      "... (this Thought/Action/Action Input/Observation can repeat N times)",
      "Thought: I now know the final answer",
      "Final Answer: the final answer to the original input question",
    ].join("\n");
  }

  protected _llm = new ChatOpenAI({
    model: `${process.env.MODEL === `DEFAULT` ? "gpt-4o" : process.env.MODEL}`,
    temperature: 0,
    maxTokens: undefined,
    timeout: undefined,
    maxRetries: 2,
    apiKey: process.env.OPENAI_API_KEY,
  });
}
