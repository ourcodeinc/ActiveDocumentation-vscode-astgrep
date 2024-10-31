import * as assert from "assert";
import { isValidRule, Rule, Snippet, ResultObject } from "../../../core/ruleProcessor/types";
import { NapiConfig } from "@ast-grep/napi";
import * as sinon from "sinon";

describe("isValidRule", () => {
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    // Helper functions for creating mock objects
    const createValidSnippet = (): Snippet => ({
        snippet: "sample snippet",
        lines: { start: 1, end: 2 },
        columns: { start: 1, end: 10 },
        offsets: { start: 1, end: 20 },
    });

    const createValidResultObject = (): ResultObject => ({
        relativeFilePath: "src/file.js",
        snippets: {
            satisfiedSnippets: [createValidSnippet()],
            violatedSnippets: [createValidSnippet()],
        },
    });

    const createValidRule = (): Rule => ({
        index: "1",
        title: "Test Rule",
        description: "This is a test rule.",
        tags: ["test", "rule"],
        rulePatternQuantifier: { rule: { kind: "method_definition", pattern: "$FUNC" } } as NapiConfig,
        rulePatternConstraint: { rule: { kind: "method_definition", pattern: "$FUNC" } } as NapiConfig,
        language: "JavaScript",
        filesAndFolders: ["src/"],
        results: [[createValidResultObject()]],
    });

    it("should return true for a valid Rule object", () => {
        const validRule = createValidRule();
        assert.strictEqual(isValidRule(validRule), true);
    });

    it("should return false if 'index' is missing", () => {
        const invalidRule = { ...createValidRule(), index: undefined };
        assert.strictEqual(isValidRule(invalidRule), false);
    });

    it("should return false if 'tags' is not a string array", () => {
        const invalidRule = { ...createValidRule(), tags: [123, 456] };
        assert.strictEqual(isValidRule(invalidRule), false);
    });

    it("should return false if 'rulePatternQuantifier' is not an object", () => {
        const invalidRule = { ...createValidRule(), rulePatternQuantifier: null };
        assert.strictEqual(isValidRule(invalidRule), false);
    });

    it("should return false if 'filesAndFolders' is not a string array", () => {
        const invalidRule = { ...createValidRule(), filesAndFolders: [123, "src/"] };
        assert.strictEqual(isValidRule(invalidRule), false);
    });

    it("should return true if 'results' is undefined", () => {
        const validRule = { ...createValidRule(), results: undefined };
        assert.strictEqual(isValidRule(validRule), true);
    });

    it("should return false if 'results' contains invalid ResultObject arrays", () => {
        const invalidRule = { ...createValidRule(), results: [[{ relativeFilePath: 123 }]] };
        assert.strictEqual(isValidRule(invalidRule), false);
    });

    it("should return false if 'snippets' contains invalid Snippet objects", () => {
        const invalidSnippet = { snippet: 123, lines: { start: 1, end: 1 }, columns: { start: 0, end: 10 }, offsets: { start: 0, end: 10 } };
        const invalidResultObject = { ...createValidResultObject(), snippets: { satisfiedSnippets: [invalidSnippet], violatedSnippets: [] } };
        const invalidRule = { ...createValidRule(), results: [[invalidResultObject]] };
        assert.strictEqual(isValidRule(invalidRule), false);
    });

    it("should handle large, deeply nested valid Rule structures", () => {
        const largeValidRule = { ...createValidRule(), results: Array(100).fill(Array(50).fill(createValidResultObject())) };
        assert.strictEqual(isValidRule(largeValidRule), true);
    });
});
