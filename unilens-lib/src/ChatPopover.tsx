import { useEffect, useRef, useState } from "react";
import type { CaptureResult } from "./capture";
import { chatLang, chatText } from "./chatI18n";
import { ensureChatStyles } from "./chatStyles";
import { type Earcon, earcon, releaseAudio } from "./earcons";
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
import {
    BackIcon,
    CloseIcon,
    HighlightIcon,
    MicIcon,
    NextIcon,
    PinIcon,
    PlaceIcon,
    PrevIcon,
    SendIcon,
    SpeakerIcon,
    StopIcon,
    WaitIcon,
} from "./icons";
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
    /** a reply to a where/show question that cited nothing: styled as "nothing found",
     *  apart from an answer and from an error */
    quiet?: boolean;
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
        chatText().evidenceLabel,
        chipText,
    );
}

/** station signs number their sources like station codes */
const chipText = (n: number) =>
    getSettings().chatStyle === "station" ? `U${n}` : String(n);

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

/** width and height in em of the chat's font size (chatStyles.ts sizes the panel in em) */
const PANEL_W_EM = 24.3;
const PANEL_H_EM = 30;

/** a chip's HTML with the active one marked, so each style can show which is current */
const markActive = (html: string, id: string | undefined) =>
    id
        ? html.replace(
              `data-cite="${id}"`,
              `data-cite="${id}" aria-current="true"`,
          )
        : html;

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
    ensureChatStyles();
    const [messages, setMessages] = useState<Msg[]>([]);
    /** the last action, shown on the status line: every action is seen as well as heard */
    const [status, setStatus] = useState("");
    /** every action: its sound, the visible status line, and the one live region */
    const act = (kind: Earcon, text?: string) => {
        earcon(kind);
        if (text !== undefined) {
            setStatus(text);
            announce(text);
        }
    };
    const [input, setInput] = useState("");
    const [busy, setBusy] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // store subscription: re-renders when settings change, so text size / contrast apply live
    const settings = useSettings();

    const fs = settings.chatFontSize;
    const hc = settings.highContrast;
    const style = settings.chatStyle;
    const T = chatText();
    // on a phone-width screen the chat docks as a bottom sheet over half the height,
    // so what it points at above stays visible
    const narrow = window.innerWidth <= 480;
    const panelW = narrow
        ? window.innerWidth - 16
        : Math.min(PANEL_W_EM * fs, window.innerWidth - 16);
    const panelH = narrow
        ? Math.min(PANEL_H_EM * fs, window.innerHeight * 0.5)
        : Math.min(PANEL_H_EM * fs, window.innerHeight - 16);

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
            act("press", T.sStoppedReading);
            return;
        }
        act("press", T.sReading);
        speak(text, (s) =>
            setSpeaking(s === "idle" ? null : { idx, phase: s }),
        );
    }

    // Focus moves into the chat when it opens and back to where it was when it
    // closes, so keyboard and screen-reader users are never left on the page behind.
    // Speech, the mic and the audio context stop with it.
    const inputRef = useRef<HTMLInputElement>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const before = document.activeElement as HTMLElement | null;
        inputRef.current?.focus({ preventScroll: true });
        return () => {
            stopSpeaking();
            stopListenRef.current?.();
            releaseAudio();
            if (before?.isConnected) before.focus({ preventScroll: true });
        };
    }, []);

    function toggleMic() {
        if (listening) {
            stopListenRef.current?.();
            act("micOff", T.sStoppedListening);
            return;
        }
        const stop = listen(
            (transcript) => setInput(transcript),
            () => setListening(false),
        );
        if (stop) {
            stopListenRef.current = stop;
            setListening(true);
            act("micOn", T.sListening);
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
        left: Math.min(Math.max(p.left, 8), window.innerWidth - panelW - 8),
        top: Math.min(Math.max(p.top, 8), window.innerHeight - panelH - 8),
    });
    const [pos, setPos] = useState(() =>
        clamp(
            narrow
                ? { left: 8, top: window.innerHeight }
                : (initialPos ?? { left: x + 12, top: y + 12 }),
        ),
    );
    const dragRef = useRef<{ dx: number; dy: number } | null>(null);
    // a bigger text size or a narrower window must not push the chat off screen
    // biome-ignore lint/correctness/useExhaustiveDependencies: re-clamp on size changes only
    useEffect(() => {
        const refit = () => setPos((p) => clamp(p));
        refit();
        window.addEventListener("resize", refit);
        return () => window.removeEventListener("resize", refit);
    }, [fs, style]);

    function onHeaderPointerDown(e: React.PointerEvent) {
        if (!settings.dragPopover) return;
        if ((e.target as HTMLElement).closest("button")) return;
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

    // The log follows the conversation (new bubbles, streaming text, the evidence
    // controls that appear when an answer ends) while the user is at the bottom; once
    // they scroll up to read, it stays put until they send again.
    const stick = useRef(true);
    /** keep a reply's controls in view inside the log, scrolling only the log (never
     *  the host page, which scrollIntoView would also move) */
    const revealTurn = (id: string) =>
        requestAnimationFrame(() => {
            const log = scrollRef.current;
            const turn = log?.querySelector(`[data-turn="${CSS.escape(id)}"]`);
            if (!log || !turn) return;
            const lr = log.getBoundingClientRect();
            const tr = turn.getBoundingClientRect();
            if (tr.bottom > lr.bottom)
                log.scrollTop += tr.bottom - lr.bottom + 8;
            else if (tr.top < lr.top) log.scrollTop -= lr.top - tr.top + 8;
        });
    // biome-ignore lint/correctness/useExhaustiveDependencies: follows every message change
    useEffect(() => {
        if (stick.current)
            scrollRef.current?.scrollTo({
                top: scrollRef.current.scrollHeight,
            });
    }, [messages]);

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
                      avoid: rootRef.current?.getBoundingClientRect(),
                  }) === "moved"
                : false;
        setReturnable(canReturn());
        if (hasHighlight()) {
            const said =
                index === "all"
                    ? T.sAll(n, c.ids.map(label).join(", "))
                    : T.sItem(picks[0].i + 1, n, label(picks[0].id)) +
                      (moved
                          ? T.sMoved
                          : where && where !== "on screen"
                            ? T.sWhere(T.dir[where] ?? where)
                            : T.sEnd);
            act(index === "all" ? "all" : moved ? "move" : "chip", said);
        }
        // nothing placeable (collapsed, box-less): showHighlights announced it; no button
        // may look pressed over an empty page
        setActive(hasHighlight() ? { msgId: m.id, index } : null);
        revealTurn(m.id);
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
        act("done", chatText().sAnswer(c?.ids.length ?? 0));
        // asked where, pointed nowhere: "nothing found", styled apart from an answer
        if (c && !c.ids.length && asksToLocate(question))
            setMessages((ms) =>
                ms.map((x) => (x.id === m.id ? { ...x, quiet: true } : x)),
            );
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
        const T = chatText();
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
        const note = T.sPlace(p.label, r === "moved");
        act(r === "moved" ? "move" : "chip", note);
        return note;
    }

    function runNav(cmd: NavCommand, text: string): boolean {
        if (cmd.kind === "return" || cmd.kind === "place") {
            let note: string;
            if (cmd.kind === "return") {
                const ok = returnToPreviousView();
                note = ok ? T.sBack : T.sNoBack;
                setReturnable(canReturn());
                act(ok ? "back" : "error", note);
            } else {
                const p = latestPlace();
                note = p ? goPlace(p) : T.sNoPlace;
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
            note = T.sCleared;
            act("clear", note);
        } else if (cmd.kind === "all") {
            point(last, "all", false);
            note = T.sAllNote(n);
        } else {
            const i =
                cmd.kind === "next"
                    ? (cur + 1) % n
                    : cmd.kind === "prev"
                      ? (cur - 1 + n) % n
                      : cmd.n - 1;
            if (i < 0 || i >= n) {
                note = T.sOnly(n);
                act("error", note);
            } else {
                point(last, i, true);
                note = T.sItemNote(i + 1, n);
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
            act("error", chatText().sError);
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
                    act("error", chatText().sError);
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
        if (data.reply == null) {
            ask.error = data.error ?? `HTTP ${res.status}`;
            act("error", chatText().sError);
        }
        const reply: Msg = {
            id: `plain-${Date.now()}`,
            role: "assistant",
            text: data.reply ?? data.error ?? chatText().sError,
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
        stick.current = true;
        act("send", T.sAsking);
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
            act("error", T.sError);
            setMessages((m) => [
                ...m,
                {
                    id: `err-${Date.now()}`,
                    role: "assistant",
                    text: T.sBackendError(String(err)),
                    error: true,
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

    const QUICK: [string, string][] = [
        [T.quickExplain, T.promptExplain],
        [T.quickSummary, T.promptSummary],
        [T.quickTranslate, T.promptTranslate],
    ];

    // what the audio-guide display and the station strip show: the selected source,
    // else how many the latest cited answer found, else what the chat is doing
    const activeMsg = active
        ? messages.find((m) => m.id === active.msgId)
        : undefined;
    const activeN = activeMsg ? (cited(activeMsg)?.ids.length ?? 0) : 0;
    const lastCited = [...messages]
        .reverse()
        .find((m) => (cited(m)?.ids.length ?? 0) > 0);
    const foundN =
        activeN || (lastCited ? (cited(lastCited)?.ids.length ?? 0) : 0);
    const selected =
        active && typeof active.index === "number" ? active.index + 1 : 0;
    const doing = busy
        ? T.sAsking
        : listening
          ? T.sListening
          : speaking
            ? T.sReading
            : "";
    const shortTitle = doing || (foundN ? T.found(foundN) : T.subtitle);

    const toggleAll = (m: Msg, pressed: boolean) => {
        if (pressed) {
            clearHighlights();
            act("clear", T.sCleared);
        } else point(m, "all", false);
    };
    const goBack = () => {
        const ok = returnToPreviousView();
        setReturnable(canReturn());
        const said = ok ? T.sBack : T.sNoBack;
        act(ok ? "back" : "error", said);
    };

    return (
        <div
            ref={rootRef}
            className="ul-chat"
            data-style={style}
            data-hc={hc ? "true" : "false"}
            role="dialog"
            aria-label={T.title}
            lang={chatLang()}
            style={
                {
                    left: pos.left,
                    top: pos.top,
                    width: panelW,
                    height: panelH,
                    "--ul-fs": `${fs}px`,
                } as React.CSSProperties
            }
        >
            {/* the header is the drag handle; its buttons are excluded from the drag */}
            <div
                className="ulc-hd"
                onPointerDown={onHeaderPointerDown}
                onPointerMove={onHeaderPointerMove}
                onPointerUp={onHeaderPointerUp}
                style={settings.dragPopover ? undefined : { cursor: "default" }}
            >
                {style === "station" && (
                    <span className="ulc-roundel" aria-hidden="true">
                        U
                    </span>
                )}
                <div className="ulc-title">
                    <b>{T.title}</b>
                    {style === "station" && <small>{T.otherName}</small>}
                    {style === "assistant" && <small>{T.subtitle}</small>}
                </div>
                <button
                    type="button"
                    className="ulc-ib"
                    aria-pressed={pinned}
                    aria-label={pinned ? T.unpin : T.pin}
                    title={pinned ? T.unpin : T.pin}
                    onClick={() => {
                        onTogglePin(pinned ? null : pos);
                        act("press", pinned ? T.unpin : T.pin);
                    }}
                >
                    <PinIcon />
                </button>
                <button
                    type="button"
                    className="ulc-ib"
                    aria-label={T.close}
                    title={T.close}
                    onClick={onClose}
                >
                    <CloseIcon />
                </button>
            </div>

            {style === "audioGuide" && (
                <div className="ulc-lcd" aria-hidden="true">
                    <span className="ulc-big">{selected || foundN || "–"}</span>
                    <span className="ulc-txt">
                        {selected && activeN > 1
                            ? T.ofTotal(activeN)
                            : shortTitle}
                        {selected > 0 && (
                            <small>{doing || T.found(activeN)}</small>
                        )}
                    </span>
                </div>
            )}
            {style === "station" && (
                <div className="ulc-strip" aria-hidden="true">
                    <span>
                        {selected && activeN > 1
                            ? T.ofN(selected, activeN)
                            : shortTitle}
                    </span>
                </div>
            )}

            <div
                className="ulc-log"
                ref={scrollRef}
                onScroll={(e) => {
                    const el = e.currentTarget;
                    stick.current =
                        el.scrollHeight - el.scrollTop - el.clientHeight < 48;
                }}
            >
                {messages.length === 0 && (
                    <p className="ulc-empty">{T.emptyHint}</p>
                )}
                {messages.map((m, i) => {
                    if (m.role === "user") {
                        // once per place: the first question asked there
                        const place = placeOf(m.captureId);
                        const first =
                            place &&
                            messages.findIndex(
                                (x) =>
                                    x.role === "user" &&
                                    placeOf(x.captureId) === place,
                            ) === i;
                        return (
                            <div key={m.id} className="ulc-msg ulc-me">
                                {m.text}
                                {place && first && (
                                    <button
                                        type="button"
                                        className="ulc-place"
                                        onClick={() => goPlace(place)}
                                        title={T.whereClickedTitle}
                                    >
                                        <PlaceIcon />
                                        <span>
                                            {T.whereClicked}: {place.label}
                                        </span>
                                    </button>
                                )}
                            </div>
                        );
                    }
                    const c = cited(m);
                    const n = c?.ids.length ?? 0;
                    const mine = active?.msgId === m.id ? active : null;
                    const at =
                        typeof mine?.index === "number" ? mine.index : -1;
                    const allOn = mine?.index === "all";
                    const src = m.cite;
                    const label = (id: string) =>
                        src ? labelOfWire(id, src.inventory) : id;
                    const prev = () =>
                        point(m, at < 0 ? n - 1 : (at - 1 + n) % n, true);
                    const next = () =>
                        point(m, at < 0 ? 0 : (at + 1) % n, true);
                    const showBack = returnable && mine;
                    const controls =
                        c && n > 0 && !m.streaming ? (
                            style === "audioGuide" ? (
                                <div className="ulc-keys">
                                    {n > 1 && (
                                        <button
                                            type="button"
                                            className="ulc-key"
                                            aria-label={T.prevEvidence}
                                            onClick={prev}
                                        >
                                            <PrevIcon />
                                        </button>
                                    )}
                                    {c.ids
                                        .map((id, k) => ({ id, k }))
                                        // three number keys: a window round the current one
                                        .slice(
                                            Math.max(
                                                0,
                                                Math.min(at - 1, n - 3),
                                            ),
                                            Math.max(
                                                0,
                                                Math.min(at - 1, n - 3),
                                            ) + 3,
                                        )
                                        .map(({ id, k }) => (
                                            <button
                                                key={id}
                                                type="button"
                                                className="ulc-key"
                                                aria-current={at === k}
                                                aria-label={T.evidenceLabel(
                                                    k + 1,
                                                    label(id),
                                                )}
                                                onClick={() =>
                                                    point(m, k, true)
                                                }
                                            >
                                                {k + 1}
                                            </button>
                                        ))}
                                    {n > 1 && (
                                        <button
                                            type="button"
                                            className="ulc-key"
                                            aria-label={T.nextEvidence}
                                            onClick={next}
                                        >
                                            <NextIcon />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className={`ulc-key ${showBack ? "ulc-wide" : "ulc-full"}`}
                                        aria-pressed={allOn}
                                        onClick={() => toggleAll(m, allOn)}
                                    >
                                        <HighlightIcon />
                                        {T.highlightAll(n)}
                                    </button>
                                    {showBack && (
                                        <button
                                            type="button"
                                            className="ulc-key ulc-wide2"
                                            title={T.backTitle}
                                            onClick={goBack}
                                        >
                                            <BackIcon />
                                            {T.back}
                                        </button>
                                    )}
                                </div>
                            ) : style === "station" ? (
                                <div className="ulc-signs">
                                    <button
                                        type="button"
                                        className={`ulc-sign ${showBack ? "" : "ulc-span"}`}
                                        aria-pressed={allOn}
                                        onClick={() => toggleAll(m, allOn)}
                                    >
                                        <HighlightIcon />
                                        {T.highlightAll(n)}
                                    </button>
                                    {showBack && (
                                        <button
                                            type="button"
                                            className="ulc-sign"
                                            title={T.backTitle}
                                            onClick={goBack}
                                        >
                                            <BackIcon />
                                            {T.back}
                                        </button>
                                    )}
                                    {n > 1 && (
                                        <div className="ulc-codes">
                                            <button
                                                type="button"
                                                className="ulc-nb"
                                                aria-label={T.prevEvidence}
                                                onClick={prev}
                                            >
                                                <PrevIcon />
                                            </button>
                                            {c.ids.map((id, k) => (
                                                <button
                                                    key={id}
                                                    type="button"
                                                    className="unilens-cite"
                                                    aria-current={at === k}
                                                    aria-label={T.evidenceLabel(
                                                        k + 1,
                                                        label(id),
                                                    )}
                                                    onClick={() =>
                                                        point(m, k, true)
                                                    }
                                                >
                                                    {chipText(k + 1)}
                                                </button>
                                            ))}
                                            <button
                                                type="button"
                                                className="ulc-nb"
                                                aria-label={T.nextEvidence}
                                                onClick={next}
                                            >
                                                <NextIcon />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="ulc-ev">
                                    <button
                                        type="button"
                                        className="ulc-pill ulc-primary"
                                        aria-pressed={allOn}
                                        onClick={() => toggleAll(m, allOn)}
                                    >
                                        <HighlightIcon />
                                        {T.highlightAll(n)}
                                    </button>
                                    {n > 1 && (
                                        <span className="ulc-nav">
                                            <button
                                                type="button"
                                                className="ulc-pill"
                                                aria-label={T.prevEvidence}
                                                onClick={prev}
                                            >
                                                <PrevIcon />
                                            </button>
                                            <span
                                                className="ulc-of"
                                                aria-live="polite"
                                            >
                                                {at >= 0
                                                    ? T.ofN(at + 1, n)
                                                    : ""}
                                            </span>
                                            <button
                                                type="button"
                                                className="ulc-pill"
                                                aria-label={T.nextEvidence}
                                                onClick={next}
                                            >
                                                <NextIcon />
                                            </button>
                                        </span>
                                    )}
                                    {showBack && (
                                        <button
                                            type="button"
                                            className="ulc-pill"
                                            title={T.backTitle}
                                            onClick={goBack}
                                        >
                                            <BackIcon />
                                            {T.back}
                                        </button>
                                    )}
                                </div>
                            )
                        ) : null;
                    return (
                        <div key={m.id} className="ulc-turn" data-turn={m.id}>
                            <div
                                className={`ulc-msg ulc-bot${m.error ? " is-err" : ""}${m.quiet ? " is-quiet" : ""}`}
                            >
                                {/* Chips are <button data-cite> inside escaped HTML; one delegated
                                    click handler serves them (keyboard Enter/Space clicks too) */}
                                {/* biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useKeyWithClickEvents: delegation only; the targets are real <button> chips, which click on Enter and Space */}
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
                                            ? markActive(
                                                  c.html,
                                                  at >= 0
                                                      ? c.ids[at]
                                                      : undefined,
                                              )
                                            : mdLite(speakable(m.text)),
                                    }}
                                />
                                {m.streaming && (
                                    <span
                                        className="ulc-caret"
                                        aria-hidden="true"
                                    />
                                )}
                                {style === "assistant" && controls}
                                {m.text && !m.streaming && (
                                    <div className="ulc-tools">
                                        <button
                                            type="button"
                                            className="ulc-speak"
                                            onClick={() =>
                                                speakMessage(
                                                    i,
                                                    speakable(m.text),
                                                )
                                            }
                                            aria-label={
                                                speaking?.idx === i
                                                    ? speaking.phase ===
                                                      "loading"
                                                        ? T.preparingAudio
                                                        : T.stopReading
                                                    : T.readAloud
                                            }
                                            title={
                                                speaking?.idx === i
                                                    ? speaking.phase ===
                                                      "loading"
                                                        ? T.preparingAudio
                                                        : T.stopReading
                                                    : T.readAloud
                                            }
                                        >
                                            {speaking?.idx === i ? (
                                                speaking.phase === "loading" ? (
                                                    <WaitIcon />
                                                ) : (
                                                    <StopIcon />
                                                )
                                            ) : (
                                                <SpeakerIcon />
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                            {style !== "assistant" && controls}
                        </div>
                    );
                })}
            </div>

            {settings.quickActions && (
                <div className="ulc-quick">
                    {QUICK.map(([label, prompt]) => (
                        <button
                            type="button"
                            key={label}
                            onClick={() => sendText(prompt)}
                            disabled={busy}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}
            <div className="ulc-in">
                {settings.voiceInput && sttSupported && (
                    <button
                        type="button"
                        className="ulc-ib"
                        aria-pressed={listening}
                        aria-label={listening ? T.micStop : T.micStart}
                        title={listening ? T.micStop : T.micStart}
                        onClick={toggleMic}
                    >
                        <MicIcon />
                    </button>
                )}
                <input
                    ref={inputRef}
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
                    placeholder={T.placeholder}
                    aria-label={T.placeholder}
                />
                <button
                    type="button"
                    className="ulc-ib ulc-go"
                    aria-label={T.send}
                    title={T.send}
                    onClick={send}
                    disabled={busy || !input.trim()}
                >
                    {busy ? <WaitIcon /> : <SendIcon />}
                </button>
            </div>
            <div className="ulc-status">
                {(speaking || listening) && (
                    <span className="ulc-lvl" aria-hidden="true">
                        <i />
                        <i />
                        <i />
                    </span>
                )}
                <span>{status}</span>
            </div>
        </div>
    );
}
