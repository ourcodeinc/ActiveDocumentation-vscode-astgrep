// eslint-disable-next-line import/no-unresolved
import * as vscode from "vscode";
import config from "./config";
import { WebSocketManager } from "./websocket/webSocketManager";
import { RuleManager } from "./core/ruleProcessor/ruleManager";
import { FileManager } from "./fileManager";


export async function activate(context: vscode.ExtensionContext) {
    console.log("Extension ActiveDocumentation is now active.");
    vscode.window.showInformationMessage("Extension ActiveDocumentation is now active.");

    let workspaceFolder: vscode.WorkspaceFolder;

    // Check for workspace
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        workspaceFolder = vscode.workspace.workspaceFolders[0];
    } else {
        console.log("No workspace folders are open.");
        return;
    }

    // Opening the server
    const server = new WebSocketManager(config.websocketPort);

    // Instantiating the managers
    RuleManager.getInstance(workspaceFolder, server);
    FileManager.getInstance(workspaceFolder, server);

    context.subscriptions.push(new vscode.Disposable(() => server.close()));
}

export function deactivate() { }
