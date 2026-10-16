/**
 * Apply font-size scale ratios (100% / 150% / 200%) to the user's text selection.
 * Ratios match automatic / accessibility font-size settings.
 *
 * Host-page citizenship:
 * - Only text is wrapped. Each selected text node gets its own prefixed <span>;
 *   host elements are never split, cloned or moved. (The old single-span wrap
 *   fell back to `extractContents()` for a selection crossing an element
 *   boundary, which cloned host <p>/<li>/<a> — duplicate ids, lost listeners —
 *   and clearing could not merge the clones back.)
 * - The host's own text node stays where it was, holding the unselected text
 *   before the selection; the selected text and the text after it live in
 *   nodes this module owns. Clearing writes the full text back into the host
 *   node and removes ours, so the host DOM ends up exactly as it was.
 * - If the host rewrites or removes its text node while it is enlarged
 *   (framework re-render), the enlargement for that piece is dropped so the
 *   page never shows stale text and the host's own DOM calls never fail.
 */

import { fontScaleLabel, t } from "./accessibilityI18n";
import {
    isUniLensOverlayNode,
    SELECTION_FONT_BASE_ATTR,
    SELECTION_FONT_LEVEL_ATTR,
    SELECTION_FONT_PX_ATTR,
    SELECTION_FONT_SCALE_ATTR,
    SELECTION_FONT_SIZE_VAR,
    SELECTION_GROUP_ATTR,
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

/** Text inside these is never wrapped (not rendered as flow text, or an editor). */
const NO_WRAP_PARENT_TAGS = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "TEMPLATE",
    "TEXTAREA",
    "TITLE",
    "OPTION",
    "SELECT",
]);

/**
 * One host text node and the nodes this module split off it. The host node
 * (`origin`) stays where it was and holds `originData` (the text before the
 * first enlarged part); `ours` are our wrappers and plain text nodes, which
 * always sit right after `origin` as siblings, in text order.
 */
interface Run {
    origin: Text;
    originData: string;
    ours: Set<Node>;
}

const runOfOrigin = new WeakMap<Text, Run>();
const runOfOurNode = new WeakMap<Node, Run>();
const liveRuns = new Set<Run>();
let groupSeq = 0;

let persistedRange: Range | null = null;
let activeGroup: string | null = null;
let selectionListener: (() => void) | null = null;
let selectionActive = false;
let onSelectionChangeHandler: (() => void) | null = null;
let hostWatcher: MutationObserver | null = null;
const wrapperListeners = new Set<() => void>();

function notifyWrappersChanged() {
    for (const cb of wrapperListeners) cb();
}

/** Fires whenever enlarged selections are added or removed. */
export function onSelectionWrappersChange(cb: () => void): () => void {
    wrapperListeners.add(cb);
    return () => {
        wrapperListeners.delete(cb);
    };
}

/** True while any selection on the page is enlarged. */
export function hasSelectionFontSizes(): boolean {
    if (typeof document === "undefined") return false;
    return document.querySelector(`[${SELECTION_RESIZE_ATTR}]`) != null;
}

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

function groupWrappers(group: string | null): HTMLElement[] {
    if (!group) return [];
    return Array.from(
        document.querySelectorAll<HTMLElement>(
            `[${SELECTION_GROUP_ATTR}="${group}"]`,
        ),
    );
}

/** A range from the start of the first wrapper to the end of the last one. */
function rangeOverWrappers(wrappers: HTMLElement[]): Range | null {
    const first = wrappers[0];
    const last = wrappers[wrappers.length - 1];
    if (!first?.isConnected || !last?.isConnected) return null;
    const range = document.createRange();
    range.setStartBefore(first);
    range.setEndAfter(last);
    return range;
}

function activeGroupRange(): Range | null {
    return rangeOverWrappers(groupWrappers(activeGroup));
}

function getRangeForApply(): Range | null {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
        const live = sel.getRangeAt(0);
        if (!isUniLensRange(live) && rangeText(live)) return live.cloneRange();
    }

    const groupRange = activeGroupRange();
    if (groupRange) return groupRange;

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
    const sticky = !!(activeGroupRange() || persistedRange);

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

    const wrappers = groupWrappers(activeGroup);
    if (wrappers.length > 0) {
        const text = wrappers
            .map((w) => w.textContent ?? "")
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();
        const { scale, px } = readWrapperState(wrappers[0]);
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

// ── Host-change watcher ──────────────────────────────────────────────────────

/** Our nodes of a run, in document order (contiguous siblings after origin). */
function runNodes(run: Run): Node[] {
    const out: Node[] = [];
    let cur = run.origin.nextSibling;
    while (cur && run.ours.has(cur)) {
        out.push(cur);
        cur = cur.nextSibling;
    }
    // Anything of ours that is no longer next to the origin (host moved
    // things around) is still ours to clean up.
    for (const n of run.ours) if (!out.includes(n)) out.push(n);
    return out;
}

function forgetRun(run: Run) {
    for (const n of run.ours) runOfOurNode.delete(n);
    runOfOrigin.delete(run.origin);
    liveRuns.delete(run);
}

/** Remove our nodes without touching the host's text node. */
function dropRun(run: Run) {
    for (const n of run.ours) (n as ChildNode).remove();
    forgetRun(run);
}

/**
 * Write the full text back into the host node and remove ours. The host DOM
 * is then exactly what it was before anything was enlarged.
 */
function collapseRun(run: Run) {
    if (!run.origin.isConnected || run.origin.data !== run.originData) {
        dropRun(run);
        return;
    }
    const text = runNodes(run)
        .map((n) => n.textContent ?? "")
        .join("");
    run.origin.data = run.originData + text;
    for (const n of run.ours) (n as ChildNode).remove();
    forgetRun(run);
}

function discardOwnRecords() {
    hostWatcher?.takeRecords();
}

function onHostMutations() {
    let dropped = false;
    for (const run of Array.from(liveRuns)) {
        // The host rewrote its text (a re-render) or removed its node: the
        // host's current content is authoritative, so our copy has to go.
        // Likewise when the host removed our nodes along with their parent.
        const oursGone = Array.from(run.ours).some((n) => !n.isConnected);
        if (
            run.origin.data !== run.originData ||
            !run.origin.isConnected ||
            oursGone
        ) {
            dropRun(run);
            dropped = true;
        }
    }
    discardOwnRecords();
    if (dropped) {
        if (liveRuns.size === 0) stopHostWatcher();
        notifyWrappersChanged();
    }
}

function startHostWatcher() {
    if (hostWatcher || typeof MutationObserver === "undefined") return;
    if (!document.body) return;
    hostWatcher = new MutationObserver(onHostMutations);
    hostWatcher.observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true,
    });
}

function stopHostWatcher() {
    hostWatcher?.disconnect();
    hostWatcher = null;
}

// ── Wrap / unwrap ────────────────────────────────────────────────────────────

function canWrapTextNode(node: Text): boolean {
    const parent = node.parentElement;
    if (!(parent instanceof HTMLElement)) return false; // e.g. SVG <text>
    if (NO_WRAP_PARENT_TAGS.has(parent.tagName)) return false;
    if (parent.isContentEditable) return false;
    if (isUniLensNode(parent)) return false;
    return true;
}

/** Text nodes the range touches, with the selected offsets inside each. */
function selectedTextSlices(
    range: Range,
): { node: Text; start: number; end: number }[] {
    const out: { node: Text; start: number; end: number }[] = [];
    const root = range.commonAncestorContainer;
    const consider = (node: Text) => {
        if (!range.intersectsNode(node)) return;
        const start = node === range.startContainer ? range.startOffset : 0;
        const end = node === range.endContainer ? range.endOffset : node.length;
        if (end <= start) return;
        out.push({ node, start, end });
    };
    if (root.nodeType === Node.TEXT_NODE) {
        consider(root as Text);
        return out;
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        consider(n as Text);
    }
    return out;
}

function wrapSlice(
    node: Text,
    start: number,
    end: number,
    group: string,
    level: SelectionFontLevel,
    scale: number,
): HTMLElement {
    let run = runOfOrigin.get(node) ?? runOfOurNode.get(node);
    if (!run) {
        run = { origin: node, originData: node.data, ours: new Set() };
        runOfOrigin.set(node, run);
        liveRuns.add(run);
    }

    const full = node.data;
    const before = full.slice(0, start);
    const selected = full.slice(start, end);
    const after = full.slice(end);

    const basePx = readUnscaledFontSizePx(node.parentElement as HTMLElement);
    const span = document.createElement("span");
    span.setAttribute(SELECTION_RESIZE_ATTR, "1");
    span.setAttribute(SELECTION_GROUP_ATTR, group);
    span.classList.add(SELECTION_RESIZE_CLASS);
    applyWrapperMetrics(span, basePx, scale, level, levelToPx(level, basePx));
    span.appendChild(document.createTextNode(selected));

    const tail = after ? document.createTextNode(after) : null;
    const parent = node.parentNode as Node;
    const next = node.nextSibling;
    node.data = before;
    if (node === run.origin) run.originData = before;
    parent.insertBefore(span, next);
    if (tail) parent.insertBefore(tail, next);

    for (const n of tail ? [span, tail] : [span]) {
        run.ours.add(n);
        runOfOurNode.set(n, run);
    }
    return span;
}

/**
 * Un-enlarge one wrapper. Its text becomes a plain node of ours until no
 * wrapper of the run is left; then the run collapses back into the host's
 * single text node. Returns where the text ended up, for re-selecting it.
 */
function unwrapResizeWrapper(
    wrapper: HTMLElement,
): { node: Text; start: number; end: number } | null {
    const run = runOfOurNode.get(wrapper);
    const selected = wrapper.textContent ?? "";
    if (!run) {
        // A wrapper from an older build: keep its content, drop our element.
        const parent = wrapper.parentNode;
        if (parent) {
            while (wrapper.firstChild)
                parent.insertBefore(wrapper.firstChild, wrapper);
            wrapper.remove();
        }
        return null;
    }
    if (!run.origin.isConnected || run.origin.data !== run.originData) {
        dropRun(run);
        return null;
    }

    const plain = document.createTextNode(selected);
    wrapper.replaceWith(plain);
    run.ours.delete(wrapper);
    runOfOurNode.delete(wrapper);
    run.ours.add(plain);
    runOfOurNode.set(plain, run);

    const stillWrapped = Array.from(run.ours).some(
        (n) => n instanceof HTMLElement,
    );
    if (stillWrapped) return { node: plain, start: 0, end: selected.length };

    // Offset of the text inside the collapsed host node.
    let offset = run.originData.length;
    for (const n of runNodes(run)) {
        if (n === plain) break;
        offset += n.textContent?.length ?? 0;
    }
    const origin = run.origin;
    collapseRun(run);
    return { node: origin, start: offset, end: offset + selected.length };
}

function unwrapGroup(wrappers: HTMLElement[]): boolean {
    if (wrappers.length === 0) return false;
    const spots = wrappers.map((w) => unwrapResizeWrapper(w));
    discardOwnRecords();
    const first = spots.find((s) => s?.node.isConnected);
    const last = [...spots].reverse().find((s) => s?.node.isConnected);
    if (first && last) {
        try {
            const range = document.createRange();
            range.setStart(first.node, first.start);
            range.setEnd(last.node, last.end);
            restoreSelectionOnRange(range);
            persistedRange = range.cloneRange();
        } catch {
            persistedRange = null;
        }
    }
    if (liveRuns.size === 0) stopHostWatcher();
    notifyWrappersChanged();
    return true;
}

export function unwrapAllSelectionWrappers(root: ParentNode = document.body) {
    if (!root) return;
    const wrappers = Array.from(
        root.querySelectorAll<HTMLElement>(`[${SELECTION_RESIZE_ATTR}]`),
    );
    for (const w of wrappers) unwrapResizeWrapper(w);
    discardOwnRecords();
    activeGroup = null;
    if (liveRuns.size === 0) stopHostWatcher();
    if (wrappers.length > 0) notifyWrappersChanged();
}

/** Clears every enlarged selection on the page ("reset all"). */
export function clearAllSelectionFontSizes(): ApplySelectionResult {
    if (!hasSelectionFontSizes()) {
        return { ok: false, message: t().selNothingToClear };
    }
    unwrapAllSelectionWrappers(document.body);
    window.getSelection()?.removeAllRanges();
    persistedRange = null;
    return { ok: true, message: t().selCleared };
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

    try {
        ensureResizeStylesheet();
        startHostWatcher();
        discardOwnRecords();
        const group = `g${++groupSeq}`;
        const touched: HTMLElement[] = [];
        const updated = new Set<HTMLElement>();

        for (const { node, start, end } of selectedTextSlices(range)) {
            const existing = findResizeWrapper(node);
            if (existing) {
                // Already enlarged: change its size, and make it part of this
                // apply so it clears together with the rest of the selection.
                if (!updated.has(existing)) {
                    updated.add(existing);
                    const base =
                        readWrapperState(existing).basePx ??
                        readUnscaledFontSizePx(existing);
                    applyWrapperMetrics(
                        existing,
                        base,
                        scale,
                        level,
                        levelToPx(level, base),
                    );
                    existing.setAttribute(SELECTION_GROUP_ATTR, group);
                    touched.push(existing);
                }
                continue;
            }
            if (!canWrapTextNode(node)) continue;
            if (node.data.slice(start, end).trim() === "") continue;
            touched.push(wrapSlice(node, start, end, group, level, scale));
        }
        discardOwnRecords();

        if (touched.length === 0) {
            return { ok: false, message: t().selWhitespaceOnly };
        }

        activeGroup = group;
        const ordered = groupWrappers(group);
        const groupRange = rangeOverWrappers(ordered);
        if (groupRange) {
            restoreSelectionOnRange(groupRange);
            persistedRange = groupRange.cloneRange();
        }
        notifyWrappersChanged();
        const px = readWrapperState(ordered[0] ?? touched[0]).px ?? 0;
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
    let wrappers = groupWrappers(activeGroup);
    if (wrappers.length === 0) {
        const sel = window.getSelection();
        const hit =
            (sel && findResizeWrapper(sel.anchorNode)) ??
            (sel && findResizeWrapper(sel.focusNode)) ??
            null;
        const group = hit?.getAttribute(SELECTION_GROUP_ATTR) ?? null;
        wrappers = group ? groupWrappers(group) : hit ? [hit] : [];
    }

    if (wrappers.length === 0) {
        return { ok: false, message: t().selNothingToClear };
    }

    activeGroup = null;
    if (!unwrapGroup(wrappers)) {
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
            if (wrapper) activeGroup = wrapper.getAttribute(SELECTION_GROUP_ATTR);
            else {
                const groupRange = activeGroupRange();
                if (
                    !groupRange ||
                    !groupRange.intersectsNode(range.commonAncestorContainer)
                )
                    activeGroup = null;
            }
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
    stopHostWatcher();
    persistedRange = null;
    document.getElementById(SELECTION_RESIZE_STYLE_ID)?.remove();
}
