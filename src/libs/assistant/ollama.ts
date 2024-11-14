import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOllama } from "@langchain/ollama";
import { Assistant } from "./assistant.ts";
export default class OllamaAssistant implements Assistant {
  private _llm = new ChatOllama({
    model: OllamaVisionModel.llama32_vision,
    temperature: 0,
    maxRetries: 2,
    baseUrl: `${process.env.OLLAMA_HOST ?? "http://0.0.0.0"}:${
      process.env.OLLAMA_PORT ?? 11434
    }`,
  });

  public async prompt(
    query: string,
    original: string,
    heatmap: string
  ): Promise<string> {
    const system = [
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

    const images = [original, heatmap].map((uri) => ({
      type: "image_url",
      image_url: uri,
    }));

    const answer = await this._llm.invoke([
      new SystemMessage({
        content: system,
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

enum OllamaVisionModel {
  moondream = "moondream",
  llava_llama3 = "llava-llama3",
  llama32_vision = "llama3.2-vision",
  bakllava = "bakllava",
}
