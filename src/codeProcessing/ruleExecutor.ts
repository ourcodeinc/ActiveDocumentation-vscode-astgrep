import { parse, Lang, SgNode, NapiConfig } from "@ast-grep/napi";

/**
 * Run the rule on a given sourcecode.
 * @param rule {NapiConfig} The rule executable by ast-grep. Ref: https://ast-grep.github.io/guide/rule-config.html
 * @param source {string} The sourcecode of the file on which the rule is executed on.
 * @param lang {Lang} The language of the sourcecode.
 */
export const executeRuleOnSource = (rule: NapiConfig, source: string, lang: Lang) : SgNode[] => {
  try {
    const ast = parse(lang, source);
    const root = ast.root();
    return executeRuleOnAstRoot(rule, root);
  } catch (e) {
    console.log("Error happened in executing the rule.", e);
    return [];
  }
};

/**
 * Run the rule on a given ast root.
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
    console.log("Error happened in finding the matches of the rule in the AST of the sourcecode.", e);
    return [];
  }
};
