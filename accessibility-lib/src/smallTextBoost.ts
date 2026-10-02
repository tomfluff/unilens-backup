/**
 * Boost only text smaller than 16px — leaves headings and body text (≥16px) unchanged.
 */
import { getA11ySettings, onA11yChange } from "./accessibilityStore";
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
    acquireTextSizeStyles("smallBoost");
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

export function initSmallTextBoost() {
    if (smallTextActive) return;
    smallTextActive = true;
    ensureStylesheet();
    startObserver();
    applyEnabledState();
    a11yUnsub = onA11yChange(applyEnabledState);
}

export function destroySmallTextBoost() {
    if (!smallTextActive) return;
    smallTextActive = false;
    observer?.disconnect();
    observer = null;
    window.clearTimeout(rescanTimer);
    a11yUnsub?.();
    a11yUnsub = null;
    clearSmallTextBoost();
    releaseTextSizeStyles("smallBoost");
}
