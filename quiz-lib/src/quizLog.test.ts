import { afterEach, describe, expect, it } from "vitest";
import {
    flushQuizLog,
    initQuizLog,
    logQuizEvent,
    pagePath,
    quizLogUrl,
    readStudyIds,
    stopQuizLog,
} from "./quizLog";

describe("readStudyIds", () => {
    it("takes the participant from the address first", () => {
        expect(
            readStudyIds(
                "http://x/p?pid=P03&session=2",
                '{"pid":"P01","session":"1"}',
            ),
        ).toEqual({ pid: "P03", session: "2" });
    });

    it("falls back to what unilens-lib remembered", () => {
        expect(
            readStudyIds("http://x/p", '{"pid":"P01","session":"4"}'),
        ).toEqual({
            pid: "P01",
            session: "4",
        });
    });

    it("defaults the session, and ignores bad values", () => {
        expect(readStudyIds("http://x/?pid=P05", null)).toEqual({
            pid: "P05",
            session: "1",
        });
        expect(readStudyIds("http://x/?pid=P05&session=x", null)).toEqual({
            pid: "P05",
            session: "1",
        });
        expect(readStudyIds("http://x/?pid=a%20b", null)).toBeNull();
        expect(readStudyIds("http://x/", "not json")).toBeNull();
        expect(readStudyIds("http://x/", null)).toBeNull();
    });

    it("keeps a remembered pid when the address pid is invalid (same as unilens-lib)", () => {
        expect(
            readStudyIds(
                "http://x/?pid=../x&session=1",
                '{"pid":"P01","session":"1"}',
            ),
        ).toEqual({ pid: "P01", session: "1" });
    });

    it("applies session from the address when pid is only in storage", () => {
        expect(
            readStudyIds("http://x/?session=3", '{"pid":"P04","session":"1"}'),
        ).toEqual({
            pid: "P04",
            session: "3",
        });
    });
});

describe("quizLogUrl", () => {
    it("adds the participant when there is one", () => {
        expect(quizLogUrl("http://127.0.0.1:5000/", null)).toBe(
            "http://127.0.0.1:5000/api/quiz/log",
        );
        expect(quizLogUrl("http://h:5000", { pid: "P-1", session: "2" })).toBe(
            "http://h:5000/api/quiz/log?pid=P-1&session=2",
        );
    });
});

describe("pagePath", () => {
    it("keeps the path only", () => {
        expect(pagePath("http://x/a/b.html?email=me@x#top")).toBe("/a/b.html");
        expect(pagePath("not a url")).toBe("");
    });
});

describe("flushQuizLog", () => {
    const saved = {
        window: globalThis.window,
        location: globalThis.location,
        fetch: globalThis.fetch,
    };
    afterEach(() => {
        stopQuizLog();
        Object.assign(globalThis, saved);
    });

    /** a browser just big enough for the log, and a fetch that answers when told */
    function fakeBrowser() {
        const answers: (() => void)[] = [];
        const g = globalThis as unknown as Record<string, unknown>;
        g.window = {
            setTimeout,
            clearTimeout,
            addEventListener() {},
            removeEventListener() {},
            localStorage: { getItem: () => null },
        };
        g.location = { href: "http://x/survey?quiz=s1&vid=v-abc123" };
        g.fetch = () =>
            new Promise((done) =>
                answers.push(() => done(new Response("{}", { status: 200 }))),
            );
        return answers;
    }

    it("waits for an answer already on its way, not only for the queue", async () => {
        const answers = fakeBrowser();
        initQuizLog("http://backend");
        logQuizEvent("quiz_answer", { quiz: "s1", question: "q1" });
        // the answer goes out on the next tick, as it does after a click
        await new Promise((done) => setTimeout(done, 0));
        expect(answers).toHaveLength(1);
        let flushed = false;
        const going = flushQuizLog().then(() => {
            flushed = true;
        });
        await new Promise((done) => setTimeout(done, 20));
        // the backend has not answered: going back now would beat the answer to it
        expect(flushed).toBe(false);
        answers[0]();
        await going;
        expect(flushed).toBe(true);
    });
});
