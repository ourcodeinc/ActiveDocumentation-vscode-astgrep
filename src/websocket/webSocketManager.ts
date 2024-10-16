import * as ws from "ws";

import { WebSocketConstants } from "./WebSocketConstants";

/**
 * Opens a WebSocket server on a given port
 * @param port typically retrieved from config.ts
 * @returns the server
 * @ignore Testing common API calls is not necessary.
 */
export const webSocketManger = (port: number): ws.Server => {
  const server = new ws.Server({ port });
  console.log(`WebSocket server started on port: ${port}`);

  server.on("connection", (ws) => {
    console.log("Client connected");


    (async () => {
      ws.send(JSON.stringify({
        command: WebSocketConstants.SEND_ENTER_CHAT_MSG,
        data: "IDE is connected to ActiveDocumentation",
      }));
    })().catch((error) => console.error("Error in WebSocket connection handler:", error));

    ws.on("message", (message: string) => {
      console.log(`Received message: ${message}`);
    });

    ws.on("error", (error) => {
      console.error(`WebSocket error: ${error}`);
    });

    ws.on("close", () => {
      console.log("Client disconnected");
    });
  });

  return server;
};
