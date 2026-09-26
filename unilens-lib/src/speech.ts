/**
 * Browser-native voice: speechSynthesis for TTS, SpeechRecognition for STT.
 * Zero backend / zero cost v1 — the popover buttons are engine-agnostic, so an
 * API-based backend (assets26 pattern) can replace this later without UI change.
 */

import { getSettings } from "./settings";

/** ja if the text contains kana/kanji, else the browser locale */
function guessLang(text: string): string {
    return /[぀-ヿ一-鿿]/.test(text) ? "ja-JP" : navigator.language || "en-US";
}

/** markdown-ish reply → speakable plain text */
function toSpeakable(text: string): string {
    return text
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/^[-*•] /gm, "")
        .replace(/^#{1,4} /gm, "");
}

let backendUrl = "";
let audioEl: HTMLAudioElement | null = null;
let stateCb: ((s: SpeechState) => void) | null = null;
/** bumped by every stop (and so by every new reading): a reading whose audio comes back
 *  after that is dropped, not played over the silence or the newer one */
let reading = 0;

export type SpeechState = "loading" | "playing" | "paused" | "idle";

/** set by init() — enables API TTS (better mixed-language voices) */
export function setSpeechBackend(url: string) {
    backendUrl = url;
}

function setState(s: SpeechState) {
    stateCb?.(s);
    if (s === "idle") stateCb = null;
}

function speakNative(text: string, mine: number) {
    const u = new SpeechSynthesisUtterance(toSpeakable(text));
    u.lang = guessLang(text);
    // a cancelled utterance can report late: only the current reading's events count
    u.onstart = () => {
        if (mine === reading) setState("playing");
    };
    u.onend = u.onerror = () => {
        if (mine === reading) setState("idle");
    };
    speechSynthesis.speak(u);
}

/**
 * API voice first (streamed mp3, plays while downloading; handles mixed ja/en);
 * native fallback on any failure. onState tracks loading → playing → idle.
 */
export async function speak(text: string, onState?: (s: SpeechState) => void) {
    stopSpeaking();
    const mine = reading;
    stateCb = onState ?? null;
    setStateSafe("loading");
    const plain = toSpeakable(text);
    try {
        const res = await fetch(`${backendUrl}/api/tts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // the voice chosen in the AI settings; the backend checks it
            body: JSON.stringify({
                text: plain,
                voice: getSettings().ttsVoice || undefined,
            }),
        });
        if (!res.ok) throw new Error(`tts ${res.status}`);
        const { id } = await res.json();
        if (mine !== reading) return;
        const el = new Audio(
            `${backendUrl}/api/tts/${encodeURIComponent(id)}.mp3`,
        );
        audioEl = el;
        // media events arrive late: one from a stopped reading must not touch the next,
        // and a "playing" queued before a pause must not undo it
        let started = false;
        el.onplaying = () => {
            if (audioEl !== el || el.paused) return;
            started = true;
            setState("playing");
        };
        el.onended = () => {
            if (audioEl !== el) return;
            audioEl = null;
            setState("idle");
        };
        // a load failure also rejects play(), whose catch hands the reading to the
        // browser's voice: only a failure mid-reading ends it here
        el.onerror = () => {
            if (audioEl !== el || !started) return;
            audioEl = null;
            setState("idle");
        };
        await el.play();
    } catch (err) {
        // a stop or a pause interrupts play() (AbortError): not a failure to read aloud
        if (mine === reading && (err as Error)?.name !== "AbortError") {
            // the browser's voice takes over: pause and resume must reach it, not the
            // audio that failed
            audioEl = null;
            speakNative(text, mine);
        }
    }
}

function setStateSafe(s: SpeechState) {
    stateCb?.(s);
}

export function stopSpeaking() {
    reading++;
    speechSynthesis.cancel();
    if (audioEl) {
        audioEl.pause();
        // a paused element keeps downloading, and the backend streams each reading
        // live: drop the source so the stream closes (six held streams exhaust the
        // browser's connections to the backend, and every reading after waits forever)
        audioEl.removeAttribute("src");
        audioEl.load();
        audioEl = null;
    }
    setState("idle");
}

/** hold the reading where it is; resumeSpeaking carries on from there */
export function pauseSpeaking() {
    if (audioEl && !audioEl.paused) {
        audioEl.pause();
        setStateSafe("paused");
    } else if (speechSynthesis.speaking && !speechSynthesis.paused) {
        speechSynthesis.pause();
        setStateSafe("paused");
    }
}

export function resumeSpeaking() {
    if (audioEl?.paused) {
        void audioEl.play();
        setStateSafe("playing");
    } else if (speechSynthesis.paused) {
        speechSynthesis.resume();
        setStateSafe("playing");
    }
}

export function isSpeaking(): boolean {
    return speechSynthesis.speaking || (audioEl != null && !audioEl.paused);
}

// ── STT ────────────────────────────────────────────────────────────────────
type RecognitionCtor = new () => {
    lang: string;
    interimResults: boolean;
    onresult: (e: {
        results: ArrayLike<ArrayLike<{ transcript: string }>>;
    }) => void;
    onend: () => void;
    onerror: () => void;
    start: () => void;
    stop: () => void;
    abort?: () => void;
};

function recognitionCtor(): RecognitionCtor | null {
    const w = window as unknown as {
        SpeechRecognition?: RecognitionCtor;
        webkitSpeechRecognition?: RecognitionCtor;
    };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const sttSupported = recognitionCtor() != null;

/**
 * Start listening; transcript goes to onResult as it firms up, onEnd fires once when
 * recognition stops (silence, stop() or an error: Chrome fires error then end).
 * Returns a stop function, or null if unsupported. stop(true) cancels: nothing is
 * delivered and onEnd never fires (the chat closed mid-sentence).
 */
export function listen(
    onResult: (transcript: string) => void,
    onEnd: () => void,
    lang?: string,
): ((cancel?: boolean) => void) | null {
    const Ctor = recognitionCtor();
    if (!Ctor) return null;
    const rec = new Ctor();
    rec.lang = lang || navigator.language || "en-US";
    rec.interimResults = true;
    rec.onresult = (e) => {
        let text = "";
        for (let i = 0; i < e.results.length; i++)
            text += e.results[i][0].transcript;
        onResult(text);
    };
    let done = false;
    const end = () => {
        if (done) return;
        done = true;
        onEnd();
    };
    rec.onend = end;
    rec.onerror = end;
    rec.start();
    return (cancel = false) => {
        if (!cancel) return rec.stop();
        done = true;
        if (rec.abort) rec.abort();
        else rec.stop();
    };
}

// ── STT through the backend: record, then transcribe ──────────────────────────
// For browsers without their own recognition (Firefox), or when the AI settings
// choose a provider (R1 of the 2026-09-26 report). No words appear while speaking:
// the field fills once the recording is turned into text.

/** the browser can record a message for the backend to transcribe */
export const serverSttSupported =
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function" &&
    typeof MediaRecorder !== "undefined";

export type SttEngine = "auto" | "browser" | "openai" | "gemini";

/** how a voice message is heard with this engine here, or null when it cannot be */
export function voiceEngine(engine: SttEngine): "browser" | "server" | null {
    if (engine === "browser") return sttSupported ? "browser" : null;
    if (engine === "auto" && sttSupported) return "browser";
    return serverSttSupported ? "server" : null;
}

export interface VoiceOptions {
    engine: SttEngine;
    /** the server's speech model (from the AI settings); "" = the backend's default */
    model?: string;
    /** end the message on a pause ("send what I say when I pause") */
    endOnPause: boolean;
    /** the recording went to the server to be turned into text */
    onTranscribing?: () => void;
    /** the recording could not be heard or turned into text */
    onError?: (detail: string) => void;
}

/** a voice message by whichever engine the settings and the browser allow */
export function listenVoice(
    onResult: (transcript: string) => void,
    /** stopped: the message was dropped by Stop while it was being turned into text */
    onEnd: (stopped?: boolean) => void,
    lang: string | undefined,
    opts: VoiceOptions,
): ((cancel?: boolean) => void) | null {
    const how = voiceEngine(opts.engine);
    if (how === "browser") return listen(onResult, onEnd, lang);
    if (how === "server") return record(onResult, onEnd, lang, opts);
    return null;
}

/** ponytail: a fixed level for "speaking"; a calibration step if rooms are noisy */
const SPEAKING_RMS = 0.02;
const PAUSE_MS = 1200;
const MAX_MESSAGE_MS = 60_000;

function record(
    onResult: (transcript: string) => void,
    onEnd: (stopped?: boolean) => void,
    lang: string | undefined,
    opts: VoiceOptions,
): (cancel?: boolean) => void {
    let done = false;
    let cancelled = false;
    let stream: MediaStream | null = null;
    let recorder: MediaRecorder | null = null;
    let ctx: AudioContext | null = null;
    let timer: number | undefined;
    const aborter = new AbortController();
    const chunks: Blob[] = [];
    const finish = (stopped = false) => {
        if (done) return;
        done = true;
        onEnd(stopped);
    };
    // the mic light goes off as soon as the recording ends
    const release = () => {
        window.clearInterval(timer);
        for (const t of stream?.getTracks() ?? []) t.stop();
        void ctx?.close().catch(() => {});
        ctx = null;
    };
    const stop = () => {
        if (recorder && recorder.state !== "inactive") {
            window.clearInterval(timer); // the pause check stops once, not twice
            recorder.stop();
            return;
        }
        // before the mic was granted nothing was said; while the recording is being
        // turned into text, Stop drops it (auto-send would otherwise still send it)
        cancelled = true;
        aborter.abort();
        release();
        finish(true);
    };
    navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((s) => {
            if (cancelled) {
                for (const t of s.getTracks()) t.stop();
                return;
            }
            stream = s;
            const type = [
                "audio/webm;codecs=opus",
                "audio/ogg;codecs=opus",
                "audio/mp4",
            ].find((t) => MediaRecorder.isTypeSupported(t));
            const rec = new MediaRecorder(
                s,
                type ? { mimeType: type } : undefined,
            );
            recorder = rec;
            rec.ondataavailable = (e) => {
                if (e.data.size) chunks.push(e.data);
            };
            rec.onstop = async () => {
                release();
                if (cancelled) return;
                const blob = new Blob(chunks, {
                    type: rec.mimeType || type || "audio/webm",
                });
                if (!blob.size) return finish();
                opts.onTranscribing?.();
                try {
                    const q = new URLSearchParams({
                        lang: (lang ?? "").slice(0, 2),
                    });
                    if (opts.engine === "openai" || opts.engine === "gemini")
                        q.set("provider", opts.engine);
                    if (opts.model) q.set("model", opts.model);
                    const res = await fetch(`${backendUrl}/api/stt?${q}`, {
                        method: "POST",
                        headers: { "Content-Type": blob.type.split(";")[0] },
                        body: blob,
                        signal: aborter.signal,
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok)
                        throw new Error(data.error ?? `HTTP ${res.status}`);
                    if (!cancelled && data.text) onResult(data.text);
                } catch (err) {
                    if (!cancelled) opts.onError?.(String(err));
                }
                if (!cancelled) finish();
            };
            rec.start(250);
            const started = performance.now();
            // a pause ends the message: once speech was heard, PAUSE_MS under the level
            let level: (() => number) | null = null;
            if (opts.endOnPause) {
                ctx = new AudioContext();
                void ctx.resume();
                const an = ctx.createAnalyser();
                an.fftSize = 1024;
                ctx.createMediaStreamSource(s).connect(an);
                const buf = new Float32Array(an.fftSize);
                level = () => {
                    an.getFloatTimeDomainData(buf);
                    let sum = 0;
                    for (const v of buf) sum += v * v;
                    return Math.sqrt(sum / buf.length);
                };
            }
            let spoke = false;
            let quietSince = 0;
            timer = window.setInterval(() => {
                const now = performance.now();
                if (now - started > MAX_MESSAGE_MS) return stop();
                if (!level) return;
                if (level() > SPEAKING_RMS) {
                    spoke = true;
                    quietSince = 0;
                } else if (spoke) {
                    quietSince ||= now;
                    if (now - quietSince > PAUSE_MS) stop();
                }
            }, 100);
        })
        .catch((err) => {
            // no mic, permission refused, or the recorder or pause check failed to set
            // up: the mic goes off, and nothing is sent
            if (cancelled) return;
            cancelled = true;
            if (recorder && recorder.state !== "inactive") recorder.stop();
            release();
            opts.onError?.(String(err));
            finish();
        });
    return (cancel = false) => {
        if (!cancel) return stop();
        cancelled = true;
        done = true;
        aborter.abort();
        if (recorder && recorder.state !== "inactive") recorder.stop();
        release();
    };
}
