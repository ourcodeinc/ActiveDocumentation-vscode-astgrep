// eslint-disable-next-line import/no-unresolved
import * as vscode from "vscode";
import config from "./config";

import { webSocketManger } from "./websocket/webSocketManager";
import { RuleManager } from "./ruleManager";
import { FileChangeManager } from "./fileChangeManager";


export async function activate(context: vscode.ExtensionContext) {
  console.log("Extension ActiveDocumentation is now active.");
  vscode.window.showInformationMessage("Extension ActiveDocumentation is now active.");

  let workspaceFolder: vscode.WorkspaceFolder;

  if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
    workspaceFolder = vscode.workspace.workspaceFolders[0];
  } else {
    console.log("No workspace folders are open.");
    return;
  }

  const ruleManager = RuleManager.getInstance(workspaceFolder);
  ruleManager.getRules().then((rules) => {
    console.log(rules);
  });

  FileChangeManager.getInstance(workspaceFolder);

  const server = webSocketManger(config.websocketPort);

  context.subscriptions.push(new vscode.Disposable(() => server.close()));
}

export function deactivate() { }
