import { BaseMessage } from "@langchain/core/messages";
import { RemoteExecution } from "../../domain.ts";
import OllamaAssistant from "./ollama.ts";
import OpenAIAgent from "./openai.ts";

export interface Agent {
  /**
   * query : the user query
   * original : the original base64 string (with mimetype) jpg image
   * withGaze : the modified base64 string (with mimetype) jpg image that adds gaze data
   * 
   * Return value is the history with the generated response appended.
   */
  prompt: (
    query: string,
    images: Base64URLString[],
    history: BaseMessage[]
  ) => Promise<BaseMessage[]>;

  addTool: (
    name: string,
    description: string,
    fn: (str: string) => Promise<string>
  ) => void;

  readonly name: string;
}

const defaultAgent =
  process.env.USE_LOCAL === "false" ? OpenAIAgent : OllamaAssistant;

export function getAgent(executor: RemoteExecution, name?: string) {
  switch (name) {
    case "OllamaAgent":
      return new OllamaAssistant(executor);
    case "OpenAIAgent":
      return new OpenAIAgent(executor);
    default:
      console.warn(`Agent ${name} not found, using default agent.`);
      return new defaultAgent(executor);
  }
}

export default defaultAgent;
