/**
 * UniLens capture core.
 * Tracks mouse trace, captures a full-page screenshot with html2canvas,
 * overlays viewport rect + mouse trace + click crosshair, returns PNG + metadata.
 */
import html2canvas from "html2canvas";
import { getSettings } from "./settings";
import {
    clientToContent,
    getView,
    getZoom,
    getZoomTrace,
    stripFixedPins,
    type ZoomEvent,
} from "./zoom";

export interface TracePoint {
    x: number;
    y: number;
    t: number;
}

export interface CaptureMeta {
    clickX: number;
    clickY: number;
    scrollX: number;
    scrollY: number;
    viewportW: number;
    viewportH: number;
    pageW: number;
    pageH: number;
    dpr: number;
    pinchZoom: number;
    zoom: number;
    scrollDepth: number;
    url: string;
    timestamp: string;
    trace: TracePoint[];
    /** recent ctrl+wheel zoom events — where the user zoomed in/out lately */
    zoomTrace: ZoomEvent[];
    /** content-space rect of the visible region (what viewportImage shows) */
    viewportRect: { x: number; y: number; w: number; h: number };
    /** the DOM element under the alt+click, if enabled */
    element?: ElementContext;
    /** content-space rect the user selected via alt+drag, if any */
    region?: { x: number; y: number; w: number; h: number };
}

export interface ElementContext {
    tag: string;
    id?: string;
    classes?: string;
    role?: string;
    /** visible text of the element (capped) */
    text?: string;
    /** alt text when the element is an image */
    alt?: string;
    /** href when the element is inside a link */
    href?: string;
    /** short ancestor path, e.g. "table > tbody > tr > td" */
    path: string;
    /** text of the nearest heading before this element */
    nearestHeading?: string;
}

export function describeElement(el: Element): ElementContext {
    const cap = (s: string | null | undefined, n = 200) => {
        const t = s?.replace(/\s+/g, " ").trim();
        return t ? (t.length > n ? `${t.slice(0, n)}…` : t) : undefined;
    };

    const path = [];
    let node: Element | null = el;
    for (
        let i = 0;
        node && node !== document.body && i < 4;
        i++, node = node.parentElement
    ) {
        path.unshift(node.tagName.toLowerCase());
    }

    let heading: string | undefined;
    const headings = document.querySelectorAll("h1,h2,h3,h4,h5,h6");
    for (const h of headings) {
        if (h.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)
            heading = cap(h.textContent, 120);
        else break;
    }

    return {
        tag: el.tagName.toLowerCase(),
        id: el.id || undefined,
        classes: cap(el.getAttribute("class"), 80),
        role: el.getAttribute("role") ?? undefined,
        text: cap(el.textContent),
        alt: el instanceof HTMLImageElement ? cap(el.alt, 120) : undefined,
        href: (el.closest("a") as HTMLAnchorElement | null)?.href,
        path: path.join(" > "),
        nearestHeading: heading,
    };
}

export interface CaptureResult {
    /** annotated full-page screenshot as PNG data URL */
    image: string;
    /** clean full-resolution crop of what the user currently sees (zoom-aware), if enabled */
    viewportImage?: string;
    meta: CaptureMeta;
}

// ── Mouse trace state ──────────────────────────────────────────────────────
const trace: TracePoint[] = [];
let traceBuffer = 5000;
let traceWindowSec = 2.5;
let tracking = false;

function onMouseMove(e: MouseEvent) {
    if (!getSettings().mouseTrace) return;
    // content space: aligns with the unzoomed screenshot under either pan engine
    const p = clientToContent(e.clientX, e.clientY);
    trace.push({ x: p.x, y: p.y, t: Date.now() });
    if (trace.length > traceBuffer) trace.splice(0, trace.length - traceBuffer);
}

// ── Debug instrumentation ──────────────────────────────────────────────────
export interface CaptureDebug {
    id?: string;
    at: number;
    timings: {
        preprocess: number;
        render: number;
        encode: number;
        total: number;
    };
    pageW: number;
    pageH: number;
    images: number;
    sizes: { pageKB: number; closeupKB: number };
}

let lastCaptureDebug: CaptureDebug | null = null;

export const getCaptureDebug = () => lastCaptureDebug;

/** main.tsx tags the backend id once the upload completes */
export function tagLastCapture(id: string) {
    if (lastCaptureDebug) lastCaptureDebug.id = id;
}

export function getTraceDebug() {
    return {
        buffer: trace.length,
        window: recentTrace(Date.now()),
        windowSec: traceWindowSec,
    };
}

export function startTrace(windowSec = 2.5, buffer = 5000) {
    traceWindowSec = windowSec;
    traceBuffer = buffer;
    if (!tracking) {
        document.addEventListener("mousemove", onMouseMove, { passive: true });
        tracking = true;
    }
}

function recentTrace(atTime: number): TracePoint[] {
    const cutoff = atTime - traceWindowSec * 1000;
    return trace.filter((p) => p.t >= cutoff);
}

// ── object-fit preprocessing ───────────────────────────────────────────────
// html2canvas mishandles object-fit images; swap them for pre-clipped canvases.
function parsePosition(val: string | undefined, elSize: number): number {
    if (!val) return elSize / 2;
    if (val === "left" || val === "top") return 0;
    if (val === "right" || val === "bottom") return elSize;
    if (val === "center") return elSize / 2;
    if (val.endsWith("%")) return (parseFloat(val) / 100) * elSize;
    return parseFloat(val) || elSize / 2;
}

export interface ImageFix {
    el: HTMLImageElement;
    /** the image pre-cropped to its element box, ready to drop into the clone */
    dataUrl: string;
}

async function preprocessImages(): Promise<ImageFix[]> {
    const fixes: ImageFix[] = [];

    await Promise.all(
        [...document.querySelectorAll("img")].map(
            (img) =>
                new Promise<void>((resolve) => {
                    const style = getComputedStyle(img);
                    const objectFit = style.objectFit;
                    // 'fill' stretches the image to its box, which is what html2canvas does
                    // natively — only the cropping fits need correcting
                    if (!["cover", "contain", "scale-down"].includes(objectFit))
                        return resolve();
                    if (!img.src) return resolve();

                    const rect = img.getBoundingClientRect();
                    const zs = getZoom().scale; // rect is in zoomed px; clone renders unzoomed
                    const elW = rect.width / zs;
                    const elH = rect.height / zs;
                    if (elW === 0 || elH === 0) return resolve();

                    const corsImg = new Image();
                    corsImg.crossOrigin = "anonymous";

                    corsImg.onload = () => {
                        const natW = corsImg.naturalWidth;
                        const natH = corsImg.naturalHeight;
                        if (natW === 0 || natH === 0) return resolve();

                        const posParts = (
                            style.objectPosition || "50% 50%"
                        ).split(" ");
                        const posX = parsePosition(posParts[0], elW);
                        const posY = parsePosition(
                            posParts[1] ?? posParts[0],
                            elH,
                        );
                        const scaleW = elW / natW;
                        const scaleH = elH / natH;

                        const c = document.createElement("canvas");
                        c.width = elW;
                        c.height = elH;
                        const cx = c.getContext("2d")!;

                        if (objectFit === "cover") {
                            const s = Math.max(scaleW, scaleH);
                            const sw = elW / s;
                            const sh = elH / s;
                            const sx = (posX * (natW - sw)) / elW;
                            const sy = (posY * (natH - sh)) / elH;
                            cx.drawImage(
                                corsImg,
                                sx,
                                sy,
                                sw,
                                sh,
                                0,
                                0,
                                elW,
                                elH,
                            );
                        } else if (
                            objectFit === "contain" ||
                            objectFit === "scale-down"
                        ) {
                            const s = Math.min(scaleW, scaleH);
                            const dw = natW * s;
                            const dh = natH * s;
                            const dx = (elW - dw) * (posX / elW);
                            const dy = (elH - dh) * (posY / elH);
                            cx.drawImage(
                                corsImg,
                                0,
                                0,
                                natW,
                                natH,
                                dx,
                                dy,
                                dw,
                                dh,
                            );
                        } else {
                            cx.drawImage(corsImg, 0, 0, elW, elH);
                        }

                        fixes.push({ el: img, dataUrl: c.toDataURL() });
                        resolve();
                    };

                    corsImg.onerror = () => resolve();
                    corsImg.src = img.src;
                }),
        ),
    );

    return fixes;
}

// ── Core capture ───────────────────────────────────────────────────────────
export async function capture(
    clickX: number,
    clickY: number,
    clickedEl?: Element,
    region?: { x: number; y: number; w: number; h: number },
): Promise<CaptureResult> {
    const captureTime = Date.now();

    const vvp = window.visualViewport;
    const dpr = window.devicePixelRatio || 1;
    const vpW = vvp ? vvp.width : window.innerWidth;
    const vpH = vvp ? vvp.height : window.innerHeight;
    const vvpOffsetX = vvp ? vvp.offsetLeft : 0;
    const vvpOffsetY = vvp ? vvp.offsetTop : 0;
    const pinchZoom = vvp ? Math.round((vvp.scale ?? 1) * 100) / 100 : 1;
    // the lens offset, which is document scroll or transform pan depending on the engine
    const { x: scrollX, y: scrollY } = getView();
    const zoom = getZoom();
    const z = zoom.scale;
    const pageW = zoom.layoutW; // unzoomed layout size — the screenshot is rendered without the zoom transform
    const pageH = zoom.layoutH;

    const t0 = performance.now();
    // Read-only: the correction is applied to the clone, never to the live page.
    // Swapping elements here reflows the real layout mid-capture (measured at +8800px
    // on a page with an open accordion), which jumps the user's view and leaves the
    // click marker pointing at whatever moved into its place.
    const imageFixes = await preprocessImages();
    imageFixes.forEach((f, i) => {
        f.el.dataset.unilensImg = String(i);
    });
    const tPre = performance.now();

    // Close-up source: the alt+drag selection if given, else the visible region
    // in content space (what the user actually sees, zoom-aware)
    const vRect = region
        ? {
              x: Math.max(0, Math.round(region.x)),
              y: Math.max(0, Math.round(region.y)),
              w: Math.max(1, Math.min(pageW, Math.round(region.w))),
              h: Math.max(1, Math.min(pageH, Math.round(region.h))),
          }
        : {
              x: Math.max(0, Math.round((scrollX + vvpOffsetX) / z)),
              y: Math.max(0, Math.round((scrollY + vvpOffsetY) / z)),
              w: Math.min(pageW, Math.round(vpW / z)),
              h: Math.min(pageH, Math.round(vpH / z)),
          };

    const stripZoom = (doc: Document) => {
        doc.body.style.transform = ""; // render at zoom 1 — coords are content space
        doc.documentElement.style.height = "";
        stripFixedPins(doc); // pins compensate for that transform; without it they'd offset the render
        // swap in the pre-cropped bitmaps. The element stays put and keeps every CSS rule
        // that matched it, so only its pixels change — no reflow, here or on the live page.
        for (const el of doc.querySelectorAll<HTMLImageElement>(
            "[data-unilens-img]",
        )) {
            const fix = imageFixes[Number(el.dataset.unilensImg)];
            el.removeAttribute("data-unilens-img");
            if (!fix) continue;
            el.src = fix.dataUrl;
            el.style.objectFit = "fill"; // already cropped to the box, so draw it 1:1
        }
    };

    // Single render at the configured resolution (1 = screen res). Both outputs
    // (annotated page + close-up crop) derive from this one canvas — html2canvas
    // clone+parse dominates capture time, so we only pay it once.
    // 24MP canvas cap guards very long pages; switch to tiled rendering if it ever bites
    let captureScale = getSettings().captureRes;
    const MAX_PIXELS = 24_000_000;
    if (pageW * pageH * captureScale * captureScale > MAX_PIXELS) {
        captureScale = Math.sqrt(MAX_PIXELS / (pageW * pageH));
    }

    let pageCanvas: HTMLCanvasElement;
    let viewportImage: string | undefined;
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
            onclone: stripZoom,
        });
    } finally {
        for (const f of imageFixes) delete f.el.dataset.unilensImg;
    }
    const tRender = performance.now();
    console.debug(
        `[UniLens] timings: preprocess ${(tPre - t0).toFixed(0)}ms, render ${(tRender - tPre).toFixed(0)}ms`,
    );

    if (getSettings().viewportCrop) {
        // Crop the visible region from the render BEFORE overlays are drawn —
        // a clean close-up of exactly what the user is examining.
        const s = pageCanvas.width / pageW;
        const crop = document.createElement("canvas");
        crop.width = Math.max(1, Math.round(vRect.w * s));
        crop.height = Math.max(1, Math.round(vRect.h * s));
        crop.getContext("2d")?.drawImage(
            pageCanvas,
            vRect.x * s,
            vRect.y * s,
            vRect.w * s,
            vRect.h * s,
            0,
            0,
            crop.width,
            crop.height,
        );
        viewportImage = crop.toDataURL("image/png");
    }

    const scale = pageCanvas.width / pageW;
    const ctx = pageCanvas.getContext("2d")!;
    ctx.setTransform(1, 0, 0, 1, 0, 0); // html2canvas leaves its render scale applied

    // Viewport rect in content space: when zoomed in, the visible region of the
    // unzoomed page is smaller by 1/z (accounts for pinch-zoom offset too)
    const vpRect = {
        x: ((scrollX + vvpOffsetX) / z) * scale,
        y: ((scrollY + vvpOffsetY) / z) * scale,
        w: (vpW / z) * scale,
        h: (vpH / z) * scale,
    };
    ctx.strokeStyle = "rgba(0,200,255,0.9)";
    ctx.lineWidth = 3;
    ctx.strokeRect(vpRect.x, vpRect.y, vpRect.w, vpRect.h);
    ctx.fillStyle = "rgba(0,200,255,0.08)";
    ctx.fillRect(vpRect.x, vpRect.y, vpRect.w, vpRect.h);

    // Mouse trace: fading line, oldest faint → newest bright
    const recent = recentTrace(captureTime);
    if (recent.length >= 2) {
        const oldest = recent[0].t;
        const newest = recent[recent.length - 1].t;
        const span = Math.max(newest - oldest, 1);

        for (let i = 1; i < recent.length; i++) {
            const p0 = recent[i - 1];
            const p1 = recent[i];
            const age = (p1.t - oldest) / span;
            ctx.beginPath();
            ctx.moveTo(p0.x * scale, p0.y * scale);
            ctx.lineTo(p1.x * scale, p1.y * scale);
            ctx.strokeStyle = `rgba(255, 187, 0, ${(0.15 + age * 0.75).toFixed(2)})`;
            ctx.lineWidth = (1 + age * 5) * scale;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.stroke();
        }
    }

    // Alt+drag selection rect (magenta, distinct from viewport cyan)
    if (region) {
        ctx.strokeStyle = "rgba(255, 0, 200, 0.95)";
        ctx.lineWidth = 3;
        ctx.strokeRect(
            vRect.x * scale,
            vRect.y * scale,
            vRect.w * scale,
            vRect.h * scale,
        );
        ctx.fillStyle = "rgba(255, 0, 200, 0.08)";
        ctx.fillRect(
            vRect.x * scale,
            vRect.y * scale,
            vRect.w * scale,
            vRect.h * scale,
        );
    }

    // Click crosshair
    const cx = clickX * scale;
    const cy = clickY * scale;
    ctx.strokeStyle = "#ff4444";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(pageCanvas.width, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, pageCanvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(cx, cy, 18 * scale, 0, Math.PI * 2);
    ctx.strokeStyle = "#ff4444";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 4 * scale, 0, Math.PI * 2);
    ctx.fillStyle = "#ff4444";
    ctx.fill();

    const scrollDepth = Math.round(
        (scrollY / Math.max(pageH * z - vpH, 1)) * 100,
    );

    const tEnc = performance.now();
    const image = pageCanvas.toDataURL("image/png");
    const tDone = performance.now();
    console.debug(
        `[UniLens] timings: overlays+encode ${(tDone - tEnc).toFixed(0)}ms, total ${(tDone - t0).toFixed(0)}ms`,
    );

    lastCaptureDebug = {
        at: Date.now(),
        timings: {
            preprocess: Math.round(tPre - t0),
            render: Math.round(tRender - tPre),
            encode: Math.round(tDone - tEnc),
            total: Math.round(tDone - t0),
        },
        pageW,
        pageH,
        images: viewportImage ? 2 : 1,
        sizes: {
            pageKB: Math.round((image.length * 0.75) / 1024), // base64 → bytes
            closeupKB: viewportImage
                ? Math.round((viewportImage.length * 0.75) / 1024)
                : 0,
        },
    };

    return {
        image,
        viewportImage,
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
            zoomTrace: getZoomTrace(captureTime),
            viewportRect: vRect,
            element:
                getSettings().elementContext && clickedEl
                    ? describeElement(clickedEl)
                    : undefined,
            region: region ? vRect : undefined,
        },
    };
}
