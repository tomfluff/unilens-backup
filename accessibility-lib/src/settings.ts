/**
 * Accessibility settings store (zustand) — single persist key for the whole library.
 * React reads via useSettings(); imperative modules via getSettings().
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
    A11Y_DEFAULTS,
    A11Y_SETTING_KEYS,
    type A11ySettings,
    type AutoTextMode,
    CONTRAST_FILTER,
    type DisplayTheme,
    SATURATION_FILTER,
} from "./accessibilityStoreTypes";
import { applyA11yToDocument } from "./documentEffects";
import {
    DEFAULT_SPEECH_RATE_LEVEL,
    normalizeSpeechRateLevel,
} from "./speechLevels";
import { normalizeTextAdjustLevel } from "./textAdjustLevels";

export type { AutoTextMode } from "./accessibilityStoreTypes";

export interface Settings extends A11ySettings {
    chatFontSize: number;
    autoTextSize: boolean;
    autoTextMode: AutoTextMode;
    autoTextMinPx: number;
    autoTextMaxScale: number;
    selectionFontLevel: number;
    speechRateLevel: number;
    speechHighlight: boolean;
    /** Visitor-chosen panel language; null = auto-detect until they pick one. */
    panelLang: "ja" | "en" | null;
    panelTab: "visual" | "text" | "tools";
}

const AUX_DEFAULTS = {
    chatFontSize: 14,
    autoTextSize: false,
    autoTextMode: "off" as AutoTextMode,
    autoTextMinPx: 16,
    autoTextMaxScale: 1.8,
    selectionFontLevel: 2,
    speechRateLevel: DEFAULT_SPEECH_RATE_LEVEL,
    speechHighlight: true,
    panelLang: null as "ja" | "en" | null,
    panelTab: "visual" as "visual" | "text" | "tools",
};

export const SETTINGS_DEFAULTS: Settings = {
    ...A11Y_DEFAULTS,
    ...AUX_DEFAULTS,
};

const THEMES: Record<DisplayTheme, 1> = {
    standard: 1,
    light: 1,
    dark: 1,
    soft: 1,
    "high-contrast": 1,
    invert: 1,
};

/** Persist schema: v2 introduces theme `standard` (site default). Old `light` meant off. */
const SETTINGS_PERSIST_VERSION = 2;

function normalizeA11yFields(s: A11ySettings): void {
    if (!(s.theme in THEMES)) s.theme = "standard";
    if (!(s.saturation in SATURATION_FILTER)) s.saturation = "standard";
    if (!(s.contrast in CONTRAST_FILTER)) s.contrast = "standard";
    if (s.letterSpacing !== "wide") s.letterSpacing = "standard";
    if (s.fontFamily !== "ud" && s.fontFamily !== "custom")
        s.fontFamily = "standard";
    s.customFontFamily =
        typeof s.customFontFamily === "string" &&
        s.customFontFamily.trim() !== ""
            ? s.customFontFamily.trim()
            : null;
    if (s.fontFamily === "custom" && !s.customFontFamily)
        s.fontFamily = "standard";
    s.linkUnderline = s.linkUnderline === true;
    s.linkBackground = s.linkBackground === true;
    s.linkBorder = s.linkBorder === true;
    s.imageBorder = s.imageBorder === true;
    s.elementHighlight = s.elementHighlight === true;
    s.focusEnhance = s.focusEnhance === true;
    s.reduceMotion = s.reduceMotion === true;
    s.smallTextBoostLevel = normalizeTextAdjustLevel(s.smallTextBoostLevel);
    s.bodyTextExpandLevel = normalizeTextAdjustLevel(s.bodyTextExpandLevel);
}

function normalizeSettings(s: Settings): void {
    normalizeA11yFields(s);
    if (s.selectionFontLevel < 1 || s.selectionFontLevel > 3)
        s.selectionFontLevel = 2;
    s.speechRateLevel = normalizeSpeechRateLevel(s.speechRateLevel);
    s.speechHighlight = s.speechHighlight !== false;
    if (!["visual", "text", "tools"].includes(s.panelTab))
        s.panelTab = "visual";
    if (s.panelLang != null && s.panelLang !== "ja" && s.panelLang !== "en")
        s.panelLang = null;
}

export const useSettings = create<Settings>()(
    persist(() => ({ ...SETTINGS_DEFAULTS }), {
        name: "unilens-a11y-settings",
        version: SETTINGS_PERSIST_VERSION,
        migrate: (persisted: unknown, version: number) => {
            const state = (persisted ?? {}) as Partial<Settings>;
            // v1 (and unversioned): theme `light` was the neutral/off state.
            if (version < 2 && state.theme === "light")
                state.theme = "standard";
            return state as Settings;
        },
        onRehydrateStorage: () => (state: Settings | undefined) => {
            if (state) normalizeSettings(state);
        },
    }),
);

/** live snapshot for non-React modules */
export const getSettings = () => useSettings.getState();

export function getA11ySettings(): A11ySettings {
    const s = getSettings();
    const out = { ...A11Y_DEFAULTS };
    for (const key of A11Y_SETTING_KEYS)
        (out as Record<string, unknown>)[key] = s[key];
    return out;
}

export const onSettingsChange = (cb: () => void) => useSettings.subscribe(cb);

export function onA11yChange(cb: () => void): () => void {
    return useSettings.subscribe((state: Settings, prev: Settings) => {
        for (const key of A11Y_SETTING_KEYS) {
            if (state[key] !== prev[key]) {
                cb();
                return;
            }
        }
    });
}

export function updateSetting<K extends keyof Settings>(
    key: K,
    value: Settings[K],
) {
    useSettings.setState({ [key]: value } as Partial<Settings>);
}

export function patchSettings(patch: Partial<Settings>) {
    useSettings.setState(patch);
}

export function patchA11ySettings(patch: Partial<A11ySettings>) {
    const next: Partial<A11ySettings> = { ...patch };
    if (next.fontFamily !== undefined && next.fontFamily !== "custom")
        next.customFontFamily = null;
    useSettings.setState(next);
    applyA11yToDocument();
}

export function resetA11ySettings() {
    useSettings.setState({ ...A11Y_DEFAULTS });
    applyA11yToDocument();
}

export function resetDisplaySettings() {
    patchA11ySettings({
        theme: "standard",
        saturation: "standard",
        contrast: "standard",
    });
}

/** Zustand persist writes automatically; kept for call sites that batch mutations. */
export function saveSettings() {
    normalizeSettings(getSettings());
}

export function saveA11ySettings() {
    normalizeSettings(getSettings());
    applyA11yToDocument();
}

export function hasStoredA11ySettings(): boolean {
    try {
        return localStorage.getItem("unilens-a11y-settings") != null;
    } catch {
        return false;
    }
}

/** Live read/write view for imperative modules that still assign fields directly. */
export const settings: Settings = new Proxy({} as Settings, {
    get(_target, prop: string | symbol) {
        return getSettings()[prop as keyof Settings];
    },
    set(_target, prop: string | symbol, value: Settings[keyof Settings]) {
        updateSetting(prop as keyof Settings, value);
        return true;
    },
});

function prefers(query: string): boolean {
    try {
        return window.matchMedia?.(query).matches === true;
    } catch {
        return false;
    }
}

export function applySystemPreferences(): Partial<A11ySettings> | null {
    if (hasStoredA11ySettings()) return null;

    const patch: Partial<A11ySettings> = {};
    if (prefers("(prefers-contrast: more)")) patch.contrast = "strong";
    if (prefers("(prefers-color-scheme: dark)")) patch.theme = "dark";
    if (Object.keys(patch).length === 0) return null;

    patchA11ySettings(patch);
    return patch;
}

// Wire document effects after both modules load (avoids circular imports).
import { bindSettingsReader } from "./documentEffects";

bindSettingsReader(getSettings);
