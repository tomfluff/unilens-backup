/**
 * A survey's log read back: folded into one record per attempt (results and
 * CSV), filtered, and one visitor's progress (the test pages' button). A port
 * of backend/app.py's _quiz_attempts, _filter_attempts and _quiz_progress, kept
 * to the same output so the survey's pages and exports do not change.
 */

import { pyRound, pyStr, pyTruthy } from "./pyCompat.ts";
import {
    field,
    QUIZ_VISITOR,
    type Query,
    type QuizEvent,
    RESPONDENT_ID,
    STUDY_PID,
    STUDY_SESSION,
} from "./quizEvents.ts";

export interface Answer {
    question: string;
    index: unknown;
    response: unknown;
    response_text: unknown;
    /** null for a question without an answer key (a survey item) */
    correct: boolean | null;
    ms: unknown;
    /** the language the question was read in */
    lang: unknown;
    answered_at: unknown;
}

export interface Attempt {
    attempt: string;
    /** typed by the respondent before the first question */
    user_id: string | null;
    survey_id: string | null;
    pid: unknown;
    session: unknown;
    vid: unknown;
    lang: unknown;
    page: unknown;
    started_at: unknown;
    completed_at: unknown;
    completed: boolean;
    /** null when nothing in the attempt is graded */
    correct: number | null;
    answered: number;
    total: unknown;
    /** to completion, or for an unfinished attempt up to its last answer */
    duration_ms: unknown;
    last_event_at: string | null;
    answers: Answer[];
    /** each question's time on its own, by question id (the same as answers[].ms) */
    question_ms: Record<string, unknown>;
}

type Folding = Omit<Attempt, "answers" | "question_ms"> & {
    answers: Map<string, Answer>;
};

// The fields an attempt takes from whichever event carries them, the latest winning.
const CARRIED = ["pid", "session", "vid", "lang", "page"] as const;

const ISO_TIME =
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2})(?::(\d{2})(?::(\d{2})(?:\.(\d{3}|\d{6}))?)?)?)?(?:([+-])(\d{2}):(\d{2}))?$/;

/** An ISO 8601 time as the widget writes it ("…Z"), in microseconds; null when it is not one. */
export function parseTime(value: unknown): number | null {
    if (typeof value !== "string") return null;
    const m = ISO_TIME.exec(value.replace(/Z$/, "+00:00"));
    if (!m) return null;
    const [, y, mo, d, h = "0", mi = "0", s = "0", frac = "", sign, oh, om] = m;
    const ms = Date.UTC(+y, +mo - 1, +d, +h, +mi, +s);
    const date = new Date(ms);
    // Date.UTC rolls 2026-02-30 over to March; Python refuses it
    if (
        date.getUTCFullYear() !== +y ||
        date.getUTCMonth() !== +mo - 1 ||
        date.getUTCDate() !== +d ||
        date.getUTCHours() !== +h ||
        date.getUTCMinutes() !== +mi ||
        date.getUTCSeconds() !== +s
    )
        return null;
    const offset = sign ? (sign === "-" ? -1 : 1) * (+oh * 60 + +om) : 0;
    return (ms - offset * 60_000) * 1000 + Number(frac.padEnd(6, "0"));
}

/** Milliseconds from one time to a later one, never negative; null when either is not a time. */
export function msBetween(start: unknown, end: unknown): number | null {
    const a = parseTime(start);
    const b = parseTime(end);
    if (a === null || b === null) return null;
    // as Python's round((b - a).total_seconds() * 1000)
    return Math.max(0, pyRound(((b - a) / 1e6) * 1000));
}

/** A string to order by, as Python's `x or ""` would give one. */
function orderKey(value: unknown): string {
    return typeof value === "string" ? value : "";
}

function compare(a: string, b: string): number {
    return a < b ? -1 : a > b ? 1 : 0;
}

/** An answer's place: its index when that is an integer, else last. */
function indexKey(index: unknown): number {
    if (typeof index === "boolean") return Number(index);
    return typeof index === "number" && Number.isInteger(index)
        ? index
        : 2 ** 30;
}

function newAttempt(id: string): Folding {
    return {
        attempt: id,
        user_id: null,
        survey_id: null,
        pid: null,
        session: null,
        vid: null,
        lang: null,
        page: null,
        started_at: null,
        completed_at: null,
        completed: false,
        correct: 0,
        answered: 0,
        total: null,
        duration_ms: null,
        last_event_at: null,
        answers: new Map(),
    };
}

/**
 * The log folded into one record per attempt, oldest first: who, when, the
 * score, how long it took, and each answer with the time spent on it. Events
 * must be in arrival order: a repeated answer (a retried send) replaces the
 * earlier one.
 */
export function quizAttempts(events: readonly QuizEvent[]): Attempt[] {
    const attempts = new Map<string, Folding>();
    for (const ev of events) {
        const id = field(ev, "attempt");
        if (typeof id !== "string" || !id) continue;
        let a = attempts.get(id);
        if (!a) {
            a = newAttempt(id);
            attempts.set(id, a);
        }
        for (const key of CARRIED) {
            const v = field(ev, key);
            if (v !== undefined && v !== null) a[key] = v;
        }
        for (const key of ["user_id", "survey_id"] as const) {
            const v = field(ev, key);
            if (typeof v === "string" && RESPONDENT_ID.test(v)) a[key] = v;
        }
        const t = field(ev, "t");
        if (typeof t === "string" && t > (a.last_event_at ?? ""))
            a.last_event_at = t;
        const kind = field(ev, "type");
        const has = (key: string) => Object.hasOwn(ev, key);
        if (kind === "quiz_start") {
            a.started_at = t ?? null;
            if (has("total")) a.total = ev.total;
        } else if (kind === "quiz_answer") {
            const question = field(ev, "question");
            if (typeof question !== "string") continue;
            const correct = field(ev, "correct");
            a.answers.set(question, {
                question,
                index: field(ev, "index") ?? null,
                response: field(ev, "response") ?? null,
                response_text: field(ev, "response_text") ?? null,
                correct: typeof correct === "boolean" ? correct : null,
                ms: field(ev, "ms") ?? null,
                lang: field(ev, "lang") ?? null,
                answered_at: t ?? null,
            });
        } else if (kind === "quiz_complete") {
            a.completed = true;
            a.completed_at = t ?? null;
            if (has("total")) a.total = ev.total;
            const ms = field(ev, "ms");
            if (typeof ms === "number" || typeof ms === "boolean")
                a.duration_ms = ms;
        }
    }
    const out: Attempt[] = [];
    for (const { answers: byQuestion, ...a } of attempts.values()) {
        const answers = [...byQuestion.values()].sort(
            (x, y) => indexKey(x.index) - indexKey(y.index),
        );
        const graded = answers.filter((x) => x.correct !== null);
        let duration = a.duration_ms;
        if (duration === null && answers.length) {
            const last = answers
                .map((x) => orderKey(x.answered_at))
                .reduce((m, x) => (x > m ? x : m));
            duration = msBetween(a.started_at, last);
        }
        // only open/close events: no attempt was made
        if (a.started_at === null && answers.length === 0) continue;
        out.push({
            ...a,
            correct: graded.length
                ? graded.filter((x) => x.correct).length
                : null,
            answered: answers.length,
            duration_ms: duration,
            answers,
            question_ms: Object.fromEntries(
                answers.map((x) => [x.question, x.ms]),
            ),
        });
    }
    return out.sort((x, y) =>
        compare(orderKey(x.started_at), orderKey(y.started_at)),
    );
}

const FILTERS = ["pid", "session", "attempt", "user_id", "survey_id"] as const;

/** The results routes' filters: ?pid= ?session= ?attempt= ?user_id= ?survey_id= ?completed=1 */
export function filterAttempts(attempts: Attempt[], query: Query): Attempt[] {
    let out = attempts;
    for (const key of FILTERS) {
        const want = query.get(key);
        if (want) out = out.filter((a) => pyStr(a[key]) === want);
    }
    const completed = query.get("completed");
    if (completed === "1" || completed === "true")
        out = out.filter((a) => a.completed);
    return out;
}

/**
 * The survey's question ids in order, as quiz-lib names them (q1, q2, … when a
 * question has no id of its own). An id is whatever the file says, so unknown.
 */
export function questionOrder(definition: QuizEvent | null): unknown[] {
    const questions = definition ? field(definition, "questions") : undefined;
    if (!Array.isArray(questions)) return [];
    const order: unknown[] = [];
    questions.forEach((q, i) => {
        if (q === null || typeof q !== "object" || Array.isArray(q)) return;
        const id = field(q as QuizEvent, "id");
        order.push(pyTruthy(id) ? id : `q${i + 1}`);
    });
    return order;
}

export interface Progress {
    quiz: string;
    total: number;
    answered: number;
    answered_questions: unknown[];
    /** 1-based; null once every question is answered */
    next: number | null;
    completed: boolean;
    attempt: string | null;
}

/**
 * How far one visitor is through a survey: their latest attempt (by its last
 * event), what it answered, and the next question to answer. The visitor is
 * ?pid= (and ?session=, default 1) or, without a participant, ?vid=.
 */
export function quizProgress(
    quiz: string,
    definition: QuizEvent | null,
    attempts: readonly Attempt[],
    query: Query,
): Progress {
    const order = questionOrder(definition);
    const pid = query.get("pid") ?? "";
    const vid = query.get("vid") ?? "";
    let mine: Attempt[] = [];
    if (STUDY_PID.test(pid)) {
        const raw = query.get("session") ?? "1";
        const session = STUDY_SESSION.test(raw) ? String(Number(raw)) : "1";
        mine = attempts.filter(
            (a) => a.pid === pid && pyStr(a.session) === session,
        );
    } else if (QUIZ_VISITOR.test(vid)) {
        mine = attempts.filter((a) => a.vid === vid && !pyTruthy(a.pid));
    }
    // the first of equally late attempts, as Python's max() picks
    const latest = mine.reduce<Attempt | null>(
        (best, a) =>
            !best || orderKey(a.last_event_at) > orderKey(best.last_event_at)
                ? a
                : best,
        null,
    );
    const done = new Set<unknown>(latest?.answers.map((x) => x.question));
    const answered = order.filter((q) => done.has(q));
    const pending = order.flatMap((q, i) => (done.has(q) ? [] : [i + 1]));
    return {
        quiz,
        total: order.length,
        answered: answered.length,
        answered_questions: answered,
        next: pending[0] ?? null,
        completed: order.length > 0 && pending.length === 0,
        attempt: latest?.attempt ?? null,
    };
}
