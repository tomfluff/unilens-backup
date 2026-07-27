/**
 * UniLens minimap — page overview with a lens rect, shown while magnified.
 *
 * Zoom is magnifier-style: the page becomes one big surface and scrolling moves a
 * lens over it. Two scrollbars are a poor control for that (at 4x the thumbs are
 * tiny and panning is two-dimensional), so this draws the whole page as a skeleton
 * with the visible region marked. Click or drag anywhere on it to move the lens.
 *
 * Lives on documentElement, outside the body transform, so it stays at 1x and stays
 * out of captures — same as the rest of the UniLens chrome.
 */
import { getView, getZoom, isOwnMutation, onViewChange, onZoomChange, refreshLayout, setView, toContent } from './zoom'
import { settings } from './settings'

const MAP_W = 140
/** room left for the map after its inset, padding and border */
const heightBudget = () => window.innerHeight - 48
// ponytail: skeleton rects, not a real thumbnail. html2canvas would look better but
// costs seconds per render; revisit if orientation turns out to need real content.
const MIN_AREA = 200 // layout px² — below this a block is noise at minimap scale
const MAX_RECTS = 1200
const MEDIA = /^(IMG|VIDEO|CANVAS|SVG|PICTURE|IFRAME)$/
const REDRAW_DEBOUNCE_MS = 300

let box: HTMLDivElement | null = null
let canvas: HTMLCanvasElement
let lens: HTMLDivElement
let mapScale = 0
let raf = 0
let watcher: MutationObserver | null = null
let redrawTimer: number | undefined

function build() {
  box = document.createElement('div')
  Object.assign(box.style, {
    position: 'fixed',
    top: '16px',
    right: '16px',
    background: 'rgba(255,255,255,0.92)',
    border: '1px solid rgba(0,0,0,0.25)',
    borderRadius: '6px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
    padding: '4px',
    zIndex: '2147483646', // just under the popover/badge
    cursor: 'crosshair',
    touchAction: 'none',
  })

  canvas = document.createElement('canvas')
  canvas.style.display = 'block'
  box.appendChild(canvas)

  lens = document.createElement('div')
  Object.assign(lens.style, {
    position: 'absolute',
    border: '2px solid #d23',
    background: 'rgba(221,51,51,0.12)',
    pointerEvents: 'none',
    borderRadius: '2px',
  })
  box.appendChild(lens)

  box.addEventListener('pointerdown', (e) => {
    try {
      box!.setPointerCapture(e.pointerId) // keeps the drag alive past the map's edge
    } catch {
      /* no live pointer to capture — dragging still works, just not past the edge */
    }
    panTo(e)
  })
  box.addEventListener('pointermove', (e) => {
    if (e.buttons) panTo(e)
  })

  document.documentElement.appendChild(box)
}

/** move the lens so it centres on the point clicked in the minimap */
function panTo(e: PointerEvent) {
  const r = canvas.getBoundingClientRect()
  const { scale } = getZoom()
  const contentX = (e.clientX - r.left) / mapScale
  const contentY = (e.clientY - r.top) / mapScale
  setView(contentX * scale - window.innerWidth / 2, contentY * scale - window.innerHeight / 2)
}

/** redraw the page skeleton — layout only changes on resize, not while zooming */
function drawSkeleton() {
  const { scale, layoutW, layoutH } = getZoom()
  // width is the fixed dimension and height follows the page's aspect; only a page
  // long enough to overflow the window falls back to fitting the height instead
  mapScale = Math.min(MAP_W / layoutW, heightBudget() / layoutH)
  canvas.width = Math.max(1, Math.round(layoutW * mapScale))
  canvas.height = Math.max(1, Math.round(layoutH * mapScale))

  const g = canvas.getContext('2d')!
  g.fillStyle = '#fff'
  g.fillRect(0, 0, canvas.width, canvas.height)

  let drawn = 0
  for (const el of document.body.querySelectorAll<HTMLElement>('*')) {
    if (drawn >= MAX_RECTS) break
    const media = MEDIA.test(el.tagName)
    // leaves only: nested wrappers all paint the same region and the map turns into
    // one solid block. A leaf is the paragraph, link, or image you'd actually navigate to.
    if (!media && (el.children.length || !el.textContent?.trim())) continue
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height) continue
    // client px -> layout px: undo the zoom transform and the scroll offset
    const w = r.width / scale
    const h = r.height / scale
    if (w * h < MIN_AREA) continue
    const v = getView()
    const p = toContent(r.left + v.x, r.top + v.y)
    g.fillStyle = media ? 'rgba(0,120,200,0.30)' : 'rgba(0,0,0,0.30)'
    g.fillRect(p.x * mapScale, p.y * mapScale, Math.max(1, w * mapScale), Math.max(1, h * mapScale))
    drawn++
  }
}

function updateLens() {
  const { scale } = getZoom()
  const v = getView()
  const x = v.x / scale
  const y = v.y / scale
  Object.assign(lens.style, {
    left: `${4 + x * mapScale}px`,
    top: `${4 + y * mapScale}px`,
    width: `${(window.innerWidth / scale) * mapScale}px`,
    height: `${(window.innerHeight / scale) * mapScale}px`,
  })
}

function scheduleLens() {
  if (!box || raf) return
  raf = requestAnimationFrame(() => {
    raf = 0
    updateLens()
  })
}

/**
 * Reactive pages rewrite their content while zoomed — new results, an expanded
 * accordion, lazy-loaded images. Redraw when that happens, and re-measure first
 * because the page's layout size usually changed with it.
 */
function startWatching() {
  if (watcher) return
  watcher = new MutationObserver((records) => {
    // zoom writes inline styles on body and on the elements it seats; redrawing on
    // those would retrigger the measure that wrote them, looping forever
    if (!records.some((r) => !isOwnMutation(r))) return
    clearTimeout(redrawTimer)
    redrawTimer = window.setTimeout(redraw, REDRAW_DEBOUNCE_MS)
  })
  watcher.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['style', 'class', 'hidden', 'src'],
  })
}

function redraw() {
  if (!box || box.style.display === 'none') return
  refreshLayout() // content changed, so the page is probably a different size now
  drawSkeleton()
  updateLens()
}

function show() {
  if (!box) build()
  box!.style.display = ''
  redraw()
  startWatching()
}

function hide() {
  if (box) box.style.display = 'none'
  clearTimeout(redrawTimer)
  watcher?.disconnect()
  watcher = null
}

export function initMinimap() {
  onZoomChange((scale) => {
    if (scale > 1 && settings.minimap) {
      if (!box || box.style.display === 'none') show()
      else updateLens()
    } else hide()
  })
  window.addEventListener('scroll', scheduleLens, { passive: true })
  onViewChange(scheduleLens) // lens-pan engine: the document never scrolls
  window.addEventListener('resize', redraw)
}
