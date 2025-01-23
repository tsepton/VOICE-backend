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

}


// TODO - the factory should send the class to instance, not an object now, as they will have memory
const defaultAgent =
  process.env.USE_LOCAL === "false"
    ? OpenAIAgent
    : OllamaAssistant;

export default defaultAgent;
