/**
 * Display adjustment types and filter constants.
 */
import type { TextAdjustLevel } from "./textAdjustLevels";

export type { TextAdjustLevel } from "./textAdjustLevels";

export const PANEL_TABS = ["visual", "tools"] as const;
export type PanelTab = (typeof PANEL_TABS)[number];

export const A11Y_LANG_CODES = ["ja", "en"] as const;

/** One-tap presets, in panel order. Values live in accessibilityPresets.ts. */
export const A11Y_PRESET_ID_LIST = [
    "lowVision",
    "colorVision",
    "mild",
    "senior",
    "highContrast",
    "focus",
] as const;
export type A11yPresetId = (typeof A11Y_PRESET_ID_LIST)[number];

export function isA11yPresetId(n: unknown): n is A11yPresetId {
    return (A11Y_PRESET_ID_LIST as readonly unknown[]).includes(n);
}
export type A11yLang = (typeof A11Y_LANG_CODES)[number];

export type A11yFontSize = "standard" | "large" | "xlarge";
export type A11yFontFamily = "standard" | "ud" | "custom";
export type A11yLineHeight = "standard" | "wide";
export type A11yLetterSpacing = "standard" | "wide";
export type DisplayTheme =
    | "standard"
    | "light"
    | "dark"
    | "soft"
    | "high-contrast"
    | "invert";
export type DisplaySaturation = "standard" | "soft" | "low" | "mono" | "high";
export type DisplayContrast = "standard" | "strong" | "max";

/** 0 = off. Diameter of the pointer halo; the OS cursor size is unchanged. */
export const POINTER_HALO_FIXED_PX = [20, 40, 80] as const;
/** Diameter as a percent of the shorter viewport side (CSS `vmin`). */
export const POINTER_HALO_VIEWPORT_PCT = ["5%", "10%", "15%"] as const;
export const POINTER_HALO_ON_PX = [
    ...POINTER_HALO_FIXED_PX,
    ...POINTER_HALO_VIEWPORT_PCT,
] as const;
export const POINTER_HALO_PX = [0, ...POINTER_HALO_ON_PX] as const;
export type PointerHaloFixedPx = (typeof POINTER_HALO_FIXED_PX)[number];
export type PointerHaloViewportPct = (typeof POINTER_HALO_VIEWPORT_PCT)[number];
export type PointerHaloPx = (typeof POINTER_HALO_PX)[number];

/** Size used when the visitor turns the halo on. */
export const POINTER_HALO_DEFAULT_PX = 20 satisfies Exclude<PointerHaloPx, 0>;

export function isPointerHaloViewportPct(
    n: PointerHaloPx,
): n is PointerHaloViewportPct {
    return n === "5%" || n === "10%" || n === "15%";
}

export function pointerHaloOn(
    n: PointerHaloPx,
): n is Exclude<PointerHaloPx, 0> {
    return n !== 0;
}

/** CSS width/height for the on-page halo. Viewport sizes use `vmin`. */
export function pointerHaloCssDiameter(size: PointerHaloPx): string {
    if (size === 0) return "0px";
    if (isPointerHaloViewportPct(size)) return `${size.slice(0, -1)}vmin`;
    return `${size}px`;
}

/** Choice-card preview diameter. Viewport sizes are scaled, not 1:1 px. */
export function pointerHaloPreviewDiameter(size: PointerHaloPx): number {
    if (size === "5%") return 22;
    if (size === "10%") return 32;
    if (size === "15%") return 42;
    if (typeof size === "number") return size;
    return POINTER_HALO_DEFAULT_PX;
}

export function normalizePointerHaloPx(n: unknown): PointerHaloPx {
    if (n === 5 || n === "5") return 20;
    if (n === 0 || n === 20 || n === 40 || n === 80) return n;
    if (n === "0" || n === "20" || n === "40" || n === "80") {
        return Number(n) as PointerHaloPx;
    }
    if (n === "5%" || n === "10%" || n === "15%") return n;
    return 0;
}

/** 0 = off. Full-width clear band height in CSS pixels, centered on the pointer. */
export const FOCUS_CURSOR_BAND_SIZES = [80, 150, 240] as const;
export const FOCUS_CURSOR_BAND_PX = [0, ...FOCUS_CURSOR_BAND_SIZES] as const;
export type FocusCursorBandPx = (typeof FOCUS_CURSOR_BAND_PX)[number];

/** Band height used when the visitor turns the focus cursor on. */
export const FOCUS_CURSOR_DEFAULT_BAND_PX =
    150 satisfies Exclude<FocusCursorBandPx, 0>;

export function focusCursorOn(
    n: FocusCursorBandPx,
): n is Exclude<FocusCursorBandPx, 0> {
    return n !== 0;
}

export function normalizeFocusCursorBandPx(n: unknown): FocusCursorBandPx {
    if (n === 0 || n === 80 || n === 150 || n === 240) return n;
    if (n === "0" || n === "80" || n === "150" || n === "240") {
        return Number(n) as FocusCursorBandPx;
    }
    return 0;
}

/** Fluorescent fills for the pointer halo. */
export const POINTER_HALO_COLORS = [
    "yellow",
    "green",
    "pink",
    "orange",
    "cyan",
] as const;
export type PointerHaloColor = (typeof POINTER_HALO_COLORS)[number];
export const POINTER_HALO_DEFAULT_COLOR = "yellow" satisfies PointerHaloColor;

/** RGB for each fluorescent color. One channel stays 0 so chroma stays high after blending. */
export const POINTER_HALO_RGB = {
    yellow: [255, 255, 0],
    green: [0, 255, 40],
    pink: [255, 0, 196],
    orange: [255, 48, 0],
    cyan: [0, 255, 255],
} as const satisfies Record<
    PointerHaloColor,
    readonly [number, number, number]
>;

/**
 * Halo fill strength. `thin` is most see-through; `strong` is the most opaque
 * that still leaves the page in the majority of the pixel so text stays readable.
 */
export const POINTER_HALO_OPACITIES = ["thin", "medium", "strong"] as const;
export type PointerHaloOpacity = (typeof POINTER_HALO_OPACITIES)[number];
export const POINTER_HALO_DEFAULT_OPACITY =
    "medium" satisfies PointerHaloOpacity;

export const POINTER_HALO_ALPHA = {
    thin: 0.2,
    medium: 0.35,
    strong: 0.48,
} as const satisfies Record<PointerHaloOpacity, number>;

export function normalizePointerHaloColor(n: unknown): PointerHaloColor {
    if (
        n === "yellow" ||
        n === "green" ||
        n === "pink" ||
        n === "orange" ||
        n === "cyan"
    ) {
        return n;
    }
    return POINTER_HALO_DEFAULT_COLOR;
}

export function normalizePointerHaloOpacity(n: unknown): PointerHaloOpacity {
    if (n === "thin" || n === "medium" || n === "strong") return n;
    return POINTER_HALO_DEFAULT_OPACITY;
}

export function pointerHaloFillCss(
    color: PointerHaloColor,
    opacity: PointerHaloOpacity,
): string {
    const [r, g, b] = POINTER_HALO_RGB[color];
    return `rgba(${r}, ${g}, ${b}, ${POINTER_HALO_ALPHA[opacity]})`;
}

/**
 * Reading-guide fill + outline. Five pairs so every candidate color is
 * used at least once. Fill and outline always differ. The black-fill pair
 * keeps a yellow outline; the other four keep a non-yellow outline so they
 * still read against high-contrast yellow text.
 */
export const READING_GUIDE_STYLES = [
    "whiteBlue",
    "blackYellow",
    "cyanGreen",
    "magentaNavy",
    "orangeWhite",
] as const;
export type ReadingGuideStyle = (typeof READING_GUIDE_STYLES)[number];
export const READING_GUIDE_DEFAULT_STYLE =
    "blackYellow" satisfies ReadingGuideStyle;

export const READING_GUIDE_PAIRS = {
    whiteBlue: {
        fill: "rgb(255, 255, 255)",
        edge: "rgb(0, 85, 255)",
    },
    blackYellow: {
        fill: "rgb(17, 17, 17)",
        edge: "rgb(255, 255, 0)",
    },
    cyanGreen: {
        fill: "rgb(0, 255, 255)",
        edge: "rgb(0, 255, 40)",
    },
    magentaNavy: {
        fill: "rgb(255, 0, 196)",
        edge: "rgb(0, 32, 128)",
    },
    orangeWhite: {
        fill: "rgb(255, 48, 0)",
        edge: "rgb(255, 255, 255)",
    },
} as const satisfies Record<ReadingGuideStyle, { fill: string; edge: string }>;

const READING_GUIDE_STYLE_ALIASES: Record<string, ReadingGuideStyle> = {
    blackWhite: "blackYellow",
    cyanNavy: "cyanGreen",
    orangeBlue: "orangeWhite",
};

export function normalizeReadingGuideStyle(n: unknown): ReadingGuideStyle {
    if (typeof n === "string" && n in READING_GUIDE_STYLE_ALIASES) {
        return READING_GUIDE_STYLE_ALIASES[n];
    }
    for (const style of READING_GUIDE_STYLES) {
        if (n === style) return style;
    }
    return READING_GUIDE_DEFAULT_STYLE;
}

export function readingGuidePairCss(style: ReadingGuideStyle): {
    fill: string;
    edge: string;
} {
    return READING_GUIDE_PAIRS[style];
}

/** Vertical placement of the reading-guide bar relative to the pointer. */
export const READING_GUIDE_POSITIONS = ["above", "center", "below"] as const;
export type ReadingGuidePosition = (typeof READING_GUIDE_POSITIONS)[number];
export const READING_GUIDE_DEFAULT_POSITION =
    "above" satisfies ReadingGuidePosition;

export function normalizeReadingGuidePosition(
    n: unknown,
): ReadingGuidePosition {
    if (n === "above" || n === "center" || n === "below") return n;
    return READING_GUIDE_DEFAULT_POSITION;
}

/**
 * Text outline (webkit-text-stroke). Nine fill/stroke pairs.
 *
 * Fill and edge always differ in luminance, and the chromatic pairs also
 * differ in hue, so the rim reads as its own color rather than a shadow:
 *   - white/black and black/white: max luminance (still split after mono)
 *   - yellow/blue and blue/yellow: opponent hues. Yellow+black becomes
 *     yellow+white under invert(1) hue-rotate(180deg); blue does not.
 *   - white/magenta: a third hue, off the yellow/blue axis
 *   - navy/yellow, black/cyan, green/white, orange/white: reuse text-plate
 *     and reading-guide hues so cyan, green, orange, and navy axes are covered
 * Chromatic edges stay saturated (not black) so they do not vanish on
 * dark / high-contrast backgrounds.
 */
export const TEXT_STROKE_STYLES = [
    "whiteBlack",
    "blackWhite",
    "yellowBlue",
    "blueYellow",
    "whiteMagenta",
    "navyYellow",
    "blackCyan",
    "greenWhite",
    "orangeWhite",
] as const;
export type TextStrokeStyle = (typeof TEXT_STROKE_STYLES)[number];
export const TEXT_STROKE_DEFAULT_STYLE = "whiteBlack" satisfies TextStrokeStyle;

/** Relative to the glyph's font-size so small and large type stay in proportion. */
export const TEXT_STROKE_WIDTH = "0.1em";

export const TEXT_STROKE_PAIRS = {
    whiteBlack: {
        fill: "rgb(255, 255, 255)",
        edge: "rgb(0, 0, 0)",
    },
    blackWhite: {
        fill: "rgb(0, 0, 0)",
        edge: "rgb(255, 255, 255)",
    },
    yellowBlue: {
        fill: "rgb(255, 255, 0)",
        edge: "rgb(0, 80, 255)",
    },
    blueYellow: {
        fill: "rgb(0, 80, 255)",
        edge: "rgb(255, 255, 0)",
    },
    whiteMagenta: {
        fill: "rgb(255, 255, 255)",
        edge: "rgb(255, 0, 196)",
    },
    navyYellow: {
        fill: "rgb(0, 26, 102)",
        edge: "rgb(255, 255, 0)",
    },
    blackCyan: {
        fill: "rgb(0, 0, 0)",
        edge: "rgb(0, 255, 255)",
    },
    greenWhite: {
        fill: "rgb(0, 61, 10)",
        edge: "rgb(255, 255, 255)",
    },
    orangeWhite: {
        fill: "rgb(255, 48, 0)",
        edge: "rgb(255, 255, 255)",
    },
} as const satisfies Record<TextStrokeStyle, { fill: string; edge: string }>;

const TEXT_STROKE_STYLE_ALIASES: Record<string, TextStrokeStyle> = {
    yellowBlack: "yellowBlue",
    blackYellow: "blueYellow",
    cyanNavy: "whiteMagenta",
};

export function normalizeTextStrokeStyle(n: unknown): TextStrokeStyle {
    if (typeof n === "string" && n in TEXT_STROKE_STYLE_ALIASES) {
        return TEXT_STROKE_STYLE_ALIASES[n];
    }
    for (const style of TEXT_STROKE_STYLES) {
        if (n === style) return style;
    }
    return TEXT_STROKE_DEFAULT_STYLE;
}

export function textStrokePairCss(style: TextStrokeStyle): {
    fill: string;
    edge: string;
} {
    return TEXT_STROKE_PAIRS[style];
}

/**
 * Solid plate behind glyphs so type never sits on leftover light pixels
 * (white photos, unmarked plates) during high-contrast. Lab offers four
 * more background/foreground pairs besides the classic black/yellow.
 */
export const TEXT_PLATE_STYLES = [
    "blackYellow",
    "blackWhite",
    "navyYellow",
    "blackCyan",
    "greenWhite",
] as const;
export type TextPlateStyle = (typeof TEXT_PLATE_STYLES)[number];
export const TEXT_PLATE_DEFAULT_STYLE = "blackYellow" satisfies TextPlateStyle;

export const TEXT_PLATE_PAIRS = {
    blackYellow: {
        bg: "rgb(0, 0, 0)",
        fg: "rgb(255, 255, 0)",
    },
    blackWhite: {
        bg: "rgb(0, 0, 0)",
        fg: "rgb(255, 255, 255)",
    },
    navyYellow: {
        bg: "rgb(0, 26, 102)",
        fg: "rgb(255, 255, 0)",
    },
    blackCyan: {
        bg: "rgb(0, 0, 0)",
        fg: "rgb(0, 255, 255)",
    },
    greenWhite: {
        bg: "rgb(0, 61, 10)",
        fg: "rgb(255, 255, 255)",
    },
} as const satisfies Record<TextPlateStyle, { bg: string; fg: string }>;

export function normalizeTextPlateStyle(n: unknown): TextPlateStyle {
    for (const style of TEXT_PLATE_STYLES) {
        if (n === style) return style;
    }
    return TEXT_PLATE_DEFAULT_STYLE;
}

export function textPlatePairCss(style: TextPlateStyle): {
    bg: string;
    fg: string;
} {
    return TEXT_PLATE_PAIRS[style];
}

export function textPlateActive(theme: string): boolean {
    return theme === "high-contrast";
}

/**
 * How far high contrast reaches, three steps (chosen in Lab next to the
 * plate colors):
 *  - text:  body text only. Colored fills (buttons, tags, bands, gray
 *           chips) keep the host color; small parts and controls keep the
 *           host text colors inside them too. Pictures, gradients and SVG
 *           keep the host colors.
 *  - parts: body text and every fill that holds text: the fill takes the
 *           plate background, so the text inside sits on one color (no
 *           patchwork of plates over a colored button), at any width.
 *           Fills without text (switch tracks, swatches, progress bars)
 *           keep their tone. Pictures, gradients and SVG as in `text`.
 *  - all:   `parts`, and text over pictures gets a plate under each line,
 *           gradient backgrounds are dropped, SVG text takes the plate
 *           text color with a plate-colored outline.
 */
export const HC_TEXT_SCOPES = ["text", "parts", "all"] as const;
export type HcTextScope = (typeof HC_TEXT_SCOPES)[number];
export const HC_TEXT_SCOPE_DEFAULT = "parts" satisfies HcTextScope;

export function normalizeHcTextScope(n: unknown): HcTextScope {
    for (const scope of HC_TEXT_SCOPES) {
        if (n === scope) return scope;
    }
    return HC_TEXT_SCOPE_DEFAULT;
}

export type AutoTextMode = "off" | "viewport" | "content" | "combined";

export interface A11ySettings {
    fontSize: A11yFontSize;
    fontFamily: A11yFontFamily;
    customFontFamily: string | null;
    lineHeight: A11yLineHeight;
    letterSpacing: A11yLetterSpacing;
    theme: DisplayTheme;
    saturation: DisplaySaturation;
    contrast: DisplayContrast;
    linkUnderline: boolean;
    linkBackground: boolean;
    linkBorder: boolean;
    imageBorder: boolean;
    elementHighlight: boolean;
    /** 0 = off. 1–3 enlarge the cursor and thicken the focus ring. */
    focusEnhanceLevel: TextAdjustLevel;
    /**
     * 0 = off. Fixed CSS-pixel diameters, or a percent of the shorter
     * viewport side (`5%` / `10%` / `15%` → CSS `vmin`).
     */
    pointerHaloPx: PointerHaloPx;
    pointerHaloColor: PointerHaloColor;
    pointerHaloOpacity: PointerHaloOpacity;
    /**
     * 0 = off. Full-width clear band height in CSS pixels, centered on the
     * pointer; the rest of the viewport is dimmed.
     */
    focusCursorBandPx: FocusCursorBandPx;
    /** A 600×10px bar that follows the pointer as a reading ruler. */
    readingGuide: boolean;
    readingGuideStyle: ReadingGuideStyle;
    readingGuidePosition: ReadingGuidePosition;
    /** Outline host-page glyphs with -webkit-text-stroke. */
    textStroke: boolean;
    textStrokeStyle: TextStrokeStyle;
    /** High-contrast plate background + type pair, chosen in Lab. */
    textPlateStyle: TextPlateStyle;
    /** What high contrast repaints: body text / + parts / everything. */
    hcTextScope: HcTextScope;
    reduceMotion: boolean;
    smallTextBoostLevel: TextAdjustLevel;
    bodyTextExpandLevel: TextAdjustLevel;
}

export const A11Y_DEFAULTS: A11ySettings = {
    fontSize: "standard",
    fontFamily: "standard",
    customFontFamily: null,
    lineHeight: "standard",
    letterSpacing: "standard",
    theme: "standard",
    saturation: "standard",
    contrast: "standard",
    linkUnderline: false,
    linkBackground: false,
    linkBorder: false,
    imageBorder: false,
    elementHighlight: false,
    focusEnhanceLevel: 0,
    pointerHaloPx: 0,
    pointerHaloColor: POINTER_HALO_DEFAULT_COLOR,
    pointerHaloOpacity: POINTER_HALO_DEFAULT_OPACITY,
    focusCursorBandPx: 0,
    readingGuide: false,
    readingGuideStyle: READING_GUIDE_DEFAULT_STYLE,
    readingGuidePosition: READING_GUIDE_DEFAULT_POSITION,
    textStroke: false,
    textStrokeStyle: TEXT_STROKE_DEFAULT_STYLE,
    textPlateStyle: TEXT_PLATE_DEFAULT_STYLE,
    hcTextScope: HC_TEXT_SCOPE_DEFAULT,
    reduceMotion: false,
    smallTextBoostLevel: 0,
    bodyTextExpandLevel: 0,
};

export const SATURATION_FILTER: Record<DisplaySaturation, number> = {
    standard: 1,
    soft: 0.5,
    low: 0.4,
    mono: 0,
    high: 1.8,
};

export const CONTRAST_FILTER: Record<DisplayContrast, number> = {
    standard: 1,
    strong: 1.4,
    max: 1.8,
};

export const LETTER_SPACING_EM: Record<A11yLetterSpacing, string> = {
    standard: "0",
    wide: "0.12em",
};

export const WORD_SPACING_EM: Record<A11yLetterSpacing, string> = {
    standard: "0",
    wide: "0.16em",
};

export const STANDARD_FONT_STACK =
    'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
export const UD_FONT_STACK =
    '"BIZ UDPGothic", "Hiragino Sans", "Yu Gothic UI", "Meiryo", sans-serif';

export const A11Y_SETTING_KEYS = [
    "fontSize",
    "fontFamily",
    "customFontFamily",
    "lineHeight",
    "letterSpacing",
    "theme",
    "saturation",
    "contrast",
    "linkUnderline",
    "linkBackground",
    "linkBorder",
    "imageBorder",
    "elementHighlight",
    "focusEnhanceLevel",
    "pointerHaloPx",
    "pointerHaloColor",
    "pointerHaloOpacity",
    "focusCursorBandPx",
    "readingGuide",
    "readingGuideStyle",
    "readingGuidePosition",
    "textStroke",
    "textStrokeStyle",
    "textPlateStyle",
    "hcTextScope",
    "reduceMotion",
    "smallTextBoostLevel",
    "bodyTextExpandLevel",
] as const satisfies readonly (keyof A11ySettings)[];
