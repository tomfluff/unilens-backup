/**
 * The highlight look, in layers (builder's decision, 2026-09-23). Some choices
 * exclude each other and some stack:
 *
 *   backdrop   one of: none | dim | spotlight   (both darken the page, so never both)
 *   outline    one of: ring | band | brackets | underline | none
 *   additions  any of: fill, glow, numbered badges
 *   colour     one, for everything but the two-band ring
 *
 * The look stays a research variable (docs/research/2026-09-19-phase1-research-probes.md);
 * highlight.ts and minimap.ts render from lookFrom(settings). The two-band ring is
 * W3C Technique C40: black and white bands, so one of them always clears 3:1.
 */

export const BACKDROPS = {
    none: "No backdrop",
    dim: "Dim the rest of the page",
    spotlight: "Spotlight (darker, soft edges)",
} as const;
export type Backdrop = keyof typeof BACKDROPS;

export const OUTLINES = {
    band: "Thick band in the colour",
    ring: "Two-band ring (black and white)",
    brackets: "Corner brackets",
    underline: "Marker underline",
    none: "No outline",
} as const;
export type Outline = keyof typeof OUTLINES;

export interface HighlightLook {
    backdrop: Backdrop;
    outline: Outline;
    fill: boolean;
    glow: boolean;
    badges: boolean;
    color: string;
}

export const BACKDROP_ALPHA: Record<Exclude<Backdrop, "none">, number> = {
    dim: 0.55,
    spotlight: 0.72,
};
/** spotlight hole feather, px of blur */
export const SPOTLIGHT_FEATHER = 14;
export const FILL_ALPHA = 0.3;
export const RING = { inner: "#000", outer: "#fff" };
/** dark edge drawn around coloured strokes so a yellow band still reads on white */
export const EDGE = "#000";
/** gap between the element and its outline, px */
export const OUTLINE_OFFSET = 3;

export const isHexColor = (s: unknown): s is string =>
    typeof s === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s);

export function lookFrom(s: {
    hlBackdrop: Backdrop;
    hlOutline: Outline;
    hlFill: boolean;
    hlGlow: boolean;
    hlBadges: boolean;
    hlColor: string;
}): HighlightLook {
    return {
        backdrop: s.hlBackdrop,
        outline: s.hlOutline,
        fill: s.hlFill,
        glow: s.hlGlow,
        badges: s.hlBadges,
        color: isHexColor(s.hlColor) ? s.hlColor : "#ffd400",
    };
}

/** the minimap's look: the highlight's own when it follows it, else its own layers */
export function minimapLook(s: {
    mmFollowHighlight: boolean;
    mmBackdrop: Backdrop;
    mmOutline: Outline;
    mmFill: boolean;
    mmGlow: boolean;
    mmNumbers: boolean;
    hlBackdrop: Backdrop;
    hlOutline: Outline;
    hlFill: boolean;
    hlGlow: boolean;
    hlBadges: boolean;
    hlColor: string;
}): HighlightLook {
    return s.mmFollowHighlight
        ? lookFrom(s)
        : lookFrom({
              hlBackdrop: s.mmBackdrop,
              hlOutline: s.mmOutline,
              hlFill: s.mmFill,
              hlGlow: s.mmGlow,
              hlBadges: s.mmNumbers,
              hlColor: s.hlColor,
          });
}

/**
 * The outline actually drawn. "No outline" with nothing else on would draw
 * nothing at all; a highlight must always be visible, so it falls back to the ring.
 */
export function drawnOutline(look: HighlightLook): Outline {
    const other = look.fill || look.glow || look.backdrop !== "none";
    return look.outline === "none" && !other ? "ring" : look.outline;
}

export function colorWithAlpha(hex: string, alpha: number): string {
    const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex);
    if (!m) return hex;
    const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
    const n = Number.parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}
