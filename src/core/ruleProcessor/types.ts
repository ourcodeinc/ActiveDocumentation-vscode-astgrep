import { NapiConfig } from "@ast-grep/napi";

export interface Rule {
    index: string,
    title: string,
    description: string,
    tags: string[],
    rule: NapiConfig,
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
