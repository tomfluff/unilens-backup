/**
 * UniLens auto text size — adjusts host-page and chat text for readability.
 * Prototype: viewport / content / combined modes with a tab panel for testing.
 */

import { isUniLensOverlayNode, UI_ATTR } from "./domIds";
import { restoreHostInlineStyle, setHostInlineStyle } from "./hostSurface";
import { remeasureTextSizes } from "./textSizeLayers";
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
let autoTextClassApplied = false;
/** <html> had no `class` attribute before we added ours. */
let htmlHadNoClassAttr = false;

const TEXT_SCALE_VAR = "--unilens-text-scale";
const TEXT_LINE_VAR = "--unilens-text-line";
/** The host's own root font-size, measured with our rule off. */
const TEXT_BASE_VAR = "--unilens-text-base";

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
      font-size: calc(var(${TEXT_BASE_VAR}, 100%) * var(${TEXT_SCALE_VAR}, 1)) !important;
    }
    html.${HTML_CLASS} body {
      line-height: calc(1.5 * var(${TEXT_LINE_VAR}, 1));
    }
  `;
    document.head.appendChild(style);
}

function applyScaleToPage(scale: number) {
    ensureStylesheet();
    appliedScale = scale;
    const html = document.documentElement;
    // Scale from the host's own root size (e.g. a 62.5% rem layout), read with
    // our rule switched off, not from the browser default. Re-read on every
    // apply so a responsive root size is followed on resize.
    const present = html.classList.contains(HTML_CLASS);
    if (!present) htmlHadNoClassAttr = !html.hasAttribute("class");
    if (present) html.classList.remove(HTML_CLASS);
    const basePx = parseFloat(getComputedStyle(html).fontSize);
    html.classList.add(HTML_CLASS);
    // Only the first apply adds the class; re-applies must not forget that we
    // own it (they used to, and reset then left the class — and its
    // `font-size: 100% !important` — on the host's <html>).
    if (!present) autoTextClassApplied = true;
    if (Number.isFinite(basePx) && basePx > 0)
        setHostInlineStyle(html, TEXT_BASE_VAR, `${basePx}px`);
    setHostInlineStyle(html, TEXT_SCALE_VAR, String(scale));
    setHostInlineStyle(html, TEXT_LINE_VAR, scale > 1.1 ? "1.08" : "1");
    // The root size changed: other text-size features re-read host sizes.
    remeasureTextSizes();
}

function clearPageScale() {
    appliedScale = 1;
    const html = document.documentElement;
    const wasApplied = autoTextClassApplied;
    if (autoTextClassApplied) {
        html.classList.remove(HTML_CLASS);
        // Leave no empty `class=""` on a host <html> that had none.
        if (htmlHadNoClassAttr && html.getAttribute("class") === "")
            html.removeAttribute("class");
    }
    autoTextClassApplied = false;
    htmlHadNoClassAttr = false;
    restoreHostInlineStyle(html, TEXT_BASE_VAR);
    restoreHostInlineStyle(html, TEXT_SCALE_VAR);
    restoreHostInlineStyle(html, TEXT_LINE_VAR);
    if (wasApplied) remeasureTextSizes();
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

export function refreshAutoTextSize(): TextAnalysis {
    const analysis = analyzePageText();
    const s = getSettings();

    if (!s.autoTextSize || s.autoTextMode === "off") {
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
        applyScaleToPage(next);
        saveSettings();
        const a = analyzePageText();
        a.appliedScale = next;
        return a;
    }

    if (action === "analyze") return analyzePageText();

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
    window.clearTimeout(resizeTimer);
    clearPageScale();
    document.getElementById(STYLE_ID)?.remove();
}

/** Mark UniLens UI nodes so page analysis skips them. */
export function markUniLensUi(el: HTMLElement) {
    el.setAttribute(UI_ATTR, "1");
}
