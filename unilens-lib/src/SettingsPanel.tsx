/**
 * UniLens settings panel — gear button (bottom-left) opening a small React panel.
 * Store lives in settings.ts; this file is UI only.
 */
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import styled from "styled-components";
import { HIGHLIGHT_PRESETS, type HighlightPreset } from "./highlightStyles";
import {
    type BoolSettingKey,
    clampSetting,
    ESCAPE_ORDERS,
    NUMBER_KNOBS,
    type NumSettingKey,
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

const SettingsNumber = styled.input`
    margin-left: auto;
    width: 7em;
    background: #26263e;
    color: #eee;
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 6px;
    padding: 3px 6px;
`;

// captureRes and chatFontSize render as named-choice selects (Screen/Reduced,
// Normal/Large), not free-number rows.
const SELECT_KNOBS = Object.keys(SELECT_CHOICES) as SelectKnobKey[];
const NUMBER_ROWS = (Object.keys(NUMBER_KNOBS) as NumSettingKey[]).filter(
    (key) => !Object.hasOwn(SELECT_CHOICES, key),
);
const PRESETS = Object.keys(HIGHLIGHT_PRESETS) as HighlightPreset[];
const ESCAPE_KEYS = Object.keys(ESCAPE_ORDERS) as Settings["escapeOrder"][];

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
                {(Object.keys(TOGGLE_LABELS) as BoolSettingKey[]).map((key) => (
                    <SettingLabel key={key}>
                        <input
                            type="checkbox"
                            checked={settings[key]}
                            onChange={(e) =>
                                updateSetting(key, e.currentTarget.checked)
                            }
                        />
                        {TOGGLE_LABELS[key]}
                    </SettingLabel>
                ))}

                {SELECT_KNOBS.map((key) => (
                    <SettingLabel key={key}>
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
                ))}

                <SettingLabel>
                    Highlight style
                    <SettingsSelect
                        value={clampSetting(
                            "highlightStyle",
                            settings.highlightStyle,
                        )}
                        onChange={(e) =>
                            updateSetting(
                                "highlightStyle",
                                e.currentTarget.value as HighlightPreset,
                            )
                        }
                    >
                        {PRESETS.map((preset) => (
                            <option key={preset} value={preset}>
                                {preset}
                            </option>
                        ))}
                    </SettingsSelect>
                </SettingLabel>

                <SettingLabel>
                    Escape order
                    <SettingsSelect
                        value={clampSetting(
                            "escapeOrder",
                            settings.escapeOrder,
                        )}
                        onChange={(e) =>
                            updateSetting(
                                "escapeOrder",
                                e.currentTarget
                                    .value as Settings["escapeOrder"],
                            )
                        }
                    >
                        {ESCAPE_KEYS.map((order) => (
                            <option key={order} value={order}>
                                {ESCAPE_ORDERS[order]}
                            </option>
                        ))}
                    </SettingsSelect>
                </SettingLabel>

                {NUMBER_ROWS.map((key) => (
                    <NumberRow key={key} setting={key} value={settings[key]} />
                ))}
            </SettingsList>

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
