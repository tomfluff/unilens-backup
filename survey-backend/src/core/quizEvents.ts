/**
 * What quiz-lib posts (POST /api/quiz/log, src/quizLog.ts there) and what is
 * kept of it: events of known types naming a valid survey id, each small
 * enough, stamped with the participant when the request names one.
 *
 * The survey's log is its own: unlike the Flask backend's survey routes did,
 * nothing here writes to the study's per-participant logs (backend/study-logs).
 * The participant still goes on every line, so the two logs can be joined later
 * by pid and session.
 */

import { pyDumps, pyLen } from "./pyCompat.ts";

/** One event as it arrived: any JSON object. */
export type QuizEvent = Record<string, unknown>;

/** The read side of a query string; URLSearchParams and Lambda's parameters both fit. */
export interface Query {
    get(name: string): string | null;
}

/** A survey id: it names the survey's definition file and its log file. */
export const QUIZ_ID = /^[A-Za-z0-9_-]{1,64}$/;
export const STUDY_PID = /^[A-Za-z0-9_-]{1,24}$/;
export const STUDY_SESSION = /^\d{1,3}$/;
/** the anonymous visitor id link mode gives a browser that names no participant */
export const QUIZ_VISITOR = /^[A-Za-z0-9_-]{6,32}$/;
/** the user ID and survey ID a respondent types before the survey (quiz-lib respondentIds.ts) */
export const RESPONDENT_ID = /^[A-Za-z0-9_-]{1,32}$/;

export const QUIZ_EVENT_TYPES: ReadonlySet<string> = new Set([
    "quiz_open",
    "quiz_close",
    "quiz_start",
    "quiz_answer",
    "quiz_complete",
    // the survey is Japanese only now, but an older quiz.js (a cached page) may still send it
    "quiz_lang",
    "quiz_ids",
]);
export const QUIZ_MAX_EVENTS = 100;
/** measured as the Flask backend measured it: Python's json.dumps, in code points */
export const QUIZ_MAX_EVENT_CHARS = 8_000;

export interface StudyIds {
    pid: string;
    session: string;
}

export function isObject(value: unknown): value is QuizEvent {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** ev[key] when the event has it; a key from the prototype ("constructor") is not a field. */
export function field(ev: QuizEvent, key: string): unknown {
    return Object.hasOwn(ev, key) ? ev[key] : undefined;
}

/** The participant and session a request carries (?pid=&session=), or null. A malformed one is ignored, not refused. */
export function studyIds(query: Query): StudyIds | null {
    const pid = query.get("pid") ?? "";
    const session = query.get("session") ?? "";
    if (!STUDY_PID.test(pid) || !STUDY_SESSION.test(session)) return null;
    // "02" and "2" are the same session
    return { pid, session: String(Number(session)) };
}

/** Whether an event is kept: a known type, a valid survey id, and not oversized. */
export function isLoggable(ev: unknown): ev is QuizEvent {
    if (!isObject(ev)) return false;
    const type = field(ev, "type");
    const quiz = field(ev, "quiz");
    return (
        typeof type === "string" &&
        QUIZ_EVENT_TYPES.has(type) &&
        typeof quiz === "string" &&
        QUIZ_ID.test(quiz) &&
        pyLen(pyDumps(ev)) <= QUIZ_MAX_EVENT_CHARS
    );
}

/** A time as the Flask backend wrote "rx": milliseconds, "+00:00" rather than "Z". */
export function receivedAt(now: Date): string {
    return now.toISOString().replace("Z", "+00:00");
}

/** The events as they are logged: with the participant, who sent them, and when they arrived. */
export function stampEvents(
    events: readonly QuizEvent[],
    ids: StudyIds | null,
    now: Date,
): QuizEvent[] {
    const who = ids ? { pid: ids.pid, session: ids.session } : {};
    const rx = receivedAt(now);
    return events.map((ev) => ({ ...ev, ...who, src: "client", rx }));
}
