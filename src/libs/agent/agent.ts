import { BaseMessage } from "@langchain/core/messages";
import { RemoteExecutor } from "../executor/remote.ts";
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

export function getAgent(name?: string) {
  switch (name) {
    case "OllamaAgent":
      return new OllamaAssistant(new RemoteExecutor());
    case "OpenAIAgent":
      return new OpenAIAgent(new RemoteExecutor());
    default:
      console.warn(`Agent ${name} not found, using default agent.`);
      return new defaultAgent(new RemoteExecutor());
  }
}

export default defaultAgent;
