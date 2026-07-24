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
import { initZoom, toContent } from './zoom'
import { initSettings } from './settings'
import ChatPopover from './ChatPopover'

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
  if (pos) localStorage.setItem('unilens-pin', JSON.stringify(pos))
  else localStorage.removeItem('unilens-pin')
}

function closePopover() {
  root?.unmount()
  root = null
  container?.remove()
  container = null
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
        onClose={closePopover}
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

async function uploadCapture(cap: CaptureResult, backend: string): Promise<string> {
  const res = await fetch(`${backend}/api/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: cap.image, viewport: cap.viewportImage, meta: cap.meta }),
  })
  if (!res.ok) throw new Error(`capture upload failed: HTTP ${res.status}`)
  const data = await res.json()
  return data.id
}

export function init(options: InitOptions = {}) {
  const trigger = options.trigger ?? ((e: MouseEvent) => e.altKey)
  const backend = options.backend ?? ''

  startTrace(options.mouseWindow ?? 2.5)
  if (options.zoom ?? true) initZoom()
  initSettings()

  document.addEventListener('click', async (e) => {
    if (container?.contains(e.target as Node)) return // clicks inside the popover
    if (!trigger(e)) return
    e.preventDefault()
    e.stopPropagation()

    const p = toContent(e.pageX, e.pageY)
    const cap = await capture(Math.round(p.x), Math.round(p.y), e.target instanceof Element ? e.target : undefined)
    let id = 'local'
    try {
      id = await uploadCapture(cap, backend)
    } catch (err) {
      console.warn('[UniLens] backend unreachable, chat will fail:', err)
    }
    openPopover(e.clientX, e.clientY, id, cap, backend)
  })

  console.log('[UniLens] initialized — alt+click to capture')
}

// Expose for plain <script> embeds
declare global {
  interface Window {
    UniLens: { init: typeof init }
  }
}
window.UniLens = { init }
