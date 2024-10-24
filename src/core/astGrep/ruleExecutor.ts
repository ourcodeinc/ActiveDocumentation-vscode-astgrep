import { parse, Lang, SgNode, NapiConfig } from "@ast-grep/napi";
import { Snippet } from "../types";

/**
 * Runs the rule on a given sourcecode.
 * @param rule {NapiConfig} The rule executable by ast-grep. Ref: https://ast-grep.github.io/guide/rule-config.html
 * @param source {string} The sourcecode of the file on which the rule is executed on.
 * @param lang {Lang} The language of the sourcecode.
 */
export const executeRuleOnSource = (rule: NapiConfig, source: string, lang: Lang) : SgNode[] => {
    if (source === "") {
        return [];
    }
    try {
        const ast = parse(lang, source);
        const root = ast.root();
        return executeRuleOnAstRoot(rule, root);
    } catch (e) {
        console.log("ruleExecutor.executeRuleOnSource:", "Error happened in executing the rule.", e);
        return [];
    }
};

/**
 * Runs the rule on a given ast root.
 * @param rule {NapiConfig} The rule executable by ast-grep. Ref: https://ast-grep.github.io/guide/rule-config.html
 * @param source {string} The sourcecode of the file on which the rule is executed on.
 * @ignore This method is a thin wrapper around @ast-grep/napi and is excluded from unit tests.
 * (findAll() method is not identified in tests.)
 */
export const executeRuleOnAstRoot = (rule: NapiConfig, root: SgNode) : SgNode[] => {
    try {
        const nodes = root.findAll(rule);
        return nodes;
    } catch (e) {
        console.log("ruleExecutor.executeRuleOnAstRoot:",
            "Error happened in finding the matches of the rule in the AST of the sourcecode.", e);
        return [];
    }
};

/**
 * Returns the Snippet object from SgNode
 * @param sgNode
 * @returns {Snippet}
 */
export const getSnippetFromSgNode = (sgNode: SgNode) : Snippet => {
    return {
        snippet: sgNode.text(),
        lines: { start: sgNode.range().start.line, end: sgNode.range().end.line },
        columns: { start: sgNode.range().start.column, end: sgNode.range().end.column },
        offsets: { start: sgNode.range().start.index, end: sgNode.range().end.index },
    } as Snippet;
};
