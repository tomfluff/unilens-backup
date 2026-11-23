/**
 * The DynamoDB store against an in-memory DynamoDB (fakeDynamo.ts): what it
 * writes, the order it reads back, and how it copes with DynamoDB's limits.
 */

import { describe, expect, it } from "vitest";
import { stampEvents } from "../core/quizEvents.ts";
import { DynamoStore, QUIZZES_PARTITION } from "./dynamoStore.ts";
import { FakeDynamo } from "./fakeDynamo.ts";

const at = (s: number) => new Date(Date.UTC(2026, 9, 22, 1, 0, s));

function answer(quiz: string, n: number, extra: Record<string, unknown> = {}) {
    return {
        t: `2026-10-22T01:00:${String(n % 60).padStart(2, "0")}.000Z`,
        type: "quiz_answer",
        quiz,
        attempt: "a1",
        question: `q${n}`,
        ms: n,
        ...extra,
    };
}

describe("DynamoStore", () => {
    it("has no log for a survey never written, or a malformed id", async () => {
        const store = new DynamoStore(new FakeDynamo());
        expect(await store.read("nothing-here")).toBeNull();
        expect(await store.read("../x")).toBeNull();
        expect(await store.quizzes()).toEqual([]);
    });

    it("reads events back as they arrived, each survey on its own", async () => {
        const store = new DynamoStore(new FakeDynamo());
        await store.append(
            stampEvents([answer("s1", 1), answer("s2", 2)], null, at(1)),
        );
        await store.append(stampEvents([answer("s1", 3)], null, at(2)));
        const s1 = await store.read("s1");
        expect(s1?.map((e) => e.question)).toEqual(["q1", "q3"]);
        expect((await store.read("s2"))?.map((e) => e.question)).toEqual([
            "q2",
        ]);
        expect((await store.quizzes()).sort()).toEqual(["s1", "s2"]);
    });

    it("keeps a batch's order within the same millisecond", async () => {
        const store = new DynamoStore(new FakeDynamo());
        const batch = Array.from({ length: 60 }, (_, i) => answer("s1", i));
        await store.append(stampEvents(batch, null, at(1)));
        const back = await store.read("s1");
        expect(back?.map((e) => e.ms)).toEqual(batch.map((e) => e.ms));
    });

    it("reads back exactly what arrived: nulls, nesting, unicode", async () => {
        const store = new DynamoStore(new FakeDynamo());
        const odd = answer("s1", 1, {
            response: ["a", "c"],
            response_text: "選択肢 A\u2028次の行 😀",
            correct: null,
            lang: "",
            nested: { deep: [1, 2.5, { x: null }] },
        });
        const [stamped] = stampEvents(
            [odd],
            { pid: "P01", session: "2" },
            at(1),
        );
        await store.append([stamped]);
        expect(await store.read("s1")).toEqual([stamped]);
    });

    it("splits writes into batches of 25 and lists each survey once", async () => {
        const db = new FakeDynamo();
        const store = new DynamoStore(db);
        const batch = Array.from({ length: 60 }, (_, i) => answer("s1", i));
        await store.append(stampEvents(batch, null, at(1)));
        // 60 events and one "#quizzes" item: 61 items, 3 batches
        expect(db.batches).toBe(3);
        expect(db.items.size).toBe(61);
        await store.append(stampEvents([answer("s1", 99)], null, at(2)));
        expect(db.items.size).toBe(62);
    });

    it("writes again what DynamoDB left unprocessed", async () => {
        const db = new FakeDynamo({ throttle: 2 });
        const store = new DynamoStore(db, { backoffMs: 1 });
        const batch = Array.from({ length: 10 }, (_, i) => answer("s1", i));
        await store.append(stampEvents(batch, null, at(1)));
        expect((await store.read("s1"))?.length).toBe(10);
        expect(db.batches).toBeGreaterThan(1);
    });

    it("gives up, loudly, when DynamoDB keeps refusing", async () => {
        const db = new FakeDynamo({ throttle: 1000 });
        const store = new DynamoStore(db, { backoffMs: 1 });
        const batch = Array.from({ length: 4 }, (_, i) => answer("s1", i));
        let failed = false;
        try {
            await store.append(stampEvents(batch, null, at(1)));
        } catch {
            failed = true;
        }
        expect(failed).toBe(true);
    });

    it("reads a survey over several pages", async () => {
        const db = new FakeDynamo({ pageSize: 7 });
        const store = new DynamoStore(db);
        const batch = Array.from({ length: 50 }, (_, i) => answer("s1", i));
        await store.append(stampEvents(batch, null, at(1)));
        expect((await store.read("s1"))?.length).toBe(50);
        expect(db.queries).toBe(8);
    });

    it("copies a pid and a visitor id out of the event, for an index", async () => {
        const db = new FakeDynamo();
        const store = new DynamoStore(db);
        await store.append(
            stampEvents(
                [answer("s1", 1, { vid: "v-abc123" })],
                { pid: "P01", session: "1" },
                at(1),
            ),
        );
        const [item] = [...db.items.values()].filter((i) => i.quiz.S === "s1");
        expect(item.pid).toEqual({ S: "P01" });
        expect(item.vid).toEqual({ S: "v-abc123" });
        expect(
            item.seq.S.startsWith("2026-10-22T01:00:01.000+00:00#000#"),
        ).toBe(true);
    });

    it("skips a damaged item instead of failing the survey", async () => {
        const db = new FakeDynamo();
        const store = new DynamoStore(db);
        await store.append(stampEvents([answer("s1", 1)], null, at(1)));
        await db.batchPut([
            {
                quiz: { S: "s1" },
                seq: { S: "2026-10-22T01:00:01.500+00:00#000#hand" },
                event: { S: "{not json" },
            },
        ]);
        expect((await store.read("s1"))?.length).toBe(1);
    });

    it("loads a JSONL log once, however often it is run", async () => {
        const db = new FakeDynamo();
        const store = new DynamoStore(db);
        const log = stampEvents(
            Array.from({ length: 30 }, (_, i) => answer("s1", i)),
            null,
            at(1),
        );
        await store.load(log);
        await new DynamoStore(db).load(log);
        expect(await store.read("s1")).toEqual(log);
        const listed = [...db.items.values()].filter(
            (i) => i.quiz.S === QUIZZES_PARTITION,
        );
        expect(listed.map((i) => i.seq.S)).toEqual(["s1"]);
    });
});
