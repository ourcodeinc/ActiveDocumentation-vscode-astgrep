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
        this.getInitialRuleTable();
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
     * Reads the initial rules from file and gets the results
     */
    public async getInitialRuleTable(): Promise<void> {
        const rules = await this.readRuleTable();
        const executedRules = await this.executeRules(rules);
        this.rules = executedRules;
        this.sendRulesToWebSocketManager(WEBSOCKET_SENT_MESSAGE.RULE_TABLE_MSG);
    }

    /**
     * Reads the updated rules and gets the results
     */
    public async updateRuleTable(): Promise<void> {
        const rules = await this.readRuleTable();
        const executedRules = await this.executeRules(rules);
        this.rules = executedRules;
        this.sendRulesToWebSocketManager(WEBSOCKET_SENT_MESSAGE.UPDATED_RULE_TABLE_MSG);
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
            console.log("RuleManager:", "The rule is not complete to be executed.", rule);
            return Promise.resolve(rule);
        }
        rule.results = [];
        for (const fileFolder of rule.filesAndFolders) {
            const results : ResultObject[] = await this.executeRuleOnFileFolder(rule, fileFolder);
            rule.results.push(results);
        }
        return Promise.resolve(rule);
    }

    /**
     * Runs a rule against the given file or files in the given folder
     * @param rule
     * @param fileFolder an entry in Rule.FilesAndFolders
     * @returns an array where each entry contains the results of a file
     */
    public async executeRuleOnFileFolder(rule: Rule, fileFolder: string): Promise<ResultObject[]> {
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
        return Promise.resolve(results);
    }


    public async updateRuleResultsOnFileChange(relativeFilePath: string): Promise<void> {
        for (let rule of this.rules) {
            const shouldUpdateRule = rule.filesAndFolders
                .some((fileFolder) => fileFolder === relativeFilePath || fileFolder.startsWith(relativeFilePath));
            if (shouldUpdateRule) {
                rule = await this.executeRule(rule);
            }
        }
        this.sendRulesToWebSocketManager(WEBSOCKET_SENT_MESSAGE.UPDATED_CODE_MSG);
    }

    /**
     * Sends the rules to WebSocketManager
     */
    public sendRulesToWebSocketManager(webSocketMessage: string): void {
        try {
            const queueMessage = createWebSocketMessage(WEBSOCKET_SENT_MESSAGE.RULE_TABLE_MSG, this.rules);
            this.webSocketManager.updateMessageQueue(WEBSOCKET_SENT_MESSAGE.RULE_TABLE_MSG, queueMessage);
            const message = createWebSocketMessage(webSocketMessage, this.rules);
            this.webSocketManager.broadcast(message);
        } catch (error) {
            console.error("RuleManager:", "Error in createWebSocketMessage()", error);
        }
    }
}

export { RuleManager };
