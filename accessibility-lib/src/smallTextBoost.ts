/**
 * Boost only text smaller than 16px — leaves headings and body text (≥16px) unchanged.
 */
import { getA11ySettings } from "./accessibilityStore";
import { afterNextPaint } from "./afterPaint";
import {
    isUniLensOverlayNode,
    SMALL_BOOST_ATTR,
    SMALL_BOOST_CLASS,
    SMALL_BOOST_HTML_ATTR,
    SMALL_BOOST_LEVEL_ATTR,
    SMALL_BOOST_ORIGINAL_ATTR,
    SMALL_BOOST_TARGET_VAR,
} from "./domIds";
import { restoreHostInlineStyle, setHostInlineStyle } from "./hostSurface";
import { getEffectivePageFontScale } from "./pageFontScale";
import { useSettings } from "./settings";
import {
    computeSmallTextTargetPx,
    SMALL_TEXT_THRESHOLD_PX,
    smallTextBoostConfig,
    type TextAdjustLevel,
} from "./textAdjustLevels";
import {
    acquireTextSizeStyles,
    readOriginalFontPx,
    releaseTextSizeStyles,
} from "./textSizeLayers";

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

export interface SmallTextScanResult {
    scanned: number;
    boosted: number;
}

let lastScan: SmallTextScanResult = { scanned: 0, boosted: 0 };
let observer: MutationObserver | null = null;
let rescanTimer: number | undefined;
let smallTextActive = false;
let a11yUnsub: (() => void) | null = null;

function ensureStylesheet() {
    acquireTextSizeStyles("smallBoost", (roots) => {
        if (!smallTextActive || getA11ySettings().smallTextBoostLevel < 1)
            return;
        if (roots) for (const root of roots) scanSmallText(root);
        else lastScan = scanSmallText();
    });
}

function shouldSkip(el: Element): boolean {
    if (!(el instanceof HTMLElement)) return true;
    if (isUniLensOverlayNode(el)) return true;
    if (SKIP_TAGS.has(el.tagName)) return true;
    return false;
}

export function computeTargetFontPx(
    originalPx: number,
    level: TextAdjustLevel = getA11ySettings().smallTextBoostLevel,
): number {
    return computeSmallTextTargetPx(originalPx, level);
}

function readOriginalPx(el: HTMLElement): number {
    return readOriginalFontPx(el, getEffectivePageFontScale());
}

function applyBoost(
    el: HTMLElement,
    originalPx: number,
    level: TextAdjustLevel,
) {
    const targetPx = computeTargetFontPx(originalPx, level);
    el.setAttribute(SMALL_BOOST_ATTR, "true");
    el.setAttribute(
        SMALL_BOOST_ORIGINAL_ATTR,
        String(Math.round(originalPx * 100) / 100),
    );
    el.classList.add(SMALL_BOOST_CLASS);
    setHostInlineStyle(el, SMALL_BOOST_TARGET_VAR, `${targetPx}px`);
}

function restoreElement(el: HTMLElement) {
    el.removeAttribute(SMALL_BOOST_ATTR);
    el.removeAttribute(SMALL_BOOST_ORIGINAL_ATTR);
    el.classList.remove(SMALL_BOOST_CLASS);
    restoreHostInlineStyle(el, SMALL_BOOST_TARGET_VAR);
}

export function scanSmallText(
    root: Element = document.body,
): SmallTextScanResult {
    const result: SmallTextScanResult = { scanned: 0, boosted: 0 };
    const level = getA11ySettings().smallTextBoostLevel;
    if (level < 1 || !document.body) return result;

    const nodes: Element[] = [root, ...Array.from(root.querySelectorAll("*"))];

    // Read every original size before writing any, so a child that inherits
    // a boosted parent's size is still measured at its own host size.
    const reads: { el: HTMLElement; px: number }[] = [];
    for (const el of nodes) {
        if (shouldSkip(el)) continue;
        if (!(el instanceof HTMLElement)) continue;
        result.scanned++;
        reads.push({ el, px: readOriginalPx(el) });
    }

    for (const { el, px } of reads) {
        if (!Number.isFinite(px) || px <= 0) continue;
        if (px >= SMALL_TEXT_THRESHOLD_PX) {
            if (el.getAttribute(SMALL_BOOST_ATTR) === "true")
                restoreElement(el);
            continue;
        }

        const targetPx = computeTargetFontPx(px, level);
        const prevTarget = el.style.getPropertyValue(SMALL_BOOST_TARGET_VAR);
        if (
            el.getAttribute(SMALL_BOOST_ATTR) === "true" &&
            // A host re-render can overwrite `className` and drop our class.
            el.classList.contains(SMALL_BOOST_CLASS) &&
            prevTarget === `${targetPx}px` &&
            el.getAttribute(SMALL_BOOST_ORIGINAL_ATTR) ===
                String(Math.round(px * 100) / 100)
        ) {
            continue;
        }

        applyBoost(el, px, level);
        result.boosted++;
    }

    lastScan = result;
    return result;
}

export function clearSmallTextBoost() {
    document
        .querySelectorAll(`[${SMALL_BOOST_ATTR}="true"]`)
        .forEach((node) => {
            if (node instanceof HTMLElement) restoreElement(node);
        });
    document.documentElement.removeAttribute(SMALL_BOOST_HTML_ATTR);
    document.documentElement.removeAttribute(SMALL_BOOST_LEVEL_ATTR);
    lastScan = { scanned: 0, boosted: 0 };
}

function applyEnabledState() {
    ensureStylesheet();
    clearSmallTextBoost();
    const level = getA11ySettings().smallTextBoostLevel;
    if (level > 0 && smallTextBoostConfig(level)) {
        document.documentElement.setAttribute(SMALL_BOOST_HTML_ATTR, "true");
        document.documentElement.setAttribute(
            SMALL_BOOST_LEVEL_ATTR,
            String(level),
        );
        lastScan = scanSmallText();
    } else {
        document.documentElement.removeAttribute(SMALL_BOOST_LEVEL_ATTR);
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
export function onSmallTextScan(listener: () => void): () => void {
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
export function afterSmallTextApplied(cb: () => void) {
    if (deferredApply.pending) appliedCallbacks.push(cb);
    else cb();
}

function scheduleRescan() {
    clearTimeout(rescanTimer);
    rescanTimer = window.setTimeout(() => {
        if (getA11ySettings().smallTextBoostLevel > 0) scanSmallText();
    }, 300);
}

function startObserver() {
    if (observer || !document.body) return;
    observer = new MutationObserver(() => {
        if (getA11ySettings().smallTextBoostLevel > 0) scheduleRescan();
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

export function getLastSmallTextScan(): SmallTextScanResult {
    return lastScan;
}

/** The host replaced <body>: observe the new one and re-apply. */
export function rebindSmallTextBoost() {
    if (!smallTextActive) return;
    observer?.disconnect();
    observer = null;
    startObserver();
    applyEnabledState();
}

export function initSmallTextBoost() {
    if (smallTextActive) return;
    smallTextActive = true;
    ensureStylesheet();
    startObserver();
    applyEnabledState();
    // Only this feature's level changes what it marks; other panel settings
    // used to clear and rescan every text node on each click. The rescan
    // runs after the next paint so the panel button repaints first.
    a11yUnsub = useSettings.subscribe((state, prev) => {
        if (state.smallTextBoostLevel !== prev.smallTextBoostLevel)
            deferredApply.schedule();
    });
}

export function destroySmallTextBoost() {
    if (!smallTextActive) return;
    smallTextActive = false;
    observer?.disconnect();
    observer = null;
    window.clearTimeout(rescanTimer);
    a11yUnsub?.();
    a11yUnsub = null;
    deferredApply.cancel();
    appliedCallbacks = [];
    clearSmallTextBoost();
    releaseTextSizeStyles("smallBoost");
}
