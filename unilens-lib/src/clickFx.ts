/**
 * Feedback for a click that asks UniLens: a ripple where it landed, then a breathing
 * orb on the same spot until the chat has it (the capture takes a moment). Both
 * sit on <html>, outside <body>, so no capture or inventory sees them, and they
 * never take a click. Colour: the highlight colour, with dark and light rims so it
 * reads on any page. Under reduced motion the ripple is a still ring and the orb
 * holds still.
 */
import { lookFrom } from "./highlightStyles";
import { getSettings } from "./settings";

const CSS = `
.ul-fx { position: fixed; z-index: 2147483647; pointer-events: none; box-sizing: border-box; border-radius: 50%; transform: translate(-50%, -50%); }
.ul-fx-ripple { width: 72px; height: 72px; border: 4px solid var(--ul-fx); box-shadow: 0 0 0 2px #000, inset 0 0 0 2px #000; animation: ul-fx-ripple .55s cubic-bezier(.22, 1, .36, 1) forwards; }
@keyframes ul-fx-ripple { from { transform: translate(-50%, -50%) scale(.2); opacity: 1; } to { transform: translate(-50%, -50%) scale(1); opacity: 0; } }
.ul-fx-orb { width: 112px; height: 112px; animation: ul-fx-in .35s cubic-bezier(.22, 1, .36, 1) both; }
.ul-fx-orb i { position: absolute; border-radius: 50%; inset: 0; margin: auto; }
.ul-fx-orb .halo { width: 112px; height: 112px; background: radial-gradient(closest-side, color-mix(in srgb, var(--ul-fx) 55%, transparent), transparent); animation: ul-fx-breathe 1.8s ease-in-out infinite; }
.ul-fx-orb .swirl { width: 70px; height: 70px; background: conic-gradient(from 0deg, var(--ul-fx), var(--ul-fx2), var(--ul-fx)); filter: blur(5px); opacity: .8; animation: ul-fx-turn 2.6s linear infinite; }
.ul-fx-orb .core { width: 30px; height: 30px; background: radial-gradient(circle at 35% 35%, #fff, var(--ul-fx) 45%, var(--ul-fx2)); box-shadow: 0 0 0 2px rgba(0, 0, 0, .75), 0 0 0 4px rgba(255, 255, 255, .85); animation: ul-fx-breathe 1.8s ease-in-out -.9s infinite; }
@keyframes ul-fx-in { from { transform: translate(-50%, -50%) scale(.3); opacity: 0; } to { transform: translate(-50%, -50%) scale(1); opacity: 1; } }
@keyframes ul-fx-breathe { 0%, 100% { transform: scale(.78); opacity: .75; } 50% { transform: scale(1.08); opacity: 1; } }
@keyframes ul-fx-turn { to { transform: rotate(1turn); } }
@media (prefers-reduced-motion: reduce) {
  .ul-fx-ripple { animation: none; opacity: .9; }
  .ul-fx-orb, .ul-fx-orb i { animation: none; }
}
`;

/** the second tone of the orb: the chat style's own accent */
const ACCENT = {
    assistant: "#2563eb",
    audioGuide: "#ffb000",
    station: "#0079c2",
};

let style: HTMLStyleElement | null = null;

function spot(kind: string, x: number, y: number): HTMLDivElement {
    if (!style?.isConnected) {
        style = document.createElement("style");
        style.textContent = CSS;
        document.head.appendChild(style);
    }
    const el = document.createElement("div");
    el.className = `ul-fx ${kind}`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    const st = getSettings();
    el.style.setProperty("--ul-fx", lookFrom(st).color);
    el.style.setProperty("--ul-fx2", ACCENT[st.chatStyle] ?? ACCENT.assistant);
    el.setAttribute("aria-hidden", "true");
    document.documentElement.appendChild(el);
    return el;
}

/** a ripple at (x, y) now, and a breathing orb there until the returned stop is called */
export function clickFeedback(x: number, y: number): () => void {
    const ripple = spot("ul-fx-ripple", x, y);
    setTimeout(() => ripple.remove(), 600);
    // a breathing orb in two tones until the chat has the capture: a soft halo, a
    // slowly turning gradient and a solid core, animated only by transform and
    // opacity so it keeps moving while the capture holds the main thread
    const orb = spot("ul-fx-orb", x, y);
    const s = getSettings();
    const layers = ["halo", s.fxSwirl && "swirl", s.fxCore && "core"];
    for (const layer of layers.filter(Boolean) as string[]) {
        const i = document.createElement("i");
        i.className = layer;
        orb.appendChild(i);
    }
    return () => orb.remove();
}
