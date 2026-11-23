/**
 * The answers' log in DynamoDB: one table, every survey's events under its id.
 *
 *   quiz (partition key)  seq (sort key)                     event      pid / vid
 *   "unilens-poc"         "<rx>#<nnn>#<random>"              JSON text  (for a later index)
 *   "#quizzes"            "unilens-poc"                      (marks that the survey has a log)
 *
 * The sort key starts with the arrival time ("rx", stamped by the write API),
 * so a Query returns a survey's events in arrival order, as the fold needs (a
 * retried answer replaces the earlier one). "<nnn>" keeps a batch's order
 * within the same millisecond; the random part keeps two requests in the same
 * millisecond apart. "#quizzes" cannot clash with a survey: ids have no "#".
 *
 * Each event is kept as its JSON text, not as DynamoDB attributes, so it reads
 * back exactly as it arrived (DynamoDB has no null in a set, no empty set, and
 * its own number type); pid and vid are copied out only to be indexable later.
 *
 * This file knows DynamoDB only through DynamoApi, a few calls wide, so it is
 * tested against a fake; dynamoSdk.ts is the AWS SDK behind it.
 */

import { randomUUID } from "node:crypto";
import {
    field,
    isObject,
    QUIZ_ID,
    type QuizEvent,
} from "../core/quizEvents.ts";
import type { QuizEventStore } from "./types.ts";

/** An item as this store writes it: string attributes only. */
export type Item = Record<string, { S: string }>;

/** The DynamoDB calls the store makes, on one table. */
export interface DynamoApi {
    /** BatchWriteItem of puts (at most 25): returns the items DynamoDB left unprocessed. */
    batchPut(items: Item[]): Promise<Item[]>;
    /** One page of a strongly consistent Query on a partition, in sort-key order. */
    queryPage(
        quiz: string,
        startKey?: Item,
    ): Promise<{ items: Item[]; next?: Item }>;
}

/** the partition that lists the surveys with a log */
export const QUIZZES_PARTITION = "#quizzes";
/** BatchWriteItem's limit */
const BATCH = 25;
/** retries of the items DynamoDB left unprocessed (throttling), backing off */
const RETRIES = 6;

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

function eventItem(quiz: string, seq: string, ev: QuizEvent): Item {
    const item: Item = {
        quiz: { S: quiz },
        seq: { S: seq },
        event: { S: JSON.stringify(ev) },
    };
    for (const key of ["pid", "vid"]) {
        const v = field(ev, key);
        if (typeof v === "string" && v) item[key] = { S: v };
    }
    return item;
}

/** When the event arrived: the write API's "rx", else now (an event stamped by older code). */
function arrival(ev: QuizEvent): string {
    const rx = field(ev, "rx");
    return typeof rx === "string" && rx ? rx : new Date().toISOString();
}

export interface DynamoStoreOptions {
    /** the first retry's wait for unprocessed items, doubling each time (ms) */
    backoffMs?: number;
}

export class DynamoStore implements QuizEventStore {
    private readonly api: DynamoApi;
    private readonly backoffMs: number;
    /** surveys already listed in "#quizzes" by this process: one put each is enough */
    private readonly listed = new Set<string>();

    constructor(api: DynamoApi, { backoffMs = 50 }: DynamoStoreOptions = {}) {
        this.api = api;
        this.backoffMs = backoffMs;
    }

    append(events: readonly QuizEvent[]): Promise<void> {
        const tag = randomUUID().slice(0, 8);
        return this.write(
            events.map((ev, i) => ({
                ev,
                seq: `${arrival(ev)}#${String(i).padStart(3, "0")}#${tag}`,
            })),
        );
    }

    /**
     * Copy in a survey's existing log (a JSONL file), in its order. The keys
     * come from each line's place in the file, so running it again rewrites
     * the same items rather than adding copies.
     */
    load(events: readonly QuizEvent[]): Promise<void> {
        return this.write(
            events.map((ev, i) => ({
                ev,
                seq: `${arrival(ev)}#${String(i).padStart(6, "0")}#load`,
            })),
        );
    }

    private async write(rows: { ev: QuizEvent; seq: string }[]): Promise<void> {
        const items: Item[] = [];
        const newQuizzes = new Set<string>();
        for (const { ev, seq } of rows) {
            const quiz = field(ev, "quiz");
            if (typeof quiz !== "string" || !QUIZ_ID.test(quiz)) continue;
            items.push(eventItem(quiz, seq, ev));
            if (!this.listed.has(quiz) && !newQuizzes.has(quiz)) {
                newQuizzes.add(quiz);
                items.push({
                    quiz: { S: QUIZZES_PARTITION },
                    seq: { S: quiz },
                });
            }
        }
        for (let i = 0; i < items.length; i += BATCH)
            await this.putAll(items.slice(i, i + BATCH));
        // only once written: a failed write lists the survey again next time
        for (const quiz of newQuizzes) this.listed.add(quiz);
    }

    private async putAll(items: Item[]): Promise<void> {
        let left = items;
        for (let attempt = 0; left.length; attempt++) {
            if (attempt > RETRIES)
                throw new Error(
                    `DynamoDB left ${left.length} events unwritten after ${RETRIES} retries`,
                );
            if (attempt) await sleep(this.backoffMs * 2 ** (attempt - 1));
            left = await this.api.batchPut(left);
        }
    }

    private async partition(quiz: string): Promise<Item[]> {
        const items: Item[] = [];
        let next: Item | undefined;
        do {
            const page = await this.api.queryPage(quiz, next);
            items.push(...page.items);
            next = page.next;
        } while (next);
        return items;
    }

    async read(quiz: string): Promise<QuizEvent[] | null> {
        if (!QUIZ_ID.test(quiz)) return null;
        const items = await this.partition(quiz);
        if (!items.length) return null;
        const events: QuizEvent[] = [];
        for (const item of items) {
            try {
                const ev: unknown = JSON.parse(item.event?.S ?? "");
                if (isObject(ev)) events.push(ev);
            } catch {
                // an item written by hand, or damaged: the rest still counts
            }
        }
        return events;
    }

    async quizzes(): Promise<string[]> {
        const items = await this.partition(QUIZZES_PARTITION);
        return items.map((item) => item.seq.S);
    }
}
