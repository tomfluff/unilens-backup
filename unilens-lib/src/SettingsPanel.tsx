/**
 * UniLens settings panel — gear button (bottom-left) opening a small React panel.
 * Store lives in settings.ts; this file is UI only.
 */
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import styled from "styled-components";
import {
    type BoolSettingKey,
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
        <PanelContainer>
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

                <SettingLabel>
                    Capture resolution
                    <SettingsSelect
                        value={String(settings.captureRes)}
                        onChange={(e) =>
                            updateSetting(
                                "captureRes",
                                parseFloat(e.currentTarget.value),
                            )
                        }
                    >
                        <option value="1">Screen (1x)</option>
                        <option value="0.5">Reduced (0.5x)</option>
                    </SettingsSelect>
                </SettingLabel>

                <SettingLabel>
                    Chat text size
                    <SettingsSelect
                        value={String(settings.chatFontSize)}
                        onChange={(e) =>
                            updateSetting(
                                "chatFontSize",
                                parseInt(e.currentTarget.value, 10),
                            )
                        }
                    >
                        <option value="14">Normal</option>
                        <option value="17">Large</option>
                        <option value="20">X-Large</option>
                    </SettingsSelect>
                </SettingLabel>
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
