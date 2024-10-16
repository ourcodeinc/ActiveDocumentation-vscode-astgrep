// eslint-disable-next-line import/no-unresolved
import * as vscode from "vscode";
import { constants } from "./constants";
import { RuleManager } from "./ruleManager";

/**
 * Singleton class to manage file change events within a workspace.
 */
export class FileChangeManager {
  private static instance: FileChangeManager;
  private workspaceFolder: vscode.WorkspaceFolder;


  /**
   * Private constructor to prevent direct instantiation.
   * @param workSpaceFolder - The workspace folder being monitored for changes.
   */
  private constructor(workSpaceFolder: vscode.WorkspaceFolder) {
    this.workspaceFolder = workSpaceFolder;

    this.watchWorkspaceChanges();
  }

  /**
   * Static method to get the singleton instance of FileChangeManager.
   * @param ws - The WebSocket instance for communication.
   * @param workSpaceFolder - The workspace folder to associate with the FileChangeManager.
   * @returns The singleton instance of FileChangeManager.
   */
  public static getInstance(workSpaceFolder: vscode.WorkspaceFolder): FileChangeManager {
    if (!FileChangeManager.instance) {
      FileChangeManager.instance = new FileChangeManager(workSpaceFolder);
    }
    return FileChangeManager.instance;
  }

  /**
   * Starts watching for text document changes in the workspace.
   * Registers the debounced function to handle document change events.
   */
  private watchWorkspaceChanges() {
    vscode.workspace.onDidSaveTextDocument(this.handleSaveTextDocument);
  }

  /**
   * Handles save actions on text documents in the workspace.
   * @param document - The event containing information about the text document change.
   */
  private async handleSaveTextDocument(document: vscode.TextDocument) {
    console.log(`Document saved: ${document.uri.toString()}`);

    const fileUri = vscode.Uri.joinPath(this.workspaceFolder.uri, constants.RULE_TABLE_JSON);
    if (document.uri.toString() === fileUri.toString()) {
      const ruleManager = RuleManager.getInstance(this.workspaceFolder);
      ruleManager.handleFileChange();
    }
  }
}
