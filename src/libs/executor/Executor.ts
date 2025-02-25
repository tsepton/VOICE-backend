import { ToolCall } from "@langchain/core/messages/tool";


export interface Executor {
    run(tool: ToolCall): string | Promise<string>;
}


export class RemoteExecutor implements Executor {
    async run(tool: ToolCall): Promise<string> {
        // TODO
        console.log(`Running function ${tool.name} with input ${tool.args}`);
        return Promise.resolve("Weather in New York is sunny");
    }
}
