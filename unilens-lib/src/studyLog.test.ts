import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    describeElement,
    flush,
    forgetStudyIds,
    initStudyLog,
    logEvent,
    pageAddress,
    readStudyIds,
    studyIds,
    studyUrl,
} from "./studyLog";

const page = "https://x.trycloudflare.com/en/lost-found.html";

describe("readStudyIds: the address, then what the browser remembers", () => {
    beforeEach(() => localStorage.clear());

    it("is nobody without a pid", () => {
        expect(readStudyIds(page)).toBeNull();
        expect(readStudyIds(`${page}?session=2`)).toBeNull();
    });

    it("takes pid and session, and remembers them for the site's other pages", () => {
        expect(readStudyIds(`${page}?pid=P03&session=2`)).toEqual({
            pid: "P03",
            session: "2",
        });
        expect(readStudyIds(page)).toEqual({ pid: "P03", session: "2" });
    });

    it("takes each alone, and session 1 when none was given", () => {
        expect(readStudyIds(`${page}?pid=P04`)).toEqual({
            pid: "P04",
            session: "1",
        });
        expect(readStudyIds(`${page}?session=3`)).toEqual({
            pid: "P04",
            session: "3",
        });
    });

    it("ignores values that could not name a file", () => {
        expect(readStudyIds(`${page}?pid=../x&session=1`)).toBeNull();
        readStudyIds(`${page}?pid=P05`);
        expect(readStudyIds(`${page}?session=x`)?.session).toBe("1");
    });
});

describe("the log's transport", () => {
    let calls: { url: string; init: RequestInit }[];
    beforeEach(() => {
        localStorage.clear();
        calls = [];
        vi.stubGlobal(
            "fetch",
            vi.fn((url: string, init: RequestInit) => {
                calls.push({ url, init });
                return Promise.resolve(new Response("{}"));
            }),
        );
        history.replaceState(
            null,
            "",
            "/en/x.html?unilens-preset=initial&pid=P00&session=1",
        );
    });
    afterEach(() => vi.unstubAllGlobals());

    it("adds the ids to backend addresses, and nothing without them", () => {
        forgetStudyIds();
        expect(studyUrl("http://b/api/ai")).toBe("http://b/api/ai");
        initStudyLog("http://b");
        expect(studyUrl("http://b/api/ai")).toBe(
            "http://b/api/ai?pid=P00&session=1",
        );
        expect(studyUrl("http://b/api/stt?lang=en")).toBe(
            "http://b/api/stt?lang=en&pid=P00&session=1",
        );
    });

    it("sends events together, as plain text, with time, order and page", () => {
        initStudyLog("http://b");
        logEvent("alt_click", { x: 1 });
        logEvent("question", { text: "hi", via: "typed" });
        flush();
        expect(calls).toHaveLength(1);
        expect(calls[0].url).toBe("http://b/api/study/log?pid=P00&session=1");
        expect(
            (calls[0].init.headers as Record<string, string>)["Content-Type"],
        ).toBe("text/plain");
        const { events } = JSON.parse(calls[0].init.body as string);
        expect(events.map((e: { type: string }) => e.type)).toEqual([
            "alt_click",
            "question",
        ]);
        expect(events[0].page).toBe("/en/x.html");
        expect(events[1].seq).toBeGreaterThan(events[0].seq);
        expect(typeof events[0].t).toBe("string");
    });

    it("sends many events in batches small enough for a closing page", () => {
        initStudyLog("http://b");
        for (let i = 0; i < 120; i++) logEvent("status", { text: "x" });
        flush();
        expect(calls.length).toBe(3);
        const sent = calls.flatMap(
            (c) => JSON.parse(c.init.body as string).events,
        );
        expect(sent).toHaveLength(120);
    });

    it("the reset forgets the participant: nothing is sent after it", () => {
        initStudyLog("http://b");
        forgetStudyIds();
        expect(studyIds()).toBeNull();
        expect(localStorage.getItem("unilens-study")).toBeNull();
        logEvent("alt_click");
        flush();
        expect(calls).toHaveLength(0);
    });
});

describe("helpers", () => {
    it("drops the study's own parameters from the page address", () => {
        expect(
            pageAddress(
                "https://x/en/a.html?unilens-preset=initial&pid=P1&session=2&q=b#top",
            ),
        ).toBe("/en/a.html?q=b#top");
        // anything else in an address can be private: dropped
        expect(
            pageAddress("https://x/en/a.html?token=abc&email=a%40b.c#a@b.c"),
        ).toBe("/en/a.html");
    });

    it("describes an element by tag, role and words", () => {
        const el = document.createElement("h1");
        el.textContent = "  Lost   and found ";
        expect(describeElement(el)).toEqual({
            tag: "h1",
            id: undefined,
            role: undefined,
            text: "Lost and found",
        });
        expect(describeElement(null)).toBeNull();
    });
});
