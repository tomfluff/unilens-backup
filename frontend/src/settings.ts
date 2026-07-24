/**
 * UniLens settings — per-feature toggles, persisted in localStorage.
 * Gear button (bottom-left) opens a small panel. Feature code reads
 * settings.<flag> live, so toggles apply immediately without re-init.
 * Also hosts zoom controls: [−] [100%] [+], % button resets to 100.
 */
import { getZoom, getTargetZoom, setZoom, onZoomChange } from './zoom'

export interface Settings {
  zoom: boolean
  mouseTrace: boolean
  zoomTrace: boolean
  viewportCrop: boolean
  zoomKeys: boolean
  smoothZoom: boolean
  smartZoom: boolean
  streamReplies: boolean
  quickActions: boolean
  dragPopover: boolean
  elementContext: boolean
  regionSelect: boolean
  highContrast: boolean
  /** capture render scale: 1 = screen resolution, 0.5 = reduced */
  captureRes: number
  /** chat bubble font size in px */
  chatFontSize: number
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
  captureRes: 1,
  chatFontSize: 14,
}

const TOGGLE_LABELS: Record<string, string> = {
  zoom: 'Page zoom (ctrl+wheel)',
  mouseTrace: 'Mouse trail capture',
  zoomTrace: 'Zoom history capture',
  viewportCrop: 'Send zoomed-view close-up',
  zoomKeys: 'Zoom shortcuts (ctrl +/− /0)',
  smoothZoom: 'Smooth zoom animation',
  smartZoom: 'Double-click zoom to fit',
  streamReplies: 'Streaming chat replies',
  quickActions: 'Quick-action chips',
  dragPopover: 'Movable popover (drag header)',
  elementContext: 'Clicked-element context capture',
  regionSelect: 'Alt+drag region select',
  highContrast: 'High-contrast chat',
}

const STORAGE_KEY = 'unilens-settings'

export const settings: Settings = { ...DEFAULTS }
try {
  Object.assign(settings, JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'))
} catch {
  /* corrupted storage — keep defaults */
}

const listeners: (() => void)[] = []

/** subscribe to settings changes (returns unsubscribe) — lets open UI re-render live */
export function onSettingsChange(cb: () => void): () => void {
  listeners.push(cb)
  return () => listeners.splice(listeners.indexOf(cb), 1)
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  listeners.forEach((cb) => cb())
}

// ── UI ─────────────────────────────────────────────────────────────────────
let panel: HTMLDivElement | null = null

function togglePanel() {
  if (panel) {
    panel.remove()
    panel = null
    return
  }
  panel = document.createElement('div')
  Object.assign(panel.style, {
    position: 'fixed',
    bottom: '52px',
    left: '16px',
    background: '#1a1a2e',
    color: '#eee',
    borderRadius: '10px',
    padding: '12px 16px',
    font: '13px sans-serif',
    boxShadow: '0 6px 24px rgba(0,0,0,0.4)',
    zIndex: '2147483647',
    minWidth: '210px',
  })

  const title = document.createElement('div')
  title.textContent = 'UniLens settings'
  Object.assign(title.style, { fontWeight: '700', color: '#00c8ff', marginBottom: '8px' })
  panel.appendChild(title)

  for (const key of Object.keys(TOGGLE_LABELS) as (
    | 'zoom'
    | 'mouseTrace'
    | 'zoomTrace'
    | 'viewportCrop'
    | 'zoomKeys'
    | 'smoothZoom'
    | 'smartZoom'
    | 'streamReplies'
    | 'quickActions'
    | 'dragPopover'
    | 'elementContext'
    | 'regionSelect'
    | 'highContrast'
  )[]) {
    const row = document.createElement('label')
    Object.assign(row.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '4px 0',
      cursor: 'pointer',
    })
    const cb = document.createElement('input')
    cb.type = 'checkbox'
    cb.checked = settings[key]
    cb.onchange = () => {
      settings[key] = cb.checked
      save()
    }
    row.appendChild(cb)
    row.appendChild(document.createTextNode(TOGGLE_LABELS[key]))
    panel.appendChild(row)
  }

  // Capture resolution select
  const resRow = document.createElement('label')
  Object.assign(resRow.style, { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' })
  resRow.appendChild(document.createTextNode('Capture resolution'))
  const sel = document.createElement('select')
  Object.assign(sel.style, {
    marginLeft: 'auto',
    background: '#26263e',
    color: '#eee',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: '6px',
    padding: '3px 6px',
  })
  for (const [value, label] of [
    ['1', 'Screen (1x)'],
    ['0.5', 'Reduced (0.5x)'],
  ]) {
    const opt = document.createElement('option')
    opt.value = value
    opt.textContent = label
    sel.appendChild(opt)
  }
  sel.value = String(settings.captureRes)
  sel.onchange = () => {
    settings.captureRes = parseFloat(sel.value)
    save()
  }
  resRow.appendChild(sel)
  panel.appendChild(resRow)

  // Chat text size select
  const fontRow = document.createElement('label')
  Object.assign(fontRow.style, { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' })
  fontRow.appendChild(document.createTextNode('Chat text size'))
  const fontSel = document.createElement('select')
  fontSel.style.cssText = sel.style.cssText
  for (const [value, label] of [
    ['14', 'Normal'],
    ['17', 'Large'],
    ['20', 'X-Large'],
  ]) {
    const opt = document.createElement('option')
    opt.value = value
    opt.textContent = label
    fontSel.appendChild(opt)
  }
  fontSel.value = String(settings.chatFontSize)
  fontSel.onchange = () => {
    settings.chatFontSize = parseInt(fontSel.value, 10)
    save()
  }
  fontRow.appendChild(fontSel)
  panel.appendChild(fontRow)

  panel.appendChild(buildZoomControls())
  document.documentElement.appendChild(panel)
}

function buildZoomControls(): HTMLDivElement {
  const wrap = document.createElement('div')
  Object.assign(wrap.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '10px',
    paddingTop: '10px',
    borderTop: '1px solid rgba(255,255,255,0.15)',
  })

  const btn = (label: string, title: string) => {
    const b = document.createElement('button')
    b.textContent = label
    b.title = title
    Object.assign(b.style, {
      width: '28px',
      height: '28px',
      borderRadius: '6px',
      border: '1px solid rgba(255,255,255,0.25)',
      background: 'transparent',
      color: '#eee',
      fontSize: '15px',
      cursor: 'pointer',
    })
    return b
  }

  const minus = btn('−', 'Zoom out')
  const plus = btn('+', 'Zoom in')
  const level = document.createElement('button')
  level.title = 'Reset zoom to 100%'
  Object.assign(level.style, {
    flex: '1',
    height: '28px',
    borderRadius: '6px',
    border: 'none',
    background: 'rgba(255,255,255,0.1)',
    color: '#00c8ff',
    fontWeight: '700',
    cursor: 'pointer',
  })

  const render = (s: number) => {
    level.textContent = `${Math.round(s * 100)}%`
  }
  render(getZoom().scale)
  onZoomChange(render)

  minus.onclick = () => setZoom(getTargetZoom() / 1.25)
  plus.onclick = () => setZoom(getTargetZoom() * 1.25)
  level.onclick = () => setZoom(1)

  wrap.appendChild(minus)
  wrap.appendChild(level)
  wrap.appendChild(plus)
  return wrap
}

export function initSettings() {
  const gear = document.createElement('button')
  gear.textContent = '⚙'
  gear.title = 'UniLens settings'
  Object.assign(gear.style, {
    position: 'fixed',
    bottom: '14px',
    left: '14px',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(0,0,0,0.55)',
    color: '#fff',
    fontSize: '16px',
    cursor: 'pointer',
    zIndex: '2147483647',
    opacity: '0.6',
  })
  gear.onmouseenter = () => (gear.style.opacity = '1')
  gear.onmouseleave = () => (gear.style.opacity = '0.6')
  gear.onclick = togglePanel
  // documentElement: outside the zoom-transformed body, excluded from captures
  document.documentElement.appendChild(gear)
}
