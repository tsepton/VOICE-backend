import { IncomingMessage } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { default as Conversation } from "./domain.ts";
import { HttpClientError } from "./types/errors.ts";
import { BaseMessage, ConversationInfo } from "./types/exposed.ts";
import {
  Either,
  ProcessedInput,
  ProcessedMonitoringData,
  ProcessedQuestion,
  tryCatch,
} from "./types/internal.ts";
import { process, retrieveConversation } from "./validators.ts";

export function initWebsocket(wss: WebSocketServer) {
  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    console.log(`WebSocket connection established on context : ${req.url}`);
    let conversation: Conversation | undefined;

    if (req.url?.includes("/chat")) {
      const uuid: string | undefined = req.url.split("uuid=").splice(1).pop();

      conversation = retrieveConversation(uuid).match(
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

      ws.on("message", async (message) => {
        console.assert(conversation !== undefined);
        (await tryCatch(() => JSON.parse(message.toString()))).match(
          (error) => ws.send(JSON.stringify(error)),
          (json) => handleMessage(json, conversation!, ws)
        );
      });
    } else ws.close(1002, "Invalid URL context");

    ws.on("close", () => {
      conversation?.saveOnDisk();
    });
  });
}

async function ask(
  question: ProcessedQuestion,
  conversation: Conversation,
  ws: WebSocket
) {
  (await tryCatch(() => conversation!.ask(question))).match(
    (error) => ws.send(JSON.stringify(error)),
    (answer) => ws.send(JSON.stringify(answer))
  );
}

async function monitor(
  data: ProcessedMonitoringData,
  conversation: Conversation,
  ws: WebSocket
) {
  (await tryCatch(() => conversation!.addMonitoringData(data))).match(
    (error) => ws.send(JSON.stringify(error)),
    (answer) => ws.send(JSON.stringify(answer))
  );
}

async function handleMessage(
  json: BaseMessage,
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
    case "question":
      ask(data as ProcessedQuestion, conversation, ws);
      break;
    case "monitoring":
      monitor(data as ProcessedMonitoringData, conversation, ws);
      break;
  }
}
