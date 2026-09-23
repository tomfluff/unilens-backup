/**
 * Earcons: a short sound for every chat action, so each one is heard as well as
 * seen (PRODUCT.md principle 2). Synthesized with WebAudio, no files; each under
 * 150ms and quiet. The palette follows the chat style: a soft pop for the
 * assistant, a keypad two-tone for the audio guide, a chime for station signs.
 */
import { getSettings, type Settings } from "./settings";

export type Earcon =
    | "press"
    | "chip"
    | "all"
    | "move"
    | "back"
    | "send"
    | "done"
    | "error"
    | "micOn"
    | "micOff"
    | "clear";

/** one tone: start and end frequency, start offset and length in seconds */
type Tone = {
    f: number;
    f2?: number;
    t: number;
    d: number;
    wave?: OscillatorType;
};

const C6 = 1047;
const E6 = 1319;
const G6 = 1568;

export const PALETTES: Record<Settings["chatStyle"], Record<Earcon, Tone[]>> = {
    assistant: {
        press: [{ f: 660, f2: 520, t: 0, d: 0.06 }],
        chip: [{ f: 740, t: 0, d: 0.05 }],
        all: [
            { f: 620, t: 0, d: 0.05 },
            { f: 820, t: 0.05, d: 0.06 },
        ],
        move: [{ f: 600, f2: 900, t: 0, d: 0.1 }],
        back: [{ f: 900, f2: 600, t: 0, d: 0.1 }],
        send: [{ f: 520, f2: 780, t: 0, d: 0.09 }],
        done: [
            { f: 660, t: 0, d: 0.06 },
            { f: 880, t: 0.07, d: 0.08 },
        ],
        error: [{ f: 330, f2: 220, t: 0, d: 0.14 }],
        micOn: [
            { f: 880, t: 0, d: 0.04 },
            { f: 880, t: 0.07, d: 0.04 },
        ],
        micOff: [{ f: 440, t: 0, d: 0.06 }],
        clear: [{ f: 500, f2: 400, t: 0, d: 0.07 }],
    },
    audioGuide: {
        press: [
            { f: 880, t: 0, d: 0.07, wave: "square" },
            { f: 660, t: 0, d: 0.07 },
        ],
        chip: [
            { f: 1336, t: 0, d: 0.06 },
            { f: 941, t: 0, d: 0.06 },
        ],
        all: [
            { f: 1209, t: 0, d: 0.05 },
            { f: 1477, t: 0.06, d: 0.05 },
        ],
        move: [{ f: 660, f2: 990, t: 0, d: 0.11, wave: "triangle" }],
        back: [{ f: 990, f2: 660, t: 0, d: 0.11, wave: "triangle" }],
        send: [
            { f: 880, t: 0, d: 0.05 },
            { f: 1100, t: 0.06, d: 0.05 },
        ],
        done: [
            { f: 660, t: 0, d: 0.06 },
            { f: 880, t: 0.07, d: 0.07 },
        ],
        error: [
            { f: 880, t: 0, d: 0.06 },
            { f: 440, t: 0.07, d: 0.08 },
        ],
        micOn: [{ f: 1209, t: 0, d: 0.05 }],
        micOff: [{ f: 697, t: 0, d: 0.06 }],
        clear: [{ f: 770, f2: 600, t: 0, d: 0.07 }],
    },
    station: {
        press: [{ f: C6, t: 0, d: 0.05, wave: "triangle" }],
        chip: [{ f: E6, t: 0, d: 0.06, wave: "triangle" }],
        all: [
            { f: C6, t: 0, d: 0.05, wave: "triangle" },
            { f: G6, t: 0.06, d: 0.06, wave: "triangle" },
        ],
        move: [
            { f: C6, t: 0, d: 0.04, wave: "triangle" },
            { f: E6, t: 0.04, d: 0.04, wave: "triangle" },
            { f: G6, t: 0.08, d: 0.05, wave: "triangle" },
        ],
        back: [
            { f: G6, t: 0, d: 0.04, wave: "triangle" },
            { f: E6, t: 0.04, d: 0.04, wave: "triangle" },
            { f: C6, t: 0.08, d: 0.05, wave: "triangle" },
        ],
        send: [{ f: E6, t: 0, d: 0.05, wave: "triangle" }],
        done: [
            { f: C6, t: 0, d: 0.07, wave: "triangle" },
            { f: E6, t: 0.08, d: 0.07, wave: "triangle" },
        ],
        error: [
            { f: E6, t: 0, d: 0.06, wave: "triangle" },
            { f: 523, t: 0.07, d: 0.08, wave: "triangle" },
        ],
        micOn: [{ f: G6, t: 0, d: 0.05, wave: "triangle" }],
        micOff: [{ f: 523, t: 0, d: 0.06, wave: "triangle" }],
        clear: [{ f: 880, f2: 700, t: 0, d: 0.07, wave: "triangle" }],
    },
};

const GAIN = 0.05;
let ctx: AudioContext | null = null;

/** play an action's sound in the current style; silent when sounds are off or unavailable */
export function earcon(kind: Earcon) {
    const s = getSettings();
    if (!s.sounds) return;
    const tones = PALETTES[s.chatStyle]?.[kind];
    if (!tones) return;
    try {
        const AC =
            window.AudioContext ??
            (window as unknown as { webkitAudioContext?: typeof AudioContext })
                .webkitAudioContext;
        if (!AC) return;
        ctx ??= new AC();
        const t0 = ctx.currentTime + 0.01;
        for (const tone of tones) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = tone.wave ?? "sine";
            osc.frequency.setValueAtTime(tone.f, t0 + tone.t);
            if (tone.f2)
                osc.frequency.exponentialRampToValueAtTime(
                    tone.f2,
                    t0 + tone.t + tone.d,
                );
            // quick attack and release: no clicks at the edges
            gain.gain.setValueAtTime(0, t0 + tone.t);
            gain.gain.linearRampToValueAtTime(GAIN, t0 + tone.t + 0.008);
            gain.gain.exponentialRampToValueAtTime(
                0.0001,
                t0 + tone.t + tone.d,
            );
            osc.connect(gain).connect(ctx.destination);
            osc.start(t0 + tone.t);
            osc.stop(t0 + tone.t + tone.d + 0.02);
        }
    } catch {
        /* no audio here (a blocked autoplay, a test runner): the visible status still shows it */
    }
}
