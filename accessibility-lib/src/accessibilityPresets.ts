/**
 * One-tap presets (low vision / color vision / mild / senior / high contrast / focus).
 *
 * Pressing the same button again turns it off (toggle). Never more than one
 * active at once: the store remembers which preset is on (`activePreset`) and
 * the values it replaced (`presetRestore`). Turning a preset on only changes
 * the fields that preset defines — the visitor's other choices (stop
 * animations, color mode, …) stay. Turning it off, or switching to another
 * preset, puts the replaced values back, except fields the visitor changed
 * by hand after turning the preset on.
 */
import {
    A11Y_DEFAULTS,
    type A11ySettings,
    getA11ySettings,
    getSettings,
    patchA11ySettings,
    patchSettings,
} from "./accessibilityStore";
import {
    A11Y_PRESET_ID_LIST,
    type A11yPresetId,
} from "./accessibilityStoreTypes";
import {
    getAppliedTextScale,
    restoreAutoText,
    runAutoTextAction,
} from "./autoTextSize";

export type { A11yPresetId } from "./accessibilityStoreTypes";

/**
 * The keys checked to decide whether the preset that is on is still in
 * effect. Once the visitor changes one of them by hand, the preset button
 * shows as off and those fields are left as the visitor set them.
 */
export const PRESET_KEYS: Record<
    A11yPresetId,
    readonly (keyof A11ySettings)[]
> = {
    lowVision: [
        "fontSize",
        "fontFamily",
        "lineHeight",
        "letterSpacing",
        "contrast",
        "smallTextBoostLevel",
        "bodyTextExpandLevel",
        "linkUnderline",
        "focusEnhanceLevel",
    ],
    colorVision: ["saturation", "contrast", "linkUnderline", "theme"],
    mild: ["theme", "saturation", "reduceMotion"],
    senior: ["bodyTextExpandLevel", "contrast", "linkUnderline"],
    highContrast: ["theme", "contrast"],
    focus: ["lineHeight", "saturation"],
};

export const A11Y_PRESETS: Record<A11yPresetId, Partial<A11ySettings>> = {
    /** Low vision: bigger, roomier, crisper. Avoids double-applying with body-text expand. */
    lowVision: {
        fontSize: "xlarge",
        fontFamily: "ud",
        lineHeight: "wide",
        letterSpacing: "wide",
        contrast: "strong",
        smallTextBoostLevel: 2,
        bodyTextExpandLevel: 0,
        linkUnderline: true,
        focusEnhanceLevel: 2,
    },
    /** Color-vision support: lean on cues that don't depend on color. */
    colorVision: {
        theme: "standard",
        saturation: "mono",
        contrast: "strong",
        linkUnderline: true,
    },
    /**
     * Mild (low sensory stimulation): cream background + dark gray text, 50%
     * saturation, animations stopped. theme=soft is #F5F2EB / #2B2B2B,
     * saturation=soft is 0.5.
     */
    mild: {
        theme: "soft",
        saturation: "soft",
        reduceMotion: true,
    },
    /** Crisp (senior): body text at 1.25× (level 2) + 140% contrast + underlined links. */
    senior: {
        bodyTextExpandLevel: 2,
        contrast: "strong",
        linkUnderline: true,
    },
    /** High-contrast black: black background, yellow text, max contrast. */
    highContrast: {
        theme: "high-contrast",
        contrast: "max",
    },
    /** Simple (focus): 2.0 line height + monochrome. */
    focus: {
        lineHeight: "wide",
        saturation: "mono",
    },
};

export const A11Y_PRESET_IDS: A11yPresetId[] = [...A11Y_PRESET_ID_LIST];

/** Whether every key a preset is judged by matches the current settings. */
function presetMatches(id: A11yPresetId): boolean {
    const preset = A11Y_PRESETS[id];
    const current = getA11ySettings();
    return PRESET_KEYS[id].every((key) => current[key] === preset[key]);
}

/** The fields a preset writes (its definition, not just its judged keys). */
function presetFieldKeys(id: A11yPresetId): (keyof A11ySettings)[] {
    return Object.keys(A11Y_PRESETS[id]) as (keyof A11ySettings)[];
}

/**
 * Settings saved before presets were tracked have no `activePreset`. Treat the
 * first preset whose fields all match as the one that is on, as before.
 */
function legacyMatchingPreset(): A11yPresetId | null {
    return A11Y_PRESET_IDS.find((id) => presetMatches(id)) ?? null;
}

function activePresetId(): A11yPresetId | null {
    const tracked = getSettings().activePreset;
    if (tracked === undefined) return legacyMatchingPreset();
    return tracked;
}

/** Whether this preset is the one that is on and still in effect. */
export function isPresetActive(id: A11yPresetId): boolean {
    return activePresetId() === id && presetMatches(id);
}

/**
 * Turns the active preset off: fields it still controls go back to the values
 * it replaced. A field the visitor changed after turning it on is theirs and
 * stays. Untracked (legacy) presets go back to the defaults, as before.
 */
function undoActivePreset() {
    const s = getSettings();
    const id = activePresetId();
    const saved = s.activePreset === undefined ? null : s.presetRestore;
    const autoText = s.presetAutoTextRestore;
    patchSettings({
        activePreset: null,
        presetRestore: null,
        presetAutoTextRestore: null,
    });
    // The preset turned automatic text size off; put it back unless the
    // visitor has turned it on again themselves meanwhile.
    if (autoText && !getSettings().autoTextSize)
        restoreAutoText(autoText.autoTextMode, autoText.scale);
    if (!id) return;

    const current = getA11ySettings();
    const preset = A11Y_PRESETS[id];
    const patch: Partial<A11ySettings> = {};
    for (const key of presetFieldKeys(id)) {
        if (current[key] !== preset[key]) continue;
        const back =
            saved && key in saved ? saved[key] : A11Y_DEFAULTS[key];
        (patch as Record<string, unknown>)[key] = back;
    }
    patchA11ySettings(patch);
}

/**
 * Applies a preset. Another preset that is still in effect is turned off
 * first (its replaced values come back), so two presets never stack. Fields
 * the preset does not define are left as the visitor set them.
 */
export function applyA11yPreset(id: A11yPresetId) {
    const current = activePresetId();
    if (getSettings().activePreset === undefined && current === id) {
        // Legacy settings already showing this preset: track it, and turning
        // it off goes back to the defaults as it did before.
        patchSettings({ activePreset: id, presetRestore: null });
    } else if (current && current !== id && presetMatches(current)) {
        undoActivePreset();
    } else if (current !== id || !presetMatches(id)) {
        const s = getSettings();
        if (current === id && s.activePreset === id && s.presetRestore) {
            // Pressing the preset that is on again after changing one of its
            // fields by hand re-applies it. Keep the values saved when it was
            // first turned on: re-saving now would record the preset's own
            // values, and turning it off would then change nothing.
        } else {
            // Another preset the visitor has since changed by hand: its
            // fields are theirs now, so drop the saved values instead of
            // restoring them.
            patchSettings({ activePreset: null, presetRestore: null });
        }
    }

    if (getSettings().activePreset !== id) {
        const before = getA11ySettings();
        const saved: Partial<A11ySettings> = {};
        for (const key of presetFieldKeys(id)) {
            (saved as Record<string, unknown>)[key] = before[key];
        }
        patchSettings({ activePreset: id, presetRestore: saved });
    }
    patchA11ySettings({ ...A11Y_PRESETS[id] });
    // Low-vision and senior tend to break when stacked with auto-adjustment,
    // so turn it off — remembering how it was, for when the preset goes off.
    if (id === "lowVision" || id === "senior") {
        const live = getSettings();
        if (
            live.autoTextSize &&
            live.autoTextMode !== "off" &&
            !live.presetAutoTextRestore
        ) {
            patchSettings({
                presetAutoTextRestore: {
                    autoTextMode: live.autoTextMode,
                    scale: getAppliedTextScale(),
                },
            });
        }
        runAutoTextAction("reset");
    }
}

/** Turns a preset off if it is the one in effect; otherwise does nothing. */
export function clearA11yPreset(id: A11yPresetId) {
    if (activePresetId() !== id) return;
    undoActivePreset();
}

/** Off if currently active, on otherwise. Returns the state after the operation. */
export function toggleA11yPreset(id: A11yPresetId): "on" | "off" {
    if (isPresetActive(id)) {
        clearA11yPreset(id);
        return "off";
    }
    applyA11yPreset(id);
    return "on";
}
