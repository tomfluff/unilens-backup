import { describe, expect, it } from "vitest";
import { spoken, to16k, toolCall } from "./live";

describe("to16k", () => {
    it("keeps one sample in three at 48 kHz, across chunk edges, as PCM16", () => {
        const down = to16k(48000);
        const ramp = Float32Array.from({ length: 10 }, (_, i) => i / 10);
        const a = down(ramp.subarray(0, 4)); // samples 0 and 3
        const b = down(ramp.subarray(4)); // then 6 and 9: the step carries over
        expect([...a, ...b]).toEqual(
            [0, 0.3, 0.6, 0.9].map((v) => Math.trunc(v * 0x7fff)),
        );
    });

    it("clips what is over full scale", () => {
        expect([...to16k(16000)(Float32Array.of(2, -2))]).toEqual([
            0x7fff, -0x8000,
        ]);
    });
});

describe("toolCall", () => {
    it("reads highlight's ids, go_to's one id, and zoom's id or change", () => {
        expect(toolCall("highlight", { ids: ["n1", 2, "n3"] })).toEqual({
            ids: ["n1", "n3"],
            act: "light",
        });
        expect(toolCall("go_to", { id: "n7" })).toEqual({
            ids: ["n7"],
            act: "go",
        });
        expect(toolCall("zoom", { id: "n7" })).toEqual({
            ids: ["n7"],
            act: "zoom",
        });
        expect(toolCall("zoom", { change: "out" })).toEqual({
            ids: [],
            act: "zoom",
            change: "out",
        });
        // "zoom back out to normal" came as both: the reset wins; in + id is into it
        expect(toolCall("zoom", { id: "n34", change: "reset" })).toEqual({
            ids: [],
            act: "zoom",
            change: "reset",
        });
        expect(toolCall("zoom", { id: "n34", change: "in" })).toEqual({
            ids: ["n34"],
            act: "zoom",
        });
    });

    it("points at nothing for anything else", () => {
        expect(toolCall("go_to", { id: 7 })).toEqual({ ids: [], act: "go" });
        expect(toolCall("highlight", "n1")).toEqual({ ids: [], act: "light" });
        expect(toolCall("zoom", { change: "max" })).toEqual({
            ids: [],
            act: "zoom",
        });
        expect(toolCall("scroll", { ids: ["n1"] })).toEqual({
            ids: [],
            act: "light",
        });
    });
});

describe("spoken (Gemini's transcript, without what it never says)", () => {
    it("keeps the words and drops markup, tool calls and silent turns", () => {
        expect(
            spoken(
                'Eligible shareholders get ¥1,000.<LMDX>### Benefit\n<List variant="clean"><ListTile>¥1,000</ListTile></List></LMDX><br>\n<br>\n',
            ),
        ).toBe("Eligible shareholders get ¥1,000.");
        expect(spoken("It is here <call:highlight{ids:[n68, n69")).toBe(
            "It is here",
        );
        expect(spoken("<no speech detected>")).toBe("");
        expect(spoken("Two < three, as the table says.")).toBe(
            "Two < three, as the table says.",
        );
    });
});
