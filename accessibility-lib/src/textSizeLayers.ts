/**
 * One font-size rule for the three host-text features that resize glyphs:
 * page-wide text size (pageFontScale), body-text expand, and small-text boost.
 *
 * Each feature used to ship its own `!important` rule with the same
 * specificity, so whichever stylesheet was injected last silently won and the
 * result depended on the order the visitor pressed the buttons (and changed
 * after a reload). Now every feature only writes its own target variable, and
 * one rule paints the largest of them:
 *
 *   final = max(original × page scale, body-expand target, small-boost target)
 *
 * Every term grows with the original size, so the largest term does too:
 * the order the features are turned on never matters, adding a feature never
 * shrinks text, and smaller host text never ends up larger than bigger text.
 *
 * All three features also read the host's original size through
 * `readOriginalFontPx`, so none of them mistakes another feature's enlarged
 * size for the host's own.
 */

import {
    BODY_EXPAND_ATTR,
    BODY_EXPAND_CLASS,
    BODY_EXPAND_ORIGINAL_ATTR,
    BODY_EXPAND_TARGET_VAR,
    HTML_STYLE_FONT_SCALE,
    PAGE_FONT_ATTR,
    PAGE_FONT_CAP_VAR,
    PAGE_FONT_CLASS,
    PAGE_FONT_ORIGINAL_ATTR,
    PAGE_FONT_TARGET_VAR,
    SMALL_BOOST_ATTR,
    SMALL_BOOST_CLASS,
    SMALL_BOOST_ORIGINAL_ATTR,
    SMALL_BOOST_TARGET_VAR,
    isUniLensOverlayNode,
} from "./domIds";
import { isOwnStyleMutation, removedOwnMarks } from "./ownMutation";
import { appendA11yStyle } from "./cspStyle";

export const TEXT_SIZE_STYLE_ID = "unilens-a11y-text-size-style";

/**
 * While set on <html>, the shared font-size rule is off, so the host's own
 * sizes can be read (see remeasureTextSizes). Never left on across a paint.
 */
export const TEXT_SIZE_PROBE_ATTR = "data-unilens-a11y-text-size-probe";

const PAGE_SEL = `[${PAGE_FONT_ATTR}="true"].${PAGE_FONT_CLASS}`;
const BODY_SEL = `[${BODY_EXPAND_ATTR}="true"].${BODY_EXPAND_CLASS}`;
const SMALL_SEL = `[${SMALL_BOOST_ATTR}="true"].${SMALL_BOOST_CLASS}`;
const ANY_SEL = `:is(${PAGE_SEL}, ${BODY_SEL}, ${SMALL_SEL})`;

/**
 * Custom properties inherit, so an element marked by one feature would pick up
 * a parent's target from another feature. The `:not()` resets zero out every
 * term the element itself was not given.
 */
export const TEXT_SIZE_CSS = `
${ANY_SEL}:not(${PAGE_SEL}) { ${PAGE_FONT_TARGET_VAR}: 0px; }
${ANY_SEL}:not(${BODY_SEL}) { ${BODY_EXPAND_TARGET_VAR}: 0px; }
${ANY_SEL}:not(${SMALL_SEL}) { ${SMALL_BOOST_TARGET_VAR}: 0px; }
html:not([${TEXT_SIZE_PROBE_ATTR}]) ${ANY_SEL} {
  font-size: max(
    calc(var(${PAGE_FONT_TARGET_VAR}, 0px) * min(var(${HTML_STYLE_FONT_SCALE}, 1), var(${PAGE_FONT_CAP_VAR}, 999))),
    var(${BODY_EXPAND_TARGET_VAR}, 0px),
    var(${SMALL_BOOST_TARGET_VAR}, 0px)
  ) !important;
}
`;

export type TextSizeOwner = "pageFont" | "bodyExpand" | "smallBoost";

/**
 * Re-applies a feature. `roots` limits the walk to the subtrees the host just
 * changed; without it the whole page is rescanned.
 */
export type TextSizeRescan = (roots?: Element[]) => void;

const owners = new Set<TextSizeOwner>();
const rescanners = new Map<TextSizeOwner, TextSizeRescan>();
let resizeTimer: number | undefined;
let resizeBound = false;

const RESIZE_DEBOUNCE_MS = 250;

function onResize() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(remeasureTextSizes, RESIZE_DEBOUNCE_MS);
}

function bindResize() {
    if (resizeBound || typeof window === "undefined") return;
    resizeBound = true;
    window.addEventListener("resize", onResize, { passive: true });
}

function unbindResize() {
    if (!resizeBound || typeof window === "undefined") return;
    resizeBound = false;
    window.clearTimeout(resizeTimer);
    window.removeEventListener("resize", onResize);
}

/**
 * Injects the shared rule once; each feature registers while it is active.
 * `rescan` re-applies the feature after the host sizes were re-measured.
 */
export function acquireTextSizeStyles(
    owner: TextSizeOwner,
    rescan?: TextSizeRescan,
) {
    owners.add(owner);
    if (rescan) rescanners.set(owner, rescan);
    if (typeof document === "undefined") return;
    bindResize();
    startHostStyleWatch();
    if (document.getElementById(TEXT_SIZE_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = TEXT_SIZE_STYLE_ID;
    style.textContent = TEXT_SIZE_CSS;
    appendA11yStyle(style);
}

/** Removes the shared rule once no feature uses it any more. */
export function releaseTextSizeStyles(owner: TextSizeOwner) {
    owners.delete(owner);
    rescanners.delete(owner);
    if (owners.size > 0 || typeof document === "undefined") return;
    unbindResize();
    stopHostStyleWatch();
    document.getElementById(TEXT_SIZE_STYLE_ID)?.remove();
}

const ORIGINAL_ATTRS = [
    PAGE_FONT_ORIGINAL_ATTR,
    BODY_EXPAND_ORIGINAL_ATTR,
    SMALL_BOOST_ORIGINAL_ATTR,
] as const;

/** The host size any of the three features already recorded, if one did. */
export function storedOriginalFontPx(el: Element): number | null {
    for (const attr of ORIGINAL_ATTRS) {
        const stored = el.getAttribute(attr);
        if (!stored) continue;
        const parsed = parseFloat(stored);
        if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return null;
}

/**
 * Host font-size before any of the three features touched it.
 *
 * A recorded original wins. Otherwise the computed size is used; when it sits
 * under a page-scaled ancestor it has inherited that scale, so it is divided
 * back out (`pageScale` = the effective page-wide multiplier).
 */
export function readOriginalFontPx(el: HTMLElement, pageScale = 1): number {
    const stored = storedOriginalFontPx(el);
    if (stored != null) return stored;
    const computed = parseFloat(getComputedStyle(el).fontSize);
    if (!Number.isFinite(computed) || computed <= 0) return computed;
    if (
        pageScale !== 1 &&
        el.parentElement?.closest(`[${PAGE_FONT_ATTR}="true"]`)
    ) {
        return Math.round((computed / pageScale) * 100) / 100;
    }
    // Same 0.01px precision as the recorded original, so the next scan reads
    // back exactly this value and sees the node as already up to date
    // (13.3333 vs a stored 13.33 used to re-apply it on every scan).
    return Math.round(computed * 100) / 100;
}

/**
 * Each feature records the host's size the first time it marks a node, and
 * keeps scaling from that number. When the host's own size changes without a
 * DOM mutation — a media-query breakpoint after a window resize, the root
 * font-size changed by auto text size, or the host switching a class / inline
 * style that sets font-size — that record is stale: text stayed at the old
 * size, and could end up smaller than the host's new size.
 *
 * This reads every marked node's current host size with the shared rule
 * switched off (one synchronous probe, no paint in between), updates the
 * records, and lets each active feature rescan. `roots` limits both to the
 * subtrees the host changed.
 */
export function remeasureTextSizes(roots?: Element[]) {
    if (typeof document === "undefined") return;
    const html = document.documentElement;
    const sel = ORIGINAL_ATTRS.map((a) => `[${a}]`).join(",");
    let marked: Element[];
    if (roots) {
        const set = new Set<Element>();
        for (const root of roots) {
            if (!root.isConnected) continue;
            if (root.matches(sel)) set.add(root);
            root.querySelectorAll(sel).forEach((el) => {
                set.add(el);
            });
        }
        marked = Array.from(set);
    } else {
        marked = Array.from(document.querySelectorAll(sel));
    }
    if (marked.length > 0) {
        html.setAttribute(TEXT_SIZE_PROBE_ATTR, "");
        const sizes = marked.map((el) =>
            parseFloat(getComputedStyle(el).fontSize),
        );
        html.removeAttribute(TEXT_SIZE_PROBE_ATTR);
        marked.forEach((el, i) => {
            const px = sizes[i];
            if (!Number.isFinite(px) || px <= 0) return;
            const value = String(Math.round(px * 100) / 100);
            for (const attr of ORIGINAL_ATTRS)
                if (el.hasAttribute(attr) && el.getAttribute(attr) !== value)
                    el.setAttribute(attr, value);
        });
    }
    const live = roots?.filter((r) => r.isConnected);
    if (live && live.length === 0) return;
    for (const rescan of rescanners.values()) rescan(live);
}

// ── Host class / style changes ───────────────────────────────────────────────

/**
 * The features only watched for added / removed nodes. A host that changed a
 * size by switching a class (an accordion's `.open { font-size: 24px }`) or an
 * inline style kept its old recorded size, and a framework re-render that set
 * `className` to the component's own value removed our class, so the
 * enlargement fell off that element for good. Host class / style writes now
 * re-measure and re-apply the changed subtree (our own writes are ignored).
 */
const HOST_STYLE_DEBOUNCE_MS = 120;
let hostStyleWatch: MutationObserver | null = null;
let hostStyleBody: HTMLElement | null = null;
let hostStyleTimer: number | undefined;
const pendingRoots = new Set<Element>();

function topmost(nodes: Iterable<Element>): Element[] {
    const all = Array.from(nodes).filter((n) => n.isConnected);
    const set = new Set(all);
    return all.filter((n) => {
        for (let p = n.parentElement; p; p = p.parentElement)
            if (set.has(p)) return false;
        return true;
    });
}

function flushHostStyleChanges() {
    hostStyleTimer = undefined;
    const roots = topmost(pendingRoots);
    pendingRoots.clear();
    if (roots.length > 0) remeasureTextSizes(roots);
}

function onHostStyleMutations(records: MutationRecord[]) {
    for (const r of records) {
        const el = r.target;
        if (!(el instanceof Element) || isUniLensOverlayNode(el)) continue;
        const name = r.attributeName;
        const now = name ? el.getAttribute(name) : null;
        if (
            isOwnStyleMutation(name, r.oldValue, now) &&
            !removedOwnMarks(name, r.oldValue, now)
        )
            continue;
        pendingRoots.add(el);
    }
    if (pendingRoots.size === 0 || typeof window === "undefined") return;
    window.clearTimeout(hostStyleTimer);
    hostStyleTimer = window.setTimeout(
        flushHostStyleChanges,
        HOST_STYLE_DEBOUNCE_MS,
    );
}

function startHostStyleWatch() {
    if (typeof MutationObserver === "undefined" || !document.body) return;
    if (hostStyleWatch && hostStyleBody === document.body) return;
    hostStyleWatch?.disconnect();
    hostStyleBody = document.body;
    hostStyleWatch = new MutationObserver(onHostStyleMutations);
    hostStyleWatch.observe(document.body, {
        subtree: true,
        attributes: true,
        attributeOldValue: true,
        attributeFilter: ["class", "style"],
    });
}

function stopHostStyleWatch() {
    hostStyleWatch?.disconnect();
    hostStyleWatch = null;
    hostStyleBody = null;
    if (typeof window !== "undefined") window.clearTimeout(hostStyleTimer);
    pendingRoots.clear();
}

/** The host replaced <body>: watch the new one. */
export function rebindTextSizeWatch() {
    if (owners.size === 0) return;
    startHostStyleWatch();
}
