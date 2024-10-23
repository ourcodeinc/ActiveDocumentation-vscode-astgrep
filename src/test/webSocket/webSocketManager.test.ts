// eslint-disable-next-line @typescript-eslint/naming-convention
import * as WebSocket from "ws";
import { WebSocketManager } from "../../websocket/webSocketManager";
import assert from "assert";
import { stub, spy } from "sinon";

describe("WebSocketManager", function() {
    let webSocketManager: WebSocketManager;
    let server: WebSocket.Server;
    const port = 8081;

    beforeEach(function() {
        webSocketManager = new WebSocketManager(port);
        server = webSocketManager.server;
    });

    afterEach(function() {
        webSocketManager.close();
    });

    it("should start the WebSocket server on the specified port", function() {
        assert.strictEqual(server.options.port, port, `server is opened in port ${server.options.port} instead of ${port}`);
    });

    it("should add a client to the clients set on connection", function(done) {
        const mockClient = new WebSocket.WebSocket(`ws://localhost:${port}`);

        mockClient.on("open", () => {
            assert.strictEqual(webSocketManager.clients.size, 1, `There are ${webSocketManager.clients.size} clients`);
            mockClient.close();
            done();
        });
    });

    it("should send queued messages to the client on connection", function(done) {
        const message = "Test message";
        const key = "key";
        webSocketManager.queueMessage(key, message);
        const sendStub = stub(WebSocket.WebSocket.prototype, "send");
        const mockClient = new WebSocket.WebSocket(`ws://localhost:${port}`);

        mockClient.on("open", () => {
            setTimeout(() => {
                assert.strictEqual(sendStub.callCount, 1, `send() is called ${sendStub.callCount} times`);
                assert.strictEqual(sendStub.firstCall.args[0], message, `Expected message to be "${message}"`);

                mockClient.close();
                sendStub.restore();
                done();
            }, 100);
        });

        mockClient.on("error", (error: Error) => {
            console.error("WebSocket error:", error);
            sendStub.restore();
            done(error);
        });
    });

    it("should remove a client from the clients set on disconnection", function(done) {
        const mockClient = new WebSocket.WebSocket(`ws://localhost:${port}`);

        mockClient.on("open", () => {
            mockClient.close();
        });

        mockClient.on("close", () => {
            assert.strictEqual(webSocketManager.clients.size, 0, `There are ${webSocketManager.clients.size} clients`);
            done();
        });
    });

    it("should queue a message and send it to all clients", function(done) {
        const message = "Another test message";
        const key = "Another key";
        const sendStub = stub(WebSocket.WebSocket.prototype, "send");

        const mockClient1 = new WebSocket.WebSocket(`ws://localhost:${port}`);
        const mockClient2 = new WebSocket.WebSocket(`ws://localhost:${port}`);

        mockClient1.on("open", () => {
            mockClient2.on("open", () => {
                webSocketManager.queueMessage(key, message);

                setTimeout(() => {
                    assert.strictEqual(sendStub.callCount, 2,
                        `send() should be called twice, once for each client, but was called ${sendStub.callCount} times`);
                    assert.strictEqual(sendStub.getCall(0).args[0], message,
                        `Expected message for client 1 to be "${message}", but was "${sendStub.getCall(0).args[0]}"`);
                    assert.strictEqual(sendStub.getCall(1).args[0], message,
                        `Expected message for client 2 to be "${message}", but was "${sendStub.getCall(1).args[0]}"`);

                    mockClient1.close();
                    mockClient2.close();
                    sendStub.restore();
                    done();
                }, 100);
            });
        });

        mockClient1.on("error", (error) => {
            console.error("WebSocket error on client 1:", error);
            sendStub.restore();
            done(error);
        });

        mockClient2.on("error", (error) => {
            console.error("WebSocket error on client 2:", error);
            sendStub.restore();
            done(error);
        });
    });

    it("should close the server and all clients on close", function(done) {
        const mockClient = new WebSocket.WebSocket(`ws://localhost:${port}`);
        const closeSpy = spy(mockClient, "close");

        mockClient.on("open", () => {
            // Stub the server's close method to prevent actual closing behavior
            const serverCloseStub = stub(webSocketManager.server, "close").callsFake((callback) => {
                if (callback) {
                    callback();
                }
            });

            webSocketManager.close();

            setTimeout(() => {
                assert.strictEqual(closeSpy.callCount, 1,
                    `Expected close() to be called once on the client, but it was called ${closeSpy.callCount} times`);
                assert.strictEqual(serverCloseStub.callCount, 1,
                    `Expected server.close() to be called once, but it was called ${serverCloseStub.callCount} times`);
                // Restore the spies and stubs
                closeSpy.restore();
                serverCloseStub.restore();
                done();
            }, 100);
        });

        mockClient.on("error", (error: Error) => {
            console.error("WebSocket error:", error);
            closeSpy.restore();
            done(error);
        });
    });
});
