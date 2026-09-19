import { describe, expect, it } from "vitest";
import { setTargets } from "./minimap";

// jsdom has no canvas and the map is only built once the page is zoomed, so the
// marker drawing itself is a browser criterion (test plan). What can be checked
// here: setTargets is safe before the map exists and accepts clearing.
describe("setTargets", () => {
    it("accepts targets and clearing before the minimap is built", () => {
        const el = document.createElement("button");
        document.body.appendChild(el);
        expect(() => setTargets([el])).not.toThrow();
        expect(() => setTargets([])).not.toThrow();
    });
});
