import { afterEach, describe, expect, it, vi } from "vitest";
import { getLastLocateDebug, locateOutcome, postLocate } from "./locate";

const label = (id: string) => (id === "n7" ? "Choose Pro" : id);

describe("locateOutcome", () => {
    it("found: answer, Found: label, highlights kept", () => {
        const o = locateOutcome(
            200,
            {
                answer: "It's here.",
                highlights: [{ id: "n7", role: "target" }],
            },
            label,
        );
        expect(o.code).toBe("found");
        expect(o.bubble).toBe("It's here.");
        expect(o.live).toBe("Found: Choose Pro");
        expect(o.highlights).toHaveLength(1);
    });

    it("empty: answer shown, nothing matched, no highlights", () => {
        const o = locateOutcome(
            200,
            { answer: "Nothing.", highlights: [] },
            label,
        );
        expect(o).toEqual({
            code: "empty",
            bubble: "Nothing.",
            live: "Nothing matched on this page",
            highlights: [],
        });
    });

    it("429: rate-limit bubble, no highlights", () => {
        const o = locateOutcome(429, { error: "rate limit" }, label);
        expect(o.code).toBe("rate_limited");
        expect(o.bubble).toContain("Too many requests");
        expect(o.highlights).toEqual([]);
    });

    it("400 and 502: error bubble from the server, never a highlight", () => {
        expect(
            locateOutcome(400, { error: "capture has no inventory" }, label),
        ).toMatchObject({ code: "error", bubble: "capture has no inventory" });
        expect(
            locateOutcome(
                502,
                { error: "boom", highlights: [{ id: "n7", role: "target" }] },
                label,
            ),
        ).toMatchObject({ code: "error", highlights: [] });
    });

    it("network throw: error, Locate failed", () => {
        const o = locateOutcome(0, new TypeError("Failed to fetch"), label);
        expect(o).toEqual({
            code: "error",
            bubble: "Locate failed",
            live: "Locate failed",
            highlights: [],
        });
    });

    it("an id the server already dropped means empty, not found", () => {
        const o = locateOutcome(200, { answer: "x", highlights: [] }, label);
        expect(o.code).toBe("empty");
    });
});

describe("postLocate", () => {
    afterEach(() => vi.unstubAllGlobals());

    it("posts the request shape and mints an increasing token", async () => {
        const fetchMock = vi.fn(async () => ({
            status: 200,
            json: async () => ({
                capture_id: "c1",
                answer: "here",
                highlights: [{ id: "n7", role: "target" }],
            }),
        }));
        vi.stubGlobal("fetch", fetchMock);
        const req = {
            captureId: "c1",
            sessionId: null,
            question: "where is pro?",
            screenshot: true,
        };
        const a = await postLocate("http://b", req, label);
        const b = await postLocate("http://b", req, label);
        expect(b.token).toBeGreaterThan(a.token);
        expect(a.outcome.code).toBe("found");
        expect(a.captureId).toBe("c1");
        const [url, init] = fetchMock.mock.calls[0] as unknown as [
            string,
            RequestInit,
        ];
        expect(url).toBe("http://b/api/locate");
        expect(JSON.parse(init.body as string)).toEqual({
            capture_id: "c1",
            session_id: null,
            question: "where is pro?",
            screenshot: true,
        });
    });

    it("maps a thrown fetch to the error outcome", async () => {
        vi.stubGlobal("fetch", async () => {
            throw new TypeError("Failed to fetch");
        });
        const r = await postLocate(
            "http://b",
            { captureId: "c1", question: "q", screenshot: false },
            label,
        );
        expect(r.outcome.code).toBe("error");
        expect(r.captureId).toBe("c1");
    });

    it("records the last outcome, labelled ids and token for the debug panel", async () => {
        vi.stubGlobal("fetch", async () => ({
            status: 200,
            json: async () => ({
                answer: "Top right.",
                highlights: [{ id: "n7", role: "target" }],
            }),
        }));
        const r = await postLocate(
            "http://b",
            { captureId: "c1", question: "where is pro?", screenshot: true },
            label,
        );
        expect(getLastLocateDebug()).toMatchObject({
            code: "found",
            bubble: "Top right.",
            highlights: [{ id: "n7", role: "target", label: "Choose Pro" }],
            token: r.token,
        });
        expect(getLastLocateDebug()?.at).toBeTypeOf("number");
    });
});
