// eslint-disable-next-line import/no-unresolved
import * as vscode from "vscode";
import sinon, { createStubInstance, createSandbox } from "sinon";
import * as assert from "assert";
import { FileManager } from "../fileManager";
import { RuleManager } from "../core/ruleProcessor/ruleManager";
import { constants } from "../constants";
import { WebSocketManager } from "../websocket/webSocketManager";

describe("FileManager", function() {
    let sandbox: sinon.SinonSandbox;
    let workspaceFolder: vscode.WorkspaceFolder;
    let webSocketManager: WebSocketManager;
    let fileManager: FileManager;

    beforeEach(function() {
        // Mocking the workspace folder and WebSocketManager
        sandbox = createSandbox();
        workspaceFolder = {
            uri: vscode.Uri.parse("file:///dummy/path"),
        } as vscode.WorkspaceFolder;

        webSocketManager = createStubInstance(WebSocketManager);
        fileManager = FileManager.getInstance(workspaceFolder, webSocketManager);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it("should create an instance of RuleManager", () => {
        assert.ok(fileManager);
    });

    it("should return the singleton instance of FileManager", function() {
        const instance1 = FileManager.getInstance(workspaceFolder, webSocketManager);
        const instance2 = FileManager.getInstance(workspaceFolder, webSocketManager);
        assert.strictEqual(instance1, instance2, "Instances should be the same");
    });

    it("should watch for workspace changes", function() {
        const onDidSaveTextDocumentStub = sandbox.stub(vscode.workspace, "onDidSaveTextDocument");
        fileManager["watchWorkspaceChanges"]();

        assert.ok(onDidSaveTextDocumentStub.calledOnce, "Should set up the save document event listener");
    });

    it("should handle saving the rule table file", async function() {
        const updateRuleTableStub = sandbox.stub();
        sandbox.stub(RuleManager, "getInstance").returns({
            updateRuleTable: updateRuleTableStub,
        } as unknown as RuleManager);
        const document = {
            uri: vscode.Uri.joinPath(workspaceFolder.uri, constants.RULE_TABLE_FILE),
        } as vscode.TextDocument;
        fileManager.handleSaveTextDocument(document);

        assert.ok(updateRuleTableStub.calledOnce,
            `updateRuleTable should be called once but is called ${updateRuleTableStub.callCount}`);
    });


    it("should not handle saving other files", async function() {
        const updateRuleTableStub = sandbox.stub();
        sandbox.stub(RuleManager, "getInstance").returns({
            updateRuleTable: updateRuleTableStub,
        } as unknown as RuleManager);
        const document = {
            uri: vscode.Uri.joinPath(workspaceFolder.uri, "otherFile.txt"),
        } as vscode.TextDocument;
        fileManager.handleSaveTextDocument(document);

        assert.strictEqual(updateRuleTableStub.callCount, 0,
            `updateRuleTable should not be called but is called ${updateRuleTableStub.callCount}`);
    });
});
