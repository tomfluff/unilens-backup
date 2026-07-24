/**
 * UniLens zoom — pinch-style page zoom on ctrl+mousewheel (trackpad pinch
 * gestures also arrive as ctrl+wheel). Applies scale() to document.body,
 * anchored at the cursor via scroll compensation. Content coordinates
 * (layout space, zoom-independent) are what capture/trace/click record,
 * so annotations align with the unzoomed screenshot at any zoom level.
 */

const MIN_ZOOM = 0.25
const MAX_ZOOM = 5

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

function onWheel(e: WheelEvent) {
  if (!e.ctrlKey) return
  e.preventDefault() // stop browser-native zoom

  if (layoutW === 0) measureLayout()

  const oldScale = scale
  scale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scale * Math.exp(-e.deltaY * 0.002)))
  if (scale === oldScale) return

  // content point under cursor stays under cursor: solve for new scroll
  const cx = (e.clientX + window.scrollX) / oldScale
  const cy = (e.clientY + window.scrollY) / oldScale

  document.body.style.transformOrigin = '0 0'
  document.body.style.transform = scale === 1 ? '' : `scale(${scale})`
  window.scrollTo(cx * scale - e.clientX, cy * scale - e.clientY)

  showBadge()
}

export function initZoom() {
  measureLayout()
  window.addEventListener('resize', measureLayout)
  document.addEventListener('wheel', onWheel, { passive: false })
  console.log('[UniLens] zoom enabled — ctrl+wheel')
}
