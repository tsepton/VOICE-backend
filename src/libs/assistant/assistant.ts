import OllamaAssistant from "./ollama.ts";
import OpenAIAssistant from "./openai.ts";

export interface Assistant {
  prompt: (query: string, original: string, heatmap: string) => Promise<string>;
}


const factory: Assistant = process.env.USE_LOCAL === 'false'
  ? new OpenAIAssistant()
  : new OllamaAssistant();

export default factory;
