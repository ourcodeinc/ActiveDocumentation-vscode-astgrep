// eslint-disable-next-line import/no-unresolved
import * as vscode from "vscode";
import { WebSocketManager } from "../../../websocket/webSocketManager";
import { RuleManager } from "../../../core/ruleProcessor/ruleManager";
import { WEBSOCKET_SENT_MESSAGE } from "../../../websocket/webSocketConstants";
import { createWebSocketMessage } from "../../../core/utilities";
import assert from "assert";
import { stub, spy } from "sinon";

describe("RuleManager", function() {
    let workspaceFolder: vscode.WorkspaceFolder;
    let webSocketManager: WebSocketManager;
    let ruleManager: RuleManager;
    const port = 8082;

    beforeEach(function() {
        workspaceFolder = { uri: vscode.Uri.parse("file:///dummy/path") } as vscode.WorkspaceFolder;
        webSocketManager = new WebSocketManager(port);
        RuleManager["instance"] = null;
    });

    it("should create a singleton instance", function() {
        const instance1 = RuleManager.getInstance(workspaceFolder, webSocketManager);
        const instance2 = RuleManager.getInstance(workspaceFolder, webSocketManager);
        assert.strictEqual(instance1, instance2, "Instances should be the same");
    });

    it("should send rules through WebSocket on initialization", async function() {
        const rules = [{
            index: "001",
            title: "Prevent Unused Variables",
            description: "Ensure that all declared variables are used in the code to avoid unnecessary clutter.",
            tags: ["linting", "variables", "best practices"],
            rule: {
                type: "linting",
                severity: "error",
                message: "Unused variable detected.",
                fix: "Remove the variable or use it in the code.",
            },
        }];

        const ruleManagerStub = stub(RuleManager.prototype, "readRuleTable").resolves(rules);
        const queueMessageSpy = spy(webSocketManager, "queueMessage");

        ruleManager = RuleManager.getInstance(workspaceFolder, webSocketManager);

        await ruleManagerStub();

        assert.strictEqual(queueMessageSpy.callCount, 1, "queueMessage should be called once");
        assert.strictEqual(queueMessageSpy.firstCall.args[0], WEBSOCKET_SENT_MESSAGE.RULE_TABLE_MSG,
            "Expected message type is RULE_TABLE_MSG");
        assert.deepStrictEqual(queueMessageSpy.firstCall.args[1],
            createWebSocketMessage(WEBSOCKET_SENT_MESSAGE.RULE_TABLE_MSG, rules),
            "The message payload should match the rules");

        ruleManagerStub.restore();
        queueMessageSpy.restore();
    });

    it("should handle file changes and send updated rules", async function() {
        const rules = [{
            index: "002",
            title: "Consistent Naming Conventions",
            description: "Variables, functions, and classes should follow a consistent naming convention (e.g., camelCase, PascalCase).",
            tags: ["style", "naming conventions"],
            rule: {
                type: "style",
                severity: "warning",
                message: "Inconsistent naming convention.",
                fix: "Follow the specified naming convention throughout the code.",
            },
        }];

        const readRuleTableStub = stub(RuleManager.prototype, "readRuleTable").resolves(rules);
        const queueMessageSpy = spy(webSocketManager, "queueMessage");

        ruleManager = RuleManager.getInstance(workspaceFolder, webSocketManager);
        ruleManager.handleFileChange();
        await new Promise((resolve) => setTimeout(resolve, 100));

        assert.strictEqual(queueMessageSpy.callCount, 2, "queueMessage should be called twice");
        assert.strictEqual(queueMessageSpy.secondCall.args[0], WEBSOCKET_SENT_MESSAGE.RULE_TABLE_MSG,
            "Expected message type is RULE_TABLE_MSG");
        assert.deepStrictEqual(queueMessageSpy.secondCall.args[1],
            createWebSocketMessage(WEBSOCKET_SENT_MESSAGE.RULE_TABLE_MSG, rules),
            "The message payload should match the updated rules");

        readRuleTableStub.restore();
        queueMessageSpy.restore();
    });

    it("should handle errors when reading the rule table", async function() {
        const readRuleTableStub = stub(RuleManager.prototype, "readRuleTable").rejects(new Error("File read error"));
        const queueMessageSpy = spy(webSocketManager, "queueMessage");

        ruleManager = RuleManager.getInstance(workspaceFolder, webSocketManager);
        ruleManager.handleFileChange();
        await new Promise((resolve) => setTimeout(resolve, 100));

        assert.strictEqual(queueMessageSpy.callCount, 0, "queueMessage should not be called on read error");

        readRuleTableStub.restore();
        queueMessageSpy.restore();
    });
});
