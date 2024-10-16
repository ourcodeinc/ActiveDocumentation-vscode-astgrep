// eslint-disable-next-line import/no-unresolved
import * as vscode from "vscode";
import { stub, restore } from "sinon";
import * as assert from "assert";
import { FileChangeManager } from "../fileChangeManager";
import { RuleManager } from "../ruleManager";
import { constants } from "../constants";
import { Rule } from "../codeProcessing/types";

describe("FileChangeManager", () => {
  let workspaceFolder: vscode.WorkspaceFolder;
  let ruleManagerStub: sinon.SinonStub;
  let fileChangeManager: FileChangeManager;

  beforeEach(() => {
    workspaceFolder = {
      uri: vscode.Uri.file("/path/to/workspace"),
      name: "workspace",
      index: 0,
    } as vscode.WorkspaceFolder;

    const mockRuleManager = {
      rules: Promise.resolve([] as Rule[]),
      workspaceFolder,
      readRuleTable: stub().resolves([] as Rule[]),
      getChangedRules: stub().returns([] as Rule[]),
      handleFileChange: stub().resolves(),
      getRules: stub().returns(Promise.resolve([] as Rule[])),
    } as Partial<RuleManager>;

    ruleManagerStub = stub(RuleManager, "getInstance").returns(mockRuleManager as RuleManager);
    fileChangeManager = FileChangeManager.getInstance(workspaceFolder);
  });

  afterEach(() => {
    restore();
  });

  it("should create a singleton instance", () => {
    const anotherInstance = FileChangeManager.getInstance(workspaceFolder);
    assert.strictEqual(anotherInstance, fileChangeManager, "Instances are not the same.");
  });

  it("should call handleFileChange on RuleManager when the monitored document is saved", async () => {
    // Mock a text document save event
    const document: vscode.TextDocument = {
      uri: vscode.Uri.joinPath(workspaceFolder.uri, constants.RULE_TABLE_JSON),
      fileName: constants.RULE_TABLE_JSON,
      languageId: "json",
      isUntitled: false,
      version: 1,
      isDirty: false,
      getText: () => "",
      save: async () => { },
      lineCount: 0,
      offsetAt: () => 0,
      positionAt: () => new vscode.Position(0, 0),
    } as unknown as vscode.TextDocument;

    // Simulate saving the document
    await fileChangeManager["handleSaveTextDocument"](document);

    // Check that RuleManager's handleFileChange was called
    const ruleManagerInstance = ruleManagerStub(workspaceFolder);
    assert.ok(ruleManagerInstance.handleFileChange.calledOnce, "handleFileChange should be called once.");
  });

  it("should not call handleFileChange on RuleManager for other documents", async () => {
    // Mock a text document save event with a different document
    const document: vscode.TextDocument = {
      uri: vscode.Uri.file("/path/to/workspace/other.json"),
      fileName: "other.json",
      languageId: "json",
      isUntitled: false,
      version: 1,
      isDirty: false,
      getText: () => "",
      save: async () => { },
    } as unknown as vscode.TextDocument;

    // Simulate saving the document
    await fileChangeManager["handleSaveTextDocument"](document);

    // Check that RuleManager's handleFileChange was NOT called
    const ruleManagerInstance = ruleManagerStub(workspaceFolder);
    assert.ok(!ruleManagerInstance.handleFileChange.called, "handleFileChange should not be called.");
  });
});

