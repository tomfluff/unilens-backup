/**
 * Pure quiz rules: grading, scoring, the per-attempt choice order. No DOM, no
 * store — the panel and the tests share them.
 */

import type { Quiz, QuizChoice, QuizQuestion, QuizResponse } from "./quizTypes";

/**
 * A typed answer as it is compared: Unicode NFKC (full-width digits and letters
 * from a Japanese IME become their ASCII forms, half-width kana become
 * full-width), surrounding space trimmed, inner runs of space collapsed, and
 * case folded unless the question asks otherwise.
 */
export function normalizeTextAnswer(s: string, caseSensitive = false): string {
    const t = s.normalize("NFKC").trim().replace(/\s+/g, " ");
    return caseSensitive ? t : t.toLowerCase();
}

/**
 * Whether a response is complete enough to submit (something picked or typed).
 * An optional text question may be sent blank.
 */
export function isAnswerable(
    q: QuizQuestion,
    r: QuizResponse | undefined,
): boolean {
    if (q.type === "text" && q.optional)
        return r === undefined || typeof r === "string";
    if (r === undefined) return false;
    if (q.type === "multiple") return Array.isArray(r) && r.length > 0;
    return typeof r === "string" && r.trim() !== "";
}

/** Whether the question has an answer key; without one it is a survey item. */
export function isGraded(q: QuizQuestion): boolean {
    return q.type === "text" ? q.accepted.length > 0 : q.answer !== undefined;
}

/** Right or wrong, or null for a question without an answer key. */
export function isCorrect(q: QuizQuestion, r: QuizResponse): boolean | null {
    switch (q.type) {
        case "single":
            return q.answer === undefined ? null : r === q.answer;
        case "multiple": {
            if (q.answer === undefined) return null;
            if (!Array.isArray(r)) return false;
            const picked = new Set(r);
            return (
                picked.size === q.answer.length &&
                q.answer.every((id) => picked.has(id))
            );
        }
        case "text": {
            if (!q.accepted.length) return null;
            if (typeof r !== "string") return false;
            const given = normalizeTextAnswer(r, q.caseSensitive);
            return q.accepted.some(
                (a) => normalizeTextAnswer(a, q.caseSensitive) === given,
            );
        }
    }
}

/** The correct choice ids of a choice question (empty for a text question). */
export function correctChoiceIds(q: QuizQuestion): string[] {
    if (q.type === "single") return q.answer === undefined ? [] : [q.answer];
    if (q.type === "multiple") return q.answer ?? [];
    return [];
}

export function scoreOf(
    quiz: Quiz,
    answers: Record<string, { correct: boolean | null } | undefined>,
): { correct: number; answered: number; total: number } {
    let correct = 0;
    let answered = 0;
    for (const q of quiz.questions) {
        const a = answers[q.id];
        if (!a) continue;
        answered++;
        if (a.correct === true) correct++;
    }
    return { correct, answered, total: quiz.questions.length };
}

/** 32-bit FNV-1a: a short, stable fingerprint of a string. */
export function hashString(s: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
}

/**
 * Identifies a quiz's content. Stored progress is kept only while it matches,
 * so editing the questions starts visitors afresh instead of grading them
 * against answers that moved.
 */
export function quizFingerprint(quiz: Quiz): string {
    return hashString(JSON.stringify(quiz)).toString(36);
}

/**
 * The choices in this attempt's order. Seeded by the attempt and question, so a
 * re-render or a reload mid-attempt keeps the order the visitor already saw.
 */
export function orderedChoices(
    choices: QuizChoice[],
    shuffle: boolean,
    seed: string,
): QuizChoice[] {
    if (!shuffle) return choices;
    // mulberry32: tiny, good enough to deal choices
    let a = hashString(seed);
    const rand = () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const out = [...choices];
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

/**
 * The index of the next question to answer after `from` (later ones first, then
 * any skipped earlier: a question can be answered on its own page), or -1 when
 * every other question has an answer.
 */
export function nextUnanswered(
    quiz: Quiz,
    answers: Record<string, unknown>,
    from: number,
): number {
    const n = quiz.questions.length;
    for (let step = 1; step < n; step++) {
        const i = (((from + step) % n) + n) % n;
        if (!answers[quiz.questions[i].id]) return i;
    }
    return -1;
}

/** The first question without an answer, in the survey's order; -1 when all have one. */
export function firstUnanswered(
    quiz: Quiz,
    answers: Record<string, unknown>,
): number {
    return quiz.questions.findIndex((q) => !answers[q.id]);
}
