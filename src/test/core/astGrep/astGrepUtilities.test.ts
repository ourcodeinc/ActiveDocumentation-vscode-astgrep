import assert from "assert";
import { getLangFromString } from "../../../core/astGrep/astGrepUtilities";
import { Lang } from "@ast-grep/napi";

describe("getLangFromString", () => {
    it("should return the correct Lang value for a valid language string", () => {
        assert.equal(getLangFromString("JavaScript"), Lang.JavaScript);
        assert.equal(getLangFromString("Java"), Lang.Java);
        assert.equal(getLangFromString("Python"), Lang.Python);
    });

    it("should return undefined for an invalid language string", () => {
        assert.equal(getLangFromString("CSharp"), undefined);
        assert.equal(getLangFromString("Ruby"), undefined);
    });

    it("should return undefined for an empty string", () => {
        assert.equal(getLangFromString(""), undefined);
    });
});
