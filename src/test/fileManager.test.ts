// eslint-disable-next-line import/no-unresolved
import * as vscode from "vscode";
import { stub, spy } from "sinon";
import * as assert from "assert";
import { FileManager } from "../fileManager";
import { RuleManager } from "../core/ruleProcessor/ruleManager";
import { constants } from "../constants";
import { WebSocketManager } from "../websocket/webSocketManager";

describe("FileManager", function() {
    let workspaceFolder: vscode.WorkspaceFolder;
    let webSocketManager: WebSocketManager;
    let fileManager: FileManager;
    const port = 8080;

    beforeEach(function() {
        // Mocking the workspace folder and WebSocketManager
        workspaceFolder = {
            uri: vscode.Uri.parse("file:///dummy/path"),
        } as vscode.WorkspaceFolder;

        webSocketManager = new WebSocketManager(port);
        fileManager = FileManager.getInstance(workspaceFolder, webSocketManager);
    });

    afterEach(function() {
        FileManager["instance"] = null;
    });

    it("should return the singleton instance of FileManager", function() {
        const instance1 = FileManager.getInstance(workspaceFolder, webSocketManager);
        const instance2 = FileManager.getInstance(workspaceFolder, webSocketManager);
        assert.strictEqual(instance1, instance2, "Instances should be the same");
    });

    it("should watch for workspace changes", function() {
        const onDidSaveTextDocumentStub = stub(vscode.workspace, "onDidSaveTextDocument");
        const handleSaveTextDocumentSpy = spy(fileManager, "handleSaveTextDocument");
        fileManager["watchWorkspaceChanges"]();

        assert.strictEqual(onDidSaveTextDocumentStub.callCount, 1, "Should set up the save document event listener");
        assert.strictEqual(onDidSaveTextDocumentStub.firstCall.args[0], handleSaveTextDocumentSpy,
            "The listener should be the handleSaveTextDocument method");

        onDidSaveTextDocumentStub.restore();
    });

    it("should handle saving the rule table file", async function() {
        const ruleManagerStub = stub(RuleManager.prototype, "handleFileChange").resolves();
        const document = {
            uri: vscode.Uri.joinPath(workspaceFolder.uri, constants.RULE_TABLE_FILE),
        } as vscode.TextDocument;
        fileManager["handleSaveTextDocument"](document);

        assert.strictEqual(ruleManagerStub.callCount, 1, "handleFileChange should be called once");
        ruleManagerStub.restore();
    });

    it("should not handle saving other files", async function() {
        const ruleManagerStub = stub(RuleManager.prototype, "handleFileChange").resolves();
        const document = {
            uri: vscode.Uri.joinPath(workspaceFolder.uri, "otherFile.txt"),
        } as vscode.TextDocument;
        fileManager["handleSaveTextDocument"](document);

        assert.strictEqual(ruleManagerStub.callCount, 0, "handleFileChange should not be called");
        ruleManagerStub.restore();
    });
});
