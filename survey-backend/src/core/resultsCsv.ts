/**
 * The results as a spreadsheet (GET /api/quiz/<id>/results.csv): one row per
 * attempt and, for each question in the survey's order, its time, the answer in
 * words and whether it was right. Same columns and cells as the Flask
 * backend's export had, so existing analysis sheets keep working.
 */

import { type Attempt, questionOrder } from "./attempts.ts";
import { pyFixed1, pyStr, pyTruthy } from "./pyCompat.ts";
import type { QuizEvent } from "./quizEvents.ts";

const HEAD = [
    "attempt",
    "user_id",
    "survey_id",
    "pid",
    "session",
    "lang",
    "started_at",
    "completed_at",
    "completed",
    "answered",
    "correct",
    "duration_ms",
    "duration_s",
];

/** A cell as Python's csv module writes a value: None is blank, the rest is str(). */
function cell(value: unknown): string {
    const s = value === null || value === undefined ? "" : pyStr(value);
    return /[",\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

/** `x or ""`: blank for anything Python counts as false. */
function orBlank(value: unknown): unknown {
    return pyTruthy(value) ? value : "";
}

/** Milliseconds as seconds with one decimal, for a spreadsheet; blank if unknown. */
function seconds(ms: unknown): string {
    if (typeof ms === "boolean") return pyFixed1(Number(ms) / 1000);
    return typeof ms === "number" ? pyFixed1(ms / 1000) : "";
}

/** The answer in words: the text quiz-lib sent, else the choice ids. */
function answerText(response: unknown, text: unknown): unknown {
    if (text !== null && text !== undefined) return text;
    return Array.isArray(response)
        ? response.map(pyStr).join(", ")
        : orBlank(response);
}

export function resultsCsv(
    definition: QuizEvent | null,
    attempts: readonly Attempt[],
): string {
    const order = questionOrder(definition);
    // questions answered but no longer in the survey (or no survey file) go last
    for (const a of attempts)
        for (const x of a.answers)
            if (!order.includes(x.question)) order.push(x.question);
    const head = [...HEAD];
    for (const q of order) {
        const id = pyStr(q);
        head.push(`${id}_ms`, `${id}_s`, `${id}_answer`, `${id}_correct`);
    }
    const rows: unknown[][] = [head];
    for (const a of attempts) {
        const byQuestion = new Map<unknown, (typeof a.answers)[number]>(
            a.answers.map((x) => [x.question, x]),
        );
        const row: unknown[] = [
            a.attempt,
            orBlank(a.user_id),
            orBlank(a.survey_id),
            orBlank(a.pid),
            orBlank(a.session),
            orBlank(a.lang),
            orBlank(a.started_at),
            orBlank(a.completed_at),
            a.completed ? 1 : 0,
            a.answered,
            a.correct ?? "",
            a.duration_ms ?? "",
            seconds(a.duration_ms),
        ];
        for (const q of order) {
            const x = byQuestion.get(q);
            if (!x) {
                row.push("", "", "", "");
                continue;
            }
            row.push(
                x.ms ?? "",
                seconds(x.ms),
                answerText(x.response, x.response_text),
                x.correct === null ? "" : x.correct ? 1 : 0,
            );
        }
        rows.push(row);
    }
    const body = rows.map((r) => `${r.map(cell).join(",")}\r\n`).join("");
    // BOM: Excel then reads the Japanese answers as UTF-8
    return `\ufeff${body}`;
}
