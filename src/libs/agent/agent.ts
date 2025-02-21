import { BaseMessage } from "@langchain/core/messages";
import OllamaAssistant from "./ollama.ts";
import OpenAIAgent from "./openai.ts";

export interface Agent {
  /**
   * query : the user query
   * original : the original base64 string (with mimetype) jpg image
   * withGaze : the modified base64 string (with mimetype) jpg image that adds gaze data
   */
  prompt: (
    query: string,
    original: string,
    withGaze: string,
    history: BaseMessage[]
  ) => Promise<BaseMessage[]>;

  readonly name: string;
}

const defaultAgent =
  process.env.USE_LOCAL === "false" ? OpenAIAgent : OllamaAssistant;

export function getAgent(name: string) {
  switch (name) {
    case "OllamaAgent":
      return new OllamaAssistant();
    case "OpenAIAgent":
      return new OpenAIAgent();
    default:
      console.warn(`Agent ${name} not found, using default agent.`);
      return new defaultAgent();
  }
}

export default defaultAgent;
