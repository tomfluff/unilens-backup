/**
 * Shared font-size scale ratios — page font settings and selection resize.
 * Level 1 = 100%. Large / extra-large are the previous 150% / 200% raised 30%.
 */
export const FONT_SCALE_LEVELS = [1, 1.95, 2.6] as const;

export type FontScaleLevel = 1 | 2 | 3;

export const A11Y_FONT_SIZE_LEVEL = {
    standard: 1,
    large: 2,
    xlarge: 3,
} as const satisfies Record<string, FontScaleLevel>;

export function levelToScale(level: FontScaleLevel): number {
    return FONT_SCALE_LEVELS[level - 1];
}

export function scaleToLevel(scale: number): FontScaleLevel {
    let best: FontScaleLevel = 1;
    let diff = Infinity;
    FONT_SCALE_LEVELS.forEach((s, i) => {
        const d = Math.abs(s - scale);
        if (d < diff) {
            diff = d;
            best = (i + 1) as FontScaleLevel;
        }
    });
    return best;
}

export function a11yFontSizeToScale(
    size: "standard" | "large" | "xlarge",
): number {
    return levelToScale(A11Y_FONT_SIZE_LEVEL[size]);
}

/** Language-independent hint, e.g. "195%". */
export function fontScalePercent(level: FontScaleLevel): string {
    return `${Math.round(levelToScale(level) * 100)}%`;
}

/** Live pixel size after a scale — page font and selection share this rounding. */
export function scaledFontPx(originalPx: number, scale: number): number {
    return Math.round(originalPx * scale * 100) / 100;
}

/** Panel Aa preview — same ratios as the live page / selection scale. */
export const PREVIEW_FONT_BASE_PX = 14;

export const PREVIEW_FONT_PX = [
    Math.round(PREVIEW_FONT_BASE_PX * FONT_SCALE_LEVELS[0]),
    Math.round(PREVIEW_FONT_BASE_PX * FONT_SCALE_LEVELS[1]),
    Math.round(PREVIEW_FONT_BASE_PX * FONT_SCALE_LEVELS[2]),
] as const;
