/**
 * Display adjustment panel — the contents of each tab (React components).
 *
 * Every display string comes through t(). Since t() looks up the current
 * language's dictionary on every call, each render always reflects the
 * latest language, as long as the component re-renders on a language change
 * (see the useExternalSignal(onA11yLangChange) call in each tab below).
 */
import { type CSSProperties, useState } from "react";
import {
    A11Y_LANG_NAMES,
    A11Y_LANGS,
    type A11yLang,
    getA11yLang,
    languageDescByLang,
    onA11yLangChange,
    setA11yLang,
    t,
} from "./accessibilityI18n";
import {
    AUTO_MIN_PX_OPTIONS,
    AUTO_MODES,
    bodyExpandLevelLabels,
    CONTRAST_FILTER,
    DISPLAY_THEMES,
    fontScaleLabel,
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
import {
    announce,
    Button,
    ButtonRow,
    Card,
    ChoiceGroup,
    Icon,
    LevelControl,
    LinesPreview,
    Metrics,
    Note,
    Stepper,
    StripPreview,
    SwatchPreview,
    SwitchRow,
    TextPreview,
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
    a11ySettings,
    type DisplayContrast,
    type DisplaySaturation,
    type DisplayTheme,
    onA11yChange,
    patchA11ySettings,
    type TextAdjustLevel,
} from "./accessibilityStore";
import {
    getAppliedTextScale,
    refreshAutoTextSize,
    runAutoTextAction,
    type TextAnalysis,
} from "./autoTextSize";
import { getLastBodyTextScan, scanBodyText } from "./bodyTextExpand";
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
    onSettingsChange,
    saveSettings,
    settings,
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
        <Card title={t().presetsTitle} iconName="preset" desc={t().presetsDesc}>
            <fieldset className="unilens-a11y-group">
                <legend className="unilens-a11y-group-label">
                    {t().presetsGroup}
                </legend>
                <div
                    className="unilens-a11y-choices"
                    style={{ "--da-cols": 2 } as CSSProperties}
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
                                <span className="unilens-a11y-choice-hint">
                                    {active ? t().presetActive : hint}
                                </span>
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

/** Link underline and focus emphasis. Shared cues for color blindness and low vision. */
function CuesCard() {
    const s = a11ySettings;
    return (
        <Card title={t().cuesTitle} iconName="link" desc={t().cuesDesc}>
            <SwitchRow
                label={t().linkUnderlineSwitch}
                hint={
                    s.linkUnderline
                        ? t().linkUnderlineHintOn
                        : t().linkUnderlineHintOff
                }
                checked={s.linkUnderline}
                focusKey="link-underline"
                onChange={(checked) => {
                    patchA11ySettings({ linkUnderline: checked });
                    announce(
                        checked ? t().linkUnderlineOn : t().linkUnderlineOff,
                    );
                }}
            />
            <SwitchRow
                label={t().linkBackgroundSwitch}
                hint={
                    s.linkBackground
                        ? t().linkBackgroundHintOn
                        : t().linkBackgroundHintOff
                }
                checked={s.linkBackground}
                focusKey="link-background"
                onChange={(checked) => {
                    patchA11ySettings({ linkBackground: checked });
                    announce(
                        checked ? t().linkBackgroundOn : t().linkBackgroundOff,
                    );
                }}
            />
            <SwitchRow
                label={t().linkBorderSwitch}
                hint={
                    s.linkBorder ? t().linkBorderHintOn : t().linkBorderHintOff
                }
                checked={s.linkBorder}
                focusKey="link-border"
                onChange={(checked) => {
                    patchA11ySettings({ linkBorder: checked });
                    announce(checked ? t().linkBorderOn : t().linkBorderOff);
                }}
            />
            <SwitchRow
                label={t().imageBorderSwitch}
                hint={
                    s.imageBorder
                        ? t().imageBorderHintOn
                        : t().imageBorderHintOff
                }
                checked={s.imageBorder}
                focusKey="image-border"
                onChange={(checked) => {
                    patchA11ySettings({ imageBorder: checked });
                    announce(checked ? t().imageBorderOn : t().imageBorderOff);
                }}
            />
            <SwitchRow
                label={t().elementHighlightSwitch}
                hint={
                    s.elementHighlight
                        ? t().elementHighlightHintOn
                        : t().elementHighlightHintOff
                }
                checked={s.elementHighlight}
                focusKey="element-highlight"
                onChange={(checked) => {
                    patchA11ySettings({ elementHighlight: checked });
                    announce(
                        checked
                            ? t().elementHighlightOn
                            : t().elementHighlightOff,
                    );
                }}
            />
            <SwitchRow
                label={t().focusEnhanceSwitch}
                hint={
                    s.focusEnhance
                        ? t().focusEnhanceHintOn
                        : t().focusEnhanceHintOff
                }
                checked={s.focusEnhance}
                focusKey="focus-enhance"
                onChange={(checked) => {
                    patchA11ySettings({ focusEnhance: checked });
                    announce(
                        checked ? t().focusEnhanceOn : t().focusEnhanceOff,
                    );
                }}
            />
            <SwitchRow
                label={t().reduceMotionSwitch}
                hint={
                    s.reduceMotion
                        ? t().reduceMotionHintOn
                        : t().reduceMotionHintOff
                }
                checked={s.reduceMotion}
                focusKey="reduce-motion"
                onChange={(checked) => {
                    patchA11ySettings({ reduceMotion: checked });
                    announce(
                        checked ? t().reduceMotionOn : t().reduceMotionOff,
                    );
                }}
            />
        </Card>
    );
}

export function VisualTab() {
    useExternalSignal(onA11yChange);
    useExternalSignal(onSettingsChange);
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
    const s = a11ySettings;
    return (
        <Card
            title={t().colorModeTitle}
            iconName="palette"
            desc={t().colorModeDesc}
        >
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
    const s = a11ySettings;
    return (
        <Card title={t().toneTitle} iconName="contrast" desc={t().toneDesc}>
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
    const s = a11ySettings;
    const sizes: A11yFontSize[] = ["standard", "large", "xlarge"];
    const sizeHints = ["100%", "150%", "200%"];

    return (
        <Card title={t().pageTextTitle} iconName="type" desc={t().pageTextDesc}>
            <ChoiceGroup<A11yFontSize>
                label={t().fontSizeGroup}
                columns={3}
                focusPrefix="fontSize"
                current={s.fontSize}
                options={sizes.map((value, i) => ({
                    value,
                    label: t().fontSize[value],
                    hint: sizeHints[i],
                    ariaLabel: t().fontSizeAria(
                        t().fontSize[value],
                        sizeHints[i],
                    ),
                    preview: () => (
                        <TextPreview
                            sample="Aa"
                            style={{
                                fontSize: `${PREVIEW_FONT_PX[i]}px`,
                                fontWeight: 700,
                            }}
                        />
                    ),
                }))}
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
                        hint: t().typefaceUdHint,
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
                        hint: "1.6",
                        ariaLabel: t().lineHeightAria(t().lineHeightStandard),
                        preview: () => <LinesPreview gap={3} />,
                    },
                    {
                        value: "wide" as A11yLineHeight,
                        label: t().lineHeightWide,
                        hint: "2.0",
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
                        hint: "0",
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
                        hint: "0.12em",
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

function BodyExpandCard() {
    const [, setBump] = useState(0);
    const level = a11ySettings.bodyTextExpandLevel;
    const labels = bodyExpandLevelLabels();
    const [name, hint] = labels[level];
    const scan = getLastBodyTextScan();

    return (
        <Card
            title={t().bodyExpandTitle}
            iconName="expand"
            desc={t().bodyExpandDesc}
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
    const level = a11ySettings.smallTextBoostLevel;
    const labels = smallBoostLevelLabels();
    const [name, hint] = labels[level];
    const scan = getLastSmallTextScan();

    return (
        <Card
            title={t().smallBoostTitle}
            iconName="boost"
            desc={t().smallBoostDesc}
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
    useExternalSignal(onA11yChange);
    useExternalSignal(onA11yLangChange);
    return (
        <>
            <PageTextCard />
            <ColorModeCard />
            <ToneCard />
            <BodyExpandCard />
            <SmallBoostCard />
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
    const level = settings.selectionFontLevel as SelectionFontLevel;

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
        <Card
            title={t().selectionTitle}
            iconName="selection"
            desc={t().selectionDesc}
        >
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
                    hint: t().fontScale[value].hint,
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
    const enabled = settings.autoTextSize && settings.autoTextMode !== "off";
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
            desc={t().autoDesc}
            badge={enabled ? `×${scale.toFixed(2)}` : undefined}
        >
            <SwitchRow
                label={t().autoSwitch}
                hint={enabled ? t().autoSwitchHintOn : t().autoSwitchHintOff}
                checked={enabled}
                focusKey="auto-enable"
                onChange={(checked) => {
                    settings.autoTextSize = checked;
                    if (checked) {
                        if (settings.autoTextMode === "off")
                            settings.autoTextMode = "combined";
                    } else {
                        settings.autoTextMode = "off";
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
                        current={
                            settings.autoTextMode as Exclude<
                                AutoTextMode,
                                "off"
                            >
                        }
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
                            settings.autoTextMode = value;
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
                        current={String(settings.autoTextMinPx)}
                        options={AUTO_MIN_PX_OPTIONS.map((px) => ({
                            value: String(px),
                            label: `${px}px`,
                            ariaLabel: t().autoMinAria(px),
                        }))}
                        onSelect={(value) => {
                            settings.autoTextMinPx = Number(value);
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
    useExternalSignal(onSettingsChange);
    // useExternalSignal(onSpeechChange)
    useExternalSignal(onSelectionChange);
    useExternalSignal(onA11yLangChange);
    return (
        <>
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
