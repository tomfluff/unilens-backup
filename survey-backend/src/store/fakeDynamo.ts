/**
 * An in-memory DynamoApi for the tests, keeping to what DynamoDB does with the
 * calls the store makes: BatchWriteItem refuses more than 25 items or the same
 * key twice and may leave items unprocessed; Query returns a partition in
 * sort-key order (byte order of the UTF-8 key), a page at a time.
 */

import type { DynamoApi, Item } from "./dynamoStore.ts";

export interface FakeDynamoOptions {
    /** items per Query page (DynamoDB pages by size, 1 MB) */
    pageSize?: number;
    /** how many of the next batches leave their last items unprocessed */
    throttle?: number;
}

const keyOf = (item: Item) => `${item.quiz.S}\u0000${item.seq.S}`;
const bytes = (s: string) => Buffer.from(s, "utf8");

export class FakeDynamo implements DynamoApi {
    readonly items = new Map<string, Item>();
    batches = 0;
    queries = 0;
    private readonly pageSize: number;
    private throttle: number;

    constructor({ pageSize = 1000, throttle = 0 }: FakeDynamoOptions = {}) {
        this.pageSize = pageSize;
        this.throttle = throttle;
    }

    async batchPut(items: Item[]): Promise<Item[]> {
        this.batches++;
        if (items.length < 1 || items.length > 25)
            throw new Error(
                `BatchWriteItem takes 1-25 items, not ${items.length}`,
            );
        const keys = new Set(items.map(keyOf));
        if (keys.size !== items.length)
            throw new Error("BatchWriteItem: the same key twice in one batch");
        const left = this.throttle > 0 ? Math.ceil(items.length / 3) : 0;
        if (left) this.throttle--;
        const done = items.slice(0, items.length - left);
        for (const item of done)
            this.items.set(keyOf(item), structuredClone(item));
        return items.slice(items.length - left);
    }

    async queryPage(
        quiz: string,
        startKey?: Item,
    ): Promise<{ items: Item[]; next?: Item }> {
        this.queries++;
        const all = [...this.items.values()]
            .filter((item) => item.quiz.S === quiz)
            .sort((a, b) => Buffer.compare(bytes(a.seq.S), bytes(b.seq.S)));
        const from = startKey
            ? all.findIndex((item) => item.seq.S === startKey.seq.S) + 1
            : 0;
        const page = all.slice(from, from + this.pageSize);
        const more = from + this.pageSize < all.length;
        const last = page[page.length - 1];
        return {
            items: page.map((item) => structuredClone(item)),
            next: more && last ? { quiz: last.quiz, seq: last.seq } : undefined,
        };
    }
}
