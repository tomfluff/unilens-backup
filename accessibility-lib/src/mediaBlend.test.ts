import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** Pictures must not be multiplied into the themed page color (they go black). */
describe("pictures keep their own colors under a theme", () => {
    it("resets mix-blend-mode on media while a theme is applied", () => {
        const css = readFileSync(
            new URL("./unilens-a11y/style.css", import.meta.url),
            "utf8",
        );
        expect(css).toMatch(
            /html\[data-unilens-a11y-display-active\] #unilens-a11y-page-root :is\(img, video, picture, canvas\)\s*\{\s*mix-blend-mode: normal !important;/,
        );
    });
});
