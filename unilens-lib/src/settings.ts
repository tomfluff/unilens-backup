/**
 * UniLens settings store (zustand) — per-feature toggles, persisted in localStorage.
 * React reads via the useSettings hook; imperative modules via getSettings().
 * UI lives in SettingsPanel.tsx.
 */
import { create } from "zustand";
import {
    createJSONStorage,
    persist,
    type StateStorage,
} from "zustand/middleware";
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
    /** the colour of the pointer's trail in the pictures the assistant gets */
    trailColor: "orange" | "lime";
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
    /** after a reload, the conversation on this site comes back (UniLens's own store) */
    restoreAfterReload: boolean;
    autoRead: boolean;
    voiceInput: boolean;
    /** the Live button: a spoken conversation with the assistant */
    liveTalk: boolean;
    /** the mic sends what was heard when the speaker pauses; off, it stays in the field */
    voiceAutoSend: boolean;
    hints: boolean;
    /** the minimap: never, while the page is zoomed, or always */
    minimap: "off" | "zoomed" | "always";
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
    /** what an Alt+click shows while the page is captured (clickFx.ts) */
    clickFx: "orb" | "aurora" | "sonar" | "frame" | "edge";
    /** the waiting orb at an Alt+click: its glossy core, and its turning two-tone swirl
     *  (the soft halo always shows) */
    fxCore: boolean;
    fxSwirl: boolean;
    /** click feedback, shared: the ending (the style's own, or one for all), size in
     *  percent, tempo, and the ripple on the click */
    fxEnding: "auto" | "fade" | "fly" | "found";
    fxSize: number;
    fxSpeed: "calm" | "normal" | "lively";
    fxRipple: boolean;
    /** the ripple: the highlight colour between black rims (reads on any page), or the
     *  highlight colour alone, thick to thin */
    fxRippleLook: "rimmed" | "taper";
    /** click feedback, per style: the orb's halo; the aurora's point dot and blur; a
     *  third colour for aurora and edge; the sonar's rings; the frame's shape, sheen
     *  and breathing; the edge's thickness, gradient and pin */
    fxHalo: boolean;
    fxDot: boolean;
    fxSoftness: number;
    fxThirdTone: boolean;
    fxRings: number;
    fxRingStyle: "filled" | "outline";
    fxFrameShape: "brackets" | "highlight";
    fxSheen: boolean;
    fxHug: boolean;
    fxEdgeWidth: number;
    fxEdgeGradient: boolean;
    fxPin: boolean;
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
    /** a chat covering a chosen source steps aside, to the nearer side, or folds to
     *  its header when there is no room (a pinned chat only folds); off, it stays */
    chatMovesAside: boolean;
    /** the line above the field saying what the next question is about (the outlined
     *  sources or place); hidden, they still go with the question */
    aboutLine: boolean;
    /** Ctrl+Shift+D shows and hides the debug view (it lists research settings) */
    debugShortcut: boolean;
    /** the assistant zooms the page when the user asks (the chat and Live) */
    assistantZoom: boolean;
    /** underline the fewest words each source supports, joined to its number */
    associateText: boolean;
    /** where an answer's source numbers go: where the model put them, at the end of
     *  each sentence, or all after the answer (underlines need them in the sentence) */
    citePlacement: "inline" | "sentence" | "end";
    /** the settings gear on the page; hidden, Ctrl+Alt+Shift+S still opens settings */
    settingsButton: boolean;
    /** AI settings (research): the backend checks each choice against its catalogue */
    aiProvider: "auto" | "openai" | "gemini";
    /** a model id from the backend's catalogue; "" = the provider's default */
    aiModel: string;
    aiReasoning: "default" | "low" | "medium" | "high";
    /** who reads answers aloud (auto: the backend's default) */
    ttsProvider: "auto" | "openai" | "gemini";
    /** that provider's read-aloud model; "" = its default */
    ttsModel: string;
    /** the read-aloud voice; "" = the provider's default */
    ttsVoice: string;
    /** who hears a voice message: the browser, else the server (auto), or a provider */
    sttEngine: "auto" | "browser" | "openai" | "gemini";
    /** the server's speech-to-text model; "" = the backend's default */
    sttModel: string;
    /** Live, a spoken conversation: the provider (auto: the AI settings', else the
     *  backend's) */
    liveProvider: "auto" | "openai" | "gemini";
    /** a Live model from the backend's catalogue; "" = the provider's default */
    liveModel: string;
    /** the Live voice; "" = the provider's default */
    liveVoice: string;
    /** how soon a pause ends the user's turn */
    liveTurnEnd: "patient" | "normal" | "quick";
    /** speaking over the model stops it */
    liveBargeIn: boolean;
    /** the model lights up what it talks about, and its words get source chips */
    livePoint: boolean;
    /** a picture of what the user sees goes with the page's elements */
    liveScreenshot: boolean;
    /** words show as they are spoken (off: once each turn is complete) */
    liveCaptions: boolean;
    /** the model's speaking rate, % (OpenAI; Gemini has none) */
    liveSpeed: number;
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
    trailColor: "orange",
    zoomTrace: true,
    viewportCrop: true,
    zoomKeys: false,
    smoothZoom: true,
    smartZoom: true,
    streamReplies: true,
    quickActions: false,
    dragPopover: true,
    elementContext: true,
    regionSelect: true,
    highContrast: false,
    continuity: true,
    restoreAfterReload: true,
    autoRead: false,
    voiceInput: false,
    liveTalk: true,
    voiceAutoSend: true,
    hints: false,
    minimap: "zoomed",
    lensPan: false,
    debugView: false,
    captureRes: 1,
    chatFontSize: 17,
    chatTextScale: 120,
    pinnedPos: null,
    debugPanel: { pos: null, collapsed: false },
    inventory: true,
    inventoryMaxDepth: 40,
    inventorySummaryDepth: 8,
    inventorySummaryCap: 160,
    inventoryMaxBytes: 200000,
    inventoryMaxNodes: 900,
    ringWidth: 2,
    ringScale: false,
    minimapMarkerSize: 32,
    hlBackdrop: "none",
    hlOutline: "ring",
    hlFill: false,
    hlGlow: true,
    hlBadges: true,
    hlColor: "#ffef26",
    offscreenCue: "edge",
    cueRadius: 60,
    cueSize: 48,
    clickFx: "orb",
    fxCore: false,
    fxSwirl: true,
    fxEnding: "fly",
    fxSize: 100,
    fxSpeed: "lively",
    fxRipple: true,
    fxRippleLook: "taper",
    fxHalo: false,
    fxDot: true,
    fxSoftness: 16,
    fxThirdTone: true,
    fxRings: 3,
    fxRingStyle: "filled",
    fxFrameShape: "highlight",
    fxSheen: true,
    fxHug: true,
    fxEdgeWidth: 18,
    fxEdgeGradient: true,
    fxPin: true,
    motion: "smooth",
    motionMs: 1000,
    mmFollowHighlight: false,
    mmBackdrop: "none",
    mmOutline: "none",
    mmFill: true,
    mmGlow: true,
    mmNumbers: true,
    moveToEvidence: "offscreen",
    chatStyle: "assistant",
    chatLanguage: "en",
    sounds: true,
    citeEvidence: true,
    chatMovesAside: true,
    aboutLine: true,
    debugShortcut: true,
    assistantZoom: true,
    associateText: false,
    citePlacement: "inline",
    settingsButton: true,
    aiProvider: "auto",
    aiModel: "",
    aiReasoning: "default",
    ttsProvider: "auto",
    ttsModel: "",
    ttsVoice: "",
    sttEngine: "auto",
    sttModel: "",
    liveProvider: "auto",
    liveModel: "",
    liveVoice: "",
    liveTurnEnd: "normal",
    liveBargeIn: true,
    livePoint: true,
    liveScreenshot: true,
    liveCaptions: true,
    liveSpeed: 100,
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
    restoreAfterReload: "Keep the conversation across reloads",
    autoRead: "Read replies aloud",
    voiceInput: "Voice input (mic)",
    liveTalk: "Live conversation button",
    voiceAutoSend: "Send what I say when I pause",
    hints: "Proactive help hints",
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
    chatMovesAside: "Move the chat out of the way of sources",
    aboutLine: "Show what the next question is about, above the field",
    debugShortcut: "Ctrl+Shift+D opens the debug view",
    assistantZoom: "The assistant can zoom the page when asked",
    associateText:
        "Associate response text (underline what each source supports)",
    settingsButton: "Settings button (hidden: Ctrl+Alt+Shift+S opens settings)",
    sounds: "A sound for every action",
    refreshView: "Send my new view with follow-ups",
    fxCore: "Orb: glossy core",
    fxSwirl: "Orb: two-tone swirl",
    fxRipple: "Ripple on the click",
    fxHalo: "Orb: halo",
    fxDot: "Aurora: dot on the exact point",
    fxThirdTone: "Third colour (coral)",
    fxSheen: "Frame: scanning sheen",
    fxHug: "Frame: breathing",
    fxEdgeGradient: "Edge: moving gradient",
    fxPin: "Edge: pin at the click",
    liveBargeIn: "Stop it by speaking over it",
    livePoint: "Light up what it talks about",
    liveScreenshot: "Send a picture of my view",
    liveCaptions: "Show words as they are spoken",
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
    liveSpeed: {
        label: "Speaking rate (%, OpenAI)",
        min: 50,
        max: 150,
        step: 10,
    },
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
    fxSize: { label: "Size (%)", min: 50, max: 200, step: 10 },
    fxSoftness: { label: "Aurora: softness (px)", min: 6, max: 30, step: 2 },
    fxRings: { label: "Sonar: rings", min: 1, max: 3, step: 1 },
    fxEdgeWidth: { label: "Edge: thickness (px)", min: 8, max: 40, step: 2 },
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
    clickFx: {
        label: "Style",
        choices: {
            orb: "Breathing orb",
            aurora: "Aurora",
            sonar: "Sonar",
            frame: "Frame what was clicked",
            edge: "Screen edge glow",
        },
    },
    fxEnding: {
        label: "Ending",
        choices: {
            auto: "The style's own",
            fade: "Fade",
            fly: "Fly into the chat",
            found: "A found pulse",
        },
    },
    fxRippleLook: {
        label: "Ripple look",
        choices: {
            rimmed: "Highlight colour with black rims",
            taper: "Highlight colour, thick to thin",
        },
    },
    fxSpeed: {
        label: "Speed",
        choices: { calm: "Calm", normal: "Normal", lively: "Lively" },
    },
    fxRingStyle: {
        label: "Sonar: rings look",
        choices: { filled: "Filled", outline: "Outlined" },
    },
    fxFrameShape: {
        label: "Frame: shape",
        choices: {
            brackets: "Corner brackets",
            highlight: "Same as the highlight outline",
        },
    },
    motion: {
        label: "Movement",
        choices: {
            smooth: "Smooth (instant under reduced motion)",
            instant: "Instant",
        },
    },
    minimap: {
        label: "Minimap",
        choices: { off: "Off", zoomed: "While zoomed", always: "Always" },
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
    citePlacement: {
        label: "Where the source numbers go",
        choices: {
            inline: "In the sentence, after the words",
            sentence: "At the end of each sentence",
            end: "After the whole answer",
        },
    },
    aiProvider: {
        label: "Provider",
        choices: {
            auto: "Backend default",
            openai: "OpenAI",
            gemini: "Gemini",
        },
    },
    trailColor: {
        label: "Pointer trail colour (in the assistant's pictures)",
        choices: { orange: "Orange", lime: "Lime" },
    },
    ttsProvider: {
        label: "Read-aloud provider",
        choices: {
            auto: "Backend default",
            openai: "OpenAI",
            gemini: "Gemini",
        },
    },
    sttEngine: {
        label: "Speech recognition",
        choices: {
            auto: "Browser, else server",
            browser: "Browser only",
            openai: "OpenAI (server)",
            gemini: "Gemini (server)",
        },
    },
    aiReasoning: {
        label: "Reasoning",
        choices: {
            default: "Model default",
            low: "Low",
            medium: "Medium",
            high: "High",
        },
    },
    liveProvider: {
        label: "Provider",
        choices: {
            auto: "As the AI settings",
            openai: "OpenAI",
            gemini: "Gemini",
        },
    },
    liveTurnEnd: {
        label: "My turn ends after",
        choices: {
            patient: "A long pause (take my time)",
            normal: "A normal pause",
            quick: "A short pause (snappy)",
        },
    },
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

/** one group of a settings tab: the controls shown, then the rarer ones behind a
 *  disclosure; its title is in settingsText.ts */
export interface PanelGroup {
    id: string;
    first: (keyof Settings)[];
    more: (keyof Settings)[];
}
export type PanelTabId =
    | "general"
    | "look"
    | "conversation"
    | "zoom"
    | "voice"
    | "ai"
    | "advanced";

/**
 * The settings panel, by the area a setting belongs to (Yotam, 2026-10-03: no
 * separate "Study" tab). Each group shows its first controls and folds the rest.
 * Every toggle, choice and number appears in exactly one group (settings.test.ts).
 */
export const PANEL_TABS: { id: PanelTabId; groups: PanelGroup[] }[] = [
    {
        id: "general",
        groups: [
            {
                id: "chat",
                first: [
                    "chatStyle",
                    "chatLanguage",
                    "chatFontSize",
                    "chatTextScale",
                    "highContrast",
                ],
                more: ["dragPopover", "hints", "escapeOrder", "settingsButton"],
            },
        ],
    },
    {
        id: "look",
        groups: [
            {
                id: "highlight",
                first: ["hlColor", "hlOutline", "hlBackdrop"],
                more: [
                    "hlFill",
                    "hlGlow",
                    "hlBadges",
                    "ringWidth",
                    "ringScale",
                ],
            },
            {
                id: "cues",
                first: ["offscreenCue"],
                more: ["cueSize", "cueRadius"],
            },
            {
                id: "clickFeedback",
                first: ["clickFx"],
                more: [
                    "fxEnding",
                    "fxSize",
                    "fxSpeed",
                    "fxRipple",
                    "fxRippleLook",
                    "fxHalo",
                    "fxSwirl",
                    "fxCore",
                    "fxDot",
                    "fxSoftness",
                    "fxThirdTone",
                    "fxRings",
                    "fxRingStyle",
                    "fxFrameShape",
                    "fxSheen",
                    "fxHug",
                    "fxEdgeWidth",
                    "fxEdgeGradient",
                    "fxPin",
                ],
            },
            { id: "movement", first: ["motion"], more: ["motionMs"] },
        ],
    },
    {
        id: "conversation",
        groups: [
            {
                id: "conversation",
                first: [
                    "quickActions",
                    "continuity",
                    "restoreAfterReload",
                    "autoHighlight",
                    "moveToEvidence",
                ],
                more: [
                    "streamReplies",
                    "citeEvidence",
                    "citePlacement",
                    "associateText",
                    "chatMovesAside",
                    "aboutLine",
                    "regionSelect",
                    "elementContext",
                    "refreshView",
                ],
            },
        ],
    },
    {
        id: "zoom",
        groups: [
            {
                id: "zoom",
                first: ["zoom", "zoomKeys"],
                more: ["smoothZoom", "smartZoom", "lensPan", "assistantZoom"],
            },
            {
                id: "minimap",
                first: ["minimap"],
                more: [
                    "mmFollowHighlight",
                    "mmOutline",
                    "mmBackdrop",
                    "mmFill",
                    "mmGlow",
                    "mmNumbers",
                    "minimapMarkerSize",
                ],
            },
        ],
    },
    {
        id: "voice",
        groups: [
            {
                id: "voiceSound",
                first: ["voiceInput", "liveTalk", "autoRead", "sounds"],
                more: ["voiceAutoSend", "ttsVoice"],
            },
            {
                id: "live",
                first: [],
                more: [
                    "liveTurnEnd",
                    "liveBargeIn",
                    "livePoint",
                    "liveScreenshot",
                    "liveCaptions",
                    "liveSpeed",
                ],
            },
        ],
    },
    {
        id: "ai",
        groups: [
            {
                id: "models",
                first: ["aiProvider", "aiModel", "aiReasoning"],
                more: [],
            },
            {
                id: "speech",
                first: ["ttsProvider", "ttsModel", "sttEngine", "sttModel"],
                more: [],
            },
            {
                id: "liveModels",
                first: ["liveProvider", "liveModel", "liveVoice"],
                more: [],
            },
        ],
    },
    {
        id: "advanced",
        groups: [
            {
                id: "capture",
                first: [
                    "mouseTrace",
                    "trailColor",
                    "zoomTrace",
                    "viewportCrop",
                    "captureRes",
                ],
                more: [],
            },
            {
                id: "inventory",
                first: ["inventory"],
                more: [
                    "inventoryMaxDepth",
                    "inventorySummaryDepth",
                    "inventorySummaryCap",
                    "inventoryMaxBytes",
                    "inventoryMaxNodes",
                ],
            },
            {
                id: "diagnostics",
                first: ["debugView", "debugShortcut"],
                more: [],
            },
        ],
    },
];

/** a setting's starting value: the preset's while one is on (presets.ts), else the
 *  shipped one. What "Reset this tab" restores, and what "changed" means */
export function defaultOf<K extends keyof Settings>(key: K): Settings[K] {
    return preset && Object.hasOwn(preset.values, key)
        ? (preset.values[key] as Settings[K])
        : DEFAULTS[key];
}

/** settings whose choices come from the backend's catalogue (/api/ai), not a table here */
export const CATALOGUE_KEYS = [
    "aiModel",
    "ttsModel",
    "ttsVoice",
    "sttModel",
    "liveModel",
    "liveVoice",
] as const;

/**
 * Persisted values can be stale, out of range or the wrong type (an old build, a
 * hand-edited localStorage). Dispatch is by key: numeric knobs coerce with Number()
 * and clamp into their NUMBER_KNOBS bounds (or must be one of their SELECT_CHOICES),
 * enums must be a table key, booleans must be booleans; anything else falls back to
 * the default (the preset's, while one is on). pinnedPos and debugPanel pass through: their consumers validate them.
 */
export function clampSetting<K extends keyof Settings>(
    key: K,
    value: unknown,
): Settings[K] {
    // the preset's value while one is on: a bad value never undoes the preset
    const fallback = defaultOf(key);
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
    if ((CATALOGUE_KEYS as readonly string[]).includes(key)) {
        return typeof value === "string" && /^[\w.:-]{0,64}$/.test(value)
            ? (value as Settings[K])
            : fallback;
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
    // and the minimap as a switch (on: while zoomed)
    if (typeof stored.minimap === "boolean")
        next.minimap = stored.minimap ? "zoomed" : "off";
    return next;
}

/** the preset in effect (presets.ts), or null: set once, at init, before anything
 *  reads the settings */
let preset: { id: string; name: string; values: Partial<Settings> } | null =
    null;
export const activePreset = (): { id: string; name: string } | null =>
    preset && { id: preset.id, name: preset.name };

const STORE_NAME = "unilens-settings";
/**
 * Where the settings are kept. Normally the site's localStorage. While a preset is
 * on, this tab's sessionStorage under the preset's own key, and only the values that
 * differ from the preset: every page load starts from the preset whatever
 * localStorage holds, a change made in the panel lasts until the tab closes, and the
 * user's own settings in localStorage are left as they were.
 */
const settingsStorage: StateStorage = {
    getItem: (name) => {
        try {
            return preset
                ? sessionStorage.getItem(`${name}:${preset.id}`)
                : localStorage.getItem(name);
        } catch {
            return null;
        }
    },
    setItem: (name, value) => {
        try {
            if (preset) sessionStorage.setItem(`${name}:${preset.id}`, value);
            else localStorage.setItem(name, value);
        } catch {
            // storage blocked or full: the settings still apply for this page
        }
    },
    removeItem: (name) => {
        try {
            if (preset) sessionStorage.removeItem(`${name}:${preset.id}`);
            else localStorage.removeItem(name);
        } catch {
            // as above
        }
    },
};

/** what is written: everything, or under a preset only what differs from it */
function partialize(s: Settings): Partial<Settings> {
    if (!preset) return s;
    const base = { ...DEFAULTS, ...preset.values };
    return Object.fromEntries(
        (Object.keys(DEFAULTS) as (keyof Settings)[])
            .filter((k) => JSON.stringify(s[k]) !== JSON.stringify(base[k]))
            .map((k) => [k, s[k]]),
    );
}

export const useSettings = create<Settings>()(
    persist(() => ({ ...DEFAULTS }), {
        name: STORE_NAME,
        storage: createJSONStorage(() => settingsStorage),
        merge: mergePersisted,
        partialize,
    }),
);

/**
 * Put a preset in effect for this page (presets.ts decides which): the settings
 * become the defaults plus its values, plus what was changed in this tab while it
 * was on. Called once, at init.
 */
export function startPreset(
    id: string,
    name: string,
    values: Partial<Settings>,
) {
    preset = { id, name, values };
    let stored: unknown;
    try {
        stored = JSON.parse(
            settingsStorage.getItem(STORE_NAME) as string,
        )?.state;
    } catch {
        stored = undefined;
    }
    useSettings.setState(
        mergePersisted(stored, { ...DEFAULTS, ...values } as Settings),
    );
}

/** back to the preset's own values: what was changed in this tab while it is on is
 *  forgotten (the next participant) */
export function clearPresetChanges() {
    if (preset) useSettings.setState({ ...DEFAULTS, ...preset.values });
}

/** live snapshot for non-React modules (React components use the useSettings hook) */
export const getSettings = () => useSettings.getState();

/** subscribe to settings changes (returns unsubscribe) — lets open UI re-render live */
export const onSettingsChange = (cb: () => void) => useSettings.subscribe(cb);

/** the file format of an exported settings file; `version` is for future migrations */
const EXPORT_KIND = "unilens-settings";

/** every setting, as a JSON file to download (Export in the settings panel) */
export function exportSettings(): string {
    const s = getSettings();
    const settings = Object.fromEntries(
        (Object.keys(DEFAULTS) as (keyof Settings)[]).map((k) => [k, s[k]]),
    );
    return JSON.stringify(
        {
            kind: EXPORT_KIND,
            version: 1,
            exported: new Date().toISOString(),
            settings,
        },
        null,
        2,
    );
}

/**
 * Apply a settings file (Import in the settings panel): an exported file, or a bare
 * object of settings written by hand. It goes through the same checks as stored
 * settings: out-of-range numbers are clamped, wrong types and unknown choices fall
 * back to the default, unknown keys are ignored, and old keys are migrated. Keys
 * the file leaves out keep their current value. Throws when the text is not a
 * settings file at all.
 */
export function importSettings(text: string): {
    applied: number;
    ignored: string[];
} {
    let data: unknown;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error("not JSON");
    }
    const obj = (x: unknown): x is Record<string, unknown> =>
        typeof x === "object" && x !== null && !Array.isArray(x);
    if (!obj(data)) throw new Error("not a settings object");
    const wrapped = data.kind === EXPORT_KIND;
    const stored = wrapped ? data.settings : data;
    if (!obj(stored)) throw new Error("no settings in the file");
    const known = new Set(Object.keys(DEFAULTS));
    // the old minimap keys are not settings any more, but they still migrate
    const legacy = new Set(["mmShape", "mmDim"]);
    const keys = Object.keys(stored);
    useSettings.setState(mergePersisted(stored, getSettings()));
    return {
        applied: keys.filter((k) => known.has(k)).length,
        ignored: keys.filter((k) => !known.has(k) && !legacy.has(k)),
    };
}

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
