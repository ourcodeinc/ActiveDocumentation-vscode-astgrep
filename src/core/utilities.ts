// eslint-disable-next-line import/no-unresolved
import * as vscode from "vscode";

/**
 * Generates the WebSocket-ready message
 * @param command
 * @param data
 * @returns
 * @throws Error when the data is not a plain object
 */
export const createWebSocketMessage = (command: string, data: object) : string => {
    return JSON.stringify({
        command: command,
        data: data,
    });
};

/**
 * Reads the contents of a file given the relative path and vscode workspace
 * @param workspaceFolder
 * @param relativePath
 * @returns
 */
export const getSourceFromRelativePath =
    async (workspaceFolder: vscode.WorkspaceFolder, relativePath: string) : Promise<string> => {
        let fileUri : vscode.Uri = vscode.Uri.file(relativePath);
        try {
            fileUri = vscode.Uri.joinPath(workspaceFolder.uri, relativePath);
            const fileData = await vscode.workspace.fs.readFile(fileUri);
            return Buffer.from(fileData).toString("utf8");
        } catch (error) {
            console.log("utilities.getSourceFromRelativePath:", `Failed to read file ${fileUri?.toString()}`);
            return Promise.resolve("");
        }
    };
