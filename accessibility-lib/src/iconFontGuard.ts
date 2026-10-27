/**
 * Icon fonts keep their own typeface under the UD / custom font setting.
 *
 * The typeface setting forces `font-family` on every element of the page.
 * Icon fonts put the glyph in that element's font: Material Icons spell the
 * icon as a word ("home") that only the icon font's ligature turns into a
 * picture, and Font Awesome-style fonts put a Private Use Area character in
 * `::before`, which inherits the element's (now forced) font. Both broke —
 * the word "home" showed instead of the house, or an empty box.
 *
 * So while the setting is on, the page's elements are checked against the
 * host's own fonts (the forced rule is switched off for the moment of the
 * reading with FONT_PROBE_ATTR on <html>), and icon-font elements are marked
 * with KEEP_FONT_ATTR, which the forced rule skips. An element counts as an
 * icon when its own font is named like an icon font, or when the characters
 * it shows — its text, or for an empty element its ::before / ::after
 * content — are all Private Use Area code points (any icon font, whatever
 * its name). Elements the host adds or re-classes later are checked as they
 * arrive.
 */

import { isOwnStyleMutation } from "./ownMutation";

export const FONT_PROBE_ATTR = "data-unilens-a11y-font-probe";
export const KEEP_FONT_ATTR = "data-unilens-a11y-keep-font";

/** Primary family names of the common icon fonts. */
const ICON_FONT_NAME =
    /(^|[^a-z])(icons?|symbols)([^a-z]|$)|awesome|fontello|icomoon|glyphicons|ionicons|octicons|typicons|boxicons|dashicons|genericons|eleganticons|flaticon|socicon|codicon|uicons|lineicons|remixicon|feather|lucide|tabler|phosphor|entypo|themify|simple-line|fontisto|mdl2|^fa([\s-]|$)/i;

const SKIP_TAGS = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "TEMPLATE",
    "SVG",
    "IMG",
    "VIDEO",
    "CANVAS",
    "IFRAME",
    "BR",
]);

function isPrivateUse(cp: number): boolean {
    return (
        (cp >= 0xe000 && cp <= 0xf8ff) ||
        (cp >= 0xf0000 && cp <= 0xffffd) ||
        (cp >= 0x100000 && cp <= 0x10fffd)
    );
}

/** Every non-space character is in a Private Use Area (and there is one). */
export function isPrivateUseText(text: string): boolean {
    let seen = false;
    for (const ch of text) {
        if (/\s/.test(ch)) continue;
        const cp = ch.codePointAt(0) ?? 0;
        if (!isPrivateUse(cp)) return false;
        seen = true;
    }
    return seen;
}

/** `content` as getComputedStyle reports it: `"\f015"` → the character, `none` → "". */
export function pseudoContentText(content: string): string {
    const m = /^"((?:[^"\\]|\\.)*)"$/.exec(content.trim());
    return m ? m[1].replace(/\\(.)/g, "$1") : "";
}

export function primaryFontFamily(fontFamily: string): string {
    const first = fontFamily.split(",")[0] ?? "";
    return first.trim().replace(/^["']|["']$/g, "");
}

/** CamelCase names: "MaterialIcons", "ElegantIcons" (case-sensitive, so "Lexicon" is not one). */
const CAMEL_ICON_NAME = /[a-z0-9](Icons?|Symbols)([^a-z]|$)/;

export function isIconFontName(family: string): boolean {
    const name = primaryFontFamily(family);
    return ICON_FONT_NAME.test(name) || CAMEL_ICON_NAME.test(name);
}

function ownText(el: Element): string {
    let text = "";
    for (const n of el.childNodes) {
        if (n.nodeType === Node.TEXT_NODE) text += (n as Text).data;
    }
    return text;
}

/** Read under the probe: does this element draw with an icon font? */
function isIconFontElement(el: Element): boolean {
    const cs = getComputedStyle(el);
    if (isIconFontName(cs.fontFamily)) return true;
    const text = ownText(el);
    if (text.trim()) return isPrivateUseText(text);
    if (el.childElementCount > 0) return false;
    for (const pseudo of ["::before", "::after"]) {
        const content = pseudoContentText(getComputedStyle(el, pseudo).content);
        if (content && isPrivateUseText(content)) return true;
    }
    return false;
}

let root: HTMLElement | null = null;
let observer: MutationObserver | null = null;

function candidates(from: Element, out: Element[]) {
    if (SKIP_TAGS.has(from.tagName.toUpperCase())) return;
    out.push(from);
    for (const el of from.querySelectorAll("*")) {
        if (!SKIP_TAGS.has(el.tagName.toUpperCase()) && !el.closest("svg"))
            out.push(el);
    }
}

function scan(elements: Element[]) {
    if (elements.length === 0) return;
    const html = document.documentElement;
    const verdicts: [Element, boolean][] = [];
    html.setAttribute(FONT_PROBE_ATTR, "");
    try {
        for (const el of elements) {
            if (!el.isConnected) continue;
            verdicts.push([el, isIconFontElement(el)]);
        }
    } finally {
        html.removeAttribute(FONT_PROBE_ATTR);
    }
    for (const [el, icon] of verdicts) {
        // Write only on a change, so an unchanged page sends nothing to host observers.
        if (icon && !el.hasAttribute(KEEP_FONT_ATTR))
            el.setAttribute(KEEP_FONT_ATTR, "");
        else if (!icon && el.hasAttribute(KEEP_FONT_ATTR))
            el.removeAttribute(KEEP_FONT_ATTR);
    }
}

function onMutations(records: MutationRecord[]) {
    const list: Element[] = [];
    const seen = new Set<Element>();
    const push = (el: Element) => {
        if (seen.has(el)) return;
        seen.add(el);
        list.push(el);
    };
    for (const r of records) {
        if (r.type === "childList") {
            for (const n of r.addedNodes) {
                if (n instanceof Element) {
                    const sub: Element[] = [];
                    candidates(n, sub);
                    sub.forEach(push);
                } else if (r.target instanceof Element) {
                    push(r.target); // text changed: the element may now show icon characters
                }
            }
        } else if (r.type === "attributes" && r.target instanceof Element) {
            const name = r.attributeName;
            // This library's own class / style marks (text size etc.) change no typeface.
            if (
                isOwnStyleMutation(
                    name,
                    r.oldValue,
                    r.target.getAttribute(name ?? ""),
                )
            )
                continue;
            push(r.target);
        }
    }
    scan(list);
}

function clearMarks(from: HTMLElement | null) {
    from?.querySelectorAll(`[${KEEP_FONT_ATTR}]`).forEach((el) => {
        el.removeAttribute(KEEP_FONT_ATTR);
    });
}

/**
 * Called on every settings apply. `active` = a UD / custom typeface is forced.
 */
export function syncIconFontGuard(
    pageRoot: HTMLElement | null,
    active: boolean,
) {
    if (typeof document === "undefined") return;
    if (!active || !pageRoot) {
        stopIconFontGuard();
        return;
    }
    if (root === pageRoot && observer) return;
    stopIconFontGuard();
    root = pageRoot;
    const all: Element[] = [];
    candidates(pageRoot, all);
    scan(all.filter((el) => el !== pageRoot));
    if (typeof MutationObserver === "undefined") return;
    observer = new MutationObserver(onMutations);
    observer.observe(pageRoot, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeOldValue: true,
        attributeFilter: ["class", "style"],
    });
}

export function stopIconFontGuard() {
    observer?.disconnect();
    observer = null;
    clearMarks(root);
    root = null;
    document.documentElement?.removeAttribute(FONT_PROBE_ATTR);
}
