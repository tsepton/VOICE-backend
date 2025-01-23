import { BaseMessage } from "@langchain/core/messages";
import { v4 as uuidv4 } from "uuid";
import defaultAgent, { Agent } from "./libs/agent/agent.ts";
import Heatmap from "./libs/gaze/heatmap.ts";
import { ProcessedQuestion } from "./types/internal.ts";

export default class Conversation {
  public readonly uuid: string;

  private _agent: Agent;

  private _messages: BaseMessage[] = [];

  public static load(uuid: string): Conversation {
    if (!this.exists(uuid)) throw new Error("Invalid UUID");

    const agent = new defaultAgent(); // TODO - load the agent that was specified, should be saved on disk
    const messages: BaseMessage[] = []; // TODO - load messages from disk
    return this.constructor(uuid, messages, agent);
  }

  public static new(): Conversation {
    const uuid = uuidv4();
    if (this.exists(uuid)) return this.new();
    else return this.constructor(uuid, [], new defaultAgent());
  }

  public static exists(uuid: string): boolean {
    throw new Error("TODO - not implemented yet");
  }

  private constructor(uuid: string, agent: Agent, messages: BaseMessage[]) {
    this.uuid = uuid;
    this._agent = agent;
    this._messages = messages;
  }

  async ask(question: ProcessedQuestion): Promise<string> {
    const timestamp = Date.now();
    const { query, gaze, image } = question;

    // Gaze representation generation
    console.time(`gaze generation ${timestamp}`);
    const gazeRepresentation = new Heatmap(image);
    const original = gazeRepresentation.get("jpeg");
    await gazeRepresentation.process(gaze);
    console.timeEnd(`gaze generation ${timestamp}`);

    // LLM querying
    console.time(`llm generation ${timestamp}`);
    this._messages = await this._agent.prompt(
      query,
      original,
      gazeRepresentation.get("jpeg"),
      this._messages
    );
    console.timeEnd(`llm generation ${timestamp}`);

    const lastMessage = this._messages[this._messages.length - 1];
    return lastMessage.content as string;
  }

  public saveOnDisk(): void {
    throw new Error("TODO - Not implemented yet");
  }

  public get messages(): BaseMessage[] {
    return this._messages;
  }
}
