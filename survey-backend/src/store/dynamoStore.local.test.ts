/**
 * The DynamoDB store on a real DynamoDB: DynamoDB Local (docker-compose.yml).
 * Runs only when DYNAMODB_ENDPOINT is set, e.g.
 *   npm run db:up
 *   DYNAMODB_ENDPOINT=http://localhost:8100 npx vitest run
 * Each run uses a table of its own and deletes it afterwards.
 */

import { describe, expect, it } from "vitest";
import { stampEvents } from "../core/quizEvents.ts";

const endpoint = process.env.DYNAMODB_ENDPOINT;

describe.skipIf(!endpoint)("DynamoStore on DynamoDB Local", () => {
    it("writes, reads back in order, lists and loads", async () => {
        // imported here: without an endpoint the AWS SDK is never loaded
        const { DeleteTableCommand } = await import("@aws-sdk/client-dynamodb");
        const { dynamoApi, dynamoClient, ensureTable } = await import(
            "./dynamoSdk.ts"
        );
        const { DynamoStore } = await import("./dynamoStore.ts");
        const table = `survey-test-${Date.now()}`;
        const client = dynamoClient({ table, endpoint });
        expect(await ensureTable(client, table)).toBe(true);
        expect(await ensureTable(client, table)).toBe(false);
        try {
            const store = new DynamoStore(dynamoApi(client, table));
            expect(await store.read("s1")).toBeNull();
            const at = (s: number) => new Date(Date.UTC(2026, 9, 22, 1, 0, s));
            const batch = Array.from({ length: 60 }, (_, i) => ({
                type: "quiz_answer",
                quiz: i % 2 ? "s1" : "s2",
                attempt: "a1",
                question: `q${i}`,
                response_text: i === 3 ? "選択肢 A\u2028😀" : null,
                ms: i,
            }));
            const first = stampEvents(
                batch,
                { pid: "P01", session: "1" },
                at(1),
            );
            const second = stampEvents(batch.slice(0, 5), null, at(2));
            await store.append(first);
            await store.append(second);
            const s1 = [...first, ...second].filter((e) => e.quiz === "s1");
            expect(await store.read("s1")).toEqual(s1);
            expect((await store.quizzes()).sort()).toEqual(["s1", "s2"]);

            // a JSONL log loaded twice is there once
            const log = stampEvents(batch.slice(0, 10), null, at(3)).map(
                (e) => ({ ...e, quiz: "s3" }),
            );
            await store.load(log);
            await store.load(log);
            expect(await store.read("s3")).toEqual(log);
        } finally {
            await client.send(new DeleteTableCommand({ TableName: table }));
            client.destroy();
        }
    });
});
