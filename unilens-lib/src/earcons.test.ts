import { describe, expect, it } from "vitest";
import { PALETTES } from "./earcons";

describe("earcons", () => {
    it("gives reading aloud its own sounds in every style, apart from the button's", () => {
        for (const p of Object.values(PALETTES)) {
            expect(p.readOn).not.toEqual(p.press);
            expect(p.readOff).not.toEqual(p.press);
            expect(p.readOn).not.toEqual(p.readOff);
        }
    });

    it("gives Live its own sounds where they were picked, apart from the microphone's", () => {
        for (const style of ["assistant", "station"] as const) {
            expect(PALETTES[style].liveOn).not.toEqual(PALETTES[style].micOn);
            expect(PALETTES[style].liveOff).not.toEqual(PALETTES[style].micOff);
        }
        // the audio guide kept the microphone's keys for Live (picked by ear)
        expect(PALETTES.audioGuide.liveOn).toEqual(PALETTES.audioGuide.micOn);
    });
});
