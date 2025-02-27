import { WebSocketServer } from "ws";
import { default as Conversation } from "./domain.ts";
import { ConversationInfo } from "./types/exposed.ts";
import { tryCatch } from "./types/internal.ts";
import { processQuestion, retrieveConversation } from "./validators.ts";

export function initWebsocket(wss: WebSocketServer) {
  wss.on("connection", (ws, req) => {
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
          async (question) => {
            (await processQuestion(question)).match(
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

      // fixme - this is a type of message - don't know what exactly I was expecting when writing this
      // Will be implemented within #
      // ws.on("monitor", async (message) => {
      //   console.assert(conversation !== undefined);
      //   (await tryCatch(() => JSON.parse(message.toString()))).match(
      //     (error) => ws.send(JSON.stringify(error)),
      //     async (point) => {
      //       (await tryCatch(() => conversation!.addMonitoringData(point))).match(
      //         (error) => ws.send(JSON.stringify(error)),
      //         (answer) => ws.send(JSON.stringify(answer)) // TODO - define answer
      //       );
      //     }
      //   );
      // });

    } else ws.close(1002, "Invalid URL context");

    ws.on("close", () => {
      conversation?.saveOnDisk();
    });
  });
}
