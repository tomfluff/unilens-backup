import { describe, expect, it } from "vitest";
import { isMeaningfulCursor } from "./hostCursorGuard";

describe("host cursors kept under the enlarged cursor", () => {
    it("keeps cursors that carry a meaning on controls", () => {
        expect(isMeaningfulCursor("not-allowed", false)).toBe(true);
        expect(isMeaningfulCursor("grab", false)).toBe(true);
        expect(isMeaningfulCursor("zoom-in", false)).toBe(true);
        expect(isMeaningfulCursor("text", false)).toBe(true);
        expect(isMeaningfulCursor('url("x.svg"), move', false)).toBe(true);
    });

    it("replaces the plain ones", () => {
        expect(isMeaningfulCursor("auto", false)).toBe(false);
        expect(isMeaningfulCursor("default", false)).toBe(false);
        expect(isMeaningfulCursor("pointer", false)).toBe(false);
        expect(isMeaningfulCursor("", false)).toBe(false);
    });

    it("treats the I-beam of a text field as plain", () => {
        expect(isMeaningfulCursor("text", true)).toBe(false);
        expect(isMeaningfulCursor("auto", true)).toBe(false);
        expect(isMeaningfulCursor("not-allowed", true)).toBe(true);
        expect(isMeaningfulCursor("pointer", true)).toBe(true);
    });
});
