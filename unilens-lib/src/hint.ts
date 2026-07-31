/**
 * UniLens proactive hint — dwell detection. When the cursor lingers in a small
 * area (with micro-movement, so an abandoned mouse doesn't trigger it), or the
 * user is zoomed in and lingers, a small chip appears near the cursor.
 * Clicking it captures right there — the zero-shortcut entry path.
 */
import { settings } from './settings'
import { getZoom } from './zoom'

const DWELL_RADIUS = 80 // px, client coords
const DWELL_MS = 4000
const DWELL_MS_ZOOMED = 2000 // faster when zoomed ≥ ZOOM_SIGNAL — already a strong interest signal
const ZOOM_SIGNAL = 1.5
const COOLDOWN_MS = 30_000
const CHIP_LIFETIME_MS = 6000
const CHECK_EVERY_MS = 500

interface Pt {
  x: number
  y: number
  t: number
}

let recent: Pt[] = []
let chip: HTMLDivElement | null = null
let lastShown = 0
let onTrigger: ((clientX: number, clientY: number) => void) | null = null

function onMouseMove(e: MouseEvent) {
  const now = Date.now()
  recent.push({ x: e.clientX, y: e.clientY, t: now })
  recent = recent.filter((p) => p.t > now - DWELL_MS - 1000)
}

function removeChip() {
  chip?.remove()
  chip = null
}

function showChip(x: number, y: number) {
  removeChip()
  chip = document.createElement('div')
  chip.textContent = '✨ Need help? Click here'
  Object.assign(chip.style, {
    position: 'fixed',
    left: Math.min(x + 16, window.innerWidth - 190) + 'px',
    top: Math.min(y + 16, window.innerHeight - 44) + 'px',
    background: '#0f3460',
    color: '#9cf',
    border: '1px solid #00c8ff',
    borderRadius: '16px',
    padding: '6px 14px',
    font: '13px sans-serif',
    cursor: 'pointer',
    zIndex: '2147483646',
    boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
    opacity: '0',
    transition: 'opacity 0.25s',
  })
  chip.onclick = (e) => {
    e.stopPropagation()
    const cx = e.clientX
    const cy = e.clientY
    removeChip()
    onTrigger?.(cx, cy)
  }
  // documentElement: outside the zoom-transformed body, excluded from captures
  document.documentElement.appendChild(chip)
  requestAnimationFrame(() => chip && (chip.style.opacity = '1'))
  lastShown = Date.now()
  setTimeout(() => removeChip(), CHIP_LIFETIME_MS)
}

export interface DwellDebug {
  ptsInWindow: number
  /** max distance from the dwell centroid, px */
  spreadPx: number
  windowMs: number
  /** 0..1 toward triggering the chip */
  progress: number
  cooldownMs: number
  chipVisible: boolean
  zoomSignal: boolean
  /** why the chip is not progressing right now ('' = progressing) */
  blocked: string
  centroid: { x: number; y: number } | null
}

let lastEval: DwellDebug = {
  ptsInWindow: 0,
  spreadPx: 0,
  windowMs: DWELL_MS,
  progress: 0,
  cooldownMs: 0,
  chipVisible: false,
  zoomSignal: false,
  blocked: 'no movement',
  centroid: null,
}

export const getDwellDebug = () => lastEval

function evaluate(): DwellDebug {
  const now = Date.now()
  const zoomed = getZoom().scale >= ZOOM_SIGNAL
  const windowMs = zoomed ? DWELL_MS_ZOOMED : DWELL_MS
  const pts = recent.filter((p) => p.t > now - windowMs)
  const d: DwellDebug = {
    ptsInWindow: pts.length,
    spreadPx: 0,
    windowMs,
    progress: 0,
    cooldownMs: Math.max(0, COOLDOWN_MS - (now - lastShown)),
    chipVisible: chip != null,
    zoomSignal: zoomed,
    blocked: '',
    centroid: null,
  }
  if (!settings.hints) return { ...d, blocked: 'hints disabled' }
  if (document.getElementById('unilens-root')) return { ...d, blocked: 'popover open' }
  if (chip) return { ...d, blocked: 'chip visible' }
  if (d.cooldownMs > 0) return { ...d, blocked: 'cooldown' }
  if (pts.length < 3) return { ...d, blocked: 'no movement' }
  if (now - pts[pts.length - 1].t > 2000) return { ...d, blocked: 'pointer idle' }

  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length
  d.centroid = { x: Math.round(cx), y: Math.round(cy) }
  d.spreadPx = Math.round(Math.max(...pts.map((p) => Math.hypot(p.x - cx, p.y - cy))))
  if (d.spreadPx > DWELL_RADIUS) return { ...d, blocked: 'moving around' }

  // trigger requires the window to be covered minus 1s of slack
  d.progress = Math.min(1, (now - pts[0].t) / (windowMs - 1000))
  return d
}

function check() {
  const d = evaluate()
  lastEval = d
  if (d.blocked || d.progress < 1) return
  const last = recent[recent.length - 1]
  showChip(last.x, last.y)
}

export function initHint(trigger: (clientX: number, clientY: number) => void) {
  onTrigger = trigger
  document.addEventListener('mousemove', onMouseMove, { passive: true })
  setInterval(check, CHECK_EVERY_MS)
}
