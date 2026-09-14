/**
 * Display adjustment panel — the contents of each tab (React components).
 *
 * Every display string comes through t(). Since t() looks up the current
 * language's dictionary on every call, each render always reflects the
 * latest language, as long as the component re-renders on a language change
 * (see useExternalSignal(onA11yLangChange) on each tab export).
 */
import { type CSSProperties, useState } from "react";
import {
    A11Y_LANG_NAMES,
    A11Y_LANGS,
    type A11yLang,
    getA11yLang,
    languageDescByLang,
    onA11yLangChange,
    pointerHaloSizeName,
    setA11yLang,
    t,
} from "./accessibilityI18n";
import {
    AUTO_MIN_PX_OPTIONS,
    AUTO_MODES,
    bodyExpandLevelLabels,
    focusEnhanceLevelLabels,
    CONTRAST_FILTER,
    DISPLAY_THEMES,
    fontScaleLabel,
    fontScalePercent,
    PREVIEW_FONT_PX,
    SATURATION_FILTER,
    SELECTION_LEVELS,
    // SPEECH_RATE_LEVELS,
    STANDARD_FONT_STACK,
    smallBoostLevelLabels,
    TEXT_ADJUST_LEVELS,
    THEME_SWATCH,
    UD_FONT_STACK,
} from "./accessibilityPanelOptions";
import { TextPlateCard } from "./accessibilityPanelTextPlate";
import {
    announce,
    Button,
    ButtonRow,
    Card,
    ChoiceGroup,
    Icon,
    type IconName,
    LevelControl,
    LinesPreview,
    Metrics,
    Note,
    Stepper,
    StripPreview,
    SwatchPreview,
    SwitchRow,
    TextPreview,
    ToggleGroup,
    useExternalSignal,
} from "./accessibilityPanelUI";
import {
    A11Y_PRESET_IDS,
    type A11yPresetId,
    isPresetActive,
    toggleA11yPreset,
} from "./accessibilityPresets";
import {
    type A11yFontFamily,
    type A11yFontSize,
    type A11yLetterSpacing,
    type A11yLineHeight,
    type A11ySettings,
    type DisplayContrast,
    type DisplaySaturation,
    type DisplayTheme,
    patchA11ySettings,
    TEXT_STROKE_PAIRS,
    TEXT_STROKE_STYLES,
    type TextAdjustLevel,
    type TextStrokeStyle,
} from "./accessibilityStore";
import {
    getAppliedTextScale,
    refreshAutoTextSize,
    runAutoTextAction,
    type TextAnalysis,
} from "./autoTextSize";
import { getLastBodyTextScan, scanBodyText } from "./bodyTextExpand";
import {
    isPointerHaloViewportPct,
    lastOnPointerHaloPx,
    normalizePointerHaloPx,
    POINTER_HALO_COLORS,
    POINTER_HALO_FIXED_PX,
    POINTER_HALO_OPACITIES,
    POINTER_HALO_RGB,
    POINTER_HALO_VIEWPORT_PCT,
    type PointerHaloColor,
    type PointerHaloOpacity,
    type PointerHaloPx,
    pointerHaloFillCss,
    pointerHaloOn,
    pointerHaloPreviewDiameter,
    rememberPointerHaloOnPx,
} from "./cursorHalo";
import {
    READING_GUIDE_PAIRS,
    READING_GUIDE_POSITIONS,
    READING_GUIDE_STYLES,
    type ReadingGuidePosition,
    type ReadingGuideStyle,
    readingGuideBoxShadow,
} from "./readingGuide";
import {
    applySelectionFontLevel,
    clearSelectionFontSize,
    getSelectionInfo,
    onSelectionChange,
    type SelectionFontLevel,
} from "./selectionTextSize";
// Read-aloud disabled — see accessibility-umd.ts init().
// import {
//   getSpeechState,
//   getSpeechTarget,
//   isSpeechSupported,
//   onSpeechChange,
//   pauseSpeech,
//   restartSpeechWithCurrentRate,
//   resumeSpeech,
//   speakSelection,
//   stopSpeech,
//   syncSpeechHighlight,
// } from './speakSelection'
// import { normalizeSpeechRateLevel } from './speechLevels'
import {
    type AutoTextMode,
    patchSettings,
    saveSettings,
    useSettings,
} from "./settings";
import { getLastSmallTextScan, scanSmallText } from "./smallTextBoost";

export type { PanelTab } from "./accessibilityPanelOptions";

const scaleText = () => getAppliedTextScale().toFixed(2);

function presetMeta(id: A11yPresetId): { label: string; hint: string } {
    switch (id) {
        case "lowVision":
            return {
                label: t().presetLowVision,
                hint: t().presetLowVisionHint,
            };
        case "colorVision":
            return {
                label: t().presetColorVision,
                hint: t().presetColorVisionHint,
            };
        case "mild":
            return { label: t().presetMild, hint: t().presetMildHint };
        case "senior":
            return { label: t().presetSenior, hint: t().presetSeniorHint };
        case "highContrast":
            return {
                label: t().presetHighContrast,
                hint: t().presetHighContrastHint,
            };
        case "focus":
            return { label: t().presetFocus, hint: t().presetFocusHint };
    }
}

// ── Visual ─────────────────────────────────────────────────────────────────

/** One-tap, per-use-case presets. Placed before the individual settings. 6 items, so 2 columns. */
function PresetsCard() {
    return (
        <Card title={t().presetsTitle} iconName="preset">
            <fieldset className="unilens-a11y-group">
                <legend className="unilens-a11y-group-label">
                    {t().presetsGroup}
                </legend>
                <div
                    className="unilens-a11y-choices"
                    style={{ "--unilens-a11y-panel-cols": 2 } as CSSProperties}
                >
                    {A11Y_PRESET_IDS.map((id) => {
                        const { label, hint } = presetMeta(id);
                        const active = isPresetActive(id);
                        return (
                            <button
                                key={id}
                                type="button"
                                className="unilens-a11y-choice"
                                aria-pressed={active}
                                aria-label={t().presetAria(label, hint)}
                                data-unilens-a11y-focus-key={`preset:${id}`}
                                onMouseDown={(e: { preventDefault(): void }) =>
                                    e.preventDefault()
                                }
                                onClick={() => {
                                    const next = toggleA11yPreset(id);
                                    announce(
                                        next === "on"
                                            ? t().presetAnnounce(label)
                                            : t().presetAnnounceOff(label),
                                    );
                                }}
                            >
                                {active && (
                                    <span
                                        className="unilens-a11y-choice-check"
                                        aria-hidden="true"
                                    >
                                        <Icon name="check" size={12} />
                                    </span>
                                )}
                                <span className="unilens-a11y-choice-label">
                                    {label}
                                </span>
                                {active && (
                                    <span className="unilens-a11y-choice-hint">
                                        {t().presetActive}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </fieldset>
        </Card>
    );
}

/**
 * Panel-language switcher. Placed right after the presets.
 *
 * For a visitor who can't read the panel's current language, being the
 * first thing they see matters far more than fitting neatly into a content
 * category — discoverability is prioritized over strict grouping. The
 * option labels are always written in their own language (日本語 / English)
 * so an unreadable label never leaves someone lost. For the same reason, the
 * description text always shows every supported language, not just the one
 * currently active (e.g. the English description is shown even while the
 * panel is in Japanese).
 */
function LanguageCard() {
    const current = getA11yLang();
    return (
        <Card title={t().languageTitle} iconName="globe">
            {languageDescByLang().map(({ lang, text }) => (
                <p key={lang} className="unilens-a11y-card-desc" lang={lang}>
                    {text}
                </p>
            ))}
            <ChoiceGroup<A11yLang>
                label={t().languageGroup}
                columns={2}
                focusPrefix="lang"
                current={current}
                options={A11Y_LANGS.map((value) => ({
                    value,
                    label: A11Y_LANG_NAMES[value],
                    ariaLabel: A11Y_LANG_NAMES[value],
                    lang: value,
                }))}
                onSelect={(value) => {
                    setA11yLang(value);
                    announce(t().languageAnnounce(A11Y_LANG_NAMES[value]));
                }}
            />
        </Card>
    );
}

type CueKey = Extract<
    keyof A11ySettings,
    | "linkUnderline"
    | "linkBackground"
    | "linkBorder"
    | "imageBorder"
    | "elementHighlight"
    | "reduceMotion"
    | "focusCursor"
>;

interface CueItem {
    key: CueKey;
    label: string;
    ariaLabel: string;
    iconName: IconName;
    checked: boolean;
    focusKey: string;
    on: string;
    off: string;
}

/** Link underline, pointer halo, focus cursor, and reading guide. Independent toggles — press again to turn off. */
function CuesCard() {
    const s = useSettings();
    const toOptions = (cues: CueItem[]) =>
        cues.map((cue) => ({
            value: cue.key,
            label: cue.label,
            ariaLabel: cue.ariaLabel,
            iconName: cue.iconName,
            checked: cue.checked,
            focusKey: cue.focusKey,
        }));
    const toggle = (cues: CueItem[]) => (value: string, next: boolean) => {
        const cue = cues.find((item) => item.key === value);
        if (!cue) return;
        patchA11ySettings({ [cue.key]: next });
        announce(next ? cue.on : cue.off);
    };

    const emphasis: CueItem[] = [
        {
            key: "linkUnderline",
            label: t().linkUnderline,
            ariaLabel: t().linkUnderlineSwitch,
            iconName: "underline",
            checked: s.linkUnderline,
            focusKey: "link-underline",
            on: t().linkUnderlineOn,
            off: t().linkUnderlineOff,
        },
        {
            key: "linkBackground",
            label: t().linkBackground,
            ariaLabel: t().linkBackgroundSwitch,
            iconName: "fill",
            checked: s.linkBackground,
            focusKey: "link-background",
            on: t().linkBackgroundOn,
            off: t().linkBackgroundOff,
        },
        {
            key: "linkBorder",
            label: t().linkBorder,
            ariaLabel: t().linkBorderSwitch,
            iconName: "frame",
            checked: s.linkBorder,
            focusKey: "link-border",
            on: t().linkBorderOn,
            off: t().linkBorderOff,
        },
        {
            key: "imageBorder",
            label: t().imageBorder,
            ariaLabel: t().imageBorderSwitch,
            iconName: "image",
            checked: s.imageBorder,
            focusKey: "image-border",
            on: t().imageBorderOn,
            off: t().imageBorderOff,
        },
        {
            key: "elementHighlight",
            label: t().elementHighlight,
            ariaLabel: t().elementHighlightSwitch,
            iconName: "selection",
            checked: s.elementHighlight,
            focusKey: "element-highlight",
            on: t().elementHighlightOn,
            off: t().elementHighlightOff,
        },
    ];
    const visibility: CueItem[] = [
        {
            key: "focusCursor",
            label: t().focusCursor,
            ariaLabel: t().focusCursorSwitch,
            iconName: "focusCursor",
            checked: s.focusCursor,
            focusKey: "focus-cursor",
            on: t().focusCursorOn,
            off: t().focusCursorOff,
        },
        {
            key: "reduceMotion",
            label: t().reduceMotion,
            ariaLabel: t().reduceMotionSwitch,
            iconName: "pause",
            checked: s.reduceMotion,
            focusKey: "reduce-motion",
            on: t().reduceMotionOn,
            off: t().reduceMotionOff,
        },
    ];
    const haloPx = s.pointerHaloPx;
    const haloOn = pointerHaloOn(haloPx);
    const haloSize = pointerHaloSizeName(haloPx);
    const togglePointer = () => {
        if (haloOn) {
            rememberPointerHaloOnPx(haloPx);
            patchA11ySettings({ pointerHaloPx: 0 });
            announce(t().pointerHaloOff);
            return;
        }
        patchA11ySettings({ pointerHaloPx: lastOnPointerHaloPx() });
        announce(t().pointerHaloOn);
    };
    const visibilityOpts = toOptions(visibility);
    const focusCursorOpt = visibilityOpts[0];
    const reduceMotionOpt = visibilityOpts[1];
    if (!focusCursorOpt || !reduceMotionOpt) return null;

    return (
        <Card title={t().cuesTitle} iconName="link">
            <ToggleGroup
                label={t().cuesEmphasisGroup}
                columns={1}
                options={toOptions(emphasis)}
                onToggle={toggle(emphasis)}
            />
            <ToggleGroup
                label={t().cuesVisibilityGroup}
                columns={1}
                options={[
                    {
                        value: "pointerHaloPx",
                        label: t().pointerHalo,
                        ariaLabel: haloOn
                            ? t().adjPointerHalo(haloSize)
                            : t().pointerHaloSwitch,
                        iconName: "pointerHalo",
                        hint: haloOn ? haloSize : undefined,
                        checked: haloOn,
                        focusKey: "pointer-halo",
                        onActivate: togglePointer,
                        after: haloOn ? (
                            <PointerHaloOptions
                                px={haloPx}
                                color={s.pointerHaloColor}
                                opacity={s.pointerHaloOpacity}
                            />
                        ) : undefined,
                    },
                    focusCursorOpt,
                    {
                        value: "readingGuide",
                        label: t().readingGuide,
                        ariaLabel: s.readingGuide
                            ? t().readingGuidePositionAria(
                                  t().readingGuidePosition[
                                      s.readingGuidePosition
                                  ],
                              )
                            : t().readingGuideSwitch,
                        iconName: "readingGuide",
                        hint: s.readingGuide
                            ? t().readingGuidePosition[s.readingGuidePosition]
                            : undefined,
                        checked: s.readingGuide,
                        focusKey: "reading-guide",
                        onActivate: () => {
                            const next = !s.readingGuide;
                            patchA11ySettings({ readingGuide: next });
                            announce(
                                next ? t().readingGuideOn : t().readingGuideOff,
                            );
                        },
                        after: s.readingGuide ? (
                            <ReadingGuideOptions
                                guideStyle={s.readingGuideStyle}
                                guidePosition={s.readingGuidePosition}
                            />
                        ) : undefined,
                    },
                    reduceMotionOpt,
                ]}
                onToggle={toggle(visibility)}
            />
        </Card>
    );
}

function HaloPreview({
    diameter,
    color,
    opacity,
}: {
    diameter: number;
    color: PointerHaloColor;
    opacity: PointerHaloOpacity;
}) {
    if (diameter <= 0) return null;
    const visual = Math.max(10, Math.round((diameter / 40) * 22));
    const [r, g, b] = POINTER_HALO_RGB[color];
    return (
        <span
            aria-hidden="true"
            style={{
                width: visual,
                height: visual,
                borderRadius: "50%",
                background: pointerHaloFillCss(color, opacity),
                boxShadow: `0 0 0 1px rgba(0, 0, 0, 0.4), 0 0 6px rgba(${r}, ${g}, ${b}, 0.7)`,
                display: "block",
                margin: "0 auto 4px",
            }}
        />
    );
}

function PointerHaloOptions({
    px,
    color,
    opacity,
}: {
    px: PointerHaloPx;
    color: PointerHaloColor;
    opacity: PointerHaloOpacity;
}) {
    const previewPx = pointerHaloPreviewDiameter(px);
    const applySize = (value: string) => {
        const next = normalizePointerHaloPx(value);
        if (!pointerHaloOn(next)) return;
        rememberPointerHaloOnPx(next);
        patchA11ySettings({ pointerHaloPx: next });
        const name = pointerHaloSizeName(next);
        announce(
            isPointerHaloViewportPct(next)
                ? t().pointerHaloViewportAnnounce(name)
                : t().pointerHaloSizeAnnounce(name),
        );
    };
    return (
        <div className="unilens-a11y-pointer-halo-opts">
            <ChoiceGroup<string>
                label={t().pointerHaloGroup}
                columns={3}
                focusPrefix="pointerHalo"
                current={typeof px === "number" ? String(px) : ""}
                options={POINTER_HALO_FIXED_PX.map((value) => {
                    const label = pointerHaloSizeName(value);
                    return {
                        value: String(value),
                        label,
                        ariaLabel: t().pointerHaloSizeAria(label),
                        preview: () => (
                            <HaloPreview
                                diameter={pointerHaloPreviewDiameter(value)}
                                color={color}
                                opacity={opacity}
                            />
                        ),
                    };
                })}
                onSelect={applySize}
            />
            <ChoiceGroup<string>
                label={t().pointerHaloViewportGroup}
                columns={3}
                focusPrefix="pointerHaloViewport"
                current={typeof px === "string" ? px : ""}
                options={POINTER_HALO_VIEWPORT_PCT.map((value) => {
                    const label = pointerHaloSizeName(value);
                    return {
                        value,
                        label,
                        ariaLabel: t().pointerHaloViewportAria(label),
                        preview: () => (
                            <HaloPreview
                                diameter={pointerHaloPreviewDiameter(value)}
                                color={color}
                                opacity={opacity}
                            />
                        ),
                    };
                })}
                onSelect={applySize}
            />
            <ChoiceGroup<PointerHaloColor>
                label={t().pointerHaloColorGroup}
                columns={5}
                focusPrefix="pointerHaloColor"
                current={color}
                options={POINTER_HALO_COLORS.map((value) => {
                    const label = t().pointerHaloColor[value];
                    const [r, g, b] = POINTER_HALO_RGB[value];
                    return {
                        value,
                        label,
                        hideLabel: true,
                        ariaLabel: t().pointerHaloColorAria(label),
                        preview: () => (
                            <span
                                aria-hidden="true"
                                className="unilens-a11y-pointer-halo-swatch"
                                style={{ background: `rgb(${r}, ${g}, ${b})` }}
                            />
                        ),
                    };
                })}
                onSelect={(value) => {
                    patchA11ySettings({ pointerHaloColor: value });
                    announce(
                        t().pointerHaloColorAnnounce(
                            t().pointerHaloColor[value],
                        ),
                    );
                }}
            />
            <ChoiceGroup<PointerHaloOpacity>
                label={t().pointerHaloOpacityGroup}
                columns={3}
                focusPrefix="pointerHaloOpacity"
                current={opacity}
                options={POINTER_HALO_OPACITIES.map((value) => {
                    const label = t().pointerHaloOpacity[value];
                    return {
                        value,
                        label,
                        ariaLabel: t().pointerHaloOpacityAria(label),
                        preview: () => (
                            <HaloPreview
                                diameter={previewPx}
                                color={color}
                                opacity={value}
                            />
                        ),
                    };
                })}
                onSelect={(value) => {
                    patchA11ySettings({ pointerHaloOpacity: value });
                    announce(
                        t().pointerHaloOpacityAnnounce(
                            t().pointerHaloOpacity[value],
                        ),
                    );
                }}
            />
        </div>
    );
}

function ReadingGuideOptions({
    guideStyle,
    guidePosition,
}: {
    guideStyle: ReadingGuideStyle;
    guidePosition: ReadingGuidePosition;
}) {
    return (
        <div className="unilens-a11y-reading-guide-opts">
            <ChoiceGroup<ReadingGuidePosition>
                label={t().readingGuidePositionGroup}
                columns={3}
                focusPrefix="readingGuidePosition"
                current={guidePosition}
                options={READING_GUIDE_POSITIONS.map((value) => {
                    const label = t().readingGuidePosition[value];
                    return {
                        value,
                        label,
                        ariaLabel: t().readingGuidePositionAria(label),
                    };
                })}
                onSelect={(value) => {
                    patchA11ySettings({ readingGuidePosition: value });
                    announce(
                        t().readingGuidePositionAnnounce(
                            t().readingGuidePosition[value],
                        ),
                    );
                }}
            />
            <ChoiceGroup<ReadingGuideStyle>
                label={t().readingGuideColorGroup}
                columns={5}
                focusPrefix="readingGuideStyle"
                current={guideStyle}
                options={READING_GUIDE_STYLES.map((value) => {
                    const label = t().readingGuideColor[value];
                    const pair = READING_GUIDE_PAIRS[value];
                    return {
                        value,
                        label,
                        hideLabel: true,
                        ariaLabel: t().readingGuideColorAria(label),
                        preview: () => (
                            <span
                                aria-hidden="true"
                                className="unilens-a11y-reading-guide-swatch"
                                style={{
                                    background: pair.fill,
                                    boxShadow: readingGuideBoxShadow(pair.edge),
                                }}
                            />
                        ),
                    };
                })}
                onSelect={(value) => {
                    patchA11ySettings({ readingGuideStyle: value });
                    announce(
                        t().readingGuideColorAnnounce(
                            t().readingGuideColor[value],
                        ),
                    );
                }}
            />
        </div>
    );
}

export function VisualTab() {
    useExternalSignal(onA11yLangChange);

    return (
        <>
            <PresetsCard />
            <LanguageCard />
            <CuesCard />
        </>
    );
}

// ── Text & color ────────────────────────────────────────────────────────────

function ColorModeCard() {
    const s = useSettings();
    return (
        <Card title={t().colorModeTitle} iconName="palette">
            <ChoiceGroup<DisplayTheme>
                label={t().colorModeGroup}
                columns={2}
                focusPrefix="theme"
                current={s.theme}
                options={DISPLAY_THEMES.map((value) => ({
                    value,
                    label: t().theme[value],
                    ariaLabel: t().themeAria(t().theme[value]),
                    preview: () => (
                        <SwatchPreview
                            background={THEME_SWATCH[value][0]}
                            color={THEME_SWATCH[value][1]}
                            sample={t().previewSample}
                        />
                    ),
                }))}
                onSelect={(value) => {
                    patchA11ySettings({ theme: value });
                    announce(t().themeAnnounce(t().theme[value]));
                }}
            />
        </Card>
    );
}

function ToneCard() {
    const s = useSettings();
    return (
        <Card title={t().toneTitle} iconName="contrast">
            <ChoiceGroup<DisplaySaturation>
                label={t().saturationGroup}
                columns={5}
                focusPrefix="saturation"
                current={s.saturation}
                options={(
                    Object.keys(SATURATION_FILTER) as DisplaySaturation[]
                ).map((value) => ({
                    value,
                    label: t().saturation[value],
                    hint: `${Math.round(SATURATION_FILTER[value] * 100)}%`,
                    ariaLabel: t().saturationAria(t().saturation[value]),
                    preview: () => (
                        <StripPreview
                            filter={`saturate(${SATURATION_FILTER[value]})`}
                        />
                    ),
                }))}
                onSelect={(value) => {
                    patchA11ySettings({ saturation: value });
                    announce(t().saturationAnnounce(t().saturation[value]));
                }}
            />
            <ChoiceGroup<DisplayContrast>
                label={t().contrastGroup}
                columns={3}
                focusPrefix="contrast"
                current={s.contrast}
                options={(
                    Object.keys(CONTRAST_FILTER) as DisplayContrast[]
                ).map((value) => ({
                    value,
                    label: t().contrast[value],
                    hint: `${Math.round(CONTRAST_FILTER[value] * 100)}%`,
                    ariaLabel: t().contrastAria(t().contrast[value]),
                    preview: () => (
                        <StripPreview
                            filter={`contrast(${CONTRAST_FILTER[value]})`}
                        />
                    ),
                }))}
                onSelect={(value) => {
                    patchA11ySettings({ contrast: value });
                    announce(t().contrastAnnounce(t().contrast[value]));
                }}
            />
        </Card>
    );
}

function PageTextCard() {
    const s = useSettings();
    const sizes: A11yFontSize[] = ["standard", "large", "xlarge"];

    return (
        <Card title={t().pageTextTitle} iconName="type">
            <ChoiceGroup<A11yFontSize>
                label={t().fontSizeGroup}
                columns={3}
                focusPrefix="fontSize"
                current={s.fontSize}
                options={sizes.map((value, i) => {
                    const hint = fontScalePercent((i + 1) as 1 | 2 | 3);
                    return {
                        value,
                        label: t().fontSize[value],
                        hint,
                        ariaLabel: t().fontSizeAria(t().fontSize[value], hint),
                        preview: () => (
                            <TextPreview
                                sample="Aa"
                                style={{
                                    fontSize: `${PREVIEW_FONT_PX[i]}px`,
                                    fontWeight: 700,
                                }}
                            />
                        ),
                    };
                })}
                onSelect={(value) => {
                    patchA11ySettings({ fontSize: value });
                    announce(t().fontSizeAnnounce(t().fontSize[value]));
                }}
            />
            <ChoiceGroup<A11yFontFamily>
                label={t().typefaceGroup}
                columns={2}
                focusPrefix="fontFamily"
                current={s.fontFamily}
                options={[
                    {
                        value: "standard" as A11yFontFamily,
                        label: t().typefaceStandard,
                        ariaLabel: t().typefaceStandardAria,
                        preview: () => (
                            <TextPreview
                                sample={t().previewSample}
                                style={{
                                    fontSize: "17px",
                                    fontWeight: 700,
                                    fontFamily: STANDARD_FONT_STACK,
                                }}
                            />
                        ),
                    },
                    {
                        value: "ud" as A11yFontFamily,
                        label: t().typefaceUd,
                        ariaLabel: t().typefaceUdAria,
                        preview: () => (
                            <TextPreview
                                sample={t().previewSample}
                                style={{
                                    fontSize: "17px",
                                    fontWeight: 700,
                                    fontFamily: UD_FONT_STACK,
                                }}
                            />
                        ),
                    },
                ]}
                onSelect={(value) => {
                    patchA11ySettings({ fontFamily: value });
                    announce(
                        t().typefaceAnnounce(
                            value === "ud"
                                ? t().typefaceUd
                                : t().typefaceStandard,
                        ),
                    );
                }}
            />
            <ChoiceGroup<A11yLineHeight>
                label={t().lineHeightGroup}
                columns={2}
                focusPrefix="lineHeight"
                current={s.lineHeight}
                options={[
                    {
                        value: "standard" as A11yLineHeight,
                        label: t().lineHeightStandard,
                        ariaLabel: t().lineHeightAria(t().lineHeightStandard),
                        preview: () => <LinesPreview gap={3} />,
                    },
                    {
                        value: "wide" as A11yLineHeight,
                        label: t().lineHeightWide,
                        ariaLabel: t().lineHeightAria(t().lineHeightWide),
                        preview: () => <LinesPreview gap={9} />,
                    },
                ]}
                onSelect={(value) => {
                    patchA11ySettings({ lineHeight: value });
                    announce(
                        t().lineHeightAnnounce(
                            value === "wide"
                                ? t().lineHeightWide
                                : t().lineHeightStandard,
                        ),
                    );
                }}
            />
            <ChoiceGroup<A11yLetterSpacing>
                label={t().letterSpacingGroup}
                columns={2}
                focusPrefix="letterSpacing"
                current={s.letterSpacing}
                options={[
                    {
                        value: "standard" as A11yLetterSpacing,
                        label: t().letterSpacingStandard,
                        ariaLabel: t().letterSpacingAria(
                            t().letterSpacingStandard,
                        ),
                        preview: () => (
                            <TextPreview
                                sample={t().previewSample}
                                style={{
                                    fontSize: "16px",
                                    fontWeight: 700,
                                    letterSpacing: "0",
                                }}
                            />
                        ),
                    },
                    {
                        value: "wide" as A11yLetterSpacing,
                        label: t().letterSpacingWide,
                        ariaLabel: t().letterSpacingAria(t().letterSpacingWide),
                        preview: () => (
                            <TextPreview
                                sample={t().previewSample}
                                style={{
                                    fontSize: "16px",
                                    fontWeight: 700,
                                    letterSpacing: "0.12em",
                                }}
                            />
                        ),
                    },
                ]}
                onSelect={(value) => {
                    patchA11ySettings({ letterSpacing: value });
                    announce(
                        t().letterSpacingAnnounce(
                            value === "wide"
                                ? t().letterSpacingWide
                                : t().letterSpacingStandard,
                        ),
                    );
                }}
            />
        </Card>
    );
}

function TextStrokePreview({
    fill,
    edge,
    name,
}: {
    fill: string;
    edge: string;
    name: string;
}) {
    const saturation = useSettings((s) => s.saturation);
    const contrast = useSettings((s) => s.contrast);
    return (
        <span aria-hidden="true" className="unilens-a11y-text-stroke-option">
            <span
                className="unilens-a11y-text-stroke-preview"
                style={{
                    filter: `saturate(${SATURATION_FILTER[saturation]}) contrast(${CONTRAST_FILTER[contrast]})`,
                }}
            >
                <span className="unilens-a11y-text-stroke-chips">
                    <span
                        className="unilens-a11y-text-stroke-chip"
                        style={{ background: fill }}
                    />
                    <span
                        className="unilens-a11y-text-stroke-chip"
                        style={{ background: edge }}
                    />
                </span>
                <span
                    className="unilens-a11y-text-stroke-glyph"
                    style={{
                        color: fill,
                        WebkitTextFillColor: fill,
                        WebkitTextStroke: `0.12em ${edge}`,
                        paintOrder: "stroke fill",
                    }}
                >
                    {t().previewSample}
                </span>
            </span>
            <span className="unilens-a11y-text-stroke-name">{name}</span>
        </span>
    );
}

function TextStrokeOptions({ strokeStyle }: { strokeStyle: TextStrokeStyle }) {
    return (
        <div className="unilens-a11y-text-stroke-opts">
            <ChoiceGroup<TextStrokeStyle>
                label={t().textStrokeGroup}
                columns={3}
                focusPrefix="textStrokeStyle"
                current={strokeStyle}
                options={TEXT_STROKE_STYLES.map((value) => {
                    const label = t().textStrokeStyle[value];
                    const pair = TEXT_STROKE_PAIRS[value];
                    return {
                        value,
                        label,
                        hideLabel: true,
                        ariaLabel: t().textStrokeStyleAria(label),
                        preview: () => (
                            <TextStrokePreview
                                fill={pair.fill}
                                edge={pair.edge}
                                name={label}
                            />
                        ),
                    };
                })}
                onSelect={(value) => {
                    patchA11ySettings({ textStrokeStyle: value });
                    announce(
                        t().textStrokeStyleAnnounce(t().textStrokeStyle[value]),
                    );
                }}
            />
        </div>
    );
}

function TextStrokeCard() {
    const s = useSettings();
    const styleName = t().textStrokeStyle[s.textStrokeStyle];
    return (
        <Card title={t().textStrokeTitle} iconName="textStroke">
            <ToggleGroup
                label={t().textStrokeSwitch}
                columns={1}
                options={[
                    {
                        value: "textStroke",
                        label: t().textStrokeTitle,
                        ariaLabel: s.textStroke
                            ? t().textStrokeStyleAria(styleName)
                            : t().textStrokeSwitch,
                        iconName: "textStroke",
                        hint: s.textStroke ? styleName : undefined,
                        checked: s.textStroke,
                        focusKey: "text-stroke",
                        after: s.textStroke ? (
                            <TextStrokeOptions
                                strokeStyle={s.textStrokeStyle}
                            />
                        ) : undefined,
                    },
                ]}
                onToggle={(_value, next) => {
                    patchA11ySettings({ textStroke: next });
                    announce(next ? t().textStrokeOn : t().textStrokeOff);
                }}
            />
        </Card>
    );
}

function FocusEnhanceCard() {
    const level = useSettings((s) => s.focusEnhanceLevel);
    const labels = focusEnhanceLevelLabels();
    const [name] = labels[level];

    return (
        <Card
            title={t().focusEnhance}
            iconName="cursor"
            desc={t().focusEnhanceSwitch}
            badge={level > 0 ? name : undefined}
        >
            <LevelControl
                label={t().focusEnhanceGroup}
                focusPrefix="focusEnhanceLevel"
                current={level}
                options={TEXT_ADJUST_LEVELS.map((value) => ({
                    value,
                    label: labels[value][0],
                    ariaLabel:
                        value === 0
                            ? t().focusEnhanceAriaOff
                            : t().focusEnhanceAria(labels[value][0]),
                }))}
                onSelect={(value) => {
                    patchA11ySettings({
                        focusEnhanceLevel: value as TextAdjustLevel,
                    });
                    if (value === 0) announce(t().focusEnhanceOff);
                    else
                        announce(
                            t().focusEnhanceOn(
                                labels[value as TextAdjustLevel][0],
                            ),
                        );
                }}
            />
        </Card>
    );
}

function BodyExpandCard() {
    const [, setBump] = useState(0);
    const level = useSettings((s) => s.bodyTextExpandLevel);
    const labels = bodyExpandLevelLabels();
    const [name, hint] = labels[level];
    const scan = getLastBodyTextScan();

    return (
        <Card
            title={t().bodyExpandTitle}
            iconName="expand"
            badge={level > 0 ? `${name} ${hint}` : undefined}
        >
            <LevelControl
                label={t().bodyExpandGroup}
                focusPrefix="bodyLevel"
                current={level}
                options={TEXT_ADJUST_LEVELS.map((value) => ({
                    value,
                    label: labels[value][0],
                    hint: labels[value][1] || undefined,
                    ariaLabel:
                        value === 0
                            ? t().bodyExpandAriaOff
                            : t().bodyExpandAria(labels[value].join(" ")),
                }))}
                onSelect={(value) => {
                    patchA11ySettings({
                        bodyTextExpandLevel: value as TextAdjustLevel,
                    });
                    // The rescan triggered by the setting change is synchronous, so this count is already the final result.
                    if (value === 0) announce(t().bodyExpandAnnounceOff);
                    else
                        announce(
                            t().bodyExpandAnnounce(
                                labels[value as TextAdjustLevel][0],
                                getLastBodyTextScan().expanded,
                            ),
                        );
                }}
            />
            {level > 0 && (
                <>
                    <Note
                        text={t().bodyExpandNote(scan.expanded, scan.scanned)}
                        tone="info"
                        iconName="check"
                    />
                    <ButtonRow>
                        <Button
                            label={t().rescan}
                            iconName="refresh"
                            variant="secondary"
                            ariaLabel={t().rescanBodyAria}
                            focusKey="rescan-body"
                            onClick={() => {
                                const result = scanBodyText();
                                announce(
                                    t().rescanBodyResult(
                                        result.expanded,
                                        result.scanned,
                                    ),
                                );
                                setBump((n) => n + 1);
                            }}
                        />
                    </ButtonRow>
                </>
            )}
        </Card>
    );
}

function SmallBoostCard() {
    const [, setBump] = useState(0);
    const level = useSettings((s) => s.smallTextBoostLevel);
    const labels = smallBoostLevelLabels();
    const [name, hint] = labels[level];
    const scan = getLastSmallTextScan();

    return (
        <Card
            title={t().smallBoostTitle}
            iconName="boost"
            // The hint already reads as a floor (e.g. "16px+"), so just place it as-is.
            badge={level > 0 ? `${name} ${hint}` : undefined}
        >
            <LevelControl
                label={t().smallBoostGroup}
                focusPrefix="smallLevel"
                current={level}
                options={TEXT_ADJUST_LEVELS.map((value) => ({
                    value,
                    label: labels[value][0],
                    hint: labels[value][1] || undefined,
                    ariaLabel:
                        value === 0
                            ? t().smallBoostAriaOff
                            : t().smallBoostAria(labels[value].join(" ")),
                }))}
                onSelect={(value) => {
                    patchA11ySettings({
                        smallTextBoostLevel: value as TextAdjustLevel,
                    });
                    if (value === 0) announce(t().smallBoostAnnounceOff);
                    else
                        announce(
                            t().smallBoostAnnounce(
                                labels[value as TextAdjustLevel][0],
                                getLastSmallTextScan().boosted,
                            ),
                        );
                }}
            />
            {level > 0 && (
                <>
                    <Note
                        text={t().smallBoostNote(scan.boosted, scan.scanned)}
                        tone="info"
                        iconName="check"
                    />
                    <ButtonRow>
                        <Button
                            label={t().rescan}
                            iconName="refresh"
                            variant="secondary"
                            ariaLabel={t().rescanSmallAria}
                            focusKey="rescan-small"
                            onClick={() => {
                                const result = scanSmallText();
                                announce(
                                    t().rescanSmallResult(
                                        result.boosted,
                                        result.scanned,
                                    ),
                                );
                                setBump((n) => n + 1);
                            }}
                        />
                    </ButtonRow>
                </>
            )}
        </Card>
    );
}

export function TextTab() {
    useExternalSignal(onA11yLangChange);
    return (
        <>
            <PageTextCard />
            <ColorModeCard />
            <ToneCard />
        </>
    );
}

// ── Tools ──────────────────────────────────────────────────────────────────

function SelectionCard({
    lastMessage,
    setLastMessage,
}: {
    lastMessage: { text: string; ok: boolean } | null;
    setLastMessage: (v: { text: string; ok: boolean } | null) => void;
}) {
    const info = getSelectionInfo();
    const level = useSettings(
        (s) => s.selectionFontLevel,
    ) as SelectionFontLevel;

    const detail = info.hasSelection
        ? [
              t().selectionQuoted(info.text, info.charCount),
              info.appliedScale
                  ? `${Math.round(info.appliedScale * 100)}%`
                  : null,
              info.sticky ? t().selectionSticky : null,
          ]
              .filter(Boolean)
              .join(" · ")
        : null;

    return (
        <Card title={t().selectionTitle} iconName="selection">
            {info.hasSelection ? (
                <Note
                    text={detail as string}
                    tone="info"
                    iconName="selection"
                />
            ) : (
                <Note
                    text={t().selectionEmpty}
                    tone="neutral"
                    iconName="selection"
                />
            )}

            {/* With no range selected, pressing this would just fail — block it up front instead. */}
            <ChoiceGroup<string>
                label={t().selectionGroup}
                columns={3}
                focusPrefix="selection"
                current={String(level)}
                disabled={!info.hasSelection}
                options={SELECTION_LEVELS.map((value) => ({
                    value: String(value),
                    label: t().fontScale[value].label,
                    hint: fontScalePercent(value),
                    ariaLabel: t().selectionAria(fontScaleLabel(value)),
                    preview: () => (
                        <TextPreview
                            sample="Aa"
                            style={{
                                fontSize: `${PREVIEW_FONT_PX[value - 1]}px`,
                                fontWeight: 700,
                            }}
                        />
                    ),
                }))}
                onSelect={(value) => {
                    const result = applySelectionFontLevel(
                        Number(value) as SelectionFontLevel,
                    );
                    setLastMessage({ text: result.message, ok: result.ok });
                    announce(result.message);
                }}
            />

            <ButtonRow>
                <Button
                    label={t().selectionClear}
                    iconName="reset"
                    variant="quiet"
                    ariaLabel={t().selectionClearAria}
                    focusKey="selection-clear"
                    onClick={() => {
                        const message = clearSelectionFontSize().message;
                        setLastMessage({ text: message, ok: true });
                        announce(message);
                    }}
                />
            </ButtonRow>

            {lastMessage && (
                <Note
                    text={lastMessage.text}
                    tone={lastMessage.ok ? "ok" : "error"}
                />
            )}
        </Card>
    );
}

/* Read-aloud disabled — see accessibility-umd.ts init().
 *
 * The primary action button. Its role shifts between "speak / pause / resume"
 * depending on state.
 *
 * The focus-restoration key stays fixed even as the label changes, so focus
 * never jumps across a re-render. Losing focus the instant the button's
 * label changes would strand a keyboard-only user who just lost their
 * anchor point.
 *
function SpeakPrimaryButton({ state, hasTarget }: { state: ReturnType<typeof getSpeechState>; hasTarget: boolean }) {
  ...
}

function SpeakCard() {
  ...
}
*/

function AutoTextCard({
    lastAnalysis,
    setLastAnalysis,
}: {
    lastAnalysis: TextAnalysis | null;
    setLastAnalysis: (v: TextAnalysis | null) => void;
}) {
    const { autoTextSize, autoTextMode, autoTextMinPx } = useSettings();
    const enabled = autoTextSize && autoTextMode !== "off";
    const scale = getAppliedTextScale();

    // The stepper doesn't move focus, so without an announcement the change would go unnoticed.
    const bump = (action: "bumpUp" | "bumpDown") => {
        setLastAnalysis(runAutoTextAction(action));
        announce(t().autoScaleAnnounce(scaleText()));
    };

    return (
        <Card
            title={t().autoTitle}
            iconName="auto"
            badge={enabled ? `×${scale.toFixed(2)}` : undefined}
        >
            <SwitchRow
                label={t().autoSwitch}
                hint={enabled ? t().autoSwitchHintOn : t().autoSwitchHintOff}
                checked={enabled}
                focusKey="auto-enable"
                onChange={(checked) => {
                    if (checked) {
                        patchSettings({
                            autoTextSize: true,
                            autoTextMode:
                                autoTextMode === "off"
                                    ? "combined"
                                    : autoTextMode,
                        });
                    } else {
                        patchSettings({
                            autoTextSize: false,
                            autoTextMode: "off",
                        });
                    }
                    saveSettings();
                    setLastAnalysis(checked ? refreshAutoTextSize() : null);
                    announce(
                        checked
                            ? t().autoOnAnnounce(scaleText())
                            : t().autoOffAnnounce,
                    );
                }}
            />

            {enabled && (
                <>
                    <ChoiceGroup<Exclude<AutoTextMode, "off">>
                        label={t().autoModeGroup}
                        columns={3}
                        focusPrefix="autoMode"
                        // By the time we get here enabled === true, so 'off' can't occur.
                        current={autoTextMode as Exclude<AutoTextMode, "off">}
                        options={AUTO_MODES.map((value) => ({
                            value,
                            label: t().autoMode[value].label,
                            hint: t().autoMode[value].hint,
                            ariaLabel: t().autoModeAria(
                                t().autoMode[value].label,
                                t().autoMode[value].hint,
                            ),
                        }))}
                        onSelect={(value) => {
                            patchSettings({ autoTextMode: value });
                            saveSettings();
                            setLastAnalysis(refreshAutoTextSize());
                            announce(
                                t().autoModeAnnounce(
                                    t().autoMode[value].label,
                                    scaleText(),
                                ),
                            );
                        }}
                    />

                    <ChoiceGroup<string>
                        label={t().autoMinGroup}
                        columns={4}
                        focusPrefix="autoMin"
                        current={String(autoTextMinPx)}
                        options={AUTO_MIN_PX_OPTIONS.map((px) => ({
                            value: String(px),
                            label: `${px}px`,
                            ariaLabel: t().autoMinAria(px),
                        }))}
                        onSelect={(value) => {
                            patchSettings({ autoTextMinPx: Number(value) });
                            saveSettings();
                            setLastAnalysis(refreshAutoTextSize());
                            announce(
                                t().autoMinAnnounce(Number(value), scaleText()),
                            );
                        }}
                    />

                    <Stepper
                        label={t().autoStepGroup}
                        value={`×${scale.toFixed(2)}`}
                        decreaseLabel={t().autoStepDecrease}
                        increaseLabel={t().autoStepIncrease}
                        focusPrefix="auto-scale"
                        onDecrease={() => bump("bumpDown")}
                        onIncrease={() => bump("bumpUp")}
                    />

                    <ButtonRow>
                        <Button
                            label={t().analyze}
                            iconName="chart"
                            variant="primary"
                            ariaLabel={t().analyzeAria}
                            focusKey="auto-analyze"
                            onClick={() => {
                                const a = runAutoTextAction("analyze");
                                setLastAnalysis(a);
                                announce(
                                    a
                                        ? t().analyzeAnnounce(
                                              a.medianPx,
                                              Math.round(
                                                  a.smallTextRatio * 100,
                                              ),
                                              scaleText(),
                                          )
                                        : t().analyzeEmpty,
                                );
                            }}
                        />
                    </ButtonRow>

                    {lastAnalysis && (
                        <Metrics
                            rows={[
                                [
                                    t().metricSamples,
                                    t().metricSamplesValue(
                                        lastAnalysis.sampleCount,
                                    ),
                                ],
                                [
                                    t().metricMedian,
                                    `${lastAnalysis.medianPx}px`,
                                ],
                                [
                                    t().metricMinMax,
                                    `${lastAnalysis.minPx} / ${lastAnalysis.maxPx}px`,
                                ],
                                [
                                    t().metricSmallRatio,
                                    `${Math.round(lastAnalysis.smallTextRatio * 100)}%`,
                                ],
                                [t().metricScale, `×${scaleText()}`],
                            ]}
                        />
                    )}
                </>
            )}
        </Card>
    );
}

export interface ToolsTabProps {
    lastAnalysis: TextAnalysis | null;
    setLastAnalysis: (v: TextAnalysis | null) => void;
    lastSelectionMessage: { text: string; ok: boolean } | null;
    setLastSelectionMessage: (v: { text: string; ok: boolean } | null) => void;
}

export function ToolsTab({
    lastAnalysis,
    setLastAnalysis,
    lastSelectionMessage,
    setLastSelectionMessage,
}: ToolsTabProps) {
    useExternalSignal(onSelectionChange);
    useExternalSignal(onA11yLangChange);
    return (
        <>
            <FocusEnhanceCard />
            <TextPlateCard />
            <TextStrokeCard />
            <BodyExpandCard />
            <SmallBoostCard />
            <SelectionCard
                lastMessage={lastSelectionMessage}
                setLastMessage={setLastSelectionMessage}
            />
            {/* <SpeakCard /> */}
            <AutoTextCard
                lastAnalysis={lastAnalysis}
                setLastAnalysis={setLastAnalysis}
            />
        </>
    );
}
