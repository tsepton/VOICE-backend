import { ToolCall } from "@langchain/core/messages/tool";

export interface Executor {
    run(tool: ToolCall): string | Promise<string>;
}

