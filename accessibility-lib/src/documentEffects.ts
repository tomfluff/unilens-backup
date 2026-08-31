/**
 * Applies accessibility display settings to the host document.
 * Reads live state via bindSettingsReader() to avoid circular imports with settings.ts.
 */

import {
    type A11ySettings,
    CONTRAST_FILTER,
    LETTER_SPACING_EM,
    SATURATION_FILTER,
    STANDARD_FONT_STACK,
    UD_FONT_STACK,
    WORD_SPACING_EM,
} from "./accessibilityStoreTypes";
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
    HTML_ATTR_THEME,
    HTML_STYLE_CONTRAST,
    HTML_STYLE_FONT_FAMILY,
    HTML_STYLE_FONT_SCALE,
    HTML_STYLE_LETTER_SPACING,
    HTML_STYLE_LINE_HEIGHT,
    HTML_STYLE_SATURATE,
    HTML_STYLE_WORD_SPACING,
    isUniLensOverlayNode,
    PAGE_CONTENT_ATTR,
    PAGE_CONTENT_ROOT_ID,
    POSITIONED_OVERLAY_ATTR,
} from "./domIds";
import { a11yFontSizeToScale } from "./fontScales";
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
        focusEnhance: s.focusEnhance,
        reduceMotion: s.reduceMotion,
        smallTextBoostLevel: s.smallTextBoostLevel,
        bodyTextExpandLevel: s.bodyTextExpandLevel,
    };
}

function isDisplayActive(s: A11ySettings): boolean {
    // Color remapping runs for every explicit palette, including light.
    // `standard` leaves the host site's colors alone (tone filters may still
    // hit images via HTML_ATTR_IMAGE_FILTER).
    return s.theme !== "standard";
}

function needsToneFilter(s: A11ySettings): boolean {
    return s.saturation !== "standard" || s.contrast !== "standard";
}

function setFlag(el: HTMLElement, name: string, on: boolean) {
    if (on) el.setAttribute(name, "true");
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
    for (const node of nodes) {
        root?.appendChild(node);
    }
    body.appendChild(root);
    return root;
}

export function syncWidgetDisplayIsolation() {
    /* Counter-invert is handled by the bundled page CSS via html[data-unilens-a11y-html-filter]. */
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
    for (const node of nodes) {
        body.insertBefore(node, root);
    }
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

function syncPageDisplayFilters(pageRoot: HTMLElement | null, s: A11ySettings) {
    const html = document.documentElement;
    const invertOnHtml = s.theme === "invert" && isDisplayActive(s);
    setFlag(html, HTML_ATTR_HTML_FILTER, invertOnHtml);

    if (pageRoot) {
        const tone = needsToneFilter(s);
        // Remapped themes: tone filter on the whole page root (invert uses <html>).
        const pageFilter = !invertOnHtml && isDisplayActive(s) && tone;
        // Site-default theme: leave UI colors alone; tone filter hits media only.
        const imageFilter = s.theme === "standard" && tone;
        setFlag(pageRoot, HTML_ATTR_PAGE_FILTER, pageFilter);
        setFlag(pageRoot, HTML_ATTR_IMAGE_FILTER, imageFilter);
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
    }

    prev.forEach((el) => {
        if (!keep.has(el)) el.removeAttribute(POSITIONED_OVERLAY_ATTR);
    });
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
        attributeFilter: ["class", "style", "hidden", "aria-hidden"],
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
    HTML_ATTR_HTML_FILTER,
];

const A11Y_HTML_STYLE_PROPS = [
    HTML_STYLE_FONT_SCALE,
    HTML_STYLE_LINE_HEIGHT,
    HTML_STYLE_FONT_FAMILY,
    HTML_STYLE_LETTER_SPACING,
    HTML_STYLE_WORD_SPACING,
    HTML_STYLE_SATURATE,
    HTML_STYLE_CONTRAST,
];

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

    html.style.setProperty(HTML_STYLE_FONT_SCALE, scale);
    html.style.setProperty(HTML_STYLE_LINE_HEIGHT, lh);
    html.style.setProperty(HTML_STYLE_FONT_FAMILY, fontStack);
    html.style.setProperty(
        HTML_STYLE_LETTER_SPACING,
        LETTER_SPACING_EM[s.letterSpacing],
    );
    html.style.setProperty(
        HTML_STYLE_WORD_SPACING,
        WORD_SPACING_EM[s.letterSpacing],
    );
    html.style.setProperty(
        HTML_STYLE_SATURATE,
        String(SATURATION_FILTER[s.saturation]),
    );
    html.style.setProperty(
        HTML_STYLE_CONTRAST,
        String(CONTRAST_FILTER[s.contrast]),
    );

    setFlag(html, HTML_ATTR_DISPLAY_ACTIVE, isDisplayActive(s));
    setFlag(html, HTML_ATTR_LINK_UNDERLINE, s.linkUnderline);
    setFlag(html, HTML_ATTR_LINK_BACKGROUND, s.linkBackground);
    setFlag(html, HTML_ATTR_LINK_BORDER, s.linkBorder);
    setFlag(html, HTML_ATTR_IMAGE_BORDER, s.imageBorder);
    setFlag(html, HTML_ATTR_ELEMENT_HIGHLIGHT, s.elementHighlight);
    setFlag(html, HTML_ATTR_FOCUS_ENHANCE, s.focusEnhance);
    setFlag(html, HTML_ATTR_REDUCE_MOTION, s.reduceMotion);

    if (s.fontFamily === "ud") ensureUdFontLink();
    else removeUdFontLink();

    syncPageDisplayFilters(pageRoot, s);
    ensurePositionedOverlayObserver(pageRoot, isDisplayActive(s));
    syncWidgetDisplayIsolation();
    notifyLayoutChange();
}

export function clearAppliedA11yDocument() {
    const html = document.documentElement;
    for (const attr of A11Y_HTML_ATTRS) html.removeAttribute(attr);
    for (const prop of A11Y_HTML_STYLE_PROPS) html.style.removeProperty(prop);
    const pageRoot = document.getElementById(PAGE_CONTENT_ROOT_ID);
    ensurePositionedOverlayObserver(pageRoot, false);
    if (pageRoot) {
        pageRoot.removeAttribute(HTML_ATTR_PAGE_FILTER);
        pageRoot.removeAttribute(HTML_ATTR_IMAGE_FILTER);
    }
    html.removeAttribute(BODY_EXPAND_LEVEL_ATTR);
    restorePageContentRoot();
    removeUdFontLink();
}
