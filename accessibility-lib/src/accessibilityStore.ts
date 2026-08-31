/** Public API barrel — types, document effects, and the zustand settings store. */
import type { A11ySettings } from "./accessibilityStoreTypes";
import { getA11ySettings } from "./settings";

export type {
    A11yFontFamily,
    A11yFontSize,
    A11yLetterSpacing,
    A11yLineHeight,
    A11ySettings,
    AutoTextMode,
    DisplayContrast,
    DisplaySaturation,
    DisplayTheme,
    TextAdjustLevel,
} from "./accessibilityStoreTypes";

export {
    A11Y_DEFAULTS,
    A11Y_SETTING_KEYS,
    CONTRAST_FILTER,
    LETTER_SPACING_EM,
    SATURATION_FILTER,
    STANDARD_FONT_STACK,
    UD_FONT_STACK,
    WORD_SPACING_EM,
} from "./accessibilityStoreTypes";

export {
    applyA11yToDocument,
    clearAppliedA11yDocument,
    ensurePageContentRoot,
    restorePageContentRoot,
    syncWidgetDisplayIsolation,
} from "./documentEffects";

export {
    applySystemPreferences,
    getA11ySettings,
    getSettings,
    hasStoredA11ySettings,
    onA11yChange,
    onSettingsChange,
    patchA11ySettings,
    patchSettings,
    resetA11ySettings,
    resetDisplaySettings,
    saveA11ySettings,
    saveSettings,
    settings,
    updateSetting,
    useSettings,
    SETTINGS_DEFAULTS,
    type Settings,
} from "./settings";

/** Live read-only view of display settings for imperative code and tests. */
export const a11ySettings: A11ySettings = new Proxy({} as A11ySettings, {
    get(_target, prop: string | symbol) {
        return getA11ySettings()[prop as keyof A11ySettings];
    },
});
