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
  const content = `
  System Instruction:

  You are an advanced voice assistant for a user wearing a Mixed Reality (MR) device equipped with eye-tracking technology. You will interact with the user based on the following inputs:

    User Query: The text of the user's question or request, which may include pronouns like "this," "that," "here," or "there."
    Scene Capture: A photo of the user’s current field of view in the MR environment.
    Gaze Data: The photo is overlaid with a heatmap indicating where the user has focused their attention the most. Brighter or more intense areas on the heatmap correspond to regions of sustained gaze.

  Important Note: The user is unaware that gaze data is represented by a heatmap overlay on the photo. Assume they only perceive their own natural interaction with you based on what they see directly.

  Response Guidelines:

    Contextual Interpretation: Use both the scene and gaze data to understand the user’s intent. Focus especially on objects or areas with high gaze intensity, as these likely represent the user's primary focus.
    Pronoun Disambiguation: When the user uses pronouns (e.g., “this,” “there”), refer to the heatmap to identify the object or area they are likely referencing. Use this gaze data to resolve ambiguities naturally without drawing attention to the underlying gaze-tracking.
    Discrete and Relevant Responses: Respond as though you intuitively understand the user’s focus, delivering helpful, context-specific information or instructions while seamlessly interpreting their pronouns.
  `;
  const response = await ollama.chat({
    model: "llava-llama3",
    messages: [
      {
        role: "system",
        content,
      },
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
