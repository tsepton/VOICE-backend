import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { ToolCall } from "@langchain/core/messages/tool";
import { DynamicTool } from "@langchain/core/tools";
import { Executor } from "../executor/Executor.ts";
import { Agent } from "./agent.ts";

export abstract class ReActAgent implements Agent {
  public abstract name: string;

  protected abstract _llm: BaseChatModel;

  protected abstract _system: string;

  protected _tools: DynamicTool[] = [];

  protected get _llmWithTools() {
    return this._llm.bindTools!(this._tools ?? []);
  }

  constructor(protected _executor: Executor) {}

  public addTool(
    name: string,
    description: string,
    fn: (str: string) => Promise<string>
  ): void {
    const tool = new DynamicTool({
      name,
      description,
      func: fn,
    });
    this._tools.push(tool);
  }

  public async prompt(
    userQuestion: string | undefined,
    images: Base64URLString[] = [],
    // original: string,
    // heatmap: string,
    history: BaseMessage[] = []
  ): Promise<BaseMessage[]> {
    const messages: BaseMessage[] = this.formatMessages(
      userQuestion,
      images,
      history
    );
    const answer: AIMessage = await this._llmWithTools.invoke(messages);

    if (!answer.tool_calls?.length) return [...messages, answer];

    const outputs = (
      await Promise.all(
        answer.tool_calls.map(async (call: ToolCall) => {
          console.log(`Tool ${call.name} result loading...`);
          return { call, output: await this._executor.run(call) };
        })
      )
    ).map(({ call, output }) => new ToolMessage(output, call.id!, call.name));

    if (!outputs.length) throw new Error("No outputs from tools");
    return this.prompt(undefined, [], [...messages, answer, ...outputs]);
  }

  private formatMessages(
    question: string | undefined,
    images: Base64URLString[],
    history: BaseMessage[]
  ): BaseMessage[] {
    if (!question) return history;

    const updatedQuery = [
      `The user asked "${question}" `,
      `To help you answer this question, you may need `,
      `1. to use the two images below, `,
      `2. to use chat history, `,
      `3. to use available tools. `,
    ].join("\n");

    const previous = history.length
      ? history
      : [
          new SystemMessage({
            content: this._system,
          }),
        ];

    const user = new HumanMessage({
      content: [
        {
          type: "text",
          text: updatedQuery,
        },
        ...images.map((uri) => ({
          type: "image_url",
          image_url: {
            url: uri,
          },
        })),
      ],
    });

    return !!question ? [...previous, user] : previous;
  }
}
