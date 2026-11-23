import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Guards the draggable display-adjustment button against being removed again
 * (it was once deleted as an "unused module"). Reads the sources directly so it
 * needs no DOM.
 */
const read = (f: string) => readFileSync(new URL(f, import.meta.url), "utf8");

describe("draggable toggle button stays wired up", () => {
    it("the panel installs the drag handler on the toggle button", () => {
        const panel = read("./accessibilityPanel.tsx");
        expect(panel).toContain('from "./toggleDrag"');
        expect(panel).toContain("installToggleDrag(");
    });

    it("the styles keep the drag affordances and the height cap", () => {
        const styles = read("./accessibilityPanelStyles.ts");
        expect(styles).toContain("data-unilens-a11y-down");
        expect(styles).toContain("data-unilens-a11y-dragging");
        expect(styles).toContain("--unilens-a11y-avail");
    });

    it("the module still exports the installer", () => {
        expect(read("./toggleDrag.ts")).toContain(
            "export function installToggleDrag",
        );
    });
});
