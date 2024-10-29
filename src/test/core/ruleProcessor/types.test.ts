import assert from "assert";
import { isValidRule, Rule } from "../../../core/ruleProcessor/types";

describe("isValidRule", () => {
    it("should return true for a valid Rule object", () => {
        const validRule: Rule = {
            index: "1",
            title: "Example Rule",
            description: "An example rule",
            tags: ["example"],
            rulePattern: { rule: {} }, // Assuming NapiConfig has a structure like this
            language: "JavaScript",
            filesAndFolders: ["src/", "lib/"],
            results: [
                [{
                    relativeFilePath: "src/file1.js",
                    snippets: [
                        {
                            snippet: "console.log(\"Hello, World!\");",
                            lines: { start: 1, end: 1 },
                            columns: { start: 0, end: 30 },
                            offsets: { start: 0, end: 30 },
                        },
                    ],
                }],
            ],
        };

        assert.strictEqual(isValidRule(validRule), true);
    });

    it("should return false for an object missing required properties", () => {
        const invalidRule = {
            title: "Invalid Rule", // Missing index, description, etc.
            tags: ["example"],
            language: "JavaScript",
        };

        assert.strictEqual(isValidRule(invalidRule), false);
    });

    it("should return false for an object with incorrect property types", () => {
        const invalidRule = {
            index: 1, // index should be a string
            title: "Invalid Rule",
            description: "This rule is invalid.",
            tags: ["example"],
            rulePattern: { rule: {} },
            language: "JavaScript",
        };

        assert.strictEqual(isValidRule(invalidRule), false);
    });

    it("should return false for an object with invalid tags", () => {
        const invalidRule = {
            index: "1",
            title: "Invalid Rule",
            description: "This rule is invalid.",
            tags: "not-an-array", // tags should be an array
            rulePattern: { rule: {} },
            language: "JavaScript",
        };

        assert.strictEqual(isValidRule(invalidRule), false);
    });

    it("should return false for an object with invalid snippets", () => {
        const invalidRule = {
            index: "1",
            title: "Invalid Rule",
            description: "This rule is invalid.",
            tags: ["example"],
            rulePattern: { rule: {} },
            language: "JavaScript",
            results: [
                [{
                    relativeFilePath: "src/file1.js",
                    snippets: [
                        {
                            snippet: "console.log(\"Hello, World!\");",
                            lines: { start: 1, end: 1 },
                            columns: { start: 0, end: 30 },
                            offsets: { start: 0, end: 30 },
                        },
                    ],
                }],
                [{
                    relativeFilePath: "src/file2.js",
                    snippets: [
                        { // Missing required properties
                            lines: { start: 1, end: 1 },
                            columns: { start: 0, end: 30 },
                            offsets: { start: 0, end: 30 },
                        },
                    ],
                }],
            ],
        };

        assert.strictEqual(isValidRule(invalidRule), false);
    });
});
