/**
 * Applies accessibility display settings to the host document.
 * Reads live state via bindSettingsReader() to avoid circular imports with settings.ts.
 */

import type { A11yFontSize } from "./accessibilityStoreTypes";
import {
    type A11ySettings,
    CONTRAST_FILTER,
    type HcTextScope,
    LETTER_SPACING_EM,
    normalizeHcTextScope,
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
import { afterNextPaint } from "./afterPaint";
import { clearBackgroundMediaMarkers } from "./backgroundMediaOverlay";
import {
    A11Y_TEXT_OPTIONS_STYLE_ID,
    A11Y_UD_FONT_LINK_ID,
    BG_FREEZE_ATTR,
    BG_SAMPLE_ATTR,
    BODY_EXPAND_LEVEL_ATTR,
    BORDER_AFTER_ATTR,
    BORDER_AFTER_VAR,
    BORDER_ATTR,
    BORDER_BEFORE_ATTR,
    BORDER_BEFORE_VAR,
    BORDER_VAR,
    CLIP_TEXT_ATTR,
    FILL_AFTER_ATTR,
    FILL_AFTER_VAR,
    FILL_ATTR,
    FILL_BEFORE_ATTR,
    FILL_BEFORE_VAR,
    FILL_VAR,
    GRADIENT_OFF_ATTR,
    HOST_COLOR_VAR,
    HOST_PART_ATTR,
    HTML_ATTR_CONTRAST,
    HTML_ATTR_DISPLAY_ACTIVE,
    HTML_ATTR_ELEMENT_HIGHLIGHT,
    HTML_ATTR_FOCUS_ENHANCE,
    HTML_ATTR_FONT_FAMILY,
    HTML_ATTR_FONT_SIZE,
    HTML_ATTR_HC_SCOPE,
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
    HTML_STYLE_CONTRAST_INV,
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
    HTML_STYLE_SATURATE_INV,
    HTML_STYLE_TEXT_PLATE_BG,
    HTML_STYLE_TEXT_PLATE_FG,
    HTML_STYLE_TEXT_STROKE_EDGE,
    HTML_STYLE_TEXT_STROKE_FILL,
    HTML_STYLE_TEXT_STROKE_WIDTH,
    HTML_STYLE_WORD_SPACING,
    isUniLensOverlayNode,
    KEEP_MOTION_ATTR,
    PAGE_CONTENT_ATTR,
    PAGE_CONTENT_ROOT_ID,
    POSITIONED_OVERLAY_ATTR,
    PSEUDO_OVERLAY_AFTER_ATTR,
    PSEUDO_OVERLAY_BEFORE_ATTR,
    TONE_LAYER_ID,
    UI_ATTR,
} from "./domIds";
import {
    type BorderSide,
    fillArea,
    type FillPalette,
    fillTier,
    isGradientOnly,
    isSmallPart,
    largeToneIsSurfaceFor,
    luminance,
    parseCssColor,
    type Rgb,
    reachDecision,
    saturationCapFor,
    themedBorderColor,
    themedFill,
} from "./fillTone";
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
import {
    clearMediaTextMarkers,
    onMediaTextResync,
    setToneMaskLayer,
    syncMediaTextMarkers,
} from "./mediaTextGuard";
import { isOwnStyleMutation, styleChangeKind } from "./ownMutation";
import { destroyPageFontScale, setPageFontSizeScale } from "./pageFontScale";
import type { Settings } from "./settings";
import { stopIconFontGuard, syncIconFontGuard } from "./iconFontGuard";
import { stopHostCursorGuard, syncHostCursorGuard } from "./hostCursorGuard";
import { appendA11yStyle } from "./cspStyle";
import textOptionsCss from "./unilens-a11y/text-options.css";

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
        hcTextScope: s.hcTextScope,
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

/**
 * Any setting that changes colors on the page. While one is on, text drawn
 * over a picture is found and kept in the host's own colors
 * (mediaTextGuard.ts).
 *
 * Not under the invert theme: that one flips the whole page uniformly —
 * pictures, and the text on them, included.
 */
export function mediaTextGuardActive(
    s: Pick<
        A11ySettings,
        "theme" | "saturation" | "contrast" | "textStroke" | "linkBackground"
    > &
        Partial<Pick<A11ySettings, "hcTextScope">>,
): boolean {
    if (s.theme === "invert") return false;
    // High contrast reaching everything: text over pictures gets a plate
    // like all other text instead of keeping the host colors.
    if (s.theme === "high-contrast" && s.hcTextScope === "all") return false;
    return (
        s.theme !== "standard" ||
        needsToneFilter(s) ||
        s.textStroke ||
        s.linkBackground
    );
}

/** 1 / n for undoing a filter step; 0 cannot be undone, so it stays 1. */
export function inverseFilterAmount(n: number): number {
    return Number.isFinite(n) && n > 0 ? Math.round((1 / n) * 1000) / 1000 : 1;
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

/**
 * Tags that never paint. Kept for embedders/tests that used it to decide what
 * the old page wrapper adopted; the page root is now <body> itself.
 */
const BODY_ADOPT_SKIP_TAGS = new Set([
    "SCRIPT",
    "STYLE",
    "LINK",
    "META",
    "NOSCRIPT",
    "TEMPLATE",
]);

export function isAdoptableTag(tagName: string): boolean {
    return !BODY_ADOPT_SKIP_TAGS.has(tagName.toUpperCase());
}

/**
 * The element every page-scoped rule is written against.
 *
 * This used to be a <div> that every <body> child was moved into, and a body
 * observer kept moving whatever the host appended later. Moving host nodes
 * reloaded iframes, dropped focus, broke `body > .x` rules, and made the
 * host's own `document.body.removeChild(node)` (React portals, toasts) throw.
 * <body> is now the root itself: it is only marked with an attribute, and
 * no host node is ever moved. All UniLens overlay UI lives on <html>,
 * outside <body>, so it stays out of page-scoped rules.
 */
export function ensurePageContentRoot(): HTMLElement | null {
    const body = document.body;
    if (!body) return null;
    if (body.getAttribute(PAGE_CONTENT_ATTR) !== "1")
        body.setAttribute(PAGE_CONTENT_ATTR, "1");
    return body;
}

/** The marked page root, or null before init / after teardown. */
export function getPageContentRoot(): HTMLElement | null {
    const body = document.body;
    return body && body.getAttribute(PAGE_CONTENT_ATTR) === "1" ? body : null;
}

export { isOwnStyleMutation };

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
    document.body?.removeAttribute(PAGE_CONTENT_ATTR);
    // Builds before this one wrapped the page in a <div>: unwrap one that is
    // still in the document (e.g. a page restored from the back/forward cache).
    const legacy = document.getElementById(PAGE_CONTENT_ROOT_ID);
    if (legacy?.parentNode) {
        while (legacy.firstChild)
            legacy.parentNode.insertBefore(legacy.firstChild, legacy);
        legacy.remove();
    }
}

/**
 * text-options.css is in the document only while one of the text options is
 * on: its rules reach every element, and as part of the page sheet they were
 * matched on every style recalc even with the options off.
 */
function syncTextOptionStyles(on: boolean) {
    const existing = document.getElementById(A11Y_TEXT_OPTIONS_STYLE_ID);
    if (!on) {
        existing?.remove();
        return;
    }
    if (existing) return;
    const style = document.createElement("style");
    style.id = A11Y_TEXT_OPTIONS_STYLE_ID;
    style.textContent = textOptionsCss;
    appendA11yStyle(style);
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
    const html = document.documentElement;
    // No page (no <body>) means nothing to tone.
    if (!html || !document.body) return null;
    let layer = document.getElementById(TONE_LAYER_ID);
    if (!layer) {
        layer = document.createElement("div");
        layer.id = TONE_LAYER_ID;
        layer.setAttribute(UI_ATTR, "1");
        layer.setAttribute("aria-hidden", "true");
    }
    // Keep it outside the page root (<body>) so it never filters itself or the panel.
    if (layer.parentNode !== html) html.appendChild(layer);
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
    }

    if (target === "page") {
        const layer = ensureToneLayer();
        // Inline as well so the tone still shows if the stylesheet is stale.
        const css = toneFilterCss(s);
        layer?.style.setProperty("backdrop-filter", css);
        layer?.style.setProperty("-webkit-backdrop-filter", css);
        // Picture blocks with text are cut out of the layer's mask.
        setToneMaskLayer(layer);
    } else {
        setToneMaskLayer(null);
        removeToneLayer();
    }
}

/**
 * Tags that never carry a meaningful page surface fill. (<hr> is not one of
 * them: a divider drawn with background-color is a fill like any other.)
 */
const SKIP_SURFACE_TAGS = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "META",
    "LINK",
    "HEAD",
    "BR",
    "WBR",
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
    // Builds before this one set the probes on every element.
    root.querySelectorAll(`[${BG_SAMPLE_ATTR}]`).forEach((el) => {
        el.removeAttribute(BG_SAMPLE_ATTR);
    });
    root.querySelectorAll(`[${BG_FREEZE_ATTR}]`).forEach((el) => {
        el.removeAttribute(BG_FREEZE_ATTR);
    });
    root.querySelectorAll(`[${PSEUDO_OVERLAY_BEFORE_ATTR}]`).forEach((el) => {
        el.removeAttribute(PSEUDO_OVERLAY_BEFORE_ATTR);
    });
    root.querySelectorAll(`[${PSEUDO_OVERLAY_AFTER_ATTR}]`).forEach((el) => {
        el.removeAttribute(PSEUDO_OVERLAY_AFTER_ATTR);
    });
    for (const [attr, prop] of [
        ...FILL_SLOTS,
        ...BORDER_SLOTS,
        ...HOST_PART_SLOTS,
    ]) {
        root.querySelectorAll(`[${attr}]`).forEach((el) => {
            setFill(el, attr, prop, null);
        });
    }
    for (const attr of [GRADIENT_OFF_ATTR, CLIP_TEXT_ATTR]) {
        root.querySelectorAll(`[${attr}]`).forEach((el) => {
            el.removeAttribute(attr);
        });
    }
    clearBackgroundMediaMarkers(root);
    clearHighContrastTextPlates(root);
    const html = document.documentElement;
    html?.removeAttribute(BG_SAMPLE_ATTR);
    html?.removeAttribute(BG_FREEZE_ATTR);
}

/** Set or remove a boolean marker, writing only when it changes. */
function setMarker(el: Element, name: string, on: boolean) {
    if (on) {
        if (el.getAttribute(name) !== "true") el.setAttribute(name, "true");
    } else if (el.hasAttribute(name)) el.removeAttribute(name);
}

/** Fill marker + inline custom property for the element and its two pseudos. */
const FILL_SLOTS = [
    [FILL_ATTR, FILL_VAR],
    [FILL_BEFORE_ATTR, FILL_BEFORE_VAR],
    [FILL_AFTER_ATTR, FILL_AFTER_VAR],
] as const;

/** Border marker + inline custom property for the element and its pseudos. */
const BORDER_SLOTS = [
    [BORDER_ATTR, BORDER_VAR],
    [BORDER_BEFORE_ATTR, BORDER_BEFORE_VAR],
    [BORDER_AFTER_ATTR, BORDER_AFTER_VAR],
] as const;

/** High contrast reach "text": host part marker + its pinned host color. */
const HOST_PART_SLOTS = [[HOST_PART_ATTR, HOST_COLOR_VAR]] as const;

const BORDER_SIDES = ["Top", "Right", "Bottom", "Left"] as const;

/**
 * Themed border-color for one element or pseudo (fillTone.ts
 * `themedBorderColor`), or null for the plain theme border. Reads only the
 * sides that are drawn; most elements have none, so this is one read each.
 */
function borderFor(
    cs: CSSStyleDeclaration,
    palette: FillPalette | null,
): string | null {
    if (!palette) return null;
    let drawn = false;
    const sides: BorderSide[] = BORDER_SIDES.map((side) => {
        const style = cs.getPropertyValue(
            `border-${side.toLowerCase()}-style`,
        );
        const width =
            style === "none" || style === "hidden"
                ? 0
                : parseFloat(
                      cs.getPropertyValue(`border-${side.toLowerCase()}-width`),
                  ) || 0;
        if (width > 0) drawn = true;
        return {
            width,
            color:
                width > 0
                    ? cs.getPropertyValue(`border-${side.toLowerCase()}-color`)
                    : "",
        };
    });
    if (!drawn) return null;
    return themedBorderColor(sides, cs.color, palette);
}

/** A ::before / ::after that is rendered at all. */
function pseudoRendered(cs: CSSStyleDeclaration): boolean {
    const c = cs.content;
    return Boolean(c) && c !== "none" && c !== "normal" && cs.display !== "none";
}

/**
 * Put a themed muted / tone fill on an element (or one of its pseudos), or
 * take it off with null. Writes only what changed.
 */
function setFill(el: Element, attr: string, prop: string, fill: string | null) {
    const node = el as HTMLElement;
    if (fill === null) {
        if (!el.hasAttribute(attr)) return;
        el.removeAttribute(attr);
        if (node.style) restoreHostInlineStyle(node, prop);
        return;
    }
    if (node.style && node.style.getPropertyValue(prop) !== fill)
        setHostInlineStyle(node, prop, fill);
    if (el.getAttribute(attr) !== "true") el.setAttribute(attr, "true");
}

/** The theme's text / link colors and saturation cap, read once per pass. */
function readFillPalette(html: HTMLElement): FillPalette | null {
    const cs = getComputedStyle(html);
    const read = (name: string): Rgb | undefined => {
        const c = parseCssColor(cs.getPropertyValue(name));
        return c ? [c[0], c[1], c[2]] : undefined;
    };
    const text = read("--unilens-a11y-display-text");
    if (!text) return null;
    const theme = html.getAttribute(HTML_ATTR_THEME);
    return {
        text,
        link: read("--unilens-a11y-display-link"),
        surface: read("--unilens-a11y-display-surface"),
        saturationCap: saturationCapFor(theme),
        largeToneIsSurface: largeToneIsSurfaceFor(theme),
    };
}

/** Themed fill for a sampled host background, or null for a plain surface. */
function fillFor(
    color: string,
    area: () => number,
    palette: FillPalette | null,
): string | null {
    if (!palette) return null;
    const c = parseCssColor(color);
    if (!c) return null;
    const rgb: Rgb = [c[0], c[1], c[2]];
    let tier = fillTier(rgb, Number.POSITIVE_INFINITY);
    // Only dark neutrals, and in high contrast colored fills, depend on the
    // size: measure just those.
    if (tier === "surface" && luminance(rgb) < 0.5)
        tier = fillTier(rgb, area());
    else if (tier === "tone" && palette.largeToneIsSurface)
        tier = fillTier(rgb, area(), true);
    return themedFill(tier, rgb, palette);
}

/** High contrast reach on <html> (HcTextScope); null outside high contrast. */
function readReach(html: HTMLElement): HcTextScope | null {
    const v = html.getAttribute(HTML_ATTR_HC_SCOPE);
    return v === "text" || v === "parts" || v === "all" ? v : null;
}

/** Controls and control roles: a colored one is a part at any width. */
const PART_TAGS = new Set([
    "A",
    "BUTTON",
    "LABEL",
    "SUMMARY",
    "INPUT",
    "SELECT",
    "TEXTAREA",
]);
const PART_ROLES = new Set([
    "button",
    "link",
    "tab",
    "menuitem",
    "option",
    "switch",
    "checkbox",
    "radio",
]);

/** Text, or a form control that draws its own (value, label). */
function holdsText(el: HTMLElement): boolean {
    if (
        el.tagName === "INPUT" ||
        el.tagName === "SELECT" ||
        el.tagName === "TEXTAREA"
    )
        return true;
    return /\S/.test(el.textContent ?? "");
}

/**
 * One part (keeps the host colors, text included, under reach "text"): a
 * small colored box, or a control with a colored fill that is not a whole
 * card (a full-width phone button is a part, a 300px tall card link is not).
 */
function isPartBox(el: HTMLElement): boolean {
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (isSmallPart(w, h, window.innerWidth)) return true;
    const role = el.getAttribute("role");
    const control =
        PART_TAGS.has(el.tagName) || (role !== null && PART_ROLES.has(role));
    return control && h <= 120;
}

/**
 * The element's own host fill under a high contrast reach: the fill to put
 * in the inline variable (null = themed surface), and for a host part the
 * host text color to pin (null = not a part).
 */
function ownFillFor(
    el: HTMLElement,
    cs: CSSStyleDeclaration,
    color: string,
    palette: FillPalette | null,
    reach: HcTextScope | null,
): { fill: string | null; part: string | null } {
    const area = () => fillArea(el.offsetWidth, el.offsetHeight);
    if (!reach || !palette)
        return { fill: fillFor(color, area, palette), part: null };
    const c = parseCssColor(color);
    if (!c) return { fill: null, part: null };
    const rgb: Rgb = [c[0], c[1], c[2]];
    // The tier without the large-colored-band rule: the reach decides that.
    let tier = fillTier(rgb, Number.POSITIVE_INFINITY);
    if (tier === "surface" && luminance(rgb) < 0.5)
        tier = fillTier(rgb, area());
    const text = tier === "surface" ? false : holdsText(el);
    switch (reachDecision(reach, tier, text)) {
        case "surface":
            return { fill: null, part: null };
        case "host":
            return {
                fill: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`,
                part: text && isPartBox(el) ? cs.color : null,
            };
        default:
            return { fill: fillFor(color, area, palette), part: null };
    }
}

/** A pseudo's fill under the reach: host color under "text", else themed. */
function pseudoFillFor(
    color: string,
    palette: FillPalette | null,
    reach: HcTextScope | null,
): string | null {
    if (reach !== "text" || !palette) return fillFor(color, () => 0, palette);
    const c = parseCssColor(color);
    if (!c) return null;
    const rgb: Rgb = [c[0], c[1], c[2]];
    return fillTier(rgb, 0) === "surface"
        ? null
        : `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

/**
 * Mark host elements whose own CSS transition is running, so the probes that
 * freeze transitions (bg-sample, bg-freeze, the mediaTextGuard paint probe)
 * leave them alone: `transition: none` cancels a running transition, the
 * element jumps to its end state, and the host's `transitionend` never fires
 * (a drawer or modal that closes on it stays open). `getAnimations()` flushes
 * pending style first, so a transition the host started in this task is seen.
 * Markers are only written when the set changes.
 */
export function syncKeepMotionMarkers(pageRoot: HTMLElement | null) {
    if (!pageRoot) return;
    const running = new Set<Element>();
    const doc = pageRoot.ownerDocument;
    if (typeof doc?.getAnimations === "function") {
        for (const anim of doc.getAnimations()) {
            if (typeof CSSTransition === "undefined") break;
            if (!(anim instanceof CSSTransition)) continue;
            if (anim.playState === "finished" || anim.playState === "idle")
                continue;
            const target = (anim.effect as KeyframeEffect | null)?.target;
            if (target && pageRoot.contains(target)) running.add(target);
        }
    }
    pageRoot.querySelectorAll(`[${KEEP_MOTION_ATTR}]`).forEach((el) => {
        if (!running.has(el)) el.removeAttribute(KEEP_MOTION_ATTR);
    });
    for (const el of running) setMarker(el, KEEP_MOTION_ATTR, true);
}

/**
 * Tag host elements that originally had an opaque background so CSS can paint
 * them with the themed surface. Transparent layers (e.g. SoftBank
 * `.p-homeMv__cursive`) stay transparent so photos show through, while plates
 * like `.megadropdown-view-inner` / `.p-homeCareer__nowBox` keep an opaque fill
 * even when they are not position:fixed/absolute.
 *
 * Text plates are synced first: the plate rule paints `::before`/`::after`
 * (it has no bg-sample opt-out), so pseudo-element sampling must see the
 * current plate markers. Walking the page once for plates is enough — the
 * markers pass below never changes what the plate pass reads.
 *
 * The probes (bg-sample, bg-freeze) sit on <html> for one synchronous block,
 * and a marker is only written when its value changes, so a pass over an
 * unchanged page sends no mutations to host MutationObservers. (Each pass
 * used to write four attributes on every page element: thousands of records
 * per host DOM change, and an endless loop with a host observer that reacted
 * to attribute changes by changing the DOM.)
 */
export function syncPositionedOverlayMarkers(pageRoot: HTMLElement | null) {
    if (!pageRoot) return;

    syncHighContrastTextPlates(pageRoot);

    const html = pageRoot.ownerDocument.documentElement;
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

    // Lift the transparent reset and the surface fills (one attribute on
    // <html>, one reflow) so we read the host author's background-color
    // rather than our own override. The probe also disables transitions so
    // we sample the settled author color, not a mid-fade value from
    // `transition: all` (SoftBank tab buttons).
    html.setAttribute(BG_SAMPLE_ATTR, "true");

    // Read every background first, while the probe is on. The themed fills
    // are worked out here too: sizing a dark fill reads layout, which must
    // not be interleaved with the marker writes below.
    const palette = readFillPalette(html);
    const reach = readReach(html);
    const own: string[] = [];
    // High contrast reach: pinned host text color of a part (reach "text"),
    // gradient-only backgrounds to drop (reach "all").
    const parts: (string | null)[] = [];
    const gradients: boolean[] = [];
    const clipTexts: boolean[] = [];
    const before: string[] = [];
    const after: string[] = [];
    const fills: (string | null)[][] = [];
    const borders: (string | null)[][] = [];
    try {
        for (const el of candidates) {
            const cs = getComputedStyle(el);
            const bcs = getComputedStyle(el, "::before");
            const acs = getComputedStyle(el, "::after");
            own.push(cs.backgroundColor);
            // Host chrome frequently paints hairlines/arrows on pseudos
            // (SoftBank `.p-graduateArrow::after`, `.c-hdg::after`), which
            // would otherwise keep a stray opaque background under the forced
            // theme text color (e.g. yellow-on-white in high-contrast mode).
            before.push(bcs.backgroundColor);
            after.push(acs.backgroundColor);
            // Borders drawn as shapes or left transparent (the probe lifts
            // the theme border color too, so these are the host's own).
            borders.push([
                borderFor(cs, palette),
                pseudoRendered(bcs) ? borderFor(bcs, palette) : null,
                pseudoRendered(acs) ? borderFor(acs, palette) : null,
            ]);
            const i = own.length - 1;
            const ownFill = isOpaqueBackgroundColor(own[i])
                ? ownFillFor(el, cs, own[i], palette, reach)
                : { fill: null, part: null };
            parts.push(ownFill.part);
            const clipText =
                reach === "all" &&
                (cs.backgroundClip === "text" ||
                    cs.getPropertyValue("-webkit-background-clip") === "text");
            clipTexts.push(clipText);
            gradients.push(
                reach === "all" &&
                    !clipText &&
                    isGradientOnly(cs.backgroundImage),
            );
            fills.push([
                ownFill.fill,
                // Pseudo boxes are not measured; they are decorations (dots, knobs).
                isOpaqueBackgroundColor(before[i])
                    ? pseudoFillFor(before[i], palette, reach)
                    : null,
                isOpaqueBackgroundColor(after[i])
                    ? pseudoFillFor(after[i], palette, reach)
                    : null,
            ]);
        }
    } finally {
        // End the probe and freeze transitions in the same batch: the flip
        // from sampled author color back to the themed color must not start a
        // host `transition: all` fade (that fade showed the unthemed color).
        html.setAttribute(BG_FREEZE_ATTR, "true");
        html.removeAttribute(BG_SAMPLE_ATTR);
    }

    for (let i = 0; i < candidates.length; i++) {
        const el = candidates[i];
        const ownOpaque = isOpaqueBackgroundColor(own[i]);
        const beforeOpaque = isOpaqueBackgroundColor(before[i]);
        const afterOpaque = isOpaqueBackgroundColor(after[i]);
        setMarker(el, POSITIONED_OVERLAY_ATTR, ownOpaque);
        if (ownOpaque) keep.add(el);
        setMarker(el, PSEUDO_OVERLAY_BEFORE_ATTR, beforeOpaque);
        setMarker(el, PSEUDO_OVERLAY_AFTER_ATTR, afterOpaque);
        for (let k = 0; k < FILL_SLOTS.length; k++)
            setFill(el, FILL_SLOTS[k][0], FILL_SLOTS[k][1], fills[i][k]);
        for (let k = 0; k < BORDER_SLOTS.length; k++)
            setFill(el, BORDER_SLOTS[k][0], BORDER_SLOTS[k][1], borders[i][k]);
        setFill(el, HOST_PART_ATTR, HOST_COLOR_VAR, parts[i]);
        setMarker(el, GRADIENT_OFF_ATTR, gradients[i]);
        setMarker(el, CLIP_TEXT_ATTR, clipTexts[i]);
    }
    // Settle the themed styles with transitions off, then let them run again;
    // nothing changes value at that point, so nothing animates.
    void pageRoot.offsetHeight;
    html.removeAttribute(BG_FREEZE_ATTR);

    prev.forEach((el) => {
        if (!keep.has(el)) el.removeAttribute(POSITIONED_OVERLAY_ATTR);
    });
    // Fills on elements that left the candidate list (now overlay UI, or a
    // skipped tag) — candidates were all handled above.
    const seen = new Set<Element>(candidates);
    for (const [attr, prop] of [
        ...FILL_SLOTS,
        ...BORDER_SLOTS,
        ...HOST_PART_SLOTS,
    ]) {
        pageRoot.querySelectorAll(`[${attr}]`).forEach((el) => {
            if (!seen.has(el)) setFill(el, attr, prop, null);
        });
    }
    for (const attr of [GRADIENT_OFF_ATTR, CLIP_TEXT_ATTR]) {
        pageRoot.querySelectorAll(`[${attr}]`).forEach((el) => {
            if (!seen.has(el)) el.removeAttribute(attr);
        });
    }

    clearBackgroundMediaMarkers(pageRoot);
}

/*
 * The surface pass above walks every page node and reads computed style
 * three times per node — hundreds of ms on a large host page. It used to run
 * synchronously inside every panel click (even for a link-underline toggle),
 * so the pressed button could not repaint until it finished. Now it runs:
 *  - only when something it depends on changed (see surfaceInputsKey), and
 *  - after the next paint, so the panel and the html-level CSS switch first.
 */

let overlayMarkerObserver: MutationObserver | null = null;
let surfaceSyncRoot: HTMLElement | null = null;
let lastSurfaceInputsKey: string | null = null;
/** What the surface pass does: themed surfaces, and/or the picture-text guard. */
const surfaceMode = { display: false, mediaText: false };
let detachLayoutListeners: (() => void) | null = null;

function runSurfacePass(root: HTMLElement | null) {
    // Before any probe freezes transitions: spare the ones that are running.
    if (surfaceMode.mediaText || surfaceMode.display)
        syncKeepMotionMarkers(root);
    // Picture blocks first, so the surface pass below already sees them.
    if (surfaceMode.mediaText) syncMediaTextMarkers(root);
    else clearMediaTextMarkers(root);
    if (surfaceMode.display) syncPositionedOverlayMarkers(root);
    else clearPositionedOverlayMarkers(root);
}

/*
 * When a pass may run. Settings changes run it after the next paint. Host
 * changes are rate-limited, because a pass reads every page element:
 *  - a change that can alter colors (DOM, class, a style that is not just
 *    motion) runs it after the next paint, but no sooner than a gap after the
 *    previous pass that grows with what that pass cost (4×, 50ms–1s), so a
 *    host that changes the DOM every frame cannot keep the main thread busy;
 *  - a style change that only moves / sizes / fades an element (rAF
 *    animations, scroll-linked headers, parallax, carousels writing
 *    `transform` every frame) never changes a color: it only matters where
 *    text sits over a picture, so it waits until the motion pauses (300ms),
 *    at most 2s. It used to start a full pass on every frame.
 */
const PASS_GAP_MIN_MS = 50;
const PASS_GAP_MAX_MS = 1000;
const PASS_GAP_FACTOR = 4;
const MOTION_IDLE_MS = 300;
const MOTION_MAX_WAIT_MS = 2000;

let lastPassEnd = Number.NEGATIVE_INFINITY;
let lastPassCost = 0;
let gapTimer: ReturnType<typeof setTimeout> | undefined;
let motionTimer: ReturnType<typeof setTimeout> | undefined;
let motionSince = 0;

const now = () =>
    typeof performance !== "undefined" ? performance.now() : Date.now();

const surfaceSync = afterNextPaint(() => {
    const root = surfaceSyncRoot;
    surfaceSyncRoot = null;
    if (!root || !overlayMarkerObserver || !root.isConnected) return;
    const start = now();
    runSurfacePass(root);
    lastPassEnd = now();
    lastPassCost = lastPassEnd - start;
});

function passGap(): number {
    return Math.min(
        PASS_GAP_MAX_MS,
        Math.max(PASS_GAP_MIN_MS, lastPassCost * PASS_GAP_FACTOR),
    );
}

/**
 * Settings that change what the surface pass reads: the theme (display on /
 * off, text plates on / off) and link backgrounds (their rule has no
 * bg-sample opt-out, so it shows up in the sampled background). Font,
 * spacing, tone filters, underline and the pointer cues never touch
 * background-color, so they no longer re-walk the page.
 */
export function surfaceInputsKey(
    s: Pick<A11ySettings, "theme" | "linkBackground"> &
        Partial<Pick<A11ySettings, "textPlateStyle" | "hcTextScope">>,
): string {
    // The plate pair is the high-contrast text color, which the themed
    // muted / tone fills are worked out against (fillTone.ts); the reach
    // decides which fills keep the host color or take the surface.
    const plate =
        s.theme === "high-contrast"
            ? `|${s.textPlateStyle ?? ""}|${s.hcTextScope ?? ""}`
            : "";
    return `${s.theme}|${s.linkBackground ? 1 : 0}${plate}`;
}

/** Runs the surface pass after the next paint; repeated calls coalesce. */
function scheduleDisplaySurfaceSync(pageRoot: HTMLElement) {
    clearTimeout(gapTimer);
    gapTimer = undefined;
    surfaceSyncRoot = pageRoot;
    surfaceSync.schedule();
}

/** A host change that can alter colors: a pass, rate-limited. */
function scheduleHostSurfaceSync(pageRoot: HTMLElement) {
    surfaceSyncRoot = pageRoot;
    if (surfaceSync.pending || gapTimer !== undefined) return;
    const wait = lastPassEnd + passGap() - now();
    if (wait <= 0) {
        surfaceSync.schedule();
        return;
    }
    gapTimer = setTimeout(() => {
        gapTimer = undefined;
        surfaceSync.schedule();
    }, wait);
}

/** A host change that only moved things: once the motion pauses. */
function scheduleMotionSurfaceSync(pageRoot: HTMLElement) {
    // Only the picture-text guard reads geometry.
    if (!surfaceMode.mediaText) return;
    const t = now();
    if (motionTimer === undefined) motionSince = t;
    else clearTimeout(motionTimer);
    const wait = Math.max(
        0,
        Math.min(MOTION_IDLE_MS, motionSince + MOTION_MAX_WAIT_MS - t),
    );
    motionTimer = setTimeout(() => {
        motionTimer = undefined;
        scheduleHostSurfaceSync(pageRoot);
    }, wait);
}

function cancelDisplaySurfaceSync() {
    surfaceSync.cancel();
    surfaceSyncRoot = null;
    clearTimeout(gapTimer);
    gapTimer = undefined;
    clearTimeout(motionTimer);
    motionTimer = undefined;
}

/** Run a pending surface pass now (embedders / tests that need it settled). */
export function flushDisplaySurfaceSync() {
    const root = surfaceSyncRoot ?? getPageContentRoot();
    if (gapTimer !== undefined || motionTimer !== undefined) {
        clearTimeout(gapTimer);
        gapTimer = undefined;
        clearTimeout(motionTimer);
        motionTimer = undefined;
        if (root) {
            surfaceSyncRoot = root;
            surfaceSync.schedule();
        }
    }
    surfaceSync.flush();
}

function onHostMutations(records: MutationRecord[], pageRoot: HTMLElement) {
    let motion = false;
    for (const r of records) {
        if (r.type === "attributes" && r.target instanceof Element) {
            const name = r.attributeName ?? "";
            const value = r.target.getAttribute(name);
            if (isOwnStyleMutation(name, r.oldValue, value)) continue;
            if (name === "style") {
                const kind = styleChangeKind(r.oldValue, value);
                if (kind === "none") continue;
                if (kind === "motion") {
                    motion = true;
                    continue;
                }
            }
        }
        scheduleHostSurfaceSync(pageRoot);
        return;
    }
    if (motion) scheduleMotionSurfaceSync(pageRoot);
}

/**
 * Text-over-picture geometry also changes without a DOM mutation: the window
 * is resized, or an image finishes loading and pushes the layout around.
 */
function attachLayoutListeners(pageRoot: HTMLElement) {
    if (detachLayoutListeners || typeof window === "undefined") return;
    let timer: number | undefined;
    const onResize = () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => scheduleHostSurfaceSync(pageRoot), 200);
    };
    const onLoad = (e: Event) => {
        if (e.target instanceof HTMLImageElement) onResize();
    };
    window.addEventListener("resize", onResize, { passive: true });
    pageRoot.addEventListener("load", onLoad, true);
    detachLayoutListeners = () => {
        window.clearTimeout(timer);
        window.removeEventListener("resize", onResize);
        pageRoot.removeEventListener("load", onLoad, true);
    };
}

// A background image's size arrived after the pass: run the pass again.
onMediaTextResync(() => {
    const root = getPageContentRoot();
    if (root && overlayMarkerObserver && surfaceMode.mediaText)
        scheduleHostSurfaceSync(root);
});

function ensurePositionedOverlayObserver(
    pageRoot: HTMLElement | null,
    mode: { display: boolean; mediaText: boolean },
    inputsKey: string | null = null,
) {
    surfaceMode.display = mode.display;
    surfaceMode.mediaText = mode.mediaText;
    const active = mode.display || mode.mediaText;

    if (typeof MutationObserver === "undefined") {
        runSurfacePass(pageRoot);
        return;
    }

    if (!active || !pageRoot) {
        overlayMarkerObserver?.disconnect();
        overlayMarkerObserver = null;
        detachLayoutListeners?.();
        detachLayoutListeners = null;
        cancelDisplaySurfaceSync();
        lastSurfaceInputsKey = null;
        clearPositionedOverlayMarkers(pageRoot);
        clearMediaTextMarkers(pageRoot);
        pageRoot
            ?.querySelectorAll(`[${KEEP_MOTION_ATTR}]`)
            .forEach((el) => {
                el.removeAttribute(KEEP_MOTION_ATTR);
            });
        return;
    }

    const firstRun = overlayMarkerObserver === null;
    if (firstRun || inputsKey !== lastSurfaceInputsKey) {
        scheduleDisplaySurfaceSync(pageRoot);
    }
    lastSurfaceInputsKey = inputsKey;

    if (mode.mediaText) attachLayoutListeners(pageRoot);
    else {
        detachLayoutListeners?.();
        detachLayoutListeners = null;
    }

    if (!firstRun) return;
    overlayMarkerObserver = new MutationObserver((records) =>
        onHostMutations(records, pageRoot),
    );
    overlayMarkerObserver.observe(pageRoot, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeOldValue: true,
        attributeFilter: ["class", "style", "hidden", "aria-hidden", "src"],
    });
}

/**
 * The host replaced <body>: drop the observers bound to the old one, so the
 * next apply marks the new body and observes it.
 */
export function rebindDocumentEffects() {
    overlayMarkerObserver?.disconnect();
    overlayMarkerObserver = null;
    detachLayoutListeners?.();
    detachLayoutListeners = null;
    cancelDisplaySurfaceSync();
    lastSurfaceInputsKey = null;
    applyA11yToDocument();
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
    HTML_ATTR_HC_SCOPE,
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
    s: Pick<A11ySettings, "theme" | "textPlateStyle"> &
        Partial<Pick<A11ySettings, "hcTextScope">>,
) {
    const style = normalizeTextPlateStyle(s.textPlateStyle);
    const pair = textPlatePairCss(style);
    if (!textPlateActive(s.theme)) {
        html.removeAttribute(HTML_ATTR_TEXT_PLATE);
        html.removeAttribute(HTML_ATTR_HC_SCOPE);
        restoreHostInlineStyle(html, HTML_STYLE_TEXT_PLATE_BG);
        restoreHostInlineStyle(html, HTML_STYLE_TEXT_PLATE_FG);
        restoreDisplayPaletteVars(html);
        clearHighContrastTextPlates(pageRoot);
        return;
    }
    html.setAttribute(HTML_ATTR_TEXT_PLATE, style);
    html.setAttribute(HTML_ATTR_HC_SCOPE, normalizeHcTextScope(s.hcTextScope));
    setHostInlineStyle(html, HTML_STYLE_TEXT_PLATE_BG, pair.bg);
    setHostInlineStyle(html, HTML_STYLE_TEXT_PLATE_FG, pair.fg);
    setHostInlineStyle(html, HTML_STYLE_DISPLAY_BG, pair.bg);
    setHostInlineStyle(html, HTML_STYLE_DISPLAY_TEXT, pair.fg);
    setHostInlineStyle(html, HTML_STYLE_DISPLAY_SURFACE, pair.bg);
    setHostInlineStyle(html, HTML_STYLE_DISPLAY_LINK, pair.fg);
    setHostInlineStyle(html, HTML_STYLE_DISPLAY_BORDER, pair.fg);
    // Per-node plate markers are placed by the deferred surface pass
    // (syncPositionedOverlayMarkers), which always runs while a plate theme
    // is active. A plate style change only swaps the colors above.
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
    setHostInlineStyle(
        html,
        HTML_STYLE_SATURATE_INV,
        String(inverseFilterAmount(SATURATION_FILTER[s.saturation])),
    );
    setHostInlineStyle(
        html,
        HTML_STYLE_CONTRAST_INV,
        String(inverseFilterAmount(CONTRAST_FILTER[s.contrast])),
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
    // Icon fonts keep their own typeface under the forced UD / custom font.
    syncTextOptionStyles(
        s.fontFamily !== "standard" ||
            s.lineHeight === "wide" ||
            s.letterSpacing === "wide",
    );
    // Also under wide line / letter spacing, which reach every element and
    // would stretch an icon's box or break a ligature icon apart.
    syncIconFontGuard(
        pageRoot,
        s.fontFamily !== "standard" ||
            s.lineHeight === "wide" ||
            s.letterSpacing === "wide",
    );
    // The large cursor leaves the host's meaningful cursors alone
    // (not-allowed, grab …).
    syncHostCursorGuard(pageRoot, s.focusEnhanceLevel > 0);

    syncPageDisplayFilters(pageRoot, s);
    const mode = {
        display: isDisplayActive(s),
        mediaText: mediaTextGuardActive(s),
    };
    ensurePositionedOverlayObserver(
        pageRoot,
        mode,
        `${surfaceInputsKey(s)}|${mode.mediaText ? 1 : 0}`,
    );
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
    const pageRoot = getPageContentRoot();
    ensurePositionedOverlayObserver(pageRoot, {
        display: false,
        mediaText: false,
    });
    if (pageRoot) {
        pageRoot.removeAttribute(HTML_ATTR_PAGE_FILTER);
        pageRoot.removeAttribute(HTML_ATTR_IMAGE_FILTER);
    }
    setToneMaskLayer(null);
    removeToneLayer();
    html.removeAttribute(BODY_EXPAND_LEVEL_ATTR);
    stopIconFontGuard();
    syncTextOptionStyles(false);
    stopHostCursorGuard();
    restorePageContentRoot();
    removeUdFontLink();
}
