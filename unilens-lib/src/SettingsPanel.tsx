/**
 * UniLens settings panel — gear button (bottom-left) opening a small React panel.
 * Store lives in settings.ts; this file is UI only.
 */
import { useEffect, useState, type CSSProperties } from 'react'
import { createRoot } from 'react-dom/client'
import { onSettingsChange, settings, TOGGLE_LABELS, updateSetting, type BoolSettingKey } from './settings'
import { getTargetZoom, getZoom, onZoomChange, setZoom } from './zoom'

const selectStyle: CSSProperties = {
  marginLeft: 'auto',
  background: '#26263e',
  color: '#eee',
  border: '1px solid rgba(255,255,255,0.25)',
  borderRadius: 6,
  padding: '3px 6px',
}

const zoomBtnStyle: CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 6,
  border: '1px solid rgba(255,255,255,0.25)',
  background: 'transparent',
  color: '#eee',
  fontSize: 15,
  cursor: 'pointer',
}

function ZoomControls() {
  const [scale, setScale] = useState(() => getZoom().scale)
  useEffect(() => onZoomChange(setScale), [])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginTop: 10,
        paddingTop: 10,
        borderTop: '1px solid rgba(255,255,255,0.15)',
      }}
    >
      <button style={zoomBtnStyle} title="Zoom out" onClick={() => setZoom(getTargetZoom() / 1.25)}>
        −
      </button>
      <button
        title="Reset zoom to 100%"
        onClick={() => setZoom(1)}
        style={{
          flex: 1,
          height: 28,
          borderRadius: 6,
          border: 'none',
          background: 'rgba(255,255,255,0.1)',
          color: '#00c8ff',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        {Math.round(scale * 100)}%
      </button>
      <button style={zoomBtnStyle} title="Zoom in" onClick={() => setZoom(getTargetZoom() * 1.25)}>
        +
      </button>
    </div>
  )
}

function Panel() {
  // re-render when settings change elsewhere (keyboard shortcuts, debug close, …)
  const [, bump] = useState(0)
  useEffect(() => onSettingsChange(() => bump((n) => n + 1)), [])

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 52,
        left: 16,
        background: '#1a1a2e',
        color: '#eee',
        borderRadius: 10,
        padding: '12px 16px',
        font: '13px sans-serif',
        boxShadow: '0 6px 24px rgba(0,0,0,0.4)',
        zIndex: 2147483647,
        minWidth: 210,
      }}
    >
      <div style={{ fontWeight: 700, color: '#00c8ff', marginBottom: 8 }}>UniLens settings</div>

      {/* The feature list outgrew the window. It scrolls; the title and zoom controls
          stay put, so the controls are always reachable. Budget leaves room for the
          panel's offset from the bottom, its title and its zoom row. */}
      <div
        style={{
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          maxHeight: Math.max(140, window.innerHeight - 190),
        }}
      >
        {(Object.keys(TOGGLE_LABELS) as BoolSettingKey[]).map((key) => (
          <label
            key={key}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}
          >
            <input
              type="checkbox"
              checked={settings[key]}
              onChange={(e) => updateSetting(key, e.currentTarget.checked)}
            />
            {TOGGLE_LABELS[key]}
          </label>
        ))}

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
          Capture resolution
          <select
            style={selectStyle}
            value={String(settings.captureRes)}
            onChange={(e) => updateSetting('captureRes', parseFloat(e.currentTarget.value))}
          >
            <option value="1">Screen (1x)</option>
            <option value="0.5">Reduced (0.5x)</option>
          </select>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
          Chat text size
          <select
            style={selectStyle}
            value={String(settings.chatFontSize)}
            onChange={(e) => updateSetting('chatFontSize', parseInt(e.currentTarget.value, 10))}
          >
            <option value="14">Normal</option>
            <option value="17">Large</option>
            <option value="20">X-Large</option>
          </select>
        </label>
      </div>

      <ZoomControls />
    </div>
  )
}

function SettingsLauncher() {
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState(false)

  return (
    <>
      <button
        title="UniLens settings"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          position: 'fixed',
          bottom: 14,
          left: 14,
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: 'none',
          background: 'rgba(0,0,0,0.55)',
          color: '#fff',
          fontSize: 16,
          cursor: 'pointer',
          zIndex: 2147483647,
          opacity: hover ? 1 : 0.6,
        }}
      >
        ⚙
      </button>
      {open && <Panel />}
    </>
  )
}

export function initSettings() {
  const container = document.createElement('div')
  container.id = 'unilens-settings-root'
  // documentElement: outside the zoom-transformed body, excluded from captures
  document.documentElement.appendChild(container)
  createRoot(container).render(<SettingsLauncher />)
}
