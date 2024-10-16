// eslint-disable-next-line import/no-unresolved
import * as vscode from "vscode";
import { constants } from "./constants";
import { Rule } from "./codeProcessing/types";

/**
 * Singleton class to manage rules from ruleTable.json.
 */
class RuleManager {
  private static instance: RuleManager | null = null;
  private rules: Promise<Rule[]>;
  private workspaceFolder: vscode.WorkspaceFolder;

  /**
   * Private constructor to prevent direct instantiation.
   * @param workspaceFolder - The workspace folder where the ruleTable.json is located.
   */
  private constructor(workspaceFolder: vscode.WorkspaceFolder) {
    this.workspaceFolder = workspaceFolder;
    this.rules = this.readRuleTable();
    // this.watchFileForChanges();
  }

  /**
   * Static method to get the instance of RuleManager.
   * @param workspaceFolder - The workspace folder to associate with the RuleManager.
   * @returns The singleton instance of RuleManager.
   */
  public static getInstance(workspaceFolder: vscode.WorkspaceFolder): RuleManager {
    if (!RuleManager.instance) {
      RuleManager.instance = new RuleManager(workspaceFolder);
    }
    return RuleManager.instance;
  }

  /**
   * Reads rules from the RULE_TABLE_JSON file.
   * @ignore Testing this function is not necessary.
   */
  private async readRuleTable(): Promise<Rule[]> {
    try {
      const fileUri = vscode.Uri.joinPath(this.workspaceFolder.uri, constants.RULE_TABLE_JSON);
      const fileData = await vscode.workspace.fs.readFile(fileUri);
      const fileContent = Buffer.from(fileData).toString("utf8");
      return JSON.parse(fileContent); // todo: do checking here...
    } catch (error) {
      vscode.window.showErrorMessage(`Error reading ${constants.RULE_TABLE_JSON}: ${error}`);
      return Promise.resolve([]);
    }
  }

  /**
   * Handle file changes by re-reading the rule table and returning changed rules.
   */
  public async handleFileChange(): Promise<void> {
    const oldRules: Rule[] = await this.rules;
    const newRules: Rule[] = await this.readRuleTable();
    const changedRules = this.getChangedRules(oldRules, newRules);
    // todo process the changed rules as needed
    console.log("Changed Rules: ", changedRules);
  }

  /**
   * Compares old rules with new rules and returns the changed rules.
   * @param oldRules - The old rules array.
   * @param newRules - The new rules array.
   * @returns An array of changed Rule objects.
   */
  public getChangedRules(oldRules: Rule[], newRules: Rule[]): Rule[] {
    const changedRules: Rule[] = [];
    const newRulesMap = new Map(newRules.map((rule) => [rule.id, rule]));

    oldRules.forEach((oldRule) => {
      const newRule = newRulesMap.get(oldRule.id);
      if (!newRule || JSON.stringify(oldRule) !== JSON.stringify(newRule)) {
        changedRules.push(newRule || oldRule); // Add new rule if exists, otherwise add old rule
      }
    });

    // Check for any new rules that didn't exist in old rules
    newRules.forEach((newRule) => {
      if (!oldRules.some((oldRule) => oldRule.id === newRule.id)) {
        changedRules.push(newRule);
      }
    });

    return changedRules;
  }

  /**
   * Gets the stored rules.
   * @returns A Promise of an array of Rule objects
   */
  public getRules(): Promise<Rule[]> {
    return this.rules;
  }
}

export { RuleManager };
