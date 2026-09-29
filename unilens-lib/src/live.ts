/**
 * Live: a spoken conversation in the chat. The browser talks to the provider
 * directly, with the session set by the backend (rules, tools, model, voice):
 * - OpenAI Realtime over WebRTC: our offer goes to the backend, which relays it with
 *   the session and returns the answer. No key or token reaches the page.
 * - Gemini Live over a WebSocket, opened with a one-use token the backend minted.
 * Both report each turn's words (captions, then the final text), and the model points
 * at page elements with a `highlight(ids)` tool the chat runs.
 * Research: .local/research/2026-09-27-realtime-apis.md.
 */

export type LiveProvider = "openai" | "gemini";
export type LiveState =
    | "connecting"
    | "listening"
    | "hearing"
    | "thinking"
    | "speaking";

export interface LiveOptions {
    model?: string;
    voice?: string;
    turnEnd?: "patient" | "normal" | "quick";
    bargeIn?: boolean;
    point?: boolean;
    /** the assistant may zoom the page (its zoom tool) */
    zoom?: boolean;
    speed?: number;
    lang?: string;
}

export interface LiveEvents {
    /** a turn's words so far; `key` names its bubble; `final` once it is complete */
    onWords(
        role: "user" | "assistant",
        key: string,
        text: string,
        final: boolean,
    ): void;
    onState(state: LiveState): void;
    /** the model points at page elements while its turn `key` (null: not yet
     *  speaking) goes on: lit where they are ("light"), brought to the middle ("go",
     *  go_to), or zoomed into ("zoom": its first id, or `change` a step or a reset).
     *  Returns what the model is told back */
    onPoint(key: string | null, call: ToolCall): PointResult;
    /** ended: stopped by the provider, a lost connection, or an error (once) */
    onEnd(error?: string): void;
    /** the user's turn begins (speech, or a typed message): a new picture of their
     *  view when it moved since the last one, to go with their words; null at once
     *  when none is needed */
    onTurn?(): Promise<LiveView | null> | null;
}

/** a tool's result for the model: the ids shown, and the reply's sources in the
 *  chat's numbering (so "the second one" means number 2) */
export interface PointResult {
    shown: string[];
    sources: string[];
    /** after a zoom: where it went, as "250%" */
    zoom?: string;
}

export interface ToolCall {
    ids: string[];
    act: "light" | "go" | "zoom";
    change?: "in" | "out" | "reset";
}

/** a tool call's arguments as the chat takes them: highlight's ids, go_to's one id;
 *  anything else (another name, a malformed argument) points at nothing */
export function toolCall(name: string, args: unknown): ToolCall {
    const a = (args && typeof args === "object" ? args : {}) as {
        ids?: unknown;
        id?: unknown;
        change?: unknown;
    };
    const one = typeof a.id === "string" ? [a.id] : [];
    if (name === "go_to") return { ids: one, act: "go" };
    if (name === "zoom") {
        const change =
            a.change === "in" || a.change === "out" || a.change === "reset"
                ? a.change
                : undefined;
        // out and reset win over an id sent with them (a model sends both for "zoom
        // back out to normal"); in with an id is a zoom into it
        return change && (change !== "in" || !one.length)
            ? { ids: [], act: "zoom", change }
            : { ids: one, act: "zoom" };
    }
    if (name !== "highlight") return { ids: [], act: "light" };
    const ids = Array.isArray(a.ids)
        ? a.ids.filter((i): i is string => typeof i === "string")
        : [];
    return { ids, act: "light" };
}

/** what the user sees now, and a line saying where it is on the page (and, when
 *  the page changed, its elements again) */
export interface LiveView {
    /** none when pictures are off: the note goes alone */
    jpeg?: string;
    note: string;
    /** called once it is sent: until then the view counts as unseen */
    sent?: () => void;
}

/** views already sent: the page sent as it changed and a turn that shares it
 *  would both send it */
const sentViews = new WeakSet<LiveView>();

/** a turn's picture, or nothing once `ms` have passed: a reply never waits longer */
const within = (view: Promise<LiveView | null> | null, ms: number) =>
    view
        ? Promise.race([
              view.catch(() => null),
              new Promise<null>((ok) => window.setTimeout(() => ok(null), ms)),
          ])
        : Promise.resolve(null);
/** how long a reply waits for the picture of a moved view (it takes about 1 s) */
export const VIEW_WAIT_MS = 2500;
/** a typed message holds no audio: it waits for a page being taken (about 1.5 s
 *  after a change) longer */
const TYPED_WAIT_MS = 10_000;

export interface LiveHandle {
    stop(): void;
    /** a typed message during the conversation */
    say(text: string): void;
    /** the page again, now and without a reply: for when no one is speaking */
    see(view: LiveView): void;
}

export interface LiveRequest {
    captureId: string;
    sessionId: string | null;
    options: LiveOptions;
    /** send a picture of what the user sees, beside the page's elements */
    screenshot: boolean;
    /** aborted: the start is dropped at once, whatever it was waiting for, and
     *  nothing it opened stays open */
    signal: AbortSignal;
}

type Ev = { type: string; [k: string]: unknown };
/** an event from the provider: its fields depend on its type */
// biome-ignore lint/suspicious/noExplicitAny: the provider's own event shapes
type In = { type: string; [k: string]: any };

/** the backend's start response */
interface Start {
    context: string;
    image: boolean;
    model: string;
    sdp?: string;
    token?: string;
    ws?: string;
    error?: string;
}

async function begin(
    backend: string,
    provider: LiveProvider,
    req: LiveRequest,
    sdp?: string,
): Promise<Start> {
    const res = await fetch(`${backend}/api/live/${provider}`, {
        method: "POST",
        signal: req.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            capture_id: req.captureId,
            session_id: req.sessionId,
            options: req.options,
            sdp,
        }),
    });
    const data = (await res.json().catch(() => ({}))) as Start;
    if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
    return data;
}

/** the close-up of the capture as a small JPEG (the data channel drops big messages
 *  silently), or null */
export async function closeUp(
    backend: string,
    captureId: string,
): Promise<string | null> {
    try {
        const res = await fetch(
            `${backend}/api/capture/${encodeURIComponent(captureId)}/viewport`,
        );
        if (!res.ok) return null;
        const bmp = await createImageBitmap(await res.blob());
        const k = Math.min(1, 1024 / bmp.width);
        const c = document.createElement("canvas");
        c.width = Math.round(bmp.width * k);
        c.height = Math.round(bmp.height * k);
        c.getContext("2d")?.drawImage(bmp, 0, 0, c.width, c.height);
        return c.toDataURL("image/jpeg", 0.7);
    } catch {
        return null;
    }
}

const micConstraints: MediaStreamConstraints = {
    audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
    },
};

/** start a Live conversation; call from the button's click (autoplay and the mic) */
export function startLive(
    backend: string,
    provider: LiveProvider,
    req: LiveRequest,
    ev: LiveEvents,
): Promise<LiveHandle> {
    return provider === "openai"
        ? startOpenAI(backend, req, ev)
        : startGemini(backend, req, ev);
}

// ── OpenAI Realtime, WebRTC ─────────────────────────────────────────────────

async function startOpenAI(
    backend: string,
    req: LiveRequest,
    ev: LiveEvents,
): Promise<LiveHandle> {
    ev.onState("connecting");
    // made in the click: the browser lets it play
    const speaker = new Audio();
    speaker.autoplay = true;
    const mic = await navigator.mediaDevices.getUserMedia(micConstraints);
    const pc = new RTCPeerConnection();
    let ended = false;
    const onAbort = () => end();
    const close = () => {
        ended = true;
        req.signal.removeEventListener("abort", onAbort);
        for (const t of mic.getTracks()) t.stop();
        dc.close();
        pc.close();
        speaker.srcObject = null;
    };
    const end = (error?: string) => {
        if (ended) return;
        close();
        ev.onEnd(error);
    };
    pc.ontrack = (e) => {
        speaker.srcObject = e.streams[0];
    };
    pc.addTrack(mic.getAudioTracks()[0], mic);
    const dc = pc.createDataChannel("oai-events");
    /** false when the channel is not open (yet): nothing was sent */
    const send = (e: Ev) => {
        if (dc.readyState !== "open") return false;
        dc.send(JSON.stringify(e));
        return true;
    };
    const image = req.screenshot ? closeUp(backend, req.captureId) : null;
    let start: Start;
    try {
        // stopped while the mic was being asked for, or later while connecting
        req.signal.throwIfAborted();
        req.signal.addEventListener("abort", onAbort, { once: true });
        await pc.setLocalDescription(await pc.createOffer());
        start = await begin(backend, "openai", req, pc.localDescription?.sdp);
        await pc.setRemoteDescription({ type: "answer", sdp: start.sdp ?? "" });
    } catch (err) {
        // a failed start is reported by the caller, not as an ended talk
        if (!ended) close();
        throw err;
    }
    pc.onconnectionstatechange = () => {
        if (["failed", "closed", "disconnected"].includes(pc.connectionState))
            end(
                pc.connectionState === "closed" ? undefined : "connection lost",
            );
    };

    const words = new Map<string, string>();
    /** the picture of a moved view, taken as the user began speaking */
    let turnView: Promise<LiveView | null> | null = null;
    const sendView = (view: LiveView) => {
        if (sentViews.has(view)) return;
        const ok = send({
            type: "conversation.item.create",
            item: {
                type: "message",
                role: "user",
                content: [
                    { type: "input_text", text: view.note },
                    ...(view.jpeg
                        ? [
                              {
                                  type: "input_image",
                                  image_url: view.jpeg,
                                  detail: "auto",
                              },
                          ]
                        : []),
                ],
            },
        });
        if (!ok) return;
        sentViews.add(view);
        view.sent?.();
    };
    /** the assistant turn being spoken, for the ids it points at */
    let speakingKey: string | null = null;
    /** responses that called the tool: the model goes on once it has the result */
    const called = new Set<string>();
    /** each response's bubble; a reply that goes on after pointing comes as a new
     *  item and joins the bubble it continues, which completes only then */
    const bubbleOf = new Map<string, string>();
    const joined = new Map<string, string>();
    let continues: string | null = null;
    const replyKey = (item: string) => {
        if (!joined.has(item) && continues && item !== continues) {
            joined.set(item, continues);
            words.set(continues, `${words.get(continues) ?? ""} `);
        }
        continues = null;
        return joined.get(item) ?? item;
    };
    const add = (role: "user" | "assistant", key: string, delta: string) => {
        const text = (words.get(key) ?? "") + delta;
        words.set(key, text);
        ev.onWords(role, key, text, false);
    };
    dc.onmessage = async (m) => {
        const e = JSON.parse(m.data) as In;
        switch (e.type) {
            case "session.created": {
                // the page, as the first user turn (untrusted data: never the rules');
                // no reply until the user speaks
                const content: Ev[] = [
                    { type: "input_text", text: start.context },
                ];
                const jpeg = await image;
                if (jpeg)
                    content.push({
                        type: "input_image",
                        image_url: jpeg,
                        detail: "auto",
                    });
                send({
                    type: "conversation.item.create",
                    item: { type: "message", role: "user", content },
                });
                ev.onState("listening");
                break;
            }
            case "input_audio_buffer.speech_started":
                speakingKey = null;
                continues = null;
                ev.onState("hearing");
                // taken while they speak (about 1 s), so it is ready when they stop
                turnView ??= ev.onTurn?.() ?? null;
                break;
            case "input_audio_buffer.speech_stopped":
                ev.onState("thinking");
                break;
            case "input_audio_buffer.committed": {
                // the user's bubble goes in now, in order, before any reply; its
                // words follow (transcription runs apart from the reply)
                ev.onWords("user", e.item_id, "", false);
                // the reply starts here, not by itself (create_response is off), so
                // a moved view's picture is in before it
                // taken off before waiting: a next turn may start its own meanwhile
                const pending = turnView;
                turnView = null;
                const view = await within(pending, VIEW_WAIT_MS);
                if (ended) break;
                if (view) sendView(view);
                send({ type: "response.create" });
                break;
            }
            case "conversation.item.input_audio_transcription.delta":
                add("user", e.item_id, e.delta);
                break;
            case "conversation.item.input_audio_transcription.completed":
                words.set(e.item_id, e.transcript);
                ev.onWords("user", e.item_id, e.transcript, true);
                break;
            case "conversation.item.input_audio_transcription.failed":
                ev.onWords("user", e.item_id, words.get(e.item_id) ?? "", true);
                break;
            case "response.output_audio_transcript.delta": {
                const key = replyKey(e.item_id);
                bubbleOf.set(e.response_id, key);
                speakingKey = key;
                add("assistant", key, e.delta);
                break;
            }
            case "response.output_audio_transcript.done":
                // the whole item's words (a joined one keeps what came before it)
                if (!joined.has(e.item_id)) words.set(e.item_id, e.transcript);
                break;
            case "output_audio_buffer.started":
                ev.onState("speaking");
                break;
            case "output_audio_buffer.stopped":
            case "output_audio_buffer.cleared":
                ev.onState("listening");
                break;
            case "response.function_call_arguments.done": {
                let args: unknown = {};
                try {
                    args = JSON.parse(e.arguments);
                } catch {}
                const result = ev.onPoint(speakingKey, toolCall(e.name, args));
                called.add(e.response_id);
                send({
                    type: "conversation.item.create",
                    item: {
                        type: "function_call_output",
                        call_id: e.call_id,
                        output: JSON.stringify(result),
                    },
                });
                break;
            }
            case "response.done": {
                const id =
                    (e.response as { id?: string } | undefined)?.id ?? "";
                const key = bubbleOf.get(id);
                bubbleOf.delete(id);
                // it pointed (often after a first sentence): with the result in, it
                // says the rest, in the same bubble
                if (called.delete(id)) {
                    continues = key ?? null;
                    send({ type: "response.create" });
                } else if (key) {
                    ev.onWords("assistant", key, words.get(key) ?? "", true);
                    speakingKey = null;
                }
                break;
            }
            case "error":
                console.warn("[UniLens] live (OpenAI):", e.error);
                break;
        }
    };
    return {
        stop: () => end(),
        see: (view) => {
            if (!ended) sendView(view);
        },
        say: async (text) => {
            const view = await within(ev.onTurn?.() ?? null, TYPED_WAIT_MS);
            if (ended) return;
            if (view) sendView(view);
            send({
                type: "conversation.item.create",
                item: {
                    type: "message",
                    role: "user",
                    content: [{ type: "input_text", text }],
                },
            });
            send({ type: "response.create" });
        },
    };
}

// ── Gemini Live, WebSocket ───────────────────────────────────────────────────

/** PCM16 little-endian bytes as base64 */
function b64(pcm: Int16Array): string {
    const bytes = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength);
    let s = "";
    for (let i = 0; i < bytes.length; i += 0x8000)
        s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(s);
}

/** the mic's samples at 16 kHz PCM16, whatever the device's rate. ponytail: nearest
 *  sample, no low-pass; speech survives it. A filter if recognition suffers */
/**
 * What Gemini said, from its transcript. The transcript can carry text it never says
 * (A2 of the 2026-09-27 report): "<no speech detected>" for a silent turn, a tool call
 * written out ("<call:highlight{ids:[n68]}>"), an <LMDX> block of UI markup, runs of
 * <br>. The words stay; the markup goes, and so does a turn with nothing else.
 */
export function spoken(t: string): string {
    return t
        .replace(/<LMDX>[\s\S]*?(<\/LMDX>|$)/g, " ")
        .replace(/<call:[^>]*(>|$)/g, " ")
        .replace(/<\/?[A-Za-z][^<>]*(>|$)/g, " ")
        .replace(/^\s*#+\s*/gm, "")
        .replace(/\s+/g, " ")
        .trim();
}

/** a view's note and picture as a Gemini turn's parts */
const viewParts = (view: LiveView) => [
    { text: view.note },
    ...(view.jpeg
        ? [
              {
                  inlineData: {
                      mimeType: "image/jpeg",
                      data: view.jpeg.split(",")[1],
                  },
              },
          ]
        : []),
];

/** Gemini 3.8 Live Extended Thinking: it takes no scheduling on a tool's result, and
 *  its turnComplete ends an utterance (a filler while it reasons), not the reply */
export const thinksAside = (model: string) => /extended-thinking/.test(model);

/** a tool's result as Gemini takes it. highlight: SILENT, the model takes the result
 *  without a new turn (else it says its answer again). go_to and zoom: WHEN_IDLE, so a
 *  turn that was only the call still says something. A field of the response, not of
 *  its payload; none for a model that takes none */
export function functionResponse(
    fc: { id: string; name: string },
    call: ToolCall,
    result: PointResult,
    model: string,
) {
    return {
        id: fc.id,
        name: fc.name,
        response: result,
        ...(thinksAside(model)
            ? {}
            : { scheduling: call.act === "light" ? "SILENT" : "WHEN_IDLE" }),
    };
}

/** Extended Thinking's lifecycle: IN_PROGRESS while it works, IDLE once the reply is
 *  done; it comes on the message or in its serverContent */
// biome-ignore lint/suspicious/noExplicitAny: the provider's own message shape
export const interaction = (msg: any): string | undefined =>
    msg.interactionStatus ?? msg.serverContent?.interactionStatus;

/** whether a server message ends the model's reply: its turnComplete; for Extended
 *  Thinking, whose turnComplete ends an utterance, only going IDLE (with the turn's
 *  end, or on its own while a reply is pending) */
// biome-ignore lint/suspicious/noExplicitAny: the provider's own message shape
export function replyEnds(msg: any, open: boolean, thinking: boolean): boolean {
    const complete = msg.serverContent?.turnComplete === true;
    if (!thinking) return complete;
    return interaction(msg) === "IDLE" && (complete || open);
}

export function to16k(rate: number): (x: Float32Array) => Int16Array {
    const step = rate / 16000;
    let t = 0;
    return (x) => {
        const out = new Int16Array(
            Math.max(0, Math.ceil((x.length - t) / step)),
        );
        let n = 0;
        for (; t < x.length; t += step) {
            const v = Math.max(-1, Math.min(1, x[Math.floor(t)]));
            out[n++] = v < 0 ? v * 0x8000 : v * 0x7fff;
        }
        t -= x.length;
        return out.subarray(0, n);
    };
}

async function startGemini(
    backend: string,
    req: LiveRequest,
    ev: LiveEvents,
): Promise<LiveHandle> {
    ev.onState("connecting");
    // made in the click: the browser lets them play
    const ctx = new AudioContext();
    void ctx.resume();
    // played through an <audio> element, which the browser's echo canceller hears
    // as its reference (raw Web Audio output it may not)
    const out = ctx.createMediaStreamDestination();
    const speaker = new Audio();
    speaker.srcObject = out.stream;
    void speaker.play().catch(() => {});
    let mic: MediaStream | undefined;
    let start: Start;
    const image = req.screenshot ? closeUp(backend, req.captureId) : null;
    try {
        mic = await navigator.mediaDevices.getUserMedia(micConstraints);
        req.signal.throwIfAborted();
        start = await begin(backend, "gemini", req);
        req.signal.throwIfAborted();
    } catch (err) {
        // the mic refused, or the backend: nothing is left running
        for (const t of mic?.getTracks() ?? []) t.stop();
        void ctx.close();
        speaker.srcObject = null;
        throw err;
    }

    let ws: WebSocket;
    let ended = false;
    let handle: string | undefined;
    let micOn = false;
    const thinking = thinksAside(start.model);
    /** Extended Thinking is still working on the reply (between its utterances) */
    let working = false;
    /** the user is speaking (the server's voice activity) */
    let hearing = false;
    /** a reply was cut by the user's speech and has not reported its end yet */
    let cut = false;
    /** the user turns spoken and not answered yet, oldest first: a reply's end
     *  belongs to the oldest (Gemini's messages carry no turn id) */
    const awaiting: number[] = [];
    // ponytail: ScriptProcessorNode (deprecated, main thread) needs no module file,
    // so a host page's CSP cannot block it; an AudioWorklet if audio drops under load
    const src = ctx.createMediaStreamSource(mic);
    const proc = ctx.createScriptProcessor(2048, 1, 1);
    const down = to16k(ctx.sampleRate);
    const mute = ctx.createGain();
    mute.gain.value = 0;
    src.connect(proc);
    proc.connect(mute);
    mute.connect(ctx.destination);
    /** the mic's audio while a turn's picture is taken: sent after it */
    let held: string[] | null = null;
    const sendAudio = (data: string) =>
        ws.send(
            JSON.stringify({
                realtimeInput: {
                    audio: { data, mimeType: "audio/pcm;rate=16000" },
                },
            }),
        );
    proc.onaudioprocess = (e) => {
        if (!micOn || ws.readyState !== WebSocket.OPEN) return;
        const pcm = down(e.inputBuffer.getChannelData(0));
        if (!pcm.length) return;
        if (held) held.push(b64(pcm));
        else sendAudio(b64(pcm));
    };

    // playback: 24 kHz PCM16 chunks, queued back to back; cut short on barge-in
    let playAt = 0;
    const playing = new Set<AudioBufferSourceNode>();
    let quietTimer: number | undefined;
    const play = (data: string) => {
        const bin = atob(data);
        const n = bin.length >> 1;
        const buf = ctx.createBuffer(1, n, 24000);
        const ch = buf.getChannelData(0);
        for (let i = 0; i < n; i++) {
            const v =
                ((bin.charCodeAt(2 * i) | (bin.charCodeAt(2 * i + 1) << 8)) <<
                    16) >>
                16;
            ch[i] = v / 0x8000;
        }
        const node = ctx.createBufferSource();
        node.buffer = buf;
        node.connect(out);
        playAt = Math.max(playAt, ctx.currentTime);
        node.start(playAt);
        playAt += buf.duration;
        playing.add(node);
        node.onended = () => playing.delete(node);
        ev.onState("speaking");
        window.clearTimeout(quietTimer);
        quietTimer = window.setTimeout(
            () => {
                // the user speaking over it (barge-in off) keeps "hearing"
                if (!hearing) ev.onState(working ? "thinking" : "listening");
            },
            (playAt - ctx.currentTime) * 1000 + 100,
        );
    };
    const flush = () => {
        for (const node of playing) node.stop();
        playing.clear();
        playAt = 0;
        // the cut reply's drain must not say "listening" over the user's words
        window.clearTimeout(quietTimer);
    };

    const onAbort = () => end();
    const end = (error?: string) => {
        if (ended) return;
        // what was said so far stays: the latest user turn too, answered or not
        closeUserTurn();
        finishReply();
        ended = true;
        req.signal.removeEventListener("abort", onAbort);
        micOn = false;
        window.clearTimeout(quietTimer);
        ws.close();
        for (const t of mic.getTracks()) t.stop();
        flush();
        void ctx.close();
        speaker.srcObject = null;
        ev.onEnd(error);
    };

    // one bubble per turn. The user's opens when they start speaking (the server's
    // voice activity), so it stands before the reply even when its words come late:
    // input transcription has no guaranteed order. Words that come after the reply
    // still go to it. The model's closes when its turn completes. ponytail: the
    // transcripts carry no turn id, so words later than the next turn's start go to
    // that turn, and the history keeps the words the turn had when it completed
    let userTurn = 0;
    let modelTurn = 0;
    let userText = "";
    let userClosed = true;
    /** the server reports voice activity: turns open on it (else on the words) */
    let sawActivity = false;
    let modelText = "";
    const userKey = () => `g-user-${userTurn}`;
    const modelKey = () => `g-model-${modelTurn}`;
    /** a turn that said nothing is transcribed as "<no speech detected>": no bubble */
    const said = (t: string) => spoken(t);
    const openUserTurn = () => {
        // the last turn: its words, or its empty bubble goes
        if (!userText || !userClosed)
            ev.onWords("user", userKey(), userText, true);
        userTurn++;
        userText = "";
        userClosed = false;
        ev.onWords("user", userKey(), "", false);
    };
    /** the model's reply is over: its bubble completes */
    const finishReply = () => {
        if (modelText)
            ev.onWords("assistant", modelKey(), said(modelText), true);
        modelText = "";
        modelTurn++;
    };
    const closeUserTurn = () => {
        // an empty turn keeps its place: its words may still come
        if (!userClosed && userText)
            ev.onWords("user", userKey(), userText, true);
        userClosed = true;
    };
    const finish = () => {
        // the reply's own user turn: not one the user began while it was still
        // being answered (barge-in off), which its own reply will close
        const answered = awaiting.shift() ?? userTurn;
        if (!sawActivity || answered === userTurn) closeUserTurn();
        finishReply();
    };
    /** a picture as part of the user's turn, which it does not end */
    const sendView = (view: LiveView) => {
        if (sentViews.has(view)) return;
        sentViews.add(view);
        ws.send(
            JSON.stringify({
                clientContent: {
                    turns: [{ role: "user", parts: viewParts(view) }],
                    turnComplete: false,
                },
            }),
        );
        view.sent?.();
    };
    const connect = (resume?: string) => {
        const sock = new WebSocket(
            `${start.ws}?access_token=${encodeURIComponent(start.token ?? "")}`,
        );
        ws = sock;
        sock.onopen = () =>
            sock.send(
                JSON.stringify({
                    setup: {
                        model: `models/${start.model}`,
                        sessionResumption: resume ? { handle: resume } : {},
                    },
                }),
            );
        sock.onmessage = async (m) => {
            // a stopped talk, or a connection since replaced, says nothing more
            const live = () => !ended && ws === sock;
            if (!live()) return;
            const msg = JSON.parse(
                m.data instanceof Blob ? await m.data.text() : m.data,
            );
            if (!live()) return;
            if (msg.setupComplete) {
                if (!resume) {
                    // the page, as the first user turn, without a reply yet
                    const parts: object[] = [{ text: start.context }];
                    const jpeg = await image;
                    if (!live()) return;
                    if (jpeg)
                        parts.push({
                            inlineData: {
                                mimeType: "image/jpeg",
                                data: jpeg.split(",")[1],
                            },
                        });
                    sock.send(
                        JSON.stringify({
                            clientContent: {
                                turns: [{ role: "user", parts }],
                                turnComplete: false,
                            },
                        }),
                    );
                }
                micOn = true;
                ev.onState("listening");
            }
            // "type" on the wire (seen); "voiceActivityType" in the SDKs' schema
            const activity = msg.voiceActivity;
            const act = activity?.type ?? activity?.voiceActivityType;
            if (act === "ACTIVITY_END") {
                hearing = false;
                awaiting.push(userTurn);
                ev.onState(playing.size ? "speaking" : "thinking");
            }
            if (act === "ACTIVITY_START") {
                hearing = true;
                sawActivity = true;
                openUserTurn();
                ev.onState("hearing");
                // a moved view's picture joins the turn as it is spoken: the rest of
                // the turn's audio waits for it (at most VIEW_WAIT_MS), so Gemini
                // cannot end the turn, and answer, before the picture is in (a short
                // question ends before the page has rendered). What went before this
                // notice cannot end it either: a turn ends on its trailing silence,
                // and that is audio held here (Gemini waits for audio, as its
                // audioStreamEnd, for pauses in the stream, shows)
                const taking = ev.onTurn?.() ?? null;
                if (taking && !held) {
                    held = [];
                    void within(taking, VIEW_WAIT_MS).then((view) => {
                        if (view && live()) sendView(view);
                        const rest = held ?? [];
                        held = null;
                        if (live()) for (const data of rest) sendAudio(data);
                    });
                }
            }
            const sc = msg.serverContent;
            if (sc) {
                const output =
                    sc.outputTranscription?.text ||
                    sc.modelTurn?.parts?.some(
                        (p: { inlineData?: { data?: string } }) =>
                            p.inlineData?.data,
                    );
                // the new reply has begun: what completes now is its own (a cut reply
                // that never reports its end cannot swallow it, nor its turn stay due)
                if (output && cut) {
                    cut = false;
                    awaiting.shift();
                }
                for (const p of sc.modelTurn?.parts ?? [])
                    if (p.inlineData?.data) play(p.inlineData.data);
                if (sc.inputTranscription?.text) {
                    if (!sawActivity && userClosed) openUserTurn();
                    userText += sc.inputTranscription.text;
                    // late words, after the turn closed, still complete it
                    ev.onWords("user", userKey(), userText, userClosed);
                    // words come in no set order: the voice activity says when the
                    // user speaks, when the server reports it
                    if (!sawActivity) ev.onState("hearing");
                }
                if (sc.outputTranscription?.text) {
                    modelText += sc.outputTranscription.text;
                    if (said(modelText))
                        ev.onWords(
                            "assistant",
                            modelKey(),
                            said(modelText),
                            false,
                        );
                }
                if (sc.interrupted) {
                    flush();
                    // the cut reply is over (its last words came before this),
                    // though Extended Thinking may still say IN_PROGRESS or IDLE
                    // for it; the user's new turn stays open
                    finishReply();
                    working = false;
                    cut = true;
                }
                // an utterance of a reply that goes on: its words join the next one's
                if (sc.turnComplete && thinking && !replyEnds(msg, true, true))
                    if (modelText) modelText += " ";
            }
            if (thinking && interaction(msg) && !sc?.interrupted) {
                working = interaction(msg) === "IN_PROGRESS";
                // nothing playing, and the user not speaking: working, or done
                // (else the playback timer says which when it drains)
                if (!playing.size && !hearing)
                    ev.onState(working ? "thinking" : "listening");
            }
            // a reply is pending while its words or the user's turn are open: a
            // second IDLE finds none
            if (replyEnds(msg, modelText !== "" || !userClosed, thinking)) {
                // the cut reply's own end (interrupted, then turnComplete): its
                // bubble is done, and the user's new turn goes on
                if (cut) {
                    cut = false;
                    awaiting.shift();
                } else {
                    finish();
                    // a reply with nothing to play (a silent tool result): the
                    // user's turn now, else the playback timer says so
                    if (!playing.size && !hearing) ev.onState("listening");
                }
            }
            if (msg.toolCall) {
                const functionResponses = (
                    msg.toolCall.functionCalls ?? []
                ).map((fc: { id: string; name: string; args?: unknown }) => {
                    const call = toolCall(fc.name, fc.args);
                    const result = ev.onPoint(
                        said(modelText) ? modelKey() : null,
                        call,
                    );
                    return functionResponse(fc, call, result, start.model);
                });
                sock.send(
                    JSON.stringify({ toolResponse: { functionResponses } }),
                );
            }
            if (msg.sessionResumptionUpdate?.resumable)
                handle = msg.sessionResumptionUpdate.newHandle;
            // the connection is about to end (about every 10 minutes): carry on in a
            // new one, where this one left off
            if (msg.goAway && handle) {
                sock.onclose = null;
                sock.close();
                connect(handle);
            }
        };
        sock.onclose = (e) =>
            end(e.code === 1000 ? undefined : e.reason || `closed (${e.code})`);
        sock.onerror = () => {};
    };
    connect();
    req.signal.addEventListener("abort", onAbort, { once: true });
    return {
        stop: () => end(),
        see: (view) => {
            if (!ended && ws.readyState === WebSocket.OPEN) sendView(view);
        },
        say: async (text) => {
            const view = await within(ev.onTurn?.() ?? null, TYPED_WAIT_MS);
            if (ended || ws.readyState !== WebSocket.OPEN) return;
            // with the message, unless it went already (the page sent as it changed)
            const fresh = view && !sentViews.has(view) ? view : null;
            if (fresh) sentViews.add(fresh);
            ws.send(
                JSON.stringify({
                    clientContent: {
                        turns: [
                            {
                                role: "user",
                                parts: [
                                    ...(fresh ? viewParts(fresh) : []),
                                    { text },
                                ],
                            },
                        ],
                        turnComplete: true,
                    },
                }),
            );
            fresh?.sent?.();
        },
    };
}
