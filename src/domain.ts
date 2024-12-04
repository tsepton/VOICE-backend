import assistant from "./libs/assistant/assistant.ts";
import { Yolov8BasedImageDescription } from "./libs/gaze/descriptor.ts";
import Heatmap from "./libs/gaze/heatmap.ts";
import { ProcessedQuestion } from "./types/internal.ts";

export async function askWithHeatmap(
  question: ProcessedQuestion,
): Promise<string> {
  const timestamp = Date.now();
  const { query, gaze, image } = question;

  // Gaze representation generation
  console.time(`gaze generation ${timestamp}`);
  const gazeRepresentation = new Heatmap(image)
  const original = gazeRepresentation.get("jpeg");
  await gazeRepresentation.process(gaze);
  console.timeEnd(`gaze generation ${timestamp}`);

  // LLM querying
  console.time(`llm generation ${timestamp}`);
  const answer = await assistant.vision.prompt(query, original, gazeRepresentation.get("jpeg"));
  console.timeEnd(`llm generation ${timestamp}`);
  return answer;
}

export async function askWithTextDescription(
  question: ProcessedQuestion,
): Promise<string> {
  const timestamp = Date.now();
  const { query, gaze, image } = question;

   // Gaze representation textual description
   console.time("textual description generation");
  const textualDescriptor = new Yolov8BasedImageDescription(image);
  await textualDescriptor.process(gaze);
  console.timeEnd("textual description generation");

  // LLM querying
  console.time(`llm generation ${timestamp}`);
  const gazedAt = textualDescriptor.get();
  const otherObjects = textualDescriptor.getAllOther();
  const answer = await assistant.textual.prompt(query, gazedAt, otherObjects);
  console.timeEnd(`llm generation ${timestamp}`);
  return answer;
}
