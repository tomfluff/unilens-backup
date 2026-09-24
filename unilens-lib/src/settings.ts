/**
 * UniLens settings store (zustand) — per-feature toggles, persisted in localStorage.
 * React reads via the useSettings hook; imperative modules via getSettings().
 * UI lives in SettingsPanel.tsx.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
    BACKDROPS,
    type Backdrop,
    isHexColor,
    OUTLINES,
    type Outline,
} from "./highlightStyles";

export interface Settings {
    zoom: boolean;
    mouseTrace: boolean;
    zoomTrace: boolean;
    viewportCrop: boolean;
    zoomKeys: boolean;
    smoothZoom: boolean;
    smartZoom: boolean;
    streamReplies: boolean;
    quickActions: boolean;
    dragPopover: boolean;
    elementContext: boolean;
    regionSelect: boolean;
    highContrast: boolean;
    continuity: boolean;
    autoRead: boolean;
    voiceInput: boolean;
    hints: boolean;
    minimap: boolean;
    /** freeze the page and pan by transform while zoomed, instead of scrolling it */
    lensPan: boolean;
    debugView: boolean;
    /** capture render scale: 1 = screen resolution, 0.5 = reduced */
    captureRes: number;
    /** chat scale: the base size in px the whole chat panel is drawn in (em) */
    chatFontSize: number;
    /** the conversation's text size on top of the chat scale, percent */
    chatTextScale: number;
    /** popover pinned position — null = follow the cursor (survives reloads) */
    pinnedPos: { left: number; top: number } | null;
    /** debug panel: where it was dragged to (null = top-right) and whether it is folded */
    debugPanel: {
        pos: { left: number; top: number } | null;
        collapsed: boolean;
    };
    /** send the page inventory (interactables, headings, text) with every capture */
    inventory: boolean;
    /** deepest level of the inventory tree (body = 0); collapsed wrapper divs do not count */
    inventoryMaxDepth: number;
    /** nodes at or above this depth also carry a subtree text summary */
    inventorySummaryDepth: number;
    /** max chars of ownText / summary per inventory node */
    inventorySummaryCap: number;
    /** stop emitting inventory nodes once the serialized size reaches this */
    inventoryMaxBytes: number;
    /** stop emitting inventory nodes past this count (OpenAI strict-mode enum cap is 1000) */
    inventoryMaxNodes: number;
    /** highlight outline width, screen px per band */
    ringWidth: number;
    /** scale the outline with the zoom level instead of a fixed screen width */
    ringScale: boolean;
    /** the smallest a target is drawn on the minimap, px: a link on a long page would
     *  otherwise shrink below a pixel */
    minimapMarkerSize: number;
    /** highlight look, in layers (highlightStyles.ts): one backdrop, one outline, additions */
    hlBackdrop: Backdrop;
    hlOutline: Outline;
    hlFill: boolean;
    hlGlow: boolean;
    /** numbers on the outlines, matching the chips in the chat */
    hlBadges: boolean;
    /** the highlight colour, #rgb or #rrggbb; the two-band ring stays black and white */
    hlColor: string;
    /** how an outlined element outside the screen is pointed at */
    offscreenCue: "none" | "edge" | "pointer";
    /** radius of the pointer cue circle, px */
    cueRadius: number;
    /** the waiting orb at an Alt+click: its glossy core, and its turning two-tone swirl
     *  (the soft halo always shows) */
    fxCore: boolean;
    fxSwirl: boolean;
    /** size of an off-screen cue arrow, px */
    cueSize: number;
    /** page moves, chat scrolling and the chat's move to a new click: eased or instant.
     *  Always instant when the system asks for reduced motion */
    motion: "smooth" | "instant";
    /** how long an eased move takes, ms */
    motionMs: number;
    /** minimap target marker: see-through fill or outline; dim, glow and numbers stack */
    /** the minimap draws with the highlight look instead of its own */
    mmFollowHighlight: boolean;
    /** the minimap's own look, in the highlight's layers: one backdrop, one outline,
     *  then fill, glow and numbers (mmGlow, mmNumbers) on top; colour is hlColor */
    mmBackdrop: Backdrop;
    mmOutline: Outline;
    mmFill: boolean;
    mmGlow: boolean;
    mmNumbers: boolean;
    /** whether choosing a piece of evidence moves the page to it */
    moveToEvidence: "offscreen" | "always" | "never";
    /** the chat's look: the assistant standard, or the audio-guide or station-sign alternates */
    chatStyle: "assistant" | "audioGuide" | "station";
    /** interface language of the chat; auto follows the page, then the browser */
    chatLanguage: "auto" | "en" | "ja";
    /** a short sound for every chat action, alongside what is shown */
    sounds: boolean;
    /** answers cite the page elements they used, as numbered chips that highlight */
    citeEvidence: boolean;
    /** re-capture before a message when the user scrolled, panned or zoomed since the last one */
    refreshView: boolean;
    /** when an answer's evidence is outlined without a click */
    autoHighlight: "where" | "always" | "never";
    /** what Escape dismisses first when a highlight and the popover are both up */
    escapeOrder: "highlight" | "popover" | "both";
}

const DEFAULTS: Settings = {
    zoom: true,
    mouseTrace: true,
    zoomTrace: true,
    viewportCrop: true,
    zoomKeys: true,
    smoothZoom: true,
    smartZoom: true,
    streamReplies: true,
    quickActions: true,
    dragPopover: true,
    elementContext: true,
    regionSelect: true,
    highContrast: false,
    continuity: true,
    autoRead: false,
    voiceInput: true,
    hints: true,
    minimap: true,
    lensPan: false,
    debugView: false,
    captureRes: 1,
    chatFontSize: 14,
    chatTextScale: 100,
    pinnedPos: null,
    debugPanel: { pos: null, collapsed: false },
    inventory: true,
    inventoryMaxDepth: 12,
    inventorySummaryDepth: 2,
    inventorySummaryCap: 160,
    inventoryMaxBytes: 200000,
    inventoryMaxNodes: 900,
    ringWidth: 2,
    ringScale: false,
    minimapMarkerSize: 8,
    hlBackdrop: "none",
    hlOutline: "band",
    hlFill: false,
    hlGlow: false,
    hlBadges: true,
    hlColor: "#ffd400",
    offscreenCue: "none",
    cueRadius: 90,
    cueSize: 72,
    fxCore: true,
    fxSwirl: true,
    motion: "smooth",
    motionMs: 350,
    mmFollowHighlight: false,
    mmBackdrop: "none",
    mmOutline: "none",
    mmFill: true,
    mmGlow: false,
    mmNumbers: true,
    moveToEvidence: "offscreen",
    chatStyle: "assistant",
    chatLanguage: "auto",
    sounds: true,
    citeEvidence: true,
    refreshView: true,
    autoHighlight: "where",
    escapeOrder: "highlight",
};

/** keys of Settings whose value is a boolean — the on/off rows in the panel */
export type BoolSettingKey = {
    [K in keyof Settings]: Settings[K] extends boolean ? K : never;
}[keyof Settings];

export const TOGGLE_LABELS: Record<BoolSettingKey, string> = {
    zoom: "Page zoom (ctrl+wheel)",
    mouseTrace: "Mouse trail capture",
    zoomTrace: "Zoom history capture",
    viewportCrop: "Send zoomed-view close-up",
    zoomKeys: "Zoom shortcuts (ctrl +/− /0)",
    smoothZoom: "Smooth zoom animation",
    smartZoom: "Double-click zoom to fit",
    streamReplies: "Streaming chat replies",
    quickActions: "Quick-action chips",
    dragPopover: "Movable popover (drag header)",
    elementContext: "Clicked-element context capture",
    regionSelect: "Alt+drag region select",
    highContrast: "High contrast",
    continuity: "Conversation continuity",
    autoRead: "Read replies aloud",
    voiceInput: "Voice input (mic)",
    hints: "Proactive help hints",
    minimap: "Show the minimap while zoomed",
    lensPan: "Lens panning (freeze page while zoomed)",
    debugView: "Debug view (ctrl+shift+D)",
    inventory: "Send page inventory with captures",
    ringScale: "Outline grows with the zoom",
    hlFill: "Colour fill",
    hlGlow: "Glow",
    hlBadges: "Numbered badges",
    mmFollowHighlight: "Same look as the highlights",
    mmFill: "Colour fill (see-through)",
    mmGlow: "Glow around targets",
    mmNumbers: "Numbers on targets",
    citeEvidence: "Answers cite page elements",
    sounds: "A sound for every action",
    refreshView: "Send my new view with follow-ups",
    fxCore: "Glossy core",
    fxSwirl: "Two-tone swirl",
};

/** keys of Settings whose value is a number — the integer knob rows in the panel */
export type NumSettingKey = {
    [K in keyof Settings]: Settings[K] extends number ? K : never;
}[keyof Settings];

/**
 * Bounds and label for every numeric knob, keyed like TOGGLE_LABELS so a numeric
 * setting without a row here fails typecheck. captureRes and chatFontSize have
 * hand-written <select>s in SettingsPanel; their rows describe the same choices.
 */
export const NUMBER_KNOBS: Record<
    NumSettingKey,
    { label: string; min: number; max: number; step: number }
> = {
    captureRes: { label: "Capture resolution", min: 0.5, max: 1, step: 0.5 },
    chatFontSize: { label: "Chat scale", min: 14, max: 20, step: 3 },
    chatTextScale: { label: "Text size (%)", min: 80, max: 200, step: 10 },
    inventoryMaxDepth: {
        label: "Inventory max depth",
        min: 1,
        max: 40,
        step: 1,
    },
    inventorySummaryDepth: {
        label: "Inventory summary depth",
        min: 0,
        max: 10,
        step: 1,
    },
    // the backend refuses a text over 1,000 characters (the cap plus its "…") and an
    // inventory over 1 MB, which would fail the whole capture upload
    inventorySummaryCap: {
        label: "Inventory text cap (chars)",
        min: 20,
        max: 990,
        step: 10,
    },
    inventoryMaxBytes: {
        label: "Inventory byte cap",
        min: 10000,
        max: 1000000,
        step: 10000,
    },
    inventoryMaxNodes: {
        label: "Inventory node cap",
        min: 50,
        max: 1000,
        step: 50,
    },
    ringWidth: { label: "Outline width (px)", min: 1, max: 6, step: 1 },
    minimapMarkerSize: {
        label: "Smallest target on the map (px)",
        min: 8,
        max: 32,
        step: 2,
    },
    cueRadius: {
        label: "Distance from the pointer (px)",
        min: 40,
        max: 240,
        step: 10,
    },
    cueSize: {
        label: "Arrow size (px)",
        min: 48,
        max: 128,
        step: 8,
    },
    motionMs: {
        label: "Movement duration (ms)",
        min: 100,
        max: 1000,
        step: 50,
    },
};

/** the escapeOrder choices with their panel labels; the keys are the valid stored values */
export const ESCAPE_ORDERS: Record<Settings["escapeOrder"], string> = {
    highlight: "Escape clears the outline first",
    popover: "Escape closes the popover first",
    both: "Escape clears the outline and closes the popover",
};

/** the autoHighlight choices with their panel labels; the keys are the valid stored values */
export const AUTO_HIGHLIGHTS: Record<Settings["autoHighlight"], string> = {
    where: "Outline evidence when I ask where / to show",
    always: "Outline evidence of every answer",
    never: "Outline only when I click",
};

/**
 * Every string-valued setting with a fixed set of values: the panel renders one
 * <select> per row, in this order, and hydration rejects anything not listed.
 */
export const ENUM_CHOICES = {
    chatStyle: {
        label: "Style",
        choices: {
            assistant: "Assistant",
            audioGuide: "Audio guide",
            station: "Station signs",
        },
    },
    chatLanguage: {
        label: "Language",
        choices: { auto: "Follow the page", en: "English", ja: "日本語" },
    },
    hlOutline: { label: "Outline", choices: OUTLINES },
    hlBackdrop: { label: "Backdrop", choices: BACKDROPS },
    offscreenCue: {
        label: "Arrows",
        choices: {
            none: "None",
            edge: "At the screen edge",
            pointer: "Around the pointer",
        },
    },
    motion: {
        label: "Movement",
        choices: {
            smooth: "Smooth (instant under reduced motion)",
            instant: "Instant",
        },
    },
    mmOutline: { label: "Outline", choices: OUTLINES },
    mmBackdrop: { label: "Backdrop", choices: BACKDROPS },
    moveToEvidence: {
        label: "Move the page to evidence",
        choices: {
            offscreen: "Only when it is off-screen",
            always: "Always centre it",
            never: "Never (cues only)",
        },
    },
    autoHighlight: { label: "Auto-highlight", choices: AUTO_HIGHLIGHTS },
    escapeOrder: { label: "Escape order", choices: ESCAPE_ORDERS },
} as const satisfies Partial<
    Record<keyof Settings, { label: string; choices: Record<string, string> }>
>;
export type EnumKey = keyof typeof ENUM_CHOICES;

/**
 * Numeric settings offered as a named-choice <select> rather than a free number.
 * The panel renders these; hydration rejects a stored value that is not one of them.
 */
export const SELECT_CHOICES = {
    captureRes: [
        { value: 1, label: "Screen (1x)" },
        { value: 0.5, label: "Reduced (0.5x)" },
    ],
    chatFontSize: [
        { value: 14, label: "Normal" },
        { value: 17, label: "Large" },
        { value: 20, label: "X-Large" },
    ],
} satisfies Partial<Record<NumSettingKey, { value: number; label: string }[]>>;
export type SelectKnobKey = keyof typeof SELECT_CHOICES;

/**
 * The settings panel, in groups a person looks for ("where is the glow?"): each
 * group holds everything about one thing, whatever kind of control it is. Every
 * toggle, choice and number appears in exactly one group (settings.test.ts).
 */
export const PANEL_SECTIONS: {
    title: string;
    open?: boolean;
    keys: (keyof Settings)[];
}[] = [
    {
        title: "Chat",
        open: true,
        keys: [
            "chatStyle",
            "chatLanguage",
            "chatFontSize",
            "chatTextScale",
            "highContrast",
            "sounds",
            "quickActions",
            "voiceInput",
            "autoRead",
            "streamReplies",
            "dragPopover",
            "continuity",
            "escapeOrder",
        ],
    },
    {
        title: "Answers and sources",
        keys: [
            "citeEvidence",
            "autoHighlight",
            "moveToEvidence",
            "refreshView",
        ],
    },
    {
        title: "Highlight look",
        open: true,
        keys: [
            "hlOutline",
            "hlBackdrop",
            "hlColor",
            "hlFill",
            "hlGlow",
            "hlBadges",
            "ringWidth",
            "ringScale",
        ],
    },
    {
        title: "Off-screen arrows",
        keys: ["offscreenCue", "cueSize", "cueRadius"],
    },
    { title: "Movement", keys: ["motion", "motionMs"] },
    {
        title: "Minimap",
        keys: [
            "minimap",
            "mmFollowHighlight",
            "mmOutline",
            "mmBackdrop",
            "mmFill",
            "mmGlow",
            "mmNumbers",
            "minimapMarkerSize",
        ],
    },
    {
        title: "Page zoom",
        keys: ["zoom", "zoomKeys", "smoothZoom", "smartZoom", "lensPan"],
    },
    { title: "Asking", keys: ["regionSelect", "elementContext", "hints"] },
    { title: "Waiting at the click", keys: ["fxCore", "fxSwirl"] },
    {
        title: "Capture and research",
        keys: [
            "mouseTrace",
            "zoomTrace",
            "viewportCrop",
            "captureRes",
            "inventory",
            "inventoryMaxDepth",
            "inventorySummaryDepth",
            "inventorySummaryCap",
            "inventoryMaxBytes",
            "inventoryMaxNodes",
            "debugView",
        ],
    },
];

/**
 * Persisted values can be stale, out of range or the wrong type (an old build, a
 * hand-edited localStorage). Dispatch is by key: numeric knobs coerce with Number()
 * and clamp into their NUMBER_KNOBS bounds (or must be one of their SELECT_CHOICES),
 * enums must be a table key, booleans must be booleans; anything else falls back to
 * the default. pinnedPos and debugPanel pass through: their consumers validate them.
 */
export function clampSetting<K extends keyof Settings>(
    key: K,
    value: unknown,
): Settings[K] {
    const fallback = DEFAULTS[key];
    if (Object.hasOwn(NUMBER_KNOBS, key)) {
        const n = Number(value);
        if (!Number.isFinite(n)) return fallback;
        if (Object.hasOwn(SELECT_CHOICES, key)) {
            const choices = SELECT_CHOICES[key as SelectKnobKey];
            return choices.some((c) => c.value === n)
                ? (n as Settings[K])
                : fallback;
        }
        const { min, max } = NUMBER_KNOBS[key as NumSettingKey];
        return Math.min(max, Math.max(min, n)) as Settings[K];
    }
    if (Object.hasOwn(ENUM_CHOICES, key)) {
        const { choices } = ENUM_CHOICES[key as EnumKey];
        return Object.hasOwn(choices, String(value))
            ? (value as Settings[K])
            : fallback;
    }
    if (key === "hlColor") {
        return isHexColor(value) ? (value as Settings[K]) : fallback;
    }
    if (typeof fallback === "boolean") {
        return typeof value === "boolean" ? (value as Settings[K]) : fallback;
    }
    return value as Settings[K];
}

/** hydration: every stored key is sanitised before it becomes state; unknown keys are dropped */
function mergePersisted(persisted: unknown, current: Settings): Settings {
    const stored = (persisted ?? {}) as Record<string, unknown>;
    const next = { ...current };
    for (const key of Object.keys(DEFAULTS) as (keyof Settings)[]) {
        if (Object.hasOwn(stored, key)) {
            next[key] = clampSetting(key, stored[key]) as never;
        }
    }
    // older builds stored the minimap look as a shape and a dim switch
    if (!Object.hasOwn(stored, "mmOutline") && stored.mmShape === "outlined") {
        next.mmOutline = "band";
        next.mmFill = false;
    }
    if (!Object.hasOwn(stored, "mmBackdrop") && stored.mmDim === true)
        next.mmBackdrop = "dim";
    return next;
}

export const useSettings = create<Settings>()(
    persist(() => ({ ...DEFAULTS }), {
        name: "unilens-settings",
        merge: mergePersisted,
    }),
);

/** live snapshot for non-React modules (React components use the useSettings hook) */
export const getSettings = () => useSettings.getState();

/** subscribe to settings changes (returns unsubscribe) — lets open UI re-render live */
export const onSettingsChange = (cb: () => void) => useSettings.subscribe(cb);

/** programmatic settings change (e.g. keyboard shortcuts) — persists + notifies */
export function updateSetting<K extends keyof Settings>(
    key: K,
    value: Settings[K],
) {
    useSettings.setState({ [key]: value });
}

/** ms an eased move should take now: 0 when the motion setting is instant or the
 *  system asks for reduced motion */
export function motionMs(): number {
    const s = getSettings();
    const reduced =
        typeof matchMedia === "function" &&
        matchMedia("(prefers-reduced-motion: reduce)").matches;
    return s.motion === "instant" || reduced ? 0 : s.motionMs;
}
