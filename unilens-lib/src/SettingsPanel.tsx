/**
 * UniLens settings panel: a launcher (bottom left) and a modal dialog centred on the
 * page, its settings on the left and a preview beside them that a switch hides.
 * Redesigned 2026-10-03 with Codex: tabs by what the person changes (Chat, Page,
 * Voice and sound, Study), a preview of what the tab changes beside it (the chat's own
 * stylesheet, the real outline code, the real click feedback on request), visual
 * choices for looks, and the research variables in Study with search. The store
 * lives in settings.ts; this file is UI only.
 */
import {
    type KeyboardEvent as ReactKeyboardEvent,
    type ReactNode,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import { createRoot } from "react-dom/client";
import {
    type AiCatalogue,
    aiCatalogue,
    liveProvider,
    setAiBackend,
} from "./ai";
import { chatLang, chatText } from "./chatI18n";
import { ensureChatStyles } from "./chatStyles";
import { clickFeedback, fxStill } from "./clickFx";
import { earcon } from "./earcons";
import { renderCited } from "./evidence";
import {
    aimCue,
    claimEscape,
    cueSvg,
    paintBackdrop,
    paintOutline,
} from "./highlight";
import { type HighlightLook, lookFrom, minimapLook } from "./highlightStyles";
import {
    CheckIcon,
    ChevronIcon,
    CloseIcon,
    HighlightIcon,
    LiveIcon,
    LoadIcon,
    MicIcon,
    MinimizeIcon,
    NewChatIcon,
    PinIcon,
    PlaceIcon,
    PlayIcon,
    ResetIcon,
    SaveIcon,
    SearchIcon,
    SendIcon,
    SettingsIcon,
} from "./icons";
import { boxStyles, lensStyles, MAP_INK, paintMapTargets } from "./minimap";
import {
    activePreset,
    type BoolSettingKey,
    CATALOGUE_KEYS,
    clampSetting,
    defaultOf,
    ENUM_CHOICES,
    type EnumKey,
    exportSettings,
    importSettings,
    NUMBER_KNOBS,
    type NumSettingKey,
    PANEL_TABS,
    type PanelGroup,
    type PanelTabId,
    SELECT_CHOICES,
    type SelectKnobKey,
    type Settings,
    TOGGLE_LABELS,
    updateSetting,
    useSettings,
} from "./settings";
import { ensurePanelStyles } from "./settingsPanelStyles";
import {
    CHOICES_JA,
    NAMES_JA,
    OWN_CHOICES,
    OWN_SETTINGS,
    PANEL_TEXT,
    type PanelLang,
    SHORT_JA,
} from "./settingsText";
import { resetHostStyles } from "./uiReset";
import {
    getTargetZoom,
    getZoom,
    onZoomChange,
    type ClientRect as Rect,
    setZoom,
} from "./zoom";

type Key = keyof Settings;
type Text = (typeof PANEL_TEXT)["en"];

/** the minimap's own look: hidden while it follows the highlight look */
const MM_OWN_LOOK = new Set<Key>([
    "mmOutline",
    "mmBackdrop",
    "mmFill",
    "mmGlow",
    "mmNumbers",
]);

/** every minimap setting but the minimap itself: hidden while it is off */
const MM_ALL = new Set<Key>([
    ...MM_OWN_LOOK,
    "mmFollowHighlight",
    "minimapMarkerSize",
]);

/** the click-feedback knobs that belong to some styles only */
const FX_OWN: Partial<Record<Key, Settings["clickFx"][]>> = {
    fxHalo: ["orb"],
    fxSwirl: ["orb"],
    fxCore: ["orb"],
    fxDot: ["aurora"],
    fxSoftness: ["aurora"],
    fxThirdTone: ["aurora", "edge"],
    fxRings: ["sonar"],
    fxRingStyle: ["sonar"],
    fxFrameShape: ["frame"],
    fxSheen: ["frame"],
    fxHug: ["frame"],
    fxEdgeWidth: ["edge"],
    fxEdgeGradient: ["edge"],
    fxPin: ["edge"],
};

/** shown now: some settings only mean something while another is on */
function relevant(key: Key, s: Settings): boolean {
    if (s.mmFollowHighlight && MM_OWN_LOOK.has(key)) return false;
    if (key === "fxRippleLook" && !s.fxRipple) return false;
    if (key === "voiceAutoSend" && !s.voiceInput) return false;
    if (key === "associateText" && s.citePlacement !== "inline") return false;
    if (MM_ALL.has(key) && s.minimap === "off") return false;
    const own = FX_OWN[key];
    return !own || own.includes(s.clickFx);
}

/** looks chosen by sight: a thumbnail card per choice */
const PICKERS = new Set<Key>([
    "chatStyle",
    "hlOutline",
    "hlBackdrop",
    "mmOutline",
    "mmBackdrop",
    "offscreenCue",
    "clickFx",
]);
/** the pickers' cards name a look in a word or two; the full name is its tooltip */
const SHORT: Record<string, string> = {
    band: "Thick band",
    ring: "Black and white ring",
    brackets: "Corner brackets",
    underline: "Underline",
    dim: "Dim",
    spotlight: "Spotlight",
    edge: "Screen edge",
    pointer: "By the pointer",
    orb: "Orb",
    aurora: "Aurora",
    sonar: "Sonar",
    frame: "Frame",
};
const SHORT_NONE = new Set<Key>([
    "hlOutline",
    "mmOutline",
    "hlBackdrop",
    "mmBackdrop",
    "offscreenCue",
]);
function shortName(k: Key, v: string, full: string, lang: PanelLang): string {
    if (OWN_CHOICES[k]) return full;
    const ja = lang === "ja";
    if (v === "none" && SHORT_NONE.has(k)) return ja ? SHORT_JA.none : "None";
    if (k === "clickFx" && v === "edge") return PANEL_TEXT[lang].edgeGlow;
    return (ja ? SHORT_JA[v] : SHORT[v]) ?? full;
}

/** a few short choices in a row */
const SEGMENTS = new Set<Key>([
    "chatLanguage",
    "chatFontSize",
    "motion",
    "minimap",
]);
/** numbers that are sizes, distances, times or rates: a slider with its value */
const SLIDERS = new Set<NumSettingKey>([
    "chatTextScale",
    "ringWidth",
    "cueSize",
    "cueRadius",
    "minimapMarkerSize",
    "motionMs",
    "fxSize",
    "fxSoftness",
    "fxEdgeWidth",
    "fxRings",
    "liveSpeed",
]);
/** colours offered for the highlight; any other through the colour picker */
const HL_SWATCHES = ["#ffef26", "#00e5ff", "#ff4fd8", "#36f26b", "#ff8a00"];
const TRAIL_SWATCHES: Record<string, string> = {
    orange: "#ff8a00",
    lime: "#a3e635",
};

const CATALOGUE_LABELS: Record<(typeof CATALOGUE_KEYS)[number], string> = {
    aiModel: "Model",
    ttsModel: "Read-aloud model",
    ttsVoice: "Read-aloud voice",
    sttModel: "Speech-to-text model (server)",
    liveModel: "Live model",
    liveVoice: "Live voice",
};

/** a setting's name in the panel's language, and its unit when it has one */
function nameOf(key: Key, lang: PanelLang): { name: string; unit?: string } {
    const own = OWN_SETTINGS[key];
    if (own) return { name: own.label[lang] };
    const raw =
        (lang === "ja" ? NAMES_JA[key] : undefined) ??
        (TOGGLE_LABELS as Record<string, string>)[key] ??
        (ENUM_CHOICES as Record<string, { label: string }>)[key]?.label ??
        (NUMBER_KNOBS as Record<string, { label: string }>)[key]?.label ??
        (key === "aiReasoning" ? "Reasoning" : undefined) ??
        (CATALOGUE_LABELS as Record<string, string>)[key] ??
        (key === "hlColor" ? "Colour" : key);
    const m = raw.match(/^(.*?)\s*\((px|%|ms|chars)\)$/);
    if (m) return { name: m[1], unit: m[2] === "chars" ? "" : m[2] };
    const pct = raw.match(/^(.*?)\s*\(%, (.*)\)$/);
    if (pct) return { name: `${pct[1]} (${pct[2]})`, unit: "%" };
    return { name: raw };
}

function changed(key: Key, s: Settings): boolean {
    const v = s[key];
    const d = defaultOf(key);
    return typeof v === "string" && typeof d === "string"
        ? v.toLowerCase() !== d.toLowerCase()
        : v !== d;
}

/** a setting's choices, in the panel's language where it has them */
function choicesOf(key: Key, lang: PanelLang): [string, string][] {
    const own = OWN_CHOICES[key];
    if (own) return Object.entries(own).map(([v, w]) => [v, w[lang]]);
    const ja = lang === "ja" ? CHOICES_JA[key] : undefined;
    const en: [string, string][] = Object.hasOwn(SELECT_CHOICES, key)
        ? SELECT_CHOICES[key as SelectKnobKey].map((c) => [
              String(c.value),
              c.label,
          ])
        : Object.entries(ENUM_CHOICES[key as EnumKey]?.choices ?? {});
    return en.map(([v, label]) => [v, ja?.[v] ?? label]);
}

/** writes one setting; another provider has other models and voices */
function write(key: Key, raw: unknown) {
    const value = clampSetting(key, raw);
    // only a provider that changes takes its models and voices with it: resetting a
    // tab writes every key again, and must not clear another tab's choices
    const changes = useSettings.getState()[key] !== value;
    updateSetting(key, value as never);
    if (!changes) return;
    if (key === "aiProvider") updateSetting("aiModel", "");
    if (key === "sttEngine") updateSetting("sttModel", "");
    if (key === "ttsProvider") {
        updateSetting("ttsModel", "");
        updateSetting("ttsVoice", "");
    }
    if (key === "liveProvider" || key === "aiProvider") {
        updateSetting("liveModel", "");
        updateSetting("liveVoice", "");
    }
}

/* ── thumbnails: each choice drawn by the feature's own code, small ─────────── */

/** a stage of real px, scaled down to its thumbnail: what is on it is drawn at the
 *  size the page draws it, by the code that draws it there */
function Stage({
    w,
    h,
    paint,
    page = true,
    children,
}: {
    w: number;
    h: number;
    paint?: (layer: HTMLDivElement) => void;
    /** a sketch of page text under it */
    page?: boolean;
    children?: ReactNode;
}) {
    const frame = useRef<HTMLSpanElement>(null);
    const stage = useRef<HTMLDivElement>(null);
    const layer = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
        const f = frame.current;
        const st = stage.current;
        if (!f || !st) return;
        const scaleToFrame = () => {
            st.style.scale = String(f.clientWidth / w);
        };
        scaleToFrame();
        const ro = new ResizeObserver(scaleToFrame);
        ro.observe(f);
        return () => ro.disconnect();
    }, [w]);
    // repainted on every render: the look follows every setting at once
    useLayoutEffect(() => {
        if (layer.current) paint?.(layer.current);
    });
    return (
        <span
            ref={frame}
            className="s-th"
            aria-hidden="true"
            style={{ aspectRatio: `${w} / ${h}` }}
        >
            <span
                ref={stage}
                className="s-stage"
                style={{ width: w, height: h }}
            >
                {page && (
                    <>
                        <span
                            className="s-line"
                            style={{ top: "9%", width: "80%" }}
                        />
                        <span
                            className="s-line"
                            style={{ top: "80%", width: "64%" }}
                        />
                    </>
                )}
                {children}
                <div ref={layer} className="s-paint" />
            </span>
        </span>
    );
}

/** a thumbnail's stage, px: a close crop round the sample source, so what is drawn
 *  at the page's size reads at a thumbnail's (arrows and click feedback need room) */
const TIGHT = { w: 130, h: 52 };
const ROOMY = { w: 170, h: 68 };
/** the sample source, centred on a stage */
const wordOn = (st: { w: number; h: number }) => ({
    left: (st.w - 94) / 2,
    top: (st.h - 22) / 2,
    width: 94,
    height: 22,
});

/** a highlight in `look` round the sample source, backdrop and all, as the page draws it */
function paintHighlight(
    layer: HTMLDivElement,
    look: HighlightLook,
    w: number,
    h: number,
    r: Rect,
    badge?: string,
    feather?: number,
) {
    layer.replaceChildren();
    if (look.backdrop !== "none") {
        const dim = document.createElement("div");
        dim.className = "s-dim";
        layer.appendChild(dim);
        paintBackdrop(dim, look.backdrop, [r], w, h, feather);
    }
    const box = document.createElement("div");
    box.className = "s-box";
    layer.appendChild(box);
    paintOutline(box, r, {
        look,
        badge,
        withBackdrop: look.backdrop !== "none",
    });
}

/** an off-screen arrow as the page draws it: centred at (x, y), aimed along `angle` */
function paintCue(
    layer: HTMLElement,
    s: Settings,
    x: number,
    y: number,
    angle: number,
    num: string,
) {
    const el = document.createElement("div");
    el.className = "s-cue";
    const size = s.cueSize;
    Object.assign(el.style, {
        left: `${x - size / 2}px`,
        top: `${y - size / 2}px`,
        width: `${size}px`,
        height: `${size}px`,
    });
    el.innerHTML = cueSvg(lookFrom(s).color, s.hlBadges ? num : "");
    aimCue(el, angle);
    layer.appendChild(el);
}

/** the system pointer, drawn: the pointer cue circles it */
function paintPointer(layer: HTMLElement, x: number, y: number) {
    const el = document.createElement("div");
    el.className = "s-cursor";
    Object.assign(el.style, { left: `${x}px`, top: `${y}px` });
    el.innerHTML =
        '<svg width="17" height="25" viewBox="0 0 17 25"><path d="M1.5 1.5v19l4.6-4.4 3 7 3.2-1.4-3-6.8h6.4z" fill="#fff" stroke="#000" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    layer.appendChild(el);
}

/** where a pointer cue sits for the pointer at (x, y), toward `angle`, kept on the stage */
function aroundPointer(
    s: Settings,
    x: number,
    y: number,
    angle: number,
    room: number,
) {
    const r = Math.min(s.cueRadius, room);
    return { x: x + r * Math.cos(angle), y: y + r * Math.sin(angle) };
}

/** the minimap's box, lens and markers, as the minimap draws them, on a sketch of a page */
function paintMap(
    layer: HTMLDivElement,
    look: HighlightLook,
    s: Settings,
    w: number,
    h: number,
) {
    layer.replaceChildren();
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    c.className = "s-map";
    c.style.display = "block";
    layer.appendChild(c);
    const g = c.getContext("2d");
    if (!g) return;
    g.fillStyle = "#fff";
    g.fillRect(0, 0, w, h);
    g.fillStyle = MAP_INK.text;
    for (let y = 8; y < h - 6; y += 12)
        g.fillRect(10, y, w * (y % 36 === 8 ? 0.5 : 0.8), 6);
    g.fillStyle = MAP_INK.media;
    g.fillRect(w * 0.62, h * 0.55, w * 0.3, h * 0.35);
    const min = s.minimapMarkerSize;
    const tw = w * 0.3;
    const th = 8;
    paintMapTargets(
        g,
        [
            {
                x: w * 0.3 + tw / 2 - Math.max(tw, min) / 2,
                y: h * 0.4 + th / 2 - Math.max(th, min) / 2,
                w: Math.max(tw, min),
                h: Math.max(th, min),
                n: "1",
            },
        ],
        look,
    );
}

function Thumb({ k, v, s, T }: { k: Key; v: string; s: Settings; T: Text }) {
    if (k === "chatStyle")
        return (
            // the chat at its real width at Normal size (24.3em of 14px), so its
            // header lays out as it does on the page
            <Stage w={340} h={260} page={false}>
                <ChatSpecimen
                    s={{
                        ...s,
                        chatStyle: v as Settings["chatStyle"],
                        chatFontSize: 14,
                    }}
                    T={T}
                />
            </Stage>
        );
    if (k === "hlOutline" || k === "hlBackdrop") {
        const look = {
            ...lookFrom(s),
            [k === "hlOutline" ? "outline" : "backdrop"]: v,
        } as HighlightLook;
        const word = wordOn(TIGHT);
        return (
            <Stage
                w={TIGHT.w}
                h={TIGHT.h}
                paint={(l) => paintHighlight(l, look, TIGHT.w, TIGHT.h, word)}
            >
                <span className="s-word" style={word}>
                    9:30–17:00
                </span>
            </Stage>
        );
    }
    if (k === "mmOutline" || k === "mmBackdrop") {
        const look = minimapLook({
            ...s,
            mmFollowHighlight: false,
            [k]: v,
        } as Settings);
        return (
            <Stage
                w={ROOMY.w}
                h={ROOMY.h}
                page={false}
                paint={(l) => paintMap(l, look, s, ROOMY.w, ROOMY.h)}
            />
        );
    }
    if (k === "offscreenCue") {
        const { w, h } = ROOMY;
        return (
            <Stage
                w={w}
                h={h}
                paint={(l) => {
                    l.replaceChildren();
                    if (v === "edge")
                        paintCue(l, s, w - 8 - s.cueSize / 2, h / 2, 0, "2");
                    else if (v === "pointer") {
                        const a = -Math.PI / 9;
                        const p = aroundPointer(s, 40, 30, a, 44);
                        paintPointer(l, 40, 30);
                        paintCue(l, s, p.x, p.y, a, "2");
                    }
                }}
            />
        );
    }
    if (k === "clickFx") {
        const word = wordOn(ROOMY);
        return (
            <Stage
                w={ROOMY.w}
                h={ROOMY.h}
                paint={(l) =>
                    fxStill(
                        l,
                        v as Settings["clickFx"],
                        { x: ROOMY.w / 2, y: ROOMY.h / 2 },
                        word,
                    )
                }
            >
                <span className="s-word" style={word}>
                    9:30–17:00
                </span>
            </Stage>
        );
    }
    return null;
}

/* ── controls ────────────────────────────────────────────────────────────── */

/** the label above or beside a control, with the "changed" mark */
function Field({
    k,
    s,
    lang,
    id,
    block,
    note,
    children,
}: {
    k: Key;
    s: Settings;
    lang: PanelLang;
    id: string;
    block?: boolean;
    note?: string;
    children: ReactNode;
}) {
    const T = PANEL_TEXT[lang];
    const { name } = nameOf(k, lang);
    const hint = OWN_SETTINGS[k]?.hint?.[lang];
    return (
        <div
            className={`s-row${block ? " block" : ""}`}
            data-changed={changed(k, s) || undefined}
            title={changed(k, s) ? T.changed : undefined}
        >
            <label className="s-label" htmlFor={id} id={`${id}-l`}>
                <span className="s-name">
                    {name}
                    {/* seen as a bar beside the row, which moves nothing */}
                    {changed(k, s) && (
                        <span className="s-sr">, {T.changed}</span>
                    )}
                </span>
                {hint && <small>{hint}</small>}
                {note && <small>{note}</small>}
            </label>
            {children}
        </div>
    );
}

/** a row of radio buttons with one tab stop and arrow keys, as a radio group should */
function Radios({
    labelledBy,
    value,
    options,
    onPick,
    className,
    render,
    id,
    optionClass,
    optionStyle,
    optionTitle,
}: {
    labelledBy: string;
    value: string;
    options: string[];
    onPick: (v: string) => void;
    className: string;
    render: (v: string, on: boolean) => ReactNode;
    id: string;
    optionClass?: string;
    optionStyle?: (v: string) => React.CSSProperties;
    optionTitle?: (v: string) => string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const move = (e: ReactKeyboardEvent) => {
        const step =
            e.key === "ArrowRight" || e.key === "ArrowDown"
                ? 1
                : e.key === "ArrowLeft" || e.key === "ArrowUp"
                  ? -1
                  : 0;
        if (!step) return;
        e.preventDefault();
        const i = Math.max(0, options.indexOf(value));
        const next = options[(i + step + options.length) % options.length];
        onPick(next);
        requestAnimationFrame(() =>
            ref.current
                ?.querySelector<HTMLElement>(`[data-v="${CSS.escape(next)}"]`)
                ?.focus(),
        );
    };
    return (
        <div
            ref={ref}
            id={id}
            className={className}
            role="radiogroup"
            aria-labelledby={labelledBy}
            onKeyDown={move}
        >
            {options.map((v) => {
                const on = v === value;
                return (
                    // biome-ignore lint/a11y/useSemanticElements: a styled radio card; role and aria-checked carry the semantics
                    <button
                        key={v}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        tabIndex={
                            on || (!options.includes(value) && v === options[0])
                                ? 0
                                : -1
                        }
                        data-v={v}
                        className={optionClass}
                        style={optionStyle?.(v)}
                        title={optionTitle?.(v)}
                        onClick={() => onPick(v)}
                    >
                        {render(v, on)}
                    </button>
                );
            })}
        </div>
    );
}

function NumberField({
    k,
    value,
    id,
    label,
}: {
    k: NumSettingKey;
    value: number;
    id?: string;
    label?: string;
}) {
    const knob = NUMBER_KNOBS[k];
    const shown = clampSetting(k, value);
    // committed on blur/Enter so typing "160" into a field whose min is 20 is not
    // clamped mid-keystroke; the key remounts it when the store changes elsewhere
    const commit = (el: HTMLInputElement) => {
        const v = clampSetting(k, el.valueAsNumber);
        el.value = String(v);
        updateSetting(k, v);
    };
    return (
        <input
            key={shown}
            id={id}
            className="s-num"
            type="number"
            aria-label={label}
            min={knob.min}
            max={knob.max}
            step={knob.step}
            defaultValue={shown}
            onBlur={(e) => commit(e.currentTarget)}
            onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
            }}
        />
    );
}

/** model and voice choices come from the backend's catalogue (/api/ai) */
function CatalogueSelect({
    k,
    s,
    id,
    lang,
}: {
    k: (typeof CATALOGUE_KEYS)[number] | "aiReasoning";
    s: Settings;
    id: string;
    lang: PanelLang;
}) {
    const T = PANEL_TEXT[lang];
    const [cat, setCat] = useState<AiCatalogue | null | undefined>(undefined);
    useEffect(() => {
        let live = true;
        aiCatalogue().then((c) => live && setCat(c));
        return () => {
            live = false;
        };
    }, []);
    const provider = s.aiProvider === "auto" ? cat?.default : s.aiProvider;
    const entry = provider ? cat?.providers[provider] : undefined;
    // the reasoning row: the levels of the model chosen, or of the provider's default
    const modelId = s.aiModel || entry?.default;
    const levels = entry?.models.find((m) => m.id === modelId)?.reasoning ?? [];
    const level = (l: string) =>
        choicesOf("aiReasoning", lang).find(([v]) => v === l)?.[1] ?? l;
    if (k === "aiReasoning")
        return (
            <select
                id={id}
                value={
                    levels.includes(s.aiReasoning) ? s.aiReasoning : "default"
                }
                disabled={!cat || !levels.length}
                onChange={(e) => write("aiReasoning", e.currentTarget.value)}
            >
                <option value="default">
                    {cat && !levels.length ? T.notForModel : level("default")}
                </option>
                {levels.map((l) => (
                    <option key={l} value={l}>
                        {level(l)}
                    </option>
                ))}
            </select>
        );
    // the server's speech models: the engine's provider, else the one the server
    // transcribes with by default (not the first listed: the keys arrive sorted)
    const sttProvider =
        s.sttEngine === "openai" || s.sttEngine === "gemini"
            ? s.sttEngine
            : (cat?.sttDefault ??
              Object.keys(cat?.stt ?? {}).find((p) => cat?.stt[p]?.length));
    const sttOptions = (sttProvider && cat?.stt[sttProvider]) || [];
    // read aloud: its provider's models or voices (older backends: OpenAI's voices)
    const ttsProvider =
        s.ttsProvider !== "auto"
            ? s.ttsProvider
            : (cat?.ttsDefault ?? undefined);
    const tts = ttsProvider ? cat?.tts?.[ttsProvider] : undefined;
    const ttsOptions =
        (k === "ttsModel"
            ? tts?.models
            : (tts?.voices ?? (cat?.tts ? [] : cat?.voices))) ?? [];
    // Live: its provider's models or voices
    const live = cat ? cat.live?.[liveProvider(cat) ?? ""] : undefined;
    const liveOptions = (k === "liveModel" ? live?.models : live?.voices) ?? [];
    const options =
        k === "aiModel"
            ? (entry?.models ?? []).map((m) => m.id)
            : k === "sttModel"
              ? sttOptions
              : k === "liveModel" || k === "liveVoice"
                ? liveOptions
                : ttsOptions;
    const fallback =
        k === "aiModel"
            ? T.providerDefault(entry?.default)
            : k === "sttModel"
              ? T.byDefault(sttOptions[0])
              : k === "liveModel" || k === "liveVoice"
                ? cat && !liveOptions.length
                    ? T.liveNoKey
                    : T.byDefault(liveOptions[0])
                : // an older backend lists no read-aloud providers: its default
                  cat?.tts && !ttsOptions.length
                  ? T.readNoKey
                  : T.byDefault(
                        k === "ttsModel"
                            ? ttsOptions[0]
                            : ttsProvider === "openai" || !cat?.tts
                              ? (cat?.defaultVoice ?? "alloy")
                              : ttsOptions[0],
                    );
    const value = s[k];
    return (
        <select
            id={id}
            value={options.includes(value) ? value : ""}
            disabled={!cat}
            onChange={(e) => write(k, e.currentTarget.value)}
        >
            <option value="">{cat === null ? T.unreachable : fallback}</option>
            {options.map((o) => (
                <option key={o} value={o}>
                    {o}
                </option>
            ))}
        </select>
    );
}

/** one setting, drawn by what kind of value it holds */
function Row({
    k,
    s,
    lang,
    note,
}: {
    k: Key;
    s: Settings;
    lang: PanelLang;
    note?: string;
}) {
    const id = `ul-set-${k}`;
    const T = PANEL_TEXT[lang];
    const hl = clampSetting("hlColor", s.hlColor);
    const field = (children: ReactNode, block = false) => (
        <Field k={k} s={s} lang={lang} id={id} block={block} note={note}>
            {children}
        </Field>
    );
    if (Object.hasOwn(TOGGLE_LABELS, k)) {
        const key = k as BoolSettingKey;
        return field(
            <button
                id={id}
                type="button"
                role="switch"
                className="s-switch"
                aria-checked={s[key]}
                onClick={() => updateSetting(key, !s[key])}
            />,
        );
    }
    if (
        (CATALOGUE_KEYS as readonly string[]).includes(k) ||
        k === "aiReasoning"
    )
        return field(
            <CatalogueSelect
                k={k as (typeof CATALOGUE_KEYS)[number]}
                s={s}
                id={id}
                lang={lang}
            />,
        );
    if (k === "hlColor") {
        const preset = HL_SWATCHES.includes(hl.toLowerCase());
        return field(
            <div className="s-sw">
                <Radios
                    id={id}
                    labelledBy={`${id}-l`}
                    className="s-sw"
                    value={preset ? hl.toLowerCase() : ""}
                    options={HL_SWATCHES}
                    onPick={(v) => write("hlColor", v)}
                    optionClass="s-chip"
                    optionStyle={(v) => ({ background: v })}
                    render={(v, on) => (
                        <>
                            {on && <CheckIcon />}
                            <span className="s-sr">{v}</span>
                        </>
                    )}
                />
                <label className="s-custom">
                    <span
                        className="s-chip"
                        data-on={!preset}
                        style={preset ? undefined : { background: hl }}
                    >
                        {!preset && <CheckIcon />}
                        <input
                            type="color"
                            value={hl}
                            onChange={(e) =>
                                write("hlColor", e.currentTarget.value)
                            }
                        />
                    </span>
                    {T.custom}
                </label>
            </div>,
            true,
        );
    }
    if (k === "trailColor")
        return field(
            <Radios
                id={id}
                labelledBy={`${id}-l`}
                className="s-sw"
                value={s.trailColor}
                options={Object.keys(TRAIL_SWATCHES)}
                onPick={(v) => write("trailColor", v)}
                optionClass="s-chip"
                optionStyle={(v) => ({ background: TRAIL_SWATCHES[v] })}
                render={(v, on) => (
                    <>
                        {on && <CheckIcon />}
                        <span className="s-sr">
                            {choicesOf(k, lang).find(([c]) => c === v)?.[1]}
                        </span>
                    </>
                )}
            />,
        );
    if (PICKERS.has(k)) {
        const choices = choicesOf(k, lang);
        return field(
            <Radios
                id={id}
                labelledBy={`${id}-l`}
                className={k === "chatStyle" ? "s-pick big" : "s-pick"}
                optionClass="s-opt"
                optionTitle={(v) => choices.find(([c]) => c === v)?.[1] ?? v}
                value={String(s[k])}
                options={choices.map(([v]) => v)}
                onPick={(v) => write(k, v)}
                render={(v, on) => (
                    <>
                        <Thumb k={k} v={v} s={s} T={T} />
                        {shortName(
                            k,
                            v,
                            choices.find(([c]) => c === v)?.[1] ?? v,
                            lang,
                        )}
                        {on && (
                            <span className="s-tick" aria-hidden="true">
                                <CheckIcon />
                            </span>
                        )}
                    </>
                )}
            />,
            true,
        );
    }
    if (SEGMENTS.has(k)) {
        const choices = choicesOf(k, lang);
        return field(
            <Radios
                id={id}
                labelledBy={`${id}-l`}
                className="s-seg"
                value={String(s[k])}
                options={choices.map(([v]) => v)}
                onPick={(v) => write(k, k === "chatFontSize" ? Number(v) : v)}
                render={(v, on) => (
                    <>
                        {on && <CheckIcon />}
                        {choices.find(([c]) => c === v)?.[1]}
                    </>
                )}
            />,
            true,
        );
    }
    if (Object.hasOwn(ENUM_CHOICES, k) || Object.hasOwn(SELECT_CHOICES, k))
        return field(
            <select
                id={id}
                value={String(clampSetting(k, s[k]))}
                onChange={(e) =>
                    write(
                        k,
                        Object.hasOwn(SELECT_CHOICES, k)
                            ? Number(e.currentTarget.value)
                            : e.currentTarget.value,
                    )
                }
            >
                {choicesOf(k, lang).map(([v, label]) => (
                    <option key={v} value={v}>
                        {label}
                    </option>
                ))}
            </select>,
        );
    if (Object.hasOwn(NUMBER_KNOBS, k)) {
        const key = k as NumSettingKey;
        const knob = NUMBER_KNOBS[key];
        const { name, unit } = nameOf(key, lang);
        const v = clampSetting(key, s[key]);
        if (SLIDERS.has(key))
            return field(
                <div className="s-slide">
                    <input
                        id={id}
                        type="range"
                        min={knob.min}
                        max={knob.max}
                        step={knob.step}
                        value={v}
                        aria-valuetext={`${v}${unit ?? ""}`}
                        onChange={(e) =>
                            write(key, e.currentTarget.valueAsNumber)
                        }
                    />
                    <NumberField k={key} value={v} label={name} />
                    <span className="s-unit" aria-hidden="true">
                        {unit}
                    </span>
                </div>,
                true,
            );
        return field(<NumberField k={key} value={v} id={id} />);
    }
    return null;
}

/* ── previews ────────────────────────────────────────────────────────────── */

/**
 * The chat as these settings draw it: the open chat's own markup (ChatPopover.tsx),
 * header to input row, with a clicked place, a question and a cited answer rendered
 * by the chat's own citation code, in the chat's own stylesheet. Inert: it shows,
 * it does nothing. Keep it in step with ChatPopover's markup.
 */
function ChatSpecimen({ s, T }: { s: Settings; T: Text }) {
    useEffect(() => ensureChatStyles(), []);
    const C = chatText();
    const station = s.chatStyle === "station";
    const cite = renderCited(
        T.sampleCited,
        (id) => id === "n1",
        () => T.samplePlace,
        false,
        C.evidenceLabel,
        (n) => (station ? `U${n}` : String(n)),
        s.associateText && s.citePlacement === "inline",
        s.citePlacement,
    );
    const controls = (
        <div className="ulc-ctl">
            <button type="button" className="ulc-c ulc-all has-label">
                <HighlightIcon />
                <span>{C.highlightAll(1)}</span>
            </button>
        </div>
    );
    return (
        <div
            className="ul-chat s-chat"
            data-style={s.chatStyle}
            data-hc={s.highContrast ? "true" : "false"}
            inert
            style={
                {
                    "--ul-fs": `${s.chatFontSize}px`,
                    "--ul-text": s.chatTextScale / 100,
                    "--ul-hl": s.hlColor,
                } as React.CSSProperties
            }
        >
            <div className="ulc-hd">
                {station && <span className="ulc-roundel">U</span>}
                <div className="ulc-title">
                    <b>{station ? C.stationName : C.title}</b>
                    {station && <small>{C.otherName}</small>}
                </div>
                <button type="button" className="ulc-ib">
                    <NewChatIcon />
                </button>
                <button type="button" className="ulc-ib">
                    <MinimizeIcon />
                </button>
                <button type="button" className="ulc-ib" aria-pressed={false}>
                    <PinIcon />
                </button>
                <button type="button" className="ulc-ib">
                    <CloseIcon />
                </button>
            </div>
            <div className="ulc-log">
                <button type="button" className="ulc-where">
                    <PlaceIcon />
                    <b>P1</b>
                    <span>{T.samplePlace}</span>
                </button>
                <div className="ulc-msg ulc-me">{T.sampleQuestion}</div>
                <div className="ulc-turn">
                    <div className="ulc-msg ulc-bot">
                        <span
                            className="ulc-text"
                            // biome-ignore lint/security/noDangerouslySetInnerHtml: the chat's own renderer, which escapes the text first
                            dangerouslySetInnerHTML={{ __html: cite.html }}
                        />
                        <span className="ulc-read">
                            <button type="button" className="ulc-speak">
                                <PlayIcon />
                            </button>
                        </span>
                        {s.chatStyle === "assistant" && controls}
                    </div>
                    {s.chatStyle !== "assistant" && controls}
                </div>
            </div>
            {s.quickActions && (
                <div className="ulc-quick">
                    {[C.quickExplain, C.quickSummary, C.quickTranslate].map(
                        (label) => (
                            <button key={label} type="button">
                                {label}
                            </button>
                        ),
                    )}
                </div>
            )}
            <div className="ulc-in">
                {s.voiceInput && (
                    <button type="button" className="ulc-ib">
                        <MicIcon />
                    </button>
                )}
                {s.liveTalk && (
                    <button type="button" className="ulc-ib ulc-live">
                        <LiveIcon />
                    </button>
                )}
                <input readOnly placeholder={C.placeholder} />
                <button type="button" className="ulc-ib ulc-go" disabled>
                    <SendIcon />
                </button>
            </div>
        </div>
    );
}

/** the minimap preview's sketch: real px, scaled as the page's minimap is to the page */
const MAP = { w: 140, h: 180 };

/**
 * A page with a source on it, drawn by the page's own code in the current look:
 * outline, backdrop and badge, and an off-screen arrow (`look`), or the minimap in its
 * corner (`zoom`).
 */
function PageSpecimen({
    s,
    T,
    show,
}: {
    s: Settings;
    T: Text;
    show: "look" | "zoom";
}) {
    const page = useRef<HTMLDivElement>(null);
    const src = useRef<HTMLSpanElement>(null);
    const layer = useRef<HTMLDivElement>(null);
    const map = useRef<HTMLDivElement>(null);
    const [rect, setRect] = useState<Rect | null>(null);
    const [size, setSize] = useState({ w: 0, h: 0 });
    // laid out first: the outline goes where the words are
    useLayoutEffect(() => {
        const measure = () => {
            const p = page.current?.getBoundingClientRect();
            const r = src.current?.getBoundingClientRect();
            if (!p || !r) return;
            setSize({ w: p.width, h: p.height });
            setRect({
                left: r.left - p.left,
                top: r.top - p.top,
                width: r.width,
                height: r.height,
            });
        };
        measure();
        const ro = new ResizeObserver(measure);
        if (page.current) ro.observe(page.current);
        return () => ro.disconnect();
    }, []);
    useLayoutEffect(() => {
        const l = layer.current;
        if (!l || !rect) return;
        paintHighlight(l, lookFrom(s), size.w, size.h, rect, "1");
        if (show === "look" && s.offscreenCue === "edge")
            paintCue(
                l,
                s,
                size.w / 2,
                size.h - 8 - s.cueSize / 2,
                Math.PI / 2,
                "2",
            );
        if (show === "look" && s.offscreenCue === "pointer") {
            const x = size.w * 0.25;
            const y = 50;
            const a = Math.PI / 3;
            const p = aroundPointer(s, x, y, a, s.cueRadius);
            paintPointer(l, x, y);
            paintCue(l, s, p.x, p.y, a, "2");
        }
        if (map.current && show === "zoom" && s.minimap !== "off")
            paintMap(map.current, minimapLook(s), s, MAP.w, MAP.h);
    });
    return (
        <div
            ref={page}
            className={`s-page${show === "zoom" ? " with-map" : ""}`}
            style={
                show === "look" && s.offscreenCue === "pointer"
                    ? { minHeight: s.cueRadius * 0.87 + s.cueSize + 70 }
                    : undefined
            }
            role="img"
            aria-label={T.previewPage}
        >
            <span className="s-line" />
            <span className="s-line short" />
            <span ref={src} className="s-src">
                {T.sampleSource}
            </span>
            <span className="s-line" />
            <span className="s-line short" />
            <div ref={layer} className="s-paint" />
            {show === "zoom" && s.minimap !== "off" && (
                <div
                    className="s-minimap"
                    style={boxStyles as React.CSSProperties}
                >
                    <div ref={map} />
                    <span
                        className="s-lens"
                        style={
                            {
                                ...lensStyles,
                                left: 4,
                                top: 4 + MAP.h * 0.3,
                                width: MAP.w,
                                height: MAP.h * 0.36,
                            } as React.CSSProperties
                        }
                    />
                </div>
            )}
        </div>
    );
}

/** the click feedback, played for real on the preview's sample, then flown into this button */
function TryFeedback({ T }: { T: Text }) {
    const btn = useRef<HTMLButtonElement>(null);
    const running = useRef<{
        finish: ReturnType<typeof clickFeedback>;
        t: number;
    } | null>(null);
    const stop = () => {
        if (!running.current) return;
        window.clearTimeout(running.current.t);
        running.current.finish();
        running.current = null;
    };
    // a feedback still playing ends with the panel
    useEffect(
        () => () => {
            const r = running.current;
            if (!r) return;
            window.clearTimeout(r.t);
            r.finish();
        },
        [],
    );
    const play = () => {
        stop();
        // on the preview's sample source, as a click on it would show it (the edge
        // style lights the screen's edges, as it does on the page)
        const r = btn.current
            ?.closest(".s-preview")
            ?.querySelector(".s-src")
            ?.getBoundingClientRect();
        if (!r) return;
        const box = {
            left: r.left,
            top: r.top,
            width: r.width,
            height: r.height,
        };
        // drawn in the dialog's top layer, ending and all: on the page it would be
        // under the modal dialog and its scrim
        const finish = clickFeedback(
            r.left + r.width / 2,
            r.top + r.height / 2,
            box,
            btn.current?.closest("dialog") ?? undefined,
        );
        const t = window.setTimeout(() => {
            finish(() => btn.current?.getBoundingClientRect());
            running.current = null;
        }, 1600);
        running.current = { finish, t };
    };
    return (
        <button ref={btn} type="button" className="s-btn s-try" onClick={play}>
            <PlayIcon />
            {T.tryFx}
        </button>
    );
}

/* ── groups, tabs and the panel ──────────────────────────────────────────── */

function Group({
    g,
    s,
    lang,
    children,
}: {
    g: PanelGroup;
    s: Settings;
    lang: PanelLang;
    children?: ReactNode;
}) {
    const T = PANEL_TEXT[lang];
    const first = g.first.filter((k) => relevant(k, s));
    const more = g.more.filter((k) => relevant(k, s));
    const rows = (keys: Key[]) => (
        <div className="s-rows">
            {keys.map((k) => (
                <Row key={k} k={k} s={s} lang={lang} />
            ))}
        </div>
    );
    const title = T.groups[g.id] ?? g.id;
    if (!first.length)
        return (
            <section className="s-group">
                <details className="s-fold">
                    <summary>
                        <ChevronIcon />
                        {title}
                    </summary>
                    {rows(more)}
                    {children}
                </details>
            </section>
        );
    return (
        <section className="s-group" aria-label={title}>
            <h3>{title}</h3>
            {rows(first)}
            {children}
            {more.length > 0 && (
                <details>
                    <summary>
                        <ChevronIcon />
                        {T.more(more.length)}
                    </summary>
                    {rows(more)}
                </details>
            )}
        </section>
    );
}

function ZoomControls({ T }: { T: Text }) {
    const [scale, setScale] = useState(() => getZoom().scale);
    useEffect(() => onZoomChange(setScale), []);
    return (
        <div className="s-zoom">
            <button
                type="button"
                aria-label={T.zoomOut}
                onClick={() => setZoom(getTargetZoom() / 1.25)}
            >
                −
            </button>
            <button
                type="button"
                className="s-pct"
                aria-label={T.zoomReset}
                onClick={() => setZoom(1)}
            >
                {Math.round(scale * 100)}%
            </button>
            <button
                type="button"
                aria-label={T.zoomIn}
                onClick={() => setZoom(getTargetZoom() * 1.25)}
            >
                +
            </button>
        </div>
    );
}

/** every setting whose name or key holds the words, under its tab and group */
function SettingsSearch({
    s,
    lang,
    q,
    setQ,
}: {
    s: Settings;
    lang: PanelLang;
    q: string;
    setQ: (q: string) => void;
}) {
    const T = PANEL_TEXT[lang];
    const words = q.trim().toLowerCase();
    const hits = words
        ? PANEL_TABS.flatMap((t) => t.groups.map((g) => ({ t, g })))
              .map(({ t, g }) => ({
                  t,
                  g,
                  keys: [...g.first, ...g.more].filter((k) =>
                      `${nameOf(k, lang).name} ${k}`
                          .toLowerCase()
                          .includes(words),
                  ),
              }))
              .filter((h) => h.keys.length)
        : [];
    return (
        <>
            <div className="s-search">
                <SearchIcon />
                <input
                    type="search"
                    aria-label={T.search}
                    placeholder={T.search}
                    value={q}
                    onChange={(e) => setQ(e.currentTarget.value)}
                />
            </div>
            {words &&
                (hits.length ? (
                    hits.map(({ t, g, keys }) => (
                        <section key={`${t.id}-${g.id}`} className="s-group">
                            <h3>
                                {T.tabs[t.id]} · {T.groups[g.id] ?? g.id}
                            </h3>
                            <div className="s-rows">
                                {keys.map((k) => (
                                    <Row
                                        key={k}
                                        k={k}
                                        s={s}
                                        lang={lang}
                                        note={
                                            relevant(k, s)
                                                ? undefined
                                                : T.hiddenNow
                                        }
                                    />
                                ))}
                            </div>
                        </section>
                    ))
                ) : (
                    <p className="s-note" role="status">
                        {T.noMatch(q.trim())}
                    </p>
                ))}
        </>
    );
}

/** a settings file bigger than this is not one: every setting fits in a few KB */
const MAX_SETTINGS_FILE = 256 * 1024;

/** this tab back to its defaults; every setting to or from a file */
function Footer({ tab, T }: { tab: PanelTabId; T: Text }) {
    const [status, setStatus] = useState("");
    const picker = useRef<HTMLInputElement>(null);
    const reset = () => {
        for (const g of PANEL_TABS.find((t) => t.id === tab)?.groups ?? [])
            for (const k of [...g.first, ...g.more]) write(k, defaultOf(k));
        setStatus(T.resetDone(T.tabs[tab]));
    };
    const save = () => {
        const url = URL.createObjectURL(
            new Blob([exportSettings()], { type: "application/json" }),
        );
        const a = document.createElement("a");
        a.href = url;
        a.download = `unilens-settings-${new Date().toISOString().slice(0, 10)}.json`;
        document.documentElement.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setStatus(T.saved);
    };
    const load = async (file: File) => {
        if (file.size > MAX_SETTINGS_FILE) return setStatus(T.tooLarge);
        try {
            const { applied, ignored } = importSettings(await file.text());
            const names = `${ignored.slice(0, 3).join(", ")}${ignored.length > 3 ? "…" : ""}`;
            setStatus(
                T.loaded(applied) +
                    (ignored.length ? T.ignored(ignored.length, names) : ""),
            );
        } catch {
            setStatus(T.notSettings);
        }
    };
    return (
        <div className="s-foot">
            <button type="button" className="s-btn" onClick={reset}>
                <ResetIcon />
                {T.reset}
            </button>
            <button type="button" className="s-btn" onClick={save}>
                <SaveIcon />
                {T.save}
            </button>
            <button
                type="button"
                className="s-btn"
                onClick={() => picker.current?.click()}
            >
                <LoadIcon />
                {T.load}
            </button>
            <input
                ref={picker}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(e) => {
                    const file = e.currentTarget.files?.[0];
                    // cleared, so choosing the same file again imports it again
                    e.currentTarget.value = "";
                    if (file) void load(file);
                }}
            />
            <p className="s-status" role="status" aria-live="polite">
                {status}
            </p>
        </div>
    );
}

/** the tab shown last time the panel was open, for this page view */
let lastTab: PanelTabId = "general";
/** tabs with nothing to draw: AI models and capture settings change no look */
const NO_PREVIEW = new Set<PanelTabId>(["ai", "advanced"]);
/** whether the preview was shown last time, for this page view */
let lastPreview = true;

function Panel({ onClose }: { onClose: () => void }) {
    const s = useSettings();
    const lang: PanelLang = chatLang();
    const T = PANEL_TEXT[lang];
    const [tab, setTab] = useState<PanelTabId>(lastTab);
    /** words in the search: while there are any, only what they match shows */
    const [q, setQ] = useState("");
    const [preview, setPreview] = useState(lastPreview);
    const tabs = useRef<HTMLDivElement>(null);
    const dialog = useRef<HTMLDialogElement>(null);
    /** a press that began on the scrim: only its click closes (a slider dragged off the panel does not) */
    const pressOnScrim = useRef(false);
    const uid = useId();
    useEffect(() => {
        lastTab = tab;
    }, [tab]);
    useEffect(() => {
        lastPreview = preview;
    }, [preview]);
    // modal: centred over the page, in the top layer above any host layer, with the
    // keyboard kept inside; laid out first, so the tab below can take the focus
    useLayoutEffect(() => {
        if (!dialog.current?.open) dialog.current?.showModal();
    }, []);
    // the active tab takes the keyboard as the panel opens
    useEffect(() => {
        tabs.current
            ?.querySelector<HTMLElement>('[aria-selected="true"]')
            ?.focus();
    }, []);
    // Escape closes the settings before it touches the chat or the outlines
    useEffect(() => claimEscape(onClose), [onClose]);
    const onTabKey = (e: ReactKeyboardEvent) => {
        const ids = PANEL_TABS.map((t) => t.id);
        const i = ids.indexOf(tab);
        const to =
            e.key === "ArrowRight"
                ? ids[(i + 1) % ids.length]
                : e.key === "ArrowLeft"
                  ? ids[(i - 1 + ids.length) % ids.length]
                  : e.key === "Home"
                    ? ids[0]
                    : e.key === "End"
                      ? ids[ids.length - 1]
                      : null;
        if (!to) return;
        e.preventDefault();
        setTab(to);
        requestAnimationFrame(() =>
            tabs.current
                ?.querySelector<HTMLElement>(`[data-tab="${to}"]`)
                ?.focus(),
        );
    };
    const groups = PANEL_TABS.find((t) => t.id === tab)?.groups ?? [];
    const preset = activePreset();
    /** the preview beside the settings: on tabs with something to show */
    const shown = preview && !NO_PREVIEW.has(tab);
    return (
        <dialog
            ref={dialog}
            id="unilens-settings-panel"
            className="ul-set-dlg"
            aria-labelledby={`${uid}-t`}
            style={{ "--ul-fs": `${s.chatFontSize}px` } as React.CSSProperties}
            // Escape goes through the claims stack (highlight.ts), not the dialog's own
            onCancel={(e) => e.preventDefault()}
            // an IME's Escape ends the composition, never the panel
            onKeyDown={(e) => {
                if (e.key === "Escape" && e.nativeEvent.isComposing)
                    e.stopPropagation();
            }}
            onPointerDown={(e) => {
                pressOnScrim.current = e.target === e.currentTarget;
            }}
            onClick={(e) => {
                if (pressOnScrim.current && e.target === e.currentTarget)
                    onClose();
            }}
        >
            <div
                className="ul-set"
                lang={lang}
                data-wide={preview ? "true" : "false"}
                data-preview={shown ? "true" : "false"}
            >
                <div className="s-hd">
                    <h2 id={`${uid}-t`}>{T.title}</h2>
                    <label className="s-pvt" htmlFor={`${uid}-pv`}>
                        {T.preview}
                    </label>
                    <button
                        id={`${uid}-pv`}
                        type="button"
                        role="switch"
                        className="s-switch"
                        aria-checked={preview}
                        onClick={() => setPreview(!preview)}
                    />
                    <button
                        type="button"
                        className="s-key"
                        aria-label={T.close}
                        onClick={onClose}
                    >
                        <CloseIcon />
                    </button>
                </div>
                {preset && (
                    <p className="s-preset">{T.presetOn(preset.name)}</p>
                )}
                <div
                    ref={tabs}
                    className="s-tabs"
                    role="tablist"
                    aria-label={T.title}
                    onKeyDown={onTabKey}
                >
                    {PANEL_TABS.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            role="tab"
                            className="s-tab"
                            data-tab={t.id}
                            id={`${uid}-${t.id}`}
                            aria-selected={t.id === tab}
                            aria-controls={`${uid}-p`}
                            tabIndex={t.id === tab ? 0 : -1}
                            onClick={() => setTab(t.id)}
                        >
                            {T.tabs[t.id]}
                        </button>
                    ))}
                </div>
                <div className="s-main">
                    <div
                        className="s-body"
                        id={`${uid}-p`}
                        role="tabpanel"
                        aria-labelledby={`${uid}-${tab}`}
                    >
                        <SettingsSearch s={s} lang={lang} q={q} setQ={setQ} />
                        {!q.trim() &&
                            groups.map((g) => (
                                <Group key={g.id} g={g} s={s} lang={lang}>
                                    {g.id === "zoom" && s.zoom && (
                                        <ZoomControls T={T} />
                                    )}
                                </Group>
                            ))}
                        <Footer tab={tab} T={T} />
                    </div>
                    {shown && (tab === "general" || tab === "conversation") && (
                        <div
                            className="s-preview"
                            role="img"
                            aria-label={T.previewChat}
                        >
                            <ChatSpecimen s={s} T={T} />
                        </div>
                    )}
                    {shown && tab === "voice" && (
                        <div className="s-preview">
                            <ChatSpecimen s={s} T={T} />
                            <button
                                type="button"
                                className="s-btn s-try"
                                disabled={!s.sounds}
                                onClick={() => earcon("done")}
                            >
                                <PlayIcon />
                                {T.hearSound}
                            </button>
                        </div>
                    )}
                    {shown && (tab === "look" || tab === "zoom") && (
                        <div className="s-preview">
                            <PageSpecimen s={s} T={T} show={tab} />
                            {tab === "look" && <TryFeedback T={T} />}
                        </div>
                    )}
                </div>
            </div>
        </dialog>
    );
}

/** the facilitator's key (presets.ts) opens and closes the panel, gear or not */
let togglePanel: (() => void) | null = null;
export const toggleSettingsPanel = () => togglePanel?.();

function SettingsLauncher() {
    const s = useSettings();
    const [open, setOpen] = useState(false);
    const launcher = useRef<HTMLButtonElement>(null);
    /** what had focus when the facilitator's key opened the panel: focus goes back
     *  there, as it goes back to the gear when the gear opened it */
    const before = useRef<HTMLElement | null>(null);
    const T = PANEL_TEXT[chatLang()];
    const close = () => {
        setOpen(false);
        // once the dialog is gone: while it is open the page, the gear too, is inert
        requestAnimationFrame(() => {
            const back = before.current?.isConnected ? before.current : null;
            (back ?? launcher.current)?.focus();
        });
    };
    togglePanel = () => {
        if (open) return close();
        const had = document.activeElement;
        before.current =
            had instanceof HTMLElement && had !== document.body ? had : null;
        setOpen(true);
    };
    return (
        <>
            {s.settingsButton && (
                <button
                    ref={launcher}
                    type="button"
                    className="ul-set-launch"
                    data-hc={s.highContrast ? "true" : "false"}
                    style={
                        {
                            "--ul-fs": `${s.chatFontSize}px`,
                        } as React.CSSProperties
                    }
                    aria-label={T.open}
                    title={T.open}
                    aria-expanded={open}
                    aria-controls="unilens-settings-panel"
                    onClick={() => {
                        if (open) return close();
                        before.current = null;
                        setOpen(true);
                    }}
                >
                    <SettingsIcon />
                </button>
            )}
            {open && <Panel onClose={close} />}
        </>
    );
}

export function initSettings(backend = "") {
    setAiBackend(backend);
    ensurePanelStyles();
    const container = document.createElement("div");
    container.id = "unilens-settings-root";
    resetHostStyles(container);
    // documentElement: outside the zoom-transformed body, excluded from captures
    document.documentElement.appendChild(container);
    createRoot(container).render(<SettingsLauncher />);
}
