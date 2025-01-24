import { WebSocketServer } from "ws";
import { default as Conversation } from "./domain.ts";
import { ChatInformation } from "./types/exposed.ts";
import { tryCatch } from "./types/internal.ts";
import { process } from "./validators.ts";

export function initWebsocket(wss: WebSocketServer) {

  wss.on("connection", (ws, req) => {
    console.log(`WebSocket connection established on context : ${req.url}`);
    let conversation: Conversation | undefined;

    if (req.url?.includes("/chat")) {
      // TODO - this should be moved in validators.ts
      const uuid: string | undefined = req.url.split("uuid=").splice(1).pop();

      if (!uuid) conversation = Conversation.new();
      else if (uuid.length > 0 && Conversation.exists(uuid))
        conversation = Conversation.load(uuid)!;
      else {
        ws.close(1002, `Invalid chat UUID: ${uuid}`);
        return;
      }
      const info: ChatInformation = {
        uuid: conversation.uuid,
        messages: conversation.messages.map((m) => JSON.stringify(m.content)),
      };
      ws.send(JSON.stringify(info));

      ws.on("message", async (message) => {
        console.assert(conversation !== undefined);
        (await tryCatch(() => JSON.parse(message.toString()))).match(
          (error) => ws.send(JSON.stringify(error)),
          async (question) => {
            (await process(question)).match(
              (error) => ws.send(JSON.stringify(error)),
              async (question) => {
                (await tryCatch(() => conversation!.ask(question))).match(
                  (error) => ws.send(JSON.stringify(error)),
                  (answer) => ws.send(JSON.stringify(answer))
                );
              }
            );
          }
        );
      });
    } else ws.close(1002, "Invalid URL context");

    ws.on("close", () => {
      conversation?.saveOnDisk();
    });
  });
}
