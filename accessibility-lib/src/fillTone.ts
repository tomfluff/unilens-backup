/**
 * Themed fills that keep host background colors apart.
 *
 * The color themes used to paint every opaque host background with the one
 * surface color. Anything that told states or items apart only by its fill
 * then looked the same: a switch on / off, a progress bar and its track, a
 * selected chip, color swatches, a <mark>, a red badge.
 *
 * Each sampled host fill now falls into one of three tiers:
 *  - surface: light neutrals (cards, panels, white buttons), and large dark
 *    neutrals (dark header / footer bars) — the theme's surface, as before
 *  - muted:   mid neutrals (#ccc tracks, #ddd dividers) and small dark
 *    neutrals (a dark tooltip, an "on" chip in charcoal) — a gray one step
 *    away from the surface
 *  - tone:    chromatic fills — the host hue, at a lightness that keeps the
 *    theme's text color readable on it and stays as far from the page
 *    background as that allows
 *
 * Text drawn on muted / tone fills keeps the theme text and link colors
 * (they are set on every element), so tone fills are computed against them:
 * text at 4.6:1, links at 3:1, as far from the page as that allows. The
 * muted gray sits halfway (in contrast terms) between the theme surface and
 * that tone level, so a gray track, its white knob and a colored fill are
 * each a clear step apart in every theme — and text on the gray is even
 * more readable than on the tone.
 */

export type Rgb = [number, number, number];
export type FillTier = "surface" | "muted" | "tone";

/**
 * Small enough to be an indicator / control rather than a page band: at
 * most this area, and no side longer than SMALL_FILL_SIDE_PX (a full-width
 * 24px top bar is a band, not a mark).
 */
export const SMALL_FILL_AREA_PX = 40_000;
export const SMALL_FILL_SIDE_PX = 400;

/** Area to pass to fillTier: Infinity unless the box is small on both sides. */
export function fillArea(width: number, height: number): number {
    if (width > SMALL_FILL_SIDE_PX || height > SMALL_FILL_SIDE_PX)
        return Number.POSITIVE_INFINITY;
    return width * height;
}

const TONE_CONTRAST = 4.6;
/**
 * Links drawn on a fill (a link styled as a button) need 3:1 there. Holding
 * them to the text targets let a theme whose link color sits far from its
 * text color (the calm theme's green) push every fill next to the page
 * background, which is what the tiers exist to avoid.
 */
const LINK_CONTRAST = 3;

/** rgb() / rgba() / #rgb / #rrggbb → [r, g, b, a]; null when unreadable. */
export function parseCssColor(
    value: string,
): [number, number, number, number] | null {
    const v = value.trim().toLowerCase();
    const hex = v.match(/^#([0-9a-f]{3,8})$/);
    if (hex) {
        let h = hex[1];
        if (h.length === 3 || h.length === 4)
            h = [...h].map((c) => c + c).join("");
        if (h.length !== 6 && h.length !== 8) return null;
        const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
        return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1];
    }
    const m = v.match(
        /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/,
    );
    if (!m) return null;
    let a = 1;
    if (m[4] !== undefined)
        a = m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return [+m[1], +m[2], +m[3], a];
}

function channel(v: number): number {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function luminance([r, g, b]: Rgb): number {
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
    const la = luminance(a);
    const lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function rgbToHsl([r, g, b]: Rgb): [number, number, number] {
    const R = r / 255;
    const G = g / 255;
    const B = b / 255;
    const max = Math.max(R, G, B);
    const min = Math.min(R, G, B);
    const l = (max + min) / 2;
    if (max === min) return [0, 0, l];
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h: number;
    if (max === R) h = (G - B) / d + (G < B ? 6 : 0);
    else if (max === G) h = (B - R) / d + 2;
    else h = (R - G) / d + 4;
    return [h * 60, s, l];
}

export function hslToRgb(h: number, s: number, l: number): Rgb {
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) =>
        l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [
        Math.round(f(0) * 255),
        Math.round(f(8) * 255),
        Math.round(f(4) * 255),
    ];
}

/** Hue carries meaning when the fill is clearly colored, not a tinted gray. */
export function isChromatic([r, g, b]: Rgb): boolean {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const chroma = max - min;
    return chroma >= 40 && max > 0 && chroma / max >= 0.25;
}

/**
 * Tier of an opaque host fill. `area` is the element's box in CSS px²
 * (Infinity when unknown and the element may be large).
 */
export function fillTier(rgb: Rgb, area: number): FillTier {
    if (isChromatic(rgb)) return "tone";
    const l = luminance(rgb);
    if (l >= 0.75) return "surface";
    if (l >= 0.1) return "muted";
    return area < SMALL_FILL_AREA_PX ? "muted" : "surface";
}

/**
 * The lightness of hue/saturation that is furthest from the page while
 * every color in `text` keeps `target`:1 on it. Light text (dark themes):
 * the lightest fill that still passes. Dark text (light themes): the darkest.
 */
function lightnessFor(
    h: number,
    s: number,
    palette: FillPalette,
    target: number,
): number {
    const lightText = luminance(palette.text) > 0.5;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 20; i++) {
        const mid = (lo + hi) / 2;
        const fill = hslToRgb(h, s, mid);
        const ok =
            contrastRatio(palette.text, fill) >= target &&
            (!palette.link ||
                contrastRatio(palette.link, fill) >= LINK_CONTRAST);
        if (lightText) {
            if (ok) lo = mid;
            else hi = mid;
        } else if (ok) hi = mid;
        else lo = mid;
    }
    return lightText ? lo : hi;
}

/** The neutral gray of a given relative luminance. */
function grayWithLuminance(target: number): Rgb {
    let lo = 0;
    let hi = 255;
    for (let i = 0; i < 12; i++) {
        const mid = (lo + hi) / 2;
        if (luminance([mid, mid, mid]) < target) lo = mid;
        else hi = mid;
    }
    const v = Math.round((lo + hi) / 2);
    return [v, v, v];
}

export interface FillPalette {
    /** The theme's text color, drawn on top of every fill. */
    text: Rgb;
    /** The theme's link color (a link styled as a button sits on a fill). */
    link?: Rgb;
    /** The theme's surface color, the tier the muted gray steps away from. */
    surface?: Rgb;
    /** Highest saturation a tone fill keeps (lower for the calm theme). */
    saturationCap: number;
}

/** The themed color for a muted / tone fill, as `rgb(r, g, b)`. */
export function themedFill(
    tier: FillTier,
    host: Rgb,
    palette: FillPalette,
): string | null {
    if (tier === "surface") return null;
    let rgb: Rgb;
    if (tier === "muted") {
        const tone = luminance(
            hslToRgb(0, 0, lightnessFor(0, 0, palette, TONE_CONTRAST)),
        );
        const surface = palette.surface ? luminance(palette.surface) : tone;
        rgb = grayWithLuminance(
            Math.sqrt((surface + 0.05) * (tone + 0.05)) - 0.05,
        );
    } else {
        const [h, s] = rgbToHsl(host);
        const sat = Math.min(palette.saturationCap, Math.max(0.3, s));
        rgb = hslToRgb(h, sat, lightnessFor(h, sat, palette, TONE_CONTRAST));
    }
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

/** Saturation cap per theme: the calm (soft) theme keeps fills muted. */
export function saturationCapFor(theme: string | null): number {
    return theme === "soft" ? 0.35 : 0.6;
}
