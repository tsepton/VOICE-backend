import OllamaAssistant from "./ollama.ts";

export interface Assistant {
  prompt: (query: string, original: string, heatmap: string) => Promise<string>;
}

const factory: Assistant = new OllamaAssistant();

export default factory;
