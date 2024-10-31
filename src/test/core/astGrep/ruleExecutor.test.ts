import assert from "assert";
import * as sinon from "sinon";
import * as ruleExecutor from "../../../core/astGrep/ruleExecutor";
import * as astGrepUtilities from "../../../core/astGrep/astGrepUtilities";
import { SgNode, NapiConfig, Lang } from "@ast-grep/napi";

describe("ruleExecutor", () => {
    const sandbox = sinon.createSandbox();
    const mockLang: Lang = Lang.JavaScript;
    const mockSourceCode: string = `
    class UserCon {
        getUser(id) {
            return \`User with ID: \${id}\`;
        }

        @override
        getAllUsers() {
            return ["User1", "User2", "User3"];
        }
    }

    class ConB {
        getTY() {
            return 0;
        }
    }`;

    const mockRule: NapiConfig = {
        rule: {
            kind: "method_definition",
            pattern: "$FUNC",
            inside: {
                kind: "class_body",
                follows: {
                    kind: "identifier",
                    regex: "^.*Con$",
                },
            },
            has: {
                kind: "property_identifier",
                regex: "^get.*$",
            },
        },
    };

    const mockQuantifierRule: NapiConfig = {
        rule: { kind: "method_definition", pattern: "$FUNC" },
    };
    const mockConstraintRule: NapiConfig = {
        rule: { kind: "method_definition", pattern: "$FUNC" },
    };

    let mockSgNode1: SgNode;
    let mockSgNode2: SgNode;
    let quantifierNodes: SgNode[];
    let constraintNodes: SgNode[];

    beforeEach(() => {
        mockSgNode1 = sinon.createStubInstance(SgNode);
        mockSgNode2 = sinon.createStubInstance(SgNode);
        quantifierNodes = [mockSgNode1, mockSgNode2];
        constraintNodes = [mockSgNode1];
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("executeRuleOnSource", () => {
        it("should execute the rule on source code and return nodes", () => {
            const result: SgNode[] = ruleExecutor.executeRuleOnSource(mockRule, mockSourceCode, mockLang);
            assert.ok(Array.isArray(result));
            assert.ok(result.length === 2);
        });

        it("should return an empty array when given invalid source code", () => {
            const invalidSource: string = "invalid syntax here";
            const result: SgNode[] = ruleExecutor.executeRuleOnSource(mockRule, invalidSource, mockLang);
            assert.ok(Array.isArray(result));
            assert.strictEqual(result.length, 0);
        });

        it("should return an empty array when the rule doesn't match any node", () => {
            const nonMatchingRule: NapiConfig = {
                rule: {
                    pattern: "non.existent.pattern()",
                },
            };
            const result: SgNode[] = ruleExecutor.executeRuleOnSource(nonMatchingRule, mockSourceCode, mockLang);
            assert.ok(Array.isArray(result));
            assert.strictEqual(result.length, 0);
        });
    });

    describe("getSatisfiedAndViolatedNodes", () => {
        it("should return correct satisfied and violated nodes when constraints are met", () => {
            const areNodesEqualStub = sandbox.stub(astGrepUtilities, "areNodesEqual")
                .callsFake((node1, node2) => {
                    if (node1 === mockSgNode1 && node2 === mockSgNode1) {
                        return true;
                    }
                    return false;
                });
            const result = ruleExecutor.getSatisfiedAndViolatedNodes(quantifierNodes, constraintNodes);

            assert(areNodesEqualStub.called,
                "astGrepUtilities.areNodesEqual should have been called, but it didn't");
            assert.deepStrictEqual(result.satisfiedNodes, [mockSgNode1]);
            assert.deepStrictEqual(result.violatedNodes, [mockSgNode2]);
        });

        it("should return correct satisfied and violated nodes when some constraints are not in quantifier", () => {
            const mockSgNode3 = sinon.createStubInstance(SgNode);
            const areNodesEqualStub = sandbox.stub(astGrepUtilities, "areNodesEqual")
                .callsFake((node1, node2) => {
                    if (node1 === mockSgNode1 && node2 === mockSgNode1) {
                        return true;
                    }
                    return false;
                });

            const quantifierNodes = [mockSgNode1, mockSgNode2];
            const constraintNodes = [mockSgNode1, mockSgNode3];

            const result = ruleExecutor.getSatisfiedAndViolatedNodes(quantifierNodes, constraintNodes);

            assert(areNodesEqualStub.called,
                "astGrepUtilities.areNodesEqual should have been called, but it didn't");
            assert.deepStrictEqual(result.satisfiedNodes, [mockSgNode1]);
            assert.deepStrictEqual(result.violatedNodes, [mockSgNode2]);
        });

        it("should return empty arrays if quantifierNodes is empty", () => {
            const result = ruleExecutor.getSatisfiedAndViolatedNodes([], constraintNodes);

            assert.deepStrictEqual(result.satisfiedNodes, []);
            assert.deepStrictEqual(result.violatedNodes, []);
        });

        it("should return all nodes in violated if constraintNodes is empty", () => {
            const result = ruleExecutor.getSatisfiedAndViolatedNodes(quantifierNodes, []);

            assert.deepStrictEqual(result.satisfiedNodes, []);
            assert.deepStrictEqual(result.violatedNodes, quantifierNodes);
        });
    });

    describe("getSatifiedAndViolatedResults", () => {
        it("should return expected satisfied and violated snippets", () => {
            const mockSnippet1 = {
                snippet: "mockSnippet1",
                lines: { start: 1, end: 2 },
                columns: { start: 0, end: 5 },
                offsets: { start: 0, end: 10 },
            };
            const mockSnippet2 = {
                snippet: "mockSnippet2",
                lines: { start: 3, end: 4 },
                columns: { start: 0, end: 5 },
                offsets: { start: 10, end: 20 },
            };
            sandbox.stub(ruleExecutor, "executeRuleOnSource")
                .withArgs(mockQuantifierRule, mockSourceCode, mockLang)
                .returns(quantifierNodes)
                .withArgs(mockConstraintRule, mockSourceCode, mockLang)
                .returns(constraintNodes);

            sandbox.stub(ruleExecutor, "getSatisfiedAndViolatedNodes").returns({
                satisfiedNodes: [quantifierNodes[0]],
                violatedNodes: [quantifierNodes[1]],
            });

            sandbox.stub(ruleExecutor, "getSnippetFromSgNode")
                .onCall(0).returns(mockSnippet1)
                .onCall(1).returns(mockSnippet2);

            const result = ruleExecutor.getSatifiedAndViolatedResults(mockQuantifierRule, mockConstraintRule, mockSourceCode, mockLang);

            assert.deepStrictEqual(result.satisfiedSnippets, [mockSnippet1]);
            assert.deepStrictEqual(result.violatedSnippets, [mockSnippet2]);
        });

        it("should handle empty quantifier or constraint results", () => {
            sandbox.stub(ruleExecutor, "executeRuleOnSource")
                .withArgs(mockQuantifierRule, mockSourceCode, mockLang).returns([])
                .withArgs(mockConstraintRule, mockSourceCode, mockLang).returns([]);
            sandbox.stub(ruleExecutor, "getSatisfiedAndViolatedNodes").returns({ satisfiedNodes: [], violatedNodes: [] });
            const getSnippetsSpy = sandbox.spy(ruleExecutor, "getSnippetFromSgNode");

            const { satisfiedSnippets, violatedSnippets } = ruleExecutor.getSatifiedAndViolatedResults(
                mockQuantifierRule, mockConstraintRule, mockSourceCode, mockLang,
            );

            assert.ok(getSnippetsSpy.notCalled,
                `getSnippetFromSgNode should not be called but is called ${getSnippetsSpy.callCount} times.`);
            assert.strictEqual(satisfiedSnippets.length, 0);
            assert.strictEqual(violatedSnippets.length, 0);
        });
    });
});
