import { Lang, NapiConfig } from "@ast-grep/napi";
import { executeRuleOnSource } from "./ruleExecutor";

export const example = () => {
    const source = "class UserCon {\n" +
        "  getUser(id) {\n" +
        "    return `User with ID: ${id}`;\n" +
        "  }\n" +
        "\n" +
        "  @override \n" +
        "  getAllUsers() {\n" +
        "    return [\"User1\", \"User2\", \"User3\"];\n" +
        "  }\n" +
        "}\n" +
        "\n" +
        "class ConB {\n" +
        "  getTY() {\n" +
        "    return 0;\n" +
        "  }\n" +
        "}";
    // let pattern = "class $CLASS_CONTROLLER {\n" +
    //     "$$$" +
    //     // "  get $GET_FUNC($$$ARGS) { $$$ }\n" +
    //     // "$$$" +
    //     "}\n"

    const myRule: NapiConfig = {
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

    try {
        const nodes = executeRuleOnSource(myRule, source, Lang.JavaScript);
        console.log({ text: nodes.map((d) => d.text()) });
        console.log({ text: nodes.map((d) => [d.range().start.line, d.range().end.line]) });
    } catch (e) {
        console.log(e);
    }
};
