import { ToolCall } from "@langchain/core/messages/tool";
import { IncomingMessage as HTTPIncomingMessage } from "http";
import { v4 as uuidv4 } from "uuid";
import { RawData, ServerOptions, WebSocket, WebSocketServer } from "ws";
import { Conversation, RemoteExecution } from "./domain.ts";
import { CommunicationError, RequestTimeout } from "./types/errors.ts";
import {
  ClientToolCall,
  ConversationInfo,
  IncomingMessageType,
  OutgoingMessage,
} from "./types/exposed.ts";
import {
  Either,
  ProcessedInput,
  ProcessedMonitoringData,
  ProcessedQuestion,
  ProcessedToolCallResult,
  ProcessedToolRegistration,
  tryCatch,
  UUID,
} from "./types/internal.ts";
import { process, retrieveConversation } from "./validators.ts";

export class VOICEServer<
  T extends typeof WebSocket.WebSocket = typeof WebSocket.WebSocket,
  U extends typeof HTTPIncomingMessage = typeof HTTPIncomingMessage
> extends WebSocketServer {
  private _activeClientToolCalls: Record<
    UUID,
    (response: ProcessedToolCallResult) => void
  > = {};

  constructor(options?: ServerOptions<T, U>, callback?: () => void) {
    super(options, callback);
  }

  public initWebsocket() {
    this.on("connection", (ws: WebSocket, req: HTTPIncomingMessage) => {
      console.log(`WebSocket connection established on context : ${req.url}`);

      if (!req.url?.includes("/chat")) {
        ws.close(1002, "Invalid URL context");
        return;
      }

      const uuid: string | undefined = req.url.split("uuid=").splice(1).pop();
      const maybeConv = retrieveConversation(uuid, this._remoteExecution(ws));

      if (maybeConv.isLeft()) {
        ws.close(1002, maybeConv.error.message);
        return;
      }

      const conversation = maybeConv.value;
      const info: ConversationInfo = {
        uuid: conversation.uuid,
        type: "info",
      };
      ws.send(JSON.stringify(info));

      ws.on("message", async (message) => {
        (await this._handleMessage(message, conversation)).match(
          (error) => ws.send(JSON.stringify(error)),
          (answer: undefined | OutgoingMessage) => {
            if (!!answer) ws.send(JSON.stringify(answer));
          }
        );
      });

      ws.on("close", () => {
        conversation?.saveOnDisk();
      });
    });
  }

  private _handleMessage(
    message: RawData,
    conversation: Conversation
  ): Promise<Either<CommunicationError, OutgoingMessage | undefined>> {
    // try
    const handler = async (): Promise<undefined | OutgoingMessage> => {
      const json = JSON.parse(message.toString());
      const processedInput: ProcessedInput = (await process(json)).value; // Beware !

      switch (json.type) {
        case IncomingMessageType.QUESTION:
          const question = processedInput as ProcessedQuestion;
          return conversation!.ask(question);
        case IncomingMessageType.MONITORING:
          const data = processedInput as ProcessedMonitoringData;
          conversation!.addMonitoringData(data);
          return;
        case IncomingMessageType.TOOL_CALL_RESULT:
          const { id } = processedInput as ProcessedToolCallResult;
          this._activeClientToolCalls[id](
            processedInput as ProcessedToolCallResult
          );
          return;
        case IncomingMessageType.TOOL_REGISTRATION:
          const tools = processedInput as ProcessedToolRegistration;
          conversation!.addTool(tools);
          return;
      }
    };

    // catch
    return tryCatch(handler);
  }

  private _remoteExecution(ws: WebSocket): RemoteExecution {
    const execution: RemoteExecution = (tool: ToolCall) => {
      const requestId = uuidv4();

      const message: ClientToolCall = {
        type: "tool_call",
        id: uuidv4(),
        name: tool.name,
        args: tool.args,
      };

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.error(`Timeout for ${requestId}`);
          reject(new RequestTimeout(`Timeout for tool call ${requestId}`));
        }, 5000);
        this._activeClientToolCalls[message.id] = (result) => {
          clearTimeout(timeout);
          resolve(result);
        };
        ws.send(JSON.stringify(message));
      });
    };
    return execution;
  }
}
