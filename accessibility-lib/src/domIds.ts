/** DOM ids, classes, and data attributes — all prefixed with `unilens` per CONTRIBUTING.md. */

export const A11Y_ROOT_ID = "unilens-a11y-root";
export const A11Y_TOGGLE_ID = "unilens-a11y-toggle";
export const A11Y_PANEL_ID = "unilens-a11y-panel";
export const A11Y_TITLE_ID = "unilens-a11y-title";
export const A11Y_PAGE_STYLE_ID = "unilens-a11y-page-styles";
export const A11Y_WIDGET_STYLE_ID = "unilens-a11y-widget-styles";
export const A11Y_UD_FONT_LINK_ID = "unilens-a11y-ud-font";

export const PAGE_CONTENT_ROOT_ID = "unilens-a11y-page-root";

export const UI_ATTR = "data-unilens-ui";
export const PAGE_CONTENT_ATTR = "data-unilens-page-content";

/** Panel widget class prefix — every class is `${A11Y_CLASS_PREFIX}-*`. */
export const A11Y_CLASS_PREFIX = "unilens-a11y";
export const A11Y_OPEN_CLASS = "unilens-a11y-open";

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
export const HTML_ATTR_PAGE_FILTER = "data-unilens-a11y-page-filter";
/** Saturation / contrast on media only (theme = standard). */
export const HTML_ATTR_IMAGE_FILTER = "data-unilens-a11y-image-filter";

/**
 * Marked on host elements that originally had an opaque background-color.
 * CSS paints them with the themed surface instead of the blanket transparent reset.
 */
export const POSITIONED_OVERLAY_ATTR = "data-unilens-a11y-positioned-overlay";

/**
 * Temporary probe flag: opts an element out of the transparent background reset
 * so syncPositionedOverlayMarkers can read the host author’s background-color.
 */
export const BG_SAMPLE_ATTR = "data-unilens-a11y-bg-sample";

export const HTML_STYLE_FONT_SCALE = "--unilens-a11y-font-scale";
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

export const UNILENS_OVERLAY_ROOT_IDS = [
    A11Y_ROOT_ID,
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
