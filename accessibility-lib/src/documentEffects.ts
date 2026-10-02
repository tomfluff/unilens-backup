/**
 * Applies accessibility display settings to the host document.
 * Reads live state via bindSettingsReader() to avoid circular imports with settings.ts.
 */

import type { A11yFontSize } from "./accessibilityStoreTypes";
import {
    type A11ySettings,
    CONTRAST_FILTER,
    LETTER_SPACING_EM,
    normalizeTextPlateStyle,
    normalizeTextStrokeStyle,
    SATURATION_FILTER,
    STANDARD_FONT_STACK,
    TEXT_STROKE_WIDTH,
    textPlateActive,
    textPlatePairCss,
    textStrokePairCss,
    UD_FONT_STACK,
    WORD_SPACING_EM,
} from "./accessibilityStoreTypes";
import { clearBackgroundMediaMarkers } from "./backgroundMediaOverlay";
import {
    A11Y_UD_FONT_LINK_ID,
    BG_SAMPLE_ATTR,
    BODY_EXPAND_LEVEL_ATTR,
    HTML_ATTR_CONTRAST,
    HTML_ATTR_DISPLAY_ACTIVE,
    HTML_ATTR_ELEMENT_HIGHLIGHT,
    HTML_ATTR_FOCUS_ENHANCE,
    HTML_ATTR_FONT_FAMILY,
    HTML_ATTR_FONT_SIZE,
    HTML_ATTR_HTML_FILTER,
    HTML_ATTR_IMAGE_BORDER,
    HTML_ATTR_IMAGE_FILTER,
    HTML_ATTR_LETTER_SPACING,
    HTML_ATTR_LINE_HEIGHT,
    HTML_ATTR_LINK_BACKGROUND,
    HTML_ATTR_LINK_BORDER,
    HTML_ATTR_LINK_UNDERLINE,
    HTML_ATTR_PAGE_FILTER,
    HTML_ATTR_REDUCE_MOTION,
    HTML_ATTR_SATURATION,
    HTML_ATTR_TEXT_PLATE,
    HTML_ATTR_TEXT_STROKE,
    HTML_ATTR_THEME,
    HTML_STYLE_CONTRAST,
    HTML_STYLE_DISPLAY_BG,
    HTML_STYLE_DISPLAY_BORDER,
    HTML_STYLE_DISPLAY_LINK,
    HTML_STYLE_DISPLAY_SURFACE,
    HTML_STYLE_DISPLAY_TEXT,
    HTML_STYLE_FONT_FAMILY,
    HTML_STYLE_FONT_SCALE,
    HTML_STYLE_LETTER_SPACING,
    HTML_STYLE_LINE_HEIGHT,
    HTML_STYLE_SATURATE,
    HTML_STYLE_TEXT_PLATE_BG,
    HTML_STYLE_TEXT_PLATE_FG,
    HTML_STYLE_TEXT_STROKE_EDGE,
    HTML_STYLE_TEXT_STROKE_FILL,
    HTML_STYLE_TEXT_STROKE_WIDTH,
    HTML_STYLE_WORD_SPACING,
    isUniLensOverlayNode,
    PAGE_CONTENT_ATTR,
    PAGE_CONTENT_ROOT_ID,
    POSITIONED_OVERLAY_ATTR,
    PSEUDO_OVERLAY_AFTER_ATTR,
    PSEUDO_OVERLAY_BEFORE_ATTR,
    TONE_LAYER_ID,
    UI_ATTR,
} from "./domIds";
import { a11yFontSizeToScale } from "./fontScales";
import {
    clearHighContrastTextPlates,
    syncHighContrastTextPlates,
} from "./highContrastTextPlate";
import {
    restoreAllHostInlineStyles,
    restoreHostInlineStyle,
    setHostInlineStyle,
} from "./hostSurface";
import { destroyPageFontScale, setPageFontSizeScale } from "./pageFontScale";
import type { Settings } from "./settings";

let readSettings: () => Settings = () => ({}) as Settings;

export function bindSettingsReader(reader: () => Settings) {
    readSettings = reader;
}

function pickA11y(s: Settings): A11ySettings {
    return {
        fontSize: s.fontSize,
        fontFamily: s.fontFamily,
        customFontFamily: s.customFontFamily,
        lineHeight: s.lineHeight,
        letterSpacing: s.letterSpacing,
        theme: s.theme,
        saturation: s.saturation,
        contrast: s.contrast,
        linkUnderline: s.linkUnderline,
        linkBackground: s.linkBackground,
        linkBorder: s.linkBorder,
        imageBorder: s.imageBorder,
        elementHighlight: s.elementHighlight,
        focusEnhanceLevel: s.focusEnhanceLevel,
        pointerHaloPx: s.pointerHaloPx,
        pointerHaloColor: s.pointerHaloColor,
        pointerHaloOpacity: s.pointerHaloOpacity,
        focusCursorBandPx: s.focusCursorBandPx,
        readingGuide: s.readingGuide,
        readingGuideStyle: s.readingGuideStyle,
        readingGuidePosition: s.readingGuidePosition,
        textStroke: s.textStroke,
        textStrokeStyle: s.textStrokeStyle,
        textPlateStyle: s.textPlateStyle,
        reduceMotion: s.reduceMotion,
        smallTextBoostLevel: s.smallTextBoostLevel,
        bodyTextExpandLevel: s.bodyTextExpandLevel,
    };
}

function isDisplayActive(s: A11ySettings): boolean {
    // Color remapping runs for every explicit palette, including light.
    // `standard` leaves the host site's colors alone; saturate/contrast still
    // paint the whole page via HTML_ATTR_PAGE_FILTER when those differ.
    return s.theme !== "standard";
}

function needsToneFilter(
    s: Pick<A11ySettings, "saturation" | "contrast">,
): boolean {
    return s.saturation !== "standard" || s.contrast !== "standard";
}

/** Where saturate/contrast is painted. Overlay UI stays outside the page root. */
export type ToneFilterTarget = "none" | "page" | "html";

export function toneFilterTarget(
    s: Pick<A11ySettings, "theme" | "saturation" | "contrast">,
): ToneFilterTarget {
    // Invert uses <html> so position:fixed host chrome stays viewport-anchored.
    // The invert stylesheet also consumes saturate/contrast, so this is "html"
    // even when those two settings are still standard.
    if (s.theme === "invert") return "html";
    if (!needsToneFilter(s)) return "none";
    return "page";
}

function setFlag(el: HTMLElement, name: string, on: boolean) {
    if (on) el.setAttribute(name, "true");
    else el.removeAttribute(name);
}

function setLevel(el: HTMLElement, name: string, level: number) {
    if (level > 0) el.setAttribute(name, String(level));
    else el.removeAttribute(name);
}

export function ensurePageContentRoot(): HTMLDivElement | null {
    const body = document.body;
    if (!body) return null;

    let root = document.getElementById(
        PAGE_CONTENT_ROOT_ID,
    ) as HTMLDivElement | null;
    if (root) return root;

    root = document.createElement("div");
    root.id = PAGE_CONTENT_ROOT_ID;
    root.setAttribute(PAGE_CONTENT_ATTR, "1");

    const nodes = Array.from(body.childNodes);
    nodes.forEach((node) => {
        root?.appendChild(node);
    });
    body.appendChild(root);
    return root;
}

export function syncWidgetDisplayIsolation() {
    /* Counter-invert is handled in the bundled page stylesheet via html[data-unilens-a11y-html-filter]. */
}

function notifyLayoutChange() {
    try {
        window.dispatchEvent(new CustomEvent("unilens:layoutchange"));
    } catch {
        /* non-browser */
    }
}

export function restorePageContentRoot() {
    const root = document.getElementById(PAGE_CONTENT_ROOT_ID);
    const body = document.body;
    if (!root || !body) return;
    const nodes = Array.from(root.childNodes);
    nodes.forEach((node) => {
        body.insertBefore(node, root);
    });
    root.remove();
}

function ensureUdFontLink() {
    if (document.getElementById(A11Y_UD_FONT_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = A11Y_UD_FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href =
        "https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&display=swap";
    document.head.appendChild(link);
}

function removeUdFontLink() {
    document.getElementById(A11Y_UD_FONT_LINK_ID)?.remove();
}

export function toneFilterCss(
    s: Pick<A11ySettings, "saturation" | "contrast">,
): string {
    return `saturate(${SATURATION_FILTER[s.saturation]}) contrast(${CONTRAST_FILTER[s.contrast]})`;
}

function ensureToneLayer(): HTMLElement | null {
    const body = document.body;
    if (!body) return null;
    let layer = document.getElementById(TONE_LAYER_ID);
    if (!layer) {
        layer = document.createElement("div");
        layer.id = TONE_LAYER_ID;
        layer.setAttribute(UI_ATTR, "1");
        layer.setAttribute("aria-hidden", "true");
    }
    // Keep it outside the page root so it never filters itself or the panel.
    if (layer.parentNode !== body) body.appendChild(layer);
    return layer;
}

function removeToneLayer() {
    document.getElementById(TONE_LAYER_ID)?.remove();
}

function syncPageDisplayFilters(pageRoot: HTMLElement | null, s: A11ySettings) {
    const html = document.documentElement;
    const target = toneFilterTarget(s);
    setFlag(html, HTML_ATTR_HTML_FILTER, target === "html");

    if (pageRoot) {
        setFlag(pageRoot, HTML_ATTR_PAGE_FILTER, target === "page");
        // Previous builds painted standard-theme tone on media only; always
        // clear so a leftover marker cannot keep filtering just images.
        setFlag(pageRoot, HTML_ATTR_IMAGE_FILTER, false);
        // Previous builds put the tone filter inline on the page root. A
        // filtered ancestor re-anchors the host's position:fixed chrome to
        // itself, so always clear it; the tone layer paints the tone instead.
        pageRoot.style.removeProperty("filter");
    }

    if (target === "page") {
        const layer = ensureToneLayer();
        // Inline as well so the tone still shows if the stylesheet is stale.
        const css = toneFilterCss(s);
        layer?.style.setProperty("backdrop-filter", css);
        layer?.style.setProperty("-webkit-backdrop-filter", css);
    } else {
        removeToneLayer();
    }
}

/** Tags that never carry a meaningful page surface fill. */
const SKIP_SURFACE_TAGS = new Set([
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
]);

/** Exported for unit tests (inset detection without DOM). */
export function hasNonZeroInset(style: CSSStyleDeclaration): boolean {
    for (const prop of ["top", "right", "bottom", "left"] as const) {
        const v = style[prop];
        if (!v || v === "auto") continue;
        const n = parseFloat(v);
        if (Number.isFinite(n) && n !== 0) return true;
    }
    return false;
}

/** True when a computed background-color is a solid(ish) paint.
 * Semi-transparent fills (e.g. SoftBank `.c-btnMore a i` at 25% white) are
 * excluded so they stay transparent under our reset — otherwise they cover the
 * parent’s themed border and leave broken frames in high-contrast mode. */
export function isOpaqueBackgroundColor(color: string): boolean {
    if (!color || color === "transparent") return false;
    const m = color.match(
        /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*[/,]\s*([\d.]+))?\s*\)$/i,
    );
    if (m) {
        const alpha = m[4] === undefined ? 1 : parseFloat(m[4]);
        return Number.isFinite(alpha) && alpha > 0.9;
    }
    // Modern color() / lab() / named colors: treat as opaque unless clearly none.
    return color !== "rgba(0, 0, 0, 0)" && color !== "hsla(0, 0%, 0%, 0)";
}

function clearPositionedOverlayMarkers(root: ParentNode | null = document) {
    if (!root || typeof root.querySelectorAll !== "function") return;
    root.querySelectorAll(`[${POSITIONED_OVERLAY_ATTR}]`).forEach((el) => {
        el.removeAttribute(POSITIONED_OVERLAY_ATTR);
    });
    root.querySelectorAll(`[${BG_SAMPLE_ATTR}]`).forEach((el) => {
        el.removeAttribute(BG_SAMPLE_ATTR);
    });
    root.querySelectorAll(`[${PSEUDO_OVERLAY_BEFORE_ATTR}]`).forEach((el) => {
        el.removeAttribute(PSEUDO_OVERLAY_BEFORE_ATTR);
    });
    root.querySelectorAll(`[${PSEUDO_OVERLAY_AFTER_ATTR}]`).forEach((el) => {
        el.removeAttribute(PSEUDO_OVERLAY_AFTER_ATTR);
    });
    clearBackgroundMediaMarkers(root);
    clearHighContrastTextPlates(root);
}

/**
 * Tag host elements that originally had an opaque background so CSS can paint
 * them with the themed surface. Transparent layers (e.g. SoftBank
 * `.p-homeMv__cursive`) stay transparent so photos show through, while plates
 * like `.megadropdown-view-inner` / `.p-homeCareer__nowBox` keep an opaque fill
 * even when they are not position:fixed/absolute.
 */
export function syncPositionedOverlayMarkers(pageRoot: HTMLElement | null) {
    if (!pageRoot) return;

    const prev = pageRoot.querySelectorAll(`[${POSITIONED_OVERLAY_ATTR}]`);
    const keep = new Set<Element>();
    const candidates: HTMLElement[] = [];

    const nodes = pageRoot.querySelectorAll("*");
    for (let i = 0; i < nodes.length; i++) {
        const el = nodes[i];
        if (!(el instanceof HTMLElement)) continue;
        if (isUniLensOverlayNode(el)) continue;
        if (SKIP_SURFACE_TAGS.has(el.tagName)) continue;
        candidates.push(el);
    }

    // Opt candidates out of the transparent reset (one batch, one reflow) so we
    // can read the host author’s background-color rather than our own override.
    // BG_SAMPLE_ATTR also disables transitions so we sample the settled author
    // color, not a mid-fade value from `transition: all` (SoftBank tab buttons).
    for (const el of candidates) {
        el.removeAttribute(POSITIONED_OVERLAY_ATTR);
        el.setAttribute(BG_SAMPLE_ATTR, "true");
    }
    void pageRoot.offsetHeight;

    for (const el of candidates) {
        if (isOpaqueBackgroundColor(getComputedStyle(el).backgroundColor)) {
            el.setAttribute(POSITIONED_OVERLAY_ATTR, "true");
            keep.add(el);
        }
        el.removeAttribute(BG_SAMPLE_ATTR);

        // Pseudo-elements are never touched by the transparent reset (`*`
        // doesn't match `::before`/`::after`), so no opt-out dance is needed
        // to read their real background — it's already the host author's
        // own value. Host chrome frequently paints hairlines/arrows this way
        // (SoftBank `.p-graduateArrow::after`, `.c-hdg::after`), which would
        // otherwise keep a stray opaque background under the forced theme
        // text color (e.g. yellow-on-white in high-contrast mode).
        if (
            isOpaqueBackgroundColor(
                getComputedStyle(el, "::before").backgroundColor,
            )
        ) {
            el.setAttribute(PSEUDO_OVERLAY_BEFORE_ATTR, "true");
        } else {
            el.removeAttribute(PSEUDO_OVERLAY_BEFORE_ATTR);
        }
        if (
            isOpaqueBackgroundColor(
                getComputedStyle(el, "::after").backgroundColor,
            )
        ) {
            el.setAttribute(PSEUDO_OVERLAY_AFTER_ATTR, "true");
        } else {
            el.removeAttribute(PSEUDO_OVERLAY_AFTER_ATTR);
        }
    }

    prev.forEach((el) => {
        if (!keep.has(el)) el.removeAttribute(POSITIONED_OVERLAY_ATTR);
    });

    clearBackgroundMediaMarkers(pageRoot);
    syncHighContrastTextPlates(pageRoot);
}

let overlayMarkerObserver: MutationObserver | null = null;
let overlayMarkerRaf = 0;

function schedulePositionedOverlaySync(pageRoot: HTMLElement | null) {
    if (!pageRoot || overlayMarkerRaf) return;
    overlayMarkerRaf = requestAnimationFrame(() => {
        overlayMarkerRaf = 0;
        syncPositionedOverlayMarkers(pageRoot);
    });
}

function ensurePositionedOverlayObserver(
    pageRoot: HTMLElement | null,
    active: boolean,
) {
    if (typeof MutationObserver === "undefined") {
        if (active) syncPositionedOverlayMarkers(pageRoot);
        else clearPositionedOverlayMarkers(pageRoot);
        return;
    }

    if (!active || !pageRoot) {
        overlayMarkerObserver?.disconnect();
        overlayMarkerObserver = null;
        if (overlayMarkerRaf) {
            cancelAnimationFrame(overlayMarkerRaf);
            overlayMarkerRaf = 0;
        }
        clearPositionedOverlayMarkers(pageRoot);
        return;
    }

    syncPositionedOverlayMarkers(pageRoot);

    if (overlayMarkerObserver) return;
    overlayMarkerObserver = new MutationObserver(() =>
        schedulePositionedOverlaySync(pageRoot),
    );
    overlayMarkerObserver.observe(pageRoot, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["class", "style", "hidden", "aria-hidden", "src"],
    });
}

const A11Y_HTML_ATTRS = [
    HTML_ATTR_THEME,
    HTML_ATTR_SATURATION,
    HTML_ATTR_CONTRAST,
    HTML_ATTR_FONT_SIZE,
    HTML_ATTR_FONT_FAMILY,
    HTML_ATTR_LINE_HEIGHT,
    HTML_ATTR_LETTER_SPACING,
    HTML_ATTR_DISPLAY_ACTIVE,
    HTML_ATTR_LINK_UNDERLINE,
    HTML_ATTR_LINK_BACKGROUND,
    HTML_ATTR_LINK_BORDER,
    HTML_ATTR_IMAGE_BORDER,
    HTML_ATTR_ELEMENT_HIGHLIGHT,
    HTML_ATTR_FOCUS_ENHANCE,
    HTML_ATTR_REDUCE_MOTION,
    HTML_ATTR_TEXT_STROKE,
    HTML_ATTR_TEXT_PLATE,
    HTML_ATTR_HTML_FILTER,
];

function syncPageFontScale(fontSize: A11yFontSize) {
    const body = document.body;
    if (body) restoreHostInlineStyle(body, "zoom");
    setPageFontSizeScale(a11yFontSizeToScale(fontSize));
}

function syncTextStroke(
    html: HTMLElement,
    s: Pick<A11ySettings, "textStroke" | "textStrokeStyle">,
) {
    if (!s.textStroke) {
        html.removeAttribute(HTML_ATTR_TEXT_STROKE);
        restoreHostInlineStyle(html, HTML_STYLE_TEXT_STROKE_FILL);
        restoreHostInlineStyle(html, HTML_STYLE_TEXT_STROKE_EDGE);
        restoreHostInlineStyle(html, HTML_STYLE_TEXT_STROKE_WIDTH);
        return;
    }
    const style = normalizeTextStrokeStyle(s.textStrokeStyle);
    const pair = textStrokePairCss(style);
    html.setAttribute(HTML_ATTR_TEXT_STROKE, style);
    setHostInlineStyle(html, HTML_STYLE_TEXT_STROKE_FILL, pair.fill);
    setHostInlineStyle(html, HTML_STYLE_TEXT_STROKE_EDGE, pair.edge);
    setHostInlineStyle(html, HTML_STYLE_TEXT_STROKE_WIDTH, TEXT_STROKE_WIDTH);
}

function restoreDisplayPaletteVars(html: HTMLElement) {
    restoreHostInlineStyle(html, HTML_STYLE_DISPLAY_BG);
    restoreHostInlineStyle(html, HTML_STYLE_DISPLAY_TEXT);
    restoreHostInlineStyle(html, HTML_STYLE_DISPLAY_SURFACE);
    restoreHostInlineStyle(html, HTML_STYLE_DISPLAY_LINK);
    restoreHostInlineStyle(html, HTML_STYLE_DISPLAY_BORDER);
}

function syncTextPlate(
    html: HTMLElement,
    pageRoot: HTMLElement | null,
    s: Pick<A11ySettings, "theme" | "textPlateStyle">,
) {
    const style = normalizeTextPlateStyle(s.textPlateStyle);
    const pair = textPlatePairCss(style);
    if (!textPlateActive(s.theme)) {
        html.removeAttribute(HTML_ATTR_TEXT_PLATE);
        restoreHostInlineStyle(html, HTML_STYLE_TEXT_PLATE_BG);
        restoreHostInlineStyle(html, HTML_STYLE_TEXT_PLATE_FG);
        restoreDisplayPaletteVars(html);
        clearHighContrastTextPlates(pageRoot);
        return;
    }
    html.setAttribute(HTML_ATTR_TEXT_PLATE, style);
    setHostInlineStyle(html, HTML_STYLE_TEXT_PLATE_BG, pair.bg);
    setHostInlineStyle(html, HTML_STYLE_TEXT_PLATE_FG, pair.fg);
    setHostInlineStyle(html, HTML_STYLE_DISPLAY_BG, pair.bg);
    setHostInlineStyle(html, HTML_STYLE_DISPLAY_TEXT, pair.fg);
    setHostInlineStyle(html, HTML_STYLE_DISPLAY_SURFACE, pair.bg);
    setHostInlineStyle(html, HTML_STYLE_DISPLAY_LINK, pair.fg);
    setHostInlineStyle(html, HTML_STYLE_DISPLAY_BORDER, pair.fg);
    syncHighContrastTextPlates(pageRoot);
}

export function applyA11yToDocument() {
    const s = pickA11y(readSettings());
    const html = document.documentElement;
    const pageRoot = ensurePageContentRoot();

    html.setAttribute(HTML_ATTR_THEME, s.theme);
    html.setAttribute(HTML_ATTR_SATURATION, s.saturation);
    html.setAttribute(HTML_ATTR_CONTRAST, s.contrast);

    html.setAttribute(HTML_ATTR_FONT_SIZE, s.fontSize);
    html.setAttribute(HTML_ATTR_FONT_FAMILY, s.fontFamily);
    html.setAttribute(HTML_ATTR_LINE_HEIGHT, s.lineHeight);
    html.setAttribute(HTML_ATTR_LETTER_SPACING, s.letterSpacing);

    const scale = String(a11yFontSizeToScale(s.fontSize));
    const lh = s.lineHeight === "wide" ? "2" : "1.6";
    const fontStack =
        s.fontFamily === "custom" && s.customFontFamily
            ? `"${s.customFontFamily}", ${STANDARD_FONT_STACK}`
            : s.fontFamily === "ud"
              ? UD_FONT_STACK
              : STANDARD_FONT_STACK;

    setHostInlineStyle(html, HTML_STYLE_FONT_SCALE, scale);
    setHostInlineStyle(html, HTML_STYLE_LINE_HEIGHT, lh);
    setHostInlineStyle(html, HTML_STYLE_FONT_FAMILY, fontStack);
    setHostInlineStyle(
        html,
        HTML_STYLE_LETTER_SPACING,
        LETTER_SPACING_EM[s.letterSpacing],
    );
    setHostInlineStyle(
        html,
        HTML_STYLE_WORD_SPACING,
        WORD_SPACING_EM[s.letterSpacing],
    );
    setHostInlineStyle(
        html,
        HTML_STYLE_SATURATE,
        String(SATURATION_FILTER[s.saturation]),
    );
    setHostInlineStyle(
        html,
        HTML_STYLE_CONTRAST,
        String(CONTRAST_FILTER[s.contrast]),
    );

    setFlag(html, HTML_ATTR_DISPLAY_ACTIVE, isDisplayActive(s));
    setFlag(html, HTML_ATTR_LINK_UNDERLINE, s.linkUnderline);
    setFlag(html, HTML_ATTR_LINK_BACKGROUND, s.linkBackground);
    setFlag(html, HTML_ATTR_LINK_BORDER, s.linkBorder);
    setFlag(html, HTML_ATTR_IMAGE_BORDER, s.imageBorder);
    setFlag(html, HTML_ATTR_ELEMENT_HIGHLIGHT, s.elementHighlight);
    setLevel(html, HTML_ATTR_FOCUS_ENHANCE, s.focusEnhanceLevel);
    setFlag(html, HTML_ATTR_REDUCE_MOTION, s.reduceMotion);
    syncTextStroke(html, s);
    syncTextPlate(html, pageRoot, s);

    if (s.fontFamily === "ud") ensureUdFontLink();
    else removeUdFontLink();

    syncPageDisplayFilters(pageRoot, s);
    ensurePositionedOverlayObserver(pageRoot, isDisplayActive(s));
    syncPageFontScale(s.fontSize);
    syncWidgetDisplayIsolation();
    notifyLayoutChange();
}

export function clearAppliedA11yDocument() {
    const html = document.documentElement;
    if (document.body) restoreHostInlineStyle(document.body, "zoom");
    destroyPageFontScale();
    for (const attr of A11Y_HTML_ATTRS) html.removeAttribute(attr);
    restoreAllHostInlineStyles(html);
    const pageRoot = document.getElementById(PAGE_CONTENT_ROOT_ID);
    ensurePositionedOverlayObserver(pageRoot, false);
    if (pageRoot) {
        pageRoot.removeAttribute(HTML_ATTR_PAGE_FILTER);
        pageRoot.removeAttribute(HTML_ATTR_IMAGE_FILTER);
        pageRoot.style.removeProperty("filter");
    }
    removeToneLayer();
    html.removeAttribute(BODY_EXPAND_LEVEL_ATTR);
    restorePageContentRoot();
    removeUdFontLink();
}
