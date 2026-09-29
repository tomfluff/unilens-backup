/**
 * Display adjustment panel — choice metadata (order, scales, preview colors).
 *
 * Display strings live in accessibilityI18n.ts. This file only holds
 * language-independent data; names that vary per language are exposed as
 * functions that pull from `t()`.
 */

import { t } from "./accessibilityI18n";
import type { IconName } from "./accessibilityPanelUI";
import type {
    DisplayContrast,
    DisplaySaturation,
    DisplayTheme,
    PanelTab,
    TextAdjustLevel,
} from "./accessibilityStore";
import type { AutoTextMode } from "./accessibilityStoreTypes";
import { PANEL_TABS } from "./accessibilityStoreTypes";
import type { FontScaleLevel } from "./fontScales";
import { type SpeechRateLevel, speechRateHint } from "./speechLevels";
import { bodyTextExpandHint, smallTextBoostHint } from "./textAdjustLevels";

export { fontScaleLabel } from "./accessibilityI18n";
// The saturation / contrast multipliers and the font stacks have a single
// source of truth in the store. Re-export them here so the panel uses the
// same values.
export {
    CONTRAST_FILTER,
    SATURATION_FILTER,
    STANDARD_FONT_STACK,
    UD_FONT_STACK,
} from "./accessibilityStore";
export { PANEL_TABS, type PanelTab } from "./accessibilityStoreTypes";
export { fontScalePercent, PREVIEW_FONT_PX } from "./fontScales";
export { SPEECH_RATE_LEVELS } from "./speechLevels";
export { TEXT_ADJUST_LEVELS } from "./textAdjustLevels";

const TAB_ICONS: Record<PanelTab, IconName> = {
    visual: "contrast",
    tools: "lab",
};

/** Tab order and icons. Display names vary per language, so they come from t(). */
export const TABS: { id: PanelTab; iconName: IconName }[] = PANEL_TABS.map(
    (id) => ({
        id,
        iconName: TAB_ICONS[id],
    }),
);

export function tabLabel(id: PanelTab): string {
    return t().tabs[id];
}

/** Saturation choice order (labels come from t().saturation). */
export const DISPLAY_SATURATIONS: DisplaySaturation[] = [
    "standard",
    "soft",
    "low",
    "mono",
    "high",
];

/** Contrast choice order (labels come from t().contrast). */
export const DISPLAY_CONTRASTS: DisplayContrast[] = ["standard", "strong", "max"];

/** Standard → … → last → standard. Lab tab cycles with one button per axis. */
export function nextDisplaySaturation(
    current: DisplaySaturation,
): DisplaySaturation {
    const i = DISPLAY_SATURATIONS.indexOf(current);
    const next = DISPLAY_SATURATIONS[(i + 1) % DISPLAY_SATURATIONS.length];
    return next ?? "standard";
}

export function nextDisplayContrast(current: DisplayContrast): DisplayContrast {
    const i = DISPLAY_CONTRASTS.indexOf(current);
    const next = DISPLAY_CONTRASTS[(i + 1) % DISPLAY_CONTRASTS.length];
    return next ?? "standard";
}

/** Color-mode choice order (swatches / labels come from THEME_SWATCH and t().theme). */
export const DISPLAY_THEMES: DisplayTheme[] = [
    "standard",
    "light",
    "soft",
    "dark",
    "high-contrast",
    "invert",
];

/** Standard → … → last → standard. Lab tab cycles with one button. */
export function nextDisplayTheme(current: DisplayTheme): DisplayTheme {
    const i = DISPLAY_THEMES.indexOf(current);
    const next = DISPLAY_THEMES[(i + 1) % DISPLAY_THEMES.length];
    return next ?? "standard";
}

/** Color swatches (background / text) shown on the color-mode choice buttons. */
export const THEME_SWATCH: Record<DisplayTheme, [string, string]> = {
    standard: ["#ffffff", "#6b6b6b"],
    light: ["#f5f5f5", "#222222"],
    soft: ["#f5f2eb", "#2b2b2b"],
    dark: ["#1a1a2e", "#f0f0f0"],
    "high-contrast": ["#000000", "#ffff00"],
    invert: ["#0a0a0a", "#f5f5f5"],
};

/** Order of the auto-adjustment detection modes. */
export const AUTO_MODES: Exclude<AutoTextMode, "off">[] = [
    "viewport",
    "content",
    "combined",
];

/** Minimum target size (px) selectable for auto-adjustment. */
export const AUTO_MIN_PX_OPTIONS = [14, 16, 18, 20] as const;

/** Levels for enlarging only the selected text. */
export const SELECTION_LEVELS: FontScaleLevel[] = [1, 2, 3];

/**
 * Level-choice labels and hints.
 * Only the name is language-dependent; the hint (1.25× / 16px+) is derived
 * mechanically from the scale config.
 */
function levelLabels(
    hint: (level: TextAdjustLevel) => string,
): Record<TextAdjustLevel, [string, string]> {
    const names = t().levelNames;
    return {
        0: [names[0], ""],
        1: [names[1], hint(1)],
        2: [names[2], hint(2)],
        3: [names[3], hint(3)],
    };
}

export function bodyExpandLevelLabels(): Record<
    TextAdjustLevel,
    [string, string]
> {
    return levelLabels(bodyTextExpandHint);
}

export function smallBoostLevelLabels(): Record<
    TextAdjustLevel,
    [string, string]
> {
    return levelLabels(smallTextBoostHint);
}

/** Cursor enlarge / focus-ring levels (0 = off, 1–3 = small / medium / large). */
export function focusEnhanceLevelLabels(): Record<
    TextAdjustLevel,
    [string, string]
> {
    const off = t().levelNames[0];
    const names = t().focusEnhanceLevelName;
    return {
        0: [off, ""],
        1: [names[1], ""],
        2: [names[2], ""],
        3: [names[3], ""],
    };
}

/**
 * Speech-rate names and hints.
 * As with the level choices, only the name is language-dependent; the hint
 * (×1.3) is derived from the config value.
 */
export function speechRateLabels(): Record<SpeechRateLevel, [string, string]> {
    const names = t().speakRateNames;
    return {
        0: [names[0], speechRateHint(0)],
        1: [names[1], speechRateHint(1)],
        2: [names[2], speechRateHint(2)],
        3: [names[3], speechRateHint(3)],
    };
}
