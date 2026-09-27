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
     *  speaking) goes on; returns the ids that could be shown */
    onPoint(key: string | null, ids: string[]): string[];
    /** ended: stopped by the provider, a lost connection, or an error (once) */
    onEnd(error?: string): void;
}

export interface LiveHandle {
    stop(): void;
    /** a typed message during the conversation */
    say(text: string): void;
}

export interface LiveRequest {
    captureId: string;
    sessionId: string | null;
    options: LiveOptions;
    /** send a picture of what the user sees, beside the page's elements */
    screenshot: boolean;
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
async function closeUp(
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
    const end = (error?: string) => {
        if (ended) return;
        ended = true;
        for (const t of mic.getTracks()) t.stop();
        dc.close();
        pc.close();
        speaker.srcObject = null;
        ev.onEnd(error);
    };
    pc.ontrack = (e) => {
        speaker.srcObject = e.streams[0];
    };
    pc.addTrack(mic.getAudioTracks()[0], mic);
    const dc = pc.createDataChannel("oai-events");
    const send = (e: Ev) => {
        if (dc.readyState === "open") dc.send(JSON.stringify(e));
    };
    const image = req.screenshot ? closeUp(backend, req.captureId) : null;
    let start: Start;
    try {
        await pc.setLocalDescription(await pc.createOffer());
        start = await begin(backend, "openai", req, pc.localDescription?.sdp);
        await pc.setRemoteDescription({ type: "answer", sdp: start.sdp ?? "" });
    } catch (err) {
        end();
        throw err;
    }
    pc.onconnectionstatechange = () => {
        if (["failed", "closed", "disconnected"].includes(pc.connectionState))
            end(
                pc.connectionState === "closed" ? undefined : "connection lost",
            );
    };

    const words = new Map<string, string>();
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
                break;
            case "input_audio_buffer.speech_stopped":
                ev.onState("thinking");
                break;
            case "input_audio_buffer.committed":
                // the user's bubble goes in now, in order, before any reply; its
                // words follow (transcription runs apart from the reply)
                ev.onWords("user", e.item_id, "", false);
                break;
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
                let ids: string[] = [];
                try {
                    const args = JSON.parse(e.arguments);
                    if (Array.isArray(args.ids))
                        ids = args.ids.filter(
                            (i: unknown) => typeof i === "string",
                        );
                } catch {}
                const shown = ev.onPoint(speakingKey, ids);
                called.add(e.response_id);
                send({
                    type: "conversation.item.create",
                    item: {
                        type: "function_call_output",
                        call_id: e.call_id,
                        output: JSON.stringify({ shown }),
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
        say: (text) => {
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
    const mic = await navigator.mediaDevices.getUserMedia(micConstraints);
    const image = req.screenshot ? closeUp(backend, req.captureId) : null;
    let start: Start;
    try {
        start = await begin(backend, "gemini", req);
    } catch (err) {
        for (const t of mic.getTracks()) t.stop();
        void ctx.close();
        throw err;
    }

    let ws: WebSocket;
    let ended = false;
    let handle: string | undefined;
    let micOn = false;
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
    proc.onaudioprocess = (e) => {
        if (!micOn || ws.readyState !== WebSocket.OPEN) return;
        const pcm = down(e.inputBuffer.getChannelData(0));
        if (pcm.length)
            ws.send(
                JSON.stringify({
                    realtimeInput: {
                        audio: {
                            data: b64(pcm),
                            mimeType: "audio/pcm;rate=16000",
                        },
                    },
                }),
            );
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
            () => ev.onState("listening"),
            (playAt - ctx.currentTime) * 1000 + 100,
        );
    };
    const flush = () => {
        for (const node of playing) node.stop();
        playing.clear();
        playAt = 0;
    };

    const end = (error?: string) => {
        if (ended) return;
        ended = true;
        micOn = false;
        window.clearTimeout(quietTimer);
        ws.close();
        for (const t of mic.getTracks()) t.stop();
        flush();
        void ctx.close();
        speaker.srcObject = null;
        ev.onEnd(error);
    };

    // one bubble per turn: the user's opens with their first words, the model's with
    // its first; both close when the turn completes
    let turn = 0;
    let userText = "";
    let modelText = "";
    const userKey = () => `g-user-${turn}`;
    const modelKey = () => `g-model-${turn}`;
    /** a turn that said nothing is transcribed as "<no speech detected>": no bubble */
    const said = (t: string) => (/^\s*<[^<>]*>?\s*$/.test(t) ? "" : t);
    const finish = () => {
        if (userText) ev.onWords("user", userKey(), userText, true);
        if (modelText)
            ev.onWords("assistant", modelKey(), said(modelText), true);
        userText = "";
        modelText = "";
        turn++;
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
            const msg = JSON.parse(
                m.data instanceof Blob ? await m.data.text() : m.data,
            );
            if (msg.setupComplete) {
                if (!resume) {
                    // the page, as the first user turn, without a reply yet
                    const parts: object[] = [{ text: start.context }];
                    const jpeg = await image;
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
            const sc = msg.serverContent;
            if (sc) {
                for (const p of sc.modelTurn?.parts ?? [])
                    if (p.inlineData?.data) play(p.inlineData.data);
                if (sc.inputTranscription?.text) {
                    userText += sc.inputTranscription.text;
                    ev.onWords("user", userKey(), userText, false);
                    ev.onState("hearing");
                }
                if (sc.outputTranscription?.text) {
                    // the user's turn is over once the model answers it
                    if (userText && !modelText)
                        ev.onWords("user", userKey(), userText, true);
                    modelText += sc.outputTranscription.text;
                    if (said(modelText))
                        ev.onWords("assistant", modelKey(), modelText, false);
                }
                if (sc.interrupted) flush();
                if (sc.turnComplete) finish();
            }
            if (msg.toolCall) {
                const functionResponses = (
                    msg.toolCall.functionCalls ?? []
                ).map(
                    (fc: {
                        id: string;
                        name: string;
                        args?: { ids?: unknown };
                    }) => {
                        const ids = Array.isArray(fc.args?.ids)
                            ? fc.args.ids.filter((i) => typeof i === "string")
                            : [];
                        const shown = ev.onPoint(
                            modelText ? modelKey() : null,
                            ids as string[],
                        );
                        // SILENT: the model takes the result without a new turn (a
                        // field of the response, not of its payload)
                        return {
                            id: fc.id,
                            name: fc.name,
                            response: { shown },
                            scheduling: "SILENT",
                        };
                    },
                );
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
    return {
        stop: () => end(),
        say: (text) => {
            if (ws.readyState !== WebSocket.OPEN) return;
            ws.send(
                JSON.stringify({
                    clientContent: {
                        turns: [{ role: "user", parts: [{ text }] }],
                        turnComplete: true,
                    },
                }),
            );
        },
    };
}
