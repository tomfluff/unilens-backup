/**
 * UniLens embeddable entry.
 *
 * Embed build (dist/unilens.js) exposes window.UniLens:
 *   <script src="unilens.js"></script>
 *   <script>UniLens.init({ backend: 'http://127.0.0.1:5000' })</script>
 *
 * Options:
 *   trigger      MouseEvent → bool. Default: alt+click.
 *   mouseWindow  Seconds of trace history. Default: 2.5.
 *   backend      Flask base URL. Default: '' (same origin / vite proxy).
 */
import { createRoot, type Root } from 'react-dom/client'
import { startTrace, capture, type CaptureResult } from './capture'
import { clientToContent, initZoom } from './zoom'
import { initMinimap } from './minimap'
import { settings } from './settings'
import { initSettings } from './SettingsPanel'
import { setSpeechBackend } from './speech'
import { initHint } from './hint'
import { initDebug } from './DebugPanel'
import { tagLastCapture } from './capture'
import ChatPopover from './ChatPopover'

/** build stamp injected by vite (see vite.config.ts define) */
declare const __target_dist_unilens_BUILD__: string

export interface InitOptions {
  trigger?: (e: MouseEvent) => boolean
  mouseWindow?: number
  backend?: string
  /** ctrl+wheel pinch-style page zoom. Default: true. */
  zoom?: boolean
}

let root: Root | null = null
let container: HTMLDivElement | null = null
/** set when the user pins the popover — subsequent captures reopen here (survives reloads) */
let pinnedPos: { left: number; top: number } | null = null
try {
  pinnedPos = JSON.parse(localStorage.getItem('unilens-pin') ?? 'null')
} catch {
  /* corrupted — stay unpinned */
}

function setPinnedPos(pos: { left: number; top: number } | null) {
  pinnedPos = pos
  try {
    if (pos) localStorage.setItem('unilens-pin', JSON.stringify(pos))
    else localStorage.removeItem('unilens-pin')
  } catch {
    /* private browsing / blocked storage — pin still works for this page load */
  }
}

function closePopover() {
  root?.unmount()
  root = null
  container?.remove()
  container = null
}

/** ✕ pressed: dismissing the popover also ends the conversation session */
function dismissPopover() {
  sessionId = null
  closePopover()
}

function openPopover(clientX: number, clientY: number, captureId: string, cap: CaptureResult, backend: string) {
  closePopover()
  container = document.createElement('div')
  container.id = 'unilens-root'
  // documentElement, not body: body carries the zoom transform, which would
  // break position:fixed and scale the popover. Also keeps it out of captures.
  document.documentElement.appendChild(container)
  root = createRoot(container)
  const render = () =>
    root!.render(
      <ChatPopover
        x={clientX}
        y={clientY}
        captureId={captureId}
        capture={cap}
        backend={backend}
        sessionId={settings.continuity ? sessionId : null}
        onClose={dismissPopover}
        initialPos={pinnedPos}
        pinned={pinnedPos != null}
        onTogglePin={(pos) => {
          setPinnedPos(pos)
          render() // re-render so the pin button reflects state
        }}
        onMove={(pos) => {
          if (pinnedPos) setPinnedPos(pos)
        }}
      />,
    )
  render()
}

/** current conversation session — new captures join it until the user closes the popover */
let sessionId: string | null = null

async function uploadCapture(cap: CaptureResult, backend: string): Promise<string> {
  const res = await fetch(`${backend}/api/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: cap.image,
      viewport: cap.viewportImage,
      meta: cap.meta,
      session_id: settings.continuity ? sessionId : null,
    }),
  })
  if (!res.ok) throw new Error(`capture upload failed: HTTP ${res.status}`)
  const data = await res.json()
  sessionId = settings.continuity ? (data.session_id ?? null) : null
  return data.id
}

export function init(options: InitOptions = {}) {
  const trigger = options.trigger ?? ((e: MouseEvent) => e.altKey)
  const backend = options.backend ?? ''

  startTrace(options.mouseWindow ?? 2.5)
  if (options.zoom ?? true) initZoom()
  initMinimap()
  initSettings()
  setSpeechBackend(backend)

  async function doCapture(
    clientX: number,
    clientY: number,
    pointX: number,
    pointY: number,
    el?: Element,
    region?: { x: number; y: number; w: number; h: number },
  ) {
    // (pointX, pointY) is the client point being asked about — the click, or the centre
    // of a drag. clientToContent handles both pan engines.
    const p = clientToContent(pointX, pointY)
    const cap = await capture(Math.round(p.x), Math.round(p.y), el, region)
    let id = 'local'
    try {
      id = await uploadCapture(cap, backend)
      tagLastCapture(id)
    } catch (err) {
      console.warn('[UniLens] backend unreachable, chat will fail:', err)
    }
    openPopover(clientX, clientY, id, cap, backend)
  }

  // ── Alt+drag region select ───────────────────────────────────────────────
  let dragStart: { clientX: number; clientY: number } | null = null
  let dragBox: HTMLDivElement | null = null
  let suppressClick = false

  function removeDragBox() {
    dragBox?.remove()
    dragBox = null
  }

  document.addEventListener('mousedown', (e) => {
    if (!settings.regionSelect || !trigger(e)) return
    if (container?.contains(e.target as Node)) return
    dragStart = { clientX: e.clientX, clientY: e.clientY }
    e.preventDefault() // no text selection while dragging
  })

  document.addEventListener('mousemove', (e) => {
    if (!dragStart) return
    const w = Math.abs(e.clientX - dragStart.clientX)
    const h = Math.abs(e.clientY - dragStart.clientY)
    if (!dragBox && (w > 6 || h > 6)) {
      dragBox = document.createElement('div')
      Object.assign(dragBox.style, {
        position: 'fixed',
        border: '2px solid rgba(255,0,200,0.9)',
        background: 'rgba(255,0,200,0.08)',
        pointerEvents: 'none',
        zIndex: '2147483646',
      })
      document.documentElement.appendChild(dragBox)
    }
    if (dragBox) {
      Object.assign(dragBox.style, {
        left: Math.min(e.clientX, dragStart.clientX) + 'px',
        top: Math.min(e.clientY, dragStart.clientY) + 'px',
        width: w + 'px',
        height: h + 'px',
      })
    }
  })

  document.addEventListener('mouseup', (e) => {
    if (!dragStart) return
    const start = dragStart
    dragStart = null
    removeDragBox()
    const dist = Math.max(Math.abs(e.clientX - start.clientX), Math.abs(e.clientY - start.clientY))
    if (dist < 10) return // plain alt+click — let the click handler run

    suppressClick = true // the click event that follows belongs to this drag
    const a = clientToContent(start.clientX, start.clientY)
    const b = clientToContent(e.clientX, e.clientY)
    const region = {
      x: Math.min(a.x, b.x),
      y: Math.min(a.y, b.y),
      w: Math.abs(b.x - a.x),
      h: Math.abs(b.y - a.y),
    }
    const centerClientX = (start.clientX + e.clientX) / 2
    const centerClientY = (start.clientY + e.clientY) / 2
    const el = document.elementFromPoint(centerClientX, centerClientY) ?? undefined
    doCapture(e.clientX, e.clientY, centerClientX, centerClientY, el, region)
  })

  initDebug({
    sessionId: () => sessionId,
    popoverOpen: () => container != null,
    backend: () => backend,
  })

  // Proactive dwell hint — clicking the chip is the zero-shortcut capture path
  initHint((clientX, clientY) => {
    const el = document.elementFromPoint(clientX, clientY) ?? undefined
    doCapture(clientX, clientY, clientX, clientY, el)
  })

  document.addEventListener('click', async (e) => {
    if (suppressClick) {
      suppressClick = false
      e.preventDefault()
      e.stopPropagation()
      return
    }
    if (container?.contains(e.target as Node)) return // clicks inside the popover
    if (!trigger(e)) return
    e.preventDefault()
    e.stopPropagation()
    doCapture(e.clientX, e.clientY, e.clientX, e.clientY, e.target instanceof Element ? e.target : undefined)
  })

  console.log(
    `[UniLens] initialized (build ${typeof __target_dist_unilens_BUILD__ === 'string' ? __target_dist_unilens_BUILD__ : 'dev'}) — alt+click to capture, alt+drag to select a region`,
  )
}

// Expose for plain <script> embeds
declare global {
  interface Window {
    UniLens: { init: typeof init }
  }
}
window.UniLens = { init }
