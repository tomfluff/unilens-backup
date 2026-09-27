/**
 * Restore after a reload: the conversation the user had on this site comes back.
 *
 * Kept in UniLens's own store, a hidden frame served by the backend (`/store`), not in
 * the site's storage: it is not among the site's own keys (its analytics, its "clear
 * data"), and the browser keeps each site's apart. It does not hide the conversation
 * from the site itself: a script on the page runs as the widget does, so it could ask
 * the frame too (and sees the widget's requests anyway). The site that embeds UniLens
 * is trusted with its own users' conversations; other sites are not.
 * Interaction data only, never screenshots or messages: the session id (its history,
 * on the backend, brings the messages back), the capture the chat was on, the places,
 * and the zoom and view. The page is kept as a hash, not its address.
 */
import { allPlaces, type Place } from "./places";

export interface Snapshot {
    v: 1;
    savedAt: number;
    /** the page (pageKey): places and the view belong to it */
    page: string;
    sessionId: string;
    /** the capture the chat was on */
    captureId: string;
    /** the chat was on screen (not hidden with ✕) */
    open: boolean;
    places: Omit<Place, "el">[];
    /** view refreshes: [capture id, the place's own capture id] */
    aliases: [string, string][];
    view: { scale: number; x: number; y: number };
}

/** a conversation older than this starts fresh */
export const RESTORE_MAX_AGE_MS = 7 * 24 * 3600 * 1000;
const KEY = "snapshot";

/** the page, without its #hash, as a 64-bit hash: its address (and query) is not
 *  kept. ponytail: two FNV-style hashes, enough to tell a site's pages apart */
export function pageKey(): string {
    const url = location.href.split("#")[0];
    let a = 0x811c9dc5;
    let b = 0x9747b28c ^ url.length;
    for (let i = 0; i < url.length; i++) {
        const c = url.charCodeAt(i);
        a = Math.imul(a ^ c, 0x01000193);
        b = Math.imul(b ^ c, 0x5bd1e995);
    }
    const hex = (n: number) => (n >>> 0).toString(16).padStart(8, "0");
    return hex(a) + hex(b);
}

// ── The store: a hidden frame at the backend's origin, spoken to by postMessage ──

let frame: HTMLIFrameElement | null = null;
let frameOrigin = "";
let ready: Promise<boolean> | null = null;
let seq = 0;
const replies = new Map<
    number,
    (m: { ok: boolean; value?: unknown }) => void
>();

/** when the frame last failed to open: it is tried again a minute later */
let failedAt = -Infinity;
/** the store's frame, gone quiet or failing: dropped, and opened again a minute later */
let dropStore = () => {};

/** false when the frame cannot load (a host page's CSP, the backend down): nothing
 *  is kept until it can */
function openStore(backend: string): Promise<boolean> {
    if (ready) return ready;
    if (Date.now() - failedAt < 60_000) return Promise.resolve(false);
    ready = new Promise((resolve) => {
        try {
            frameOrigin = new URL(backend, location.href).origin;
        } catch {
            return resolve(false);
        }
        const f = document.createElement("iframe");
        f.src = `${backend}/store`;
        f.title = "UniLens store";
        f.tabIndex = -1;
        f.setAttribute("aria-hidden", "true");
        f.style.display = "none";
        const onMessage = (e: MessageEvent) => {
            if (e.source !== f.contentWindow || e.origin !== frameOrigin)
                return;
            const m = e.data;
            if (m?.unilensStore !== 1) return;
            if (m.ready) {
                window.clearTimeout(timer);
                resolve(true);
                return;
            }
            replies.get(m.id)?.(m);
            replies.delete(m.id);
        };
        dropStore = () => {
            console.warn(
                "[UniLens] the conversation store is not working; nothing is kept across reloads for now",
            );
            window.clearTimeout(timer);
            window.removeEventListener("message", onMessage);
            f.remove();
            frame = null;
            ready = null;
            failedAt = Date.now();
            dropStore = () => {};
            resolve(false);
        };
        const timer = window.setTimeout(() => dropStore(), 5000);
        window.addEventListener("message", onMessage);
        frame = f;
        document.documentElement.appendChild(f);
    });
    return ready;
}

async function call(
    backend: string,
    op: "get" | "set" | "del",
    value?: unknown,
): Promise<unknown> {
    if (!(await openStore(backend)) || !frame?.contentWindow) return undefined;
    const id = ++seq;
    const win = frame.contentWindow;
    return new Promise((resolve) => {
        // no answer, or its storage failed (blocked, full): tried afresh later
        const timer = window.setTimeout(() => {
            replies.delete(id);
            dropStore();
            resolve(undefined);
        }, 3000);
        replies.set(id, (m) => {
            window.clearTimeout(timer);
            if (!m.ok) dropStore();
            resolve(m.ok ? m.value : undefined);
        });
        win.postMessage(
            { unilensStore: 1, id, op, key: KEY, value },
            frameOrigin,
        );
    });
}

// ── The snapshot ─────────────────────────────────────────────────────────────

/** the saved conversation, if there is one young enough to come back */
export async function loadSnapshot(backend: string): Promise<Snapshot | null> {
    const s = (await call(backend, "get")) as Snapshot | undefined;
    if (
        s?.v !== 1 ||
        typeof s.sessionId !== "string" ||
        typeof s.captureId !== "string" ||
        !Array.isArray(s.places) ||
        !Array.isArray(s.aliases) ||
        !(Date.now() - s.savedAt < RESTORE_MAX_AGE_MS)
    )
        return null;
    return s;
}

let pending: number | undefined;
/** save what `take` returns once things settle (many changes, one write); null leaves
 *  what is kept as it is: a page just loaded has nothing yet, and must not erase it */
export function saveSoon(
    backend: string,
    take: () => Snapshot | null,
    /** the page is going (a reload, a navigation): write it now, not later */
    now = false,
) {
    window.clearTimeout(pending);
    const write = () => {
        const s = take();
        if (s) void call(backend, "set", s);
    };
    if (now) write();
    else pending = window.setTimeout(write, 400);
}

/** the setting was turned off: nothing is kept */
export function forgetSnapshot(backend: string) {
    window.clearTimeout(pending);
    void call(backend, "del");
}

/** the places, as they are saved: no element, which is gone after a reload */
export function savedPlaces(): Pick<Snapshot, "places" | "aliases"> {
    const { order, aliases } = allPlaces();
    return { places: order.map(({ el: _, ...p }) => p), aliases };
}
