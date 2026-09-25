/**
 * Browser-native voice: speechSynthesis for TTS, SpeechRecognition for STT.
 * Zero backend / zero cost v1 — the popover buttons are engine-agnostic, so an
 * API-based backend (assets26 pattern) can replace this later without UI change.
 */

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
            body: JSON.stringify({ text: plain }),
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
