/**
 * Scale host-page text without scaling images.
 *
 * Page font-size used to `zoom` the whole <body>, which also grew photos,
 * video, and CSS background plates. This module writes font-size on text
 * nodes instead: px / rem / em copy all multiply by the same factor, while
 * replaced content keeps its host layout size.
 */

import {
    BODY_EXPAND_ORIGINAL_ATTR,
    HTML_STYLE_FONT_SCALE,
    isUniLensOverlayNode,
    PAGE_CONTENT_ROOT_ID,
    PAGE_FONT_ATTR,
    PAGE_FONT_CAP_SCALE_ATTR,
    PAGE_FONT_CAP_VAR,
    PAGE_FONT_CLASS,
    PAGE_FONT_ORIGINAL_ATTR,
    PAGE_FONT_STYLE_ID,
    PAGE_FONT_TARGET_VAR,
    SELECTION_RESIZE_ATTR,
    SMALL_BOOST_ORIGINAL_ATTR,
} from "./domIds";
import { scaledFontPx } from "./fontScales";
import { restoreHostInlineStyle, setHostInlineStyle } from "./hostSurface";
import {
    collectOverlapNeighbors,
    isOutOfFlowPositioned,
    resolvePageFontCap,
} from "./overlapSafeScale";

/** Replaced / non-text nodes — changing font-size here cannot help reading. */
export const PAGE_FONT_SKIP_TAGS = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "META",
    "LINK",
    "HEAD",
    "BR",
    "WBR",
    "HR",
    "IMG",
    "PICTURE",
    "SOURCE",
    "VIDEO",
    "AUDIO",
    "CANVAS",
    "SVG",
    "PATH",
    "IFRAME",
    "OBJECT",
    "EMBED",
    "TRACK",
    "MAP",
    "AREA",
]);

export function isPageFontSkipTag(tagName: string): boolean {
    return PAGE_FONT_SKIP_TAGS.has(tagName.toUpperCase());
}

/**
 * Out-of-flow (and overlay-adjacent) text used to share a flat 1.3× ceiling.
 * That made "large" and "extra-large" look identical on tabs/headers, and
 * the CSS variable inherited so in-flow children of a `position:fixed`
 * header were capped too. Each node now writes its own cap: full panel
 * scale unless measuring neighbors shows overlap, in which case
 * `maxSafeScale` stops just short of the collision.
 */
export { isOutOfFlowPositioned };

export function computeScaledFontPx(originalPx: number, scale: number): number {
    return scaledFontPx(originalPx, scale);
}

const PAGE_FONT_CSS = `
[${PAGE_FONT_ATTR}="true"].${PAGE_FONT_CLASS} {
  font-size: calc(var(${PAGE_FONT_TARGET_VAR}) * min(var(${HTML_STYLE_FONT_SCALE}, 1), var(${PAGE_FONT_CAP_VAR}, 999))) !important;
}
`;

export interface PageFontScanResult {
    scanned: number;
    scaled: number;
}

let fontSizeScale = 1;
let extraScale = 1;
let lastScan: PageFontScanResult = { scanned: 0, scaled: 0 };
let observer: MutationObserver | null = null;
let rescanTimer: number | undefined;
let pageFontActive = false;

export function getEffectivePageFontScale(): number {
    const n = fontSizeScale * extraScale;
    if (!Number.isFinite(n) || n <= 0) return 1;
    return Math.round(n * 100) / 100;
}

function ensureStylesheet() {
    if (
        typeof document === "undefined" ||
        document.getElementById(PAGE_FONT_STYLE_ID)
    )
        return;
    const style = document.createElement("style");
    style.id = PAGE_FONT_STYLE_ID;
    style.textContent = PAGE_FONT_CSS;
    document.head?.appendChild(style);
}

export function shouldSkipPageFontElement(el: Element): boolean {
    if (!(el instanceof HTMLElement)) return true;
    if (isUniLensOverlayNode(el)) return true;
    if (el.hasAttribute(SELECTION_RESIZE_ATTR)) return true;
    if (isPageFontSkipTag(el.tagName)) return true;
    if (el.id === PAGE_CONTENT_ROOT_ID) return true;
    if (el.tagName === "INPUT" && (el as HTMLInputElement).type === "image")
        return true;
    return false;
}

function readOriginalPx(el: HTMLElement, scale: number): number {
    for (const attr of [
        PAGE_FONT_ORIGINAL_ATTR,
        BODY_EXPAND_ORIGINAL_ATTR,
        SMALL_BOOST_ORIGINAL_ATTR,
    ]) {
        const stored = el.getAttribute(attr);
        if (!stored) continue;
        const parsed = parseFloat(stored);
        if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    const computed = parseFloat(getComputedStyle(el).fontSize);
    if (!Number.isFinite(computed) || computed <= 0) return computed;
    // New nodes under an already-scaled ancestor inherit a scaled computed size.
    if (
        scale !== 1 &&
        el.parentElement?.closest(`[${PAGE_FONT_ATTR}="true"]`)
    ) {
        return Math.round((computed / scale) * 100) / 100;
    }
    return computed;
}

/** Host font-size before page-wide scale — same baseline selection resize uses. */
export function readUnscaledFontSizePx(el: HTMLElement): number {
    const n = readOriginalPx(el, getEffectivePageFontScale());
    return Number.isFinite(n) && n > 0 ? n : 16;
}

/**
 * In-flow descendants of a `position:fixed` header (nav tabs) must not
 * inherit that header's tighter cap — CSS variables inherit. Only the
 * out-of-flow node itself is measured against in-flow siblings.
 */
function pageFontCapNeighbors(el: HTMLElement) {
    if (!isOutOfFlowPositioned(el)) return [];
    return collectOverlapNeighbors(el);
}

function capAgainstNeighbors(el: HTMLElement, desiredScale: number): number {
    try {
        return resolvePageFontCap(
            desiredScale,
            pageFontCapNeighbors(el),
            (trial) => {
                setHostInlineStyle(el, PAGE_FONT_CAP_VAR, String(trial));
                return el.getBoundingClientRect();
            },
        );
    } catch {
        // Measurement can fail on detached / unusual host nodes. Grow fully
        // rather than falling back to a flat 1.3× ceiling.
        return desiredScale;
    }
}

function applyScale(el: HTMLElement, originalPx: number, desiredScale: number) {
    el.setAttribute(PAGE_FONT_ATTR, "true");
    el.setAttribute(
        PAGE_FONT_ORIGINAL_ATTR,
        String(Math.round(originalPx * 100) / 100),
    );
    el.setAttribute(PAGE_FONT_CAP_SCALE_ATTR, String(desiredScale));
    el.classList.add(PAGE_FONT_CLASS);
    setHostInlineStyle(el, PAGE_FONT_TARGET_VAR, `${originalPx}px`);
    setHostInlineStyle(
        el,
        PAGE_FONT_CAP_VAR,
        String(capAgainstNeighbors(el, desiredScale)),
    );
}

function restoreElement(el: HTMLElement) {
    el.removeAttribute(PAGE_FONT_ATTR);
    el.removeAttribute(PAGE_FONT_ORIGINAL_ATTR);
    el.removeAttribute(PAGE_FONT_CAP_SCALE_ATTR);
    el.classList.remove(PAGE_FONT_CLASS);
    restoreHostInlineStyle(el, PAGE_FONT_TARGET_VAR);
    restoreHostInlineStyle(el, PAGE_FONT_CAP_VAR);
}

function writeScaleVar(scale: number) {
    const html = document.documentElement;
    if (!(html instanceof HTMLElement)) return;
    setHostInlineStyle(html, HTML_STYLE_FONT_SCALE, String(scale));
}

export function scanPageFont(
    root: Element = document.body,
): PageFontScanResult {
    const result: PageFontScanResult = { scanned: 0, scaled: 0 };
    const scale = getEffectivePageFontScale();
    if (scale === 1 || !document.body) return result;

    const nodes: Element[] = [root, ...Array.from(root.querySelectorAll("*"))];
    const batch: { el: HTMLElement; originalPx: number }[] = [];

    for (const el of nodes) {
        if (shouldSkipPageFontElement(el) || !(el instanceof HTMLElement))
            continue;
        result.scanned++;
        const originalPx = readOriginalPx(el, scale);
        if (!Number.isFinite(originalPx) || originalPx <= 0) continue;
        const prev = el.style.getPropertyValue(PAGE_FONT_TARGET_VAR);
        if (
            el.getAttribute(PAGE_FONT_ATTR) === "true" &&
            prev === `${originalPx}px` &&
            el.getAttribute(PAGE_FONT_ORIGINAL_ATTR) ===
                String(Math.round(originalPx * 100) / 100) &&
            el.getAttribute(PAGE_FONT_CAP_SCALE_ATTR) === String(scale)
        ) {
            continue;
        }
        batch.push({ el, originalPx });
    }

    for (const { el, originalPx } of batch) {
        applyScale(el, originalPx, scale);
        result.scaled++;
    }

    lastScan = result;
    return result;
}

export function clearPageFontScale() {
    if (
        typeof document === "undefined" ||
        typeof document.querySelectorAll !== "function"
    )
        return;
    document.querySelectorAll(`[${PAGE_FONT_ATTR}="true"]`).forEach((node) => {
        if (node instanceof HTMLElement) restoreElement(node);
    });
    lastScan = { scanned: 0, scaled: 0 };
}

function scheduleRescan() {
    if (typeof window === "undefined") return;
    window.clearTimeout(rescanTimer);
    rescanTimer = window.setTimeout(() => {
        if (getEffectivePageFontScale() !== 1) scanPageFont();
    }, 300);
}

function startObserver() {
    if (observer || !document.body || typeof MutationObserver === "undefined")
        return;
    observer = new MutationObserver(() => {
        if (getEffectivePageFontScale() !== 1) scheduleRescan();
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

export function getLastPageFontScan(): PageFontScanResult {
    return lastScan;
}

export function refreshPageFontScale() {
    if (typeof document === "undefined" || !document.body) return;
    ensureStylesheet();
    startObserver();
    pageFontActive = true;
    const scale = getEffectivePageFontScale();
    writeScaleVar(scale);
    if (scale === 1) {
        clearPageFontScale();
        return;
    }
    scanPageFont();
}

/** Panel text-size choice (1 / 1.95 / 2.6). Combined with auto-text extra scale. */
export function setPageFontSizeScale(scale: number) {
    fontSizeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
    refreshPageFontScale();
}

/** Auto-text extra multiplier. 1 when that feature is off. */
export function setPageFontExtraScale(scale: number) {
    extraScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
    refreshPageFontScale();
}

export function initPageFontScale() {
    if (pageFontActive) return;
    pageFontActive = true;
    refreshPageFontScale();
}

export function destroyPageFontScale() {
    if (!pageFontActive && !observer) {
        extraScale = 1;
        fontSizeScale = 1;
        return;
    }
    pageFontActive = false;
    observer?.disconnect();
    observer = null;
    if (typeof window !== "undefined") window.clearTimeout(rescanTimer);
    extraScale = 1;
    fontSizeScale = 1;
    clearPageFontScale();
    if (
        typeof document !== "undefined" &&
        document.documentElement instanceof HTMLElement
    ) {
        restoreHostInlineStyle(document.documentElement, HTML_STYLE_FONT_SCALE);
    }
    if (typeof document !== "undefined")
        document.getElementById(PAGE_FONT_STYLE_ID)?.remove();
}
