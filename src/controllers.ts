import { ToolCall } from "@langchain/core/messages/tool";
import { IncomingMessage as HTTPIncomingMessage } from "http";
import { v4 as uuidv4 } from "uuid";
import { ServerOptions, WebSocket, WebSocketServer } from "ws";
import { Conversation, RemoteExecution } from "./domain.ts";
import { HttpClientError, RequestTimeout } from "./types/errors.ts";
import {
  ClientToolCall,
  ConversationInfo,
  IncomingMessage,
  IncomingMessageType,
  OutgoingMessage,
} from "./types/exposed.ts";
import {
  Either,
  ProcessedInput,
  ProcessedQuestion,
  ProcessedToolCallResult,
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
      let conversation: Conversation | undefined;

      if (!req.url?.includes("/chat")) {
        ws.close(1002, "Invalid URL context");
        return;
      }

      const uuid: string | undefined = req.url.split("uuid=").splice(1).pop();

      conversation = retrieveConversation(
        uuid,
        this._remoteExecution(ws)
      ).match(
        (error) => {
          ws.close(1002, JSON.stringify(error));
          return undefined;
        },
        (conversation) => {
          const info: ConversationInfo = {
            uuid: conversation.uuid,
            type: "info",
          };
          ws.send(JSON.stringify(info));
          return conversation;
        }
      );

      if (!conversation) {
        ws.close(1002, "Invalid UUID");
        return;
      }

      ws.on("message", async (message) => {
        console.assert(conversation !== undefined);
        (
          await tryCatch(async () => {
            const json = JSON.parse(message.toString());
            return await this._handleMessage(json, conversation!, ws);
          })
        ).match(
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

  private async _handleMessage(
    json: IncomingMessage,
    conversation: Conversation,
    ws: WebSocket
  ): Promise<OutgoingMessage | undefined> {
    const data: Either<HttpClientError, ProcessedInput> = await process(json);

    if (data.isLeft()) {
      ws.send(JSON.stringify(data.left));
      return;
    }

    const processedInput = data.value;
    switch (json.type) {
      case IncomingMessageType.QUESTION:
        return conversation!.ask(processedInput as ProcessedQuestion);
      case IncomingMessageType.MONITORING:
        conversation!.addMonitoringData(data);
        break;
      case IncomingMessageType.TOOL_CALL_RESULT:
        const { id } = processedInput as ProcessedToolCallResult;
        this._activeClientToolCalls[id](
          processedInput as ProcessedToolCallResult
        );
        break;
    }
    return undefined;
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
