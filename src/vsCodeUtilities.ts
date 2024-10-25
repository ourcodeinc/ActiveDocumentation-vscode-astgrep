// eslint-disable-next-line import/no-unresolved
import * as vscode from "vscode";

export const statFileType = async (uri: vscode.Uri): Promise<vscode.FileType> => {
    return (await vscode.workspace.fs.stat(uri)).type;
};

export const readFile = async (uri: vscode.Uri): Promise<Uint8Array> => {
    return vscode.workspace.fs.readFile(uri);
};

export const readDirectory = async (uri: vscode.Uri): Promise<[string, vscode.FileType][]> => {
    return vscode.workspace.fs.readDirectory(uri);
};

export const getRelativePath = (workspaceFolder: vscode.WorkspaceFolder, uri: vscode.Uri): string => {
    const workspacePath = workspaceFolder.uri.fsPath;
    const filePath = uri.fsPath;

    if (filePath.startsWith(workspacePath)) {
        return filePath.slice(workspacePath.length + 1); // +1 to remove the trailing separator
    }
    return uri.fsPath;
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
            const fileContent = await readFile(fileUri);
            return new TextDecoder().decode(fileContent);
        } catch (error) {
            console.log("utilities.getSourceFromRelativePath:", `Failed to read file ${fileUri?.toString()}`);
            return Promise.resolve("");
        }
    };

/**
 * Given the relative path of a file, reads the contents of a file.
 * For a folder, reads the contents, reads the contents of the files within that folder.
 * @param workspaceFolder
 * @param relativePath of a file of folder
 * @returns
 */
export const getFileOrDirectoryContent =
    async (workspaceFolder: vscode.WorkspaceFolder, relativePath: string):
    Promise<{relativePath: string, source: string}[]> => {
        try {
            const uri = vscode.Uri.joinPath(workspaceFolder.uri, relativePath);
            const fileType = await statFileType(uri);

            if (fileType === vscode.FileType.File) {
                const fileContent = await readFile(uri);
                return [{ relativePath: relativePath, source: new TextDecoder().decode(fileContent) }];
            } else if (fileType === vscode.FileType.Directory) {
                const entries = await readDirectory(uri);
                const contentPromises = entries
                    .filter(([, type]) => type === vscode.FileType.File)
                    .map(async ([name]) => {
                        const fileUri = vscode.Uri.joinPath(uri, name);
                        const fileContent = await readFile(fileUri);
                        return { relativePath: getRelativePath(workspaceFolder, fileUri), source: new TextDecoder().decode(fileContent) };
                    });
                return Promise.all(contentPromises);
            } else {
                console.log(`${uri.toString()} is neither a file nor a directory`);
                return Promise.resolve([{ relativePath: relativePath, source: "" }]);
            }
        } catch (error) {
            console.log(`Error happened in reading ${relativePath}`);
            return Promise.resolve([{ relativePath: relativePath, source: "" }]);
        }
    };

