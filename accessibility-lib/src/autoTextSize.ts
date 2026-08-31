/**
 * UniLens auto text size — adjusts host-page and chat text for readability.
 * Prototype: viewport / content / combined modes with a tab panel for testing.
 */

import { isUniLensOverlayNode, UI_ATTR } from "./domIds";
import { onSettingsChange, saveSettings, settings } from "./settings";

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
}

let appliedScale = 1;
let resizeTimer: number | undefined;

function clampScale(n: number): number {
    return Math.min(
        settings.autoTextMaxScale,
        Math.max(1, Math.round(n * 100) / 100),
    );
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
    const targetMin = settings.autoTextMinPx;

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
    if (settings.autoTextMode === "viewport") suggestedScale = vpScale;
    else if (settings.autoTextMode === "content") suggestedScale = contentScale;
    else if (settings.autoTextMode === "combined")
        suggestedScale = clampScale(Math.max(vpScale, contentScale));

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
      font-size: calc(100% * var(--unilens-text-scale, 1)) !important;
    }
    html.${HTML_CLASS} body {
      line-height: calc(1.5 * var(--unilens-text-line, 1));
    }
  `;
    document.head.appendChild(style);
}

function applyScaleToPage(scale: number) {
    ensureStylesheet();
    appliedScale = scale;
    document.documentElement.classList.add(HTML_CLASS);
    document.documentElement.style.setProperty(
        "--unilens-text-scale",
        String(scale),
    );
    document.documentElement.style.setProperty(
        "--unilens-text-line",
        scale > 1.1 ? "1.08" : "1",
    );
}

function clearPageScale() {
    appliedScale = 1;
    document.documentElement.classList.remove(HTML_CLASS);
    document.documentElement.style.removeProperty("--unilens-text-scale");
    document.documentElement.style.removeProperty("--unilens-text-line");
}

/** Effective chat font size: auto-synced from page scale or manual setting. */
export function getEffectiveChatFontSize(): number {
    if (!settings.autoTextSize || settings.autoTextMode === "off")
        return settings.chatFontSize;
    const base = settings.chatFontSize;
    const boosted = Math.round(base * appliedScale);
    return Math.min(28, Math.max(base, boosted));
}

export function getAppliedTextScale(): number {
    return appliedScale;
}

export function refreshAutoTextSize(): TextAnalysis {
    const analysis = analyzePageText();

    if (!settings.autoTextSize || settings.autoTextMode === "off") {
        clearPageScale();
        return { ...analysis, appliedScale: 1 };
    }

    applyScaleToPage(analysis.suggestedScale);
    analysis.appliedScale = analysis.suggestedScale;
    return analysis;
}

/** Manual test actions from the prototype tab. */
export function runAutoTextAction(
    action: "analyze" | "apply" | "reset" | "bumpUp" | "bumpDown",
): TextAnalysis {
    if (action === "reset") {
        settings.autoTextSize = false;
        settings.autoTextMode = "off";
        saveSettings();
        clearPageScale();
        return analyzePageText();
    }

    if (action === "bumpUp" || action === "bumpDown") {
        settings.autoTextSize = true;
        if (settings.autoTextMode === "off") settings.autoTextMode = "combined";
        const next = clampScale(
            appliedScale + (action === "bumpUp" ? 0.1 : -0.1),
        );
        applyScaleToPage(next);
        saveSettings();
        const a = analyzePageText();
        a.appliedScale = next;
        return a;
    }

    if (action === "analyze") return analyzePageText();

    settings.autoTextSize = true;
    if (settings.autoTextMode === "off") settings.autoTextMode = "combined";
    saveSettings();
    return refreshAutoTextSize();
}

function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
        if (settings.autoTextSize && settings.autoTextMode !== "off")
            refreshAutoTextSize();
    }, 250);
}

let autoTextActive = false;
let settingsUnsub: (() => void) | null = null;

export function initAutoTextSize() {
    if (autoTextActive) return;
    autoTextActive = true;
    ensureStylesheet();
    if (settings.autoTextSize && settings.autoTextMode !== "off")
        refreshAutoTextSize();
    window.addEventListener("resize", onResize);
    settingsUnsub = onSettingsChange(() => {
        if (settings.autoTextSize && settings.autoTextMode !== "off")
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
