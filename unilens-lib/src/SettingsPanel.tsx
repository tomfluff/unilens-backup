/**
 * UniLens settings panel — gear button (bottom-left) opening a small React panel.
 * Store lives in settings.ts; this file is UI only.
 */
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import styled from "styled-components";
import {
    type BoolSettingKey,
    clampSetting,
    ENUM_CHOICES,
    type EnumKey,
    exportSettings,
    importSettings,
    NUMBER_KNOBS,
    type NumSettingKey,
    PANEL_SECTIONS,
    SELECT_CHOICES,
    type SelectKnobKey,
    type Settings,
    TOGGLE_LABELS,
    updateSetting,
    useSettings,
} from "./settings";
import { getTargetZoom, getZoom, onZoomChange, setZoom } from "./zoom";

const SettingsSelect = styled.select`
    margin-left: auto;
    background: #26263e;
    color: #eee;
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 6px;
    padding: 3px 6px;
`;

const SettingsColor = styled.input`
    margin-left: auto;
    width: 3em;
    height: 1.8em;
    padding: 0;
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 6px;
    background: none;
`;

const SettingsNumber = styled.input`
    margin-left: auto;
    width: 7em;
    background: #26263e;
    color: #eee;
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 6px;
    padding: 3px 6px;
`;

const SettingsRange = styled.input`
    margin-left: auto;
    width: 7em;
    accent-color: #00c8ff;
`;

/** the minimap's own look: hidden while it follows the highlight look */
const MM_OWN_LOOK = new Set<keyof Settings>([
    "mmOutline",
    "mmBackdrop",
    "mmFill",
    "mmGlow",
    "mmNumbers",
]);

/** the click-feedback knobs that belong to some styles only */
const FX_OWN: Partial<Record<keyof Settings, Settings["clickFx"][]>> = {
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

/** number knobs shown as a slider with its value, not a typed number */
const SLIDERS = new Set<NumSettingKey>(["chatTextScale", "fxSize"]);

const Section = styled.details`
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    padding: 2px 0;

    &:first-child {
        border-top: 0;
    }
`;

const SectionTitle = styled.summary`
    cursor: pointer;
    padding: 6px 0;
    font-weight: 700;
    color: #9fe6ff;
`;

/**
 * Free-number row. Uncontrolled and committed on blur/Enter so typing "160" into a
 * field whose min is 20 is not clamped to "20" mid-keystroke; the key remounts it
 * when the store changes elsewhere, so it never shows a stale value.
 */
function NumberRow({
    setting,
    value,
}: {
    setting: NumSettingKey;
    value: number;
}) {
    const knob = NUMBER_KNOBS[setting];
    const shown = clampSetting(setting, value);
    // Write the clamped value back: when it equals the stored one the key does not
    // change, so nothing else would replace the out-of-range text in the field.
    const commit = (el: HTMLInputElement) => {
        const v = clampSetting(setting, el.valueAsNumber);
        el.value = String(v);
        updateSetting(setting, v);
    };
    return (
        <SettingLabel>
            {knob.label}
            <SettingsNumber
                key={shown}
                type="number"
                min={knob.min}
                max={knob.max}
                step={knob.step}
                defaultValue={shown}
                onBlur={(e) => commit(e.currentTarget)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                }}
            />
        </SettingLabel>
    );
}

const ZoomButton = styled.button`
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: transparent;
    color: #eee;
    font-size: 15px;
    cursor: pointer;
`;

const ZoomResetButton = styled.button`
    flex: 1;
    height: 28px;
    border-radius: 6px;
    border: none;
    background: rgba(255, 255, 255, 0.1);
    color: #00c8ff;
    font-weight: 700;
    cursor: pointer;
`;

const FileRow = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid rgba(255, 255, 255, 0.15);
`;

const FileButton = styled.button`
    flex: 1;
    min-height: 28px;
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: transparent;
    color: #eee;
    font: inherit;
    cursor: pointer;

    /* the host page's own button styles must not reach in (SoftBank underlines a
       focused button in blue) */
    &:hover,
    &:focus {
        color: #eee;
        text-decoration: none;
    }
    &:hover {
        background: rgba(255, 255, 255, 0.08);
    }
    &:focus-visible {
        outline: 2px solid #00c8ff;
        outline-offset: 2px;
    }
`;

const FileStatus = styled.div`
    flex-basis: 100%;
    font-size: 12px;
    color: #b8c0cc;

    &:empty {
        display: none;
    }
`;

/** a settings file bigger than this is not one: every setting fits in a few KB */
const MAX_SETTINGS_FILE = 256 * 1024;

/** save every setting to a JSON file, or load them from one (a study's configuration,
 *  a participant's own setup, a condition to switch to) */
function SettingsFile() {
    const [status, setStatus] = useState("");
    const picker = useRef<HTMLInputElement>(null);

    function save() {
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
        setStatus("Settings saved to a file.");
    }

    async function load(file: File) {
        if (file.size > MAX_SETTINGS_FILE) {
            setStatus("That file is too large to be UniLens settings.");
            return;
        }
        try {
            const { applied, ignored } = importSettings(await file.text());
            const skipped = ignored.length
                ? ` Ignored ${ignored.length} unknown: ${ignored.slice(0, 3).join(", ")}${ignored.length > 3 ? "…" : ""}.`
                : "";
            setStatus(`Loaded ${applied} settings.${skipped}`);
        } catch {
            setStatus("That file is not UniLens settings. Nothing changed.");
        }
    }

    return (
        <FileRow>
            <FileButton type="button" onClick={save}>
                Export settings
            </FileButton>
            <FileButton type="button" onClick={() => picker.current?.click()}>
                Import settings…
            </FileButton>
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
            <FileStatus role="status" aria-live="polite">
                {status}
            </FileStatus>
        </FileRow>
    );
}

const ZoomControlsContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid rgba(255, 255, 255, 0.15);
`;

const PanelContainer = styled.div`
    position: fixed;
    bottom: 52px;
    left: 16px;
    background: #1a1a2e;
    color: #eee;
    border-radius: 10px;
    padding: 12px 16px;
    font: 13px sans-serif;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
    z-index: 2147483647;
    min-width: 210px;
`;

const PanelTitle = styled.div`
    font-weight: 700;
    color: #00c8ff;
    margin-bottom: 8px;
`;

const SettingsList = styled.div`
    overflow-y: auto;
    overscroll-behavior: contain;
    /* CSS (not a JS-computed px value) so it tracks resizes without a
       re-render; dvh follows mobile dynamic browser chrome. */
    max-height: max(140px, calc(100dvh - 190px));
`;

const SettingLabel = styled.label`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
    cursor: pointer;

    &:has(select) {
        padding: 6px 0;
    }
`;

const GearButton = styled.button`
    position: fixed;
    bottom: 14px;
    left: 14px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    font-size: 16px;
    cursor: pointer;
    z-index: 2147483647;
    opacity: 0.6;
    transition: opacity 0.2s;

    &:hover {
        opacity: 1;
    }
`;

function ZoomControls() {
    const [scale, setScale] = useState(() => getZoom().scale);
    useEffect(() => onZoomChange(setScale), []);

    return (
        <ZoomControlsContainer>
            <ZoomButton
                type="button"
                title="Zoom out"
                onClick={() => setZoom(getTargetZoom() / 1.25)}
            >
                −
            </ZoomButton>
            <ZoomResetButton
                type="button"
                title="Reset zoom to 100%"
                onClick={() => setZoom(1)}
            >
                {Math.round(scale * 100)}%
            </ZoomResetButton>
            <ZoomButton
                type="button"
                title="Zoom in"
                onClick={() => setZoom(getTargetZoom() * 1.25)}
            >
                +
            </ZoomButton>
        </ZoomControlsContainer>
    );
}

/** one control, drawn by what kind of value the setting holds */
function Row({
    setting,
    settings,
}: {
    setting: keyof Settings;
    settings: Settings;
}) {
    if (Object.hasOwn(TOGGLE_LABELS, setting)) {
        const key = setting as BoolSettingKey;
        return (
            <SettingLabel>
                <input
                    type="checkbox"
                    checked={settings[key]}
                    onChange={(e) =>
                        updateSetting(key, e.currentTarget.checked)
                    }
                />
                {TOGGLE_LABELS[key]}
            </SettingLabel>
        );
    }
    if (Object.hasOwn(ENUM_CHOICES, setting)) {
        const key = setting as EnumKey;
        return (
            <SettingLabel>
                {ENUM_CHOICES[key].label}
                <SettingsSelect
                    value={String(clampSetting(key, settings[key]))}
                    onChange={(e) =>
                        updateSetting(
                            key,
                            clampSetting(key, e.currentTarget.value),
                        )
                    }
                >
                    {Object.entries(ENUM_CHOICES[key].choices).map(
                        ([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ),
                    )}
                </SettingsSelect>
            </SettingLabel>
        );
    }
    if (setting === "hlColor")
        return (
            <SettingLabel>
                Colour
                <SettingsColor
                    type="color"
                    value={clampSetting("hlColor", settings.hlColor)}
                    onChange={(e) =>
                        updateSetting(
                            "hlColor",
                            clampSetting("hlColor", e.currentTarget.value),
                        )
                    }
                />
            </SettingLabel>
        );
    if (Object.hasOwn(SELECT_CHOICES, setting)) {
        const key = setting as SelectKnobKey;
        return (
            <SettingLabel>
                {NUMBER_KNOBS[key].label}
                <SettingsSelect
                    value={String(clampSetting(key, settings[key]))}
                    onChange={(e) =>
                        updateSetting(
                            key,
                            clampSetting(key, e.currentTarget.value),
                        )
                    }
                >
                    {SELECT_CHOICES[key].map((c) => (
                        <option key={c.value} value={c.value}>
                            {c.label}
                        </option>
                    ))}
                </SettingsSelect>
            </SettingLabel>
        );
    }
    if (Object.hasOwn(NUMBER_KNOBS, setting)) {
        const key = setting as NumSettingKey;
        const knob = NUMBER_KNOBS[key];
        if (SLIDERS.has(key)) {
            const v = clampSetting(key, settings[key]);
            return (
                <SettingLabel>
                    {knob.label.replace(" (%)", "")} {v}%
                    <SettingsRange
                        type="range"
                        min={knob.min}
                        max={knob.max}
                        step={knob.step}
                        value={v}
                        onChange={(e) =>
                            updateSetting(
                                key,
                                clampSetting(
                                    key,
                                    e.currentTarget.valueAsNumber,
                                ),
                            )
                        }
                    />
                </SettingLabel>
            );
        }
        return <NumberRow setting={key} value={settings[key]} />;
    }
    return null;
}

function Panel() {
    // subscribes to the store — re-renders when settings change anywhere
    const settings = useSettings();

    return (
        <PanelContainer id="unilens-settings-panel">
            <PanelTitle>UniLens settings</PanelTitle>

            {/* The feature list outgrew the window. It scrolls; the title and zoom controls
          stay put, so the controls are always reachable. Budget leaves room for the
          panel's offset from the bottom, its title and its zoom row. */}
            <SettingsList>
                {PANEL_SECTIONS.map((g) => (
                    <Section key={g.title} open={g.open}>
                        <SectionTitle>{g.title}</SectionTitle>
                        {g.keys
                            .filter(
                                (key) =>
                                    !(
                                        settings.mmFollowHighlight &&
                                        MM_OWN_LOOK.has(key)
                                    ) &&
                                    !(
                                        key === "fxRippleLook" &&
                                        !settings.fxRipple
                                    ) &&
                                    !(
                                        key === "voiceAutoSend" &&
                                        !settings.voiceInput
                                    ) &&
                                    // a click-feedback style's own knobs only while it is chosen
                                    !(
                                        FX_OWN[key] &&
                                        !FX_OWN[key]?.includes(settings.clickFx)
                                    ),
                            )
                            .map((key) => (
                                <Row
                                    key={key}
                                    setting={key}
                                    settings={settings}
                                />
                            ))}
                    </Section>
                ))}
            </SettingsList>

            <SettingsFile />

            {/* manual zoom is part of the zoom feature — hide it when the toggle is off */}
            {settings.zoom && <ZoomControls />}
        </PanelContainer>
    );
}

function SettingsLauncher() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <GearButton
                type="button"
                title="UniLens settings"
                aria-expanded={open}
                aria-controls="unilens-settings-panel"
                onClick={() => setOpen((o) => !o)}
            >
                ⚙
            </GearButton>
            {open && <Panel />}
        </>
    );
}

export function initSettings() {
    const container = document.createElement("div");
    container.id = "unilens-settings-root";
    // documentElement: outside the zoom-transformed body, excluded from captures
    document.documentElement.appendChild(container);
    createRoot(container).render(<SettingsLauncher />);
}
