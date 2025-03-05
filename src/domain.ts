import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { Agent, getAgent } from "./libs/agent/agent.ts";
// import { RemoteExecutor } from "./libs/executor/remote.ts";
import { ToolCall } from "@langchain/core/messages/tool";
import Heatmap from "./libs/gaze/heatmap.ts";
import { Answer } from "./types/exposed.ts";
import { ProcessedQuestion, ProcessedToolCallResult, UUID } from "./types/internal.ts";



export type RemoteExecution = (toolCall: ToolCall) => Promise<ProcessedToolCallResult>;

export class Conversation {
  public readonly uuid: UUID;

  private _agent: Agent;

  private _messages: BaseMessage[] = [];

  // TODO : load new exists and saveOnDisk should be inherited and therefore separated
  public static load(uuid: string, remoteExecution: RemoteExecution): Conversation {
    if (!this.exists(uuid)) throw new Error("Invalid UUID");

    const file = fs.readFileSync(`generated/${uuid}.json`, "utf8");
    const { agent: agentName, messages }: ConversationTxt = JSON.parse(file);
    
    console.log(`${uuid} loaded.`);
    return new Conversation(uuid, getAgent(remoteExecution, agentName), messages);
  }

  public static new(remoteExecution: RemoteExecution): Conversation {
    const uuid = uuidv4();
    if (this.exists(uuid)) return this.new(remoteExecution);
    else return new Conversation(uuid, getAgent(remoteExecution), []);
  }

  public static exists(uuid: UUID): boolean {
    return fs.existsSync(`generated/${uuid}.json`);
  }

  public saveOnDisk(): void {
    const directory = `generated`;
    const file = `${directory}/${this.uuid}.json`;
    if (!fs.existsSync(directory)) fs.mkdirSync(directory);
    fs.writeFile(file, this.serialized, (err) => {
      if (err) console.log(err);
      else console.log(`${this.uuid} saved.`);
    });
  }

  private constructor(uuid: UUID, agent: Agent, messages: BaseMessage[]) {
    this.uuid = uuid;
    this._agent = agent;
    this._messages = messages;
  }

  async ask(question: ProcessedQuestion): Promise<Answer> {
    const timestamp = Date.now();
    const { query, gaze, image } = question;

    // TODO : This should set by the client - keeping it for debugging for now
    this._agent.addTool(
      "getWeather",
      "Get the weather of a given place",
      async (place: string) => {
        console.log("\n \n \n tool was called ! !\n\n\n");
        return place + " is sunny";
      }
    );

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
      [original, gazeRepresentation.get("jpeg")],
      this._messages
    );
    console.timeEnd(`llm generation ${timestamp}`);

    const lastMessage = this._messages[this._messages.length - 1];
    const text = lastMessage.content as string;
    return { text, type: "answer" };
  }

  addMonitoringData(data: any): void {
    // should be a defined type shared with frontend

    // TODO - not sure we will use the heatmap representation
    // const images = [data.original, data.heatmap].map((uri) => ({
    //   type: "image_url",
    //   image_url: {
    //     url: uri,
    //   },
    // }));

    const updatedQuery = [
      `TODO.`,
    ].join("\n\n");

    const message = new HumanMessage({
      content: [
        {
          type: "text",
          text: updatedQuery,
        },
        // ...images,
      ],
    });

    this._messages.push(message); // TODO
  }

  public get serialized(): string {
    return JSON.stringify({
      uuid: this.uuid,
      agent: this._agent.name,
      messages: this._messages ?? [],
    });
  }

  public get messages(): BaseMessage[] {
    return this._messages;
  }
}

type ConversationTxt = { agent: string; uuid: string; messages: BaseMessage[] };
