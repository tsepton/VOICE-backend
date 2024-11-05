import ollama from "ollama";
import path from "path";
import Heatmap from "./libs/heatmap.ts";
import { ProcessedQuestion } from "./types/internal.ts";

// TODO - return type
export async function ask(question: ProcessedQuestion): Promise<string> {
  const { query, gaze, image } = question;

  // Heatmap
  // TODO - optimize this
  console.time("heatmap generation");
  const heatmap = new Heatmap(image);
  await heatmap.generate(gaze);
  // TODO  saving is for debugging purposes
  heatmap.saveOnDisk(path.join("generated", `heatmap-${Date.now()}.png`));
  console.timeEnd("heatmap generation");

  // LLM querying
  const noMimeType = heatmap.get("jpeg").replace("data:image/jpeg;base64,", "");
  const response = await ollama.chat({
    model: "llava-llama3",
    messages: [
      {
        role: "user",
        content: query,
        images: [noMimeType],
      },
    ],
  });
  console.log(response.message.content);
  // Maybe we should return the generator? FIXME - Opened question
  return await response.message.content;
}
