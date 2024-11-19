import OllamaAssistant from "./ollama.ts";
import OpenAIAssistant from "./openai.ts";

export interface Assistant {}

export interface VisionBasedAssistant extends Assistant {
  /**
   * query : the user query
   * original : the original base64 string (with mimetype) jpg image
   * withGaze : the modified base64 string (with mimetype) jpg image that adds gaze data
   */
  prompt: (
    query: string,
    original: string,
    withGaze: string
  ) => Promise<string>;
}

export interface TextBasedAssistant extends Assistant {
  /**
   * query : the user query
   * gazedAt : All the objects that the user gazed at
   * pointedAt : All the objects that the user pointed at
   * otherObjects : All the other objects in the image which user did not gazed nor pointed at
   * 
   * Note :
   * pointedAt is based upon the GazePointAR pipeline. It is not used in the current implementation for now.
   */
  prompt: (
    query: string,
    gazedAt: string[],
    // pointedAt: string[],
    otherObjects: string[]
  ) => Promise<string>;
}

const factory: Assistant =
  process.env.USE_LOCAL === "false"
    ? new OpenAIAssistant()
    : new OllamaAssistant();

export default factory;
