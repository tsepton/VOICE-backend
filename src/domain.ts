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
  const gazeRepr = new Heatmap(image)
  const original = gazeRepr.get("jpeg");
  await gazeRepr.process(gaze);
  console.timeEnd(`gaze generation ${timestamp}`);

  // LLM querying
  console.time(`llm generation ${timestamp}`);
  const answer = await assistant.prompt(query, original, gazeRepr.get("jpeg"));
  console.timeEnd(`llm generation ${timestamp}`);
  return answer;
}

export async function askWithTextDescription(
  question: ProcessedQuestion,
): Promise<string> {

  console.time("textual description generation");
  const textualDescriptor = new Yolov8BasedImageDescription(question.image);
  await textualDescriptor.process(question.gaze);
  console.timeEnd("textual description generation");
  console.log(textualDescriptor.get());

  return Promise.resolve("Not implemented yet");
}
