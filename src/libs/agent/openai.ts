import { DynamicTool } from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";
import { BaseZeroShotLearning } from "./vision-zero-shot-learning.ts";
export default class OpenAIAgent extends BaseZeroShotLearning {
  public readonly name: string = "OpenAIAgent";

  protected _tools: DynamicTool[] = [];

  protected get _system() {
    return [
      // "You are an assistant for question-answering tasks. " +
      //   "Use the provided images as context to answer the question. " +
      //   "You should answer this question in one sentence. " +
      //   "Do not describe the image, answer the question. ",
      // // "As part of your answer, include a short explanation. " +
      // "Even if you do not have enough information or an exact answer " +
      //   "is unknown, you should do your best to provide an estimate " +
      //   "or a range of possible answers." +
      //   "Images you receive are always in pairs: the original image and a modified version with a heatmap overlay. " +
      //   "The heatmap is built using user gaze data. User does not know about it. " +
      //   "Brighter areas are the one where user laid his eyes on and therefore " +
      //   "should be used to disambiguate pronouns in the user question or request. " +
      //   "Pronouns may not refer to the most prominent object in the image. " +
      //   "Give more importance to objects under the brighter areas for pronoun disambiguation. ",
      "Answer the following questions as best you can. You have access to the following tools:" +
        `${this._tools.map((t) => t.name)}` +
        "Use the following format:" +
        "Question: the input question you must answer" +
        "Thought: you should always think about what to do" +
        `Action: the action to take, should be one of [${this._tools.map((t) => t.name)}]` +
        "Action Input: the input to the action" +
        "Observation: the result of the action" +
        "... (this Thought/Action/Action Input/Observation can repeat N times)" +
        "Thought: I now know the final answer" +
        "Final Answer: the final answer to the original input question" +
        "Begin!" +
        "" +
        "Question: {input}" +
        "Thought:{agent_scratchpad}",
    ].join("\n\n");
  }

  protected _llm = new ChatOpenAI({
    model: `${process.env.MODEL === `DEFAULT` ? "gpt-4o" : process.env.MODEL}`,
    temperature: 0,
    maxTokens: undefined,
    timeout: undefined,
    maxRetries: 2,
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Example on how to create a dynamic tool
  addTool(
    name: string,
    description: string,
    fn: (str: string) => Promise<string>
  ): void {
    // const todo: DynamicTool = new DynamicTool({
    //   name: "DynamicTool",
    //   description: "A dynamically created tool that processes text.",
    //   func: async (input: string) => {
    //     return `Processed: ${input}`;
    //   },
    // });

    const tool = new DynamicTool({
      name,
      description,
      func: fn,
    });
    this._tools.push(tool);
    // return this._llm.bindTools([tool]);
    // console.log(`Added tool ${name}`);
    // console.log(`Tools: ${this._llm.tools}`);
    // this._llm.bindTools(toolA)
  }
}
