/**
 * UniLens Accessibility — UMD entry point.
 *
 * Browser:
 *   <script src="unilens-a11y.js"></script>
 *   <script>UniLensA11y.init()</script>
 *
 * Node / bundler (CommonJS):
 *   const UniLensA11y = require('unilens-a11y')
 *   UniLensA11y.init()
 *
 * Panel language: Japanese and English are built in. The initial language is taken
 * from `<html lang>`, then the browser languages; pass `init({ lang: 'en' })` to set
 * a different default. A choice made in the panel is stored and always wins.
 */
import {
    A11Y_DEFAULTS,
    CONTRAST_FILTER,
    SATURATION_FILTER,
    a11ySettings,
    applyA11yToDocument,
    applySystemPreferences,
    hasStoredA11ySettings,
    onA11yChange,
    patchA11ySettings,
    resetA11ySettings,
    resetDisplaySettings,
    saveA11ySettings,
    type A11yFontFamily,
    type A11yFontSize,
    type A11yLetterSpacing,
    type A11yLineHeight,
    type A11ySettings,
    type DisplayContrast,
    type DisplaySaturation,
    type DisplayTheme,
    type TextAdjustLevel,
} from "./accessibilityStore";
import {
    destroyAccessibilityPanel,
    initAccessibilityPanel,
} from "./accessibilityPanel";
import {
    analyzePageText,
    getAppliedTextScale,
    getEffectiveChatFontSize,
    initAutoTextSize,
    destroyAutoTextSize,
    refreshAutoTextSize,
    runAutoTextAction,
    type TextAnalysis,
} from "./autoTextSize";
import {
    clearBodyTextExpand,
    computeExpandedFontPx,
    destroyBodyTextExpand,
    getLastBodyTextScan,
    initBodyTextExpand,
    LARGE_TEXT_PX,
    scanBodyText,
    type BodyTextScanResult,
} from "./bodyTextExpand";
import {
    a11yFontSizeToScale,
    FONT_SCALE_LEVELS,
    levelToScale,
    scaleToLevel,
    type FontScaleLevel,
} from "./fontScales";
import {
    A11Y_LANGS,
    A11Y_LANG_NAMES,
    configureA11yLang,
    fontScaleLabel,
    getA11yLang,
    onA11yLangChange,
    setA11yLang,
    t,
    type A11yLang,
    type A11yMessages,
} from "./accessibilityI18n";
import {
    bodyExpandLevelLabels,
    smallBoostLevelLabels,
    speechRateLabels,
} from "./accessibilityPanelOptions";
import {
    A11Y_PRESETS,
    A11Y_PRESET_IDS,
    applyA11yPreset,
    clearA11yPreset,
    isPresetActive,
    toggleA11yPreset,
    type A11yPresetId,
} from "./accessibilityPresets";
import {
    applySelectionFontLevel,
    clearSelectionFontSize,
    destroySelectionTextSize,
    getActiveSelectionRange,
    getSelectionInfo,
    initSelectionTextSize,
    levelToPx,
    onSelectionChange,
    pxToLevel,
    type ApplySelectionResult,
    type SelectionFontLevel,
    type SelectionInfo,
} from "./selectionTextSize";
import {
    getSpeechState,
    getSpeechTarget,
    destroySpeakSelection,
    initSpeakSelection,
    isSpeechSupported,
    onSpeechChange,
    pauseSpeech,
    restartSpeechWithCurrentRate,
    resumeSpeech,
    speakSelection,
    stopSpeech,
    syncSpeechHighlight,
    type SpeakResult,
    type SpeechState,
    type SpeechTargetInfo,
} from "./speakSelection";
import {
    DEFAULT_SPEECH_RATE_LEVEL,
    SPEECH_CHUNK_MAX,
    SPEECH_RATE_LEVELS,
    SPEECH_RATES,
    normalizeSpeechRateLevel,
    speechRateHint,
    speechRateValue,
    splitSpeechChunks,
    type SpeechRateLevel,
} from "./speechLevels";
import {
    clearSmallTextBoost,
    computeTargetFontPx,
    destroySmallTextBoost,
    getLastSmallTextScan,
    initSmallTextBoost,
    scanSmallText,
    type SmallTextScanResult,
} from "./smallTextBoost";
import {
    onSettingsChange,
    saveSettings,
    settings,
    type AutoTextMode,
    type Settings,
} from "./accessibilityStore";
import { destroyAccessibilityRuntime } from "./accessibilityLifecycle";
import {
    BODY_TEXT_EXPAND_CONFIG,
    computeBodyTextTargetPx,
    computeSmallTextTargetPx,
    normalizeTextAdjustLevel,
    SMALL_TEXT_BOOST_CONFIG,
    SMALL_TEXT_THRESHOLD_PX,
    TEXT_ADJUST_LEVELS,
    bodyTextExpandConfig,
    bodyTextExpandHint,
    smallTextBoostConfig,
    smallTextBoostHint,
} from "./textAdjustLevels";

interface UniLensA11yInitOptions {
    /** Show top-right ♿ panel. Default: true */
    panel?: boolean;
    /** Selection text resize. Default: true */
    selection?: boolean;
    /**
     * Read the selected text aloud with the browser's speech synthesis. Default: true.
     * Turning this off also removes the panel controls; nothing is ever spoken without
     * an explicit press, so leaving it on is safe.
     */
    speech?: boolean;
    /** Auto page text size analysis. Default: true */
    autoText?: boolean;
    /** Body-text-only expand (headings excluded). Default: true */
    bodyTextExpand?: boolean;
    /** Small text (<16px) floor boost. Default: true */
    smallTextBoost?: boolean;
    /**
     * Adopt the OS display preferences (`prefers-color-scheme`, `prefers-contrast`)
     * as the initial values on the visitor's first run. Off by default because it
     * changes the host page's appearance without an explicit user action.
     */
    followSystemPreferences?: boolean;
    /**
     * Panel language when the visitor has not chosen one yet. Default: detected from
     * `<html lang>`, then the browser languages. An explicit choice made in the panel
     * always wins over this value.
     */
    lang?: A11yLang;
}

let initialized = false;

function init(options: UniLensA11yInitOptions = {}) {
    if (initialized) return;
    initialized = true;

    if (options.lang) configureA11yLang(options.lang);
    if (options.followSystemPreferences) applySystemPreferences();
    applyA11yToDocument();

    if (options.bodyTextExpand !== false) initBodyTextExpand();
    if (options.smallTextBoost !== false) initSmallTextBoost();
    if (options.selection !== false) initSelectionTextSize();
    // Read-aloud disabled: speechSynthesis is shared with unilens-lib on the same page.
    // if (options.speech !== false) initSpeakSelection()
    if (options.autoText !== false) initAutoTextSize();
    if (options.panel !== false) initAccessibilityPanel();
}

function destroy() {
    if (!initialized) return;
    destroyAccessibilityRuntime();
    initialized = false;
}

/**
 * Feature overview for integrators / documentation.
 *
 * These titles describe the API and stay in English on purpose: they are read by
 * developers, not by visitors. Everything a visitor sees comes from the panel's
 * own message catalog, which follows the selected language.
 */
const FEATURES = {
    display: {
        id: "display",
        title: "Color mode, saturation and contrast",
        keys: ["theme", "saturation", "contrast"] as const,
    },
    pageFont: {
        id: "pageFont",
        title: "Whole-page text (size, typeface, line spacing, letter spacing)",
        keys: [
            "fontSize",
            "fontFamily",
            "lineHeight",
            "letterSpacing",
        ] as const,
    },
    cues: {
        id: "cues",
        title: "Extra visual cues (link underlines, focus enhance)",
        keys: ["linkUnderline", "focusEnhance"] as const,
    },
    presets: {
        id: "presets",
        title: "Quick presets (low vision / color vision)",
        ids: A11Y_PRESET_IDS,
    },
    bodyTextExpand: {
        id: "bodyTextExpand",
        title: "Body-text-only expand (headings excluded, 3 levels)",
        key: "bodyTextExpandLevel" as const,
        levels: TEXT_ADJUST_LEVELS,
        hint: bodyTextExpandHint,
    },
    smallTextBoost: {
        id: "smallTextBoost",
        title: "Boost for text below 16px (3 levels)",
        key: "smallTextBoostLevel" as const,
        levels: TEXT_ADJUST_LEVELS,
        hint: smallTextBoostHint,
    },
    selectionText: {
        id: "selectionText",
        title: "Selection text size (100% / 150% / 200%)",
        scales: FONT_SCALE_LEVELS,
    },
    // Read-aloud disabled — see init() above.
    // speakSelection: {
    //   id: 'speakSelection',
    //   title: 'Read the selection aloud (4 speeds, follow-along highlight)',
    //   keys: ['speechRateLevel', 'speechHighlight'] as const,
    //   levels: SPEECH_RATE_LEVELS,
    //   rates: SPEECH_RATES,
    //   hint: speechRateHint,
    // },
    autoTextSize: {
        id: "autoTextSize",
        title: "Automatic text size (viewport / content / combined)",
        modes: ["off", "viewport", "content", "combined"] as const,
    },
} as const;

const UniLensA11y = {
    init,
    destroy,
    FEATURES,
    VERSION: "1.0.0",

    // Settings (display adjustment)
    a11ySettings,
    A11Y_DEFAULTS,
    SATURATION_FILTER,
    CONTRAST_FILTER,
    hasStoredA11ySettings,
    applyA11yToDocument,
    applySystemPreferences,
    patchA11ySettings,
    resetA11ySettings,
    resetDisplaySettings,
    saveA11ySettings,
    onA11yChange,

    // Presets
    A11Y_PRESETS,
    A11Y_PRESET_IDS,
    applyA11yPreset,
    clearA11yPreset,
    toggleA11yPreset,
    isPresetActive,

    // Panel language
    A11Y_LANGS,
    A11Y_LANG_NAMES,
    getA11yLang,
    setA11yLang,
    configureA11yLang,
    onA11yLangChange,
    a11yMessages: t,

    // Shared text levels
    FONT_SCALE_LEVELS,
    fontScaleLabel,
    levelToScale,
    scaleToLevel,
    a11yFontSizeToScale,
    BODY_TEXT_EXPAND_CONFIG,
    SMALL_TEXT_BOOST_CONFIG,
    SMALL_TEXT_THRESHOLD_PX,
    TEXT_ADJUST_LEVELS,
    bodyTextExpandHint,
    smallTextBoostHint,
    bodyExpandLevelLabels,
    smallBoostLevelLabels,
    LARGE_TEXT_PX,
    normalizeTextAdjustLevel,
    bodyTextExpandConfig,
    smallTextBoostConfig,
    computeBodyTextTargetPx,
    computeSmallTextTargetPx,
    computeExpandedFontPx,
    computeTargetFontPx,

    // Body text expand
    scanBodyText,
    clearBodyTextExpand,
    getLastBodyTextScan,
    initBodyTextExpand,
    destroyBodyTextExpand,

    // Small text boost
    scanSmallText,
    clearSmallTextBoost,
    getLastSmallTextScan,
    initSmallTextBoost,
    destroySmallTextBoost,

    // Selection resize
    getSelectionInfo,
    getActiveSelectionRange,
    applySelectionFontLevel,
    clearSelectionFontSize,
    onSelectionChange,
    levelToPx,
    pxToLevel,
    initSelectionTextSize,
    destroySelectionTextSize,

    // Read the selection aloud
    isSpeechSupported,
    speakSelection,
    pauseSpeech,
    resumeSpeech,
    stopSpeech,
    restartSpeechWithCurrentRate,
    syncSpeechHighlight,
    getSpeechState,
    getSpeechTarget,
    onSpeechChange,
    initSpeakSelection,
    destroySpeakSelection,
    SPEECH_RATE_LEVELS,
    SPEECH_RATES,
    SPEECH_CHUNK_MAX,
    DEFAULT_SPEECH_RATE_LEVEL,
    normalizeSpeechRateLevel,
    speechRateValue,
    speechRateHint,
    speechRateLabels,
    splitSpeechChunks,

    // Auto text size
    analyzePageText,
    refreshAutoTextSize,
    runAutoTextAction,
    getAppliedTextScale,
    getEffectiveChatFontSize,
    initAutoTextSize,
    destroyAutoTextSize,

    // UniLens auxiliary settings (auto-text / selection level)
    settings,
    saveSettings,
    onSettingsChange,

    // Panel
    initAccessibilityPanel,
    destroyAccessibilityPanel,
};

export default UniLensA11y;
export { init, destroy, FEATURES, UniLensA11y };

export type {
    A11yFontFamily,
    A11yFontSize,
    A11yLang,
    A11yLetterSpacing,
    A11yLineHeight,
    A11yMessages,
    A11yPresetId,
    A11ySettings,
    ApplySelectionResult,
    AutoTextMode,
    BodyTextScanResult,
    DisplayContrast,
    DisplaySaturation,
    DisplayTheme,
    FontScaleLevel,
    SelectionFontLevel,
    SelectionInfo,
    Settings,
    SmallTextScanResult,
    SpeakResult,
    SpeechRateLevel,
    SpeechState,
    SpeechTargetInfo,
    TextAdjustLevel,
    TextAnalysis,
    UniLensA11yInitOptions,
};

declare global {
    interface Window {
        UniLensA11y: typeof UniLensA11y;
    }
}

if (typeof window !== "undefined") {
    window.UniLensA11y = UniLensA11y;
}
