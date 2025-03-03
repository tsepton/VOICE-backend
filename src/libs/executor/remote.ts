import { ToolCall } from "@langchain/core/messages/tool";
import { Executor } from "./executor.ts";

export class RemoteExecutor implements Executor {
  async run(tool: ToolCall): Promise<string> {
    // TODO
    console.log(`Running function ${tool.name} with input ${tool.args}`);
    return Promise.resolve("Weather in New York is sunny");
  }
}
