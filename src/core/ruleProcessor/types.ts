import { NapiConfig } from "@ast-grep/napi";

export interface Rule {
    index: string,
    title: string,
    description: string,
    tags: string[],
    rulePatternQuantifier: NapiConfig, // an object with a `rule` property
    rulePatternConstraint: NapiConfig, // an object with a `rule` property
    language: string,
    filesAndFolders: string[],
    results?: ResultObject[][]
}

export interface ResultObject {
    relativeFilePath: string,
    snippets: { satisfiedSnippets: Snippet[], violatedSnippets: Snippet[] },
}

export interface Snippet {
    snippet: string,
    lines: { start: number, end: number },
    columns: { start: number, end: number },
    offsets: { start: number, end: number }
}


function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isStringArray(arr: unknown): arr is string[] {
    return Array.isArray(arr) && arr.every((item) => typeof item === "string");
}

function isResultObjectArray(arr: unknown): arr is ResultObject[][] {
    return Array.isArray(arr) && arr.every((row) =>
        Array.isArray(row) && row.every(isResultObject),
    );
}

function isSnippet(value: unknown): value is Snippet {
    return isObject(value) &&
           typeof value.snippet === "string" &&
           isObject(value.lines) &&
           typeof value.lines.start === "number" &&
           typeof value.lines.end === "number" &&
           isObject(value.columns) &&
           typeof value.columns.start === "number" &&
           typeof value.columns.end === "number" &&
           isObject(value.offsets) &&
           typeof value.offsets.start === "number" &&
           typeof value.offsets.end === "number";
}

function isResultObject(value: unknown): value is ResultObject {
    return isObject(value) &&
           typeof value.relativeFilePath === "string" &&
           isObject(value.snippets) &&
           Array.isArray(value.snippets.satisfiedSnippets) &&
           value.snippets.satisfiedSnippets.every(isSnippet) &&
           Array.isArray(value.snippets.violatedSnippets) &&
           value.snippets.violatedSnippets.every(isSnippet);
}

/**
 * Checks if an object is of type Rule
 * @param obj
 * @returns boolean
 */
export const isValidRule = (obj: unknown): obj is Rule => {
    return isObject(obj) &&
           typeof obj.index === "string" &&
           typeof obj.title === "string" &&
           typeof obj.description === "string" &&
           isStringArray(obj.tags) &&
           isObject(obj.rulePatternQuantifier) && // assuming NapiConfig has been validated elsewhere
           isObject(obj.rulePatternConstraint) && // assuming NapiConfig has been validated elsewhere
           typeof obj.language === "string" &&
           isStringArray(obj.filesAndFolders) &&
           (obj.results === undefined || isResultObjectArray(obj.results));
};
