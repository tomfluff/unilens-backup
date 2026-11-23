import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cssPath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "unilens-a11y",
    "style.css",
);

describe("bundled page stylesheet", () => {
    it("ships host theme rules that documentEffects toggles on <html>", () => {
        const css = readFileSync(cssPath, "utf8");
        expect(css).toContain("data-unilens-a11y-theme");
        expect(css).toContain("data-unilens-a11y-html-filter");
    });
});
