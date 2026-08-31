/**
 * Display adjustment types and filter constants.
 */
import {
    normalizeTextAdjustLevel,
    type TextAdjustLevel,
} from "./textAdjustLevels";

export type { TextAdjustLevel } from "./textAdjustLevels";

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
    focusEnhance: boolean;
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
    focusEnhance: false,
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
    "focusEnhance",
    "reduceMotion",
    "smallTextBoostLevel",
    "bodyTextExpandLevel",
] as const satisfies readonly (keyof A11ySettings)[];
