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
 * High contrast only: a chromatic fill with a side longer than
 * SMALL_FILL_SIDE_PX (a page band, a section background) takes the black
 * surface instead of a tone. A tone is only held to 4.6:1 against the theme
 * text, so a page-wide blue band left yellow text at the AA floor where the
 * black surface gives ~19:1. Small colored marks (switches, badges, chips,
 * brand buttons) keep their hue so states told apart by fill stay apart.
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
 * (Infinity when unknown and the element may be large; fillArea also gives
 * Infinity for a box with a side longer than SMALL_FILL_SIDE_PX).
 * `largeToneIsSurface` (high contrast): chromatic fills that large are
 * surface, not tone.
 */
export function fillTier(
    rgb: Rgb,
    area: number,
    largeToneIsSurface = false,
): FillTier {
    if (isChromatic(rgb))
        return largeToneIsSurface && area === Number.POSITIVE_INFINITY
            ? "surface"
            : "tone";
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
    /** Large chromatic fills take the surface (high contrast). */
    largeToneIsSurface?: boolean;
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

/** The theme's own border color: what a plain border line gets. */
export const THEME_BORDER = "var(--unilens-a11y-display-border)";
/** The theme's surface: what a light neutral shape gets (like its fill). */
export const THEME_SURFACE = "var(--unilens-a11y-display-surface)";
/**
 * A border side at least this wide is paint, not a line: ribbons, arrow
 * heads and CSS triangles are drawn from thick borders.
 */
export const SHAPE_BORDER_PX = 4;

export interface BorderSide {
    /** Computed border-*-color, read with the theme's border color lifted. */
    color: string;
    /** Computed border-*-width in px. */
    width: number;
}

/**
 * Themed `border-color` (four sides) for a host border that is not a plain
 * line, or null when the theme border applies to every side as before.
 *
 * The themes used to give every side of every border the theme border
 * color, so the hidden sides of a CSS triangle showed (a sort arrow became
 * a square), a tab's transparent idle underline appeared on every tab, and a
 * ribbon drawn from 11px red borders turned into a yellow block over its
 * yellow label in high contrast. Now:
 *  - a transparent side stays transparent;
 *  - a thick side (SHAPE_BORDER_PX+) is painted like a fill of that color:
 *    a colored one keeps the host hue (tone), a mid gray gets the muted
 *    gray and a light one the surface, so a ribbon or speech-bubble tail
 *    matches the fill it extends; a dark neutral one (an arrow head, which
 *    tracks the text) and one in the text color (currentColor) keep the
 *    theme border, which is readable on the page;
 *  - a thin opaque side keeps the theme border color.
 * `text` is the element's computed color, to tell currentColor sides.
 */
export function themedBorderColor(
    sides: readonly BorderSide[],
    text: string,
    palette: FillPalette | null,
): string | null {
    if (!palette || sides.length !== 4) return null;
    let special = false;
    const out = sides.map(({ color, width }) => {
        if (!(width > 0)) return THEME_BORDER;
        const c = parseCssColor(color);
        if (!c) return THEME_BORDER;
        if (c[3] <= 0.1) {
            special = true;
            return "transparent";
        }
        if (width < SHAPE_BORDER_PX) return THEME_BORDER;
        if (color.replace(/\s/g, "") === (text ?? "").replace(/\s/g, ""))
            return THEME_BORDER;
        const rgb: Rgb = [c[0], c[1], c[2]];
        if (!isChromatic(rgb) && luminance(rgb) < 0.1) return THEME_BORDER;
        special = true;
        // Shapes are marks, whatever box they sit on: never the large-fill
        // rule (high contrast), so a ribbon keeps the hue of its label.
        return themedFill(fillTier(rgb, 0), rgb, palette) ?? THEME_SURFACE;
    });
    return special ? out.join(" ") : null;
}

/**
 * Whether large chromatic fills (page bands) take the surface: only in high
 * contrast, where the surface is black and the text needs more than a tone
 * fill's 4.6:1.
 */
export function largeToneIsSurfaceFor(theme: string | null): boolean {
    return theme === "high-contrast";
}

/** Saturation cap per theme: the calm (soft) theme keeps fills muted. */
export function saturationCapFor(theme: string | null): number {
    return theme === "soft" ? 0.35 : 0.6;
}

/**
 * High contrast reach (HcTextScope in accessibilityStoreTypes.ts) for one
 * element's own host fill, given its tier (size rule for dark neutrals
 * applied, the large-colored-band rule not) and whether it holds text:
 *  - "default": the themed fill as in every other theme (fillFor)
 *  - "surface": the themed surface (the plate background in high contrast)
 *  - "host":    the host's own color
 * Reach "text" keeps every colored / gray fill the host's. Reach "parts" and
 * "all" put every fill that holds text on the surface, at any size, so the
 * text plates inside do not patch a colored box; fills without text
 * (switch tracks, swatches, bars) keep their tone so states stay apart.
 */
export type ReachDecision = "default" | "surface" | "host";

export function reachDecision(
    reach: "text" | "parts" | "all" | null,
    tier: FillTier,
    holdsText: boolean,
): ReachDecision {
    if (!reach) return "default";
    if (tier === "surface") return "surface";
    if (reach === "text") return "host";
    return holdsText ? "surface" : "default";
}

/**
 * A colored box small enough to be one part (button, tag, chip, badge)
 * rather than a band: no side longer than SMALL_FILL_SIDE_PX, nor than
 * 60% of the viewport width (on a phone, a full-width 390px header bar is
 * a band, not a part).
 */
export function isSmallPart(
    width: number,
    height: number,
    viewportWidth: number,
): boolean {
    const limit = Math.min(SMALL_FILL_SIDE_PX, viewportWidth * 0.6);
    return width <= limit && height <= SMALL_FILL_SIDE_PX;
}

/**
 * A computed background-image painted only by gradients (no url() picture):
 * a promo card, a gradient header or button. Clear gradients count too;
 * dropping them changes nothing.
 */
export function isGradientOnly(value: string): boolean {
    if (!value || value === "none") return false;
    return /gradient\(/i.test(value) && !/url\(/i.test(value);
}
