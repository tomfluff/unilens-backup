/**
 * Feedback for a click that asks UniLens (explored in the "Click Feedback Studies"
 * mockups): a ripple where it landed, then a "working" state while the page is
 * captured, then an ending as the chat takes it. The setting `clickFx` picks one:
 *
 *   orb     a breathing orb at the click: halo, turning two-tone swirl, glossy core
 *   aurora  a soft colour body at the click
 *   sonar   a solid beacon sending out rings
 *   frame   a frame and a scanning sheen on what was clicked
 *   edge    the screen's edge glows (the whole page is being read), a pin at the click
 *
 * Shared knobs: the ending (fade, fly into the chat, a found pulse, or the style's
 * own), size, speed and the ripple. Each style has its own knobs too (settings.ts).
 *
 * All of it sits on <html>, outside <body>, so no capture or inventory sees it, and
 * it never takes a click. It moves by transform and opacity only, so it keeps moving
 * while the capture holds the main thread. Under reduced motion it holds still and
 * ends without flying.
 */
import { lookFrom } from "./highlightStyles";
import { getSettings, type Settings } from "./settings";
import { reducedMotion } from "./zoom";

type Box = { left: number; top: number; width: number; height: number };
type Ending = Exclude<Settings["fxEnding"], "auto">;

/** each style's own ending, used when the ending setting is "the style's own" */
const OWN_ENDING: Record<Settings["clickFx"], Ending> = {
    orb: "fade",
    aurora: "fly",
    sonar: "found",
    frame: "fly",
    edge: "fade",
};

/** speed setting → a multiplier on every duration */
const TEMPO: Record<Settings["fxSpeed"], number> = {
    calm: 1.5,
    normal: 1,
    lively: 0.65,
};

// durations are calc(… * var(--t)): the speed setting; sizes use scale: var(--k)
const CSS = `
.ul-fx { position: fixed; z-index: 2147483647; pointer-events: none; box-sizing: border-box; }
.ul-fx *, .ul-fx *::before, .ul-fx *::after { box-sizing: border-box; }
/* centred on the click whatever it scales to: the centring lives in the translate
   property, which applies outside scale and transform, and scaling is about the
   element's own centre (size setting: scale; animations: transform) */
.ul-fx-at { translate: -50% -50%; transform-origin: 50% 50%; scale: var(--k, 1); }
.ul-fx i { position: absolute; display: block; border-radius: 50%; }
.ul-fx-ripple { width: 72px; height: 72px; border-radius: 50%; border: 4px solid var(--ul-fx); box-shadow: 0 0 0 2px #000, inset 0 0 0 2px #000; animation: ul-fx-ripple .55s cubic-bezier(.22, 1, .36, 1) forwards; }
@keyframes ul-fx-ripple { from { transform: scale(.2); opacity: 1; } to { transform: scale(1); opacity: 0; } }
@keyframes ul-fx-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes ul-fx-breathe { 0%, 100% { transform: scale(.78); opacity: .75; } 50% { transform: scale(1.08); opacity: 1; } }
@keyframes ul-fx-turn { to { transform: rotate(1turn); } }

/* orb */
.ul-fx-orb { width: 112px; height: 112px; animation: ul-fx-in .3s both; }
.ul-fx-orb i { inset: 0; margin: auto; }
.ul-fx-orb .halo { width: 112px; height: 112px; background: radial-gradient(closest-side, color-mix(in srgb, var(--ul-fx) 55%, transparent), transparent); animation: ul-fx-breathe calc(1.8s * var(--t, 1)) ease-in-out infinite; }
.ul-fx-orb .swirl { width: 70px; height: 70px; background: conic-gradient(var(--ul-fx), var(--ul-fx2), var(--ul-fx)); filter: blur(5px); opacity: .8; animation: ul-fx-turn calc(2.6s * var(--t, 1)) linear infinite; }
.ul-fx-orb .core { width: 30px; height: 30px; background: radial-gradient(circle at 35% 35%, #fff, var(--ul-fx) 45%, var(--ul-fx2)); box-shadow: 0 0 0 2px rgba(0, 0, 0, .75), 0 0 0 4px rgba(255, 255, 255, .85); animation: ul-fx-breathe calc(1.8s * var(--t, 1)) ease-in-out calc(-.9s * var(--t, 1)) infinite; }

/* aurora */
.ul-fx-aurora { width: 170px; height: 170px; animation: ul-fx-in .35s both; }
.ul-fx-aurora .body { position: absolute; inset: 0; animation: ul-fx-swell calc(1.6s * var(--t, 1)) ease-in-out infinite; }
.ul-fx-aurora .spin { position: absolute; inset: 0; animation: ul-fx-turn calc(3.2s * var(--t, 1)) linear infinite; }
.ul-fx-aurora .spin.two { animation-duration: calc(4.4s * var(--t, 1)); animation-direction: reverse; }
.ul-fx-aurora .spin i { width: 96px; height: 96px; filter: blur(var(--soft, 16px)); opacity: .85; }
.ul-fx-aurora .a1 { left: 10px; top: 28px; background: var(--ul-fx); }
.ul-fx-aurora .a2 { right: 8px; top: 40px; background: var(--ul-fx2); }
.ul-fx-aurora .spin .a3 { left: 38px; bottom: 6px; background: #ff7a59; opacity: .6; }
.ul-fx-aurora .glow { left: 52px; top: 52px; width: 66px; height: 66px; background: #fff; filter: blur(calc(var(--soft, 16px) * .75)); opacity: .9; }
.ul-fx-aurora .dot { left: 77px; top: 77px; width: 16px; height: 16px; background: #111; border: 3px solid #fff; animation: ul-fx-breathe calc(1.6s * var(--t, 1)) ease-in-out infinite; }
@keyframes ul-fx-swell { 0%, 100% { transform: scale(.86); } 50% { transform: scale(1.04); } }

/* sonar */
.ul-fx-sonar { width: 0; height: 0; }
.ul-fx-sonar i { left: -75px; top: -75px; width: 150px; height: 150px; background: radial-gradient(closest-side, color-mix(in srgb, var(--ul-fx) 10%, transparent) 55%, color-mix(in srgb, var(--ul-fx) 70%, transparent) 88%, transparent); box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--ul-fx2) 60%, transparent); transform: scale(.15); opacity: 0; animation: ul-fx-ping calc(1.8s * var(--t, 1)) cubic-bezier(.22, 1, .36, 1) infinite; }
.ul-fx-sonar.outline i { background: none; border: 4px solid var(--ul-fx); box-shadow: 0 0 0 2px #000, inset 0 0 0 2px #000; }
.ul-fx-sonar .c { left: -13px; top: -13px; width: 26px; height: 26px; background: var(--ul-fx) !important; border: 0 !important; box-shadow: 0 0 0 3px #000, 0 0 0 6px #fff !important; transform: none; opacity: 1; animation: none; }
@keyframes ul-fx-ping { 0% { transform: scale(.15); opacity: .95; } 100% { transform: scale(1); opacity: 0; } }

/* frame: corner brackets by default, or the highlight's own outline */
.ul-fx-frame { transform-origin: 0 0; animation: ul-fx-in .2s both, ul-fx-hug calc(1.4s * var(--t, 1)) ease-in-out infinite; }
.ul-fx-frame.still { animation: ul-fx-in .2s both; }
.ul-fx-frame .br { position: absolute; width: calc(22px * var(--k, 1)); height: calc(22px * var(--k, 1)); border: calc(5px * var(--k, 1)) solid var(--ul-fx); border-radius: 0; filter: drop-shadow(0 0 1.5px #000) drop-shadow(0 0 1.5px #000); }
.ul-fx-frame .tl { left: -12px; top: -12px; border-right: 0; border-bottom: 0; }
.ul-fx-frame .tr { right: -12px; top: -12px; border-left: 0; border-bottom: 0; }
.ul-fx-frame .bl { left: -12px; bottom: -12px; border-right: 0; border-top: 0; }
.ul-fx-frame .bb { right: -12px; bottom: -12px; border-left: 0; border-top: 0; }
.ul-fx-frame.band { border: calc(5px * var(--k, 1)) solid var(--ul-fx); border-radius: 4px; box-shadow: 0 0 0 2px #000, inset 0 0 0 2px #000; }
.ul-fx-frame.ring { border: calc(3px * var(--k, 1)) solid #000; border-radius: 4px; box-shadow: 0 0 0 calc(3px * var(--k, 1)) #fff; }
.ul-fx-frame.underline::after { content: ""; position: absolute; left: 0; right: 0; bottom: -10px; height: calc(5px * var(--k, 1)); background: var(--ul-fx); box-shadow: 0 0 0 2px #000; }
.ul-fx-frame .sheen { position: absolute; inset: 0; overflow: hidden; border-radius: 3px; }
.ul-fx-frame .sheen::before { content: ""; position: absolute; top: -20%; bottom: -20%; width: 45%; background: linear-gradient(100deg, transparent, color-mix(in srgb, var(--ul-fx) 55%, transparent) 45%, rgba(255, 255, 255, .7) 50%, color-mix(in srgb, var(--ul-fx2) 35%, transparent) 60%, transparent); transform: translateX(-120%); animation: ul-fx-sweep calc(1.2s * var(--t, 1)) cubic-bezier(.45, 0, .2, 1) infinite; }
@keyframes ul-fx-hug { 0%, 100% { scale: 1.04; } 50% { scale: 1; } }
@keyframes ul-fx-sweep { to { transform: translateX(340%); } }

/* edge */
.ul-fx-edge { inset: 0; animation: ul-fx-in .35s both; }
.ul-fx-edge .strip { position: absolute; overflow: hidden; filter: blur(calc(var(--ew, 18px) * .4)); }
.ul-fx-edge .strip::before { content: ""; position: absolute; top: 0; bottom: 0; left: 0; width: 300%; background: repeating-linear-gradient(90deg, var(--ul-fx) 0 12%, var(--ul-fx2) 22%, var(--ul-fx3) 30%, var(--ul-fx) 40% 50%); animation: ul-fx-flow calc(2.4s * var(--t, 1)) linear infinite; }
.ul-fx-edge.plain .strip::before { background: var(--ul-fx); animation: none; }
.ul-fx-edge .t { left: 0; right: 0; top: calc(var(--ew, 18px) / -3); height: var(--ew, 18px); }
.ul-fx-edge .b { left: 0; right: 0; bottom: calc(var(--ew, 18px) / -3); height: var(--ew, 18px); }
.ul-fx-edge .l { top: 0; bottom: 0; left: calc(var(--ew, 18px) / -3); width: var(--ew, 18px); }
.ul-fx-edge .r { top: 0; bottom: 0; right: calc(var(--ew, 18px) / -3); width: var(--ew, 18px); }
.ul-fx-edge .l::before, .ul-fx-edge .r::before { right: 0; bottom: auto; width: auto; height: 300%; background: repeating-linear-gradient(180deg, var(--ul-fx) 0 12%, var(--ul-fx2) 22%, var(--ul-fx3) 30%, var(--ul-fx) 40% 50%); animation-name: ul-fx-flowv; }
@keyframes ul-fx-flow { to { transform: translateX(-33.333%); } }
@keyframes ul-fx-flowv { to { transform: translateY(-33.333%); } }
.ul-fx-pin { width: 22px; height: 22px; }
.ul-fx-pin > i { inset: 0; background: var(--ul-fx); box-shadow: 0 0 0 3px #000, 0 0 0 6px #fff; animation: ul-fx-breathe calc(1.6s * var(--t, 1)) ease-in-out infinite; }

/* endings: the same three for every style */
.ul-fx-fade { opacity: 0 !important; transition: opacity .35s ease; }
.ul-fx-fly.ul-fx-at { translate: calc(-50% + var(--dx, 0px)) calc(-50% + var(--dy, 0px)); scale: calc(var(--k, 1) * .12); opacity: 0 !important; transition: translate .6s cubic-bezier(.65, 0, .35, 1), scale .6s cubic-bezier(.65, 0, .35, 1), opacity .2s .5s; }
.ul-fx-fly.ul-fx-frame { animation: none; transform: translate(var(--dx, 0px), var(--dy, 0px)) scale(var(--sx, 1), var(--sy, 1)); opacity: 0 !important; transition: transform .6s cubic-bezier(.65, 0, .35, 1), opacity .25s .45s; }
.ul-fx-found { width: 150px; height: 150px; border-radius: 50%; background: radial-gradient(closest-side, transparent 60%, var(--ul-fx) 80%, transparent); animation: ul-fx-found .7s cubic-bezier(.22, 1, .36, 1) forwards; }
@keyframes ul-fx-found { 0% { transform: scale(.3); opacity: 1; } 100% { transform: scale(2.4); opacity: 0; } }

@media (prefers-reduced-motion: reduce) {
  .ul-fx, .ul-fx *, .ul-fx *::before { animation: none !important; transition: none !important; }
  .ul-fx-ripple { opacity: .9; }
  .ul-fx-sonar i:nth-child(2) { transform: scale(.55); opacity: .6; }
}
`;

/** the second tone: the chat style's own accent */
const ACCENT: Record<Settings["chatStyle"], string> = {
    assistant: "#2563eb",
    audioGuide: "#ffb000",
    station: "#0079c2",
};
const CORAL = "#ff7a59";

let style: HTMLStyleElement | null = null;

function make(className: string, html = ""): HTMLDivElement {
    if (!style?.isConnected) {
        style = document.createElement("style");
        style.textContent = CSS;
        document.head.appendChild(style);
    }
    const s = getSettings();
    const el = document.createElement("div");
    el.className = `ul-fx ${className}`;
    el.innerHTML = html;
    const c = lookFrom(s).color;
    const c2 = ACCENT[s.chatStyle] ?? ACCENT.assistant;
    el.style.setProperty("--ul-fx", c);
    el.style.setProperty("--ul-fx2", c2);
    el.style.setProperty("--ul-fx3", s.fxThirdTone ? CORAL : c2);
    el.style.setProperty("--k", String(s.fxSize / 100));
    el.style.setProperty("--t", String(TEMPO[s.fxSpeed] ?? 1));
    el.setAttribute("aria-hidden", "true");
    document.documentElement.appendChild(el);
    return el;
}

function at(el: HTMLElement, x: number, y: number) {
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    return el;
}

/** the working state of each style, as the elements to end later */
function working(
    kind: Settings["clickFx"],
    s: Settings,
    x: number,
    y: number,
    box?: Box,
): HTMLElement[] {
    if (kind === "aurora") {
        const third = s.fxThirdTone ? '<i class="a3"></i>' : "";
        const dot = s.fxDot ? '<i class="dot"></i>' : "";
        const el = make(
            "ul-fx-aurora ul-fx-at",
            `<div class="body"><div class="spin"><i class="a1"></i>${third}</div><div class="spin two"><i class="a2"></i></div><i class="glow"></i>${dot}</div>`,
        );
        el.style.setProperty("--soft", `${s.fxSoftness}px`);
        return [at(el, x, y)];
    }
    if (kind === "sonar") {
        // rings spread evenly over one cycle, however many there are
        const n = Math.max(1, Math.min(3, Math.round(s.fxRings)));
        const rings = Array.from(
            { length: n },
            (_, i) =>
                `<i style="animation-delay: calc(${(1.8 * i) / n}s * var(--t, 1))"></i>`,
        ).join("");
        const el = make(
            `ul-fx-sonar ul-fx-at${s.fxRingStyle === "outline" ? " outline" : ""}`,
            `${rings}<i class="c"></i>`,
        );
        return [at(el, x, y)];
    }
    if (kind === "frame") {
        // what was clicked, unless it is most of the screen: then a box at the click
        const big =
            !box ||
            box.width * box.height >
                window.innerWidth * window.innerHeight * 0.4;
        const b = big
            ? { left: x - 32, top: y - 20, width: 64, height: 40 }
            : box;
        // the highlight's own outline, when chosen and drawable here
        const hl = s.hlOutline;
        const shape =
            s.fxFrameShape === "highlight" && hl !== "brackets" && hl !== "none"
                ? hl
                : "brackets";
        const pad = shape === "brackets" ? 0 : 6;
        const html =
            (s.fxSheen ? '<div class="sheen"></div>' : "") +
            (shape === "brackets"
                ? '<i class="br tl"></i><i class="br tr"></i><i class="br bl"></i><i class="br bb"></i>'
                : "");
        const f = make(`ul-fx-frame ${shape}${s.fxHug ? "" : " still"}`, html);
        Object.assign(f.style, {
            left: `${b.left - pad}px`,
            top: `${b.top - pad}px`,
            width: `${b.width + 2 * pad}px`,
            height: `${b.height + 2 * pad}px`,
        });
        return [f];
    }
    if (kind === "edge") {
        const edge = make(
            `ul-fx-edge${s.fxEdgeGradient ? "" : " plain"}`,
            '<div class="strip t"></div><div class="strip b"></div><div class="strip l"></div><div class="strip r"></div>',
        );
        edge.style.setProperty("--ew", `${s.fxEdgeWidth}px`);
        edge.style.removeProperty("--k");
        const parts: HTMLElement[] = [edge];
        if (s.fxPin)
            parts.push(at(make("ul-fx-pin ul-fx-at", "<i></i>"), x, y));
        return parts;
    }
    // the orb: halo, swirl and core are each a setting
    const on = { halo: s.fxHalo, swirl: s.fxSwirl, core: s.fxCore };
    const layers = (["halo", "swirl", "core"] as const).filter((l) => on[l]);
    // all three off would show nothing: keep the halo
    const html = (layers.length ? layers : ["halo"])
        .map((l) => `<i class="${l}"></i>`)
        .join("");
    return [at(make("ul-fx-orb ul-fx-at", html), x, y)];
}

/**
 * Show the feedback for a click at (x, y), on `box` when there is one (what was
 * clicked, or the dragged region, in client px). Returns `finish`: call it when the
 * chat has the capture, with a way to find its new place entry (so a flying ending
 * can go there), or with nothing to just end.
 */
export function clickFeedback(
    x: number,
    y: number,
    box?: Box,
): (dest?: () => Element | null | undefined) => void {
    const s = getSettings();
    const kind = s.clickFx;
    if (s.fxRipple) {
        const ripple = at(make("ul-fx-ripple ul-fx-at"), x, y);
        setTimeout(() => ripple.remove(), 600);
    }
    const parts = working(kind, s, x, y, box);
    const ending: Ending =
        s.fxEnding === "auto" ? OWN_ENDING[kind] : s.fxEnding;

    let done = false;
    return (dest) => {
        if (done) return;
        done = true;
        if (reducedMotion()) {
            for (const el of parts) el.remove();
            return;
        }
        // two frames: the chat renders its new place entry first
        requestAnimationFrame(() =>
            requestAnimationFrame(() => {
                const d =
                    ending === "fly" ? dest?.()?.getBoundingClientRect() : null;
                if (ending === "found") {
                    const f = at(make("ul-fx-found ul-fx-at"), x, y);
                    setTimeout(() => f.remove(), 800);
                }
                for (const el of parts) {
                    const full = el.classList.contains("ul-fx-edge");
                    if (d && !full) {
                        if (el.classList.contains("ul-fx-frame")) {
                            // the framed thing becomes its place entry
                            const r = el.getBoundingClientRect();
                            el.style.setProperty(
                                "--dx",
                                `${d.left - r.left}px`,
                            );
                            el.style.setProperty("--dy", `${d.top - r.top}px`);
                            el.style.setProperty(
                                "--sx",
                                String(d.width / Math.max(1, r.width)),
                            );
                            el.style.setProperty(
                                "--sy",
                                String(d.height / Math.max(1, r.height)),
                            );
                        } else {
                            el.style.setProperty(
                                "--dx",
                                `${d.left + d.width / 2 - x}px`,
                            );
                            el.style.setProperty(
                                "--dy",
                                `${d.top + d.height / 2 - y}px`,
                            );
                        }
                        el.classList.add("ul-fx-fly");
                    } else el.classList.add("ul-fx-fade");
                    setTimeout(() => el.remove(), 750);
                }
            }),
        );
    };
}
