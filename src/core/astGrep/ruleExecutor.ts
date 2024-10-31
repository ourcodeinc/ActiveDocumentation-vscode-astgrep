import { parse, Lang, SgNode, NapiConfig } from "@ast-grep/napi";
import { Snippet } from "../ruleProcessor/types";
import { areNodesEqual } from "./astGrepUtilities";

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

/**
 * Returns Satisfied and Violated arrays based on Quantifier and Constraints arrays of SgNode.
 * @param quantifierNodes - The main array of SgNode objects
 * @param constraintNodes - The array of SgNode objects to be checked against Quantifier
 * @returns { { Satisfied: SgNode[], Violated: SgNode[] } } The Satisfied and Violated arrays
 */
export const getSatisfiedAndViolatedNodes = (quantifierNodes: SgNode[], constraintNodes: SgNode[]):
    { satisfiedNodes: SgNode[]; violatedNodes: SgNode[] } => {
    const satisfiedNodes: SgNode[] = [];
    const violatedNodes: SgNode[] = [];
    for (const quantifierNode of quantifierNodes) {
        const isSatisfied = constraintNodes.some((constraintNode) => areNodesEqual(quantifierNode, constraintNode));
        if (isSatisfied) {
            satisfiedNodes.push(quantifierNode);
        } else {
            violatedNodes.push(quantifierNode);
        }
    }
    // Check if all Constraints are satisfied
    if (satisfiedNodes.length !== constraintNodes.length) {
        console.info("ruleExecutor.getSatisfiedAndViolatedNodes:",
            "Not all the Constraint nodes are included in the Quantifier nodes. Check the rules.");
    }
    return { satisfiedNodes, violatedNodes };
};

/**
 * Runs the quantifier and constraint rules on a source and returns the satisfied and violated snippets
 * @param quantifierRule
 * @param constraintRule
 * @param source
 * @param lang
 * @returns The snippets for satisfied nodes and violated nodes.
 */
export const getSatifiedAndViolatedResults =
    (quantifierRule: NapiConfig, constraintRule: NapiConfig, source: string, lang: Lang):
    { satisfiedSnippets: Snippet[], violatedSnippets: Snippet[] } => {
        const quantifierNodes = executeRuleOnSource(quantifierRule, source, lang);
        const constraintNodes = executeRuleOnSource(constraintRule, source, lang);

        const sgNodesObject = getSatisfiedAndViolatedNodes(quantifierNodes, constraintNodes);
        const satisfiedSnippets = sgNodesObject.satisfiedNodes.map((sgNode: SgNode) => {
            return getSnippetFromSgNode(sgNode);
        });
        const violatedSnippets = sgNodesObject.violatedNodes.map((sgNode: SgNode) => {
            return getSnippetFromSgNode(sgNode);
        });
        return { satisfiedSnippets, violatedSnippets };
    };
