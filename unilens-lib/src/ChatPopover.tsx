import { useEffect, useRef, useState } from "react";
import type { CaptureResult } from "./capture";
import { chatLang, chatText, speechLang } from "./chatI18n";
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
    ExpandIcon,
    HighlightIcon,
    MicIcon,
    MinimizeIcon,
    NextIcon,
    PauseIcon,
    PinIcon,
    PlaceIcon,
    PlayIcon,
    PrevIcon,
    SendIcon,
    StopIcon,
    WaitIcon,
} from "./icons";
import { labelOfWire, type WireNode } from "./inventory";
import {
    goToPlace,
    latestPlace,
    type Place,
    placeNumber,
    placeOf,
} from "./places";
import { recordAsk, type SentAsk } from "./sentLog";
import { getSettings, motionMs, useSettings } from "./settings";
import {
    listen,
    pauseSpeaking,
    resumeSpeaking,
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
    /** "place": a click, its own entry in the log (captureId names the place), whether
     *  or not anything is asked there */
    role: "user" | "assistant" | "place";
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

/** the log entry for the click behind a capture, when that click is a known place */
/** the capture a message goes against: the one the chat is on, or a refresh of it */
type Current = { id: string; cap: CaptureResult };

const placeEntry = (captureId: string): Msg[] =>
    placeOf(captureId)
        ? [{ id: `place-${captureId}`, role: "place", text: "", captureId }]
        : [];

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
    /** re-capture if the view moved since `prev`; null when it did not. `onStart`
     *  runs when it does re-capture, so the chat can say so */
    refreshCapture?: (
        prev: CaptureResult,
        prevId: string,
        onStart?: () => void,
    ) => Promise<{ id: string; cap: CaptureResult } | null>;
    /** a new click is being captured; the chat moves there when it arrives */
    capturing?: boolean;
}

/** width and height in em of the chat's font size (chatStyles.ts sizes the panel in em) */
const PANEL_W_EM = 24.3;
const PANEL_H_EM = 30;
/** the least a chat can be and still work: header, three lines of log, input, status */
const MIN_H_EM = 16;

/** the fixed or sticky ancestor that pins a host element to the screen, if any */
function fixedRoot(el: Element): Element | null {
    for (
        let e: Element | null = el, i = 0;
        e && i < 8;
        e = e.parentElement, i++
    ) {
        const p = getComputedStyle(e).position;
        if (p === "fixed" || p === "sticky") return e;
    }
    return null;
}

/**
 * The page's own floating controls (a help or accessibility button pinned to a
 * corner) must stay usable: a chat placed over one moves the least distance that
 * clears it. Full-width bars are not controls and are left alone.
 * ponytail: hit-tests a 22px grid (~300 points, only when the chat is placed); a control under 22px can slip between them
 */
function clearOfHostControls(
    p: { left: number; top: number },
    w: number,
    h: number,
) {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const r = {
        left: p.left,
        top: p.top,
        right: p.left + w,
        bottom: p.top + h,
    };
    const seen = new Set<Element>();
    let worst: DOMRect | null = null;
    let worstArea = 0;
    // a 22px grid over where the chat will be: fine enough for a 24px control
    const grid = (a: number, b: number) => {
        const out: number[] = [];
        for (let v = a + 2; v < b - 2; v += 22) out.push(v);
        return [...out, b - 2];
    };
    for (const py of grid(r.top, r.bottom))
        for (const px of grid(r.left, r.right))
            for (const el of document.elementsFromPoint(px, py)) {
                // the chat itself and the outlines/cues it draws; the display-adjust
                // widget, the settings gear and the minimap are dodged like host controls
                if (el.closest("#unilens-root, #unilens-highlight-layer"))
                    continue;
                const f = fixedRoot(el);
                if (!f || seen.has(f)) continue;
                seen.add(f);
                const b = f.getBoundingClientRect();
                if (b.width * b.height > W * H * 0.1) continue;
                const ow =
                    Math.min(r.right, b.right) - Math.max(r.left, b.left);
                const oh =
                    Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top);
                if (ow > 0 && oh > 0 && ow * oh > worstArea) {
                    worst = b;
                    worstArea = ow * oh;
                }
            }
    if (!worst) return p;
    const b = worst;
    const moves = [
        { left: b.left - 8 - w, top: p.top },
        { left: b.right + 8, top: p.top },
        { left: p.left, top: b.top - 8 - h },
        { left: p.left, top: b.bottom + 8 },
    ].filter(
        (m) =>
            m.left >= 8 &&
            m.top >= 8 &&
            m.left + w <= W - 8 &&
            m.top + h <= H - 8,
    );
    const d = (m: { left: number; top: number }) =>
        Math.hypot(m.left - p.left, m.top - p.top);
    return moves.sort((a, c) => d(a) - d(c))[0] ?? p;
}

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
    capturing,
}: Props) {
    ensureChatStyles();
    // the log opens with the click that opened the chat
    const [messages, setMessages] = useState<Msg[]>(() =>
        placeEntry(captureId),
    );
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
    // so what it points at above stays visible. A short screen (a laptop at 200-300%
    // browser zoom) gets a smaller chat, but never so small that the input is lost
    const narrow = window.innerWidth <= 480;
    const short = window.innerHeight <= 560;
    const panelW = narrow
        ? window.innerWidth - 16
        : Math.min(PANEL_W_EM * fs, window.innerWidth - 16);
    const room =
        narrow || short
            ? Math.max(
                  MIN_H_EM * fs,
                  window.innerHeight * (narrow ? 0.5 : 0.66),
              )
            : Number.POSITIVE_INFINITY;
    const panelH = Math.min(PANEL_H_EM * fs, room, window.innerHeight - 16);
    /** folded to its header and status line, out of the page's way */
    const [mini, setMini] = useState(false);

    /** the mic is on: dictating into the field, or recording a message that sends itself */
    const [listening, setListening] = useState<false | "voice">(false);
    const stopListenRef = useRef<((cancel?: boolean) => void) | null>(null);
    /** which message is being spoken and its phase */
    const [speaking, setSpeaking] = useState<{
        idx: number;
        phase: SpeechState;
    } | null>(null);

    function readMessage(idx: number, text: string) {
        act("press", T.sReading);
        speak(text, (s) =>
            setSpeaking(s === "idle" ? null : { idx, phase: s }),
        );
    }

    /** a message's reading controls: play, then pause / resume, and stop while it reads */
    const readControls = (
        idx: number,
        text: string,
        cls: string,
        playLabel = T.readAloud,
    ) => {
        const phase = speaking?.idx === idx ? speaking.phase : null;
        const main =
            phase === "playing"
                ? {
                      label: T.pauseReading,
                      icon: <PauseIcon />,
                      run: () => {
                          pauseSpeaking();
                          act("press", T.sPausedReading);
                      },
                  }
                : phase === "paused"
                  ? {
                        label: T.resumeReading,
                        icon: <PlayIcon />,
                        run: () => {
                            resumeSpeaking();
                            act("press", T.sReading);
                        },
                    }
                  : phase === "loading"
                    ? {
                          label: T.preparingAudio,
                          icon: <WaitIcon />,
                          run: () => {},
                      }
                    : {
                          label: playLabel,
                          icon: <PlayIcon />,
                          run: () => readMessage(idx, text),
                      };
        return (
            <>
                <button
                    type="button"
                    className={cls}
                    aria-label={main.label}
                    title={main.label}
                    onClick={main.run}
                >
                    {main.icon}
                </button>
                {phase && (
                    <button
                        type="button"
                        className={cls}
                        aria-label={T.stopReading}
                        title={T.stopReading}
                        onClick={() => {
                            stopSpeaking();
                            act("press", T.sStoppedReading);
                        }}
                    >
                        <StopIcon />
                    </button>
                )}
            </>
        );
    };

    // Focus moves into the chat when it opens and back to where it was when it
    // closes, so keyboard and screen-reader users are never left on the page behind.
    // Speech, the mic and the audio context stop with it.
    const inputRef = useRef<HTMLInputElement>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    /** the header's fold button, where the keyboard goes when the chat folds itself */
    const foldRef = useRef<HTMLButtonElement>(null);
    /** a question asked while a new place is captured: it waits for that place */
    const waiting = useRef<{ text: string; msgId: string } | null>(null);
    useEffect(() => {
        const before = document.activeElement as HTMLElement | null;
        inputRef.current?.focus({ preventScroll: true });
        return () => {
            stopSpeaking();
            // cancel, not stop: a stop delivers what was heard and sends it
            stopListenRef.current?.(true);
            releaseAudio();
            if (before?.isConnected) before.focus({ preventScroll: true });
        };
    }, []);

    /** voice buttons show in every browser; without speech recognition they say why */
    function noVoice() {
        act("error", T.sNoVoice);
        setMessages((m) => [
            ...m,
            {
                id: `novoice-${Date.now()}`,
                role: "assistant",
                text: T.sNoVoice,
                quiet: true,
            },
        ]);
    }

    /** the mic: speak, and the words fill the field as they are heard. With "send
     *  what I say when I pause" on (voiceAutoSend) they then go to the assistant, on a
     *  pause or a second press; off, they stay in the field to check and send. (A
     *  first step toward live voice conversation, TODOS.md.) */
    const heard = useRef("");
    function toggleVoice() {
        if (!sttSupported) return noVoice();
        if (listening) {
            stopListenRef.current?.();
            return;
        }
        const auto = getSettings().voiceAutoSend;
        heard.current = "";
        const stop = listen(
            (transcript) => {
                heard.current = transcript;
                setInput(transcript);
                // the folded chat has no field: what is heard shows on its status line
                setStatus(transcript);
            },
            () => {
                setListening(false);
                const text = heard.current.trim();
                heard.current = "";
                if (!text) {
                    act("error", T.sNothingHeard);
                    return;
                }
                if (auto) {
                    setInput("");
                    submitRef.current(text);
                    return;
                }
                // kept to check: the field shows it (a folded chat opens) and has the keyboard
                setMini(false);
                act("micOff", T.sHeardCheck);
                requestAnimationFrame(() =>
                    inputRef.current?.focus({ preventScroll: true }),
                );
            },
            speechLang(),
        );
        if (stop) {
            stopListenRef.current = stop;
            setListening("voice");
            act("micOn", auto ? T.sRecording : T.sListening);
        }
    }

    // Continuity: seed the running conversation from the session history, once: later
    // captures join the chat that is already open
    // biome-ignore lint/correctness/useExhaustiveDependencies: seeds once, on mount
    useEffect(() => {
        if (!sessionId || captureId === "local") return;
        fetch(`${backend}/api/session/${encodeURIComponent(sessionId)}`)
            .then((r) => r.json())
            .then((d) => {
                if (!Array.isArray(d.history)) return;
                // earlier questions, each place entered before the first one asked there
                const seeded: Msg[] = [];
                let last: Place | undefined;
                d.history.forEach(
                    (
                        h: { role: string; text: string; capture_id?: string },
                        idx: number,
                    ) => {
                        const p =
                            h.role === "user"
                                ? placeOf(h.capture_id)
                                : undefined;
                        if (p && p !== last && h.capture_id)
                            seeded.push(...placeEntry(h.capture_id));
                        if (p) last = p;
                        seeded.push({
                            id: `hist-${idx}-${Date.now()}`,
                            role: h.role as Msg["role"],
                            text: h.text,
                            captureId: h.capture_id,
                        });
                    },
                );
                // then what this chat has added since it opened (its own click)
                setMessages((ms) => [...seeded, ...ms]);
            })
            .catch(() => {});
    }, []);

    // Clamp popover inside viewport, near the cursor (or restore pinned position)
    const clamp = (p: { left: number; top: number }) => ({
        left: Math.min(Math.max(p.left, 8), window.innerWidth - panelW - 8),
        top: Math.min(Math.max(p.top, 8), window.innerHeight - panelH - 8),
    });
    /** where the chat sits when placed for the user (not dragged): on screen, and
     *  off the page's own floating controls */
    const settle = (p: { left: number; top: number }) =>
        clearOfHostControls(clamp(p), panelW, panelH);
    const [pos, setPos] = useState(() =>
        settle(
            narrow
                ? { left: 8, top: window.innerHeight }
                : (initialPos ?? { left: x + 12, top: y + 12 }),
        ),
    );
    const dragRef = useRef<{ dx: number; dy: number } | null>(null);
    // a new click while the chat is open: it glides there (setting "motion") and the
    // log gains the new place; the capture it answers against becomes the new one
    const firstCapture = useRef(true);
    // biome-ignore lint/correctness/useExhaustiveDependencies: runs per new capture only
    useEffect(() => {
        if (firstCapture.current) {
            firstCapture.current = false;
            return;
        }
        cur.current = { id: captureId, cap: capture };
        setActive(null);
        setReturnable(canReturn());
        setMini(false);
        if (!pinned)
            setPos(
                settle(
                    narrow
                        ? { left: 8, top: window.innerHeight }
                        : { left: x + 12, top: y + 12 },
                ),
            );
        const p = placeOf(captureId);
        act("chip", p ? T.sNewPlace(placeNumber(p), p.label) : "");
        // every click stays in the log, in order, asked about or not
        setMessages((ms) => [...ms, ...placeEntry(captureId)]);
        // the new place is the latest entry: follow it
        stick.current = true;
        requestAnimationFrame(() => {
            logScroll({ top: scrollRef.current?.scrollHeight ?? 0 });
            // the next thing typed is about the new place: the field takes the
            // keyboard back, unless the user is already working in the chat
            if (!rootRef.current?.contains(document.activeElement))
                inputRef.current?.focus({ preventScroll: true });
        });
    }, [captureId]);
    // biome-ignore lint/correctness/useExhaustiveDependencies: on the capturing edge only
    useEffect(() => {
        if (capturing) act("send", T.sCapturing);
        else if (waiting.current) {
            // declared after the new-capture effect, so cur.current is already the new
            // place (or, if the capture failed, the one the chat still has)
            const w = waiting.current;
            waiting.current = null;
            sendText(w.text, w.msgId);
        }
    }, [capturing]);
    // a bigger text size or a narrower window must not push the chat off screen
    // biome-ignore lint/correctness/useExhaustiveDependencies: re-clamp on size changes only
    useEffect(() => {
        const refit = () => setPos((p) => settle(p));
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
    /** until when the log's scroll events are our own eased scroll, not the user's */
    const ownScroll = useRef(0);
    const logScroll = (opts: ScrollToOptions, by = false) => {
        const log = scrollRef.current;
        if (!log) return;
        const ms = motionMs();
        ownScroll.current = performance.now() + ms + 120;
        const o = { ...opts, behavior: ms ? "smooth" : "auto" } as const;
        if (by) log.scrollBy(o);
        else log.scrollTo(o);
    };
    /** keep a reply's controls in view inside the log, scrolling only the log (never
     *  the host page, which scrollIntoView would also move) */
    const revealTurn = (id: string) =>
        requestAnimationFrame(() => {
            const log = scrollRef.current;
            const turn = log?.querySelector(`[data-turn="${CSS.escape(id)}"]`);
            if (!log || !turn) return;
            const lr = log.getBoundingClientRect();
            const tr = turn.getBoundingClientRect();
            // keep from the turn's top when it fits, else from the answer's last two
            // lines: controls with no answer above them read as an empty reply
            const text = turn.querySelector(".ulc-text");
            const line =
                Number.parseFloat(getComputedStyle(turn).lineHeight) || 24;
            const top =
                tr.height + 16 <= lr.height || !text
                    ? tr.top
                    : Math.max(
                          tr.top,
                          text.getBoundingClientRect().bottom - 2 * line,
                      );
            let d = Math.max(0, tr.bottom - lr.bottom + 8);
            // the kept top wins when both ends cannot show
            if (top - d < lr.top + 8) d = top - lr.top - 8;
            if (d) logScroll({ top: d }, true);
        });
    // while following, the log stays at its end when it changes size (the status line
    // growing a line, the quick actions hiding), not only when a message changes
    // biome-ignore lint/correctness/useExhaustiveDependencies: a fold unmounts the log; unfolding makes a new one
    useEffect(() => {
        const log = scrollRef.current;
        if (!log || typeof ResizeObserver === "undefined") return;
        const ro = new ResizeObserver(() => {
            if (stick.current) log.scrollTop = log.scrollHeight;
        });
        ro.observe(log);
        return () => ro.disconnect();
    }, [mini]);
    /** a finished answer taller than the log opens at its first line, not its last:
     *  the log followed the stream down, but reading starts at the top */
    const showAnswerStart = (id: string) =>
        // two frames: after the render that ends the stream and its follow-the-bottom scroll
        requestAnimationFrame(() =>
            requestAnimationFrame(() => {
                const log = scrollRef.current;
                const turn = log?.querySelector(
                    `[data-turn="${CSS.escape(id)}"]`,
                );
                if (!log || !turn) return;
                const lr = log.getBoundingClientRect();
                const tr = turn.getBoundingClientRect();
                if (tr.height <= lr.height - 16) return;
                stick.current = false;
                logScroll({ top: log.scrollTop + tr.top - lr.top - 8 });
            }),
        );
    // biome-ignore lint/correctness/useExhaustiveDependencies: follows every message change
    useEffect(() => {
        if (stick.current)
            logScroll({ top: scrollRef.current?.scrollHeight ?? 0 });
    }, [messages]);

    // Escape is owned by highlight.ts (one listener decides per keypress, honouring the
    // escapeOrder setting); the popover only lends it a close callback
    useEffect(() => registerPopoverClose(onClose), [onClose]);

    // The capture the next message goes against: the one this popover opened on, until
    // a follow-up after a scroll/pan/zoom re-captures the new view into the session
    const cur = useRef<Current>({ id: captureId, cap: capture });

    // ── evidence: [[id]] citations in replies become chips and an action row ────
    const citeSource = (on = cur.current): CiteSource | undefined => {
        const { id, cap } = on;
        return id !== "local" && cap.inventory?.length && cap.registry
            ? { id, inventory: cap.inventory, registry: cap.registry }
            : undefined;
    };

    const [active, setActive] = useState<Active>(null);
    /** a move to evidence can be undone: the Back button shows */
    const [returnable, setReturnable] = useState(false);
    /** the place whose clicked element is outlined, so its entry shows pressed */
    const [placeOn, setPlaceOn] = useState<Place | null>(null);
    // Escape (or a new capture) clears the outline: the pressed buttons must follow
    useEffect(
        () =>
            onHighlightsCleared(() => {
                setActive(null);
                setPlaceOn(null);
            }),
        [],
    );

    /** outline a reply's evidence (all, or item `index`), on the user's click or command */
    function point(
        m: Msg,
        index: number | "all",
        reveal: boolean,
        toggle = false,
    ) {
        const c = cited(m);
        const src = m.cite;
        if (!c?.ids.length || !src) return;
        // the lit source pressed again: its outline goes (every outline can be turned off
        // from the chat, not only with Escape)
        if (
            toggle &&
            typeof index === "number" &&
            active?.msgId === m.id &&
            active.index === index &&
            hasHighlight()
        ) {
            clearHighlights();
            act("clear", T.sCleared);
            return;
        }
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
        // at high zoom there may be no room beside the chat: once the move settles, a
        // chat still covering the source folds to its header
        if (short && el && !mini)
            setTimeout(() => {
                const a = el.getBoundingClientRect();
                const b = rootRef.current?.getBoundingClientRect();
                if (!b) return;
                const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
                const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
                const area = Math.max(1, a.width * a.height);
                if (w > 0 && h > 0 && (w * h) / area > 0.2) {
                    // folding removes the control that has focus: the keyboard moves
                    // to the unfold button, not to the page
                    const hadFocus = rootRef.current?.contains(
                        document.activeElement,
                    );
                    setMini(true);
                    if (hadFocus)
                        requestAnimationFrame(() =>
                            foldRef.current?.focus({ preventScroll: true }),
                        );
                    act("press", T.sCovered);
                }
            }, motionMs() + 80);
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
        // one status for the answer and what it found: two writes in a row would
        // cut the first off before a screen reader says it
        let said = chatText().sAnswer(c?.ids.length ?? 0);
        const done = () => act("done", said);
        showAnswerStart(m.id);
        // asked where, pointed nowhere: "nothing found", styled apart from an answer
        if (c && !c.ids.length && asksToLocate(question))
            setMessages((ms) =>
                ms.map((x) => (x.id === m.id ? { ...x, quiet: true } : x)),
            );
        if (!c || !src) return done();
        ask.cited = c.ids;
        recordEvidence(m.text, c.ids, (id) => labelOfWire(id, src.inventory));
        const mode = getSettings().autoHighlight;
        if (!c.ids.length || mode === "never") return done();
        if (mode === "where" && !asksToLocate(question)) return done();
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
        );
        if (drawn && hasHighlight()) {
            setActive({ msgId: m.id, index: "all" });
            said += ` ${chatText().hFound(
                c.ids.map((id) => labelOfWire(id, src.inventory)).join(", "),
            )}`;
        }
        done();
    }

    /** "next", "show all", "the second one": steer the last cited reply without a model call */
    /** take the user back to where they clicked, and outline what they clicked on */
    function goPlace(p: Place, toggle = false): string {
        const T = chatText();
        // its entry is a toggle: pressed again, the outline goes and the page stays
        if (toggle && placeOn === p && hasHighlight()) {
            clearHighlights();
            act("clear", T.sCleared);
            return T.sCleared;
        }
        const r = goToPlace(p);
        // outline what was clicked only when it is a thing, not a whole section
        const box = p.el?.isConnected ? p.el.getBoundingClientRect() : null;
        const drawn =
            p.el &&
            box &&
            box.width <= window.innerWidth &&
            box.height <= window.innerHeight / 2 &&
            showHighlights(
                [{ id: "click", role: "anchor" }],
                new Map([["click", p.el]]),
                cur.current.id,
                nextToken(),
                { userInitiated: true },
            );
        setPlaceOn(drawn && hasHighlight() ? p : null);
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

    /** replace fields of one message: a streaming reply patches itself by id, since a
     *  click during the stream appends its place entry after it */
    const patchMsg = (id: string, patch: Partial<Msg>) =>
        setMessages((m) =>
            m.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        );

    async function sendStreaming(
        text: string,
        token: number,
        ask: SentAsk,
        on: Current,
    ) {
        const cite = citeSource(on);
        const res = await fetch(`${backend}/api/chat/stream`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                capture_id: on.id,
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
                    patchMsg(msgId, { text: full });
                } else if (data.error) {
                    // the backend ends the stream after an error, with no "done"
                    ended = true;
                    ask.error = data.error;
                    act("error", chatText().sError);
                    patchMsg(msgId, {
                        text: `${full}\n[error: ${data.error}]`,
                        streaming: false,
                        error: true,
                    });
                } else if (data.done) {
                    ended = true;
                    ask.reply = data;
                    patchMsg(msgId, { streaming: false });
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
            patchMsg(msgId, { streaming: false });
        }
    }

    async function sendPlain(
        text: string,
        token: number,
        ask: SentAsk,
        on: Current,
    ) {
        const cite = citeSource(on);
        const res = await fetch(`${backend}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                capture_id: on.id,
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

    /** queuedId: a question that waited for a new place's capture, already in the log */
    async function sendText(text: string, queuedId?: string) {
        if (!text || busy) return;
        if (queuedId)
            // it waited for the new place: it belongs to the place it now goes to
            setMessages((m) =>
                m.map((x) =>
                    x.id === queuedId ? { ...x, captureId: cur.current.id } : x,
                ),
            );
        else {
            // one question waits at a time; the capture takes a second or two
            if (capturing && waiting.current) return;
            const msgId = `user-${Date.now()}`;
            setMessages((m) => [
                ...m,
                { id: msgId, role: "user", text, captureId: cur.current.id },
            ]);
            // a new place is being captured: the question is about it, so it waits
            // for it (the capturing edge sends it) instead of going to the old one
            if (capturing) {
                waiting.current = { text, msgId };
                stick.current = true;
                act("send", T.sAskQueued);
                return;
            }
        }
        setBusy(true);
        stick.current = true;
        act("send", T.sAsking);
        // minted at ask time: an auto-highlight for this reply loses to anything newer
        const token = nextToken();
        let ask: SentAsk | undefined;
        // the capture this question goes against, bound now: a new click that lands
        // while it refreshes neither takes the question nor is replaced by it
        let on = cur.current;
        try {
            // the user moved since the last capture: send what they see now
            if (refreshCapture && on.id !== "local") {
                const from = on;
                const fresh = await refreshCapture(from.cap, from.id, () =>
                    setStatus(T.sUpdatingView),
                );
                if (fresh) {
                    on = fresh;
                    if (cur.current === from) cur.current = fresh;
                }
            }
            // developer-facing record of what went out; the debug panel shows it
            ask = recordAsk(on.id, {
                question: text,
                cite: getSettings().citeEvidence,
            });
            if (settings.streamReplies)
                await sendStreaming(text, token, ask, on);
            else await sendPlain(text, token, ask, on);
        } catch (err) {
            if (ask) ask.error = String(err);
            act("error", T.sError);
            setMessages((m) => [
                ...m,
                {
                    id: `err-${Date.now()}`,
                    role: "assistant",
                    text: T.sBackendError,
                    error: true,
                },
            ]);
        } finally {
            setBusy(false);
        }
    }

    /** a typed or spoken message: a navigation command, or a question for the model */
    function submit(text: string) {
        const nav = navCommand(text);
        if (nav && !busy && runNav(nav, text)) return;
        sendText(text);
    }
    // a voice message ends in a callback set up renders ago: it sends with the latest
    const submitRef = useRef(submit);
    submitRef.current = submit;

    function send() {
        const text = input.trim();
        if (!text) return;
        setInput("");
        submit(text);
    }

    const QUICK: [string, string][] = [
        [T.quickExplain, T.promptExplain],
        [T.quickSummary, T.promptSummary],
        [T.quickTranslate, T.promptTranslate],
    ];

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

    /** a click, as its own entry in the log: a pin with its number, which goes there */
    const placeRow = (p: Place, key: string) => (
        <button
            key={key}
            type="button"
            className="ulc-where"
            onClick={() => goPlace(p, true)}
            aria-pressed={placeOn === p}
            aria-label={T.placeEntry(placeNumber(p), p.label)}
            title={T.placeEntry(placeNumber(p), p.label)}
        >
            <PlaceIcon />
            <b>P{placeNumber(p)}</b>
            <span>{p.label}</span>
        </button>
    );

    /** a reply's source controls, one row: ‹ position › · highlight all · back */
    function controlsFor(m: Msg, c: Cited, at: number, allOn: boolean) {
        const n = c.ids.length;
        const src = m.cite;
        const label = (id: string) =>
            src ? labelOfWire(id, src.inventory) : id;
        const nav = n > 1;
        // three number keys at most: a window round the current one
        const from = Math.max(0, Math.min(at - 1, n - 3));
        const keys = c.ids.map((id, k) => ({ id, k })).slice(from, from + 3);
        const showLabel = style === "assistant" || !nav;
        return (
            <div className="ulc-ctl">
                {nav && (
                    <button
                        type="button"
                        className="ulc-c ulc-arrow"
                        aria-label={T.prevEvidence}
                        title={T.prevEvidence}
                        onClick={() =>
                            point(m, at < 0 ? n - 1 : (at - 1 + n) % n, true)
                        }
                    >
                        <PrevIcon />
                    </button>
                )}
                {nav &&
                    (style === "assistant" ? (
                        // the status line announces the position; this is its visible copy
                        <span className="ulc-of" aria-hidden="true">
                            {at >= 0 ? at + 1 : "–"}/{n}
                        </span>
                    ) : (
                        keys.map(({ id, k }) => (
                            <button
                                key={id}
                                type="button"
                                className="ulc-c ulc-num"
                                aria-pressed={at === k}
                                aria-label={`${chipText(k + 1)}, ${T.evidenceLabel(k + 1, label(id))}`}
                                onClick={() => point(m, k, true, true)}
                            >
                                {chipText(k + 1)}
                            </button>
                        ))
                    ))}
                {nav && (
                    <button
                        type="button"
                        className="ulc-c ulc-arrow"
                        aria-label={T.nextEvidence}
                        title={T.nextEvidence}
                        onClick={() =>
                            point(m, at < 0 ? 0 : (at + 1) % n, true)
                        }
                    >
                        <NextIcon />
                    </button>
                )}
                <button
                    type="button"
                    className={`ulc-c ulc-all${showLabel ? " has-label" : ""}`}
                    aria-pressed={allOn}
                    aria-label={T.highlightAll(n)}
                    title={T.highlightAll(n)}
                    onClick={() => toggleAll(m, allOn)}
                >
                    <HighlightIcon />
                    {showLabel && (
                        <span>{nav ? T.allShort : T.highlightAll(n)}</span>
                    )}
                </button>
                {returnable && (
                    <button
                        type="button"
                        className="ulc-c ulc-back"
                        aria-label={T.back}
                        title={T.backTitle}
                        onClick={goBack}
                    >
                        <BackIcon />
                    </button>
                )}
            </div>
        );
    }

    // the log: every click as its own entry, questions and answers, in order
    const rows: React.ReactNode[] = [];
    messages.forEach((m, i) => {
        if (m.role === "place") {
            const p = placeOf(m.captureId);
            if (p) rows.push(placeRow(p, m.id));
            return;
        }
        if (m.role === "user") {
            rows.push(
                <div key={m.id} className="ulc-msg ulc-me">
                    {m.text}
                </div>,
            );
            return;
        }
        const c = cited(m);
        const mine = active?.msgId === m.id ? active : null;
        const at = typeof mine?.index === "number" ? mine.index : -1;
        const allOn = mine?.index === "all";
        const controls =
            c && c.ids.length > 0 && !m.streaming
                ? controlsFor(m, c, at, allOn)
                : null;
        rows.push(
            <div key={m.id} className="ulc-turn" data-turn={m.id}>
                <div
                    className={`ulc-msg ulc-bot${m.error ? " is-err" : ""}${m.quiet ? " is-quiet" : ""}`}
                >
                    {/* Chips are <button data-cite> inside escaped HTML; one delegated
                        click handler serves them (keyboard Enter/Space clicks too) */}
                    {/* biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useKeyWithClickEvents: delegation only; the targets are real <button> chips, which click on Enter and Space */}
                    <span
                        className="ulc-text"
                        onClick={(e) => {
                            const id = (e.target as HTMLElement)
                                .closest("[data-cite]")
                                ?.getAttribute("data-cite");
                            const k = id ? (c?.ids.indexOf(id) ?? -1) : -1;
                            if (k >= 0) point(m, k, true, true);
                        }}
                        // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML is escaped in mdLite before formatting tags and chips are added
                        dangerouslySetInnerHTML={{
                            __html: c
                                ? markActive(
                                      c.html,
                                      at >= 0 ? c.ids[at] : undefined,
                                  )
                                : mdLite(speakable(m.text)),
                        }}
                    />
                    {m.streaming && (
                        <span className="ulc-caret" aria-hidden="true" />
                    )}
                    {/* read aloud sits at the end of the answer, not on a row of its own */}
                    {m.text && !m.streaming && (
                        <span className="ulc-read">
                            {readControls(i, speakable(m.text), "ulc-speak")}
                        </span>
                    )}
                    {style === "assistant" && controls}
                </div>
                {style !== "assistant" && controls}
            </div>,
        );
    });
    // an answer is on its way: dots where it will appear, until its first words do
    const lastTalk = messages.findLast((m) => m.role !== "place");
    if (busy && lastTalk?.role === "user")
        rows.push(
            <div
                key="typing"
                className="ulc-msg ulc-bot ulc-typing"
                aria-hidden="true"
            >
                <i />
                <i />
                <i />
            </div>,
        );
    // a new click is being captured: it shows where its entry will appear
    if (capturing)
        rows.push(
            <div key="capturing" className="ulc-where is-pending">
                <WaitIcon />
                <span>{T.sCapturing}</span>
            </div>,
        );

    const ms = motionMs();
    /** anything asked or answered yet (place entries alone are not a conversation) */
    const talked = messages.some((m) => m.role !== "place");
    const voiceOK = settings.voiceInput;
    /** record a voice message: next to send, and in the folded chat's header */
    // one voice button, the mic: its words say whether it sends on a pause
    const voiceLabel = settings.voiceAutoSend
        ? listening
            ? T.voiceStop
            : T.voiceStart
        : listening
          ? T.micStop
          : T.micStart;
    const voiceButton = (cls: string) => (
        <button
            type="button"
            className={`${cls} ulc-voice`}
            aria-pressed={Boolean(listening)}
            aria-disabled={!sttSupported}
            aria-label={voiceLabel}
            title={voiceLabel}
            onClick={toggleVoice}
            disabled={busy && !listening}
        >
            {listening ? <StopIcon /> : <MicIcon />}
        </button>
    );
    let lastAnswer = -1;
    for (let k = messages.length - 1; k >= 0; k--) {
        const m = messages[k];
        if (m.role === "assistant" && m.text && !m.streaming && !m.error) {
            lastAnswer = k;
            break;
        }
    }
    // the status line only on the folded chat: open, the chat shows each action on the
    // control itself, and the live region speaks it
    const statusShown = mini && (Boolean(status) || speaking || listening);

    return (
        <div
            ref={rootRef}
            className="ul-chat"
            data-style={style}
            data-hc={hc ? "true" : "false"}
            data-mini={mini ? "true" : "false"}
            data-short={short ? "true" : "false"}
            role="dialog"
            aria-label={T.title}
            lang={chatLang()}
            style={
                {
                    left: pos.left,
                    top: pos.top,
                    width: panelW,
                    height: mini ? "auto" : panelH,
                    // glides to a new click; never while dragged
                    transition:
                        ms && !dragRef.current
                            ? `left ${ms}ms cubic-bezier(.22,1,.36,1), top ${ms}ms cubic-bezier(.22,1,.36,1)`
                            : "none",
                    "--ul-fs": `${fs}px`,
                    "--ul-text": settings.chatTextScale / 100,
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
                    <b>{style === "station" ? T.stationName : T.title}</b>
                    {style === "station" && <small>{T.otherName}</small>}
                </div>
                {/* folded, the chat keeps its voice: record a message, hear the last answer */}
                {mini && voiceOK && voiceButton("ulc-ib")}
                {mini &&
                    lastAnswer >= 0 &&
                    readControls(
                        lastAnswer,
                        speakable(messages[lastAnswer].text),
                        "ulc-ib",
                        T.readLast,
                    )}
                <button
                    ref={foldRef}
                    type="button"
                    className="ulc-ib"
                    aria-expanded={!mini}
                    aria-label={mini ? T.expand : T.minimize}
                    title={mini ? T.expand : T.minimize}
                    onClick={() => {
                        setMini(!mini);
                        act("press", mini ? T.sExpanded : T.sMinimized);
                    }}
                >
                    {mini ? <ExpandIcon /> : <MinimizeIcon />}
                </button>
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

            {!mini && (
                <div
                    className="ulc-log"
                    ref={scrollRef}
                    onScroll={(e) => {
                        // our own eased scroll passes through positions the user never chose
                        if (performance.now() < ownScroll.current) return;
                        const el = e.currentTarget;
                        stick.current =
                            el.scrollHeight - el.scrollTop - el.clientHeight <
                            48;
                    }}
                >
                    {rows}
                    {!talked && <p className="ulc-empty">{T.emptyHint}</p>}
                </div>
            )}

            {!mini && settings.quickActions && !(short && talked) && (
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
            {!mini && (
                <div className="ulc-in">
                    {voiceOK && voiceButton("ulc-ib")}
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
                        placeholder={
                            listening ? T.placeholderListening : T.placeholder
                        }
                        aria-label={T.placeholder}
                        readOnly={Boolean(listening)}
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
            )}
            {/* one home for what just happened: the audio guide shows it on its amber
                display, the station on its information strip */}
            {statusShown && (
                <div className="ulc-status" title={status}>
                    {(speaking || listening) && (
                        <span className="ulc-lvl" aria-hidden="true">
                            <i />
                            <i />
                            <i />
                        </span>
                    )}
                    <span>{status}</span>
                </div>
            )}
        </div>
    );
}
