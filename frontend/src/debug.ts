/**
 * UniLens debug view — live instrumentation panel. Shows what UniLens sees
 * right now: pointer trace map, dwell-detector state, zoom state, last capture
 * timings/sizes, session, and backend health. Toggle via settings or
 * ctrl+shift+D. Mounted on documentElement: outside the zoom transform and
 * excluded from captures (html2canvas renders body only).
 *
 * Chart conventions follow the product's annotation semantics — color follows
 * the entity: trace orange, viewport/accent cyan, region magenta, ok green.
 */
import { settings, updateSetting, onSettingsChange } from './settings'
import { getTraceDebug, getCaptureDebug } from './capture'
import { getDwellDebug } from './hint'
import { getZoom, getTargetZoom, getZoomTrace } from './zoom'

export interface DebugSources {
  sessionId: () => string | null
  popoverOpen: () => boolean
  backend: () => string
}

const ORANGE = '#ffb400'
const CYAN = '#00c8ff'
const GREEN = '#4cff91'
const DIM = '#8899aa'

let panel: HTMLDivElement | null = null
let timer: number | undefined
let sources: DebugSources | null = null
let health = 'checking…'
let healthTimer: number | undefined

const rows: Record<string, HTMLElement> = {}
let traceCanvas: HTMLCanvasElement | null = null
let dwellBar: HTMLDivElement | null = null

function el(tag: string, style: Partial<CSSStyleDeclaration>, text?: string): HTMLElement {
  const e = document.createElement(tag)
  Object.assign(e.style, style)
  if (text) e.textContent = text
  return e
}

function section(title: string): HTMLElement {
  const h = el('div', { color: CYAN, font: '700 11px sans-serif', margin: '10px 0 4px', letterSpacing: '0.5px' })
  h.textContent = title.toUpperCase()
  return h
}

function kvRow(key: string): HTMLElement {
  const row = el('div', { font: '11px monospace', color: '#cdE', lineHeight: '1.6', whiteSpace: 'pre-wrap' })
  rows[key] = row
  return row
}

function buildPanel() {
  panel = document.createElement('div')
  Object.assign(panel.style, {
    position: 'fixed',
    top: '12px',
    right: '12px',
    width: '292px',
    maxHeight: '94vh',
    overflowY: 'auto',
    background: 'rgba(13, 13, 26, 0.96)',
    border: '1px solid #2a2a4a',
    borderRadius: '10px',
    padding: '10px 14px 14px',
    zIndex: '2147483647',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  })

  const title = el('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center' })
  title.appendChild(el('span', { color: CYAN, font: '700 13px sans-serif' }, 'UniLens debug'))
  const close = el('button', {
    background: 'none',
    border: 'none',
    color: '#889',
    cursor: 'pointer',
    fontSize: '14px',
  }, '✕') as HTMLButtonElement
  close.onclick = () => updateSetting('debugView', false)
  title.appendChild(close)
  panel.appendChild(title)

  // Pointer — spatial trace map of the viewport
  panel.appendChild(section('Pointer trace'))
  traceCanvas = document.createElement('canvas')
  traceCanvas.width = 264
  traceCanvas.height = 66
  Object.assign(traceCanvas.style, { borderRadius: '6px', background: '#101020', display: 'block' })
  panel.appendChild(traceCanvas)
  panel.appendChild(kvRow('pointer'))

  // Dwell — progress toward the hint chip
  panel.appendChild(section('Dwell detector'))
  const track = el('div', { background: 'rgba(255,255,255,0.1)', borderRadius: '4px', height: '8px', margin: '2px 0 4px' })
  dwellBar = el('div', { background: GREEN, borderRadius: '4px', height: '8px', width: '0%' }) as HTMLDivElement
  track.appendChild(dwellBar)
  panel.appendChild(track)
  panel.appendChild(kvRow('dwell'))

  panel.appendChild(section('Zoom'))
  panel.appendChild(kvRow('zoom'))

  panel.appendChild(section('Last capture'))
  panel.appendChild(kvRow('capture'))

  panel.appendChild(section('Session'))
  panel.appendChild(kvRow('session'))

  panel.appendChild(section('Backend'))
  panel.appendChild(kvRow('backend'))

  document.documentElement.appendChild(panel)
}

function drawTrace() {
  if (!traceCanvas) return
  const ctx = traceCanvas.getContext('2d')!
  const W = traceCanvas.width
  const H = traceCanvas.height
  ctx.clearRect(0, 0, W, H)

  const { window: pts } = getTraceDebug()
  const z = getZoom()
  // content coords → viewport-proportional canvas coords
  const sx = (x: number) => ((x * z.scale - window.scrollX) / window.innerWidth) * W
  const sy = (y: number) => ((y * z.scale - window.scrollY) / window.innerHeight) * H

  if (pts.length >= 2) {
    const oldest = pts[0].t
    const span = Math.max(pts[pts.length - 1].t - oldest, 1)
    for (let i = 1; i < pts.length; i++) {
      const age = (pts[i].t - oldest) / span
      ctx.beginPath()
      ctx.moveTo(sx(pts[i - 1].x), sy(pts[i - 1].y))
      ctx.lineTo(sx(pts[i].x), sy(pts[i].y))
      ctx.strokeStyle = ORANGE
      ctx.globalAlpha = 0.15 + age * 0.85
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    const last = pts[pts.length - 1]
    ctx.beginPath()
    ctx.arc(sx(last.x), sy(last.y), 3, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()
  }

  // dwell zone: centroid + radius, in client space
  const d = getDwellDebug()
  if (d.centroid) {
    ctx.beginPath()
    ctx.ellipse(
      (d.centroid.x / window.innerWidth) * W,
      (d.centroid.y / window.innerHeight) * H,
      (80 / window.innerWidth) * W,
      (80 / window.innerHeight) * H,
      0,
      0,
      Math.PI * 2,
    )
    ctx.strokeStyle = GREEN
    ctx.globalAlpha = 0.7
    ctx.setLineDash([3, 3])
    ctx.stroke()
    ctx.setLineDash([])
    ctx.globalAlpha = 1
  }
}

function fmtAge(ms: number): string {
  return ms < 1000 ? `${ms}ms` : ms < 60_000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms / 60_000)}m`
}

function render() {
  if (!panel || !sources) return

  const t = getTraceDebug()
  const last = t.window[t.window.length - 1]
  rows.pointer.textContent = last
    ? `content (${Math.round(last.x)}, ${Math.round(last.y)}) · ${t.window.length} pts in ${t.windowSec}s window · buffer ${t.buffer}`
    : `no recent movement · buffer ${t.buffer}`
  drawTrace()

  const d = getDwellDebug()
  if (dwellBar) {
    dwellBar.style.width = `${Math.round(d.progress * 100)}%`
    dwellBar.style.background = d.blocked ? DIM : GREEN
  }
  rows.dwell.textContent =
    `${d.blocked ? `blocked: ${d.blocked}` : `progress ${Math.round(d.progress * 100)}%`}` +
    ` · ${d.ptsInWindow} pts · spread ${d.spreadPx}px` +
    `\nwindow ${d.windowMs / 1000}s${d.zoomSignal ? ' (zoom signal)' : ''}` +
    (d.cooldownMs > 0 ? ` · cooldown ${fmtAge(d.cooldownMs)}` : '') +
    (d.chipVisible ? ' · CHIP VISIBLE' : '')

  const z = getZoom()
  const zt = getZoomTrace(Date.now())
  rows.zoom.textContent =
    `scale ${z.scale.toFixed(2)} → target ${getTargetZoom().toFixed(2)} · layout ${z.layoutW}×${z.layoutH}` +
    `\nzoomTrace ${zt.length} events (30s)` +
    (zt.length ? ` · last ${zt[zt.length - 1].scale}x @ (${zt[zt.length - 1].x}, ${zt[zt.length - 1].y})` : '')

  const c = getCaptureDebug()
  rows.capture.textContent = c
    ? `${c.id ?? '(not uploaded)'} · ${fmtAge(Date.now() - c.at)} ago` +
      `\npre ${c.timings.preprocess} + render ${c.timings.render} + enc ${c.timings.encode} = ${c.timings.total}ms` +
      `\n${c.pageW}×${c.pageH} · ${c.images} image${c.images === 1 ? '' : 's'} · ${c.sizes.pageKB}KB + ${c.sizes.closeupKB}KB`
    : 'none yet'

  rows.session.textContent = `${sources.sessionId() ?? '(none — next capture starts one)'} · popover ${
    sources.popoverOpen() ? 'open' : 'closed'
  }`

  rows.backend.textContent = `${sources.backend() || '(same origin)'}\n${health}`
}

async function pollHealth() {
  if (!sources) return
  try {
    const res = await fetch(`${sources.backend()}/health`)
    const d = await res.json()
    health = `${d.status} · provider ${d.provider}`
  } catch {
    health = 'UNREACHABLE'
  }
}

function show() {
  if (panel) return
  buildPanel()
  render()
  timer = window.setInterval(render, 250)
  pollHealth()
  healthTimer = window.setInterval(pollHealth, 5000)
}

function hide() {
  panel?.remove()
  panel = null
  clearInterval(timer)
  clearInterval(healthTimer)
}

export function initDebug(src: DebugSources) {
  sources = src
  onSettingsChange(() => (settings.debugView ? show() : hide()))
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
      e.preventDefault()
      updateSetting('debugView', !settings.debugView)
    }
  })
  if (settings.debugView) show()
}
