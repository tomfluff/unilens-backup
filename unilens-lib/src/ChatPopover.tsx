import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import type { CaptureResult } from "./capture";
import {
    asksToLocate,
    type Cited,
    mdLite,
    type NavCommand,
    navCommand,
    recordEvidence,
    renderCited,
    speakable,
} from "./evidence";
import {
    announce,
    clearHighlights,
    hasHighlight,
    nextToken,
    onHighlightsCleared,
    registerPopoverClose,
    showHighlights,
} from "./highlight";
import { labelOfWire, type WireNode } from "./inventory";
import { goToPlace, latestPlace, type Place, placeOf } from "./places";
import { recordAsk, type SentAsk } from "./sentLog";
import { getSettings, useSettings } from "./settings";
import {
    listen,
    type SpeechState,
    speak,
    stopSpeaking,
    sttSupported,
} from "./speech";
import {
    canReturn,
    directionOf,
    returnToPreviousView,
    revealElement,
} from "./zoom";

interface Msg {
    id: string;
    role: "user" | "assistant";
    text: string;
    /** a system failure (rate limit, backend, network), not an answer: styled apart so a
     *  participant can tell "the model didn't find it" from "something broke" */
    error?: boolean;
    /** the capture a reply's [[id]] citations resolve against. Only replies made in this
     *  popover carry one: history from earlier captures has no live elements to point at */
    cite?: CiteSource;
    /** still streaming: an unfinished marker at the end stays hidden */
    streaming?: boolean;
    /** a question's capture, so its bubble can offer "where I clicked" */
    captureId?: string;
}

/** a capture's inventory (for labels) and its id → live element registry */
interface CiteSource {
    id: string;
    inventory: WireNode[];
    registry: Map<string, Element>;
}

/** which reply's evidence is outlined: all of it, or one item of it */
type Active = { msgId: string; index: number | "all" } | null;

function cited(m: Msg): Cited | null {
    const src = m.cite;
    if (!src || m.role !== "assistant" || m.error) return null;
    return renderCited(
        m.text,
        (id) => src.registry.has(id),
        (id) => labelOfWire(id, src.inventory),
        m.streaming,
    );
}

interface Props {
    x: number; // client coords of the triggering click
    y: number;
    captureId: string;
    capture: CaptureResult;
    backend: string;
    sessionId: string | null;
    onClose: () => void;
    /** pinned position carried over from the previous popover, if the user pinned it */
    initialPos?: { left: number; top: number } | null;
    pinned: boolean;
    onTogglePin: (pos: { left: number; top: number } | null) => void;
    onMove: (pos: { left: number; top: number }) => void;
    /** re-capture if the view moved since `prev`; null when it did not */
    refreshCapture?: (
        prev: CaptureResult,
    ) => Promise<{ id: string; cap: CaptureResult } | null>;
}

const PANEL_W = 340;
const PANEL_H = 420;

// Styled components
const PopoverContainer = styled.div<{
    panelBg: string;
    text: string;
    hc: boolean;
}>`
    position: fixed;
    width: ${PANEL_W}px;
    height: ${PANEL_H}px;
    display: flex;
    flex-direction: column;
    background: ${(props) => props.panelBg};
    color: ${(props) => props.text};
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
    border: ${(props) => (props.hc ? "2px solid #ffd700" : "none")};
    z-index: 2147483647;
    font-family: sans-serif;
    overflow: hidden;
`;

const HeaderContainer = styled.div<{ headerBg: string; headerBorder: string }>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: ${(props) => props.headerBg};
    border-bottom: ${(props) => props.headerBorder};
    cursor: grab;
    touch-action: none;

    &:active {
        cursor: grabbing;
    }
`;

const HeaderTitle = styled.span<{ accent: string }>`
    font-weight: 700;
    color: ${(props) => props.accent};
`;

const HeaderButtonsContainer = styled.span`
    display: flex;
    gap: 4px;
`;

const PinButton = styled.button<{ pinned: boolean; accent: string }>`
    background: ${(props) => (props.pinned ? props.accent : "none")};
    border: none;
    border-radius: 6px;
    color: ${(props) => (props.pinned ? "#08182e" : "#aaa")};
    cursor: pointer;
    font-size: 13px;
    padding: 2px 8px;
    font-weight: 700;
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    color: #aaa;
    cursor: pointer;
    font-size: 16px;
`;

const ScrollContainer = styled.div`
    flex: 1;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 12px;
`;

const MessageBubble = styled.div<{
    isUser: boolean;
    userBg: string;
    aiBg: string;
    bubbleBorder: string;
    isError?: boolean;
}>`
    margin: 6px 0;
    padding: 8px 12px;
    border-radius: 10px;
    max-width: 85%;
    white-space: pre-wrap;
    background: ${(props) => (props.isUser ? props.userBg : props.aiBg)};
    border: ${(props) => props.bubbleBorder};
    border-left: ${(props) => (props.isError ? "4px solid #b42318" : undefined)};
    margin-left: ${(props) => (props.isUser ? "auto" : 0)};

    /* citation chips arrive as HTML, so they are styled here; every property is set
       because host-page button rules reach into the popover */
    & .unilens-cite {
        display: inline-block;
        min-width: 1.6em;
        height: auto;
        margin: 0 0.1em;
        padding: 0 0.35em;
        border: 2px solid #000;
        border-radius: 0.8em;
        background: #ffe600;
        color: #000;
        font: 700 0.85em/1.35 system-ui, sans-serif;
        text-align: center;
        vertical-align: baseline;
        cursor: pointer;
    }
    & .unilens-cite:focus-visible {
        outline: 3px solid #00c8ff;
        outline-offset: 1px;
    }
`;

/** the navigator wraps as one unit, never "‹ 1 of 3" on one line and "›" on the next */
/** under a question: back to the place it was asked about (explicit sizes: host CSS leaks) */
const PlaceButton = styled.button`
    display: block;
    margin: 6px 0 0;
    padding: 2px 8px;
    min-height: 24px;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    border: 1px solid rgba(255, 255, 255, 0.45);
    border-radius: 10px;
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
    text-align: left;
    &:focus-visible {
        outline: 3px solid #00c8ff;
        outline-offset: 1px;
    }
`;

const NavGroup = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
`;

const EvidenceRow = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
`;

const SpeakButton = styled.button<{ speaking: boolean }>`
    background: none;
    border: none;
    cursor: pointer;
    margin-left: 6px;
    opacity: ${(props) => (props.speaking ? 1 : 0.7)};
`;

const QuickActionsContainer = styled.div`
    display: flex;
    gap: 6px;
    padding: 8px 10px 0;
    flex-wrap: wrap;
`;

const QuickActionButton = styled.button<{
    chipBg: string;
    chipBorder: string;
    chipText: string;
    busy: boolean;
}>`
    padding: 4px 10px;
    border-radius: 12px;
    border: ${(props) => props.chipBorder};
    background: ${(props) => props.chipBg};
    color: ${(props) => props.chipText};
    cursor: ${(props) => (props.busy ? "default" : "pointer")};
    opacity: ${(props) => (props.busy ? 0.5 : 1)};
    &[aria-pressed="true"] {
        font-weight: 700;
        outline: 2px solid currentColor;
        outline-offset: 1px;
    }
`;

const InputContainer = styled.div`
    display: flex;
    gap: 8px;
    padding: 10px;
    border-top: 1px solid #333;
`;

const VoiceButton = styled.button<{
    listening: boolean;
    inputBg: string;
    text: string;
}>`
    padding: 8px 10px;
    border-radius: 8px;
    border: none;
    background: ${(props) => (props.listening ? "#e33" : props.inputBg)};
    color: ${(props) => props.text};
    cursor: pointer;
`;

const ChatInput = styled.input<{
    inputBg: string;
    inputBorder: string;
    text: string;
}>`
    flex: 1;
    padding: 8px 12px;
    border-radius: 8px;
    border: ${(props) => props.inputBorder};
    background: ${(props) => props.inputBg};
    color: ${(props) => props.text};
    font-size: inherit;
    outline: none;
`;

const SendButton = styled.button<{ accent: string; hc: boolean }>`
    padding: 8px 14px;
    border-radius: 8px;
    border: none;
    background: ${(props) => props.accent};
    color: ${(props) => (props.hc ? "#000" : "#08182e")};
    font-weight: 700;
    cursor: pointer;
`;

const EmptyHint = styled.p`
    margin: 8px 2px;
    line-height: 1.5;
`;

const LoadingText = styled.div`
    color: #889;
    padding: 8px;
`;

export default function ChatPopover({
    x,
    y,
    captureId,
    capture,
    backend,
    sessionId,
    onClose,
    initialPos,
    pinned,
    onTogglePin,
    onMove,
    refreshCapture,
}: Props) {
    const [messages, setMessages] = useState<Msg[]>([]);
    const [input, setInput] = useState("");
    const [busy, setBusy] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // store subscription: re-renders when settings change, so text size / contrast apply live
    const settings = useSettings();

    const fs = settings.chatFontSize;
    const hc = settings.highContrast;
    // high contrast: pure black surfaces, white text, yellow accents (WCAG-friendly)
    const C = hc
        ? {
              panelBg: "#000",
              headerBg: "#000",
              headerBorder: "2px solid #ffd700",
              accent: "#ffd700",
              text: "#fff",
              dim: "#fff",
              userBubble: "#1a1a1a",
              aiBubble: "#1a1a1a",
              bubbleBorder: "1px solid #ffd700",
              inputBg: "#000",
              inputBorder: "2px solid #ffd700",
              chipBg: "#000",
              chipBorder: "1px solid #ffd700",
              chipText: "#ffd700",
          }
        : {
              panelBg: "#1a1a2e",
              headerBg: "#0f3460",
              headerBorder: "none",
              accent: "#00c8ff",
              text: "#eee",
              dim: "#889",
              userBubble: "#0f3460",
              aiBubble: "#26263e",
              bubbleBorder: "none",
              inputBg: "#26263e",
              inputBorder: "1px solid #444",
              chipBg: "#22224a",
              chipBorder: "1px solid #345",
              chipText: "#9cf",
          };

    const [listening, setListening] = useState(false);
    const stopListenRef = useRef<(() => void) | null>(null);
    /** which message is being spoken and its phase */
    const [speaking, setSpeaking] = useState<{
        idx: number;
        phase: SpeechState;
    } | null>(null);

    function speakMessage(idx: number, text: string) {
        if (speaking?.idx === idx) {
            stopSpeaking();
            return;
        }
        speak(text, (s) =>
            setSpeaking(s === "idle" ? null : { idx, phase: s }),
        );
    }

    // stop any speech/mic when the popover unmounts
    useEffect(
        () => () => {
            stopSpeaking();
            stopListenRef.current?.();
        },
        [],
    );

    function toggleMic() {
        if (listening) {
            stopListenRef.current?.();
            return;
        }
        const stop = listen(
            (transcript) => setInput(transcript),
            () => setListening(false),
        );
        if (stop) {
            stopListenRef.current = stop;
            setListening(true);
        }
    }

    // Continuity: seed the running conversation from the session history
    useEffect(() => {
        if (!sessionId || captureId === "local") return;
        fetch(`${backend}/api/session/${encodeURIComponent(sessionId)}`)
            .then((r) => r.json())
            .then((d) => {
                if (Array.isArray(d.history))
                    setMessages(
                        d.history.map(
                            (
                                h: {
                                    role: string;
                                    text: string;
                                    capture_id?: string;
                                },
                                idx: number,
                            ) => ({
                                id: `hist-${idx}-${Date.now()}`,
                                role: h.role as Msg["role"],
                                text: h.text,
                                captureId: h.capture_id,
                            }),
                        ),
                    );
            })
            .catch(() => {});
    }, [backend, sessionId, captureId]);

    // Clamp popover inside viewport, near the cursor (or restore pinned position)
    const clamp = (p: { left: number; top: number }) => ({
        left: Math.min(Math.max(p.left, 8), window.innerWidth - PANEL_W - 8),
        top: Math.min(Math.max(p.top, 8), window.innerHeight - PANEL_H - 8),
    });
    const [pos, setPos] = useState(() =>
        clamp(initialPos ?? { left: x + 12, top: y + 12 }),
    );
    const dragRef = useRef<{ dx: number; dy: number } | null>(null);

    function onHeaderPointerDown(e: React.PointerEvent) {
        if (!settings.dragPopover) return;
        if ((e.target as HTMLElement).tagName === "BUTTON") return;
        dragRef.current = { dx: e.clientX - pos.left, dy: e.clientY - pos.top };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
    function onHeaderPointerMove(e: React.PointerEvent) {
        if (!dragRef.current) return;
        const p = clamp({
            left: e.clientX - dragRef.current.dx,
            top: e.clientY - dragRef.current.dy,
        });
        setPos(p);
        onMove(p);
    }
    function onHeaderPointerUp() {
        dragRef.current = null;
    }

    // a new bubble (question, reply, error) scrolls into view; streaming deltas do not
    // move the list, so a user reading back up is not yanked down
    // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on the count on purpose
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }, [messages.length]);

    // Escape is owned by highlight.ts (one listener decides per keypress, honouring the
    // escapeOrder setting); the popover only lends it a close callback
    useEffect(() => registerPopoverClose(onClose), [onClose]);

    // The capture the next message goes against: the one this popover opened on, until
    // a follow-up after a scroll/pan/zoom re-captures the new view into the session
    const cur = useRef({ id: captureId, cap: capture });

    // ── evidence: [[id]] citations in replies become chips and an action row ────
    const citeSource = (): CiteSource | undefined => {
        const { id, cap } = cur.current;
        return id !== "local" && cap.inventory?.length && cap.registry
            ? { id, inventory: cap.inventory, registry: cap.registry }
            : undefined;
    };

    const [active, setActive] = useState<Active>(null);
    /** a move to evidence can be undone: the Back button shows */
    const [returnable, setReturnable] = useState(false);
    // Escape (or a new capture) clears the outline: the pressed buttons must follow
    useEffect(() => onHighlightsCleared(() => setActive(null)), []);

    /** outline a reply's evidence (all, or item `index`), on the user's click or command */
    function point(m: Msg, index: number | "all", reveal: boolean) {
        const c = cited(m);
        const src = m.cite;
        if (!c?.ids.length || !src) return;
        const n = c.ids.length;
        const picks =
            index === "all"
                ? c.ids.map((id, i) => ({ id, i }))
                : [{ id: c.ids[index], i: index }];
        const label = (id: string) => labelOfWire(id, src.inventory);
        // status is announced here, after any move, so it can say where the item is
        showHighlights(
            picks.map(({ id, i }) => ({
                id,
                role: "target" as const,
                badge: String(i + 1),
            })),
            src.registry,
            src.id,
            nextToken(),
            { userInitiated: true },
        );
        const el = src.registry.get(picks[0].id);
        const where = el ? directionOf(el) : "";
        // the moveToEvidence setting decides whether choosing an item moves the page;
        // "never" leaves finding it to the off-screen cues and the minimap
        const move = getSettings().moveToEvidence;
        const moved =
            reveal && move !== "never" && el
                ? revealElement(el, undefined, {
                      always: move === "always",
                  }) === "moved"
                : false;
        setReturnable(canReturn());
        if (hasHighlight())
            announce(
                index === "all" && n > 1
                    ? `${n} sources: ${c.ids.map(label).join(", ")}.`
                    : `Source ${n > 1 ? `${picks[0].i + 1} of ${n}` : ""}, ${label(picks[0].id)}` +
                          (moved
                              ? ". Brought into view; say back to return."
                              : where && where !== "on screen"
                                ? `, ${where}.`
                                : "."),
            );
        // nothing placeable (collapsed, box-less): showHighlights announced it; no button
        // may look pressed over an empty page
        setActive(hasHighlight() ? { msgId: m.id, index } : null);
    }

    /** a finished reply: debug readout, then outline it if the auto-highlight knob says so */
    function onReplyDone(
        m: Msg,
        question: string,
        token: number,
        ask: SentAsk,
    ) {
        const c = cited(m);
        const src = m.cite;
        if (!c || !src) return;
        ask.cited = c.ids;
        recordEvidence(m.text, c.ids, (id) => labelOfWire(id, src.inventory));
        const mode = getSettings().autoHighlight;
        if (!c.ids.length || mode === "never") return;
        if (mode === "where" && !asksToLocate(question)) return;
        // guarded: a newer question or capture since this one was asked wins
        const drawn = showHighlights(
            c.ids.map((id, i) => ({
                id,
                role: "target" as const,
                badge: String(i + 1),
            })),
            src.registry,
            src.id,
            token,
            {
                label: c.ids
                    .map((id) => labelOfWire(id, src.inventory))
                    .join(", "),
            },
        );
        if (drawn && hasHighlight()) setActive({ msgId: m.id, index: "all" });
    }

    /** "next", "show all", "the second one": steer the last cited reply without a model call */
    /** take the user back to where they clicked, and outline what they clicked on */
    function goPlace(p: Place): string {
        const r = goToPlace(p);
        // outline what was clicked only when it is a thing, not a whole section
        const box = p.el?.isConnected ? p.el.getBoundingClientRect() : null;
        if (
            p.el &&
            box &&
            box.width <= window.innerWidth &&
            box.height <= window.innerHeight / 2
        )
            showHighlights(
                [{ id: "click", role: "anchor" }],
                new Map([["click", p.el]]),
                cur.current.id,
                nextToken(),
                { userInitiated: true },
            );
        setReturnable(canReturn());
        const note = `Where you clicked: ${p.label}.${r === "moved" ? " Say back to return." : ""}`;
        announce(note);
        return note;
    }

    function runNav(cmd: NavCommand, text: string): boolean {
        if (cmd.kind === "return" || cmd.kind === "place") {
            let note: string;
            if (cmd.kind === "return") {
                note = returnToPreviousView()
                    ? "Back to where you were."
                    : "Nothing to go back to.";
                setReturnable(canReturn());
                announce(note);
            } else {
                const p = latestPlace();
                note = p ? goPlace(p) : "No click recorded yet.";
            }
            setMessages((m) => [
                ...m,
                { id: `user-${Date.now()}`, role: "user", text },
                { id: `nav-${Date.now()}`, role: "assistant", text: note },
            ]);
            return true;
        }
        const last = [...messages]
            .reverse()
            .find((m) => (cited(m)?.ids.length ?? 0) > 0);
        const n = last ? (cited(last)?.ids.length ?? 0) : 0;
        if (!last || !n) return false;
        const cur =
            active?.msgId === last.id && typeof active.index === "number"
                ? active.index
                : -1;
        let note: string;
        if (cmd.kind === "clear") {
            clearHighlights();
            note = "Cleared.";
        } else if (cmd.kind === "all") {
            point(last, "all", false);
            note = n > 1 ? `Showing all ${n}.` : "Showing it.";
        } else {
            const i =
                cmd.kind === "next"
                    ? (cur + 1) % n
                    : cmd.kind === "prev"
                      ? (cur - 1 + n) % n
                      : cmd.n - 1;
            if (i < 0 || i >= n) {
                note = `There ${n === 1 ? "is only 1" : `are only ${n}`}.`;
            } else {
                point(last, i, true);
                note = `Showing ${i + 1} of ${n}.`;
            }
        }
        setMessages((m) => [
            ...m,
            { id: `user-${Date.now()}`, role: "user", text },
            { id: `nav-${Date.now()}`, role: "assistant", text: note },
        ]);
        return true;
    }

    /** replace fields of the last (streaming) assistant message */
    const patchLast = (patch: Partial<Msg>) =>
        setMessages((m) => [
            ...m.slice(0, -1),
            { ...m[m.length - 1], ...patch },
        ]);

    async function sendStreaming(text: string, token: number, ask: SentAsk) {
        const cite = citeSource();
        const res = await fetch(`${backend}/api/chat/stream`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                capture_id: cur.current.id,
                message: text,
                session_id: sessionId,
                cite: getSettings().citeEvidence,
            }),
        });
        if (!res.ok || !res.body) {
            const data = await res.json().catch(() => ({}));
            ask.error = data.error ?? `HTTP ${res.status}`;
            setMessages((m) => [
                ...m,
                {
                    id: `err-${Date.now()}`,
                    role: "assistant",
                    text: data.error ?? `HTTP ${res.status}`,
                },
            ]);
            return;
        }
        const msgId = `stream-${Date.now()}`;
        setMessages((m) => [
            ...m,
            { id: msgId, role: "assistant", text: "", cite, streaming: true },
        ]);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let full = "";
        let ended = false;
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const events = buffer.split("\n\n");
            buffer = events.pop() ?? ""; // keep incomplete tail
            for (const ev of events) {
                if (!ev.startsWith("data: ")) continue;
                const data = JSON.parse(ev.slice(6));
                if (data.delta) {
                    full += data.delta;
                    patchLast({ text: full });
                } else if (data.error) {
                    // the backend ends the stream after an error, with no "done"
                    ended = true;
                    ask.error = data.error;
                    patchLast({
                        text: `${full}\n[error: ${data.error}]`,
                        streaming: false,
                        error: true,
                    });
                } else if (data.done) {
                    ended = true;
                    ask.reply = data;
                    patchLast({ streaming: false });
                    onReplyDone(
                        { id: msgId, role: "assistant", text: full, cite },
                        text,
                        token,
                        ask,
                    );
                    // live read: the user may toggle auto-read while the reply streams
                    if (getSettings().autoRead && full) {
                        const idx = messages.length + 1; // the assistant bubble just added
                        speak(speakable(full), (s) =>
                            setSpeaking(
                                s === "idle" ? null : { idx, phase: s },
                            ),
                        );
                    }
                }
            }
        }
        // connection dropped with neither "done" nor "error": stop hiding the tail
        if (!ended) {
            ask.error = "stream ended without a reply";
            patchLast({ streaming: false });
        }
    }

    async function sendPlain(text: string, token: number, ask: SentAsk) {
        const cite = citeSource();
        const res = await fetch(`${backend}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                capture_id: cur.current.id,
                message: text,
                session_id: sessionId,
                cite: getSettings().citeEvidence,
            }),
        });
        const data = await res.json();
        if (data.provider != null) ask.reply = data;
        if (data.reply == null) ask.error = data.error ?? `HTTP ${res.status}`;
        const reply: Msg = {
            id: `plain-${Date.now()}`,
            role: "assistant",
            text: data.reply ?? data.error ?? "No reply.",
            error: data.reply == null,
            cite: data.reply == null ? undefined : cite,
        };
        setMessages((m) => [...m, reply]);
        if (data.reply != null) onReplyDone(reply, text, token, ask);
        // live read: the user may toggle auto-read while the request is in flight
        if (getSettings().autoRead && data.reply) speak(speakable(data.reply));
    }

    async function sendText(text: string) {
        if (!text || busy) return;
        setMessages((m) => [
            ...m,
            {
                id: `user-${Date.now()}`,
                role: "user",
                text,
                captureId: cur.current.id,
            },
        ]);
        setBusy(true);
        // minted at ask time: an auto-highlight for this reply loses to anything newer
        const token = nextToken();
        let ask: SentAsk | undefined;
        try {
            // the user moved since the last capture: send what they see now
            if (refreshCapture && cur.current.id !== "local") {
                const fresh = await refreshCapture(cur.current.cap);
                if (fresh) cur.current = fresh;
            }
            // developer-facing record of what went out; the debug panel shows it
            ask = recordAsk(cur.current.id, {
                question: text,
                cite: getSettings().citeEvidence,
            });
            if (settings.streamReplies) await sendStreaming(text, token, ask);
            else await sendPlain(text, token, ask);
        } catch (err) {
            if (ask) ask.error = String(err);
            setMessages((m) => [
                ...m,
                {
                    id: `err-${Date.now()}`,
                    role: "assistant",
                    text: `Backend error: ${err}`,
                },
            ]);
        } finally {
            setBusy(false);
        }
    }

    function send() {
        const text = input.trim();
        if (!text) return;
        setInput("");
        const nav = navCommand(text);
        if (nav && !busy && runNav(nav, text)) return;
        sendText(text);
    }

    const QUICK_ACTIONS: [string, string][] = [
        ["Explain this", "Explain what I am looking at, simply."],
        ["Summarize", "Summarize this page briefly."],
        ["→ English", "Translate the content I am looking at into English."],
    ];

    return (
        <PopoverContainer
            panelBg={C.panelBg}
            text={C.text}
            hc={hc}
            style={{
                left: pos.left,
                top: pos.top,
                fontSize: fs,
            }}
        >
            <HeaderContainer
                headerBg={C.headerBg}
                headerBorder={C.headerBorder}
                onPointerDown={onHeaderPointerDown}
                onPointerMove={onHeaderPointerMove}
                onPointerUp={onHeaderPointerUp}
                style={{ cursor: settings.dragPopover ? "grab" : "default" }}
            >
                <HeaderTitle accent={C.accent}>UniLens</HeaderTitle>
                <HeaderButtonsContainer>
                    <PinButton
                        type="button"
                        onClick={() => onTogglePin(pinned ? null : pos)}
                        pinned={pinned}
                        accent={C.accent}
                        title={
                            pinned
                                ? "Pinned — click to unpin (reopen at cursor)"
                                : "Pin position for next captures"
                        }
                    >
                        📌{pinned ? " pinned" : ""}
                    </PinButton>
                    <CloseButton type="button" onClick={onClose}>
                        ✕
                    </CloseButton>
                </HeaderButtonsContainer>
            </HeaderContainer>

            {/* contain: at the top or bottom of the messages, keep the wheel here instead of
          handing it to the page behind — the list auto-scrolls to the end, so without
          this every further scroll moves the page instead of the chat */}
            <ScrollContainer ref={scrollRef}>
                {messages.length === 0 && (
                    <EmptyHint style={{ color: C.dim, fontSize: fs }}>
                        Ask about what you clicked, or pick a quick action
                        below.
                    </EmptyHint>
                )}
                {messages.map((m, i) => {
                    const c = cited(m);
                    const n = c?.ids.length ?? 0;
                    const mine = active?.msgId === m.id ? active : null;
                    const at = typeof mine?.index === "number" ? mine.index : 0;
                    return (
                        <MessageBubble
                            key={m.id}
                            isUser={m.role === "user"}
                            userBg={C.userBubble}
                            aiBg={C.aiBubble}
                            bubbleBorder={C.bubbleBorder}
                            isError={m.error}
                        >
                            {m.role === "assistant" ? (
                                // Chips are <button data-cite> inside escaped HTML; one delegated
                                // click handler serves them (keyboard Enter/Space clicks too)
                                // biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useKeyWithClickEvents: delegation only; the targets are real <button> chips, which click on Enter and Space
                                <span
                                    onClick={(e) => {
                                        const id = (e.target as HTMLElement)
                                            .closest("[data-cite]")
                                            ?.getAttribute("data-cite");
                                        const k = id
                                            ? (c?.ids.indexOf(id) ?? -1)
                                            : -1;
                                        if (k >= 0) point(m, k, true);
                                    }}
                                    // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML is escaped in mdLite before formatting tags and chips are added
                                    dangerouslySetInnerHTML={{
                                        __html: c
                                            ? c.html
                                            : mdLite(speakable(m.text)),
                                    }}
                                />
                            ) : (
                                <>
                                    {m.text}
                                    {(() => {
                                        // once per place: the first question asked there
                                        const place = placeOf(m.captureId);
                                        const first =
                                            place &&
                                            messages.findIndex(
                                                (x) =>
                                                    x.role === "user" &&
                                                    placeOf(x.captureId) ===
                                                        place,
                                            ) === i;
                                        return place && first ? (
                                            <PlaceButton
                                                type="button"
                                                onClick={() => goPlace(place)}
                                                title="Go back to where you clicked to ask this"
                                                style={{
                                                    fontSize: Math.max(
                                                        12,
                                                        fs - 3,
                                                    ),
                                                }}
                                            >
                                                Where I clicked: {place.label}
                                            </PlaceButton>
                                        ) : null;
                                    })()}
                                </>
                            )}
                            {m.role === "assistant" && m.text && (
                                <SpeakButton
                                    type="button"
                                    onClick={() =>
                                        speakMessage(i, speakable(m.text))
                                    }
                                    speaking={speaking?.idx === i}
                                    style={{ fontSize: Math.max(12, fs - 2) }}
                                    title={
                                        speaking?.idx === i
                                            ? speaking.phase === "loading"
                                                ? "Preparing audio…"
                                                : "Stop"
                                            : "Read aloud"
                                    }
                                >
                                    {speaking?.idx === i
                                        ? speaking.phase === "loading"
                                            ? "⏳"
                                            : "⏹"
                                        : "🔊"}
                                </SpeakButton>
                            )}
                            {n > 0 && !m.streaming && (
                                <EvidenceRow>
                                    <QuickActionButton
                                        type="button"
                                        aria-pressed={mine?.index === "all"}
                                        onClick={() =>
                                            mine?.index === "all"
                                                ? clearHighlights()
                                                : point(m, "all", false)
                                        }
                                        chipBg={C.chipBg}
                                        chipBorder={C.chipBorder}
                                        chipText={C.chipText}
                                        busy={false}
                                        style={{
                                            fontSize: Math.max(12, fs - 2),
                                        }}
                                    >
                                        {n > 1
                                            ? `Highlight all ${n}`
                                            : "Highlight"}
                                    </QuickActionButton>
                                    {n > 1 && (
                                        <NavGroup>
                                            <QuickActionButton
                                                type="button"
                                                aria-label="Previous evidence"
                                                onClick={() =>
                                                    point(
                                                        m,
                                                        mine &&
                                                            typeof mine.index ===
                                                                "number"
                                                            ? (at - 1 + n) % n
                                                            : n - 1,
                                                        true,
                                                    )
                                                }
                                                chipBg={C.chipBg}
                                                chipBorder={C.chipBorder}
                                                chipText={C.chipText}
                                                busy={false}
                                                style={{
                                                    fontSize: Math.max(
                                                        12,
                                                        fs - 2,
                                                    ),
                                                }}
                                            >
                                                ‹
                                            </QuickActionButton>
                                            <span aria-live="polite">
                                                {typeof mine?.index === "number"
                                                    ? `${mine.index + 1} of ${n}`
                                                    : `${n} found`}
                                            </span>
                                            <QuickActionButton
                                                type="button"
                                                aria-label="Next evidence"
                                                onClick={() =>
                                                    point(
                                                        m,
                                                        mine &&
                                                            typeof mine.index ===
                                                                "number"
                                                            ? (at + 1) % n
                                                            : 0,
                                                        true,
                                                    )
                                                }
                                                chipBg={C.chipBg}
                                                chipBorder={C.chipBorder}
                                                chipText={C.chipText}
                                                busy={false}
                                                style={{
                                                    fontSize: Math.max(
                                                        12,
                                                        fs - 2,
                                                    ),
                                                }}
                                            >
                                                ›
                                            </QuickActionButton>
                                        </NavGroup>
                                    )}
                                    {returnable && mine && (
                                        <QuickActionButton
                                            type="button"
                                            onClick={() => {
                                                const ok =
                                                    returnToPreviousView();
                                                setReturnable(canReturn());
                                                announce(
                                                    ok
                                                        ? "Back to where you were."
                                                        : "Nothing to go back to.",
                                                );
                                            }}
                                            chipBg={C.chipBg}
                                            chipBorder={C.chipBorder}
                                            chipText={C.chipText}
                                            busy={false}
                                            title="Return to where you were reading"
                                            style={{
                                                fontSize: Math.max(12, fs - 2),
                                            }}
                                        >
                                            Back
                                        </QuickActionButton>
                                    )}
                                </EvidenceRow>
                            )}
                        </MessageBubble>
                    );
                })}
                {busy && <LoadingText>…</LoadingText>}
            </ScrollContainer>

            {settings.quickActions && (
                <QuickActionsContainer>
                    {QUICK_ACTIONS.map(([label, prompt]) => (
                        <QuickActionButton
                            type="button"
                            key={label}
                            onClick={() => sendText(prompt)}
                            disabled={busy}
                            chipBg={C.chipBg}
                            chipBorder={C.chipBorder}
                            chipText={C.chipText}
                            busy={busy}
                            style={{ fontSize: Math.max(12, fs - 2) }}
                        >
                            {label}
                        </QuickActionButton>
                    ))}
                </QuickActionsContainer>
            )}
            <InputContainer>
                {settings.voiceInput && sttSupported && (
                    <VoiceButton
                        type="button"
                        onClick={toggleMic}
                        listening={listening}
                        inputBg={C.inputBg}
                        text={C.text}
                        title={
                            listening ? "Stop listening" : "Speak your question"
                        }
                        style={{ fontSize: fs }}
                    >
                        🎤
                    </VoiceButton>
                )}
                <ChatInput
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    // Enter that confirms an IME composition (Japanese, Chinese, Korean)
                    // must not submit the half-typed text. keyCode 229 covers browsers
                    // that report the confirming Enter with isComposing already false.
                    onKeyDown={(e) =>
                        e.key === "Enter" &&
                        !e.nativeEvent.isComposing &&
                        e.nativeEvent.keyCode !== 229 &&
                        send()
                    }
                    placeholder="Ask about this page…"
                    inputBg={C.inputBg}
                    inputBorder={C.inputBorder}
                    text={C.text}
                    style={{ fontSize: fs }}
                />
                <SendButton
                    type="button"
                    onClick={send}
                    disabled={busy}
                    accent={C.accent}
                    hc={hc}
                >
                    ➤
                </SendButton>
            </InputContainer>
        </PopoverContainer>
    );
}
