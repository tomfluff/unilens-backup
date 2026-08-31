/**
 * Apply font-size scale ratios (100% / 150% / 200%) to the user's text selection.
 * Ratios match automatic / accessibility font-size settings.
 */
import {
    FONT_SCALE_LEVELS,
    levelToScale,
    scaleToLevel,
    type FontScaleLevel,
} from "./fontScales";
import { fontScaleLabel, t } from "./accessibilityI18n";
import { saveSettings, settings } from "./settings";
import { isUniLensOverlayNode } from "./domIds";

const WRAP_ATTR = "data-unilens-text-resize";

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
        if (cur instanceof HTMLElement && cur.hasAttribute(WRAP_ATTR))
            return cur;
        cur = cur.parentNode;
    }
    return null;
}

function rangeText(range: Range): string {
    return range.toString().replace(/\s+/g, " ").trim();
}

/** Original computed font size before any selection resize wrapper. */
function getBaseFontSizePx(range: Range): number {
    const wrapper =
        findResizeWrapper(range.startContainer) ??
        findResizeWrapper(range.endContainer);
    if (wrapper) {
        const stored = parseFloat(
            wrapper.getAttribute("data-unilens-font-base") ?? "",
        );
        if (Number.isFinite(stored) && stored > 0) return stored;
    }

    const el = rangeRootElement(range);
    if (!el) return 16;
    const px = parseFloat(getComputedStyle(el).fontSize);
    return Number.isFinite(px) && px > 0 ? px : 16;
}

export function levelToPx(level: SelectionFontLevel, basePx?: number): number {
    const base = basePx ?? 16;
    return Math.max(1, Math.round(base * levelToScale(level)));
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
 *
 * Goes through the same resolution as resizing (raw selection → applied
 * wrapper → retained range), so the "resized range" and the "range read
 * aloud" never drift apart. Returns null if there is no target.
 */
export function getActiveSelectionRange(): Range | null {
    return getRangeForApply();
}

function readWrapperState(wrapper: HTMLElement) {
    const basePx = parseFloat(
        wrapper.getAttribute("data-unilens-font-base") ?? "",
    );
    const scale = parseFloat(
        wrapper.getAttribute("data-unilens-font-scale") ?? "",
    );
    const px = parseFloat(
        wrapper.getAttribute("data-unilens-font-px") ?? wrapper.style.fontSize,
    );
    return {
        basePx: Number.isFinite(basePx) ? basePx : null,
        scale: Number.isFinite(scale) ? scale : null,
        px: Number.isFinite(px) ? px : null,
    };
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
                        text: text.length > 48 ? text.slice(0, 48) + "…" : text,
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
                    text: text.length > 48 ? text.slice(0, 48) + "…" : text,
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
            text: text.length > 48 ? text.slice(0, 48) + "…" : text,
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
                    text: text.length > 48 ? text.slice(0, 48) + "…" : text,
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
    const px = levelToPx(level, basePx);
    const existing =
        findResizeWrapper(range.startContainer) ??
        findResizeWrapper(range.endContainer) ??
        findResizeWrapper(range.commonAncestorContainer);

    if (existing && range.intersectsNode(existing)) {
        existing.style.fontSize = `${px}px`;
        existing.style.lineHeight = "1.35";
        existing.setAttribute(
            "data-unilens-font-base",
            String(Math.round(basePx)),
        );
        existing.setAttribute("data-unilens-font-scale", String(scale));
        existing.setAttribute("data-unilens-font-px", String(px));
        existing.setAttribute("data-unilens-font-level", String(level));
        return existing;
    }

    const span = document.createElement("span");
    span.setAttribute(WRAP_ATTR, "1");
    span.setAttribute("data-unilens-font-base", String(Math.round(basePx)));
    span.setAttribute("data-unilens-font-scale", String(scale));
    span.setAttribute("data-unilens-font-px", String(px));
    span.setAttribute("data-unilens-font-level", String(level));
    span.style.fontSize = `${px}px`;
    span.style.lineHeight = "1.35";
    span.style.display = "inline";

    try {
        range.surroundContents(span);
    } catch {
        const fragment = range.extractContents();
        span.appendChild(fragment);
        range.insertNode(span);
    }
    return span;
}

export function applySelectionFontLevel(
    level: SelectionFontLevel,
): ApplySelectionResult {
    const scale = levelToScale(level);
    settings.selectionFontLevel = level;
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

    const parent = wrapper.parentNode;
    if (!parent) return { ok: false, message: t().selClearFailed };

    const first = wrapper.firstChild;
    const last = wrapper.lastChild;
    while (wrapper.firstChild) parent.insertBefore(wrapper.firstChild, wrapper);
    parent.removeChild(wrapper);

    activeWrapper = null;

    if (first && last) {
        const range = document.createRange();
        range.setStartBefore(first);
        range.setEndAfter(last);
        restoreSelectionOnRange(range);
        persistedRange = range.cloneRange();
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
    clearSelectionFontSize();
}
