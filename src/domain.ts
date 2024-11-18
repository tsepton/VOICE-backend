import assistant from "./libs/assistant/assistant.ts";
import Heatmap from "./libs/gaze/heatmap.ts";
import Pointer from "./libs/gaze/pointer.ts";
import { ProcessedQuestion } from "./types/internal.ts";

export async function askWithHeatmap(
  question: ProcessedQuestion
): Promise<string> {
  return ask(question, GazeRepresentation.HEATMAP);
}

async function ask(
  question: ProcessedQuestion,
  representation: GazeRepresentation
): Promise<string> {
  const timestamp = Date.now();
  const { query, gaze, image } = question;

  // Gaze representation generation
  console.time(`gaze generation ${timestamp}`);
  const gazeRepr =
    representation === GazeRepresentation.HEATMAP
      ? new Heatmap(image)
      : new Pointer(image);
  const original = gazeRepr.get("jpeg");
  await gazeRepr.generate(gaze);
  console.timeEnd(`gaze generation ${timestamp}`);

  // LLM querying
  console.time(`llm generation ${timestamp}`);
  const answer = await assistant.prompt(query, original, gazeRepr.get("jpeg"));
  console.timeEnd(`llm generation ${timestamp}`);
  return answer;
}

export enum GazeRepresentation {
  HEATMAP = "heatmap",
  POINTER = "pointer",
}
