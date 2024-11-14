import path from "path";
import assistant from "./libs/assistant/assistant.ts";
import Heatmap from "./libs/heatmap.ts";
import { ProcessedQuestion } from "./types/internal.ts";

export async function ask(question: ProcessedQuestion): Promise<string> {
  const { query, gaze, image } = question;

  // Heatmap generation
  // TODO - optimize this
  console.time("heatmap generation");
  const heatmap = new Heatmap(image);
  const original = heatmap.get("jpeg");
  heatmap.saveOnDisk(path.join("generated", `original-${Date.now()}.png`));
  await heatmap.generate(gaze);
  heatmap.saveOnDisk(path.join("generated", `heatmap-${Date.now()}.png`));
  console.timeEnd("heatmap generation");

  // LLM querying
  console.time("llm generation");
  const noMimeTypeOriginal = original.replace("data:image/jpeg;base64,", "");
  const noMimeTypeHeatmap = heatmap.get("jpeg").replace("data:image/jpeg;base64,", "");
  const answer = await assistant.prompt(query, noMimeTypeOriginal, noMimeTypeHeatmap);
  console.timeEnd("llm generation");
  return answer;
}
