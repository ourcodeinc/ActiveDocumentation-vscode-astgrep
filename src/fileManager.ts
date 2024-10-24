// eslint-disable-next-line import/no-unresolved
import * as vscode from "vscode";
import { constants } from "./constants";
import { RuleManager } from "./core/ruleProcessor/ruleManager";
import { WebSocketManager } from "./websocket/webSocketManager";

/**
 * Singleton class to manage file change events within a workspace.
 */
export class FileManager {
    private static instance: FileManager | null = null;
    private workspaceFolder: vscode.WorkspaceFolder;
    private webSocketManager: WebSocketManager;

    /**
   * Private constructor to prevent direct instantiation.
   * @param workSpaceFolder - The workspace folder being monitored for changes.
   */
    private constructor(workSpaceFolder: vscode.WorkspaceFolder, webSocketManager: WebSocketManager) {
        this.workspaceFolder = workSpaceFolder;
        this.webSocketManager = webSocketManager;
        this.watchWorkspaceChanges();
    }

    /**
   * Static method to get the singleton instance of FileChangeManager.
   * @param ws - The WebSocket instance for communication.
   * @param workSpaceFolder - The workspace folder to associate with the FileChangeManager.
   * @returns The singleton instance of FileChangeManager.
   */
    public static getInstance(workSpaceFolder: vscode.WorkspaceFolder, webSocketManager: WebSocketManager): FileManager {
        if (!FileManager.instance) {
            FileManager.instance = new FileManager(workSpaceFolder, webSocketManager);
        }
        return FileManager.instance;
    }

    /**
   * Starts watching for text document changes in the workspace.
   * Registers the debounced function to handle document change events.
   */
    private watchWorkspaceChanges() {
        vscode.workspace.onDidSaveTextDocument((document) => this.handleSaveTextDocument(document));
    }

    /**
   * Handles save actions on text documents in the workspace.
   * @param document - The event containing information about the text document change.
   */
    public handleSaveTextDocument(document: vscode.TextDocument) {
        const fileUri = vscode.Uri.joinPath(this.workspaceFolder.uri, constants.RULE_TABLE_FILE);
        if (document.uri.toString() === fileUri.toString()) {
            const ruleManager = RuleManager.getInstance(this.workspaceFolder, this.webSocketManager);
            ruleManager.updateRuleTable();
        }
    }
}
