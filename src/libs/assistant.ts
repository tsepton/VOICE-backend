import ollama, { Message } from "ollama";
import { InternalServerError } from "../types/errors.ts";

enum VisionModel {
  moondream = "moondream",
  llava_llama3 = "llava-llama3",
  llama32_vision = "llama3.2-vision",
  bakllava = "bakllava",
}

export interface Assistant {
  prompt: (query: string, original: string, heatmap: string) => Promise<string>;
  model: VisionModel;
}

class ChainOfThoughtPrompting implements Assistant {
  constructor(public model: VisionModel, public system: string) {}

  public async prompt(
    query: string,
    original: string,
    heatmap: string
  ): Promise<string> {
    type Question = { role: string; content: string; images?: string[] };

    // TODO this should be generic -> constructor arugment
    const queries: Question[] = [
      {
        role: "system",
        content: `Analyze the image with the heatmap overlay to identify key elements or objects in focus. Based on heatmap intensity, list the most visually prominent items or regions from highest to lowest focus. Describe each element briefly, noting any contextual clues (e.g., faces, text, bright colors) that might explain why attention was drawn there.`,
      },
      {
        role: "system",
        content: `Interpret the question provided, especially focusing on the pronouns (e.g., 'it,' 'this,' 'them'). Based on the heatmap data, hypothesize what each pronoun might be referencing in the image. Use gaze intensity and position in the heatmap as clues to match pronouns to the most relevant objects or areas in focus.`,
      },
      {
        role: "system",
        content: `Map the heatmap patterns to the pronouns in the question. For each pronoun, identify the gaze pattern and any sequential shifts in focus that might indicate what the user was looking at or considering. Include insights on why certain objects or areas may have held the user's attention based on visual patterns in the heatmap.`,
      },
      {
        role: "system",
        content: `Considering the overall gaze patterns and focal points identified in the heatmap, infer the user’s possible intent or focus in the question. Determine if the user might be comparing objects, seeking information, or responding to something visually striking. Describe any contextual reasoning that would explain why the user’s gaze followed this specific pattern in relation to the question.`,
      },
      {
        role: "system",
        content: `Using the identified elements from the heatmap and inferred references from the pronouns, construct a response to the question. Ensure that each pronoun reference is clearly matched to its likely visual focus. Provide any additional context needed to explain why these areas of the image might be relevant to the user’s question. If the image alone doesn’t fully resolve the question, suggest potential clarifying questions.`,
      },
    ];

    let history: Message[] = [
      {
        role: "system",
        content: this.system,
      },
      {
        role: "user",
        content: query,
        images: [original, heatmap],
      },
    ];

    for (const queryStep of queries) {
      try {
        const response = await ollama.chat({
          model: this.model,
          messages: [...history, queryStep],
        });

        console.log(response.message.content);

        history.push(queryStep, {
          role: "assistant",
          content: response.message.content,
        });
      } catch (error) {
        console.error("Error during Ollama API call:", error);
        throw new InternalServerError("Error during Ollama API call", error);
      }
    }

    return history[history.length - 1].content;
  }
}

class ZeroShotPrompting implements Assistant {
  public constructor(public model: VisionModel, public system: string) {}

  public async prompt(
    query: string,
    original: string,
    heatmap: string
  ): Promise<string> {
    try {
      const response = await ollama.chat({
        model: this.model,
        messages: [
          {
            role: "system",
            content: this.system,
          },
          {
            role: "user",
            content: query,
            images: [original, heatmap],
          },
        ],
      });

      return response.message.content;
    } catch (error) {
      console.error("Error during Ollama API call:", error);
      throw new InternalServerError("Error during Ollama API call", error);
    }
  }
}

// const context = `
// Instructions:
//     You are an advanced voice assistant for a user wearing headset equipped with eye-tracking technology. You will interact with the user based on the following inputs:

//     User Query: The user's question or request, which may include pronouns like "this," "that," "here," or "there."
//     Scene Capture: The user’s current field of view. It is what he sees right now, not a printed picture.
//     Augmented Scene Capture: Modified scene capture, which has been overlaid with a heatmap indicating where the user has focused their attention the most while asking their query. Brighter or more intense areas on the heatmap correspond to regions of sustained gaze.

// Response Guidelines:
//     Contextual Interpretation: Use the two scenes to understand the user’s query and to answer it. Focus especially on objects or areas with high gaze intensity, as these likely represent the user's primary focus.
//     Pronoun Disambiguation: When the user uses pronouns (e.g., “this,” “there”), refer to the overlaid heatmap to identify the object or area they are likely referencing. The heatmap is important for pronoun disambiguation, as what the pronouns reference might not be what is most visually prominent! 
//     Natural Answer: Keep your answer as short and concise as possible while still answering user's question. User does not know about the scene capture and the gaze data, do not mention their existence, have a natural and short answer.
// `;

const context = `
You are my voice assistant. I am a user wearing an Augmented Reality headset equipped with eye-tracking technology. You will answer my question and have a natural conversation with me. 

Every message following this one will be me asking you a question.
You will use the scene capture (first image) and the augmented scene capture (second image, which is the scene capture with an heatmap overlay describing what I was looking at when using pronouns) to understand my question and provide me with the best answer. You will not mention the scene capture or the heatmap in your response.

You will provide me with a natural and concise answer. Do not describe the scene I am looking at, just answer my question.
`

const zeroShot = new ZeroShotPrompting(VisionModel.moondream, context);
const chainOfThought = new ChainOfThoughtPrompting(
  VisionModel.bakllava, // FIXME - llama32_vision does not support multiple images at a time
  context
);

export default zeroShot;
