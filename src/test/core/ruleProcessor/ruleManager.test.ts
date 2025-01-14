// eslint-disable-next-line import/no-unresolved
import * as vscode from "vscode";
import { WebSocketManager } from "../../../websocket/webSocketManager";
import { RuleManager } from "../../../core/ruleProcessor/ruleManager";
import * as vsCodeUtilities from "../../../vsCodeUtilities";
import * as ruleExecutor from "../../../core/astGrep/ruleExecutor";
import * as astGrepUtilities from "../../../core/astGrep/astGrepUtilities";
import assert from "assert";
import sinon, { createSandbox, createStubInstance } from "sinon";
import { Rule } from "../../../core/ruleProcessor/types";
import * as types from "../../../core/ruleProcessor/types";
import { Lang, NapiConfig } from "@ast-grep/napi";

describe("RuleManager", () => {
    let sandbox: sinon.SinonSandbox;
    let workspaceFolder: vscode.WorkspaceFolder;
    let webSocketManager: WebSocketManager;
    let ruleManager: RuleManager;

    beforeEach(() => {
        sandbox = createSandbox();
        workspaceFolder = {
            uri: vscode.Uri.parse("file:///workspace"),
            name: "workspace",
            index: 0,
        } as vscode.WorkspaceFolder;

        webSocketManager = createStubInstance(WebSocketManager);
        ruleManager = RuleManager.getInstance(workspaceFolder, webSocketManager);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it("should create an instance of RuleManager", () => {
        assert.ok(ruleManager);
    });

    it("should create a singleton instance", function() {
        const instance1 = RuleManager.getInstance(workspaceFolder, webSocketManager);
        const instance2 = RuleManager.getInstance(workspaceFolder, webSocketManager);
        assert.strictEqual(instance1, instance2, "Instances should be the same");
    });

    describe("readRuleTable", () => {
        it("should return parsed rules when file is read successfully", async () => {
            const mockRules: Rule[] = [
                {
                    index: "1",
                    title: "Test Rule",
                    description: "A test rule",
                    tags: [],
                    rulePatternQuantifier: {} as NapiConfig,
                    rulePatternConstraint: {} as NapiConfig,
                    language: "",
                    filesAndFolders: [],
                },
            ];
            const fileContent = JSON.stringify(mockRules);
            sandbox.stub(vsCodeUtilities, "getSourceFromRelativePath").resolves(fileContent);
            sandbox.stub(types, "isValidRule").resolves(true);

            const rules = await ruleManager.readRuleTable();

            assert.strictEqual(rules.length, 1, "Should return one rule");
            assert.strictEqual(rules[0].title, "Test Rule",
                `The title of the rule should be 'Test Rule' but is ${rules[0].title}`);
        });

        it("should show an error message and return an empty array when an error occurs", async () => {
            const errorMessage = "File not found";
            sandbox.stub(vsCodeUtilities, "getSourceFromRelativePath").rejects(new Error(errorMessage));

            const showErrorMessageStub = sandbox.stub(vscode.window, "showErrorMessage");
            const rules = await ruleManager.readRuleTable();

            assert.strictEqual(rules.length, 0, "Should return an empty array");
            assert.ok(showErrorMessageStub.calledOnce, "showErrorMessage should be called once");
        });

        it("should show an error message and return an empty array when the input is not an array", async () => {
            sandbox.stub(vsCodeUtilities, "getSourceFromRelativePath").resolves("{}");
            sandbox.stub(JSON, "parse").returns({});
            sandbox.stub(Array, "isArray").returns(false);

            const showErrorMessageStub = sandbox.stub(vscode.window, "showErrorMessage");
            const rules = await ruleManager.readRuleTable();

            assert.strictEqual(rules.length, 0, "Should return an empty array");
            assert.ok(showErrorMessageStub.calledOnce, "showErrorMessage should be called once");
        });
    });

    describe("getInitialRuleTable", () => {
        it("should read rules, execute them, update the rules property, and send them to the WebSocket manager", async () => {
            ruleManager.rules = [];
            const mockRules : Rule[] = [
                {
                    index: "1",
                    title: "Test Rule",
                    description: "A test rule",
                    tags: [],
                    rulePatternQuantifier: {} as NapiConfig,
                    rulePatternConstraint: {} as NapiConfig,
                    language: "",
                    filesAndFolders: [],
                },
            ];
            const executedRules : Rule[] = [
                {
                    index: "1",
                    title: "Executed Rule",
                    description: "Executed test rule",
                    tags: [],
                    rulePatternQuantifier: {} as NapiConfig,
                    rulePatternConstraint: {} as NapiConfig,
                    language: "",
                    filesAndFolders: [],
                },
            ];

            const readRuleTableStub = sandbox.stub(ruleManager, "readRuleTable").resolves(mockRules);
            const executeRulesStub = sandbox.stub(ruleManager, "executeRules").resolves(executedRules);
            const sendRulesStub = sandbox.stub(ruleManager, "sendRulesToWebSocketManager");

            await ruleManager.getInitialRuleTable();

            assert.strictEqual(ruleManager.rules, executedRules, "The rules property should be updated with the executed rules");
            assert.ok(readRuleTableStub.calledOnce, "readRuleTable should be called once");
            assert.ok(executeRulesStub.calledOnce, "executeRules should be called once");
            assert.ok(sendRulesStub.calledOnce, "sendRulesToWebSocketManager should be called once");
        });
    });

    describe("updateRuleTable", () => {
        it("should read rules, execute them, update the rules property, and send them to the WebSocket manager", async () => {
            ruleManager.rules = [];
            const mockRules : Rule[] = [
                {
                    index: "1",
                    title: "Test Rule",
                    description: "A test rule",
                    tags: [],
                    rulePatternQuantifier: {} as NapiConfig,
                    rulePatternConstraint: {} as NapiConfig,
                    language: "",
                    filesAndFolders: [],
                },
            ];
            const executedRules : Rule[] = [
                {
                    index: "1",
                    title: "Executed Rule",
                    description: "Executed test rule",
                    tags: [],
                    rulePatternQuantifier: {} as NapiConfig,
                    rulePatternConstraint: {} as NapiConfig,
                    language: "",
                    filesAndFolders: [],
                },
            ];

            const readRuleTableStub = sandbox.stub(ruleManager, "readRuleTable").resolves(mockRules);
            const executeRulesStub = sandbox.stub(ruleManager, "executeRules").resolves(executedRules);
            const sendRulesStub = sandbox.stub(ruleManager, "sendRulesToWebSocketManager");

            await ruleManager.updateRuleTable();

            assert.strictEqual(ruleManager.rules, executedRules, "The rules property should be updated with the executed rules");
            assert.ok(readRuleTableStub.calledOnce, "readRuleTable should be called once");
            assert.ok(executeRulesStub.calledOnce, "executeRules should be called once");
            assert.ok(sendRulesStub.calledOnce, "sendRulesToWebSocketManager should be called once");
        });
    });

    describe("executeRule", () => {
    });

    describe("executeRuleOnFileFolder", () => {
        it("should execute a rule on a file or a folder and populate the results correctly", async () => {
            const rule = {
                index: "1",
                title: "Test Rule",
                description: "A test rule",
                tags: [],
                rulePatternQuantifier: {} as NapiConfig,
                rulePatternConstraint: {} as NapiConfig,
                language: "",
                filesAndFolders: ["testFile.js"],
                results: [],
            } as Rule;

            const mockSourceCode = [{ relativePath: "testFile.js", source: "const a = 1;" }];
            const mockSnippet = {
                snippet: "const a = 1;",
                lines: { start: 1, end: 1 },
                columns: { start: 0, end: 12 },
                offsets: { start: 0, end: 12 },
            };
            const mockResults = {
                satisfiedSnippets: [mockSnippet],
                violatedSnippets: [mockSnippet],
            };

            const getSourceStub = sandbox.stub(vsCodeUtilities, "getFileOrDirectoryContent").resolves(mockSourceCode);
            sandbox.stub(astGrepUtilities, "getLangFromString").returns(Lang.JavaScript);
            const getResultsStub = sandbox.stub(ruleExecutor, "getSatifiedAndViolatedResults").returns(mockResults);

            const resultObject = await ruleManager.executeRuleOnFileFolder(rule, "testFile.js");

            assert.ok(getSourceStub.calledOnceWithExactly(ruleManager.workspaceFolder, "testFile.js"),
                "getSourceFromRelativePath should be called once with the correct arguments");
            assert.ok(getResultsStub.calledOnceWithExactly(
                rule.rulePatternQuantifier, rule.rulePatternConstraint, mockSourceCode[0].source, Lang.JavaScript),
            "getSatifiedAndViolatedResults should be called once with the correct arguments");

            assert.strictEqual(resultObject.length, 1, "The resultObject array should have one entry");
            assert.strictEqual(resultObject[0].relativeFilePath, "testFile.js", "The relative file path should be correct");
            assert.deepEqual(resultObject[0].snippets, mockResults, "The snippets should be populated correctly");
        });

        it("should handle an empty source string gracefully", async () => {
            const rule = {
                index: "3",
                title: "Test Rule with Empty Source",
                description: "A test rule with an empty source",
                tags: [],
                rulePatternQuantifier: {} as NapiConfig,
                rulePatternConstraint: {} as NapiConfig,
                language: "",
                filesAndFolders: ["emptyFile.js"],
                results: [],
            } as Rule;
            const mockResults = {
                satisfiedSnippets: [],
                violatedSnippets: [],
            };
            const emptySourceCode = [{ relativePath: "emptyFile.js", source: "" }];

            const getSourceStub = sandbox.stub(vsCodeUtilities, "getFileOrDirectoryContent").resolves(emptySourceCode);
            sandbox.stub(astGrepUtilities, "getLangFromString").returns(Lang.JavaScript);
            const getResultsStub = sandbox.stub(ruleExecutor, "getSatifiedAndViolatedResults").returns(mockResults);

            const resultObject = await ruleManager.executeRuleOnFileFolder(rule, "emptyFile.js");

            assert.ok(getSourceStub.calledOnceWithExactly(ruleManager.workspaceFolder, "emptyFile.js"),
                "getFileOrDirectoryContent should be called once with the correct arguments");
            assert.ok(getResultsStub.notCalled, "executeRuleOnSource should not be called");

            // Check if the results array is empty
            assert.strictEqual(resultObject.length, 1, "The resultObject array should have one entry");
            assert.strictEqual(resultObject[0].snippets.satisfiedSnippets.length, 0,
                "The satisfied snippets array should be empty");
            assert.strictEqual(resultObject[0].snippets.violatedSnippets.length, 0,
                "The violated snippets array should be empty");
        });

        it("should handle unsupported language gracefully", async () => {
            const rule = {
                index: "3",
                title: "Test Rule with Empty Source",
                description: "A test rule with an empty source",
                tags: [],
                rulePatternQuantifier: {} as NapiConfig,
                rulePatternConstraint: {} as NapiConfig,
                language: "",
                filesAndFolders: ["emptyFile.js"],
                results: [],
            } as Rule;

            const emptySourceCode = [{ relativePath: "emptyFile.js", source: "" }];
            const getSourceStub = sandbox.stub(vsCodeUtilities, "getFileOrDirectoryContent").resolves(emptySourceCode);
            sandbox.stub(astGrepUtilities, "getLangFromString").returns(undefined);
            const executeRuleStub = sandbox.stub(ruleExecutor, "executeRuleOnSource").returns([]);
            const resultObject = await ruleManager.executeRuleOnFileFolder(rule, "emptyFile.js");

            assert.ok(getSourceStub.calledOnceWithExactly(ruleManager.workspaceFolder, "emptyFile.js"),
                "getFileOrDirectoryContent should be called once with the correct arguments");
            assert.ok(executeRuleStub.notCalled, "executeRuleOnSource should not be called");

            // Check if the results array is empty
            assert.strictEqual(resultObject.length, 1, "The resultObject array should have one entry");
            assert.strictEqual(resultObject[0].snippets.satisfiedSnippets.length, 0,
                "The satisfied snippets array should be empty");
            assert.strictEqual(resultObject[0].snippets.violatedSnippets.length, 0,
                "The violated snippets array should be empty");
        });
    });
});
