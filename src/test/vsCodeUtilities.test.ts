// eslint-disable-next-line import/no-unresolved
import * as vscode from "vscode"; import * as assert from "assert";
import * as vsCodeUtilities from "../vsCodeUtilities";
import sinon, { createSandbox } from "sinon";

describe("getFileOrDirectoryContent", () => {
    let workspaceFolder: vscode.WorkspaceFolder;
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = createSandbox();
        workspaceFolder = {
            uri: vscode.Uri.parse("file:///dummy/path"),
        } as vscode.WorkspaceFolder;
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("getSourceFromRelativePath", () => {
        it("should return file content as string when file is found", async () => {
            const content = new TextEncoder().encode("Hello World");
            sandbox.stub(vsCodeUtilities, "readFile").resolves(content);
            const result = await vsCodeUtilities.getSourceFromRelativePath(workspaceFolder, "testFile.txt");
            assert.strictEqual(result, "Hello World");
        });

        it("should return an empty string when file is not found", async () => {
            sandbox.stub(vsCodeUtilities, "readFile").throws(new Error("File not found"));
            const result = await vsCodeUtilities.getSourceFromRelativePath(workspaceFolder, "testFile.txt");
            assert.strictEqual(result, "");
        });
    });

    describe("getFileOrDirectoryContent", () => {
        it("should return file content for a single file", async () => {
            sandbox.stub(vsCodeUtilities, "statFileType").resolves(vscode.FileType.File);
            const content = new TextEncoder().encode("File Content");
            sandbox.stub(vsCodeUtilities, "readFile").resolves(content);

            const result = await vsCodeUtilities.getFileOrDirectoryContent(workspaceFolder, "testFile.txt");
            assert.deepStrictEqual(result, [{ relativePath: "testFile.txt", source: "File Content" }]);
        });

        it("should return contents of files in a directory", async () => {
            sandbox.stub(vsCodeUtilities, "statFileType").resolves(vscode.FileType.Directory);
            sandbox.stub(vsCodeUtilities, "readDirectory").resolves([
                ["dir/file1.txt", vscode.FileType.File],
                ["dir/dir2/file2.txt", vscode.FileType.File],
                ["file3.txt", vscode.FileType.File],
            ]);
            sandbox.stub(vsCodeUtilities, "readFile").callsFake((uri: vscode.Uri) => {
                if (uri.fsPath.includes("file1.txt")) {
                    return Promise.resolve(new TextEncoder().encode("Content of file1"));
                } else if (uri.fsPath.includes("file2.txt")) {
                    return Promise.resolve(new TextEncoder().encode("Content of file2"));
                }
                return Promise.resolve(new TextEncoder().encode("Content of file3"));
            });
            sandbox.stub(vsCodeUtilities, "getRelativePath").callsFake((workspaceFolder, uri: vscode.Uri) => {
                if (uri.fsPath.includes("file1.txt")) {
                    return "dir/file1.txt";
                } else if (uri.fsPath.includes("file2.txt")) {
                    return "dir/dir2/file1.txt";
                }
                return "file3.txt";
            });

            const result = await vsCodeUtilities.getFileOrDirectoryContent(workspaceFolder, "");
            assert.deepStrictEqual(result, [
                { relativePath: "dir/file1.txt", source: "Content of file1" },
                { relativePath: "dir/dir2/file1.txt", source: "Content of file2" },
                { relativePath: "file3.txt", source: "Content of file3" },
            ]);
        });

        it("should handle errors and return empty content", async () => {
            sandbox.stub(vsCodeUtilities, "statFileType").throws(new Error("Error occurred"));

            const result = await vsCodeUtilities.getFileOrDirectoryContent(workspaceFolder, "nonexistent.txt");
            assert.deepStrictEqual(result, [{ relativePath: "nonexistent.txt", source: "" }]);
        });
    });
});
