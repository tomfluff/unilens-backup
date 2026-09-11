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
    for (let i = 0; i < nodes.length; i++) {
        const el = nodes[i];
        if (!(el instanceof HTMLElement)) continue;
        if (isUniLensOverlayNode(el)) {
            el.removeAttribute(TEXT_BG_ATTR);
            el.removeAttribute(TEXT_BG_BEFORE_ATTR);
            el.removeAttribute(TEXT_BG_AFTER_ATTR);
            continue;
        }
        if (hasDirectText(el)) el.setAttribute(TEXT_BG_ATTR, "true");
        else el.removeAttribute(TEXT_BG_ATTR);

        if (hasGeneratedTextContent(getComputedStyle(el, "::before").content)) {
            el.setAttribute(TEXT_BG_BEFORE_ATTR, "true");
        } else {
            el.removeAttribute(TEXT_BG_BEFORE_ATTR);
        }
        if (hasGeneratedTextContent(getComputedStyle(el, "::after").content)) {
            el.setAttribute(TEXT_BG_AFTER_ATTR, "true");
        } else {
            el.removeAttribute(TEXT_BG_AFTER_ATTR);
        }
    }
}
