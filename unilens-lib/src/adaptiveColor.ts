/**
 * The highlight colour that adapts to what is under it (#26, Yotam 2026-10-12): a
 * participant found a highlight that showed on one section's background vanish on
 * another section of the same site. Three ways besides the fixed colour:
 *
 *   invert    drawn in white through mix-blend-mode: difference (highlight.ts); no
 *             colour is chosen here
 *   contrast  the colour from a vivid palette whose worst contrast over every sampled
 *             background is highest
 *   near      the person's colour, its lightness moved (OKLCH) only as far as it must
 *             to reach 3:1 over every sampled background, within a limit
 *
 * Backgrounds are read where the highlight is drawn: points inside the element and
 * just outside its edge, each the stack of elements under that point (so an overlay
 * that is a sibling, not an ancestor, counts), blended top-down until an opaque
 * layer. Gradients count every stop; same-origin images are sampled; anything else
 * (a cross-origin image, a video) counts as both black and white. A highlight across
 * two backgrounds is judged by the worse one. Whatever would push the element's text
 * under 4.5:1 through the fill or glow is left out.
 */

export type ColorMode = "fixed" | "invert" | "contrast" | "near";
/** how far "near" may move the colour's lightness (OKLCH L, 0–1) */
export type ColorRange = "little" | "some" | "any";
export const COLOR_RANGE_L: Record<ColorRange, number> = {
    little: 0.15,
    some: 0.3,
    any: 1,
};

/** the contrast a highlight's colour reaches over its background (WCAG 1.4.11) */
export const TARGET_CONTRAST = 3;
/** the contrast the element's text keeps under the fill or glow */
export const TEXT_CONTRAST = 4.5;
/** "contrast" picks from these: vivid, so it still reads as a highlight (never black
 *  or white, which read as a shadow or a hole); the first five are the panel's swatches */
export const CONTRAST_PALETTE = [
    "#ffef26",
    "#00e5ff",
    "#ff4fd8",
    "#36f26b",
    "#ff8a00",
    "#1f5bff",
    "#8b2cff",
    "#d4001a",
];

export interface RGBA {
    r: number;
    g: number;
    b: number;
    a: number;
}
const WHITE: RGBA = { r: 255, g: 255, b: 255, a: 1 };
const BLACK: RGBA = { r: 0, g: 0, b: 0, a: 1 };
const YELLOW: RGBA = { r: 255, g: 239, b: 38, a: 1 };

// ── colour maths ────────────────────────────────────────────────────────────
const toLin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const fromLin = (l: number) => {
    const s = l <= 0.0031308 ? 12.92 * l : 1.055 * l ** (1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, s)) * 255);
};

export function luminance(c: RGBA): number {
    return 0.2126 * toLin(c.r) + 0.7152 * toLin(c.g) + 0.0722 * toLin(c.b);
}

export function contrast(a: RGBA, b: RGBA): number {
    const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
}

/** `top` laid over an opaque `under` */
export function over(top: RGBA, under: RGBA, alpha = top.a): RGBA {
    return {
        r: top.r * alpha + under.r * (1 - alpha),
        g: top.g * alpha + under.g * (1 - alpha),
        b: top.b * alpha + under.b * (1 - alpha),
        a: 1,
    };
}

export function hexToRgba(hex: string): RGBA | null {
    const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex);
    if (!m) return null;
    const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
    const n = Number.parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
}

export function rgbaToHex(c: RGBA): string {
    const h = (v: number) => Math.round(v).toString(16).padStart(2, "0");
    return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
}

/** sRGB (0–255) to OKLCH and back (Björn Ottosson's OKLab) */
export function toOklch(c: RGBA): { l: number; c: number; h: number } {
    const [r, g, b] = [toLin(c.r), toLin(c.g), toLin(c.b)];
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
    const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
    const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
    return { l: L, c: Math.hypot(A, B), h: Math.atan2(B, A) };
}

/** OKLCH to sRGB, or null outside the sRGB gamut */
function fromOklchExact(L: number, C: number, H: number): RGBA | null {
    const A = C * Math.cos(H);
    const B = C * Math.sin(H);
    const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
    const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
    const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
    const lin = [
        4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ];
    if (lin.some((v) => v < -1e-4 || v > 1 + 1e-4)) return null;
    return { r: fromLin(lin[0]), g: fromLin(lin[1]), b: fromLin(lin[2]), a: 1 };
}

/** OKLCH to sRGB, keeping lightness and hue and giving up chroma until it fits */
export function fromOklch(L: number, C: number, H: number): RGBA {
    const l = Math.min(1, Math.max(0, L));
    let lo = 0;
    let hi = C;
    const exact = fromOklchExact(l, C, H);
    if (exact) return exact;
    for (let i = 0; i < 18; i++) {
        const mid = (lo + hi) / 2;
        if (fromOklchExact(l, mid, H)) lo = mid;
        else hi = mid;
    }
    return fromOklchExact(l, lo, H) ?? (l > 0.5 ? WHITE : BLACK);
}

// ── reading a CSS colour ────────────────────────────────────────────────────
const parsed = new Map<string, RGBA | null>();
let probe: CanvasRenderingContext2D | null | undefined;

/** any computed colour (rgb(), rgba(), and what a canvas can paint: oklch(), color()) */
export function parseColor(css: string): RGBA | null {
    const key = css.trim();
    if (parsed.has(key)) return parsed.get(key) ?? null;
    let out: RGBA | null = null;
    const m =
        /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i.exec(
            key,
        );
    if (m) {
        const a = m[4]
            ? m[4].endsWith("%")
                ? Number.parseFloat(m[4]) / 100
                : Number(m[4])
            : 1;
        out = { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a };
    } else if (key === "transparent") {
        out = { r: 0, g: 0, b: 0, a: 0 };
    } else if (key.startsWith("#")) {
        out = hexToRgba(key);
    } else {
        // a canvas paints any colour the browser knows; read the pixel back
        if (probe === undefined) {
            try {
                const c = document.createElement("canvas");
                c.width = c.height = 1;
                probe = c.getContext("2d", { willReadFrequently: true });
            } catch {
                probe = null;
            }
        }
        if (probe) {
            try {
                probe.clearRect(0, 0, 1, 1);
                probe.fillStyle = "#000";
                probe.fillStyle = key;
                probe.fillRect(0, 0, 1, 1);
                const d = probe.getImageData(0, 0, 1, 1).data;
                out = { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
            } catch {
                out = null;
            }
        }
    }
    if (parsed.size > 500) parsed.clear();
    parsed.set(key, out);
    return out;
}

/** every colour named in a gradient (its stops), in order */
export function gradientStops(image: string): RGBA[] {
    const found =
        image.match(
            /rgba?\([^)]*\)|#[0-9a-f]{3,8}\b|oklch\([^)]*\)|color\([^)]*\)/gi,
        ) ?? [];
    return found.map(parseColor).filter((c): c is RGBA => Boolean(c));
}

// ── images ──────────────────────────────────────────────────────────────────
/** each image drawn once, small, to read its pixels; null when it cannot be read
 *  (cross-origin, not loaded yet) */
const IMG_SIDE = 48;
const imageCache = new Map<string, ImageData | null | "loading">();
let onImageLoad: (() => void) | null = null;
/** called when an image this module waited for has loaded (the painter re-lays) */
export function setImageLoadListener(fn: (() => void) | null) {
    onImageLoad = fn;
}

function pixelsOf(img: HTMLImageElement): ImageData | null {
    try {
        const c = document.createElement("canvas");
        c.width = c.height = IMG_SIDE;
        const ctx = c.getContext("2d", { willReadFrequently: true });
        if (!ctx) return null;
        ctx.drawImage(img, 0, 0, IMG_SIDE, IMG_SIDE);
        return ctx.getImageData(0, 0, IMG_SIDE, IMG_SIDE);
    } catch {
        return null; // tainted: cross-origin without CORS
    }
}

function imageData(src: string, el?: HTMLImageElement): ImageData | null {
    const hit = imageCache.get(src);
    if (hit && hit !== "loading") return hit;
    if (hit === null) return null;
    if (el?.complete && el.naturalWidth) {
        const d = pixelsOf(el);
        imageCache.set(src, d);
        return d;
    }
    if (hit === "loading") return null;
    imageCache.set(src, "loading");
    const img = new Image();
    // same-origin needs nothing; elsewhere this only works with CORS headers
    if (!src.startsWith(location.origin) && !src.startsWith("data:"))
        img.crossOrigin = "anonymous";
    img.onload = () => {
        imageCache.set(src, pixelsOf(img));
        onImageLoad?.();
    };
    img.onerror = () => imageCache.set(src, null);
    img.src = src;
    return null;
}

/** the image's pixel at (fx, fy), each 0–1 across its box (stretched: close enough
 *  for a colour); null when it cannot be read */
function imagePixel(
    src: string,
    fx: number,
    fy: number,
    el?: HTMLImageElement,
): RGBA | null {
    const d = imageData(src, el);
    if (!d) return null;
    const x = Math.min(IMG_SIDE - 1, Math.max(0, Math.floor(fx * IMG_SIDE)));
    const y = Math.min(IMG_SIDE - 1, Math.max(0, Math.floor(fy * IMG_SIDE)));
    const i = (y * IMG_SIDE + x) * 4;
    return {
        r: d.data[i],
        g: d.data[i + 1],
        b: d.data[i + 2],
        a: d.data[i + 3] / 255,
    };
}

// ── what is under a point ───────────────────────────────────────────────────
/** a layer's colours at a point: usually one; a gradient gives each of its stops;
 *  something unreadable gives black and white */
function layersAt(el: Element, x: number, y: number): RGBA[][] {
    const out: RGBA[][] = [];
    const cs = getComputedStyle(el);
    const box = () => {
        const r = el.getBoundingClientRect();
        return {
            fx: r.width ? (x - r.left) / r.width : 0.5,
            fy: r.height ? (y - r.top) / r.height : 0.5,
        };
    };
    // the element's own content first: it is painted over its background
    const tag = el.tagName;
    if (tag === "IMG") {
        const img = el as HTMLImageElement;
        const { fx, fy } = box();
        const px = img.currentSrc
            ? imagePixel(img.currentSrc, fx, fy, img)
            : null;
        out.push(px ? [px] : [BLACK, WHITE]);
    } else if (tag === "VIDEO" || tag === "CANVAS" || tag === "IFRAME") {
        out.push([BLACK, WHITE]);
    }
    const image = cs.backgroundImage;
    if (image && image !== "none") {
        // every background image, the first listed on top
        for (const layer of splitLayers(image)) {
            const url = /^url\(["']?(.*?)["']?\)$/.exec(layer)?.[1];
            if (url) {
                const { fx, fy } = box();
                const px = imagePixel(new URL(url, location.href).href, fx, fy);
                out.push(px ? [px] : [BLACK, WHITE]);
            } else if (/gradient\(/i.test(layer)) {
                const stops = gradientStops(layer);
                if (stops.length) out.push(stops);
            }
        }
    }
    const bg = parseColor(cs.backgroundColor);
    if (bg && bg.a > 0) out.push([bg]);
    return out;
}

/** the top-level layers of a background-image list (commas inside rgb(), a
 *  gradient or a quoted url do not split it) */
export function splitLayers(image: string): string[] {
    const out: string[] = [];
    let depth = 0;
    let quote = "";
    let start = 0;
    for (let i = 0; i < image.length; i++) {
        const ch = image[i];
        if (quote) {
            if (ch === quote && image[i - 1] !== "\\") quote = "";
        } else if (ch === '"' || ch === "'") quote = ch;
        else if (ch === "(") depth++;
        else if (ch === ")") depth = Math.max(0, depth - 1);
        else if (ch === "," && depth === 0) {
            out.push(image.slice(start, i).trim());
            start = i + 1;
        }
    }
    out.push(image.slice(start).trim());
    return out.filter(Boolean);
}

/** an element's opacity: its own, and as drawn (times its ancestors'), memoised
 *  across the points of one read */
export interface OpacityReader {
    own: (el: Element) => number;
    drawn: (el: Element) => number;
}
function opacityReader(): OpacityReader {
    const own = new Map<Element, number>();
    const drawn = new Map<Element, number>();
    const ownOf = (el: Element) => {
        let o = own.get(el);
        if (o === undefined) {
            const v = Number.parseFloat(getComputedStyle(el).opacity);
            o = Number.isFinite(v) ? v : 1;
            own.set(el, o);
        }
        return o;
    };
    const drawnOf = (el: Element | null): number => {
        if (!el) return 1;
        let o = drawn.get(el);
        if (o === undefined) {
            o = ownOf(el) * drawnOf(el.parentElement);
            drawn.set(el, o);
        }
        return o;
    };
    return { own: ownOf, drawn: (el) => drawnOf(el) };
}

/** the page canvas's colour: the root's background, else the body's, else white */
function canvasColor(doc: Document): RGBA {
    for (const el of [doc.documentElement, doc.body]) {
        if (!el) continue;
        const c = parseColor(getComputedStyle(el).backgroundColor);
        if (c && c.a > 0) return over(c, WHITE);
    }
    return WHITE;
}

export interface SampleOptions {
    /** where to look (a shadow root for the settings panel's previews) */
    root?: Document | ShadowRoot;
    /** elements not to count: the painter's own boxes, the chat */
    skip?: (el: Element) => boolean;
    /** what lies under everything (the page's canvas, or a preview's stage) */
    base?: RGBA;
    /** shared across the points of one read, so ancestors are read once */
    opacity?: OpacityReader;
    /** what is at a point, topmost first, instead of asking the screen: a settings
     *  tile knows its own parts, and must look the same scrolled out of view */
    stack?: (x: number, y: number) => Element[];
}

/** the page's own elements only: everything UniLens draws hangs off <html>, outside
 *  <body> (the highlight layers, numbers, chat, minimap, settings) */
export function isPageElement(el: Element): boolean {
    const doc = el.ownerDocument;
    return (
        el === doc.documentElement ||
        el === doc.body ||
        Boolean(doc.body?.contains(el))
    );
}

/** the colours under (x, y) (client px), as seen; several when a gradient or an
 *  unreadable image is there; [] off-screen */
export function backgroundsAt(
    x: number,
    y: number,
    opts: SampleOptions = {},
): RGBA[] {
    const root = opts.root ?? document;
    const doc = root instanceof Document ? root : root.ownerDocument;
    if (!opts.stack && (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight))
        return [];
    const skip = opts.skip ?? ((el: Element) => !isPageElement(el));
    const stack = (
        opts.stack ? opts.stack(x, y) : root.elementsFromPoint(x, y)
    ).filter((el) => !skip(el));
    const opacity = opts.opacity ?? opacityReader();
    // top-down until a layer covers what is under it (and nothing over it is
    // see-through)
    const taken: { el: Element; layers: RGBA[][] }[] = [];
    outer: for (const el of stack) {
        const layers = layersAt(el, x, y);
        taken.push({ el, layers });
        for (const l of layers)
            if (l.every((c) => c.a >= 0.999) && opacity.drawn(el) >= 0.999)
                break outer;
    }
    // then bottom-up; a see-through element (hit or not: a child may overflow it)
    // is a group: what it and its descendants paint is laid on a clear buffer,
    // then over what was under it once, at its opacity
    let results: RGBA[] = [opts.base ?? canvasColor(doc)];
    const groups: { root: Element; under: RGBA[]; o: number }[] = [];
    const cross = (tops: RGBA[], unders: RGBA[], alpha = 1) => {
        const next: RGBA[] = [];
        for (const u of unders)
            for (const t of tops)
                next.push(overAlpha({ ...t, a: t.a * alpha }, u));
        // a long gradient over a gradient: keep the extremes, not every pair
        return next.length > 8 ? extremes(next) : next;
    };
    const close = () => {
        const g = groups.pop();
        if (g) results = cross(results, g.under, g.o);
    };
    for (const { el, layers } of taken.reverse()) {
        while (groups.length && !groups[groups.length - 1].root.contains(el))
            close();
        const chain: Element[] = [];
        for (let a: Element | null = el; a; a = a.parentElement)
            if (opacity.own(a) < 0.999) chain.unshift(a);
        for (const a of chain)
            if (!groups.some((g) => g.root === a)) {
                groups.push({ root: a, under: results, o: opacity.own(a) });
                results = [CLEAR];
            }
        for (const l of [...layers].reverse()) results = cross(l, results);
    }
    while (groups.length) close();
    // nothing opaque under a group's content: what shows is the canvas
    return results.map((c) => (c.a >= 0.999 ? c : overAlpha(c, WHITE)));
}

const CLEAR: RGBA = { r: 0, g: 0, b: 0, a: 0 };

/** `top` over `under`, either see-through (source-over) */
function overAlpha(top: RGBA, under: RGBA): RGBA {
    const a = top.a + under.a * (1 - top.a);
    if (a <= 0) return CLEAR;
    const mix = (t: number, u: number) =>
        (t * top.a + u * under.a * (1 - top.a)) / a;
    return {
        r: mix(top.r, under.r),
        g: mix(top.g, under.g),
        b: mix(top.b, under.b),
        a,
    };
}

function extremes(cs: RGBA[]): RGBA[] {
    const by = [...cs].sort((a, b) => luminance(a) - luminance(b));
    return [by[0], by[Math.floor(by.length / 2)], by[by.length - 1]];
}

export interface Backgrounds {
    /** under the highlight's edge: just outside the element, and its own rim */
    edge: RGBA[];
    /** just outside the element alone, under its glow (a neighbour's text) */
    outside?: RGBA[];
    /** inside the element, under its fill */
    inside: RGBA[];
    /** the element's text colour, when it has text */
    text: RGBA | null;
}

/** the backgrounds around and inside `r` (client px), `out` px beyond its edge */
export function sampleBackgrounds(
    r: { left: number; top: number; width: number; height: number },
    out: number,
    opts: SampleOptions & { el?: Element } = {},
): Backgrounds {
    const { left: L, top: T, width: W, height: H } = r;
    const R = L + W;
    const B = T + H;
    const cx = L + W / 2;
    const cy = T + H / 2;
    const o = Math.max(2, out);
    // just outside: the corners and the middle of each side
    const ring: [number, number][] = [
        [L - o, T - o],
        [cx, T - o],
        [R + o, T - o],
        [R + o, cy],
        [R + o, B + o],
        [cx, B + o],
        [L - o, B + o],
        [L - o, cy],
    ];
    // inside: the rim, 2 px in, and the middle
    const i = Math.min(2, W / 4, H / 4);
    const inner: [number, number][] = [
        [L + i, T + i],
        [R - i, T + i],
        [R - i, B - i],
        [L + i, B - i],
        [cx, cy],
    ];
    const shared = { ...opts, opacity: opts.opacity ?? opacityReader() };
    const at = (pts: [number, number][]) =>
        pts.flatMap(([x, y]) => backgroundsAt(x, y, shared));
    const outside = at(ring);
    const rim = at(inner.slice(0, 4));
    const inside = [...rim, ...at(inner.slice(4))];
    const textColor = opts.el?.textContent?.trim()
        ? parseColor(getComputedStyle(opts.el).color)
        : null;
    return {
        // the rim is under the band too (it straddles the edge)
        edge: [...outside, ...rim],
        outside,
        inside,
        text: textColor && textColor.a > 0 ? textColor : null,
    };
}

// ── choosing ────────────────────────────────────────────────────────────────
export interface Choice {
    /** the base colour (the person's, for "near") */
    base: string;
    mode: Exclude<ColorMode, "fixed" | "invert">;
    range: ColorRange;
    /** what the look lays over the text, 0 when nothing */
    fillAlpha: number;
    glowAlpha: number;
}

/** the worst contrast of `c` over these backgrounds */
const worst = (c: RGBA, bgs: RGBA[]) =>
    bgs.reduce(
        (m, bg) => Math.min(m, contrast(c, bg)),
        Number.POSITIVE_INFINITY,
    );

/** whether the element's text stays readable under the fill and glow in `c` (both
 *  lie over the text as well as its background): 4.5:1 where it had that, or
 *  nine-tenths of what it had where it had less */
function textKept(c: RGBA, bg: Backgrounds, k: Choice): boolean {
    return textMargin(c, bg, k) >= 1;
}

/** how the text fares under the fill and glow in `c`: its worst contrast over what
 *  it needs (1 or more is readable) */
function textMargin(c: RGBA, bg: Backgrounds, k: Choice): number {
    const t = bg.text;
    if (!t) return Number.POSITIVE_INFINITY;
    let margin = Number.POSITIVE_INFINITY;
    const checks: [RGBA[], number][] = [
        [bg.inside, k.fillAlpha],
        // the glow lies outside the element, over what is next to it
        [bg.outside ?? bg.edge, k.glowAlpha],
    ];
    for (const [bgs, a] of checks) {
        if (!a) continue;
        for (const under of bgs) {
            const was = contrast(t, under);
            const need = was >= TEXT_CONTRAST ? TEXT_CONTRAST : was * 0.9;
            const now = contrast(over(c, t, a), over(c, under, a));
            margin = Math.min(margin, now / need);
        }
    }
    return margin;
}

/**
 * The strongest glow, up to `max`, that leaves the text next to the highlight
 * readable in this colour (the line carries the colour, so the glow gives way, not
 * the colour: Yotam's try-out, 2026-10-12). 0 when none does.
 */
export function glowFor(
    bg: Backgrounds,
    hex: string,
    max: number,
    fillAlpha: number,
): number {
    const c = hexToRgba(hex) ?? YELLOW;
    const k = { fillAlpha: 0, glowAlpha: 0 } as Choice;
    for (let a = max; a > 0.001; a -= 0.05) {
        k.glowAlpha = a;
        k.fillAlpha = fillAlpha;
        if (textMargin(c, bg, k) >= 1) return Math.round(a * 100) / 100;
    }
    return 0;
}

/** the colour to draw in, for these backgrounds; the base when nothing was sampled */
export function chooseColor(bg: Backgrounds, k: Choice): string {
    const all = [...bg.edge, ...bg.inside];
    const base = hexToRgba(k.base) ?? YELLOW;
    if (!all.length) return rgbaToHex(base);
    if (k.mode === "contrast") {
        const scored = CONTRAST_PALETTE.map((hex) => {
            const c = hexToRgba(hex) ?? YELLOW;
            return { hex, score: worst(c, all), text: textMargin(c, bg, k) };
        });
        // none keeps the text readable: the one that harms it least
        if (!scored.some((s) => s.text >= 1))
            return scored.reduce((a, b) => (b.text > a.text ? b : a)).hex;
        const pool = scored.filter((s) => s.text >= 1);
        // the palette's order breaks near ties (within a tenth): yellow first, as
        // the study began, and blue before red, which reads as an error
        return pool.reduce((a, b) => (b.score > a.score * 1.1 ? b : a)).hex;
    }
    // near: the base, or its lightness moved as little as reaches the target
    const ok = (c: RGBA) =>
        worst(c, all) >= TARGET_CONTRAST && textKept(c, bg, k);
    if (ok(base)) return rgbaToHex(base);
    const { l, c: C, h } = toOklch(base);
    const limit = COLOR_RANGE_L[k.range];
    let best = base;
    let bestScore = textKept(base, bg, k) ? worst(base, all) : -1;
    for (let d = 0.01; d <= limit + 1e-9; d += 0.01) {
        for (const dir of [-1, 1]) {
            const L = l + dir * d;
            if (L < 0 || L > 1) continue;
            const c = fromOklch(L, C, h);
            if (ok(c)) return rgbaToHex(c);
            const s = textKept(c, bg, k) ? worst(c, all) : -1;
            if (s > bestScore + 1e-6) {
                best = c;
                bestScore = s;
            }
        }
    }
    // the target is out of reach within the limit: as close as it gets
    return rgbaToHex(best);
}
