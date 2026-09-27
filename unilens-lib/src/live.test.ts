import { describe, expect, it } from "vitest";
import { to16k } from "./live";

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
