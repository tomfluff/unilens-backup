/**
 * The DynamoDB store gives the same answers as the JSONL one: the same random
 * requests go through the write API into each, and every read API (results,
 * CSV, progress, the list) must return the same thing from both.
 */

import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { ApiRequest, Deps, Handler } from "../handlers/http.ts";
import {
    getProgress,
    getResults,
    getResultsCsv,
    listSurveys,
} from "../handlers/read.ts";
import { postQuizLog } from "../handlers/write.ts";
import { DynamoStore } from "./dynamoStore.ts";
import { FakeDynamo } from "./fakeDynamo.ts";
import { FileDefinitions } from "./fileDefinitions.ts";
import { JsonlStore } from "./jsonlStore.ts";

/** a small seeded generator, so a failure can be replayed */
function random(seed: number) {
    let a = seed >>> 0;
    const next = () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32;
    };
    const pick = <T>(xs: readonly T[]): T => xs[Math.floor(next() * xs.length)];
    return { next, pick };
}

function event(r: ReturnType<typeof random>, minute: number) {
    const ev: Record<string, unknown> = {
        t: `2026-10-22T01:${String(minute % 60).padStart(2, "0")}:${String(Math.floor(r.next() * 60)).padStart(2, "0")}.${String(Math.floor(r.next() * 1000)).padStart(3, "0")}Z`,
        type: r.pick([
            "quiz_open",
            "quiz_start",
            "quiz_answer",
            "quiz_answer",
            "quiz_answer",
            "quiz_complete",
            "quiz_ids",
            "alt_click",
        ]),
        quiz: r.pick(["s1", "s1", "s2", "bad id"]),
        attempt: r.pick(["a1", "a2", "a3", "a4", ""]),
        question: r.pick(["q1", "q2", "q3", "x9"]),
        index: r.pick([0, 1, 2, null]),
        response: r.pick(["c1", ["a", "c"], null, ""]),
        response_text: r.pick(["選択肢 A", 'A, "B"', "line\nbreak", null]),
        correct: r.pick([true, false, null]),
        ms: r.pick([4200, 3150, 250, null, 1234.5]),
    };
    if (r.next() < 0.3) ev.total = r.pick([3, 4]);
    if (r.next() < 0.2) ev.vid = r.pick(["v-abc123", "v-other1"]);
    if (r.next() < 0.2) ev.user_id = r.pick(["U01", "U02", "bad id"]);
    if (r.next() < 0.2) ev.survey_id = r.pick(["3", "4"]);
    return ev;
}

const request = (
    path: string,
    params: Record<string, string> = {},
    body = "",
): ApiRequest => ({
    params,
    query: new URL(path, "http://x").searchParams,
    body,
});

async function twoStores() {
    const root = await mkdtemp(join(tmpdir(), "survey-parity-"));
    const surveys = join(root, "quizzes");
    await mkdir(surveys);
    await writeFile(
        join(surveys, "s1.json"),
        JSON.stringify({
            questions: [{ id: "q1" }, { id: "q2" }, { id: "q3" }],
        }),
    );
    let tick = 0;
    // one clock for both, advanced per request: the same "rx" on both sides
    const clock = () => new Date(Date.UTC(2026, 9, 22, 2, 0, 0, tick));
    const make = (events: Deps["events"]): Deps => ({
        events,
        surveys: new FileDefinitions(surveys),
        now: clock,
    });
    return {
        root,
        jsonl: make(new JsonlStore(join(root, "quiz-logs"))),
        dynamo: make(new DynamoStore(new FakeDynamo({ pageSize: 9 }))),
        advance: () => {
            tick += 1;
        },
    };
}

async function both(
    deps: { jsonl: Deps; dynamo: Deps },
    handler: Handler,
    req: ApiRequest,
) {
    return [await handler(req, deps.jsonl), await handler(req, deps.dynamo)];
}

describe("DynamoDB and JSONL stores", () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
        it(`give the same results (seed ${seed})`, async () => {
            const r = random(seed);
            const s = await twoStores();
            try {
                for (let n = 0; n < 25; n++) {
                    const events = Array.from(
                        { length: r.pick([1, 3, 10, 40]) },
                        () => event(r, n),
                    );
                    const query = r.pick([
                        "",
                        "?pid=P01&session=1",
                        "?pid=P02&session=02",
                    ]);
                    const req = request(
                        `/api/quiz/log${query}`,
                        {},
                        JSON.stringify({ events }),
                    );
                    const [a, b] = await both(s, postQuizLog, req);
                    expect(b).toEqual(a);
                    s.advance();
                }
                const [la, lb] = await both(
                    s,
                    listSurveys,
                    request("/api/quiz"),
                );
                expect(lb).toEqual(la);
                for (const quiz of ["s1", "s2", "nothing"]) {
                    for (const filter of [
                        "",
                        "?pid=P01",
                        "?completed=1",
                        "?user_id=U01",
                    ]) {
                        const p = { quiz };
                        const [ra, rb] = await both(
                            s,
                            getResults,
                            request(`/x${filter}`, p),
                        );
                        expect(rb).toEqual(ra);
                        const [ca, cb] = await both(
                            s,
                            getResultsCsv,
                            request(`/x${filter}`, p),
                        );
                        expect(cb).toEqual(ca);
                    }
                    for (const who of [
                        "?pid=P01",
                        "?pid=P02&session=2",
                        "?vid=v-abc123",
                    ]) {
                        const [pa, pb] = await both(
                            s,
                            getProgress,
                            request(`/x${who}`, { quiz }),
                        );
                        expect(pb).toEqual(pa);
                    }
                }
            } finally {
                await rm(s.root, { recursive: true, force: true });
            }
        });
    }
});
