// eslint-disable-next-line import/no-unresolved
import * as vscode from "vscode";
import assert from "assert";
import { restore } from "sinon";
import { RuleManager } from "../ruleManager";
import { Rule } from "../codeProcessing/types";

describe("RuleManager", () => {
  let workspaceFolderMock: vscode.WorkspaceFolder;

  beforeEach(() => {
    workspaceFolderMock = {
      uri: vscode.Uri.parse("mock://workspace"),
      name: "Mock Workspace",
      index: 0,
    } as vscode.WorkspaceFolder;
  });

  afterEach(() => {
    restore();
  });

  it("should return the same instance for the same workspace folder", () => {
    const instance1 = RuleManager.getInstance(workspaceFolderMock);
    const instance2 = RuleManager.getInstance(workspaceFolderMock);

    assert.strictEqual(instance1, instance2, "Instances are not the same for the same workspace folder");
  });

  describe("getChangedRules", () => {
    it("should identify updated, removed, and new rules", () => {
      const ruleManager = RuleManager.getInstance(workspaceFolderMock);

      const oldRules: Rule[] = [
        { id: "1", rule: { name: "Rule 1" } },
        { id: "2", rule: { name: "Rule 2" } },
        { id: "3", rule: { name: "Rule 3" } },
      ];

      const newRules: Rule[] = [
        { id: "1", rule: { name: "Rule 1" } }, // unchanged
        { id: "2", rule: { name: "Updated Rule 2" } }, // updated
        // removed: { id: "3", rule: { name: "Rule 3" } },
        { id: "4", rule: { name: "New Rule 4" } }, // new
      ];

      // Use the private method directly for testing purposes
      const changedRules = (ruleManager).getChangedRules(oldRules, newRules);

      assert.strictEqual(changedRules.length, 3, "Should identify three changed rules");
      assert.deepStrictEqual(changedRules[0], { id: "2", rule: { name: "Updated Rule 2" } }, "Updated rule should be included");
      assert.deepStrictEqual(changedRules[1], { id: "3", rule: { name: "Rule 3" } }, "Removed rule should be included");
      assert.deepStrictEqual(changedRules[2], { id: "4", rule: { name: "New Rule 4" } }, "New rule should be included");
    });

    it("should return an empty array when no rules have changed", () => {
      const ruleManager = RuleManager.getInstance(workspaceFolderMock);

      const oldRules: Rule[] = [
        { id: "1", rule: { name: "Rule 1" } },
        { id: "2", rule: { name: "Rule 2" } },
      ];

      const newRules: Rule[] = [
        { id: "1", rule: { name: "Rule 1" } }, // unchanged
        { id: "2", rule: { name: "Rule 2" } }, // unchanged
      ];

      const changedRules = (ruleManager).getChangedRules(oldRules, newRules);

      assert.strictEqual(changedRules.length, 0, "Should return an empty array when no rules have changed");
    });
  });
});
