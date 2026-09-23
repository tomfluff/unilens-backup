import { beforeEach, describe, expect, it } from "vitest";
import type { CaptureResult } from "./capture";
import { clearSentLog, getSentLog, recordAsk, recordCapture } from "./sentLog";

const cap = {} as CaptureResult;

beforeEach(clearSentLog);

describe("sent log", () => {
    it("keeps captures newest first with the questions asked against each", () => {
        recordCapture("a", cap);
        const ask = recordAsk("a", { question: "what is this?", cite: true });
        recordCapture("b", cap, true);
        recordAsk("b", { question: "and this?", cite: true });
        ask.reply = {
            provider: "stub",
            model: "none",
            imagesSent: 0,
            latencyMs: 5,
        };
        const log = getSentLog();
        expect(log.map((c) => c.id)).toEqual(["b", "a"]);
        expect(log[0].viewRefresh).toBe(true);
        expect(log[1].asks[0]).toMatchObject({
            question: "what is this?",
            reply: { provider: "stub" },
        });
    });

    it("caps the number of captures it holds", () => {
        for (let i = 0; i < 30; i++) recordCapture(`c${i}`, cap);
        expect(getSentLog()).toHaveLength(20);
        expect(getSentLog()[0].id).toBe("c29");
    });

    it("keeps every failed upload and bounds the asks per capture", () => {
        recordCapture("local", cap);
        recordCapture("local", cap);
        expect(getSentLog()).toHaveLength(2);
        for (let i = 0; i < 60; i++)
            recordAsk("local", { question: `q${i}`, cite: false });
        const asks = getSentLog()[0].asks;
        expect(asks).toHaveLength(50);
        expect(asks[0].question).toBe("q10");
        expect(getSentLog()[1].asks).toHaveLength(0);
    });

    it("ignores an ask for a capture it does not hold", () => {
        expect(() =>
            recordAsk("gone", { question: "x", cite: false }),
        ).not.toThrow();
        expect(getSentLog()).toHaveLength(0);
    });
});
