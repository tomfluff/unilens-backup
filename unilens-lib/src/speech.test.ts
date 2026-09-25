import { afterEach, describe, expect, it, vi } from "vitest";
import { listen, pauseSpeaking, speak, stopSpeaking } from "./speech";

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

describe("speak", () => {
    it("drops a reading stopped while its audio was on the way", async () => {
        let arrive: (r: Response) => void = () => {};
        vi.stubGlobal(
            "fetch",
            vi.fn(() => new Promise<Response>((r) => (arrive = r))),
        );
        const synth = { speak: vi.fn(), cancel: vi.fn() };
        vi.stubGlobal("speechSynthesis", synth);
        const audio = vi.fn();
        vi.stubGlobal("Audio", audio);
        const reading = speak("hello");
        stopSpeaking();
        arrive(new Response(JSON.stringify({ id: "x" })));
        await reading;
        expect(audio).not.toHaveBeenCalled();
        expect(synth.speak).not.toHaveBeenCalled();
    });

    it("does not switch to the browser's voice when a pause cuts play() short", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => new Response(JSON.stringify({ id: "x" }))),
        );
        const synth = { speak: vi.fn(), cancel: vi.fn() };
        vi.stubGlobal("speechSynthesis", synth);
        let started: () => void = () => {};
        const playing = new Promise<void>((r) => (started = r));
        class FakeAudio {
            paused = false;
            reject: (e: Error) => void = () => {};
            play() {
                started();
                return new Promise<void>((_, reject) => (this.reject = reject));
            }
            pause() {
                this.paused = true;
                this.reject(new DOMException("interrupted", "AbortError"));
            }
        }
        vi.stubGlobal("Audio", FakeAudio);
        const reading = speak("hello");
        await playing;
        pauseSpeaking();
        await reading;
        expect(synth.speak).not.toHaveBeenCalled();
    });

    it("pauses the browser's voice once it has taken over from failed audio", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => new Response(JSON.stringify({ id: "x" }))),
        );
        const synth = {
            speak: vi.fn(),
            cancel: vi.fn(),
            pause: vi.fn(),
            speaking: true,
            paused: false,
        };
        vi.stubGlobal("speechSynthesis", synth);
        vi.stubGlobal("SpeechSynthesisUtterance", class {});
        class BlockedAudio {
            paused = false;
            play() {
                return Promise.reject(
                    new DOMException("no", "NotAllowedError"),
                );
            }
            pause = vi.fn();
        }
        vi.stubGlobal("Audio", BlockedAudio);
        await speak("hello");
        expect(synth.speak).toHaveBeenCalled();
        pauseSpeaking();
        expect(synth.pause).toHaveBeenCalled();
    });

    it("keeps the new reading when the stopped one's audio reports its end late", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => new Response(JSON.stringify({ id: "x" }))),
        );
        vi.stubGlobal("speechSynthesis", { speak: vi.fn(), cancel: vi.fn() });
        const made: LateAudio[] = [];
        class LateAudio {
            paused = false;
            onended: (() => void) | null = null;
            constructor() {
                made.push(this);
            }
            play() {
                return Promise.resolve();
            }
            pause = vi.fn(() => {
                this.paused = true;
            });
        }
        vi.stubGlobal("Audio", LateAudio);
        await speak("first");
        await speak("second");
        made[0].onended?.();
        pauseSpeaking();
        expect(made[1].pause).toHaveBeenCalled();
    });

    it("keeps the controls when audio that fails to load hands over to the browser's voice", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => new Response(JSON.stringify({ id: "x" }))),
        );
        const synth = { speak: vi.fn(), cancel: vi.fn() };
        vi.stubGlobal("speechSynthesis", synth);
        vi.stubGlobal("SpeechSynthesisUtterance", class {});
        class MissingAudio {
            paused = true;
            onerror: (() => void) | null = null;
            play() {
                // the browser reports the load error, then rejects play()
                this.onerror?.();
                return Promise.reject(
                    new DOMException("no source", "NotSupportedError"),
                );
            }
            pause() {}
        }
        vi.stubGlobal("Audio", MissingAudio);
        const states: string[] = [];
        await speak("hello", (s) => states.push(s));
        expect(synth.speak).toHaveBeenCalled();
        expect(states).not.toContain("idle");
    });
});
