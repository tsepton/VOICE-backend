import { BaseMessage } from "@langchain/core/messages";
import { v4 as uuidv4 } from "uuid";

export class Conversation {
  public static load(uuid: string): Conversation {
    if (!this.exists(uuid))
      throw new Error("The specified conversation does not exist.");

    const messages: BaseMessage[] = []; // TODO - load messages from disk
    return this.constructor(uuid, messages);
  }

  public static create(): string {
    const uuid = uuidv4();
    if (this.exists(uuid)) return this.create();
    else return this.constructor(uuid, []);
  }

  public static exists(uuid: string): boolean {
    throw new Error("TODO - not implemented yet");
  }

  public readonly uuid: string;

  private _messages: BaseMessage[] = [];

  private constructor(uuid: string, messages: BaseMessage[]) {
    this.uuid = uuid;
    this._messages = messages;
  }

  public append(messages: BaseMessage[]): void {
    this._messages.push(...messages);
  }

  public replace(messages: BaseMessage[]): void {
    this._messages = messages;
  }

  public save(): void {
    throw new Error("TODO - Not implemented yet");
  }

  public get messages(): BaseMessage[] {
    return this._messages;
  }
}
