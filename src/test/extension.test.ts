import assert from "assert";
import { spy } from "sinon";

// Mocking vscode
const vscode = {
    window: {
        showInformationMessage: spy(),
    },
};

// Mocking the import for vscode
import proxyquire from "proxyquire";

// Importing the extension with mocked vscode
const { activate, deactivate } = proxyquire.noCallThru()("../extension", {
    vscode: vscode,
});

describe("Extension Tests", () => {
    afterEach(() => {
        vscode.window.showInformationMessage.resetHistory();
    });

    it("should show information message when activated", () => {
        activate();
        assert.ok(vscode.window.showInformationMessage.calledWith(
            "Extension ActiveDocumentation is now active."), "Information message mismatch");
    });

    it("should have a deactivate function", () => {
        assert.strictEqual(typeof deactivate, "function", "Deactivate should be a function");
    });
});
