/* eslint-disable @typescript-eslint/naming-convention */
import { Lang, SgNode } from "@ast-grep/napi";

const langMap: { [key: string]: Lang | undefined } = {
    JavaScript: Lang.JavaScript,
    Java: Lang.Java,
    Python: Lang.Python,
};

export const getLangFromString = (lang: string): Lang | undefined => {
    return langMap[lang];
};

/**
 * @ignore for tests
 */
export const areNodesEqual = (node1: SgNode, node2: SgNode): boolean => {
    return (
        node1.kind() === node2.kind() &&
        node1.text() === node2.text() &&
        node1.range().start.column === node2.range().start.column &&
        node1.range().start.index === node2.range().start.index &&
        node1.range().start.line === node2.range().start.line &&
        node1.range().end.column === node2.range().end.column &&
        node1.range().end.index === node2.range().end.index &&
        node1.range().end.line === node2.range().end.line
    );
};
