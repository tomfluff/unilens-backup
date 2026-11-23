import { describe, expect, it } from "vitest";
import {
    isOwnStyleMutation,
    parseInlineStyle,
    removedOwnMarks,
    styleChangeKind,
} from "./ownMutation";

describe("removedOwnMarks", () => {
    it("is true when a host className write dropped our class", () => {
        // React re-render: className back to the component's own value.
        expect(
            removedOwnMarks("class", "s unilens-a11y-small-text-boost", "s"),
        ).toBe(true);
        // ...which on its own looks like one of our writes.
        expect(
            isOwnStyleMutation("class", "s unilens-a11y-small-text-boost", "s"),
        ).toBe(true);
    });

    it("is false when our class is still there", () => {
        expect(
            removedOwnMarks("class", "s", "s unilens-a11y-small-text-boost"),
        ).toBe(false);
        expect(
            removedOwnMarks(
                "class",
                "s unilens-a11y-page-font",
                "s active unilens-a11y-page-font",
            ),
        ).toBe(false);
    });

    it("is true when a host style write dropped our custom property", () => {
        expect(
            removedOwnMarks(
                "style",
                "color: red; --unilens-a11y-page-font-px: 16px;",
                "color: blue;",
            ),
        ).toBe(true);
        expect(
            removedOwnMarks(
                "style",
                "--unilens-a11y-page-font-px: 16px;",
                "--unilens-a11y-page-font-px: 18px; color: blue;",
            ),
        ).toBe(false);
    });

    it("ignores other attributes", () => {
        expect(removedOwnMarks("hidden", "unilens-x", "")).toBe(false);
    });
});

describe("styleChangeKind", () => {
    it("sees motion-only writes (rAF animations, scroll-linked headers)", () => {
        expect(
            styleChangeKind(
                "transform: translateX(1px);",
                "transform: translateX(2px);",
            ),
        ).toBe("motion");
        expect(styleChangeKind("height: 80px;", "height: 72px;")).toBe(
            "motion",
        );
        expect(
            styleChangeKind("opacity: 0.2;", "opacity: 0.4; --p: 0.4;"),
        ).toBe("motion");
        expect(
            styleChangeKind(
                "background-position: 0px 10px;",
                "background-position: 0px 20px;",
            ),
        ).toBe("motion");
    });

    it("sees writes that can change a color", () => {
        expect(styleChangeKind("", "background-color: red;")).toBe("paint");
        expect(styleChangeKind("color: red;", "color: blue;")).toBe("paint");
        expect(
            styleChangeKind(
                "transform: none;",
                "transform: none; display: none;",
            ),
        ).toBe("paint");
        expect(
            styleChangeKind("background: url(a.png)", "background: url(b.png)"),
        ).toBe("paint");
    });

    it("ignores this library's own properties and unchanged values", () => {
        expect(
            styleChangeKind(
                "color: red;",
                "color: red; --unilens-a11y-fill: rgb(1, 2, 3);",
            ),
        ).toBe("none");
        expect(styleChangeKind("color:red", "color: red;")).toBe("none");
    });

    it("keeps `;` inside url() and quotes", () => {
        const m = parseInlineStyle(
            'background-image: url("data:image/png;base64,AA=="); content: "a;b"; top: 1px',
        );
        expect(m.get("background-image")).toBe(
            'url("data:image/png;base64,AA==")',
        );
        expect(m.get("content")).toBe('"a;b"');
        expect(m.get("top")).toBe("1px");
    });
});
