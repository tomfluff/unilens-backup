/**
 * The survey's log (quiz-lib): one append-only JSONL per survey, fed by
 * /api/quiz/log, and read back as results, CSV and progress. Ported from the
 * Flask backend's tests/test_quiz_log.py; the one difference is that nothing
 * goes to a study log.
 */

import { existsSync } from "node:fs";
import {
    appendFile,
    mkdir,
    readdir,
    readFile,
    writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { jsonLines, startServer, type TestServer } from "./testServer.ts";

type Ev = Record<string, unknown>;

let s: TestServer;
beforeEach(async () => {
    s = await startServer();
});
afterEach(async () => {
    await s.close();
});

const logOf = (quiz: string) => join(s.config.logsDir, `${quiz}.jsonl`);

const ANSWER: Ev = {
    t: "2026-10-08T01:00:00.000Z",
    seq: 3,
    type: "quiz_answer",
    quiz: "ir-basics",
    attempt: "a1b2c3",
    question: "q1",
    response: "c2",
    correct: true,
    ms: 4200,
};

describe("logging", () => {
    it("appends answers to the survey's log without a participant", async () => {
        const start = { ...ANSWER, type: "quiz_start", seq: 1 };
        const r = await s.post("", { events: [start, ANSWER] });
        expect(r.status).toBe(200);
        expect(await r.json()).toEqual({ logged: 2, dropped: 0 });
        const rows = await jsonLines(logOf("ir-basics"));
        expect(rows.map((x) => x.type)).toEqual(["quiz_start", "quiz_answer"]);
        expect(rows.every((x) => x.src === "client" && "rx" in x)).toBe(true);
        expect("pid" in rows[0]).toBe(false);
    });

    it("records the participant on the line and writes nothing else", async () => {
        const r = await s.post("?pid=P07&session=02", { events: [ANSWER] });
        expect(r.status).toBe(200);
        const [row] = await jsonLines(logOf("ir-basics"));
        expect([row.pid, row.session]).toEqual(["P07", "2"]);
        // the survey's log is its own: no study log next to it
        expect(await readdir(s.root)).toEqual(["quiz-logs"]);
    });

    it("writes lines as the Flask backend did", async () => {
        await s.post("", {
            events: [{ ...ANSWER, response_text: "選択肢 A" }],
        });
        const text = await readFile(logOf("ir-basics"), "utf8");
        expect(text).toMatch(/^\{"t": "2026-10-08T01:00:00\.000Z", "seq": 3, /);
        expect(text).toContain('"response_text": "選択肢 A"');
        expect(text).toMatch(
            /"src": "client", "rx": "\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}\+00:00"\}\n$/,
        );
    });

    it("sends events to their own survey's log", async () => {
        const other = { ...ANSWER, quiz: "recruit" };
        await s.post("", { events: [ANSWER, other] });
        expect(await jsonLines(logOf("ir-basics"))).toHaveLength(1);
        expect(await jsonLines(logOf("recruit"))).toHaveLength(1);
    });

    it("drops unknown types, bad survey ids and huge events", async () => {
        const events = [
            { ...ANSWER, type: "alt_click" },
            { ...ANSWER, quiz: "../../etc/passwd" },
            { ...ANSWER, quiz: 5 },
            { ...ANSWER, response: "x".repeat(9000) },
            "not an event",
            ANSWER,
        ];
        const r = await s.post("", { events });
        expect(await r.json()).toEqual({ logged: 1, dropped: 5 });
        expect(await readdir(s.config.logsDir)).toEqual(["ir-basics.jsonl"]);
    });

    it("measures an event's size as Python did, in characters", async () => {
        // 7,800 kanji: 23,400 bytes in UTF-8 but under 8,000 characters
        const big = { ...ANSWER, response_text: "字".repeat(7800) };
        const r = await s.post("", { events: [big] });
        expect(await r.json()).toEqual({ logged: 1, dropped: 0 });
    });

    it("refuses malformed requests", async () => {
        expect((await s.post("", "{not json")).status).toBe(400);
        expect((await s.post("", { events: [] })).status).toBe(400);
        expect((await s.post("", { events: "x" })).status).toBe(400);
        expect((await s.post("", [ANSWER])).status).toBe(400);
        const tooMany = Array(101).fill(ANSWER);
        expect((await s.post("", { events: tooMany })).status).toBe(400);
        expect(existsSync(s.config.logsDir)).toBe(false);
    });

    it("ignores a bad participant instead of refusing", async () => {
        const r = await s.post("?pid=a%20b&session=1", { events: [ANSWER] });
        expect(r.status).toBe(200);
        const [row] = await jsonLines(logOf("ir-basics"));
        expect("pid" in row).toBe(false);
    });

    it("lets any page post (CORS)", async () => {
        const r = await fetch(s.url("/api/quiz/log"), {
            method: "POST",
            headers: {
                "Content-Type": "text/plain",
                Origin: "http://localhost:8000",
            },
            body: JSON.stringify({ events: [ANSWER] }),
        });
        expect(r.headers.get("access-control-allow-origin")).toBe(
            "http://localhost:8000",
        );
    });
});

// ── Reading the results back ─────────────────────────────────────────────

type Given = [
    question: string,
    response: unknown,
    correct: unknown,
    ms: number,
];

/** One attempt's events as the widget sends them, a second apart. */
function attempt(
    id: string,
    {
        complete = true,
        answers = [["q1", "c2", true, 4200]] as Given[],
    }: { complete?: boolean; answers?: Given[] } = {},
): Ev[] {
    const evs: Ev[] = [
        {
            t: "2026-10-08T01:00:00.000Z",
            type: "quiz_start",
            quiz: "ir-basics",
            attempt: id,
            total: 2,
            lang: "ja",
        },
    ];
    answers.forEach(([question, response, correct, ms], i) => {
        evs.push({
            t: `2026-10-08T01:00:0${i + 5}.000Z`,
            type: "quiz_answer",
            quiz: "ir-basics",
            attempt: id,
            question,
            index: i,
            response,
            response_text: `text of ${response}`,
            correct,
            ms,
        });
    });
    if (complete)
        evs.push({
            t: "2026-10-08T01:00:09.000Z",
            type: "quiz_complete",
            quiz: "ir-basics",
            attempt: id,
            correct: answers.filter((a) => a[2] === true).length,
            total: 2,
            ms: 8000,
        });
    return evs;
}

async function attempts(query = ""): Promise<Ev[]> {
    const r = await s.get(`/api/quiz/ir-basics/results${query}`);
    return ((await r.json()) as { attempts: Ev[] }).attempts;
}

describe("results", () => {
    it("give each attempt with its answers and timings", async () => {
        const answers: Given[] = [
            ["q1", "c2", true, 4200],
            ["q2", ["a", "c"], false, 3100],
        ];
        await s.post("?pid=P07&session=1", {
            events: attempt("a1", { answers }),
        });
        const r = await s.get("/api/quiz/ir-basics/results");
        expect(r.status).toBe(200);
        const body = (await r.json()) as { quiz: string; attempts: Ev[] };
        expect(body.quiz).toBe("ir-basics");
        const [a] = body.attempts;
        expect([a.attempt, a.pid, a.session, a.lang]).toEqual([
            "a1",
            "P07",
            "1",
            "ja",
        ]);
        expect(a.completed).toBe(true);
        expect([a.correct, a.answered, a.total]).toEqual([1, 2, 2]);
        expect(a.duration_ms).toBe(8000);
        expect(a.started_at).toBe("2026-10-08T01:00:00.000Z");
        const list = a.answers as Ev[];
        expect(list.map((x) => x.question)).toEqual(["q1", "q2"]);
        expect(list[1]).toEqual({
            question: "q2",
            index: 1,
            response: ["a", "c"],
            response_text: "text of a,c",
            correct: false,
            ms: 3100,
            lang: null,
            answered_at: "2026-10-08T01:00:06.000Z",
        });
    });

    it("time an unfinished attempt to its last answer", async () => {
        await s.post("", { events: attempt("a2", { complete: false }) });
        const [a] = await attempts();
        expect(a.completed).toBe(false);
        expect(a.completed_at).toBeNull();
        expect(a.duration_ms).toBe(5000); // 01:00:00 -> 01:00:05
    });

    it("filter by participant, attempt and completion", async () => {
        await s.post("?pid=P01&session=1", { events: attempt("a1") });
        await s.post("?pid=P02&session=2", {
            events: attempt("a2", { complete: false }),
        });
        const ids = async (query: string) =>
            (await attempts(query)).map((a) => a.attempt);
        expect(await ids("")).toEqual(["a1", "a2"]);
        expect(await ids("?pid=P02")).toEqual(["a2"]);
        expect(await ids("?session=1")).toEqual(["a1"]);
        expect(await ids("?attempt=a2")).toEqual(["a2"]);
        expect(await ids("?completed=1")).toEqual(["a1"]);
    });

    it("do not count opening the panel alone as an attempt", async () => {
        const ev = {
            type: "quiz_open",
            quiz: "ir-basics",
            attempt: "a9",
            t: "x",
        };
        await s.post("", { events: [ev] });
        expect(await attempts()).toEqual([]);
    });

    it("are 404 for an unknown or malformed survey", async () => {
        expect((await s.get("/api/quiz/nothing-here/results")).status).toBe(
            404,
        );
        expect((await s.get("/api/quiz/..%2Fsecrets/results")).status).toBe(
            404,
        );
    });

    it("list the surveys with their counts", async () => {
        expect(await (await s.get("/api/quiz")).json()).toEqual({
            quizzes: [],
        });
        await s.post("", {
            events: [...attempt("a1"), ...attempt("a2", { complete: false })],
        });
        const { quizzes } = (await (await s.get("/api/quiz")).json()) as {
            quizzes: Ev[];
        };
        const [q] = quizzes;
        expect([q.id, q.attempts, q.completed]).toEqual(["ir-basics", 2, 1]);
        expect(q.last_event_at).toBe("2026-10-08T01:00:05.000Z");
    });

    it("survive a torn line", async () => {
        await s.post("", { events: attempt("a1") });
        await appendFile(logOf("ir-basics"), '{"type": "quiz_ans', "utf8");
        expect(await attempts()).toHaveLength(1);
    });

    it("read a log written by the Flask backend on Windows (CRLF)", async () => {
        await mkdir(s.config.logsDir, { recursive: true });
        const lines = attempt("w1").map((ev) => JSON.stringify(ev));
        await writeFile(logOf("ir-basics"), `${lines.join("\r\n")}\r\n`);
        const [a] = await attempts();
        expect([a.attempt, a.completed, a.answered]).toEqual(["w1", true, 1]);
    });

    it("return survey answers ungraded", async () => {
        const ev = {
            ...ANSWER,
            attempt: "s1",
            correct: null,
            response_text: "選択肢 A",
        };
        const start = { ...ANSWER, type: "quiz_start", attempt: "s1" };
        await s.post("", { events: [start, ev] });
        const [a] = await attempts();
        expect(a.correct).toBeNull();
        expect(a.answered).toBe(1);
        const [answer] = a.answers as Ev[];
        expect(answer.correct).toBeNull();
        expect(answer.response_text).toBe("選択肢 A");
    });

    it("keep a language switch and each answer's language", async () => {
        const start = {
            ...ANSWER,
            type: "quiz_start",
            attempt: "l1",
            lang: "ja",
        };
        const change = {
            type: "quiz_lang",
            quiz: "ir-basics",
            attempt: "l1",
            lang: "en",
            from: "ja",
        };
        const answer = { ...ANSWER, attempt: "l1", lang: "en" };
        const r = await s.post("", { events: [start, change, answer] });
        expect(await r.json()).toEqual({ logged: 3, dropped: 0 });
        const [a] = await attempts();
        expect(a.lang).toBe("en");
        expect((a.answers as Ev[])[0].lang).toBe("en");
    });
});

// ── Per-question times ───────────────────────────────────────────────────

/** The CSV's rows as objects keyed by its header. */
async function csvRows(query = ""): Promise<Record<string, string>[]> {
    const r = await s.get(`/api/quiz/ir-basics/results.csv${query}`);
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toMatch(/^text\/csv/);
    expect(r.headers.get("content-disposition")).toContain(
        "ir-basics-results.csv",
    );
    const text = new TextDecoder("utf-8", { ignoreBOM: true }).decode(
        await r.arrayBuffer(),
    );
    expect(text.startsWith("\ufeff")).toBe(true); // Excel reads it as UTF-8
    const [head, ...rows] = parseCsv(text.slice(1));
    return rows.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

/** RFC 4180 rows: quoted cells may hold commas, quotes ("") and line breaks. */
function parseCsv(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = "";
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (quoted) {
            if (c === '"' && text[i + 1] === '"') {
                cell += '"';
                i++;
            } else if (c === '"') quoted = false;
            else cell += c;
        } else if (c === '"') quoted = true;
        else if (c === ",") {
            row.push(cell);
            cell = "";
        } else if (c === "\r" && text[i + 1] === "\n") {
            row.push(cell);
            rows.push(row);
            row = [];
            cell = "";
            i++;
        } else cell += c;
    }
    return rows;
}

async function defineSurvey(...ids: string[]) {
    await mkdir(s.config.surveysDir, { recursive: true });
    const survey = { id: "ir-basics", questions: ids.map((id) => ({ id })) };
    await writeFile(
        join(s.config.surveysDir, "ir-basics.json"),
        JSON.stringify(survey),
    );
}

describe("per-question times", () => {
    it("list each question's time by question", async () => {
        const answers: Given[] = [
            ["q1", "c2", true, 4200],
            ["q2", ["a", "c"], false, 3100],
        ];
        await s.post("?pid=P07&session=1", {
            events: attempt("a1", { answers }),
        });
        const [a] = await attempts();
        expect(a.question_ms).toEqual({ q1: 4200, q2: 3100 });
    });

    it("give the CSV a row per attempt and columns per question", async () => {
        const answers: Given[] = [
            ["q1", "c2", true, 4200],
            ["q2", ["a", "c"], false, 3150],
        ];
        await s.post("?pid=P07&session=1", {
            events: attempt("a1", { answers }),
        });
        await s.post("?pid=P08&session=1", {
            events: attempt("a2", {
                complete: false,
                answers: [["q1", "c1", false, 900]],
            }),
        });
        const rows = await csvRows();
        expect(rows.map((r) => r.pid)).toEqual(["P07", "P08"]);
        const [first, second] = rows;
        expect([first.q1_ms, first.q1_s, first.q2_ms, first.q2_s]).toEqual([
            "4200",
            "4.2",
            "3150",
            // 3.15 is stored a hair under 3.15, so it rounds down, as in Python
            "3.1",
        ]);
        expect(first.q1_answer).toBe("text of c2");
        expect(first.q1_correct).toBe("1");
        expect(first.q2_correct).toBe("0");
        expect([first.duration_ms, first.duration_s, first.completed]).toEqual([
            "8000",
            "8.0",
            "1",
        ]);
        // the second participant stopped after one question: the rest is blank
        expect([second.q1_ms, second.q2_ms, second.completed]).toEqual([
            "900",
            "",
            "0",
        ]);
        expect((await csvRows("?pid=P08"))[0].attempt).toBe("a2");
    });

    it("follow the survey's question order in the CSV", async () => {
        await defineSurvey("q2", "q1", "q3");
        await s.post("", { events: attempt("a1") });
        const r = await s.get("/api/quiz/ir-basics/results.csv");
        const head = (await r.text()).replace(/^\ufeff/, "").split("\r\n")[0];
        expect(
            head
                .split(",")
                .filter((h) => h.endsWith("_ms") && h !== "duration_ms"),
        ).toEqual(["q2_ms", "q1_ms", "q3_ms"]);
    });

    it("quote a CSV cell holding a comma or a quote", async () => {
        const ev = { ...ANSWER, response_text: 'A, "B"' };
        await s.post("", { events: [{ ...ANSWER, type: "quiz_start" }, ev] });
        const r = await s.get("/api/quiz/ir-basics/results.csv");
        expect(await r.text()).toContain(',"A, ""B""",');
    });

    it("give 404 for the CSV of an unknown survey", async () => {
        expect((await s.get("/api/quiz/nothing-here/results.csv")).status).toBe(
            404,
        );
    });
});

// ── Progress, for the test pages' button ───────────────────────────────────

async function progress(query: string): Promise<Ev> {
    return (await (
        await s.get(`/api/quiz/ir-basics/progress${query}`)
    ).json()) as Ev;
}

describe("progress", () => {
    it("names the next question to answer", async () => {
        await defineSurvey("q1", "q2", "q3");
        const r = await s.get("/api/quiz/ir-basics/progress?pid=P01&session=1");
        expect(r.status).toBe(200);
        expect(await r.json()).toEqual({
            quiz: "ir-basics",
            total: 3,
            answered: 0,
            answered_questions: [],
            next: 1,
            completed: false,
            attempt: null,
        });
        const evs = attempt("a1", {
            complete: false,
            answers: [["q1", "c1", null, 900]],
        });
        await s.post("?pid=P01&session=1", { events: evs });
        const body = await progress("?pid=P01&session=1");
        expect([body.answered, body.next, body.completed]).toEqual([
            1,
            2,
            false,
        ]);
        // another participant, or another session, has not started
        expect((await progress("?pid=P02")).next).toBe(1);
        expect((await progress("?pid=P01&session=2")).next).toBe(1);
    });

    it("skips answered questions and ends completed", async () => {
        await defineSurvey("q1", "q2", "q3");
        const answers: Given[] = [
            ["q1", "c1", null, 900],
            ["q3", "c1", null, 900],
        ];
        await s.post("?pid=P01&session=1", {
            events: attempt("a1", { complete: false, answers }),
        });
        let body = await progress("?pid=P01");
        expect(body.next).toBe(2);
        expect(body.answered_questions).toEqual(["q1", "q3"]);
        const more = attempt("a1", {
            complete: false,
            answers: [["q2", "c1", null, 900]],
        }).slice(1);
        await s.post("?pid=P01&session=1", { events: more });
        body = await progress("?pid=P01");
        expect([body.answered, body.next, body.completed]).toEqual([
            3,
            null,
            true,
        ]);
    });

    it("follows the latest attempt", async () => {
        await defineSurvey("q1", "q2");
        await s.post("?pid=P01&session=1", {
            events: attempt("old", {
                answers: [
                    ["q1", "c", null, 1],
                    ["q2", "c", null, 1],
                ],
            }),
        });
        const fresh = attempt("new", { complete: false, answers: [] }).map(
            (e) => ({
                ...e,
                t: String(e.t).replace("2026-10-08", "2026-10-09"),
            }),
        );
        await s.post("?pid=P01&session=1", { events: fresh });
        const body = await progress("?pid=P01");
        expect([body.attempt, body.next]).toEqual(["new", 1]);
    });

    it("goes by the visitor id without a participant", async () => {
        await defineSurvey("q1", "q2");
        const evs = attempt("a1", { complete: false }).map((e) => ({
            ...e,
            vid: "v-abc123",
        }));
        await s.post("", { events: evs });
        expect((await progress("?vid=v-abc123")).next).toBe(2);
        expect((await progress("?vid=v-other1")).next).toBe(1);
    });

    it("needs a survey and a visitor", async () => {
        await defineSurvey("q1");
        expect(
            (await s.get("/api/quiz/nothing-here/progress?pid=P01")).status,
        ).toBe(404);
        expect((await s.get("/api/quiz/ir-basics/progress")).status).toBe(400);
        expect((await s.get("/api/quiz/ir-basics/progress?vid=x")).status).toBe(
            400,
        );
    });

    it("answers a test page on another origin (CORS)", async () => {
        await defineSurvey("q1");
        const r = await fetch(
            s.url("/api/quiz/ir-basics/progress?vid=v-abc123"),
            {
                headers: { Origin: "http://localhost:8001" },
            },
        );
        expect(r.headers.get("access-control-allow-origin")).toBe(
            "http://localhost:8001",
        );
    });
});

// ── The IDs typed before the survey ────────────────────────────────────────

describe("typed IDs", () => {
    it("are kept and filterable", async () => {
        const typed = (id: string, user: string, survey: string) =>
            attempt(id).map((e) => ({
                ...e,
                user_id: user,
                survey_id: survey,
            }));
        await s.post("", { events: typed("a1", "U01", "3") });
        await s.post("", { events: typed("a2", "U02", "4") });
        expect((await attempts()).map((a) => [a.user_id, a.survey_id])).toEqual(
            [
                ["U01", "3"],
                ["U02", "4"],
            ],
        );
        expect((await attempts("?user_id=U02")).map((a) => a.attempt)).toEqual([
            "a2",
        ]);
        expect((await attempts("?survey_id=3")).map((a) => a.attempt)).toEqual([
            "a1",
        ]);
    });

    it("can come later, and odd ones are ignored", async () => {
        const late = {
            t: "2026-10-08T01:00:08.000Z",
            type: "quiz_ids",
            quiz: "ir-basics",
            attempt: "a1",
            user_id: "U09",
            survey_id: "s-1",
        };
        await s.post("", {
            events: [...attempt("a1", { complete: false }), late],
        });
        await s.post("", {
            events: attempt("a2").map((e) => ({
                ...e,
                user_id: "no spaces <b>",
            })),
        });
        const rows = Object.fromEntries(
            (await attempts()).map((a) => [a.attempt, a]),
        );
        expect([rows.a1.user_id, rows.a1.survey_id]).toEqual(["U09", "s-1"]);
        expect(rows.a2.user_id).toBeNull();
    });

    it("start the CSV", async () => {
        await s.post("", {
            events: attempt("a1").map((e) => ({
                ...e,
                user_id: "U01",
                survey_id: "3",
            })),
        });
        const [row] = await csvRows();
        expect(Object.keys(row).slice(0, 3)).toEqual([
            "attempt",
            "user_id",
            "survey_id",
        ]);
        expect([row.user_id, row.survey_id]).toEqual(["U01", "3"]);
    });
});

// ── The name and start time, typed after the IDs ─────────────────────────────

describe("name and start time", () => {
    it("are kept from any event, and odd ones are ignored", async () => {
        const profile = {
            t: "2026-10-08T01:00:01.500Z",
            type: "quiz_profile",
            quiz: "ir-basics",
            attempt: "a1",
            user_id: "U01",
            survey_id: "3",
            name: " 山田 太郎 ",
            start_time: "08:30",
        };
        await s.post("", { events: [...attempt("a1"), profile] });
        await s.post("", {
            events: attempt("a2").map((e) => ({
                ...e,
                name: "x".repeat(65),
                start_time: "8時半",
            })),
        });
        const rows = Object.fromEntries(
            (await attempts()).map((a) => [a.attempt, a]),
        );
        expect([rows.a1.name, rows.a1.start_time]).toEqual([
            "山田 太郎",
            "08:30",
        ]);
        expect([rows.a2.name, rows.a2.start_time]).toEqual([null, null]);
    });

    it("follow the IDs in the CSV", async () => {
        await s.post("", {
            events: attempt("a1").map((e) => ({
                ...e,
                user_id: "U01",
                survey_id: "3",
                name: "山田",
                start_time: "13:05",
            })),
        });
        const [row] = await csvRows();
        expect(Object.keys(row).slice(0, 5)).toEqual([
            "attempt",
            "user_id",
            "survey_id",
            "name",
            "start_time",
        ]);
        expect([row.name, row.start_time]).toEqual(["山田", "13:05"]);
    });
});
