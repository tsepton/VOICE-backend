import { BaseZeroShotLearning } from "./zero-shot-learning.ts";

import { ChatOpenAI } from "@langchain/openai";

export default class OpenAIAssistant extends BaseZeroShotLearning {
  protected _system = [
    "You are an assistant for question-answering tasks. " +
      "Use the provided images as context to answer the question. " +
      "If you don't know the answer, say that you don't know. " +
      "Use three sentences maximum and keep the answer concise. ",
    "Images you receive are always in pairs: the original image and a modified version with a heatmap overlay. " +
      "The heatmap is built using user gaze data. User does not know about it. " +
      "Brighter areas are the one where user laid his eyes on and therefore " +
      "should be used to disambiguate pronouns in the user question or request. " +
      "Pronouns may not refer to the most prominent object in the image. " +
      "Give more importance to objects under the brighter areas for pronoun disambiguation. ",
    "Do not describe the image, answer the question. " +
      "If the question is ambiguous, ask for clarification. " +
      "If the question is unanswerable, say that you can't answer it. " +
      "If the question is not related to the image, say that you can't answer it. ",
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
