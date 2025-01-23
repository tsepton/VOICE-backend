import { ChatOpenAI } from "@langchain/openai";
import { BaseZeroShotLearning } from "./vision-zero-shot-learning.ts";

export default class OpenAIAgent extends BaseZeroShotLearning {
  protected _system = [
    "You are an assistant for question-answering tasks. " +
      "Use the provided images as context to answer the question. " +
      "You should answer this question in one sentence. " + 
      "Do not describe the image, answer the question. ",
      "As part of your answer, include a short explanation. " + 
      "Even if you do not have enough information or an exact answer " +
      "is unknown, you should do your best to provide an estimate " +
      "or a range of possible answers." + 
    "Images you receive are always in pairs: the original image and a modified version with a heatmap overlay. " +
      "The heatmap is built using user gaze data. User does not know about it. " +
      "Brighter areas are the one where user laid his eyes on and therefore " +
      "should be used to disambiguate pronouns in the user question or request. " +
      "Pronouns may not refer to the most prominent object in the image. " +
      "Give more importance to objects under the brighter areas for pronoun disambiguation. ",
  ].join("\n\n");

  protected _llm = new ChatOpenAI({
    model: `${process.env.MODEL === `DEFAULT` ? "gpt-4o" : process.env.MODEL}`,
    temperature: 0,
    maxTokens: undefined,
    timeout: undefined,
    maxRetries: 2,
    apiKey: process.env.OPENAI_API_KEY,
  });
}
