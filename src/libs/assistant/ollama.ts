import { ChatOllama } from "@langchain/ollama";
import { BaseZeroShotLearningWithVision } from "./vision-zero-shot-learning.ts";

export default class OllamaAssistant extends BaseZeroShotLearningWithVision {
  protected _system = [
    "You are an assistant for question-answering tasks. " +
      "Use the provided images as context to answer the question. " +
      "If you don't know the answer, say that you don't know. " +
      "Use three sentences maximum and keep the answer concise. ",
    "Images you receive are always in pairs: the original image and a modified version with a heatmap overlay. " +
      "The heatmap is built using user gaze data. " +
      "Brighter areas are the one where user laid his eyes on and therefore " +
      "should be used to disambiguate pronouns in the user question or request. " +
      "Pronouns may not refer to the most prominent object in the image. " +
      "Give more importance to objects under the brighter areas for pronoun disambiguation. ",
    "Do not describe the image, answer the question. ",
  ].join("\n\n");

  protected _llm = new ChatOllama({
    model:
      process.env.MODEL === `DEFAULT` ? "llama3.2-vision" : process.env.MODEL,
    temperature: 0,
    maxRetries: 2,
    baseUrl: `${process.env.OLLAMA_HOST ?? "http://0.0.0.0"}:${
      process.env.OLLAMA_PORT ?? 11434
    }`,
  });
}
