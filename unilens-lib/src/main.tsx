/**
 * UniLens embeddable entry.
 *
 * Embed build (dist/unilens.js) exposes window.UniLens:
 *   <script src="unilens.js"></script>
 *   <script>UniLens.init({ backend: 'http://127.0.0.1:5000' })</script>
 *
 * Options:
 *   trigger      MouseEvent → bool. Default: alt+click.
 *   mouseWindow  Seconds of trace history. Default: 2.5.
 *   backend      Flask base URL. Default: '' (same origin).
 */
import { createRoot, type Root } from "react-dom/client";
import ChatPopover from "./ChatPopover";
import {
    type CaptureResult,
    capture,
    startTrace,
    tagLastCapture,
    viewMovedSince,
} from "./capture";
import { chatText } from "./chatI18n";
import { clickFeedback } from "./clickFx";
import { initDebug } from "./DebugPanel";
import { earcon } from "./earcons";
import {
    announce,
    clearHighlights,
    init as initHighlight,
    setCurrentCapture,
} from "./highlight";
import { initHint } from "./hint";
import { initMinimap } from "./minimap";
import { aliasPlace, recordPlace } from "./places";
import { initSettings } from "./SettingsPanel";
import { recordCapture } from "./sentLog";
import { getSettings, updateSetting } from "./settings";
import { setSpeechBackend } from "./speech";
import { clientToContent, initZoom, isOwnUI } from "./zoom";

/** build stamp injected by esbuild --define (see the lib Makefile); absent in dev */
declare const __target_dist_unilens_BUILD__: string;

export interface InitOptions {
    trigger?: (e: MouseEvent) => boolean;
    mouseWindow?: number;
    backend?: string;
    /** ctrl+wheel pinch-style page zoom. Default: true. */
    zoom?: boolean;
}

let root: Root | null = null;
let container: HTMLDivElement | null = null;
/** what the open chat was last rendered with, so a new click can update it in place */
let popProps: Parameters<typeof ChatPopover>[0] | null = null;
const paintPopover = () =>
    popProps && root?.render(<ChatPopover {...popProps} />);

/**
 * Popover pinned position, persisted in the settings store. Guarded on read:
 * hydrated storage is not trusted to hold finite coordinates.
 */
function pinnedPos(): { left: number; top: number } | null {
    const p = getSettings().pinnedPos;
    return p && Number.isFinite(p.left) && Number.isFinite(p.top) ? p : null;
}

function setPinnedPos(pos: { left: number; top: number } | null) {
    updateSetting("pinnedPos", pos);
}

function closePopover() {
    generation++;
    root?.unmount();
    root = null;
    popProps = null;
    container?.remove();
    container = null;
}

/** ✕ pressed: dismissing the popover also ends the conversation session */
function dismissPopover() {
    sessionId = null;
    closePopover();
}

/** a short name for where the user clicked, for "where I clicked" buttons and speech */
function placeLabel(cap: CaptureResult): string {
    const T = chatText();
    const e = cap.meta.element;
    if (cap.meta.region) return T.placeRegion;
    if (!e) return T.placeClick;
    const text = (e.text ?? e.alt ?? "").trim();
    // a short text names the thing itself; a long one is a whole section, whose
    // heading names it better
    if (text && text.length <= 40) return text;
    if (e.nearestHeading) return T.placeNear(e.nearestHeading);
    return text ? `${text.slice(0, 40)}…` : T.placeTag(e.tag);
}

/** the element the open popover's question was asked about, for view refreshes */
let askedAbout: Element | undefined;
/** bumped whenever the popover's capture is retired (new capture, close): a refresh
 *  that finishes after that belongs to a conversation that is gone */
let generation = 0;

/**
 * Before a follow-up: if the user scrolled, panned or zoomed since `prev`, capture the
 * new view (same question point) into the session so the model sees what they see now.
 * Null when the view has not moved, the knob is off, or the upload fails (the chat
 * then carries on with the capture it has).
 */
async function refreshCapture(
    prev: CaptureResult,
    prevId: string,
    backend: string,
    onStart?: () => void,
): Promise<{ id: string; cap: CaptureResult } | null> {
    // the conversation lives in the session; without one (continuity off) a new capture
    // would start with an empty history, so the chat stays on the capture it has
    if (!sessionId || !getSettings().refreshView || !viewMovedSince(prev.meta))
        return null;
    onStart?.();
    const gen = generation;
    try {
        const cap = await capture(
            prev.meta.clickX,
            prev.meta.clickY,
            askedAbout?.isConnected ? askedAbout : undefined,
            undefined,
            { viewRefresh: true },
        );
        if (gen !== generation) return null;
        const id = await uploadCapture(cap, backend);
        // never let a slow refresh take the guard from a capture opened since
        if (gen !== generation) return null;
        tagLastCapture(id);
        recordCapture(id, cap, true);
        setCurrentCapture(id);
        // same question point as the capture it refreshes: the same place, not a new one
        aliasPlace(id, prevId);
        return { id, cap };
    } catch (err) {
        console.warn(
            "[UniLens] view refresh failed, using the last capture:",
            err,
        );
        return null;
    }
}

function openPopover(
    clientX: number,
    clientY: number,
    captureId: string,
    cap: CaptureResult,
    backend: string,
) {
    // one conversation, one chat: with continuity on, a new click updates the open chat
    // (it glides to the click and keeps its history and chips) instead of replacing it
    const keep = root != null && getSettings().continuity;
    if (!keep) {
        closePopover();
        container = document.createElement("div");
        container.id = "unilens-root";
        // documentElement, not body: body carries the zoom transform, which would
        // break position:fixed and scale the popover. Also keeps it out of captures.
        document.documentElement.appendChild(container);
        root = createRoot(container);
    }
    popProps = {
        x: clientX,
        y: clientY,
        captureId,
        capture: cap,
        backend,
        sessionId: getSettings().continuity ? sessionId : null,
        onClose: dismissPopover,
        refreshCapture: (prev, prevId, onStart) =>
            refreshCapture(prev, prevId, backend, onStart),
        initialPos: pinnedPos(),
        pinned: pinnedPos() != null,
        onTogglePin: (pos) => {
            setPinnedPos(pos);
            if (popProps)
                popProps = {
                    ...popProps,
                    pinned: pos != null,
                    initialPos: pos,
                };
            paintPopover(); // re-render so the pin button reflects state
        },
        onMove: (pos) => {
            if (pinnedPos()) setPinnedPos(pos);
        },
    };
    paintPopover();
}

/** current conversation session — new captures join it until the user closes the popover */
let sessionId: string | null = null;

async function uploadCapture(
    cap: CaptureResult,
    backend: string,
): Promise<string> {
    const res = await fetch(`${backend}/api/capture`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            image: cap.image,
            viewport: cap.viewportImage,
            meta: cap.meta,
            // beside meta, never inside it: only /api/locate reads it
            inventory: cap.inventory,
            session_id: getSettings().continuity ? sessionId : null,
        }),
    });
    if (!res.ok) throw new Error(`capture upload failed: HTTP ${res.status}`);
    const data = await res.json();
    sessionId = getSettings().continuity ? (data.session_id ?? null) : null;
    return data.id;
}

export function init(options: InitOptions = {}) {
    const trigger = options.trigger ?? ((e: MouseEvent) => e.altKey);
    const backend = options.backend ?? "";

    startTrace(options.mouseWindow ?? 2.5);
    if (options.zoom ?? true) initZoom();
    initMinimap();
    initHighlight();
    initSettings();
    setSpeechBackend(backend);

    async function doCapture(
        clientX: number,
        clientY: number,
        pointX: number,
        pointY: number,
        el?: Element,
        region?: { x: number; y: number; w: number; h: number },
        /** the dragged region on screen, for feedback that frames it */
        regionBox?: DOMRectReadOnly,
    ) {
        // (pointX, pointY) is the client point being asked about — the click, or the centre
        // of a drag. clientToContent handles both pan engines.
        const p = clientToContent(pointX, pointY);
        // a new capture retires the previous outline and its ids. Retire the id first:
        // while this capture renders and uploads, a late answer for the old one must
        // already be stale, or it could redraw after the clear (Codex review, P1)
        generation++;
        setCurrentCapture(null);
        clearHighlights();
        askedAbout = el;
        // seen at once: a ripple where the click landed, then a breathing orb there
        // until the chat has the capture
        const endFx = clickFeedback(
            pointX,
            pointY,
            regionBox ?? el?.getBoundingClientRect(),
        );
        // the capture takes a moment: say so now, in the open chat or out loud
        if (popProps && getSettings().continuity) {
            popProps = { ...popProps, capturing: true };
            paintPopover();
        } else {
            earcon("send");
            announce(chatText().sCapturing);
        }
        let cap: CaptureResult;
        try {
            // let the ripple and ring paint first: the capture holds the main thread,
            // and their animations then run on the compositor while it works
            await new Promise((r) =>
                requestAnimationFrame(() => requestAnimationFrame(r)),
            );
            cap = await capture(Math.round(p.x), Math.round(p.y), el, region);
        } catch (err) {
            endFx();
            throw err;
        }
        let id = "local";
        try {
            id = await uploadCapture(cap, backend);
            tagLastCapture(id);
        } catch (err) {
            console.warn("[UniLens] backend unreachable, chat will fail:", err);
        }
        // the id exists only now, after upload: this is where the guard learns it
        setCurrentCapture(id);
        recordPlace({
            captureId: id,
            at: Date.now(),
            x: cap.meta.clickX,
            y: cap.meta.clickY,
            el,
            label: placeLabel(cap),
        });
        recordCapture(id, cap);
        openPopover(clientX, clientY, id, cap, backend);
        // the ending may fly into the chat, to the new place entry: where it will be once
        // the chat has glided to the click and its log has scrolled to the entry
        endFx(() => {
            const chat = document.querySelector<HTMLElement>(
                "#unilens-root .ul-chat",
            );
            const log = chat?.querySelector(".ulc-log");
            const entry = [
                ...(log?.querySelectorAll(".ulc-where") ?? []),
            ].pop();
            if (!chat || !log || !entry) return null;
            const r = entry.getBoundingClientRect();
            const c = chat.getBoundingClientRect();
            const glideX = Number.parseFloat(chat.style.left) - c.left || 0;
            const glideY = Number.parseFloat(chat.style.top) - c.top || 0;
            const scroll =
                Math.max(0, log.scrollHeight - log.clientHeight) -
                log.scrollTop;
            return new DOMRect(
                r.left + glideX,
                r.top + glideY - scroll,
                r.width,
                r.height,
            );
        });
    }

    // ── Alt+drag region select ───────────────────────────────────────────────
    const dragBoxBaseStyles = {
        position: "fixed" as const,
        border: "2px solid rgba(255,0,200,0.9)",
        background: "rgba(255,0,200,0.08)",
        pointerEvents: "none" as const,
        zIndex: "2147483646",
    };

    let dragStart: { clientX: number; clientY: number } | null = null;
    let dragBox: HTMLDivElement | null = null;
    let suppressClick = false;

    function removeDragBox() {
        dragBox?.remove();
        dragBox = null;
    }

    function cancelDrag() {
        dragStart = null;
        suppressClick = false;
        removeDragBox();
    }

    document.addEventListener("mousedown", (e) => {
        // stale state must never survive into a new interaction: if the click that
        // was supposed to consume suppressClick never fired, or a drag never saw
        // its mouseup (released over browser chrome), clear both here
        cancelDrag();
        if (!getSettings().regionSelect || !trigger(e)) return;
        if (isOwnUI(e.target)) return;
        dragStart = { clientX: e.clientX, clientY: e.clientY };
        e.preventDefault(); // no text selection while dragging
    });

    // pointer released outside the window: no mouseup/click ever arrives, so
    // abandon the drag instead of leaving the rubber band and flags stuck
    window.addEventListener("blur", cancelDrag);

    document.addEventListener("mousemove", (e) => {
        if (!dragStart) return;
        // button already released but we never saw the mouseup (happened over
        // browser chrome / outside the page): the drag is over, abandon it
        if (e.buttons === 0) {
            cancelDrag();
            return;
        }
        const w = Math.abs(e.clientX - dragStart.clientX);
        const h = Math.abs(e.clientY - dragStart.clientY);
        if (!dragBox && (w > 6 || h > 6)) {
            dragBox = document.createElement("div");
            Object.assign(dragBox.style, dragBoxBaseStyles);
            document.documentElement.appendChild(dragBox);
        }
        if (dragBox) {
            Object.assign(dragBox.style, {
                left: `${Math.min(e.clientX, dragStart.clientX)}px`,
                top: `${Math.min(e.clientY, dragStart.clientY)}px`,
                width: `${w}px`,
                height: `${h}px`,
            });
        }
    });

    document.addEventListener("mouseup", (e) => {
        if (!dragStart) return;
        const start = dragStart;
        dragStart = null;
        removeDragBox();
        const dist = Math.max(
            Math.abs(e.clientX - start.clientX),
            Math.abs(e.clientY - start.clientY),
        );
        if (dist < 10) return; // plain alt+click — let the click handler run

        suppressClick = true; // the click event that follows belongs to this drag
        // the browser dispatches that click immediately after mouseup; if it never
        // comes (mixed targets, keyboard click next), expire the flag so it cannot
        // swallow an unrelated click later
        window.setTimeout(() => {
            suppressClick = false;
        }, 150);
        const a = clientToContent(start.clientX, start.clientY);
        const b = clientToContent(e.clientX, e.clientY);
        const region = {
            x: Math.min(a.x, b.x),
            y: Math.min(a.y, b.y),
            w: Math.abs(b.x - a.x),
            h: Math.abs(b.y - a.y),
        };
        const centerClientX = (start.clientX + e.clientX) / 2;
        const centerClientY = (start.clientY + e.clientY) / 2;
        const el =
            document.elementFromPoint(centerClientX, centerClientY) ??
            undefined;
        doCapture(
            e.clientX,
            e.clientY,
            centerClientX,
            centerClientY,
            el,
            region,
            new DOMRect(
                Math.min(start.clientX, e.clientX),
                Math.min(start.clientY, e.clientY),
                Math.abs(e.clientX - start.clientX),
                Math.abs(e.clientY - start.clientY),
            ),
        );
    });

    initDebug({
        sessionId: () => sessionId,
        popoverOpen: () => container != null,
        backend: () => backend,
    });

    // Proactive dwell hint — clicking the chip is the zero-shortcut capture path
    initHint((clientX, clientY) => {
        const el = document.elementFromPoint(clientX, clientY) ?? undefined;
        doCapture(clientX, clientY, clientX, clientY, el);
    });

    document.addEventListener("click", async (e) => {
        if (suppressClick) {
            suppressClick = false;
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        if (isOwnUI(e.target)) return; // clicks on our own chrome, never a capture
        if (!trigger(e)) return;
        e.preventDefault();
        e.stopPropagation();
        doCapture(
            e.clientX,
            e.clientY,
            e.clientX,
            e.clientY,
            e.target instanceof Element ? e.target : undefined,
        );
    });

    console.log(
        `[UniLens] initialized (build ${typeof __target_dist_unilens_BUILD__ === "string" ? __target_dist_unilens_BUILD__ : "dev"}) — alt+click to capture, alt+drag to select a region`,
    );
}

// Expose for plain <script> embeds
declare global {
    interface Window {
        UniLens: { init: typeof init };
    }
}
window.UniLens = { init };
