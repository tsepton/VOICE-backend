
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


export default undefined as any as Assistant;
