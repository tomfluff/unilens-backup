/**
 * UniLens zoom — pinch-style page zoom on ctrl+mousewheel (trackpad pinch
 * gestures also arrive as ctrl+wheel). Applies scale() to document.body,
 * anchored at the cursor via scroll compensation. Content coordinates
 * (layout space, zoom-independent) are what capture/trace/click record,
 * so annotations align with the unzoomed screenshot at any zoom level.
 */

import { settings } from './settings'

const MIN_ZOOM = 0.25
const MAX_ZOOM = 5
const ZOOM_TRACE_WINDOW_MS = 30_000
const ZOOM_TRACE_MAX = 50

export interface ZoomEvent {
  t: number
  /** zoom level after this event */
  scale: number
  /** content coords of the zoom anchor (cursor) */
  x: number
  y: number
}

let zoomTrace: ZoomEvent[] = []

/** zoom events within the last 30s — the user's recent attention signal */
export function getZoomTrace(atTime: number): ZoomEvent[] {
  return zoomTrace.filter((e) => e.t >= atTime - ZOOM_TRACE_WINDOW_MS)
}

let scale = 1
let layoutW = 0
let layoutH = 0
let badge: HTMLDivElement | null = null
let badgeTimer: number | undefined

export interface ZoomState {
  scale: number
  /** unzoomed page layout size */
  layoutW: number
  layoutH: number
}

export function getZoom(): ZoomState {
  if (layoutW === 0) measureLayout()
  return { scale, layoutW, layoutH }
}

/** where zoom is heading (equals current scale unless a smooth zoom is in flight) */
export function getTargetZoom(): number {
  return targetScale
}

/** page (scroll-space) coords -> content (layout-space) coords */
export function toContent(pageX: number, pageY: number): { x: number; y: number } {
  return { x: pageX / scale, y: pageY / scale }
}

function measureLayout() {
  // measure with transform off so scrollWidth/Height are true layout size
  const prev = document.body.style.transform
  document.body.style.transform = ''
  layoutW = document.documentElement.scrollWidth
  layoutH = document.documentElement.scrollHeight
  document.body.style.transform = prev
}

function showBadge() {
  if (!badge) {
    badge = document.createElement('div')
    Object.assign(badge.style, {
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      background: 'rgba(0,0,0,0.75)',
      color: '#fff',
      padding: '6px 14px',
      borderRadius: '16px',
      font: '13px sans-serif',
      pointerEvents: 'none',
      zIndex: '2147483647',
      transition: 'opacity 0.3s',
    })
    // documentElement, not body: body is the transformed element
    document.documentElement.appendChild(badge)
  }
  badge.textContent = `${Math.round(scale * 100)}%`
  badge.style.opacity = '1'
  clearTimeout(badgeTimer)
  badgeTimer = window.setTimeout(() => {
    if (badge) badge.style.opacity = '0'
  }, 1200)
}

let changeListener: ((scale: number) => void) | null = null

/** settings panel subscribes to keep its % label live */
export function onZoomChange(cb: (scale: number) => void) {
  changeListener = cb
}

// ── Animated zoom state ────────────────────────────────────────────────────
let targetScale = 1
let anchor = { ax: 0, ay: 0, cx: 0, cy: 0 } // client point + pinned content point
let rafId = 0

function applyScale(s: number) {
  scale = s
  document.body.style.transformOrigin = '0 0'
  document.body.style.transform = s === 1 ? '' : `scale(${s})`
  // content point under the anchor stays under the anchor at every frame
  window.scrollTo(anchor.cx * s - anchor.ax, anchor.cy * s - anchor.ay)
  showBadge()
  changeListener?.(s)
}

function animate() {
  const diff = targetScale - scale
  if (Math.abs(diff) < 0.001) {
    applyScale(targetScale)
    rafId = 0
    return
  }
  applyScale(scale + diff * 0.25) // exponential ease-out
  rafId = requestAnimationFrame(animate)
}

/** Zoom to `target`, keeping the content under (anchorX, anchorY) client coords fixed. Defaults to viewport center. */
export function setZoom(target: number, anchorX?: number, anchorY?: number) {
  if (layoutW === 0) measureLayout()
  const ax = anchorX ?? window.innerWidth / 2
  const ay = anchorY ?? window.innerHeight / 2

  const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, target))
  if (clamped === targetScale && clamped === scale) return
  targetScale = clamped
  // pin the content point currently under the anchor (at the current scale)
  anchor = { ax, ay, cx: (ax + window.scrollX) / scale, cy: (ay + window.scrollY) / scale }

  if (settings.zoomTrace) {
    zoomTrace.push({
      t: Date.now(),
      scale: Math.round(targetScale * 100) / 100,
      x: Math.round(anchor.cx),
      y: Math.round(anchor.cy),
    })
    if (zoomTrace.length > ZOOM_TRACE_MAX) zoomTrace.splice(0, zoomTrace.length - ZOOM_TRACE_MAX)
  }

  if (!settings.smoothZoom) {
    if (rafId) cancelAnimationFrame(rafId)
    rafId = 0
    applyScale(targetScale)
    return
  }
  if (!rafId) rafId = requestAnimationFrame(animate)
}

function onWheel(e: WheelEvent) {
  if (!e.ctrlKey) return
  if (!settings.zoom) return // toggled off: let the browser zoom natively
  e.preventDefault() // stop browser-native zoom
  setZoom(targetScale * Math.exp(-e.deltaY * 0.002), e.clientX, e.clientY)
}

function onKeyDown(e: KeyboardEvent) {
  if (!e.ctrlKey || !settings.zoomKeys) return
  // '=' is unshifted '+' on most layouts; NumpadAdd/Subtract for numpad
  if (e.key === '+' || e.key === '=' || e.code === 'NumpadAdd') {
    e.preventDefault()
    setZoom(targetScale * 1.25)
  } else if (e.key === '-' || e.code === 'NumpadSubtract') {
    e.preventDefault()
    setZoom(targetScale / 1.25)
  } else if (e.key === '0' || e.code === 'Numpad0') {
    e.preventDefault()
    setZoom(1)
  }
}

export function initZoom() {
  measureLayout()
  window.addEventListener('resize', measureLayout)
  document.addEventListener('wheel', onWheel, { passive: false })
  document.addEventListener('keydown', onKeyDown)
  console.log('[UniLens] zoom enabled — ctrl+wheel, ctrl +/− /0')
}
