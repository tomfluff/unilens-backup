/**
 * Apply font-size scale ratios (100% / 150% / 200%) to the user's text selection.
 * Ratios match automatic / accessibility font-size settings.
 *
 * Host-page citizenship: we inject a prefixed <span> around the selection and
 * unwrap it on clear/teardown — never reconstruct host markup, only remove our wrapper.
 */

import { fontScaleLabel, t } from "./accessibilityI18n";
import {
    isUniLensOverlayNode,
    SELECTION_FONT_BASE_ATTR,
    SELECTION_FONT_LEVEL_ATTR,
    SELECTION_FONT_PX_ATTR,
    SELECTION_FONT_SCALE_ATTR,
    SELECTION_FONT_SIZE_VAR,
    SELECTION_RESIZE_ATTR,
    SELECTION_RESIZE_CLASS,
    SELECTION_RESIZE_STYLE_ID,
} from "./domIds";
import {
    FONT_SCALE_LEVELS,
    type FontScaleLevel,
    levelToScale,
    scaledFontPx,
    scaleToLevel,
} from "./fontScales";
import { readUnscaledFontSizePx } from "./pageFontScale";
import { saveSettings, updateSetting } from "./settings";

export { FONT_SCALE_LEVELS };
export type SelectionFontLevel = FontScaleLevel;

export interface SelectionInfo {
    hasSelection: boolean;
    text: string;
    charCount: number;
    appliedLevel: SelectionFontLevel | null;
    appliedPx: number | null;
    appliedScale: number | null;
    sticky: boolean;
}

export interface ApplySelectionResult {
    ok: boolean;
    message: string;
    level?: SelectionFontLevel;
    px?: number;
    scale?: number;
}

const RESIZE_CSS = `
[${SELECTION_RESIZE_ATTR}].${SELECTION_RESIZE_CLASS} {
  font-size: var(${SELECTION_FONT_SIZE_VAR}, inherit) !important;
  line-height: 1.35;
  display: inline;
}
`;

let persistedRange: Range | null = null;
let activeWrapper: HTMLElement | null = null;
let selectionListener: (() => void) | null = null;
let selectionActive = false;
let onSelectionChangeHandler: (() => void) | null = null;

function isUniLensNode(el: Element | null): boolean {
    return isUniLensOverlayNode(el);
}

function rangeRootElement(range: Range): Element | null {
    const root = range.commonAncestorContainer;
    return root.nodeType === Node.TEXT_NODE
        ? root.parentElement
        : (root as Element);
}

function isUniLensRange(range: Range): boolean {
    return isUniLensNode(rangeRootElement(range));
}

function findResizeWrapper(node: Node | null): HTMLElement | null {
    let cur: Node | null = node;
    while (cur) {
        if (
            cur instanceof HTMLElement &&
            cur.hasAttribute(SELECTION_RESIZE_ATTR)
        )
            return cur;
        cur = cur.parentNode;
    }
    return null;
}

function rangeText(range: Range): string {
    return range.toString().replace(/\s+/g, " ").trim();
}

function ensureResizeStylesheet() {
    if (document.getElementById(SELECTION_RESIZE_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = SELECTION_RESIZE_STYLE_ID;
    style.textContent = RESIZE_CSS;
    document.head.appendChild(style);
}

/** Original computed font size before any selection resize wrapper. */
function getBaseFontSizePx(range: Range): number {
    const wrapper =
        findResizeWrapper(range.startContainer) ??
        findResizeWrapper(range.endContainer);
    if (wrapper) {
        const stored = parseFloat(
            wrapper.getAttribute(SELECTION_FONT_BASE_ATTR) ?? "",
        );
        if (Number.isFinite(stored) && stored > 0) return stored;
    }

    const el = rangeRootElement(range);
    if (!el || !(el instanceof HTMLElement)) return 16;
    return readUnscaledFontSizePx(el);
}

export function levelToPx(level: SelectionFontLevel, basePx?: number): number {
    const base = basePx ?? 16;
    return Math.max(1, scaledFontPx(base, levelToScale(level)));
}

export function pxToLevel(
    px: number,
    basePx?: number,
): SelectionFontLevel | null {
    const base = basePx ?? 16;
    if (base <= 0) return null;
    return scaleToLevel(px / base);
}

function restoreSelectionOnRange(range: Range) {
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(range);
}

function restoreSelectionOnWrapper(wrapper: HTMLElement) {
    const range = document.createRange();
    range.selectNodeContents(wrapper);
    restoreSelectionOnRange(range);
    persistedRange = range.cloneRange();
}

function getRangeForApply(): Range | null {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
        const live = sel.getRangeAt(0);
        if (!isUniLensRange(live) && rangeText(live)) return live.cloneRange();
    }

    if (activeWrapper?.isConnected) {
        const range = document.createRange();
        range.selectNodeContents(activeWrapper);
        return range;
    }

    if (persistedRange) {
        try {
            const clone = persistedRange.cloneRange();
            if (!isUniLensRange(clone) && rangeText(clone)) return clone;
        } catch {
            persistedRange = null;
        }
    }

    return null;
}

/**
 * The "currently targeted range" for other features that operate on the
 * selection, such as read-aloud.
 */
export function getActiveSelectionRange(): Range | null {
    return getRangeForApply();
}

function readWrapperState(wrapper: HTMLElement) {
    const basePx = parseFloat(
        wrapper.getAttribute(SELECTION_FONT_BASE_ATTR) ?? "",
    );
    const scale = parseFloat(
        wrapper.getAttribute(SELECTION_FONT_SCALE_ATTR) ?? "",
    );
    const px = parseFloat(
        wrapper.getAttribute(SELECTION_FONT_PX_ATTR) ??
            wrapper.style.getPropertyValue(SELECTION_FONT_SIZE_VAR),
    );
    return {
        basePx: Number.isFinite(basePx) ? basePx : null,
        scale: Number.isFinite(scale) ? scale : null,
        px: Number.isFinite(px) ? px : null,
    };
}

function applyWrapperMetrics(
    wrapper: HTMLElement,
    basePx: number,
    scale: number,
    level: SelectionFontLevel,
    px: number,
) {
    wrapper.setAttribute(SELECTION_FONT_BASE_ATTR, String(Math.round(basePx)));
    wrapper.setAttribute(SELECTION_FONT_SCALE_ATTR, String(scale));
    wrapper.setAttribute(SELECTION_FONT_PX_ATTR, String(px));
    wrapper.setAttribute(SELECTION_FONT_LEVEL_ATTR, String(level));
    wrapper.style.setProperty(SELECTION_FONT_SIZE_VAR, `${px}px`);
}

export function getSelectionInfo(): SelectionInfo {
    const sticky = !!(activeWrapper?.isConnected || persistedRange);

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
        const range = sel.getRangeAt(0);
        if (!isUniLensRange(range)) {
            const text = rangeText(range);
            if (text) {
                const wrapper =
                    findResizeWrapper(sel.anchorNode) ??
                    findResizeWrapper(sel.focusNode);
                if (wrapper) {
                    const { basePx, scale, px } = readWrapperState(wrapper);
                    return {
                        hasSelection: true,
                        text: text.length > 48 ? `${text.slice(0, 48)}…` : text,
                        charCount: text.length,
                        appliedLevel:
                            scale != null
                                ? scaleToLevel(scale)
                                : px != null && basePx
                                  ? pxToLevel(px, basePx)
                                  : null,
                        appliedPx: px,
                        appliedScale: scale,
                        sticky,
                    };
                }
                return {
                    hasSelection: true,
                    text: text.length > 48 ? `${text.slice(0, 48)}…` : text,
                    charCount: text.length,
                    appliedLevel: null,
                    appliedPx: null,
                    appliedScale: null,
                    sticky,
                };
            }
        }
    }

    if (activeWrapper?.isConnected) {
        const text =
            activeWrapper.textContent?.replace(/\s+/g, " ").trim() ?? "";
        const { scale, px } = readWrapperState(activeWrapper);
        return {
            hasSelection: text.length > 0,
            text: text.length > 48 ? `${text.slice(0, 48)}…` : text,
            charCount: text.length,
            appliedLevel: scale != null ? scaleToLevel(scale) : null,
            appliedPx: px,
            appliedScale: scale,
            sticky: true,
        };
    }

    if (persistedRange) {
        try {
            const text = rangeText(persistedRange);
            if (text) {
                return {
                    hasSelection: true,
                    text: text.length > 48 ? `${text.slice(0, 48)}…` : text,
                    charCount: text.length,
                    appliedLevel: null,
                    appliedPx: null,
                    appliedScale: null,
                    sticky: true,
                };
            }
        } catch {
            persistedRange = null;
        }
    }

    return {
        hasSelection: false,
        text: "",
        charCount: 0,
        appliedLevel: null,
        appliedPx: null,
        appliedScale: null,
        sticky: false,
    };
}

function wrapRange(
    range: Range,
    basePx: number,
    scale: number,
    level: SelectionFontLevel,
): HTMLElement {
    ensureResizeStylesheet();
    const px = levelToPx(level, basePx);
    const existing =
        findResizeWrapper(range.startContainer) ??
        findResizeWrapper(range.endContainer) ??
        findResizeWrapper(range.commonAncestorContainer);

    if (existing && range.intersectsNode(existing)) {
        applyWrapperMetrics(existing, basePx, scale, level, px);
        return existing;
    }

    const span = document.createElement("span");
    span.setAttribute(SELECTION_RESIZE_ATTR, "1");
    span.classList.add(SELECTION_RESIZE_CLASS);
    applyWrapperMetrics(span, basePx, scale, level, px);

    try {
        range.surroundContents(span);
    } catch {
        const fragment = range.extractContents();
        span.appendChild(fragment);
        range.insertNode(span);
    }
    return span;
}

/** Unwrap one injected resize span, restoring the host's original child nodes. */
function unwrapResizeWrapper(wrapper: HTMLElement): boolean {
    const parent = wrapper.parentNode;
    if (!parent) return false;

    const first = wrapper.firstChild;
    const last = wrapper.lastChild;
    while (wrapper.firstChild) parent.insertBefore(wrapper.firstChild, wrapper);
    parent.removeChild(wrapper);

    if (wrapper === activeWrapper) activeWrapper = null;

    if (first && last) {
        const range = document.createRange();
        range.setStartBefore(first);
        range.setEndAfter(last);
        restoreSelectionOnRange(range);
        persistedRange = range.cloneRange();
    }

    return true;
}

/** Remove every resize wrapper we injected under `root` (teardown / full reset). */
export function unwrapAllSelectionWrappers(root: ParentNode = document.body) {
    const wrappers = root.querySelectorAll(`[${SELECTION_RESIZE_ATTR}]`);
    for (const node of wrappers) {
        if (node instanceof HTMLElement) unwrapResizeWrapper(node);
    }
    activeWrapper = null;
}

export function applySelectionFontLevel(
    level: SelectionFontLevel,
): ApplySelectionResult {
    const scale = levelToScale(level);
    updateSetting("selectionFontLevel", level);
    saveSettings();

    const range = getRangeForApply();
    if (!range) {
        return { ok: false, message: t().selNeedSelection };
    }

    if (isUniLensRange(range)) {
        return { ok: false, message: t().selUiBlocked };
    }

    if (!rangeText(range)) {
        return { ok: false, message: t().selWhitespaceOnly };
    }

    const basePx = getBaseFontSizePx(range);
    const px = levelToPx(level, basePx);

    try {
        const wrapper = wrapRange(range, basePx, scale, level);
        activeWrapper = wrapper;
        restoreSelectionOnWrapper(wrapper);
        return {
            ok: true,
            message: t().selApplied(fontScaleLabel(level), px),
            level,
            px,
            scale,
        };
    } catch (err) {
        return { ok: false, message: t().selApplyFailed(String(err)) };
    }
}

export function clearSelectionFontSize(): ApplySelectionResult {
    const wrapper = activeWrapper?.isConnected
        ? activeWrapper
        : (() => {
              const sel = window.getSelection();
              return (
                  (sel && findResizeWrapper(sel.anchorNode)) ??
                  (sel && findResizeWrapper(sel.focusNode)) ??
                  null
              );
          })();

    if (!wrapper) {
        return { ok: false, message: t().selNothingToClear };
    }

    if (!unwrapResizeWrapper(wrapper)) {
        return { ok: false, message: t().selClearFailed };
    }

    return { ok: true, message: t().selCleared };
}

export function onSelectionChange(cb: () => void): () => void {
    selectionListener = cb;
    return () => {
        if (selectionListener === cb) selectionListener = null;
    };
}

export function initSelectionTextSize() {
    if (selectionActive) return;
    selectionActive = true;
    ensureResizeStylesheet();
    onSelectionChangeHandler = () => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;

        if (!sel.isCollapsed) {
            const range = sel.getRangeAt(0);
            if (isUniLensRange(range)) return;

            const text = rangeText(range);
            if (!text) return;

            persistedRange = range.cloneRange();
            const wrapper =
                findResizeWrapper(sel.anchorNode) ??
                findResizeWrapper(sel.focusNode);
            if (wrapper) activeWrapper = wrapper;
            else if (!activeWrapper?.contains(range.commonAncestorContainer))
                activeWrapper = null;
        }

        selectionListener?.();
    };
    document.addEventListener("selectionchange", onSelectionChangeHandler);
}

export function destroySelectionTextSize() {
    if (!selectionActive) return;
    selectionActive = false;
    if (onSelectionChangeHandler)
        document.removeEventListener(
            "selectionchange",
            onSelectionChangeHandler,
        );
    onSelectionChangeHandler = null;
    unwrapAllSelectionWrappers();
    document.getElementById(SELECTION_RESIZE_STYLE_ID)?.remove();
}
