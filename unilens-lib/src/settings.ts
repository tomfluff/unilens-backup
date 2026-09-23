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
    /** chat bubble font size in px */
    chatFontSize: number;
    /** popover pinned position — null = follow the cursor (survives reloads) */
    pinnedPos: { left: number; top: number } | null;
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
    /** minimap target marker size in px */
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
    /** minimap target marker: see-through fill or outline; dim, glow and numbers stack */
    mmShape: "filled" | "outlined";
    mmDim: boolean;
    mmGlow: boolean;
    mmNumbers: boolean;
    /** whether choosing a piece of evidence moves the page to it */
    moveToEvidence: "offscreen" | "always" | "never";
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
    pinnedPos: null,
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
    mmShape: "filled",
    mmDim: false,
    mmGlow: false,
    mmNumbers: true,
    moveToEvidence: "offscreen",
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
    highContrast: "High-contrast chat",
    continuity: "Conversation continuity",
    autoRead: "Read replies aloud",
    voiceInput: "Voice input (mic)",
    hints: "Proactive help hints",
    minimap: "Minimap while zoomed",
    lensPan: "Lens panning (freeze page while zoomed)",
    debugView: "Debug view (ctrl+shift+D)",
    inventory: "Send page inventory with captures",
    ringScale: "Scale the outline with zoom",
    hlFill: "Highlight: colour fill",
    hlGlow: "Highlight: glow",
    hlBadges: "Highlight: numbered badges",
    mmDim: "Minimap: dim the map around targets",
    mmGlow: "Minimap: glow around targets",
    mmNumbers: "Minimap: numbers on targets",
    citeEvidence: "Answers cite page elements",
    refreshView: "Send my new view with follow-ups",
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
    chatFontSize: { label: "Chat text size", min: 14, max: 20, step: 3 },
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
    inventorySummaryCap: {
        label: "Inventory text cap (chars)",
        min: 20,
        max: 1000,
        step: 10,
    },
    inventoryMaxBytes: {
        label: "Inventory byte cap",
        min: 10000,
        max: 2000000,
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
        label: "Minimap marker min size (px)",
        min: 8,
        max: 32,
        step: 2,
    },
    cueRadius: {
        label: "Pointer cue radius (px)",
        min: 40,
        max: 240,
        step: 10,
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
    hlOutline: { label: "Highlight outline", choices: OUTLINES },
    hlBackdrop: { label: "Highlight backdrop", choices: BACKDROPS },
    offscreenCue: {
        label: "Off-screen cue",
        choices: {
            none: "None",
            edge: "Arrows at the screen edge",
            pointer: "Arrows around the pointer",
        },
    },
    mmShape: {
        label: "Minimap marker",
        choices: { filled: "Filled, see-through", outlined: "Outlined" },
    },
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
 * Persisted values can be stale, out of range or the wrong type (an old build, a
 * hand-edited localStorage). Dispatch is by key: numeric knobs coerce with Number()
 * and clamp into their NUMBER_KNOBS bounds (or must be one of their SELECT_CHOICES),
 * enums must be a table key, booleans must be booleans; anything else falls back to
 * the default. pinnedPos passes through: its consumer validates the coordinates.
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
