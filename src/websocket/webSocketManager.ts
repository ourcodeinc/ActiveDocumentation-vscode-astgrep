// eslint-disable-next-line @typescript-eslint/naming-convention
import * as WebSocket from "ws";

export class WebSocketManager {
    public server: WebSocket.Server;
    public clients: Set<WebSocket>;
    public messageQueue: { [key: string]: string | null };

    constructor(port: number) {
        this.clients = new Set<WebSocket>();
        this.messageQueue = {};
        this.server = new WebSocket.Server({ port });

        console.log("WebSocket.ts:", `WebSocket server started on port: ${port}`);
        this.server.on("connection", (ws: WebSocket) => this.onConnection(ws));
    }

    /**
   * Handle new client connections
   * @param ws
   */
    private onConnection(ws: WebSocket): void {
        console.log("Client connected");
        this.clients.add(ws);
        this.sendQueuedMessagesToClient(ws);

        ws.on("message", (message: string) => {
            console.log("WebSocket.ts:", `Received message: ${message}`);
        });

        ws.on("error", (error) => {
            console.error("WebSocket.ts:", `WebSocket error: ${error}`);
        });

        ws.on("close", () => {
            console.log("WebSocket.ts:", "Client disconnected");
            this.clients.delete(ws);
        });
    }

    public sendQueuedMessagesToClient(ws: WebSocket): void {
        if (ws.readyState === WebSocket.OPEN) {
            Object.keys(this.messageQueue).forEach((key: string) => {
                const message = this.messageQueue[key];
                if (message !== null) {
                    ws.send(message);
                    console.log("WebSocketManager:", "sendQueuedMessagesToClient sent message", message);
                }
            });
        }
    }

    private sendMessagesToAllClients(): void {
        this.clients.forEach((client) => {
            this.sendQueuedMessagesToClient(client);
        });
    }

    private sendMessageToClient(ws: WebSocket, message: string): void {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(message);
            console.log("WebSocketManager:", "sendMessageToClient sent message", message);
        }
    }

    /**
     * Send a message to all clients
     * @param message
     */
    public broadcast(message: string): void {
        this.clients.forEach((client) => {
            this.sendMessageToClient(client, message);
        });
    }

    /**
   * add a message to the queue and send it if clients are connected
   * @param {string} message
   */
    public queueMessage(key: string, message: string): void {
        this.messageQueue[key] = message;
        this.sendMessagesToAllClients();
    }

    /**
   * Method to close the WebSocket server and all client connections
   */
    public close(): void {
        console.log("WebSocket.ts:", "Closing WebSocket server...");

        // Close all connected clients
        this.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.close();
            }
        });

        // Close the WebSocket server
        this.server.close((err) => {
            if (err) {
                console.error("WebSocket.ts:", "Error closing the WebSocket server:", err);
            } else {
                console.log("WebSocket.ts:", "WebSocket server closed successfully.");
            }
        });
    }
}
