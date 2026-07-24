/**
 * UniLens capture core — ported from example-of-track-and-screenshot/unilens-capture.js.
 * Tracks mouse trace, captures a full-page screenshot with html2canvas,
 * overlays viewport rect + mouse trace + click crosshair, returns PNG + metadata.
 */
import html2canvas from 'html2canvas'
import { getZoom, toContent } from './zoom'

export interface TracePoint {
  x: number
  y: number
  t: number
}

export interface CaptureMeta {
  clickX: number
  clickY: number
  scrollX: number
  scrollY: number
  viewportW: number
  viewportH: number
  pageW: number
  pageH: number
  dpr: number
  pinchZoom: number
  zoom: number
  scrollDepth: number
  url: string
  timestamp: string
  trace: TracePoint[]
}

export interface CaptureResult {
  /** annotated full-page screenshot as PNG data URL */
  image: string
  meta: CaptureMeta
}

// ── Mouse trace state ──────────────────────────────────────────────────────
let trace: TracePoint[] = []
let traceBuffer = 5000
let traceWindowSec = 2.5
let tracking = false

function onMouseMove(e: MouseEvent) {
  const p = toContent(e.pageX, e.pageY) // content space: aligns with unzoomed screenshot
  trace.push({ x: p.x, y: p.y, t: Date.now() })
  if (trace.length > traceBuffer) trace.splice(0, trace.length - traceBuffer)
}

export function startTrace(windowSec = 2.5, buffer = 5000) {
  traceWindowSec = windowSec
  traceBuffer = buffer
  if (!tracking) {
    document.addEventListener('mousemove', onMouseMove, { passive: true })
    tracking = true
  }
}

function recentTrace(atTime: number): TracePoint[] {
  const cutoff = atTime - traceWindowSec * 1000
  return trace.filter((p) => p.t >= cutoff)
}

// ── object-fit preprocessing ───────────────────────────────────────────────
// html2canvas mishandles object-fit images; swap them for pre-clipped canvases.
function parsePosition(val: string | undefined, elSize: number): number {
  if (!val) return elSize / 2
  if (val === 'left' || val === 'top') return 0
  if (val === 'right' || val === 'bottom') return elSize
  if (val === 'center') return elSize / 2
  if (val.endsWith('%')) return (parseFloat(val) / 100) * elSize
  return parseFloat(val) || elSize / 2
}

async function preprocessImages(): Promise<() => void> {
  const swaps: { img: HTMLImageElement; canvas: HTMLCanvasElement }[] = []

  await Promise.all(
    [...document.querySelectorAll('img')].map(
      (img) =>
        new Promise<void>((resolve) => {
          const style = getComputedStyle(img)
          const objectFit = style.objectFit
          if (!['cover', 'contain', 'fill', 'scale-down'].includes(objectFit)) return resolve()
          if (!img.src) return resolve()

          const rect = img.getBoundingClientRect()
          const zs = getZoom().scale // rect is in zoomed px; clone renders unzoomed
          const elW = rect.width / zs
          const elH = rect.height / zs
          if (elW === 0 || elH === 0) return resolve()

          const corsImg = new Image()
          corsImg.crossOrigin = 'anonymous'

          corsImg.onload = () => {
            const natW = corsImg.naturalWidth
            const natH = corsImg.naturalHeight
            if (natW === 0 || natH === 0) return resolve()

            const posParts = (style.objectPosition || '50% 50%').split(' ')
            const posX = parsePosition(posParts[0], elW)
            const posY = parsePosition(posParts[1] ?? posParts[0], elH)
            const scaleW = elW / natW
            const scaleH = elH / natH

            const c = document.createElement('canvas')
            c.width = elW
            c.height = elH
            c.style.cssText = img.style.cssText
            c.style.width = elW + 'px'
            c.style.height = elH + 'px'
            c.style.borderRadius = style.borderRadius
            c.style.display = style.display
            c.style.margin = style.margin
            c.style.verticalAlign = style.verticalAlign
            const cx = c.getContext('2d')!

            if (objectFit === 'cover') {
              const s = Math.max(scaleW, scaleH)
              const sw = elW / s
              const sh = elH / s
              const sx = (posX * (natW - sw)) / elW
              const sy = (posY * (natH - sh)) / elH
              cx.drawImage(corsImg, sx, sy, sw, sh, 0, 0, elW, elH)
            } else if (objectFit === 'contain' || objectFit === 'scale-down') {
              const s = Math.min(scaleW, scaleH)
              const dw = natW * s
              const dh = natH * s
              const dx = (elW - dw) * (posX / elW)
              const dy = (elH - dh) * (posY / elH)
              cx.drawImage(corsImg, 0, 0, natW, natH, dx, dy, dw, dh)
            } else {
              cx.drawImage(corsImg, 0, 0, elW, elH)
            }

            swaps.push({ img, canvas: c })
            img.parentNode!.insertBefore(c, img)
            img.style.display = 'none'
            resolve()
          }

          corsImg.onerror = () => resolve()
          corsImg.src = img.src
        }),
    ),
  )

  return () =>
    swaps.forEach(({ img, canvas }) => {
      img.style.display = ''
      canvas.remove()
    })
}

// ── Core capture ───────────────────────────────────────────────────────────
export async function capture(clickX: number, clickY: number): Promise<CaptureResult> {
  const captureTime = Date.now()

  const vvp = window.visualViewport
  const dpr = window.devicePixelRatio || 1
  const vpW = vvp ? vvp.width : window.innerWidth
  const vpH = vvp ? vvp.height : window.innerHeight
  const vvpOffsetX = vvp ? vvp.offsetLeft : 0
  const vvpOffsetY = vvp ? vvp.offsetTop : 0
  const pinchZoom = vvp ? Math.round((vvp.scale ?? 1) * 100) / 100 : 1
  const scrollX = window.scrollX
  const scrollY = window.scrollY
  const zoom = getZoom()
  const z = zoom.scale
  const pageW = zoom.layoutW // unzoomed layout size — the screenshot is rendered without the zoom transform
  const pageH = zoom.layoutH

  const restore = await preprocessImages()

  const captureScale = Math.min(dpr, 2) * 0.5
  let pageCanvas: HTMLCanvasElement
  try {
    pageCanvas = await html2canvas(document.body, {
      scrollX: 0,
      scrollY: 0,
      width: pageW,
      height: pageH,
      windowWidth: pageW,
      windowHeight: pageH,
      useCORS: true,
      allowTaint: true,
      scale: captureScale,
      onclone: (doc) => {
        doc.body.style.transform = '' // render at zoom 1 — overlays are in content space
      },
    })
  } finally {
    restore()
  }

  const scale = pageCanvas.width / pageW
  const ctx = pageCanvas.getContext('2d')!
  ctx.setTransform(1, 0, 0, 1, 0, 0) // html2canvas leaves its render scale applied

  // Viewport rect in content space: when zoomed in, the visible region of the
  // unzoomed page is smaller by 1/z (accounts for pinch-zoom offset too)
  const vpRect = {
    x: ((scrollX + vvpOffsetX) / z) * scale,
    y: ((scrollY + vvpOffsetY) / z) * scale,
    w: (vpW / z) * scale,
    h: (vpH / z) * scale,
  }
  ctx.strokeStyle = 'rgba(0,200,255,0.9)'
  ctx.lineWidth = 3
  ctx.strokeRect(vpRect.x, vpRect.y, vpRect.w, vpRect.h)
  ctx.fillStyle = 'rgba(0,200,255,0.08)'
  ctx.fillRect(vpRect.x, vpRect.y, vpRect.w, vpRect.h)

  // Mouse trace: fading line, oldest faint → newest bright
  const recent = recentTrace(captureTime)
  if (recent.length >= 2) {
    const oldest = recent[0].t
    const newest = recent[recent.length - 1].t
    const span = Math.max(newest - oldest, 1)

    for (let i = 1; i < recent.length; i++) {
      const p0 = recent[i - 1]
      const p1 = recent[i]
      const age = (p1.t - oldest) / span
      ctx.beginPath()
      ctx.moveTo(p0.x * scale, p0.y * scale)
      ctx.lineTo(p1.x * scale, p1.y * scale)
      ctx.strokeStyle = `rgba(255, 187, 0, ${(0.15 + age * 0.75).toFixed(2)})`
      ctx.lineWidth = (1 + age * 5) * scale
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
    }
  }

  // Click crosshair
  const cx = clickX * scale
  const cy = clickY * scale
  ctx.strokeStyle = '#ff4444'
  ctx.lineWidth = 2.5
  ctx.setLineDash([4, 3])
  ctx.beginPath()
  ctx.moveTo(0, cy)
  ctx.lineTo(pageCanvas.width, cy)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx, 0)
  ctx.lineTo(cx, pageCanvas.height)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.arc(cx, cy, 18 * scale, 0, Math.PI * 2)
  ctx.strokeStyle = '#ff4444'
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(cx, cy, 4 * scale, 0, Math.PI * 2)
  ctx.fillStyle = '#ff4444'
  ctx.fill()

  const scrollDepth = Math.round((scrollY / Math.max(pageH * z - vpH, 1)) * 100)

  return {
    image: pageCanvas.toDataURL('image/png'),
    meta: {
      clickX,
      clickY,
      scrollX,
      scrollY,
      viewportW: Math.round(vpW),
      viewportH: Math.round(vpH),
      pageW,
      pageH,
      dpr,
      pinchZoom,
      zoom: Math.round(z * 100) / 100,
      scrollDepth,
      url: location.href,
      timestamp: new Date().toISOString(),
      trace: recent,
    },
  }
}
