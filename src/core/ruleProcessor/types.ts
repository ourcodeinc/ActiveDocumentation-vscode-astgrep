import { NapiConfig } from "@ast-grep/napi";

export interface Rule {
    index: string,
    title: string,
    description: string,
    tags: string[],
    rulePattern: NapiConfig, // an object with a `rule` property
    language: string,
    filesAndFolders?: string[],
    results?: ResultObject[][]
}

export interface ResultObject {
    relativeFilePath: string,
    snippets: Snippet[]
}

export interface Snippet {
    snippet: string,
    lines: { start: number, end: number },
    columns: { start: number, end: number },
    offsets: { start: number, end: number }
}

/**
 * Checking if a given object is a valid Rule
 * @param obj
 * @returns
 */
export const isValidRule = (obj: unknown): obj is Rule => {
    if (typeof obj !== "object" || obj === null) return false;

    // Type assertion for object
    const ruleObj = obj as Record<string, unknown>;

    return (
        typeof ruleObj.index === "string" &&
        typeof ruleObj.title === "string" &&
        typeof ruleObj.description === "string" &&
        Array.isArray(ruleObj.tags) &&
        ruleObj.tags.every((tag) => typeof tag === "string") &&
        typeof ruleObj.rulePattern === "object" && // Assuming NapiConfig is an object
        ruleObj.rulePattern !== null &&
        typeof ruleObj.language === "string" &&
        (ruleObj.filesAndFolders === undefined ||
         (Array.isArray(ruleObj.filesAndFolders) &&
          ruleObj.filesAndFolders.every((folder) => typeof folder === "string"))) &&
        (ruleObj.results === undefined ||
         (Array.isArray(ruleObj.results) &&
          ruleObj.results.every((resultArray) =>
              Array.isArray(resultArray) &&
              resultArray.every((result) =>
                  typeof result.relativeFilePath === "string" &&
                  Array.isArray(result.snippets) &&
                  result.snippets.every((snippet: unknown) => {
                      const snippetCheck = snippet as Snippet;
                      return (
                          typeof snippetCheck.snippet === "string" &&
                        typeof snippetCheck.lines === "object" &&
                        snippetCheck.lines !== null &&
                        typeof snippetCheck.lines.start === "number" &&
                        typeof snippetCheck.lines.end === "number" &&
                        typeof snippetCheck.columns === "object" &&
                        snippetCheck.columns !== null &&
                        typeof snippetCheck.columns.start === "number" &&
                        typeof snippetCheck.columns.end === "number" &&
                        typeof snippetCheck.offsets === "object" &&
                        snippetCheck.offsets !== null &&
                        typeof snippetCheck.offsets.start === "number" &&
                        typeof snippetCheck.offsets.end === "number"
                      );
                  }),
              ),
          ))
        )
    );
};
