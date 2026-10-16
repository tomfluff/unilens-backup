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
import { afterNextPaint } from "./afterPaint";
import { clearBackgroundMediaMarkers } from "./backgroundMediaOverlay";
import {
    A11Y_UD_FONT_LINK_ID,
    BG_FREEZE_ATTR,
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
import {
    clearMediaTextMarkers,
    onMediaTextResync,
    setToneMaskLayer,
    syncMediaTextMarkers,
} from "./mediaTextGuard";
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
    >,
): boolean {
    if (s.theme === "invert") return false;
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
 * Tags a host may append to <body> that never paint: leave them where they
 * are, so the host's own `body > script` style lookups keep working.
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
 * Every colour rule is scoped to the page root, but a host often appends
 * more content to <body> after the root was made (a footer injected by its
 * own script, a jQuery UI menu, a modal). Those landed outside the root and
 * kept the host's colours under any theme. Move them in.
 */
function adoptBodyNode(root: HTMLElement, node: Node) {
    if (!(node instanceof HTMLElement) || node === root) return;
    if (node.parentElement !== document.body) return;
    if (!isAdoptableTag(node.tagName) || isUniLensOverlayNode(node)) return;
    root.appendChild(node);
}

let bodyAdoptObserver: MutationObserver | null = null;

function ensureBodyAdoption(root: HTMLElement) {
    const body = document.body;
    for (const node of Array.from(body.childNodes)) adoptBodyNode(root, node);
    if (bodyAdoptObserver || typeof MutationObserver === "undefined") return;
    bodyAdoptObserver = new MutationObserver((records) => {
        for (const r of records)
            for (const node of Array.from(r.addedNodes))
                adoptBodyNode(root, node);
    });
    bodyAdoptObserver.observe(body, { childList: true });
}

export function ensurePageContentRoot(): HTMLDivElement | null {
    const body = document.body;
    if (!body) return null;

    let root = document.getElementById(
        PAGE_CONTENT_ROOT_ID,
    ) as HTMLDivElement | null;
    if (root) {
        ensureBodyAdoption(root);
        return root;
    }

    root = document.createElement("div");
    root.id = PAGE_CONTENT_ROOT_ID;
    root.setAttribute(PAGE_CONTENT_ATTR, "1");

    const nodes = Array.from(body.childNodes);
    nodes.forEach((node) => {
        root?.appendChild(node);
    });
    body.appendChild(root);
    ensureBodyAdoption(root);
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
    bodyAdoptObserver?.disconnect();
    bodyAdoptObserver = null;
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
        // Picture blocks with text are cut out of the layer's mask.
        setToneMaskLayer(layer);
    } else {
        setToneMaskLayer(null);
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
    root.querySelectorAll(`[${BG_FREEZE_ATTR}]`).forEach((el) => {
        el.removeAttribute(BG_FREEZE_ATTR);
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
 *
 * Text plates are synced first: the plate rule paints `::before`/`::after`
 * (it has no bg-sample opt-out), so pseudo-element sampling must see the
 * current plate markers. Walking the page once for plates is enough — the
 * markers pass below never changes what the plate pass reads.
 */
export function syncPositionedOverlayMarkers(pageRoot: HTMLElement | null) {
    if (!pageRoot) return;

    syncHighContrastTextPlates(pageRoot);

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

    // Read every background first, while all probes are still on. Writing
    // attributes inside this loop would restyle the page on the next read.
    const overlay: boolean[] = [];
    const before: boolean[] = [];
    const after: boolean[] = [];
    for (const el of candidates) {
        overlay.push(
            isOpaqueBackgroundColor(getComputedStyle(el).backgroundColor),
        );
        // Pseudo-elements are never touched by the transparent reset (`*`
        // doesn't match `::before`/`::after`), so no opt-out dance is needed
        // to read their real background — it's already the host author's
        // own value. Host chrome frequently paints hairlines/arrows this way
        // (SoftBank `.p-graduateArrow::after`, `.c-hdg::after`), which would
        // otherwise keep a stray opaque background under the forced theme
        // text color (e.g. yellow-on-white in high-contrast mode).
        before.push(
            isOpaqueBackgroundColor(
                getComputedStyle(el, "::before").backgroundColor,
            ),
        );
        after.push(
            isOpaqueBackgroundColor(
                getComputedStyle(el, "::after").backgroundColor,
            ),
        );
    }

    // End the probe and freeze transitions in the same batch: the flip from
    // sampled author color back to the themed color must not start a host
    // `transition: all` fade (that fade showed the unthemed color briefly).
    for (let i = 0; i < candidates.length; i++) {
        const el = candidates[i];
        el.setAttribute(BG_FREEZE_ATTR, "true");
        el.removeAttribute(BG_SAMPLE_ATTR);
        if (overlay[i]) {
            el.setAttribute(POSITIONED_OVERLAY_ATTR, "true");
            keep.add(el);
        }
        if (before[i]) el.setAttribute(PSEUDO_OVERLAY_BEFORE_ATTR, "true");
        else el.removeAttribute(PSEUDO_OVERLAY_BEFORE_ATTR);
        if (after[i]) el.setAttribute(PSEUDO_OVERLAY_AFTER_ATTR, "true");
        else el.removeAttribute(PSEUDO_OVERLAY_AFTER_ATTR);
    }
    // Settle the themed styles with transitions off, then let them run again;
    // nothing changes value at that point, so nothing animates.
    void pageRoot.offsetHeight;
    for (const el of candidates) el.removeAttribute(BG_FREEZE_ATTR);

    prev.forEach((el) => {
        if (!keep.has(el)) el.removeAttribute(POSITIONED_OVERLAY_ATTR);
    });

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
    // Picture blocks first, so the surface pass below already sees them.
    if (surfaceMode.mediaText) syncMediaTextMarkers(root);
    else clearMediaTextMarkers(root);
    if (surfaceMode.display) syncPositionedOverlayMarkers(root);
    else clearPositionedOverlayMarkers(root);
}

const surfaceSync = afterNextPaint(() => {
    const root = surfaceSyncRoot;
    surfaceSyncRoot = null;
    if (!root || !overlayMarkerObserver || !root.isConnected) return;
    runSurfacePass(root);
});

/**
 * Settings that change what the surface pass reads: the theme (display on /
 * off, text plates on / off) and link backgrounds (their rule has no
 * bg-sample opt-out, so it shows up in the sampled background). Font,
 * spacing, tone filters, underline and the pointer cues never touch
 * background-color, so they no longer re-walk the page.
 */
export function surfaceInputsKey(
    s: Pick<A11ySettings, "theme" | "linkBackground">,
): string {
    return `${s.theme}|${s.linkBackground ? 1 : 0}`;
}

/** Runs the surface pass after the next paint; repeated calls coalesce. */
function scheduleDisplaySurfaceSync(pageRoot: HTMLElement) {
    surfaceSyncRoot = pageRoot;
    surfaceSync.schedule();
}

function cancelDisplaySurfaceSync() {
    surfaceSync.cancel();
    surfaceSyncRoot = null;
}

/** Run a pending surface pass now (embedders / tests that need it settled). */
export function flushDisplaySurfaceSync() {
    surfaceSync.flush();
}

const OWN_CLASS_PREFIX = "unilens-";
const OWN_STYLE_PREFIX = "--unilens-";

function withoutOwnClasses(value: string): string {
    let out = "";
    // classList re-serializes with single spaces, so split on any whitespace.
    for (const c of value.split(/\s+/)) {
        if (c === "" || c.startsWith(OWN_CLASS_PREFIX)) continue;
        out = out === "" ? c : `${out} ${c}`;
    }
    return out;
}

function withoutOwnStyles(value: string): string {
    let out = "";
    for (const d of value.split(";")) {
        // Writing one property re-serializes the attribute ("a:b" → "a: b").
        const t = d.trim().replace(/\s*:\s*/, ": ");
        if (t === "" || t.startsWith(OWN_STYLE_PREFIX)) continue;
        out = out === "" ? t : `${out};${t}`;
    }
    return out;
}

/**
 * True when a class/style mutation only touched what this library writes
 * (`unilens-*` classes, `--unilens-*` custom properties — the text-size
 * features). Those never change a host background, and reacting to them made
 * every text-size change walk the page a second time.
 */
export function isOwnStyleMutation(
    attributeName: string | null,
    oldValue: string | null,
    newValue: string | null,
): boolean {
    if (attributeName !== "class" && attributeName !== "style") return false;
    const before = oldValue ?? "";
    const after = newValue ?? "";
    if (before === after) return true;
    // Nothing of ours on either side: any difference is the host's.
    const own = attributeName === "class" ? OWN_CLASS_PREFIX : OWN_STYLE_PREFIX;
    if (!before.includes(own) && !after.includes(own)) return false;
    return attributeName === "class"
        ? withoutOwnClasses(before) === withoutOwnClasses(after)
        : withoutOwnStyles(before) === withoutOwnStyles(after);
}

function onHostMutations(records: MutationRecord[], pageRoot: HTMLElement) {
    for (const r of records) {
        if (
            r.type === "attributes" &&
            r.target instanceof Element &&
            isOwnStyleMutation(
                r.attributeName,
                r.oldValue,
                r.target.getAttribute(r.attributeName ?? ""),
            )
        ) {
            continue;
        }
        scheduleDisplaySurfaceSync(pageRoot);
        return;
    }
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
        timer = window.setTimeout(
            () => scheduleDisplaySurfaceSync(pageRoot),
            200,
        );
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
    const root = document.getElementById(PAGE_CONTENT_ROOT_ID);
    if (root && overlayMarkerObserver && surfaceMode.mediaText)
        scheduleDisplaySurfaceSync(root);
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
    const pageRoot = document.getElementById(PAGE_CONTENT_ROOT_ID);
    ensurePositionedOverlayObserver(pageRoot, {
        display: false,
        mediaText: false,
    });
    if (pageRoot) {
        pageRoot.removeAttribute(HTML_ATTR_PAGE_FILTER);
        pageRoot.removeAttribute(HTML_ATTR_IMAGE_FILTER);
        pageRoot.style.removeProperty("filter");
    }
    setToneMaskLayer(null);
    removeToneLayer();
    html.removeAttribute(BODY_EXPAND_LEVEL_ATTR);
    restorePageContentRoot();
    removeUdFontLink();
}
