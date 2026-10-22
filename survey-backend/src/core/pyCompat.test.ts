import { describe, expect, it } from "vitest";
import { msBetween, parseTime } from "./attempts.ts";
import {
    pyDumps,
    pyFixed1,
    pyLen,
    pyNumber,
    pyRound,
    pyStr,
} from "./pyCompat.ts";

// Every expected value below is what Python 3 prints for the same input.

describe("Python's formatting", () => {
    it("dumps JSON with Python's separators, keeping non-ASCII", () => {
        expect(pyDumps({ a: [1, "b"], c: null, d: true, e: {} })).toBe(
            '{"a": [1, "b"], "c": null, "d": true, "e": {}}',
        );
        expect(pyDumps({ t: '選択肢\n"A"' })).toBe('{"t": "選択肢\\n\\"A\\""}');
    });

    it("prints floats as repr does", () => {
        expect(pyNumber(0.1)).toBe("0.1");
        expect(pyNumber(1.5e-7)).toBe("1.5e-07");
        expect(pyNumber(0.0001)).toBe("0.0001");
        expect(pyNumber(12345.678)).toBe("12345.678");
    });

    it("counts code points as len() does", () => {
        expect(pyLen("a字😀")).toBe(3);
    });

    it("prints values as str() does", () => {
        expect(pyStr(null)).toBe("None");
        expect(pyStr(true)).toBe("True");
        expect(pyStr(["a", "it's", 2])).toBe(`['a', "it's", 2]`);
        expect(pyStr({ k: [null] })).toBe("{'k': [None]}");
    });

    it("rounds halves to even", () => {
        expect([0.5, 1.5, 2.5, -2.5, 2.4].map(pyRound)).toEqual([
            0, 2, 2, -2, 2,
        ]);
    });

    it('formats "{:.1f}" from the exact binary value', () => {
        const cases: [number, string][] = [
            [0.25, "0.2"],
            [0.75, "0.8"],
            [3.15, "3.1"],
            [4.2, "4.2"],
            [0.05, "0.1"],
            [8, "8.0"],
            [-0.04, "-0.0"],
            [123456.789, "123456.8"],
        ];
        for (const [x, want] of cases) expect(pyFixed1(x)).toBe(want);
    });
});

describe("times", () => {
    it("reads what the widget writes, and refuses what Python refuses", () => {
        expect(parseTime("2026-10-08T01:00:00.000Z")).toBe(
            Date.UTC(2026, 9, 8, 1) * 1000,
        );
        expect(parseTime("2026-10-08T10:00:00+09:00")).toBe(
            Date.UTC(2026, 9, 8, 1) * 1000,
        );
        for (const bad of ["x", "2026-02-30", "Oct 8 2026", 5, null])
            expect(parseTime(bad)).toBeNull();
    });

    it("measures milliseconds between two times, never negative", () => {
        const a = "2026-10-08T01:00:00.000Z";
        expect(msBetween(a, "2026-10-08T01:00:05.250Z")).toBe(5250);
        expect(msBetween("2026-10-08T01:00:05.000Z", a)).toBe(0);
        expect(msBetween(a, "")).toBeNull();
    });
});
