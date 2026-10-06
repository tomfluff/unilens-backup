/**
 * The study's interaction log (co-design study 1, Yotam 2026-10-07): with a
 * participant id in the page address (?pid=P03&session=1, remembered by the browser
 * like the preset), every request to the backend carries them, and the widget's
 * events go to the backend, which appends them to one log per participant and
 * session (backend/study-logs/<pid>/session-<n>.jsonl). Without a pid nothing is
 * logged. Nothing about it is shown to the participant; the facilitator's reset
 * (Ctrl+Alt+Shift+R) forgets it.
 *
 * Events carry what the analysis needs and nothing that identifies the participant
 * beyond the pid: no address of theirs, no browser name.
 */

export interface StudyIds {
    pid: string;
    session: string;
}

/** localStorage: the participant and session this browser logs for */
const KEY = "unilens-study";
const PID = /^[A-Za-z0-9_-]{1,24}$/;
const SESSION = /^\d{1,3}$/;
/** how long events wait to go out together, ms */
const BATCH_MS = 1500;
const MAX_TEXT = 4000;

let ids: StudyIds | null = null;
let backend = "";
let queue: Record<string, unknown>[] = [];
let timer: number | undefined;
let seq = 0;
/** the backend has no study log: events are not sent again */
let unsupported = false;

function local(): Storage | null {
    try {
        return localStorage;
    } catch {
        return null;
    }
}

/**
 * The participant and session for this page load: the address (pid and session,
 * each alone too), else what this browser remembers. A valid address value is
 * remembered; an invalid one is ignored.
 */
export function readStudyIds(
    href: string,
    store: Storage | null = local(),
): StudyIds | null {
    let kept: Partial<StudyIds> = {};
    try {
        kept = JSON.parse(store?.getItem(KEY) ?? "{}") ?? {};
    } catch {
        kept = {};
    }
    let params: URLSearchParams;
    try {
        params = new URL(href).searchParams;
    } catch {
        params = new URLSearchParams();
    }
    const pid = params.get("pid")?.trim();
    const session = params.get("session")?.trim();
    const next: Partial<StudyIds> = { ...kept };
    if (pid && PID.test(pid)) next.pid = pid;
    else if (pid)
        console.warn("[UniLens] pid ignored: letters, digits, - and _");
    if (session && SESSION.test(session)) next.session = session;
    else if (session) console.warn("[UniLens] session ignored: a number");
    if (pid || session) {
        try {
            store?.setItem(KEY, JSON.stringify(next));
        } catch {
            // storage blocked: the ids hold for this page only
        }
    }
    if (!next.pid || !PID.test(next.pid)) return null;
    return {
        pid: next.pid,
        session:
            next.session && SESSION.test(next.session) ? next.session : "1",
    };
}

/** start logging for this page load, if the address or the browser names a pid */
export function initStudyLog(backendUrl: string): StudyIds | null {
    backend = backendUrl;
    ids = readStudyIds(location.href);
    if (!ids) return null;
    window.addEventListener("pagehide", () => flush());
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") flush();
    });
    return ids;
}

export const studyIds = (): StudyIds | null => ids;

/** a backend address with the participant and session, when there are some */
export function studyUrl(url: string): string {
    if (!ids) return url;
    try {
        const u = new URL(url, location.href);
        u.searchParams.set("pid", ids.pid);
        u.searchParams.set("session", ids.session);
        return u.href;
    } catch {
        return url;
    }
}

/**
 * The page as the log keeps it: its path, a site search's words (q), and a section
 * anchor. Any other query or fragment is dropped: an address can carry an email or
 * a token, and the study's own parameters are in every event already.
 */
export function pageAddress(href = location.href): string {
    try {
        const u = new URL(href);
        const q = u.searchParams.get("q");
        const anchor = /^#[\w-]{1,60}$/.test(u.hash) ? u.hash : "";
        return `${u.pathname}${q != null ? `?q=${encodeURIComponent(q)}` : ""}${anchor}`;
    } catch {
        return "";
    }
}

const clip = (v: unknown): unknown =>
    typeof v === "string" && v.length > MAX_TEXT
        ? `${v.slice(0, MAX_TEXT)}…`
        : v;

/** one event: its type and fields, stamped with the time and the page */
export function logEvent(type: string, fields: Record<string, unknown> = {}) {
    if (!ids) return;
    const ev: Record<string, unknown> = {
        t: new Date().toISOString(),
        seq: ++seq,
        type,
        page: pageAddress(),
    };
    for (const [k, v] of Object.entries(fields)) ev[k] = clip(v);
    queue.push(ev);
    window.clearTimeout(timer);
    timer = window.setTimeout(flush, BATCH_MS);
}

/** events per request, and characters: a page closing may send 64 KB in all */
const BATCH_EVENTS = 50;
const BATCH_CHARS = 30_000;
/** what waits for a backend that does not answer, at most */
const MAX_QUEUE = 2000;

/**
 * Send what is waiting, in batches small enough to go as the page closes; plain
 * text, so no preflight. A batch that fails goes back to the front of the queue for
 * the next try when the network or the backend failed (a batch it refused, 400,
 * is not sent again; a backend without the log, 404, gets nothing more).
 */
export function flush() {
    window.clearTimeout(timer);
    if (!ids || !queue.length || unsupported) return;
    const url = studyUrl(`${backend}/api/study/log`);
    while (queue.length) {
        const batch: Record<string, unknown>[] = [];
        let chars = 0;
        while (queue.length && batch.length < BATCH_EVENTS) {
            const size = JSON.stringify(queue[0]).length;
            if (batch.length && chars + size > BATCH_CHARS) break;
            chars += size;
            batch.push(queue.shift() as Record<string, unknown>);
        }
        const retry = () => {
            queue = [...batch, ...queue].slice(-MAX_QUEUE);
            window.clearTimeout(timer);
            timer = window.setTimeout(flush, 10_000);
        };
        void fetch(url, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({ events: batch }),
            keepalive: true,
        })
            .then((r) => {
                // a backend without the log (404, an older one): nothing more is sent
                if (r.status === 404 || r.status === 405) {
                    if (!unsupported)
                        console.warn(
                            "[UniLens] this backend keeps no study log",
                        );
                    unsupported = true;
                    queue = [];
                } else if (r.status >= 500 || r.status === 429) retry();
            })
            .catch(retry);
    }
}

/** the facilitator's reset: this browser logs for nobody until a new pid comes */
export function forgetStudyIds() {
    flush();
    ids = null;
    try {
        local()?.removeItem(KEY);
    } catch {
        // storage blocked: nothing kept to forget
    }
}

/** a short description of a page element, for a click: its tag, role and words */
export function describeElement(el: Element | null | undefined) {
    if (!el) return null;
    const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
    return {
        tag: el.tagName.toLowerCase(),
        id: el.id || undefined,
        role: el.getAttribute("role") ?? undefined,
        text: text.length > 120 ? `${text.slice(0, 120)}…` : text,
    };
}
