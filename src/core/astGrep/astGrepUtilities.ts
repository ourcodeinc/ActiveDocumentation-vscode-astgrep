/* eslint-disable @typescript-eslint/naming-convention */
import { Lang } from "@ast-grep/napi";

const langMap: { [key: string]: Lang | undefined } = {
    JavaScript: Lang.JavaScript,
    Java: Lang.Java,
    Python: Lang.Python,
};

export const getLangFromString = (lang: string): Lang | undefined => {
    return langMap[lang];
};
