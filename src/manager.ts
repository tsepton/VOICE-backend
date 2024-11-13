import path from "path";
import assistant from "./libs/assistant.ts";
import Heatmap from "./libs/heatmap.ts";
import { ProcessedQuestion } from "./types/internal.ts";

// TODO - return type
export async function ask(question: ProcessedQuestion): Promise<string> {
  const { query, gaze, image } = question;

  // Heatmap generation
  // TODO - optimize this
  console.time("heatmap generation");
  const heatmap = new Heatmap(image);
  await heatmap.generate(gaze);
  heatmap.saveOnDisk(path.join("generated", `heatmap-${Date.now()}.png`));
  console.timeEnd("heatmap generation");

  // LLM querying
  console.time("llm generation");
  const noMimeType = heatmap.get("jpeg").replace("data:image/jpeg;base64,", "");
  const answer = await assistant.prompt(noMimeType, query);
  console.timeEnd("llm generation");
  return answer;
}
