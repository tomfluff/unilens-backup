/**
 * Highlight style presets — the visual design of the located-element outline is a
 * research variable, not a fixed look (docs/research/2026-09-19-phase1-research-probes.md).
 * highlight.ts renders from one of these parameter objects; adding a style is adding
 * a row. `wcag-ring` is the default and the floor: W3C Technique C40, two colour
 * bands ≥9:1 apart so one of them always clears 3:1 against a solid background.
 */

export interface HighlightStyle {
    /** two nested bands; width in screen px per band comes from the ringWidth setting */
    ring?: { inner: string; outer: string; offset: number };
    /** translucent tint over the element */
    fill?: { color: string; alpha: number };
    /** soft halo outside the ring */
    glow?: { color: string; blur: number; spread: number };
    /** darken everything except the element */
    dimOthers?: { alpha: number };
    /** brief opacity pulse when the highlight appears; never under reduced motion */
    pulse?: { cycles: number; ms: number; minOpacity: number };
}

const RING = { inner: "#000", outer: "#fff", offset: 3 };

export const HIGHLIGHT_PRESETS = {
    "wcag-ring": { ring: RING },
    "yellow-fill": { ring: RING, fill: { color: "#ffe600", alpha: 0.35 } },
    glow: { ring: RING, glow: { color: "#ffd400", blur: 18, spread: 6 } },
    "dim-others": { ring: RING, dimOthers: { alpha: 0.55 } },
    "dim-yellow-glow": {
        ring: RING,
        fill: { color: "#ffe600", alpha: 0.35 },
        glow: { color: "#ffd400", blur: 18, spread: 6 },
        dimOthers: { alpha: 0.55 },
    },
} satisfies Record<string, HighlightStyle>;

export type HighlightPreset = keyof typeof HIGHLIGHT_PRESETS;
