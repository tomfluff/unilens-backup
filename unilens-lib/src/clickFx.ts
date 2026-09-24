/**
 * Feedback for a click that asks UniLens (explored in the "Click Feedback Studies"
 * mockups): a ripple where it landed, then a "working" state while the page is
 * captured, then an ending as the chat takes it. The setting `clickFx` picks one:
 *
 *   orb     a breathing orb at the click: halo, turning two-tone swirl, glossy core
 *   aurora  a soft colour body at the click that gathers and flies into the chat
 *   sonar   a solid beacon sending out filled rings, ending in one "found" pulse
 *   frame   brackets and a scanning sheen on what was clicked, flying into the chat
 *   edge    the screen's edge glows (the whole page is being read), a pin at the click
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

const CSS = `
.ul-fx { position: fixed; z-index: 2147483647; pointer-events: none; box-sizing: border-box; }
.ul-fx *, .ul-fx *::before { box-sizing: border-box; }
.ul-fx-at { transform: translate(-50%, -50%); }
.ul-fx-ripple { width: 72px; height: 72px; border-radius: 50%; border: 4px solid var(--ul-fx); box-shadow: 0 0 0 2px #000, inset 0 0 0 2px #000; animation: ul-fx-ripple .55s cubic-bezier(.22, 1, .36, 1) forwards; }
@keyframes ul-fx-ripple { from { transform: translate(-50%, -50%) scale(.2); opacity: 1; } to { transform: translate(-50%, -50%) scale(1); opacity: 0; } }
@keyframes ul-fx-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes ul-fx-breathe { 0%, 100% { transform: scale(.78); opacity: .75; } 50% { transform: scale(1.08); opacity: 1; } }
@keyframes ul-fx-turn { to { transform: rotate(1turn); } }
.ul-fx i { position: absolute; display: block; border-radius: 50%; }
.ul-fx-end { transition: transform .6s cubic-bezier(.65, 0, .35, 1), opacity .35s ease; }

/* orb */
.ul-fx-orb { width: 112px; height: 112px; animation: ul-fx-in .3s both; }
.ul-fx-orb i { inset: 0; margin: auto; }
.ul-fx-orb .halo { width: 112px; height: 112px; background: radial-gradient(closest-side, color-mix(in srgb, var(--ul-fx) 55%, transparent), transparent); animation: ul-fx-breathe 1.8s ease-in-out infinite; }
.ul-fx-orb .swirl { width: 70px; height: 70px; background: conic-gradient(var(--ul-fx), var(--ul-fx2), var(--ul-fx)); filter: blur(5px); opacity: .8; animation: ul-fx-turn 2.6s linear infinite; }
.ul-fx-orb .core { width: 30px; height: 30px; background: radial-gradient(circle at 35% 35%, #fff, var(--ul-fx) 45%, var(--ul-fx2)); box-shadow: 0 0 0 2px rgba(0, 0, 0, .75), 0 0 0 4px rgba(255, 255, 255, .85); animation: ul-fx-breathe 1.8s ease-in-out -.9s infinite; }
.ul-fx-orb.ul-fx-end { opacity: 0; transform: translate(-50%, -50%) scale(.6); }

/* aurora */
.ul-fx-aurora { width: 170px; height: 170px; animation: ul-fx-in .35s both; }
.ul-fx-aurora .body { position: absolute; inset: 0; animation: ul-fx-swell 1.6s ease-in-out infinite; }
.ul-fx-aurora .spin { position: absolute; inset: 0; animation: ul-fx-turn 3.2s linear infinite; }
.ul-fx-aurora .spin.two { animation-duration: 4.4s; animation-direction: reverse; }
.ul-fx-aurora .spin i { width: 96px; height: 96px; filter: blur(16px); opacity: .85; }
.ul-fx-aurora .a1 { left: 10px; top: 28px; background: var(--ul-fx); }
.ul-fx-aurora .a2 { right: 8px; top: 40px; background: var(--ul-fx2); }
.ul-fx-aurora .spin .a3 { left: 38px; bottom: 6px; background: #ff7a59; opacity: .6; }
.ul-fx-aurora .glow { left: 52px; top: 52px; width: 66px; height: 66px; background: #fff; filter: blur(12px); opacity: .9; }
.ul-fx-aurora .dot { left: 77px; top: 77px; width: 16px; height: 16px; background: #111; border: 3px solid #fff; animation: ul-fx-breathe 1.6s ease-in-out infinite; }
@keyframes ul-fx-swell { 0%, 100% { transform: scale(.86); } 50% { transform: scale(1.04); } }
.ul-fx-aurora.ul-fx-end { transform: translate(calc(-50% + var(--dx, 0px)), calc(-50% + var(--dy, 0px))) scale(.12); opacity: 0; transition: transform .6s cubic-bezier(.65, 0, .35, 1), opacity .2s .5s; }

/* sonar */
.ul-fx-sonar { width: 0; height: 0; }
.ul-fx-sonar i { left: -75px; top: -75px; width: 150px; height: 150px; background: radial-gradient(closest-side, color-mix(in srgb, var(--ul-fx) 10%, transparent) 55%, color-mix(in srgb, var(--ul-fx) 70%, transparent) 88%, transparent); box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--ul-fx2) 60%, transparent); transform: scale(.15); opacity: 0; animation: ul-fx-ping 1.8s cubic-bezier(.22, 1, .36, 1) infinite; }
.ul-fx-sonar i:nth-child(2) { animation-delay: .6s; }
.ul-fx-sonar i:nth-child(3) { animation-delay: 1.2s; }
.ul-fx-sonar .found { animation: none; }
.ul-fx-sonar .c { left: -13px; top: -13px; width: 26px; height: 26px; background: var(--ul-fx); box-shadow: 0 0 0 3px #000, 0 0 0 6px #fff; transform: none; opacity: 1; animation: none; }
@keyframes ul-fx-ping { 0% { transform: scale(.15); opacity: .95; } 100% { transform: scale(1); opacity: 0; } }
.ul-fx-sonar.ul-fx-end i { animation: none; opacity: 0; transition: opacity .3s .4s; }
.ul-fx-sonar.ul-fx-end .found { opacity: 1; background: radial-gradient(closest-side, transparent 60%, var(--ul-fx) 80%, transparent); box-shadow: none; animation: ul-fx-found .7s cubic-bezier(.22, 1, .36, 1) forwards; }
@keyframes ul-fx-found { 0% { transform: scale(.3); opacity: 1; } 100% { transform: scale(2.4); opacity: 0; } }

/* frame */
.ul-fx-frame { transform-origin: 0 0; animation: ul-fx-in .2s both, ul-fx-hug 1.4s ease-in-out infinite; }
.ul-fx-frame .br { position: absolute; width: 22px; height: 22px; border: 5px solid var(--ul-fx); border-radius: 0; filter: drop-shadow(0 0 1.5px #000) drop-shadow(0 0 1.5px #000); }
.ul-fx-frame .tl { left: -12px; top: -12px; border-right: 0; border-bottom: 0; }
.ul-fx-frame .tr { right: -12px; top: -12px; border-left: 0; border-bottom: 0; }
.ul-fx-frame .bl { left: -12px; bottom: -12px; border-right: 0; border-top: 0; }
.ul-fx-frame .bb { right: -12px; bottom: -12px; border-left: 0; border-top: 0; }
.ul-fx-frame .sheen { position: absolute; inset: 0; overflow: hidden; border-radius: 3px; }
.ul-fx-frame .sheen::before { content: ""; position: absolute; top: -20%; bottom: -20%; width: 45%; background: linear-gradient(100deg, transparent, color-mix(in srgb, var(--ul-fx) 55%, transparent) 45%, rgba(255, 255, 255, .7) 50%, color-mix(in srgb, var(--ul-fx2) 35%, transparent) 60%, transparent); transform: translateX(-120%); animation: ul-fx-sweep 1.2s cubic-bezier(.45, 0, .2, 1) infinite; }
@keyframes ul-fx-hug { 0%, 100% { scale: 1.04; } 50% { scale: 1; } }
@keyframes ul-fx-sweep { to { transform: translateX(340%); } }
.ul-fx-frame.ul-fx-end { animation: none; transform: translate(var(--dx, 0px), var(--dy, 0px)) scale(var(--sx, 1), var(--sy, 1)); opacity: 0; transition: transform .6s cubic-bezier(.65, 0, .35, 1), opacity .25s .45s; }

/* edge */
.ul-fx-edge { inset: 0; animation: ul-fx-in .35s both; }
.ul-fx-edge .strip { position: absolute; overflow: hidden; filter: blur(7px); }
.ul-fx-edge .strip::before { content: ""; position: absolute; top: 0; bottom: 0; left: 0; width: 300%; background: repeating-linear-gradient(90deg, var(--ul-fx) 0 12%, var(--ul-fx2) 22%, #ff7a59 30%, var(--ul-fx) 40% 50%); animation: ul-fx-flow 2.4s linear infinite; }
.ul-fx-edge .t { left: 0; right: 0; top: -6px; height: 18px; }
.ul-fx-edge .b { left: 0; right: 0; bottom: -6px; height: 18px; }
.ul-fx-edge .l { top: 0; bottom: 0; left: -6px; width: 18px; }
.ul-fx-edge .r { top: 0; bottom: 0; right: -6px; width: 18px; }
.ul-fx-edge .l::before, .ul-fx-edge .r::before { right: 0; bottom: auto; width: auto; height: 300%; background: repeating-linear-gradient(180deg, var(--ul-fx) 0 12%, var(--ul-fx2) 22%, #ff7a59 30%, var(--ul-fx) 40% 50%); animation-name: ul-fx-flowv; }
@keyframes ul-fx-flow { to { transform: translateX(-33.333%); } }
@keyframes ul-fx-flowv { to { transform: translateY(-33.333%); } }
.ul-fx-pin { width: 22px; height: 22px; }
.ul-fx-pin > i { inset: 0; background: var(--ul-fx); box-shadow: 0 0 0 3px #000, 0 0 0 6px #fff; animation: ul-fx-breathe 1.6s ease-in-out infinite; }
.ul-fx-edge.ul-fx-end, .ul-fx-pin.ul-fx-end { opacity: 0; transition: opacity .6s; }

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

let style: HTMLStyleElement | null = null;

function make(className: string, html = ""): HTMLDivElement {
    if (!style?.isConnected) {
        style = document.createElement("style");
        style.textContent = CSS;
        document.head.appendChild(style);
    }
    const el = document.createElement("div");
    el.className = `ul-fx ${className}`;
    el.innerHTML = html;
    const s = getSettings();
    el.style.setProperty("--ul-fx", lookFrom(s).color);
    el.style.setProperty("--ul-fx2", ACCENT[s.chatStyle] ?? ACCENT.assistant);
    el.setAttribute("aria-hidden", "true");
    document.documentElement.appendChild(el);
    return el;
}

function at(el: HTMLElement, x: number, y: number) {
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    return el;
}

/** end one element: its ending class, then gone once the ending has played */
function end(el: HTMLElement, ms: number) {
    if (reducedMotion()) {
        el.remove();
        return;
    }
    el.classList.add("ul-fx-end");
    setTimeout(() => el.remove(), ms);
}

const ORB_LAYERS = ["halo", "swirl", "core"] as const;

/**
 * Show the feedback for a click at (x, y), on `box` when there is one (what was
 * clicked, or the dragged region, in client px). Returns `finish`: call it when the
 * chat has the capture, with a way to find its new place entry (so an ending can
 * fly there), or with nothing to just end.
 */
export function clickFeedback(
    x: number,
    y: number,
    box?: Box,
): (dest?: () => Element | null | undefined) => void {
    const s = getSettings();
    const kind = s.clickFx;
    const ripple = at(make("ul-fx-ripple ul-fx-at"), x, y);
    setTimeout(() => ripple.remove(), 600);

    const parts: HTMLElement[] = [];
    if (kind === "aurora") {
        parts.push(
            at(
                make(
                    "ul-fx-aurora ul-fx-at",
                    '<div class="body"><div class="spin"><i class="a1"></i><i class="a3"></i></div><div class="spin two"><i class="a2"></i></div><i class="glow"></i><i class="dot"></i></div>',
                ),
                x,
                y,
            ),
        );
    } else if (kind === "sonar") {
        parts.push(
            at(
                make(
                    "ul-fx-sonar",
                    '<i></i><i></i><i></i><i class="found"></i><i class="c"></i>',
                ),
                x,
                y,
            ),
        );
    } else if (kind === "frame") {
        // what was clicked, unless it is most of the screen: then a box at the click
        const big =
            !box ||
            box.width * box.height >
                window.innerWidth * window.innerHeight * 0.4;
        const b = big
            ? { left: x - 32, top: y - 20, width: 64, height: 40 }
            : box;
        const f = make(
            "ul-fx-frame",
            '<div class="sheen"></div><i class="br tl"></i><i class="br tr"></i><i class="br bl"></i><i class="br bb"></i>',
        );
        Object.assign(f.style, {
            left: `${b.left}px`,
            top: `${b.top}px`,
            width: `${b.width}px`,
            height: `${b.height}px`,
        });
        parts.push(f);
    } else if (kind === "edge") {
        parts.push(
            make(
                "ul-fx-edge",
                '<div class="strip t"></div><div class="strip b"></div><div class="strip l"></div><div class="strip r"></div>',
            ),
            at(make("ul-fx-pin ul-fx-at", "<i></i>"), x, y),
        );
    } else {
        // the orb: its core and swirl are settings; the halo always shows
        const on = { halo: true, swirl: s.fxSwirl, core: s.fxCore };
        parts.push(
            at(
                make(
                    "ul-fx-orb ul-fx-at",
                    ORB_LAYERS.filter((l) => on[l])
                        .map((l) => `<i class="${l}"></i>`)
                        .join(""),
                ),
                x,
                y,
            ),
        );
    }

    let done = false;
    return (dest) => {
        if (done) return;
        done = true;
        // two frames: the chat renders its new place entry first
        requestAnimationFrame(() =>
            requestAnimationFrame(() => {
                const d = dest?.()?.getBoundingClientRect();
                for (const el of parts) {
                    if (d && kind === "aurora") {
                        el.style.setProperty(
                            "--dx",
                            `${d.left + d.width / 2 - x}px`,
                        );
                        el.style.setProperty(
                            "--dy",
                            `${d.top + d.height / 2 - y}px`,
                        );
                    } else if (d && kind === "frame") {
                        // the framed thing becomes its place entry
                        const r = el.getBoundingClientRect();
                        el.style.setProperty("--dx", `${d.left - r.left}px`);
                        el.style.setProperty("--dy", `${d.top - r.top}px`);
                        el.style.setProperty(
                            "--sx",
                            String(d.width / Math.max(1, r.width)),
                        );
                        el.style.setProperty(
                            "--sy",
                            String(d.height / Math.max(1, r.height)),
                        );
                    }
                    end(el, kind === "sonar" ? 800 : 700);
                }
            }),
        );
    };
}
