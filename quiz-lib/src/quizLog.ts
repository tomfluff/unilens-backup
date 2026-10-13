/**
 * Sends quiz events to the UniLens backend (POST /api/quiz/log), which appends
 * them to backend/quiz-logs/<quiz id>.jsonl — and, when the page names a study
 * participant, to that participant's study log as well, so answers sit on the
 * same timeline as their chat (unilens-lib/src/studyLog.ts).
 *
 * Only with `init({ backend })`; without it nothing leaves the page. Events
 * carry the quiz, an anonymous attempt id, the answers and timings, and the
 * page path — no address query, no browser details.
 */

import { STUDY_IDS_KEY } from "./domIds";

export interface StudyIds {
    pid: string;
    session: string;
}

export type QuizEventType =
    | "quiz_open"
    | "quiz_close"
    | "quiz_start"
    | "quiz_answer"
    | "quiz_complete"
    | "quiz_lang";

const PID = /^[A-Za-z0-9_-]{1,24}$/;
const SESSION = /^\d{1,3}$/;
/** how long a retry waits after the network or the backend failed, ms */
const RETRY_MS = 10_000;
/** what waits for a backend that does not answer, at most */
const MAX_QUEUE = 500;
/** events per request: well under the backend's limit, and small enough to go as the page closes */
const BATCH_EVENTS = 50;

let backend = "";
let ids: StudyIds | null = null;
let queue: Record<string, unknown>[] = [];
let timer: number | undefined;
let seq = 0;
/** the backend has no quiz log (404/405): nothing more is sent */
let unsupported = false;
let listening = false;

/**
 * The participant and session, as unilens-lib reads them: the address first
 * (?pid=P03&session=1), else what that library remembered in this browser.
 * Read-only — unilens-lib owns the stored value and the facilitator's reset.
 */
/**
 * Same merge as unilens-lib's readStudyIds, but read-only (that library owns
 * persistence into unilens-study). Used when the quiz runs without UniLens.init().
 */
export function readStudyIds(
    href: string,
    stored: string | null,
): StudyIds | null {
    let kept: Partial<StudyIds> = {};
    try {
        const parsed = JSON.parse(stored ?? "{}");
        if (parsed && typeof parsed === "object") kept = parsed;
    } catch {
        kept = {};
    }
    let params: URLSearchParams;
    try {
        params = new URL(href).searchParams;
    } catch {
        params = new URLSearchParams();
    }
    const urlPid = params.get("pid")?.trim();
    const urlSession = params.get("session")?.trim();
    const next: Partial<StudyIds> = { ...kept };
    if (urlPid && PID.test(urlPid)) next.pid = urlPid;
    if (urlSession && SESSION.test(urlSession)) next.session = urlSession;
    if (!next.pid || !PID.test(next.pid)) return null;
    return {
        pid: next.pid,
        session:
            next.session && SESSION.test(next.session) ? next.session : "1",
    };
}

/** The log endpoint, with the participant and session when there are some. */
export function quizLogUrl(base: string, study: StudyIds | null): string {
    const root = base.replace(/\/+$/, "");
    if (!study) return `${root}/api/quiz/log`;
    return `${root}/api/quiz/log?pid=${encodeURIComponent(study.pid)}&session=${encodeURIComponent(study.session)}`;
}

/** The page as the log keeps it: its path only (a query can carry an email or a token). */
export function pagePath(href: string): string {
    try {
        return new URL(href).pathname;
    } catch {
        return "";
    }
}

/** unilens-study JSON; only when UniLens is not on the page (§2: that key is owned by unilens-lib). */
function storedStudyIdsJson(): string | null {
    try {
        return window.localStorage.getItem(STUDY_IDS_KEY);
    } catch {
        return null;
    }
}

/** Prefer UniLens.init()'s ids; else the same merge as studyLog without writing storage. */
function resolveStudyIds(): StudyIds | null {
    const fromUniLens = (
        window as unknown as {
            UniLens?: { studyIds?: () => StudyIds | null };
        }
    ).UniLens?.studyIds?.();
    if (fromUniLens) return fromUniLens;
    return readStudyIds(location.href, storedStudyIdsJson());
}

/** Start logging to `backendUrl` (empty: no logging). */
export function initQuizLog(backendUrl: string | undefined) {
    backend = (backendUrl ?? "").trim();
    unsupported = false;
    if (!backend) return;
    ids = resolveStudyIds();
    if (!listening) {
        listening = true;
        window.addEventListener("pagehide", flushQuizLog);
    }
}

export function stopQuizLog() {
    flushQuizLog();
    window.removeEventListener("pagehide", flushQuizLog);
    listening = false;
    backend = "";
}

/** One event, stamped with the time, a sequence number and the page. */
export function logQuizEvent(
    type: QuizEventType,
    fields: Record<string, unknown>,
) {
    if (!backend || unsupported) return;
    queue.push({
        t: new Date().toISOString(),
        seq: ++seq,
        type,
        page: pagePath(location.href),
        ...fields,
    });
    if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE);
    window.clearTimeout(timer);
    // answers are rare: send on the next tick, so events from one click go together
    timer = window.setTimeout(flushQuizLog, 0);
}

/**
 * Send what is waiting. Plain text, so no CORS preflight, and keepalive, so it
 * also goes as the page closes. A batch that failed on the network or a 5xx/429
 * goes back to the front of the queue; one the backend refused (400) is dropped.
 */
export function flushQuizLog() {
    window.clearTimeout(timer);
    if (!backend || unsupported || !queue.length) return;
    ids = resolveStudyIds();
    const url = quizLogUrl(backend, ids);
    while (queue.length) {
        const batch = queue.splice(0, BATCH_EVENTS);
        const retry = () => {
            queue = [...batch, ...queue].slice(-MAX_QUEUE);
            window.clearTimeout(timer);
            timer = window.setTimeout(flushQuizLog, RETRY_MS);
        };
        try {
            void fetch(url, {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({ events: batch }),
                keepalive: true,
            })
                .then((r) => {
                    if (r.status === 404 || r.status === 405) {
                        if (!unsupported)
                            console.warn(
                                "[UniLens Quiz] this backend keeps no quiz log",
                            );
                        unsupported = true;
                        queue = [];
                    } else if (r.status >= 500 || r.status === 429) retry();
                })
                .catch(retry);
        } catch {
            retry();
        }
    }
}
