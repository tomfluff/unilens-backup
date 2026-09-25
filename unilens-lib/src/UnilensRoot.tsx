/**
 * @file Contains UnilensRoot implementation, a react component that is rendered
 * into the container and contains the entire Unilens app state: the one chat, and
 * the captures that open it or move it to a new place.
 */

import { useEffect, useMemo, useState } from "react";
import ChatPopover from "./ChatPopover";
import {
    type CaptureResult,
    capture,
    tagLastCapture,
    viewMovedSince,
} from "./capture";
import { chatText } from "./chatI18n";
import { clickFeedback } from "./clickFx";
import {
    type ClickOrDragBoxEvent,
    type ClickOrDragTriggers,
    useClickOrDragBox,
} from "./clickHandlers";
import { initDebug } from "./DebugPanel";
import { earcon } from "./earcons";
import { announce, clearHighlights, setCurrentCapture } from "./highlight";
import { initHint } from "./hint";
import { aliasPlace, recordPlace } from "./places";
import { recordCapture } from "./sentLog";
import { getSettings, updateSetting } from "./settings";
import type { UnilensClient } from "./UnilensClient";
import { clientToContent, isOwnUI } from "./zoom";

//------------------------------------------------------------------------------
// Types
//------------------------------------------------------------------------------

type ChatProps = Parameters<typeof ChatPopover>[0];

/** the chat as last rendered; a new key means a new chat, not the open one updated */
type Chat = { key: number; props: ChatProps };

type Region = { x: number; y: number; w: number; h: number };

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

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

//------------------------------------------------------------------------------
// UnilensRoot implementation
//------------------------------------------------------------------------------

export function UnilensRoot({
    unilens,
    container,
}: {
    unilens: UnilensClient;
    container: HTMLDivElement;
}) {
    const [chat, setChat] = useState<Chat | null>(null);

    // Alt+click and Alt+drag on the page; never on UniLens's own chrome
    const triggers = useMemo<ClickOrDragTriggers>(() => {
        const trigger = unilens.getOption("trigger");
        return {
            click: (e) => !isOwnUI(e.target) && trigger(e),
            drag: (e) =>
                getSettings().regionSelect && trigger(e) && !isOwnUI(e.target),
        };
    }, [unilens]);
    const clickActionEmitter = useClickOrDragBox(document, triggers);

    // Runs once: `unilens` and the emitter never change, and the init calls below
    // must not run twice
    useEffect(() => {
        const backend = unilens.getBackend();

        /** what the open chat was last rendered with, so a new click can update it in place */
        let current: Chat | null = null;
        /** bumped for each new chat, so React makes a fresh one instead of updating */
        let chats = 0;
        /** the element the open chat's question was asked about, for view refreshes */
        let askedAbout: Element | undefined;
        /** the capture the open chat is on, and what it was asked about: where a failed
         *  capture goes back to (nothing, once the chat is closed) */
        let committed: { capture: string | null; asked: Element | undefined } =
            {
                capture: null,
                asked: undefined,
            };
        /** bumped by every new capture: one still running when a newer one starts is
         *  dropped */
        let latestCapture = 0;
        /** bumped whenever the chat's capture is retired (new capture, close): a refresh
         *  that finishes after that belongs to a conversation that is gone */
        let generation = 0;

        /** the session the chat's latest upload joined or started, while continuity
         *  keeps one */
        const joinSession = (sessionId: string | null) =>
            unilens.setSessionId(getSettings().continuity ? sessionId : null);

        const paint = (next: Chat | null) => {
            current = next;
            setChat(next);
        };
        /** re-render the open chat with some props changed */
        const repaint = (patch: Partial<ChatProps>) => {
            if (current)
                paint({ ...current, props: { ...current.props, ...patch } });
        };

        function closeChat() {
            generation++;
            paint(null);
        }

        /**
         * ✕ pressed: the chat hides and keeps its conversation, session included; the
         * next click shows it again there. (With continuity off, that click opens a
         * fresh chat instead, as every click does.)
         */
        function hideChat() {
            // a late answer from the hidden chat must not draw on the page. Here, not in
            // closeChat: a new chat opening calls that too, after its capture's id is set
            setCurrentCapture(null);
            committed = { capture: null, asked: undefined };
            // a capture still running was for this chat: it must not show it again
            latestCapture++;
            // a view refresh still running belongs to what was on screen before
            generation++;
            repaint({ hidden: true, capturing: false });
        }

        /**
         * Before a follow-up: if the user scrolled, panned or zoomed since `prev`, capture
         * the new view (same question point) into the session so the model sees what they
         * see now. Null when the view has not moved, the knob is off, or the upload fails
         * (the chat then carries on with the capture it has).
         */
        async function refreshCapture(
            prev: CaptureResult,
            prevId: string,
            onStart?: () => void,
        ): Promise<{ id: string; cap: CaptureResult } | null> {
            // the conversation lives in the session; without one (continuity off) a new
            // capture would start with an empty history, so the chat stays on the capture
            // it has
            if (
                !unilens.getSessionId() ||
                !getSettings().refreshView ||
                !viewMovedSince(prev.meta)
            )
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
                const up = await unilens.api().uploadCapture(cap);
                // never let a slow refresh take the guard (or the session) from a capture
                // opened since, or bring back a closed chat's session
                if (gen !== generation) return null;
                joinSession(up.sessionId);
                const id = up.id;
                tagLastCapture(id);
                recordCapture(id, cap, true);
                setCurrentCapture(id);
                committed = { ...committed, capture: id };
                // same question point as the capture it refreshes: the same place, not a
                // new one
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

        function openChat(
            clientX: number,
            clientY: number,
            captureId: string,
            cap: CaptureResult,
        ) {
            // one conversation, one chat: with continuity on, a new click updates the open
            // chat (it glides to the click and keeps its history and chips) instead of
            // replacing it
            const keep = current != null && getSettings().continuity;
            if (!keep) {
                closeChat();
                chats++;
                // last in the document, as a newly made chat was: on a z-index tie with
                // UniLens's other panels, the chat is on top
                document.documentElement.appendChild(container);
            }
            paint({
                key: chats,
                props: {
                    x: clientX,
                    y: clientY,
                    captureId,
                    capture: cap,
                    backend,
                    sessionId: getSettings().continuity
                        ? unilens.getSessionId()
                        : null,
                    onClose: hideChat,
                    refreshCapture,
                    initialPos: pinnedPos(),
                    pinned: pinnedPos() != null,
                    onTogglePin: (pos) => {
                        setPinnedPos(pos);
                        // re-render so the pin button reflects state
                        repaint({ pinned: pos != null, initialPos: pos });
                    },
                    onMove: (pos) => {
                        if (pinnedPos()) setPinnedPos(pos);
                    },
                },
            });
        }

        async function doCapture(
            clientX: number,
            clientY: number,
            pointX: number,
            pointY: number,
            el?: Element,
            region?: Region,
            /** the dragged region on screen, for feedback that frames it */
            regionBox?: DOMRectReadOnly,
        ) {
            // (pointX, pointY) is the client point being asked about — the click, or the
            // centre of a drag. clientToContent handles both pan engines.
            const p = clientToContent(pointX, pointY);
            // a new capture retires the previous outline and its ids. Retire the id first:
            // while this capture renders and uploads, a late answer for the old one must
            // already be stale, or it could redraw after the clear (Codex review, P1)
            generation++;
            const mine = ++latestCapture;
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
            // (a hidden chat says nothing until the capture shows it)
            if (current && !current.props.hidden && getSettings().continuity) {
                repaint({ capturing: true });
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
                cap = await capture(
                    Math.round(p.x),
                    Math.round(p.y),
                    el,
                    region,
                );
            } catch (err) {
                // html2canvas fails on some pages (unsupported CSS): say so, and let the
                // open chat drop its "Capturing…" row (a waiting question then goes to the
                // place it has)
                endFx();
                console.warn("[UniLens] capture failed:", err);
                // a newer click is being captured: the chat and the guard are its to set
                if (mine !== latestCapture) return;
                // the open chat carries on with its capture: its answers may draw again,
                // and a view refresh re-captures what it was asked about
                setCurrentCapture(committed.capture);
                askedAbout = committed.asked;
                if (current?.props.capturing) repaint({ capturing: false });
                earcon("error");
                announce(chatText().sCaptureFailed);
                return;
            }
            // a newer click is being captured: this one is dropped, and the chat waits
            // for it
            if (mine !== latestCapture) return endFx();
            let up: { id: string; sessionId: string | null } | null = null;
            try {
                up = await unilens.api().uploadCapture(cap);
            } catch (err) {
                console.warn(
                    "[UniLens] backend unreachable, chat will fail:",
                    err,
                );
            }
            // dropped here too when a newer click, or a close, came during the upload
            if (mine !== latestCapture) return endFx();
            const id = up?.id ?? "local";
            if (up) {
                joinSession(up.sessionId);
                tagLastCapture(id);
            }
            // the id exists only now, after upload: this is where the guard learns it
            setCurrentCapture(id);
            committed = { capture: id, asked: el };
            recordPlace({
                captureId: id,
                at: Date.now(),
                x: cap.meta.clickX,
                y: cap.meta.clickY,
                el,
                label: placeLabel(cap),
            });
            recordCapture(id, cap);
            // a view refresh that started while this capture ran belongs to the place
            // before it: retire it, or it would pull the chat back there
            generation++;
            openChat(clientX, clientY, id, cap);
            // the ending may fly into the chat, to the new place entry: where it will be
            // once the chat has glided to the click and its log has scrolled to the entry
            endFx(() => {
                const chat = container.querySelector<HTMLElement>(".ul-chat");
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

        // Subscribe capture to the click-or-drag-box emitter
        const sub = clickActionEmitter.subscribe((ev: ClickOrDragBoxEvent) => {
            if (ev.type === "click") {
                void doCapture(ev.x, ev.y, ev.x, ev.y, ev.target);
                return;
            }
            // a drag asks about its centre, and the chat opens where it was released
            const a = clientToContent(ev.x, ev.y);
            const b = clientToContent(ev.x + ev.width, ev.y + ev.height);
            const region = {
                x: Math.min(a.x, b.x),
                y: Math.min(a.y, b.y),
                w: Math.abs(b.x - a.x),
                h: Math.abs(b.y - a.y),
            };
            const centerX = ev.x + ev.width / 2;
            const centerY = ev.y + ev.height / 2;
            void doCapture(
                ev.endX,
                ev.endY,
                centerX,
                centerY,
                document.elementFromPoint(centerX, centerY) ?? undefined,
                region,
                new DOMRect(ev.x, ev.y, ev.width, ev.height),
            );
        });

        initDebug({
            sessionId: () => unilens.getSessionId(),
            popoverOpen: () => current != null && !current.props.hidden,
            backend: () => backend,
        });

        // Proactive dwell hint — clicking the chip is the zero-shortcut capture path
        initHint((clientX, clientY) => {
            const el = document.elementFromPoint(clientX, clientY) ?? undefined;
            void doCapture(clientX, clientY, clientX, clientY, el);
        });

        return sub.unsubscribe;
    }, [unilens, container, clickActionEmitter]);

    return chat && <ChatPopover key={chat.key} {...chat.props} />;
}
