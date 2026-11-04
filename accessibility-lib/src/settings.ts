/**
 * Accessibility settings store (zustand) — single persist key for the whole library.
 * React reads via useSettings(); imperative modules via getSettings().
 */
import { create } from "zustand";
import {
    createJSONStorage,
    persist,
    type StateStorage,
} from "zustand/middleware";
import {
    A11Y_DEFAULTS,
    A11Y_LANG_CODES,
    A11Y_SETTING_KEYS,
    type A11yLang,
    type A11yPresetId,
    type A11ySettings,
    type AutoTextMode,
    CONTRAST_FILTER,
    FOCUS_CURSOR_DEFAULT_BAND_PX,
    type DisplayTheme,
    isA11yPresetId,
    normalizePointerHaloColor,
    normalizePointerHaloOpacity,
    normalizeFocusCursorBandPx,
    normalizePointerHaloPx,
    normalizeReadingGuidePosition,
    normalizeReadingGuideStyle,
    normalizeHcTextScope,
    normalizeTextPlateStyle,
    normalizeTextStrokeStyle,
    PANEL_TABS,
    type PanelTab,
    SATURATION_FILTER,
} from "./accessibilityStoreTypes";
import { applyA11yToDocument } from "./documentEffects";
import {
    DEFAULT_SPEECH_RATE_LEVEL,
    normalizeSpeechRateLevel,
} from "./speechLevels";
import {
    applyPointerFollowerExclusion,
    reconcilePointerFollowers,
} from "./pointerFollowerExclusion";
import { normalizeTextAdjustLevel } from "./textAdjustLevels";

export type { AutoTextMode } from "./accessibilityStoreTypes";

export interface Settings extends A11ySettings {
    chatFontSize: number;
    autoTextSize: boolean;
    autoTextMode: AutoTextMode;
    autoTextMinPx: number;
    autoTextMaxScale: number;
    /**
     * Lab: magnify the whole page as far as it goes without breaking
     * (opportunisticZoom.ts, after Bigham, UIST 2014).
     */
    oppZoom: boolean;
    selectionFontLevel: number;
    speechRateLevel: number;
    speechHighlight: boolean;
    /** Visitor-chosen panel language; null = auto-detect until they pick one. */
    panelLang: A11yLang | null;
    panelTab: PanelTab;
    /**
     * The preset the visitor turned on last, or null when none is on.
     * `undefined` = stored before presets were tracked; the preset module then
     * falls back to matching the settings against each preset.
     */
    activePreset: A11yPresetId | null | undefined;
    /** Values the active preset replaced, put back when it is turned off. */
    presetRestore: Partial<A11ySettings> | null;
    /**
     * Automatic text size as it was before a preset that turns it off
     * (low vision / senior) was turned on; put back when that preset is
     * turned off. null = nothing to put back.
     */
    presetAutoTextRestore: PresetAutoTextRestore | null;
}

export interface PresetAutoTextRestore {
    autoTextMode: AutoTextMode;
    /** The applied scale, which may have been bumped by hand. */
    scale: number;
}

const AUX_DEFAULTS = {
    chatFontSize: 14,
    autoTextSize: false,
    autoTextMode: "off" as AutoTextMode,
    autoTextMinPx: 16,
    autoTextMaxScale: 1.8,
    oppZoom: false,
    selectionFontLevel: 2,
    speechRateLevel: DEFAULT_SPEECH_RATE_LEVEL,
    speechHighlight: true,
    panelLang: null as A11yLang | null,
    panelTab: "visual" as PanelTab,
    activePreset: undefined as A11yPresetId | null | undefined,
    presetRestore: null as Partial<A11ySettings> | null,
    presetAutoTextRestore: null as PresetAutoTextRestore | null,
};

export const SETTINGS_DEFAULTS: Settings = {
    ...A11Y_DEFAULTS,
    ...AUX_DEFAULTS,
};

const SETTINGS_PERSIST_KEY = "unilens-a11y-settings";

const THEMES: Record<DisplayTheme, 1> = {
    standard: 1,
    light: 1,
    dark: 1,
    soft: 1,
    "high-contrast": 1,
    invert: 1,
};

function migrateLegacyFocusCursor(s: A11ySettings & { focusCursor?: unknown }) {
    if (s.focusCursor === true) {
        s.focusCursorBandPx = FOCUS_CURSOR_DEFAULT_BAND_PX;
    }
    delete s.focusCursor;
}

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
    s.focusEnhanceLevel = normalizeTextAdjustLevel(s.focusEnhanceLevel);
    s.pointerHaloPx = normalizePointerHaloPx(s.pointerHaloPx);
    s.pointerHaloColor = normalizePointerHaloColor(s.pointerHaloColor);
    s.pointerHaloOpacity = normalizePointerHaloOpacity(s.pointerHaloOpacity);
    migrateLegacyFocusCursor(s);
    s.focusCursorBandPx = normalizeFocusCursorBandPx(s.focusCursorBandPx);
    s.readingGuide = s.readingGuide === true;
    s.readingGuideStyle = normalizeReadingGuideStyle(s.readingGuideStyle);
    s.readingGuidePosition = normalizeReadingGuidePosition(
        s.readingGuidePosition,
    );
    s.textStroke = s.textStroke === true;
    s.textStrokeStyle = normalizeTextStrokeStyle(s.textStrokeStyle);
    s.textPlateStyle = normalizeTextPlateStyle(s.textPlateStyle);
    s.hcTextScope = normalizeHcTextScope(s.hcTextScope);
    s.reduceMotion = s.reduceMotion === true;
    s.smallTextBoostLevel = normalizeTextAdjustLevel(s.smallTextBoostLevel);
    s.bodyTextExpandLevel = normalizeTextAdjustLevel(s.bodyTextExpandLevel);
    reconcilePointerFollowers(s);
}

function normalizeSettings(s: Settings): void {
    normalizeA11yFields(s);
    if (s.selectionFontLevel < 1 || s.selectionFontLevel > 3)
        s.selectionFontLevel = 2;
    s.speechRateLevel = normalizeSpeechRateLevel(s.speechRateLevel);
    s.speechHighlight = s.speechHighlight !== false;
    s.oppZoom = s.oppZoom === true;
    const panelTab = s.panelTab as string;
    if (panelTab === "text" || !(PANEL_TABS as readonly string[]).includes(panelTab))
        s.panelTab = "visual";
    if (s.activePreset !== undefined && s.activePreset !== null) {
        if (!isA11yPresetId(s.activePreset)) s.activePreset = null;
    }
    if (
        s.presetRestore != null &&
        (typeof s.presetRestore !== "object" || Array.isArray(s.presetRestore))
    )
        s.presetRestore = null;
    const autoRestore = s.presetAutoTextRestore as unknown;
    if (autoRestore != null) {
        const r = autoRestore as Partial<PresetAutoTextRestore>;
        const modeOk =
            r.autoTextMode === "viewport" ||
            r.autoTextMode === "content" ||
            r.autoTextMode === "combined";
        s.presetAutoTextRestore =
            typeof r === "object" &&
            modeOk &&
            typeof r.scale === "number" &&
            Number.isFinite(r.scale)
                ? {
                      autoTextMode: r.autoTextMode as AutoTextMode,
                      scale: r.scale,
                  }
                : null;
    }
    if (
        s.panelLang != null &&
        !(A11Y_LANG_CODES as readonly string[]).includes(s.panelLang)
    )
        s.panelLang = null;
}

/**
 * localStorage that never throws. Writing can fail (the quota is full — the
 * host page may have used it up — or a private mode refuses writes), and
 * reading can fail (the visitor blocks site data). zustand's persist passed a
 * write error straight out of setState, so pressing "Dark" in the panel threw
 * and the page never changed. Settings still apply; what could not be stored
 * is kept for this page in memory (and read back from it), so the next
 * setting does not undo the previous one.
 */
const memoryStore = new Map<string, string>();

function browserStorage(): Storage | null {
    try {
        return typeof window === "undefined" ? null : window.localStorage;
    } catch {
        return null;
    }
}

export const safeSettingsStorage: StateStorage = {
    getItem(name) {
        if (memoryStore.has(name)) return memoryStore.get(name) ?? null;
        try {
            return browserStorage()?.getItem(name) ?? null;
        } catch {
            return null;
        }
    },
    setItem(name, value) {
        try {
            const storage = browserStorage();
            if (!storage) throw new Error("no storage");
            storage.setItem(name, value);
            memoryStore.delete(name);
        } catch {
            memoryStore.set(name, value);
        }
    },
    removeItem(name) {
        memoryStore.delete(name);
        try {
            browserStorage()?.removeItem(name);
        } catch {
            // nothing stored that we could remove
        }
    },
};

export const useSettings = create<Settings>()(
    persist(() => ({ ...SETTINGS_DEFAULTS }), {
        name: SETTINGS_PERSIST_KEY,
        storage: createJSONStorage(() => safeSettingsStorage),
        onRehydrateStorage: () => (state: Settings | undefined) => {
            if (state) normalizeSettings(state);
        },
    }),
);

/**
 * Another tab saved settings. Without this, this tab kept its own copy in
 * memory and its next change wrote the whole copy back, silently discarding
 * what the visitor changed in the other tab. Re-read storage and re-apply.
 */
let storageSyncHandler: ((e: StorageEvent) => void) | null = null;

export function startSettingsSync() {
    if (storageSyncHandler || typeof window === "undefined") return;
    storageSyncHandler = (e: StorageEvent) => {
        if (e.key !== null && e.key !== SETTINGS_PERSIST_KEY) return;
        try {
            if (e.storageArea && e.storageArea !== window.localStorage) return;
        } catch {
            return;
        }
        void Promise.resolve(useSettings.persist.rehydrate()).then(() =>
            applyA11yToDocument(),
        );
    };
    window.addEventListener("storage", storageSyncHandler);
}

export function stopSettingsSync() {
    if (!storageSyncHandler || typeof window === "undefined") return;
    window.removeEventListener("storage", storageSyncHandler);
    storageSyncHandler = null;
}

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
    let next: Partial<A11ySettings> = { ...patch };
    if (next.fontFamily !== undefined && next.fontFamily !== "custom")
        next.customFontFamily = null;
    next = applyPointerFollowerExclusion(getSettings(), next);
    useSettings.setState(next);
    applyA11yToDocument();
}

export function resetA11ySettings() {
    useSettings.setState({
        ...A11Y_DEFAULTS,
        activePreset: null,
        presetRestore: null,
        presetAutoTextRestore: null,
    });
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
        const storage = useSettings.persist.getOptions().storage;
        if (!storage) return false;
        return storage.getItem(SETTINGS_PERSIST_KEY) != null;
    } catch {
        return false;
    }
}

/** Live read/write view for embedders; imperative modules use getSettings() / updateSetting(). */
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
