import { describe, expect, it } from "vitest";
import {
    DEFAULT_SPEECH_RATE_LEVEL,
    guessWordLength,
    normalizeSpeechRateLevel,
    SPEECH_CHUNK_MAX,
    SPEECH_RATE_LEVELS,
    SPEECH_RATES,
    speechRateHint,
    speechRateValue,
    splitSpeechChunks,
} from "./speechLevels";

describe("normalizeSpeechRateLevel", () => {
    it("passes 0–3 through unchanged", () => {
        SPEECH_RATE_LEVELS.forEach((level) => {
            expect(normalizeSpeechRateLevel(level)).toBe(level);
        });
    });

    it("rounds out-of-range or invalid values to the default rate", () => {
        [-1, 4, 1.5, "2", null, undefined, {}].forEach((input) => {
            expect(normalizeSpeechRateLevel(input)).toBe(
                DEFAULT_SPEECH_RATE_LEVEL,
            );
        });
    });
});

describe("speech rate", () => {
    it("gets faster as the level increases", () => {
        const rates = SPEECH_RATE_LEVELS.map(speechRateValue);
        expect(rates).toStrictEqual([...rates].sort((a, b) => a - b));
        expect(new Set(rates).size).toBe(rates.length);
    });

    it("defaults to normal speed", () => {
        expect(speechRateValue(DEFAULT_SPEECH_RATE_LEVEL)).toBe(1);
    });

    it("stays within an intelligible range (0.5x–2.0x)", () => {
        SPEECH_RATE_LEVELS.forEach((level) => {
            expect(speechRateValue(level)).toBeGreaterThanOrEqual(0.5);
            expect(speechRateValue(level)).toBeLessThanOrEqual(2);
        });
    });

    it("the hint is digits and symbols only, no language-dependent characters", () => {
        SPEECH_RATE_LEVELS.forEach((level) => {
            expect(speechRateHint(level)).toMatch(/^×[\d.]+$/);
            expect(speechRateHint(level)).toBe(`×${SPEECH_RATES[level]}`);
        });
    });
});

describe("splitSpeechChunks", () => {
    const long = "あいうえお".repeat(100);

    it("keeps a short sentence as a single chunk", () => {
        const chunks = splitSpeechChunks("これは短い文です。");
        expect(chunks).toStrictEqual([
            { text: "これは短い文です。", offset: 0 },
        ]);
    });

    it("produces no chunks for whitespace-only text", () => {
        expect(splitSpeechChunks("   \n\t  ")).toStrictEqual([]);
        expect(splitSpeechChunks("")).toStrictEqual([]);
    });

    it("offset correctly points into the original text", () => {
        splitSpeechChunks(long).forEach((chunk) => {
            expect(
                long.slice(chunk.offset, chunk.offset + chunk.text.length),
            ).toBe(chunk.text);
        });
    });

    it("joining the chunks loses no original characters", () => {
        const text = `最初の文です。次の文はもう少し長くなります。${long}`;
        const chunks = splitSpeechChunks(text);
        const joined = chunks.map((c) => c.text).join("");
        expect(joined).toBe(text);
    });

    it("no chunk exceeds the max length", () => {
        splitSpeechChunks(long).forEach((chunk) => {
            expect(chunk.text.length).toBeLessThanOrEqual(SPEECH_CHUNK_MAX);
        });
        expect(splitSpeechChunks(long).length).toBeGreaterThan(1);
    });

    it("breaks at a sentence-ending mark just before the limit", () => {
        const head = "あ".repeat(120);
        const chunks = splitSpeechChunks(`${head}。${"い".repeat(200)}`, 150);
        expect(chunks[0].text).toBe(`${head}。`);
        expect(chunks[1].offset).toBe(head.length + 1);
    });

    it("breaks English text at word boundaries (never mid-word)", () => {
        const text =
            "alpha bravo charlie delta echo foxtrot golf hotel india juliet";
        const chunks = splitSpeechChunks(text, 20);
        expect(chunks.length).toBeGreaterThan(1);
        // Every chunk but the last ends on a space — i.e. never mid-word.
        chunks.slice(0, -1).forEach((chunk) => {
            expect(text[chunk.offset + chunk.text.length - 1]).toBe(" ");
        });
        expect(chunks.map((c) => c.text).join("")).toBe(text);
    });

    it("mechanically breaks at the limit for long text with no punctuation or spaces", () => {
        const chunks = splitSpeechChunks("x".repeat(500), 100);
        expect(chunks.map((c) => c.text.length)).toStrictEqual([
            100, 100, 100, 100, 100,
        ]);
        expect(chunks.map((c) => c.offset)).toStrictEqual([
            0, 100, 200, 300, 400,
        ]);
    });
});

describe("guessWordLength", () => {
    it("treats everything up to a delimiter as one word", () => {
        expect(guessWordLength("hello world", 0)).toBe(5);
        expect(guessWordLength("hello world", 6)).toBe(5);
        expect(guessWordLength("これは、テスト", 0)).toBe(3);
    });

    it("returns the remaining length when there is no delimiter", () => {
        expect(guessWordLength("abcdef", 2)).toBe(4);
    });

    it("returns 0 past the end, and at least 1 right on a delimiter", () => {
        expect(guessWordLength("abc", 3)).toBe(0);
        expect(guessWordLength("a b", 1)).toBe(1);
    });
});
