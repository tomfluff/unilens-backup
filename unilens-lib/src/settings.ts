/**
 * UniLens settings store (zustand) — per-feature toggles, persisted in localStorage.
 * React reads via the useSettings hook; imperative modules via getSettings().
 * UI lives in SettingsPanel.tsx.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { HIGHLIGHT_PRESETS, type HighlightPreset } from "./highlightStyles";

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
    /** stop descending past this depth (body = 0) when building the inventory */
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
    /** pulse the outline briefly when a highlight appears */
    pulse: boolean;
    /** minimap target marker size in px */
    minimapMarkerSize: number;
    /** send the screenshots with a locate ("where is X?") request */
    locateScreenshot: boolean;
    /** what Escape dismisses first when a highlight and the popover are both up */
    escapeOrder: "highlight" | "popover" | "both";
    /** which HIGHLIGHT_PRESETS entry the located-element outline is drawn with */
    highlightStyle: HighlightPreset;
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
    pulse: false,
    minimapMarkerSize: 16,
    locateScreenshot: true,
    escapeOrder: "highlight",
    highlightStyle: "wcag-ring",
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
    pulse: "Pulse the outline briefly",
    locateScreenshot: "Send screenshot with locate",
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
        label: "Minimap marker size (px)",
        min: 8,
        max: 32,
        step: 2,
    },
};

/** the escapeOrder choices with their panel labels; the keys are the valid stored values */
export const ESCAPE_ORDERS: Record<Settings["escapeOrder"], string> = {
    highlight: "Escape clears the outline first",
    popover: "Escape closes the popover first",
    both: "Escape clears the outline and closes the popover",
};

/**
 * Persisted values can be stale or out of range (an old build, a hand-edited
 * localStorage). Numbers are clamped into their NUMBER_KNOBS bounds; an unknown
 * enum value falls back to its default; everything else passes through.
 */
export function clampSetting<K extends keyof Settings>(
    key: K,
    value: Settings[K],
): Settings[K] {
    if (typeof value === "number") {
        if (!Number.isFinite(value)) return DEFAULTS[key];
        const { min, max } = NUMBER_KNOBS[key as NumSettingKey];
        return Math.min(max, Math.max(min, value)) as Settings[K];
    }
    if (key === "escapeOrder" && !(String(value) in ESCAPE_ORDERS)) {
        return DEFAULTS[key];
    }
    if (key === "highlightStyle" && !(String(value) in HIGHLIGHT_PRESETS)) {
        return DEFAULTS[key];
    }
    return value;
}

export const useSettings = create<Settings>()(
    persist(() => ({ ...DEFAULTS }), { name: "unilens-settings" }),
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
