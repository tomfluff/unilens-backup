import { afterEach, describe, expect, it, vi } from "vitest";
import {
    listen,
    pauseSpeaking,
    resumeSpeaking,
    speak,
    stopSpeaking,
} from "./speech";

/** a stand-in for the browser's SpeechRecognition that the test drives by hand */
class FakeRecognition {
    static last: FakeRecognition;
    lang = "";
    interimResults = false;
    onresult: (e: unknown) => void = () => {};
    onend: () => void = () => {};
    onerror: () => void = () => {};
    start = vi.fn();
    stop = vi.fn(() => this.onend());
    abort = vi.fn();
    constructor() {
        FakeRecognition.last = this;
    }
}

const w = window as unknown as { SpeechRecognition?: unknown };
afterEach(() => {
    w.SpeechRecognition = undefined;
    vi.unstubAllGlobals();
});

describe("listen", () => {
    it("ends once when the browser fires error and then end", () => {
        w.SpeechRecognition = FakeRecognition;
        const onEnd = vi.fn();
        listen(() => {}, onEnd);
        FakeRecognition.last.onerror();
        FakeRecognition.last.onend();
        expect(onEnd).toHaveBeenCalledTimes(1);
    });

    it("delivers on stop, and cancels without delivering", () => {
        w.SpeechRecognition = FakeRecognition;
        const onEnd = vi.fn();
        const stop = listen(() => {}, onEnd);
        stop?.();
        expect(onEnd).toHaveBeenCalledTimes(1);

        const onEnd2 = vi.fn();
        const cancel = listen(() => {}, onEnd2);
        cancel?.(true);
        expect(FakeRecognition.last.abort).toHaveBeenCalled();
        // whatever the browser fires after an abort, nothing is sent
        FakeRecognition.last.onend();
        expect(onEnd2).not.toHaveBeenCalled();
    });
});

/** a stand-in for WebAudio: pieces are recorded, and end when the test says so */
class FakeSource {
    buffer: { duration: number } | null = null;
    onended: (() => void) | null = null;
    startedAt = -1;
    stopped = false;
    connect() {}
    start(at: number) {
        this.startedAt = at;
    }
    stop() {
        this.stopped = true;
    }
}
class FakeAudioContext {
    static last: FakeAudioContext;
    currentTime = 0;
    state = "running";
    destination = {};
    sources: FakeSource[] = [];
    closed = false;
    constructor() {
        FakeAudioContext.last = this;
    }
    resume = vi.fn(async () => {
        this.state = "running";
    });
    suspend = vi.fn(async () => {
        this.state = "suspended";
    });
    close = vi.fn(async () => {
        this.closed = true;
        this.state = "closed";
    });
    createBuffer(_c: number, n: number, rate: number) {
        return {
            duration: n / rate,
            getChannelData: () => new Float32Array(n),
        };
    }
    createBufferSource() {
        const src = new FakeSource();
        this.sources.push(src);
        return src;
    }
}

/** a streamed PCM answer: the chunks, then the end */
const pcm = (...chunks: number[]) =>
    new Response(
        new ReadableStream({
            start(c) {
                for (const n of chunks) c.enqueue(new Uint8Array(n));
                c.close();
            },
        }),
        { headers: { "X-Audio-Sample-Rate": "24000" } },
    );

describe("speak", () => {
    afterEach(() => vi.unstubAllGlobals());
    const setup = () => {
        const synth = {
            speak: vi.fn(),
            cancel: vi.fn(),
            pause: vi.fn(),
            speaking: false,
            paused: false,
        };
        vi.stubGlobal("speechSynthesis", synth);
        vi.stubGlobal("SpeechSynthesisUtterance", class {});
        vi.stubGlobal("AudioContext", FakeAudioContext);
        return synth;
    };

    it("plays the reading as it arrives, then ends", async () => {
        setup();
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => pcm(14400, 14400, 2000)),
        );
        const states: string[] = [];
        await speak("hello", (s) => states.push(s));
        const ctx = FakeAudioContext.last;
        expect(states).toEqual(["loading", "playing"]);
        expect(ctx.sources.length).toBeGreaterThan(0);
        // pieces back to back, never in the past
        const starts = ctx.sources.map((s) => s.startedAt);
        expect(starts).toEqual([...starts].sort((a, b) => a - b));
        for (const src of ctx.sources) src.onended?.();
        expect(states.at(-1)).toBe("idle");
        expect(ctx.closed).toBe(true);
    });

    it("asks with a POST and plays whole samples only", async () => {
        setup();
        const fetcher = vi.fn(async () => pcm(14401, 1));
        vi.stubGlobal("fetch", fetcher);
        await speak("hello");
        expect((fetcher.mock.calls[0] as unknown[])[0]).toMatch(
            /\/api\/tts\/stream$/,
        );
        expect(
            ((fetcher.mock.calls[0] as unknown[])[1] as RequestInit).method,
        ).toBe("POST");
        const total = FakeAudioContext.last.sources.reduce(
            (n, s) => n + (s.buffer?.duration ?? 0) * 24000,
            0,
        );
        expect(Math.round(total)).toBe(7201);
    });

    it("drops a reading stopped while its answer was on the way", async () => {
        const synth = setup();
        let arrive: (r: Response) => void = () => {};
        vi.stubGlobal(
            "fetch",
            vi.fn(() => new Promise<Response>((r) => (arrive = r))),
        );
        const reading = speak("hello");
        const ctx = FakeAudioContext.last;
        stopSpeaking();
        arrive(pcm(20000));
        await reading;
        expect(ctx.sources).toHaveLength(0);
        expect(ctx.closed).toBe(true);
        expect(synth.speak).not.toHaveBeenCalled();
    });

    it("hands over to the browser's voice when the backend's cannot start, and pauses it", async () => {
        const synth = setup();
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => new Response("{}", { status: 502 })),
        );
        const states: string[] = [];
        await speak("hello", (s) => states.push(s));
        expect(synth.speak).toHaveBeenCalled();
        expect(states).not.toContain("idle");
        synth.speaking = true;
        pauseSpeaking();
        expect(synth.pause).toHaveBeenCalled();
    });

    it("uses the <audio> route of a backend without the streamed reading", async () => {
        setup();
        const fetcher = vi.fn(async (url: string) =>
            url.endsWith("/api/tts/stream")
                ? new Response("{}", { status: 404 })
                : new Response(JSON.stringify({ id: "x" })),
        );
        vi.stubGlobal("fetch", fetcher);
        const made: string[] = [];
        class OldAudio {
            paused = false;
            constructor(src: string) {
                made.push(src);
            }
            play() {
                return Promise.resolve();
            }
            pause() {
                this.paused = true;
            }
            removeAttribute() {}
            load() {}
        }
        vi.stubGlobal("Audio", OldAudio);
        await speak("hello");
        expect(made).toEqual(["/api/tts/x.mp3"]);
        expect(FakeAudioContext.last.closed).toBe(true);
    });

    it("reads with the browser's voice when the browser keeps the audio suspended", async () => {
        const synth = setup();
        class BlockedContext extends FakeAudioContext {
            state = "suspended";
            resume = vi.fn(() => new Promise<void>(() => {}));
        }
        vi.stubGlobal("AudioContext", BlockedContext);
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => pcm(14400)),
        );
        const states: string[] = [];
        await speak("hello", (s) => states.push(s));
        expect(states).not.toContain("playing");
        expect(synth.speak).toHaveBeenCalled();
        expect(FakeAudioContext.last.closed).toBe(true);
    });

    it("hands over to the browser's voice when the stream breaks before a sound", async () => {
        const synth = setup();
        vi.stubGlobal(
            "fetch",
            vi.fn(
                async () =>
                    new Response(
                        new ReadableStream({
                            start(c) {
                                c.enqueue(new Uint8Array(14400));
                            },
                            pull(c) {
                                c.error(new Error("connection lost"));
                            },
                        }),
                    ),
            ),
        );
        await speak("hello");
        // the first piece was scheduled 20 ms ahead and the context's clock has not moved
        expect(synth.speak).toHaveBeenCalled();
    });

    it("pauses and resumes the playing reading", async () => {
        setup();
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => pcm(14400)),
        );
        const states: string[] = [];
        await speak("hello", (s) => states.push(s));
        const ctx = FakeAudioContext.last;
        pauseSpeaking();
        expect(ctx.suspend).toHaveBeenCalled();
        expect(states.at(-1)).toBe("paused");
        resumeSpeaking();
        expect(ctx.resume).toHaveBeenCalled();
        expect(states.at(-1)).toBe("playing");
    });

    it("stops the pieces and closes the stream of a stopped reading", async () => {
        setup();
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => pcm(14400, 14400)),
        );
        await speak("hello");
        const ctx = FakeAudioContext.last;
        stopSpeaking();
        expect(ctx.sources.every((s) => s.stopped)).toBe(true);
        expect(ctx.closed).toBe(true);
    });

    it("keeps the new reading when the stopped one's piece reports its end late", async () => {
        setup();
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => pcm(14400)),
        );
        await speak("first");
        const first = FakeAudioContext.last;
        const states: string[] = [];
        await speak("second", (s) => states.push(s));
        const second = FakeAudioContext.last;
        first.sources[0].onended?.();
        expect(states.at(-1)).toBe("playing");
        pauseSpeaking();
        expect(second.suspend).toHaveBeenCalled();
    });
});

describe("a voice message the server turns into text", () => {
    /** a MediaRecorder the test drives: stop() flushes one chunk, then fires onstop */
    class FakeRecorder {
        static last: FakeRecorder | undefined;
        static isTypeSupported = () => true;
        state = "inactive";
        mimeType = "audio/webm";
        ondataavailable: (e: { data: Blob }) => void = () => {};
        onstop: () => void = () => {};
        constructor() {
            FakeRecorder.last = this;
        }
        start() {
            this.state = "recording";
        }
        stop = vi.fn(() => {
            this.state = "inactive";
            this.ondataavailable({ data: new Blob(["x"]) });
            queueMicrotask(() => this.onstop());
        });
    }
    const track = { stop: vi.fn() };
    /** the module with a mic and a recorder (read once, when it loads) */
    async function withMic() {
        FakeRecorder.last = undefined;
        track.stop.mockClear();
        vi.stubGlobal("MediaRecorder", FakeRecorder);
        Object.defineProperty(navigator, "mediaDevices", {
            configurable: true,
            value: { getUserMedia: async () => ({ getTracks: () => [track] }) },
        });
        vi.resetModules();
        return import("./speech");
    }
    afterEach(() => {
        Reflect.deleteProperty(navigator, "mediaDevices");
    });

    it("drops the message when Stop is pressed while it is being turned into text", async () => {
        const sp = await withMic();
        const fetch = vi.fn(
            (_url: string, init: RequestInit) =>
                new Promise((_res, reject) =>
                    init.signal?.addEventListener("abort", () =>
                        reject(new DOMException("aborted", "AbortError")),
                    ),
                ),
        );
        vi.stubGlobal("fetch", fetch);
        const onResult = vi.fn();
        const onEnd = vi.fn();
        const onError = vi.fn();
        const stop = sp.listenVoice(onResult, onEnd, "en", {
            engine: "openai",
            endOnPause: false,
            onError,
        });
        await vi.waitFor(() =>
            expect(FakeRecorder.last?.state).toBe("recording"),
        );
        stop?.(); // the message ends: it goes to the server
        await vi.waitFor(() => expect(fetch).toHaveBeenCalled());
        stop?.(); // Stop again, while it is being turned into text
        await vi.waitFor(() => expect(onEnd).toHaveBeenCalledWith(true));
        await new Promise((r) => setTimeout(r));
        expect(fetch.mock.calls[0][1].signal?.aborted).toBe(true);
        expect(onEnd).toHaveBeenCalledTimes(1);
        expect(onResult).not.toHaveBeenCalled();
        expect(onError).not.toHaveBeenCalled();
    });

    it("turns the mic off when the pause check cannot be set up", async () => {
        const sp = await withMic();
        vi.stubGlobal(
            "AudioContext",
            vi.fn(() => {
                throw new Error("no audio context");
            }),
        );
        const fetch = vi.fn();
        vi.stubGlobal("fetch", fetch);
        const onEnd = vi.fn();
        const onError = vi.fn();
        sp.listenVoice(() => {}, onEnd, "en", {
            engine: "openai",
            endOnPause: true,
            onError,
        });
        await vi.waitFor(() => expect(onEnd).toHaveBeenCalledTimes(1));
        expect(onError).toHaveBeenCalledTimes(1);
        expect(track.stop).toHaveBeenCalled();
        expect(FakeRecorder.last?.stop).toHaveBeenCalled();
        await new Promise((r) => setTimeout(r));
        expect(fetch).not.toHaveBeenCalled();
    });
});
