/**
 * UniLens auto text size — adjusts host-page and chat text for readability.
 * Prototype: viewport / content / combined modes with a tab panel for testing.
 */

import { isUniLensOverlayNode, UI_ATTR } from "./domIds";
import { restoreHostInlineStyle, setHostInlineStyle } from "./hostSurface";
import { setPageFontExtraScale } from "./pageFontScale";
import {
    type HealthStopReason,
    measurePageHealth,
    searchHealthyScale,
} from "./pageHealth";
import {
    getSettings,
    patchSettings,
    saveSettings,
    useSettings,
} from "./settings";

export type { AutoTextMode } from "./accessibilityStoreTypes";

const STYLE_ID = "unilens-auto-text-style";
const HTML_CLASS = "unilens-auto-text";

const TEXT_TAGS = new Set([
    "P",
    "SPAN",
    "A",
    "LI",
    "TD",
    "TH",
    "LABEL",
    "BUTTON",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
    "FIGCAPTION",
    "BLOCKQUOTE",
    "DT",
    "DD",
]);

/** Last "health" search (Lab: largest scale that keeps the layout). */
export interface HealthReport {
    /** Health at the panel's own size, before auto-text grows anything. */
    baseline: number;
    /** Health at the applied scale, measured when this report was made. */
    current: number;
    stopReason: HealthStopReason;
    /** Page reflows the search needed. */
    trials: number;
    ms: number;
}

export interface TextAnalysis {
    sampleCount: number;
    medianPx: number;
    minPx: number;
    maxPx: number;
    smallTextRatio: number;
    suggestedScale: number;
    viewportScale: number;
    contentScale: number;
    appliedScale: number;
    /** Present in "health" mode only. */
    health?: HealthReport;
}

let appliedScale = 1;
/**
 * "health" mode scales text through pageFontScale (per text node, px and rem
 * alike) instead of the root font-size, which leaves px-sized pages
 * unchanged and so would always look "healthy".
 */
let extraScaleApplied = false;
let lastHealth: HealthReport | null = null;
let resizeTimer: number | undefined;
let autoTextClassApplied = false;

const TEXT_SCALE_VAR = "--unilens-text-scale";
const TEXT_LINE_VAR = "--unilens-text-line";

function clampScale(n: number): number {
    const { autoTextMaxScale } = getSettings();
    return Math.min(autoTextMaxScale, Math.max(1, Math.round(n * 100) / 100));
}

function viewportScale(): number {
    const w = window.innerWidth;
    if (w < 360) return 1.35;
    if (w < 480) return 1.25;
    if (w < 768) return 1.12;
    if (w < 1024) return 1.05;
    return 1;
}

function isUniLensNode(el: Element): boolean {
    return isUniLensOverlayNode(el);
}

/** Sample visible text elements in the viewport and estimate a readability scale. */
export function analyzePageText(): TextAnalysis {
    const samples: number[] = [];
    const vh = window.innerHeight;
    const vw = window.innerWidth;

    for (const el of document.body.querySelectorAll("*")) {
        if (!(el instanceof HTMLElement)) continue;
        if (isUniLensNode(el)) continue;
        if (TEXT_TAGS.has(el.tagName) === false && !el.textContent?.trim())
            continue;

        const rect = el.getBoundingClientRect();
        if (rect.width < 8 || rect.height < 8) continue;
        if (
            rect.bottom < 0 ||
            rect.top > vh ||
            rect.right < 0 ||
            rect.left > vw
        )
            continue;

        const text = el.textContent?.replace(/\s+/g, " ").trim();
        if (!text || text.length < 2) continue;

        const px = parseFloat(getComputedStyle(el).fontSize);
        if (Number.isFinite(px) && px > 0) samples.push(px);
        if (samples.length >= 120) break;
    }

    const vpScale = viewportScale();
    const targetMin = getSettings().autoTextMinPx;

    if (samples.length === 0) {
        const scale = clampScale(vpScale);
        return {
            sampleCount: 0,
            medianPx: 16,
            minPx: 16,
            maxPx: 16,
            smallTextRatio: 0,
            suggestedScale: scale,
            viewportScale: vpScale,
            contentScale: 1,
            appliedScale: scale,
        };
    }

    samples.sort((a, b) => a - b);
    const medianPx = samples[Math.floor(samples.length / 2)];
    const minPx = samples[0];
    const maxPx = samples[samples.length - 1];
    const smallCount = samples.filter((px) => px < targetMin).length;
    const smallTextRatio = smallCount / samples.length;

    let contentScale = 1;
    if (medianPx < targetMin) contentScale = targetMin / medianPx;
    else if (smallTextRatio > 0.4)
        contentScale = targetMin / Math.max(minPx, 10);

    contentScale = clampScale(contentScale);

    let suggestedScale = 1;
    const { autoTextMode } = getSettings();
    if (autoTextMode === "viewport") suggestedScale = vpScale;
    else if (autoTextMode === "content") suggestedScale = contentScale;
    else if (autoTextMode === "combined")
        suggestedScale = clampScale(Math.max(vpScale, contentScale));
    else if (autoTextMode === "health") suggestedScale = appliedScale;

    suggestedScale = clampScale(suggestedScale);

    return {
        sampleCount: samples.length,
        medianPx: Math.round(medianPx * 10) / 10,
        minPx: Math.round(minPx * 10) / 10,
        maxPx: Math.round(maxPx * 10) / 10,
        smallTextRatio: Math.round(smallTextRatio * 100) / 100,
        suggestedScale,
        viewportScale: vpScale,
        contentScale,
        appliedScale: suggestedScale,
    };
}

function ensureStylesheet() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
    html.${HTML_CLASS} {
      font-size: calc(100% * var(${TEXT_SCALE_VAR}, 1)) !important;
    }
    html.${HTML_CLASS} body {
      line-height: calc(1.5 * var(${TEXT_LINE_VAR}, 1));
    }
  `;
    document.head.appendChild(style);
}

function applyScaleToPage(scale: number) {
    clearExtraScale();
    ensureStylesheet();
    appliedScale = scale;
    const html = document.documentElement;
    // Applying twice in a row (mode change + settings subscription) must not
    // forget that we added the class, or clearing leaves it on the page.
    if (!html.classList.contains(HTML_CLASS)) {
        html.classList.add(HTML_CLASS);
        autoTextClassApplied = true;
    }
    setHostInlineStyle(html, TEXT_SCALE_VAR, String(scale));
    setHostInlineStyle(html, TEXT_LINE_VAR, scale > 1.1 ? "1.08" : "1");
}

function clearExtraScale() {
    if (!extraScaleApplied) return;
    extraScaleApplied = false;
    setPageFontExtraScale(1);
}

/** Health mode: grow text node by node, with the root font-size left alone. */
function applyExtraScale(scale: number) {
    clearRootScale();
    appliedScale = scale;
    extraScaleApplied = true;
    setPageFontExtraScale(scale);
}

function clearPageScale() {
    appliedScale = 1;
    clearRootScale();
    clearExtraScale();
    lastHealth = null;
}

function clearRootScale() {
    const html = document.documentElement;
    if (autoTextClassApplied) html.classList.remove(HTML_CLASS);
    autoTextClassApplied = false;
    restoreHostInlineStyle(html, TEXT_SCALE_VAR);
    restoreHostInlineStyle(html, TEXT_LINE_VAR);
}

/** Effective chat font size: auto-synced from page scale or manual setting. */
export function getEffectiveChatFontSize(): number {
    const s = getSettings();
    if (!s.autoTextSize || s.autoTextMode === "off") return s.chatFontSize;
    const base = s.chatFontSize;
    const boosted = Math.round(base * appliedScale);
    return Math.min(28, Math.max(base, boosted));
}

export function getAppliedTextScale(): number {
    return appliedScale;
}

function isHealthMode(): boolean {
    const s = getSettings();
    return s.autoTextSize && s.autoTextMode === "health";
}

/**
 * Largest scale at which the page keeps its layout. Every trial applies the
 * scale and reads layout synchronously, so the browser never paints the
 * intermediate sizes.
 */
function runHealthSearch(): HealthReport {
    const t0 = performance.now();
    const result = searchHealthyScale({
        maxScale: getSettings().autoTextMaxScale,
        healthAt: (scale) => {
            applyExtraScale(scale);
            return measurePageHealth();
        },
    });
    // The search ends on whichever trial came last, not necessarily the winner.
    if (appliedScale !== result.scale) applyExtraScale(result.scale);
    if (result.scale === 1) clearExtraScale();
    lastHealth = {
        baseline: result.baseline.health,
        current: result.final.health,
        stopReason: result.stopReason,
        trials: result.trials,
        ms: Math.round(performance.now() - t0),
    };
    return lastHealth;
}

/** Health now, at whatever scale is applied (manual nudges included). */
function currentHealthReport(): HealthReport | undefined {
    if (!lastHealth) return undefined;
    return { ...lastHealth, current: measurePageHealth().health };
}

export function refreshAutoTextSize(): TextAnalysis {
    const s = getSettings();

    if (!s.autoTextSize || s.autoTextMode === "off") {
        clearPageScale();
        return { ...analyzePageText(), appliedScale: 1 };
    }

    if (isHealthMode()) {
        const health = runHealthSearch();
        // Sampled after the search: the numbers describe what is on screen.
        const analysis = analyzePageText();
        return {
            ...analysis,
            suggestedScale: appliedScale,
            appliedScale,
            health,
        };
    }

    const analysis = analyzePageText();

    applyScaleToPage(analysis.suggestedScale);
    analysis.appliedScale = analysis.suggestedScale;
    return analysis;
}

/** Manual test actions from the prototype tab. */
export function runAutoTextAction(
    action: "analyze" | "apply" | "reset" | "bumpUp" | "bumpDown",
): TextAnalysis {
    if (action === "reset") {
        patchSettings({ autoTextSize: false, autoTextMode: "off" });
        saveSettings();
        clearPageScale();
        return analyzePageText();
    }

    if (action === "bumpUp" || action === "bumpDown") {
        const s = getSettings();
        patchSettings({
            autoTextSize: true,
            autoTextMode:
                s.autoTextMode === "off" ? "combined" : s.autoTextMode,
        });
        const next = clampScale(
            appliedScale + (action === "bumpUp" ? 0.1 : -0.1),
        );
        if (isHealthMode()) {
            // A manual nudge past the safe scale is the visitor's call; the
            // report then shows how far health has dropped.
            applyExtraScale(next);
            saveSettings();
            const a = analyzePageText();
            a.appliedScale = next;
            a.health = currentHealthReport();
            return a;
        }
        applyScaleToPage(next);
        saveSettings();
        const a = analyzePageText();
        a.appliedScale = next;
        return a;
    }

    if (action === "analyze") {
        const a = analyzePageText();
        if (isHealthMode()) a.health = currentHealthReport();
        return a;
    }

    const s = getSettings();
    patchSettings({
        autoTextSize: true,
        autoTextMode: s.autoTextMode === "off" ? "combined" : s.autoTextMode,
    });
    saveSettings();
    return refreshAutoTextSize();
}

function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
        const s = getSettings();
        if (s.autoTextSize && s.autoTextMode !== "off") refreshAutoTextSize();
    }, 250);
}

let autoTextActive = false;
let settingsUnsub: (() => void) | null = null;

export function initAutoTextSize() {
    if (autoTextActive) return;
    autoTextActive = true;
    ensureStylesheet();
    const s = getSettings();
    if (s.autoTextSize && s.autoTextMode !== "off") refreshAutoTextSize();
    window.addEventListener("resize", onResize);
    // Re-measure only when an auto-text setting changes. Reacting to every
    // panel setting re-read the layout of the whole page on each click.
    settingsUnsub = useSettings.subscribe((live, prev) => {
        if (
            live.autoTextSize === prev.autoTextSize &&
            live.autoTextMode === prev.autoTextMode &&
            live.autoTextMinPx === prev.autoTextMinPx &&
            live.autoTextMaxScale === prev.autoTextMaxScale
        )
            return;
        if (live.autoTextSize && live.autoTextMode !== "off")
            refreshAutoTextSize();
        else clearPageScale();
    });
}

export function destroyAutoTextSize() {
    if (!autoTextActive) return;
    autoTextActive = false;
    window.removeEventListener("resize", onResize);
    settingsUnsub?.();
    settingsUnsub = null;
    clearPageScale();
}

/** Mark UniLens UI nodes so page analysis skips them. */
export function markUniLensUi(el: HTMLElement) {
    el.setAttribute(UI_ATTR, "1");
}
