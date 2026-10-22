/**
 * The answers' log as the Flask backend kept it: one append-only JSONL file per
 * survey, <dir>/<quiz id>.jsonl, a line per event, so the logs it wrote
 * (backend/quiz-logs/) can be copied in and read as they are.
 */

import { appendFile, mkdir, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { pyDumps } from "../core/pyCompat.ts";
import {
    field,
    isObject,
    QUIZ_ID,
    type QuizEvent,
} from "../core/quizEvents.ts";
import type { QuizEventStore } from "./types.ts";

/**
 * One line of the log. Python's json.dumps leaves U+0085, U+2028 and U+2029 as
 * they are, but Python's str.splitlines() breaks a line at them (the Flask
 * backend lost such answers that way); escaped, it is the same JSON on one line
 * for any reader that splits lines.
 */
function line(ev: QuizEvent): string {
    const json = pyDumps(ev).replace(
        /[\u0085\u2028\u2029]/g,
        (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`,
    );
    return `${json}\n`;
}

function isMissing(err: unknown): boolean {
    const code = (err as { code?: unknown } | null)?.code;
    return code === "ENOENT" || code === "EISDIR" || code === "ENOTDIR";
}

export class JsonlStore implements QuizEventStore {
    // One process appends; this queue keeps a read from seeing half a batch.
    private tail: Promise<unknown> = Promise.resolve();

    private readonly dir: string;

    constructor(dir: string) {
        this.dir = dir;
    }

    private locked<T>(fn: () => Promise<T>): Promise<T> {
        const run = this.tail.then(fn);
        this.tail = run.catch(() => undefined);
        return run;
    }

    append(events: readonly QuizEvent[]): Promise<void> {
        const byQuiz = new Map<string, string>();
        for (const ev of events) {
            const quiz = String(field(ev, "quiz"));
            byQuiz.set(quiz, (byQuiz.get(quiz) ?? "") + line(ev));
        }
        return this.locked(async () => {
            await mkdir(this.dir, { recursive: true });
            for (const [quiz, lines] of byQuiz)
                await appendFile(
                    join(this.dir, `${quiz}.jsonl`),
                    lines,
                    "utf8",
                );
        });
    }

    async read(quiz: string): Promise<QuizEvent[] | null> {
        if (!QUIZ_ID.test(quiz)) return null;
        let text: string;
        try {
            text = await this.locked(() =>
                readFile(join(this.dir, `${quiz}.jsonl`), "utf8"),
            );
        } catch (err) {
            if (isMissing(err)) return null;
            throw err;
        }
        const events: QuizEvent[] = [];
        // CRLF too: the Flask backend on Windows wrote its lines in text mode
        for (const raw of text.split(/\r\n|\r|\n/)) {
            try {
                const ev: unknown = JSON.parse(raw);
                if (isObject(ev)) events.push(ev);
            } catch {
                // a torn write: the rest of the log still counts
            }
        }
        return events;
    }

    async quizzes(): Promise<string[]> {
        try {
            const names = await readdir(this.dir);
            return names
                .filter((n) => n.endsWith(".jsonl"))
                .map((n) => n.slice(0, -".jsonl".length));
        } catch (err) {
            if (isMissing(err)) return [];
            throw err;
        }
    }
}
