/**
 * Text plates: a solid background behind glyphs so type never sits on leftover
 * light pixels. Wrapper-only layers stay unmarked so host photos show through.
 */

import {
    HTML_ATTR_TEXT_PLATE,
    isUniLensOverlayNode,
    TEXT_BG_AFTER_ATTR,
    TEXT_BG_ATTR,
    TEXT_BG_BEFORE_ATTR,
    TEXT_BG_SKIP_ATTR,
} from "./domIds";

const TEXT_NODE = 3;

export function hasDirectTextNodes(
    nodes: ArrayLike<{ nodeType: number; textContent: string | null }>,
): boolean {
    for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (
            n.nodeType === TEXT_NODE &&
            n.textContent &&
            /\S/.test(n.textContent)
        ) {
            return true;
        }
    }
    return false;
}

export function hasDirectText(el: HTMLElement): boolean {
    return hasDirectTextNodes(el.childNodes);
}

/** True when CSS `content` paints a glyph (not none / empty / an image). */
export function hasGeneratedTextContent(content: string): boolean {
    if (!content) return false;
    const v = content.trim();
    const lower = v.toLowerCase();
    if (
        lower === "none" ||
        lower === "normal" ||
        lower === "initial" ||
        lower === "unset" ||
        lower === "inherit" ||
        lower === "revert" ||
        lower === "revert-layer"
    ) {
        return false;
    }
    if (v === '""' || v === "''") return false;
    if (/^url\(/i.test(v)) return false;
    return true;
}

const TEXT_PLATE_ATTRS = [
    TEXT_BG_ATTR,
    TEXT_BG_BEFORE_ATTR,
    TEXT_BG_AFTER_ATTR,
    TEXT_BG_SKIP_ATTR,
] as const;

export function clearHighContrastTextPlates(
    root: ParentNode | null = document,
) {
    if (!root || typeof root.querySelectorAll !== "function") return;
    for (const attr of TEXT_PLATE_ATTRS) {
        root.querySelectorAll(`[${attr}]`).forEach((el) => {
            el.removeAttribute(attr);
        });
    }
}

export function isHighContrastTheme(theme: string | null): boolean {
    return theme === "high-contrast";
}

/**
 * Set or remove a marker, writing only when it changes. Each pass runs after
 * every host DOM change: rewriting an unchanged value still queues a mutation
 * record, so every pass sent one per page element to host MutationObservers
 * (and looped forever with a host observer that answered with a DOM change).
 */
function setMark(el: Element, name: string, on: boolean) {
    if (on) {
        if (el.getAttribute(name) !== "true") el.setAttribute(name, "true");
    } else if (el.hasAttribute(name)) el.removeAttribute(name);
}

export function syncHighContrastTextPlates(pageRoot: HTMLElement | null) {
    if (!pageRoot) return;
    const plateOn = Boolean(
        document.documentElement.getAttribute(HTML_ATTR_TEXT_PLATE),
    );
    if (!plateOn) {
        clearHighContrastTextPlates(pageRoot);
        return;
    }

    const nodes = pageRoot.querySelectorAll("*");
    const els: HTMLElement[] = [];
    for (let i = 0; i < nodes.length; i++) {
        const el = nodes[i];
        if (!(el instanceof HTMLElement)) continue;
        if (isUniLensOverlayNode(el)) {
            for (const attr of TEXT_PLATE_ATTRS) setMark(el, attr, false);
            continue;
        }
        els.push(el);
    }
    // Read every pseudo first, then write: interleaving a write with the next
    // getComputedStyle forced a style recalc per element.
    const before: boolean[] = [];
    const after: boolean[] = [];
    for (const el of els) {
        before.push(
            hasGeneratedTextContent(getComputedStyle(el, "::before").content),
        );
        after.push(
            hasGeneratedTextContent(getComputedStyle(el, "::after").content),
        );
    }
    for (let i = 0; i < els.length; i++) {
        const el = els[i];
        const text = hasDirectText(el);
        setMark(el, TEXT_BG_ATTR, text);
        // Wrapper-only: keep its own background-image (host photo).
        setMark(el, TEXT_BG_SKIP_ATTR, !text);
        setMark(el, TEXT_BG_BEFORE_ATTR, before[i]);
        setMark(el, TEXT_BG_AFTER_ATTR, after[i]);
    }
}
