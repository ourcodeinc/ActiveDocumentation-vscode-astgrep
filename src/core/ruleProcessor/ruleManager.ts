// eslint-disable-next-line import/no-unresolved
import * as vscode from "vscode";
import { constants } from "../../constants";
import { isValidRule, ResultObject, Rule, Snippet } from "./types";
import { WebSocketManager } from "../../websocket/webSocketManager";
import { WEBSOCKET_SENT_MESSAGE } from "../../websocket/webSocketConstants";
import { createWebSocketMessage } from "../../utilities";
import { getSourceFromRelativePath, getFileOrDirectoryContent } from "../../vsCodeUtilities";
import { executeRuleOnSource, getSnippetFromSgNode } from "../astGrep/ruleExecutor";
import { SgNode } from "@ast-grep/napi";
import { getLangFromString } from "../astGrep/astGrepUtilities";

/**
 * Singleton class to manage rules from ruleTable.json.
 */
class RuleManager {
    private static instance: RuleManager | null = null;
    public rules: Rule[] = [];
    public workspaceFolder: vscode.WorkspaceFolder;
    private webSocketManager: WebSocketManager;

    /**
   * Private constructor to prevent direct instantiation.
   * @param workspaceFolder - The workspace folder where the ruleTable.json is located.
   */
    private constructor(workspaceFolder: vscode.WorkspaceFolder, webSocketManager: WebSocketManager) {
        this.workspaceFolder = workspaceFolder;
        this.webSocketManager = webSocketManager;
        this.updateRuleTable();
    }

    /**
   * Static method to get the instance of RuleManager.
   * @param workspaceFolder - The workspace folder to associate with the RuleManager.
   * @param webSocketManager - The manager used for handling websockets
   * @returns The singleton instance of RuleManager.
   */
    public static getInstance(workspaceFolder: vscode.WorkspaceFolder, webSocketManager: WebSocketManager): RuleManager {
        if (!RuleManager.instance) {
            RuleManager.instance = new RuleManager(workspaceFolder, webSocketManager);
        }
        return RuleManager.instance;
    }

    /**
   * Reads rules from the RULE_TABLE_JSON file.
   * @ignore Testing this function is not necessary.
   */
    public async readRuleTable(): Promise<Rule[]> {
        try {
            const fileContent = await getSourceFromRelativePath(this.workspaceFolder, constants.RULE_TABLE_FILE);
            const parsedObjs = JSON.parse(fileContent);
            if (!Array.isArray(parsedObjs)) {
                vscode.window.showErrorMessage(`Error ${constants.RULE_TABLE_FILE} is not an array.`);
                return Promise.resolve([]);
            }
            return Promise.resolve(parsedObjs.filter((parsedObj: object) => isValidRule(parsedObj)));
        } catch (error) {
            vscode.window.showErrorMessage(`Error reading ${constants.RULE_TABLE_FILE}: ${error}`);
            return Promise.resolve([]);
        }
    }

    /**
     * Reads and updates the rules and sends the new rules to WebSocket
     */
    public async updateRuleTable(): Promise<void> {
        const rules = await this.readRuleTable();
        const executedRules = await this.executeRules(rules);
        this.rules = executedRules;
        this.sendRulesToWebSocketManager();
    }

    /**
     * Runs the rules against the code
     * @param rules
     * @returns Promise of the rules with updated results
     */
    public executeRules(rules: Rule[]): Promise<Rule[]> {
        const rulePromises = rules.map((rule) => this.executeRule(rule));
        return Promise.all(rulePromises);
    }

    /**
     * Runs a rule against the code
     * @param rule
     * @returns Promise of the rule with updated results
     */
    public async executeRule(rule: Rule): Promise<Rule> {
        if (!rule.filesAndFolders || !rule.rulePattern) {
            return Promise.resolve(rule);
        }
        rule.results = [];

        for (const fileFolder of rule.filesAndFolders) {
            const pathsAndSources = await getFileOrDirectoryContent(this.workspaceFolder, fileFolder);
            const results : ResultObject[] = [];
            pathsAndSources.forEach((pathAndSource) => {
                let snippets: Snippet[] = [];
                const source = pathAndSource.source;
                const language = getLangFromString(rule.language);
                if (source !== "") {
                    if (language !== undefined) {
                        const sgNodes = executeRuleOnSource(rule.rulePattern, source, language!);
                        snippets = sgNodes.map((sgNode: SgNode) => {
                            return getSnippetFromSgNode(sgNode);
                        });
                    } else {
                        console.log("RuleManager:", "The language of the rule is not supported.");
                    }
                }
                results.push({ relativeFilePath: pathAndSource.relativePath, snippets: snippets } as ResultObject);
            });
            rule.results.push(results);
        }
        return Promise.resolve(rule);
    }

    /**
     * Sends the rules to WebSocketManager
     */
    public sendRulesToWebSocketManager(): void {
        try {
            const message = createWebSocketMessage(WEBSOCKET_SENT_MESSAGE.RULE_TABLE_MSG, this.rules);
            this.webSocketManager.queueMessage(WEBSOCKET_SENT_MESSAGE.RULE_TABLE_MSG, message );
        } catch (error) {
            console.error("RuleManager:", "Error in createWebSocketMessage()", error);
        }
    }
}

export { RuleManager };
