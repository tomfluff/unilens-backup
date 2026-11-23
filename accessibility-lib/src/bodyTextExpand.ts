/**
 * Expand body / annotation text only — headings and text ≥18px are excluded.
 */
import { getA11ySettings } from "./accessibilityStore";
import { afterNextPaint } from "./afterPaint";
import {
    BODY_EXPAND_ATTR,
    BODY_EXPAND_CLASS,
    BODY_EXPAND_HTML_ATTR,
    BODY_EXPAND_LEVEL_ATTR,
    BODY_EXPAND_ORIGINAL_ATTR,
    BODY_EXPAND_TARGET_VAR,
    isUniLensOverlayNode,
} from "./domIds";
import { restoreHostInlineStyle, setHostInlineStyle } from "./hostSurface";
import { getEffectivePageFontScale } from "./pageFontScale";
import { useSettings } from "./settings";
import {
    bodyTextExpandConfig,
    computeBodyTextTargetPx,
    type TextAdjustLevel,
} from "./textAdjustLevels";
import {
    acquireTextSizeStyles,
    readOriginalFontPx,
    releaseTextSizeStyles,
} from "./textSizeLayers";

/** Text at or above this computed size is left unchanged. */
export const LARGE_TEXT_PX = 18;

const HEADING_TAGS = new Set(["H1", "H2", "H3", "H4", "H5", "H6"]);

const BODY_TEXT_TAGS = new Set([
    "P",
    "LI",
    "A",
    "SPAN",
    "TD",
    "LABEL",
    "DD",
    "DT",
    "FIGCAPTION",
    "SMALL",
    "LEGEND",
    "CAPTION",
    "BLOCKQUOTE",
    "BUTTON",
    "CITE",
    "TIME",
    "ADDRESS",
    "MARK",
    "ABBR",
    "Q",
    "EM",
    "STRONG",
    "B",
    "I",
    "U",
]);

const SKIP_TAGS = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "SVG",
    "PATH",
    "META",
    "LINK",
    "HEAD",
]);

export interface BodyTextScanResult {
    scanned: number;
    expanded: number;
}

let lastScan: BodyTextScanResult = { scanned: 0, expanded: 0 };
let observer: MutationObserver | null = null;
let rescanTimer: number | undefined;
let bodyTextActive = false;
let a11yUnsub: (() => void) | null = null;

function ensureStylesheet() {
    acquireTextSizeStyles("bodyExpand", (roots) => {
        if (!bodyTextActive || getA11ySettings().bodyTextExpandLevel < 1)
            return;
        if (roots) for (const root of roots) scanBodyText(root);
        else lastScan = scanBodyText();
    });
}

function isInsideHeading(el: Element): boolean {
    return el.closest("h1,h2,h3,h4,h5,h6") != null;
}

function shouldSkip(el: Element): boolean {
    if (!(el instanceof HTMLElement)) return true;
    if (isUniLensOverlayNode(el)) return true;
    if (SKIP_TAGS.has(el.tagName)) return true;
    if (HEADING_TAGS.has(el.tagName)) return true;
    if (isInsideHeading(el)) return true;
    if (!BODY_TEXT_TAGS.has(el.tagName)) return true;
    return false;
}

export function computeExpandedFontPx(
    originalPx: number,
    level: TextAdjustLevel = getA11ySettings().bodyTextExpandLevel,
): number {
    return computeBodyTextTargetPx(originalPx, level);
}

function readOriginalPx(el: HTMLElement): number {
    return readOriginalFontPx(el, getEffectivePageFontScale());
}

function applyExpand(
    el: HTMLElement,
    originalPx: number,
    level: TextAdjustLevel,
) {
    const targetPx = computeExpandedFontPx(originalPx, level);
    el.setAttribute(BODY_EXPAND_ATTR, "true");
    el.setAttribute(
        BODY_EXPAND_ORIGINAL_ATTR,
        String(Math.round(originalPx * 100) / 100),
    );
    el.classList.add(BODY_EXPAND_CLASS);
    setHostInlineStyle(el, BODY_EXPAND_TARGET_VAR, `${targetPx}px`);
}

function restoreElement(el: HTMLElement) {
    el.removeAttribute(BODY_EXPAND_ATTR);
    el.removeAttribute(BODY_EXPAND_ORIGINAL_ATTR);
    el.classList.remove(BODY_EXPAND_CLASS);
    restoreHostInlineStyle(el, BODY_EXPAND_TARGET_VAR);
}

export function scanBodyText(
    root: Element = document.body,
): BodyTextScanResult {
    const result: BodyTextScanResult = { scanned: 0, expanded: 0 };
    const level = getA11ySettings().bodyTextExpandLevel;
    if (level < 1 || !document.body) return result;

    const nodes: Element[] = [root, ...Array.from(root.querySelectorAll("*"))];

    // Read every original size before writing any: expanding a parent first
    // would make an inheriting child read the parent's enlarged size and get
    // expanded twice.
    const reads: { el: HTMLElement; px: number }[] = [];
    for (const el of nodes) {
        if (shouldSkip(el)) continue;
        if (!(el instanceof HTMLElement)) continue;
        result.scanned++;
        reads.push({ el, px: readOriginalPx(el) });
    }

    for (const { el, px } of reads) {
        if (!Number.isFinite(px) || px <= 0) continue;
        if (px >= LARGE_TEXT_PX) {
            if (el.getAttribute(BODY_EXPAND_ATTR) === "true")
                restoreElement(el);
            continue;
        }

        const targetPx = computeExpandedFontPx(px, level);
        const prevTarget = el.style.getPropertyValue(BODY_EXPAND_TARGET_VAR);
        if (
            el.getAttribute(BODY_EXPAND_ATTR) === "true" &&
            // A host re-render can overwrite `className` and drop our class.
            el.classList.contains(BODY_EXPAND_CLASS) &&
            prevTarget === `${targetPx}px` &&
            el.getAttribute(BODY_EXPAND_ORIGINAL_ATTR) ===
                String(Math.round(px * 100) / 100)
        ) {
            continue;
        }

        applyExpand(el, px, level);
        result.expanded++;
    }

    lastScan = result;
    return result;
}

export function clearBodyTextExpand() {
    document
        .querySelectorAll(`[${BODY_EXPAND_ATTR}="true"]`)
        .forEach((node) => {
            if (node instanceof HTMLElement) restoreElement(node);
        });
    document.documentElement.removeAttribute(BODY_EXPAND_HTML_ATTR);
    document.documentElement.removeAttribute(BODY_EXPAND_LEVEL_ATTR);
    lastScan = { scanned: 0, expanded: 0 };
}

function applyEnabledState() {
    ensureStylesheet();
    clearBodyTextExpand();
    const level = getA11ySettings().bodyTextExpandLevel;
    if (level > 0 && bodyTextExpandConfig(level)) {
        document.documentElement.setAttribute(BODY_EXPAND_HTML_ATTR, "true");
        document.documentElement.setAttribute(
            BODY_EXPAND_LEVEL_ATTR,
            String(level),
        );
        lastScan = scanBodyText();
    }
}

const scanListeners = new Set<() => void>();
let appliedCallbacks: (() => void)[] = [];

const deferredApply = afterNextPaint(() => {
    applyEnabledState();
    const callbacks = appliedCallbacks;
    appliedCallbacks = [];
    for (const cb of callbacks) cb();
    for (const listener of scanListeners) listener();
});

/** Notified after a level change has been applied to the page. */
export function onBodyTextScan(listener: () => void): () => void {
    scanListeners.add(listener);
    return () => {
        scanListeners.delete(listener);
    };
}

/**
 * Runs `cb` once the level just set has been applied to the page — after the
 * next paint when a change is pending, otherwise right away. Lets the panel
 * announce the final count without waiting inside the click.
 */
export function afterBodyTextApplied(cb: () => void) {
    if (deferredApply.pending) appliedCallbacks.push(cb);
    else cb();
}

function scheduleRescan() {
    clearTimeout(rescanTimer);
    rescanTimer = window.setTimeout(() => {
        if (getA11ySettings().bodyTextExpandLevel > 0) scanBodyText();
    }, 300);
}

function startObserver() {
    if (observer || !document.body) return;
    observer = new MutationObserver(() => {
        if (getA11ySettings().bodyTextExpandLevel > 0) scheduleRescan();
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

export function getLastBodyTextScan(): BodyTextScanResult {
    return lastScan;
}

/** The host replaced <body>: observe the new one and re-apply. */
export function rebindBodyTextExpand() {
    if (!bodyTextActive) return;
    observer?.disconnect();
    observer = null;
    startObserver();
    applyEnabledState();
}

export function initBodyTextExpand() {
    if (bodyTextActive) return;
    bodyTextActive = true;
    ensureStylesheet();
    startObserver();
    applyEnabledState();
    // Only this feature's level changes what it marks; other panel settings
    // used to clear and rescan every text node on each click. The rescan
    // runs after the next paint so the panel button repaints first.
    a11yUnsub = useSettings.subscribe((state, prev) => {
        if (state.bodyTextExpandLevel !== prev.bodyTextExpandLevel)
            deferredApply.schedule();
    });
}

export function destroyBodyTextExpand() {
    if (!bodyTextActive) return;
    bodyTextActive = false;
    observer?.disconnect();
    observer = null;
    window.clearTimeout(rescanTimer);
    a11yUnsub?.();
    a11yUnsub = null;
    deferredApply.cancel();
    appliedCallbacks = [];
    clearBodyTextExpand();
    releaseTextSizeStyles("bodyExpand");
}
