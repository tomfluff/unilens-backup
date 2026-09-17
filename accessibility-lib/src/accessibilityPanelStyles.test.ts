import { describe, expect, it } from "vitest";
import { WIDGET_CSS } from "./accessibilityPanelStyles";

describe("accessibility panel widget CSS", () => {
    it("suppresses the host page's dotted button:focus ring on tabs", () => {
        expect(WIDGET_CSS).toContain(".unilens-a11y-tab:focus");
        expect(WIDGET_CSS).toContain(".unilens-a11y-tab:focus-visible");
        const tabFocusBlock = WIDGET_CSS.slice(
            WIDGET_CSS.indexOf(".unilens-a11y-tab:focus"),
            WIDGET_CSS.indexOf(".unilens-a11y-tab-count"),
        );
        expect(tabFocusBlock).toContain("outline: none");
    });

    it("keeps stacked-toggle layout off nested choice cards", () => {
        expect(WIDGET_CSS).toContain(
            ".unilens-a11y-choices--stack > .unilens-a11y-choice {",
        );
        expect(WIDGET_CSS).not.toContain(
            ".unilens-a11y-choices--stack .unilens-a11y-choice {",
        );
        expect(WIDGET_CSS).toContain("white-space: nowrap");
        expect(WIDGET_CSS).toContain("writing-mode: horizontal-tb");
        expect(WIDGET_CSS).toContain("word-break: keep-all");
    });
});
