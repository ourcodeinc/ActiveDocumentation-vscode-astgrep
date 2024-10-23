// eslint-disable-next-line import/no-unresolved
import * as vscode from "vscode";
import { constants } from "../../constants";
import { Rule } from "../types";
import { WebSocketManager } from "../../websocket/webSocketManager";
import { WEBSOCKET_SENT_MESSAGE } from "../../websocket/webSocketConstants";
import { createWebSocketMessage } from "../utilities";

/**
 * Singleton class to manage rules from ruleTable.json.
 */
class RuleManager {
    private static instance: RuleManager | null = null;
    private rules: Rule[] = [];
    private workspaceFolder: vscode.WorkspaceFolder;
    private webSocketManager: WebSocketManager;

    /**
   * Private constructor to prevent direct instantiation.
   * @param workspaceFolder - The workspace folder where the ruleTable.json is located.
   */
    private constructor(workspaceFolder: vscode.WorkspaceFolder, webSocketManager: WebSocketManager) {
        this.workspaceFolder = workspaceFolder;
        this.webSocketManager = webSocketManager;
        this.readRuleTable().then((rules) => {
            this.rules = rules;
            this.sendRules();
        });
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
            const fileUri = vscode.Uri.joinPath(this.workspaceFolder.uri, constants.RULE_TABLE_FILE);
            const fileData = await vscode.workspace.fs.readFile(fileUri);
            const fileContent = Buffer.from(fileData).toString("utf8");
            return JSON.parse(fileContent); // todo: do checking here...
        } catch (error) {
            vscode.window.showErrorMessage(`Error reading ${constants.RULE_TABLE_FILE}: ${error}`);
            return Promise.resolve([]);
        }
    }

    /**
   * Handle file changes by re-reading the rule table and returning changed rules.
   */
    public handleFileChange(): void {
        this.readRuleTable().then((rules) => {
            this.rules = rules;
            this.sendRules();
        });
    }

    public sendRules(): void {
        this.webSocketManager.queueMessage(WEBSOCKET_SENT_MESSAGE.RULE_TABLE_MSG,
            createWebSocketMessage(WEBSOCKET_SENT_MESSAGE.RULE_TABLE_MSG, this.rules) );
    }
}

export { RuleManager };
