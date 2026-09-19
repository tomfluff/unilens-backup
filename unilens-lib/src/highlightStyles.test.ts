import { describe, expect, it } from "vitest";
import { HIGHLIGHT_PRESETS, type HighlightPreset } from "./highlightStyles";
import { getSettings } from "./settings";

describe("highlight presets", () => {
    it("default highlightStyle names a preset", () => {
        const style: HighlightPreset = getSettings().highlightStyle;
        expect(HIGHLIGHT_PRESETS[style]).toBeDefined();
    });

    it("wcag-ring is ring only: no fill, glow, dim or pulse", () => {
        const p = HIGHLIGHT_PRESETS["wcag-ring"] as Record<string, unknown>;
        expect(Object.keys(p)).toEqual(["ring"]);
    });

    it("every preset has a ring, so the WCAG floor always holds", () => {
        for (const [name, p] of Object.entries(HIGHLIGHT_PRESETS)) {
            expect(p.ring, name).toBeDefined();
        }
    });
});
