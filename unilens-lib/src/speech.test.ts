import { afterEach, describe, expect, it, vi } from "vitest";
import { listen } from "./speech";

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
