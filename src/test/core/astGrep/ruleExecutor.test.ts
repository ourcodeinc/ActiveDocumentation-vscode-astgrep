import * as assert from "assert";
import { executeRuleOnSource } from "../../../core/astGrep/ruleExecutor";
import { SgNode, NapiConfig, Lang } from "@ast-grep/napi";

describe("ruleExecutor", () => {
    // Mock data with explicit types
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

    describe("executeRuleOnSource", () => {
        it("should execute the rule on source code and return nodes", () => {
            const result: SgNode[] = executeRuleOnSource(mockRule, mockSourceCode, mockLang);
            assert.ok(Array.isArray(result));
            assert.ok(result.length === 2);
        });

        it("should return an empty array when given invalid source code", () => {
            const invalidSource: string = "invalid syntax here";
            const result: SgNode[] = executeRuleOnSource(mockRule, invalidSource, mockLang);
            assert.ok(Array.isArray(result));
            assert.strictEqual(result.length, 0);
        });

        it("should return an empty array when the rule doesn't match any node", () => {
            const nonMatchingRule: NapiConfig = {
                rule: {
                    pattern: "non.existent.pattern()",
                },
            };
            const result: SgNode[] = executeRuleOnSource(nonMatchingRule, mockSourceCode, mockLang);
            assert.ok(Array.isArray(result));
            assert.strictEqual(result.length, 0);
        });
    });
});
