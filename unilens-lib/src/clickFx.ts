/**
 * Feedback for a click that asks UniLens: a ripple where it landed, then a turning
 * ring on the same spot until the chat has it (the capture takes a moment). Both
 * sit on <html>, outside <body>, so no capture or inventory sees them, and they
 * never take a click. Colour: the highlight colour, with dark and light rims so it
 * reads on any page. Under reduced motion the ripple is a still ring and the
 * waiting ring does not turn.
 */
import { lookFrom } from "./highlightStyles";
import { getSettings } from "./settings";

const CSS = `
.ul-fx { position: fixed; z-index: 2147483647; pointer-events: none; box-sizing: border-box; border-radius: 50%; transform: translate(-50%, -50%); }
.ul-fx-ripple { width: 72px; height: 72px; border: 4px solid var(--ul-fx); box-shadow: 0 0 0 2px #000, inset 0 0 0 2px #000; animation: ul-fx-ripple .55s cubic-bezier(.22, 1, .36, 1) forwards; }
@keyframes ul-fx-ripple { from { transform: translate(-50%, -50%) scale(.2); opacity: 1; } to { transform: translate(-50%, -50%) scale(1); opacity: 0; } }
.ul-fx-wait { width: 44px; height: 44px; border: 5px solid rgba(0, 0, 0, .45); border-top-color: var(--ul-fx); box-shadow: 0 0 0 2px rgba(255, 255, 255, .85); animation: ul-fx-spin .8s linear infinite; }
@keyframes ul-fx-spin { to { transform: translate(-50%, -50%) rotate(1turn); } }
@media (prefers-reduced-motion: reduce) {
  .ul-fx-ripple { animation: none; opacity: .9; }
  .ul-fx-wait { animation: none; border-color: var(--ul-fx); }
}
`;

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
    el.style.setProperty("--ul-fx", lookFrom(getSettings()).color);
    el.setAttribute("aria-hidden", "true");
    document.documentElement.appendChild(el);
    return el;
}

/** a ripple at (x, y) now, and a waiting ring there until the returned stop is called */
export function clickFeedback(x: number, y: number): () => void {
    const ripple = spot("ul-fx-ripple", x, y);
    setTimeout(() => ripple.remove(), 600);
    const wait = spot("ul-fx-wait", x, y);
    return () => wait.remove();
}
