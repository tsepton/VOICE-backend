import { ToolCall } from "@langchain/core/messages/tool";
import { IncomingMessage as HTTPIncomingMessage } from "http";
import { v4 as uuidv4 } from "uuid";
import { ServerOptions, WebSocket, WebSocketServer } from "ws";
import { Conversation, RemoteExecution } from "./domain.ts";
import { HttpClientError } from "./types/errors.ts";
import {
  ClientToolCall,
  ConversationInfo,
  IncomingMessage,
  IncomingMessageType,
} from "./types/exposed.ts";
import {
  Either,
  ProcessedInput,
  ProcessedMonitoringData,
  ProcessedQuestion,
  tryCatch,
  UUID,
} from "./types/internal.ts";
import { process, retrieveConversation } from "./validators.ts";

export class VOICEServer<
  T extends typeof WebSocket.WebSocket = typeof WebSocket.WebSocket,
  U extends typeof HTTPIncomingMessage = typeof HTTPIncomingMessage
> extends WebSocketServer {
  private _activeClientToolCalls: Record<UUID, (response: string) => void> = {};

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
        (await tryCatch(() => JSON.parse(message.toString()))).match(
          (error) => ws.send(JSON.stringify(error)),
          (json) => this._handleMessage(json, conversation!, ws)
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
  ) {
    const processedInput: Either<HttpClientError, ProcessedInput> =
      await process(json);

    if (processedInput.isLeft()) {
      ws.send(JSON.stringify(processedInput.left));
      return;
    }

    const data = processedInput.value;
    switch (json.type) {
      case IncomingMessageType.QUESTION:
        this._ask(data as ProcessedQuestion, conversation, ws);
        break;
      case IncomingMessageType.MONITORING:
        this._monitor(data as ProcessedMonitoringData, conversation, ws);
        break;
      case IncomingMessageType.TOOL_CALL_RESULT:
        const { id, output } = data as { id: UUID; output: string };
        // ws.send(JSON.stringify({ id, output }));
        break;
    }
  }

  private async _ask(
    question: ProcessedQuestion,
    conversation: Conversation,
    ws: WebSocket
  ) {
    (await tryCatch(() => conversation!.ask(question))).match(
      (error) => ws.send(JSON.stringify(error)),
      (answer) => ws.send(JSON.stringify(answer))
    );
  }

  private async _monitor(
    data: ProcessedMonitoringData,
    conversation: Conversation,
    ws: WebSocket
  ) {
    (await tryCatch(() => conversation!.addMonitoringData(data))).match(
      (error) => ws.send(JSON.stringify(error)),
      (answer) => ws.send(JSON.stringify(answer))
    );
  }

  private _remoteExecution(ws: WebSocket): RemoteExecution {
    const requestId = uuidv4();

    const execution: RemoteExecution = (tool: ToolCall) => {
      const message: ClientToolCall = {
        type: "tool_call",
        id: uuidv4(),
        name: tool.name,
        args: tool.args,
      };

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.error(`Timeout for ${requestId}`);
          reject(new Error(`Timeout for tool call ${requestId}`));
        }, 5000);

        const onResponse = (response: string) => {
          clearTimeout(timeout);
          console.log(`Tool call response received ${requestId}: ${response}`);

          // TODO response is a string and should be parsed and sanitized

          resolve({ value: response });
        };

        ws.once(`tool_call_result_${requestId}`, onResponse);
        ws.send(JSON.stringify(message));
      });
    };
    return execution;
  }
}
