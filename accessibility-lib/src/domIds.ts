/** DOM ids, classes, and data attributes — all prefixed with `unilens` per CONTRIBUTING.md. */

export const A11Y_ROOT_ID = "unilens-a11y-root";
export const CURSOR_HALO_ID = "unilens-a11y-cursor-halo";
export const CURSOR_HALO_SIZE_VAR = "--unilens-a11y-cursor-halo-size";
export const CURSOR_HALO_FILL_VAR = "--unilens-a11y-cursor-halo-fill";
export const CURSOR_HALO_RGB_VAR = "--unilens-a11y-cursor-halo-rgb";
export const FOCUS_CURSOR_ID = "unilens-a11y-focus-cursor";
export const FOCUS_CURSOR_TOP_ID = "unilens-a11y-focus-cursor-top";
export const FOCUS_CURSOR_BOTTOM_ID = "unilens-a11y-focus-cursor-bottom";
export const FOCUS_CURSOR_EDGE_TOP_ID = "unilens-a11y-focus-cursor-edge-top";
export const FOCUS_CURSOR_EDGE_BOTTOM_ID =
    "unilens-a11y-focus-cursor-edge-bottom";
export const READING_GUIDE_ID = "unilens-a11y-reading-guide";
export const READING_GUIDE_FILL_VAR = "--unilens-a11y-reading-guide-fill";
export const READING_GUIDE_EDGE_VAR = "--unilens-a11y-reading-guide-edge";
/** "up" | "down" — which way the center tip (::before/::after triangle) points. */
export const READING_GUIDE_TIP_ATTR = "data-unilens-a11y-reading-guide-tip";
export const A11Y_TOGGLE_ID = "unilens-a11y-toggle";
export const A11Y_PANEL_ID = "unilens-a11y-panel";
export const A11Y_TITLE_ID = "unilens-a11y-title";
export const A11Y_CSS_LINK_ID = "unilens-a11y-stylesheet";
export const A11Y_PAGE_STYLE_ID = "unilens-a11y-page-styles";
export const A11Y_WIDGET_STYLE_ID = "unilens-a11y-widget-styles";
export const A11Y_UD_FONT_LINK_ID = "unilens-a11y-ud-font";
/** text-options.css, present only while line spacing / typeface / letter spacing is changed. */
export const A11Y_TEXT_OPTIONS_STYLE_ID = "unilens-a11y-text-options-styles";

export const PAGE_CONTENT_ROOT_ID = "unilens-a11y-page-root";
/**
 * Full-viewport, click-through layer that paints saturation / contrast with
 * `backdrop-filter`. A `filter` on the page root would make it the containing
 * block of the host's `position: fixed` chrome, so fixed headers scrolled away.
 */
export const TONE_LAYER_ID = "unilens-a11y-tone-layer";

export const UI_ATTR = "data-unilens-ui";
export const PAGE_CONTENT_ATTR = "data-unilens-page-content";

/** Optional extra stylesheet when `init({ cssUrl })` is passed. The page theme CSS is bundled. */
export const DEFAULT_A11Y_CSS_PATH = "unilens-a11y/style.css";

/** Panel widget class prefix — every class is `${A11Y_CLASS_PREFIX}-*`. */
export const A11Y_CLASS_PREFIX = "unilens-a11y";
export const A11Y_OPEN_CLASS = "unilens-a11y-open";

/** Tab button / tabpanel ids for the panel shell (ARIA tablist). */
export const a11yTabId = (tab: string) => `unilens-a11y-tab-${tab}`;
export const a11yTabpanelId = (tab: string) => `unilens-a11y-tabpanel-${tab}`;

export const FOCUS_KEY_ATTR = "data-unilens-a11y-focus-key";
export const REDUCE_MOTION_ATTR = "data-unilens-a11y-reduce-motion";

/** Attributes set on <html> by applyA11yToDocument(). */
export const HTML_ATTR_THEME = "data-unilens-a11y-theme";
export const HTML_ATTR_SATURATION = "data-unilens-a11y-saturation";
export const HTML_ATTR_CONTRAST = "data-unilens-a11y-contrast";
export const HTML_ATTR_DISPLAY_ACTIVE = "data-unilens-a11y-display-active";
export const HTML_ATTR_HTML_FILTER = "data-unilens-a11y-html-filter";
export const HTML_ATTR_FONT_SIZE = "data-unilens-a11y-font-size";
export const HTML_ATTR_FONT_FAMILY = "data-unilens-a11y-font-family";
export const HTML_ATTR_LINE_HEIGHT = "data-unilens-a11y-line-height";
export const HTML_ATTR_LETTER_SPACING = "data-unilens-a11y-letter-spacing";
export const HTML_ATTR_LINK_UNDERLINE = "data-unilens-a11y-link-underline";
export const HTML_ATTR_LINK_BACKGROUND = "data-unilens-a11y-link-background";
export const HTML_ATTR_LINK_BORDER = "data-unilens-a11y-link-border";
export const HTML_ATTR_IMAGE_BORDER = "data-unilens-a11y-image-border";
export const HTML_ATTR_ELEMENT_HIGHLIGHT =
    "data-unilens-a11y-element-highlight";
export const HTML_ATTR_FOCUS_ENHANCE = "data-unilens-a11y-focus-enhance";
export const HTML_ATTR_REDUCE_MOTION = "data-unilens-a11y-reduce-motion";
export const HTML_ATTR_TEXT_STROKE = "data-unilens-a11y-text-stroke";
export const HTML_ATTR_TEXT_PLATE = "data-unilens-a11y-text-plate";
/**
 * High contrast only: how far it reaches (HcTextScope: parts / all).
 * The stylesheet and the surface pass read it.
 */
export const HTML_ATTR_HC_SCOPE = "data-unilens-a11y-hc-scope";
export const HTML_ATTR_PAGE_FILTER = "data-unilens-a11y-page-filter";
/** Legacy: standard-theme tone used to hit media only. Always cleared. */
export const HTML_ATTR_IMAGE_FILTER = "data-unilens-a11y-image-filter";

/**
 * Marked on host elements that originally had an opaque background-color.
 * CSS paints them with the themed surface instead of the blanket transparent reset.
 */
export const POSITIONED_OVERLAY_ATTR = "data-unilens-a11y-positioned-overlay";

/**
 * Host elements (and their ::before / ::after) whose opaque fill is not a
 * plain surface: a mid gray ("muted") or a colored fill ("tone"). The themed
 * color is in the matching inline custom property (fillTone.ts), so states
 * told apart only by their fill — a switch, a selected chip, a swatch — stay
 * apart under a color theme.
 */
export const FILL_ATTR = "data-unilens-a11y-fill";
export const FILL_BEFORE_ATTR = "data-unilens-a11y-fill-before";
export const FILL_AFTER_ATTR = "data-unilens-a11y-fill-after";
export const FILL_VAR = "--unilens-a11y-fill";
export const FILL_BEFORE_VAR = "--unilens-a11y-fill-before";
export const FILL_AFTER_VAR = "--unilens-a11y-fill-after";

/**
 * High contrast, reach "all": a background-image made only of gradients
 * (a promo card, a gradient header or button) is dropped, so the element
 * takes the themed surface.
 */
export const GRADIENT_OFF_ATTR = "data-unilens-a11y-gradient-off";
/**
 * High contrast, reach "all": text painted by its background
 * (`background-clip: text`, a star rating drawn as a gradient) keeps that
 * background over its plate; dropping it would leave the glyphs invisible.
 */
export const CLIP_TEXT_ATTR = "data-unilens-a11y-clip-text";

/**
 * Host elements (and their ::before / ::after) whose border is not a plain
 * themed line: a transparent side (the hidden sides of a CSS triangle, the
 * idle underline of a tab) or a thick colored side drawn as a shape (a
 * ribbon, an arrow head). The themed `border-color` (four values) is in the
 * matching inline custom property (fillTone.ts `themedBorderColor`).
 */
export const BORDER_ATTR = "data-unilens-a11y-border";
export const BORDER_BEFORE_ATTR = "data-unilens-a11y-border-before";
export const BORDER_AFTER_ATTR = "data-unilens-a11y-border-after";
export const BORDER_VAR = "--unilens-a11y-border";
export const BORDER_BEFORE_VAR = "--unilens-a11y-border-before";
export const BORDER_AFTER_VAR = "--unilens-a11y-border-after";

/**
 * Temporary probe flag on <html>: lifts the transparent background reset and
 * the surface fills (and freezes transitions) so syncPositionedOverlayMarkers
 * can read the host author’s settled background-color. Set and removed in one
 * synchronous block, never across a paint. (It used to be set on every page
 * element, which sent thousands of attribute mutations to host observers on
 * every pass.)
 */
export const BG_SAMPLE_ATTR = "data-unilens-a11y-bg-sample";

/**
 * Held on <html> for one style flush right after the bg-sample probe ends.
 * Dropping the probe flips elements from their sampled author color back to
 * the themed one; with transitions enabled, a host `transition: all .3s` would
 * fade between the two and flash the unthemed color. Freezing transitions in
 * the same batch that ends the probe means that flip never starts a transition.
 */
export const BG_FREEZE_ATTR = "data-unilens-a11y-bg-freeze";

/**
 * Marks a host element whose own CSS transition is running while a probe
 * (bg-sample, bg-freeze, mediaTextGuard paint-probe) freezes transitions.
 * `transition: none` cancels a running transition — the element jumped to its
 * end state and the host's `transitionend` never fired — so these elements
 * are left out of the freeze. Written only when the set changes.
 */
export const KEEP_MOTION_ATTR = "data-unilens-a11y-keep-motion";

/**
 * Marked on a host element when its own ::before / ::after pseudo-element
 * paints an opaque background-color of its own (e.g. SoftBank decorative
 * hairlines/arrows such as `.p-graduateArrow::after`, `.c-hdg::after`).
 * The blanket transparent reset only targets real elements (`*` does not
 * match `::before`/`::after`), so without this the pseudo keeps its
 * hardcoded author background while its `color` is still forced to the
 * theme text color by the `*::before, *::after` rule — e.g. bright yellow
 * text-color content sitting on a leftover white pseudo-element background
 * in high-contrast mode. CSS repaints the matched pseudo with the themed
 * surface instead, mirroring POSITIONED_OVERLAY_ATTR for real elements.
 */
export const PSEUDO_OVERLAY_BEFORE_ATTR =
    "data-unilens-a11y-pseudo-overlay-before";
export const PSEUDO_OVERLAY_AFTER_ATTR =
    "data-unilens-a11y-pseudo-overlay-after";

/**
 * Legacy marker: previous builds dimmed overlapping photos in high-contrast.
 * Cleared on apply/teardown so leftover brightness/scrim cannot stick.
 */
export const BG_MEDIA_ATTR = "data-unilens-a11y-bg-media";

/**
 * High-contrast / Lab text plate: element directly owns visible text (or
 * ::before/::after glyphs). CSS paints a solid plate so type never sits on
 * leftover light pixels. Wrapper-only layers are left unmarked so photos
 * show through.
 */
export const TEXT_BG_ATTR = "data-unilens-a11y-text-bg";
export const TEXT_BG_BEFORE_ATTR = "data-unilens-a11y-text-bg-before";
export const TEXT_BG_AFTER_ATTR = "data-unilens-a11y-text-bg-after";
/**
 * Marked on a host element that owns no text of its own (a wrapper such as a
 * card link or list item). The tag-based text-plate rule skips these, so a
 * photo set as the wrapper's background-image stays visible; the text inside
 * is plated by its own element.
 */
export const TEXT_BG_SKIP_ATTR = "data-unilens-a11y-text-bg-skip";

/**
 * Text drawn on top of a picture (mediaTextGuard.ts). Set on the picture
 * block and every descendant: color rules (theme palette, text plates, text
 * outline, link background) skip these so the host's own colors stay.
 */
export const MEDIA_TEXT_ATTR = "data-unilens-a11y-media-text";
/**
 * The picture block itself: whole-page filters are undone here (a hole in the
 * saturation/contrast layer, a counter-filter under invert).
 */
export const MEDIA_TEXT_ROOT_ATTR = "data-unilens-a11y-media-text-root";
/**
 * An element whose own CSS background (or mask / ::before / ::after) paints a
 * picture. Text plates must not strip that background-image — a banner link
 * whose photo is its background would lose the photo.
 */
export const MEDIA_OWNER_ATTR = "data-unilens-a11y-media-owner";

/**
 * An element whose background-image holds a flat-colour gradient layer (the
 * host's way of painting a solid card fill, e.g. `linear-gradient(white 97%,
 * transparent 97%)`). Under a colour theme that layer is swapped for `none`
 * (style.css, via FLAT_FILL_IMAGE_VAR) so the card takes the theme surface
 * instead of staying a white box with theme-coloured text on it.
 */
export const FLAT_FILL_ATTR = "data-unilens-a11y-flat-fill";
/** The element's background-image with each flat-gradient layer set to none. */
export const FLAT_FILL_IMAGE_VAR = "--unilens-a11y-flat-fill-image";

export const HTML_STYLE_FONT_SCALE = "--unilens-a11y-font-scale";

/** Whole-page text scale (font-size only — images stay at their host size). */
export const PAGE_FONT_ATTR = "data-unilens-a11y-page-font";
export const PAGE_FONT_ORIGINAL_ATTR = "data-unilens-a11y-page-font-px";
export const PAGE_FONT_CLASS = "unilens-a11y-page-font";
export const PAGE_FONT_TARGET_VAR = "--unilens-a11y-page-font-px";
/** Per-element cap on the page-font scale. Written on every scaled node so a parent's tighter cap cannot inherit. */
export const PAGE_FONT_CAP_VAR = "--unilens-a11y-page-font-cap";
/** Effective page-font scale the cap in PAGE_FONT_CAP_VAR was last computed against — lets a rescan tell a stale cap (scale changed) from an up-to-date one (only content changed). */
export const PAGE_FONT_CAP_SCALE_ATTR = "data-unilens-a11y-page-font-cap-scale";
export const PAGE_FONT_STYLE_ID = "unilens-page-font-scale-style";
export const HTML_STYLE_LINE_HEIGHT = "--unilens-a11y-line-height";
export const HTML_STYLE_FONT_FAMILY = "--unilens-a11y-font-family";
export const HTML_STYLE_LETTER_SPACING = "--unilens-a11y-letter-spacing";
export const HTML_STYLE_WORD_SPACING = "--unilens-a11y-word-spacing";
export const HTML_STYLE_SATURATE = "--unilens-a11y-display-saturate";
export const HTML_STYLE_CONTRAST = "--unilens-a11y-display-contrast";
/** 1 / saturate and 1 / contrast, for undoing the invert filter on picture blocks. */
export const HTML_STYLE_SATURATE_INV = "--unilens-a11y-display-saturate-inv";
export const HTML_STYLE_CONTRAST_INV = "--unilens-a11y-display-contrast-inv";
export const HTML_STYLE_DISPLAY_BG = "--unilens-a11y-display-bg";
export const HTML_STYLE_DISPLAY_TEXT = "--unilens-a11y-display-text";
export const HTML_STYLE_DISPLAY_SURFACE = "--unilens-a11y-display-surface";
export const HTML_STYLE_DISPLAY_LINK = "--unilens-a11y-display-link";
export const HTML_STYLE_DISPLAY_BORDER = "--unilens-a11y-display-border";
export const HTML_STYLE_FOCUS_RING = "--unilens-a11y-focus-ring";
export const HTML_STYLE_TEXT_STROKE_FILL = "--unilens-a11y-text-stroke-fill";
export const HTML_STYLE_TEXT_STROKE_EDGE = "--unilens-a11y-text-stroke-edge";
export const HTML_STYLE_TEXT_STROKE_WIDTH = "--unilens-a11y-text-stroke-width";
export const HTML_STYLE_TEXT_PLATE_BG = "--unilens-a11y-text-plate-bg";
export const HTML_STYLE_TEXT_PLATE_FG = "--unilens-a11y-text-plate-fg";

/** Body-text expand markers on host elements. */
export const BODY_EXPAND_ATTR = "data-unilens-a11y-body-expanded";
export const BODY_EXPAND_ORIGINAL_ATTR = "data-unilens-a11y-original-font-size";
export const BODY_EXPAND_HTML_ATTR = "data-unilens-a11y-body-text-expand";
export const BODY_EXPAND_LEVEL_ATTR = "data-unilens-a11y-body-text-level";
export const BODY_EXPAND_CLASS = "unilens-a11y-body-text-expand";
export const BODY_EXPAND_TARGET_VAR = "--unilens-a11y-body-target-size";

/** Small-text boost markers on host elements. */
export const SMALL_BOOST_ATTR = "data-unilens-a11y-scaled";
export const SMALL_BOOST_ORIGINAL_ATTR = "data-unilens-a11y-original-px";
export const SMALL_BOOST_HTML_ATTR = "data-unilens-a11y-small-text-boost";
export const SMALL_BOOST_LEVEL_ATTR = "data-unilens-a11y-small-text-level";
export const SMALL_BOOST_CLASS = "unilens-a11y-small-text-boost";
export const SMALL_BOOST_TARGET_VAR = "--unilens-a11y-target-size";

/** Selection text resize — injected wrapper markers (unwrap on clear/teardown). */
export const SELECTION_RESIZE_ATTR = "data-unilens-text-resize";
export const SELECTION_RESIZE_CLASS = "unilens-a11y-text-resize";
export const SELECTION_RESIZE_STYLE_ID = "unilens-a11y-selection-resize-style";
export const SELECTION_FONT_BASE_ATTR = "data-unilens-font-base";
export const SELECTION_FONT_SCALE_ATTR = "data-unilens-font-scale";
export const SELECTION_FONT_PX_ATTR = "data-unilens-font-px";
export const SELECTION_FONT_LEVEL_ATTR = "data-unilens-font-level";
export const SELECTION_FONT_SIZE_VAR = "--unilens-a11y-selection-font-size";
/** Wrappers made by one "apply" share a group id, so they clear together. */
export const SELECTION_GROUP_ATTR = "data-unilens-text-resize-group";
/**
 * Holder for enlarged text whose parent is a flex / grid container: one
 * inline element carrying the whole text, so the container still lays it out
 * as a single item (see selectionTextSize.ts wrapSlice).
 */
export const SELECTION_FLOW_ATTR = "data-unilens-text-resize-flow";

export const UNILENS_OVERLAY_ROOT_IDS = [
    A11Y_ROOT_ID,
    CURSOR_HALO_ID,
    TONE_LAYER_ID,
    "unilens-root",
    "unilens-settings-root",
    "unilens-debug-root",
] as const;

export function isUniLensOverlayNode(el: Element | null): boolean {
    if (!el) return false;
    if (el instanceof HTMLElement && el.getAttribute(UI_ATTR) === "1")
        return true;
    for (const id of UNILENS_OVERLAY_ROOT_IDS) {
        if (el.id === id || el.closest(`#${id}`) != null) return true;
    }
    return false;
}
