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

export const PAGE_CONTENT_ROOT_ID = "unilens-a11y-page-root";

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
export const HTML_ATTR_PAGE_FILTER = "data-unilens-a11y-page-filter";
/** Legacy: standard-theme tone used to hit media only. Always cleared. */
export const HTML_ATTR_IMAGE_FILTER = "data-unilens-a11y-image-filter";

/**
 * Marked on host elements that originally had an opaque background-color.
 * CSS paints them with the themed surface instead of the blanket transparent reset.
 */
export const POSITIONED_OVERLAY_ATTR = "data-unilens-a11y-positioned-overlay";

/**
 * Temporary probe flag: opts an element out of the transparent background reset
 * (and freezes transitions) so syncPositionedOverlayMarkers can read the host
 * author’s settled background-color.
 */
export const BG_SAMPLE_ATTR = "data-unilens-a11y-bg-sample";

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

export const UNILENS_OVERLAY_ROOT_IDS = [
    A11Y_ROOT_ID,
    CURSOR_HALO_ID,
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
