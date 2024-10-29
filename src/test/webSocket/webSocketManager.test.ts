// eslint-disable-next-line @typescript-eslint/naming-convention
import * as WebSocket from "ws";
import { WebSocketManager } from "../../websocket/webSocketManager";
import assert from "assert";
import sinon, { stub, spy, createSandbox } from "sinon";

describe("WebSocketManager", function() {
    let sandbox: sinon.SinonSandbox;
    let webSocketManager: WebSocketManager;
    let server: WebSocket.Server;
    const port = 8081;

    beforeEach(function() {
        sandbox = createSandbox();
        webSocketManager = new WebSocketManager(port);
        server = webSocketManager.server;
    });

    afterEach(function() {
        sandbox.restore();
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
        const mockClient = new WebSocket.WebSocket(`ws://localhost:${port}`);
        const sendQueuedMessagesToClientStub = sandbox.stub(webSocketManager, "sendQueuedMessagesToClient");

        mockClient.on("open", () => {
            setTimeout(() => {
                assert.strictEqual(sendQueuedMessagesToClientStub.callCount, 1,
                    `sendQueuedMessagesToClientStub() is called ${sendQueuedMessagesToClientStub.callCount} times`);

                mockClient.close();
                done();
            }, 100);
        });

        mockClient.on("error", (error: Error) => {
            console.error("WebSocket error:", error);
            done(error);
        });
    });

    describe("sendQueuedMessagesToClient", function() {
        it("should send all queued messages to the client if connected", function(done) {
            const mockClient = new WebSocket.WebSocket(`ws://localhost:${port}`);
            const messageQueue = {
                message1: "Hello, Client!",
                message2: "Welcome!",
            };
            webSocketManager.messageQueue = messageQueue;
            mockClient.on("open", () => {
                const sendSpy = sandbox.spy(mockClient, "send");
                webSocketManager.sendQueuedMessagesToClient(mockClient as unknown as WebSocket);
                setTimeout(() => {
                    assert.strictEqual(sendSpy.callCount, 2, `Expected 2 messages to be sent, but ${sendSpy.callCount} were sent`);
                    assert(sendSpy.calledWith("Hello, Client!"), "Expected message 'Hello, Client!' to be sent");
                    assert(sendSpy.calledWith("Welcome!"), "Expected message 'Welcome!' to be sent");

                    sendSpy.restore();
                    mockClient.close();
                    done();
                }, 100);
            });
        });

        it("should not send any messages if messageQueue is empty", function(done) {
            const mockClient = new WebSocket.WebSocket(`ws://localhost:${port}`);
            webSocketManager.messageQueue = {};
            mockClient.on("open", () => {
                const sendSpy = sandbox.spy(mockClient, "send");
                webSocketManager.sendQueuedMessagesToClient(mockClient as unknown as WebSocket);
                setTimeout(() => {
                    assert.strictEqual(sendSpy.callCount, 0, `Expected no messages to be sent, but ${sendSpy.callCount} were sent`);
                    sendSpy.restore();
                    mockClient.close();
                    done();
                }, 100);
            });
        });

        it("should not send messages if the WebSocket is not open", function(done) {
            const mockClient = new WebSocket.WebSocket(`ws://localhost:${port}`);
            webSocketManager.messageQueue = { message1: "Hello, Client!" };
            mockClient.on("open", () => {
                const sendSpy = sandbox.spy(mockClient, "send");
                mockClient.close();
                webSocketManager.sendQueuedMessagesToClient(mockClient as unknown as WebSocket);

                setTimeout(() => {
                    assert.strictEqual(sendSpy.callCount, 0, `Expected no messages to be sent since WebSocket is closed, but ${sendSpy.callCount} were sent`);

                    sendSpy.restore();
                    done();
                }, 100);
            });
        });
    });

    it("should broadcast a message to all connected clients", function(done) {
        const mockClient1 = new WebSocket.WebSocket(`ws://localhost:${port}`);
        const mockClient2 = new WebSocket.WebSocket(`ws://localhost:${port}`);

        const sendMessageToClientStub = sandbox.stub(webSocketManager, "sendMessageToClient");
        Promise.all([
            new Promise<void>((resolve) => mockClient1.on("open", resolve)),
            new Promise<void>((resolve) => mockClient2.on("open", resolve)),
        ]).then(() => {
            const message = "Hello, clients!";
            webSocketManager.broadcast(message);

            assert.strictEqual(sendMessageToClientStub.callCount, 2,
                `Expected sendMessageToClient to be called twice, but it was called ${sendMessageToClientStub.callCount} times`);

            sendMessageToClientStub.getCalls().forEach((call) => {
                assert.strictEqual(call.args[1], message, `Expected message to be "${message}", but got "${call.args[1]}"`);
            });

            mockClient1.close();
            mockClient2.close();
            done();
        }).catch(done);
    });

    describe("updateMessageQueue", function() {
        it("should update the message queue with a new message", function() {
            const key = "messageKey";
            const message = "New queued message";
            webSocketManager.updateMessageQueue(key, message);
            assert.strictEqual(webSocketManager.messageQueue[key], message,
                `Expected messageQueue[${key}] to be "${message}", but got "${webSocketManager.messageQueue[key]}"`);
        });

        it("should replace an existing message in the message queue", function() {
            const key = "messageKey";
            const initialMessage = "Initial message";
            const updatedMessage = "Updated message";

            webSocketManager.updateMessageQueue(key, initialMessage);
            assert.strictEqual(webSocketManager.messageQueue[key], initialMessage,
                `Expected messageQueue[${key}] to be "${initialMessage}", but got "${webSocketManager.messageQueue[key]}"`);
            webSocketManager.updateMessageQueue(key, updatedMessage);
            assert.strictEqual(webSocketManager.messageQueue[key], updatedMessage,
                `Expected messageQueue[${key}] to be "${updatedMessage}", but got "${webSocketManager.messageQueue[key]}"`);
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
