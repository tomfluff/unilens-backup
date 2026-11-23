/**
 * The enlarged cursor (focus enhance) leaves the host's meaningful cursors alone.
 *
 * Focus enhance gives the page a large arrow, and links, buttons and form
 * controls the same large arrow with the hand as fallback. That rule outranks
 * the host's own class rules, so a disabled button's `not-allowed`, a
 * carousel's `grab`, an image link's `zoom-in` all became the large arrow —
 * a button that cannot be pressed looked pressable — and text fields lost
 * their I-beam.
 *
 * While focus enhance is on, the controls the rule targets are checked
 * against the host's own cursor (the rule is switched off with
 * CURSOR_PROBE_ATTR on <html> for the moment of the reading). A control whose
 * cursor means something — anything but auto / default / pointer, and for a
 * text field anything but auto / text — is marked with HOST_CURSOR_ATTR, which
 * the rule skips. Text fields left unmarked get the browser's I-beam back via
 * the stylesheet. Controls the host adds or changes later are checked as they
 * arrive. A cursor the host sets only on :hover cannot be read this way and
 * still gets the large arrow.
 */
import { isOwnStyleMutation } from "./ownMutation";

export const CURSOR_PROBE_ATTR = "data-unilens-a11y-cursor-probe";
export const HOST_CURSOR_ATTR = "data-unilens-a11y-host-cursor";

/** The elements the focus-enhance cursor rule targets (keep in sync with style.css). */
const TARGETS =
    "a, button, [role='button'], input, select, textarea, summary, label";

const NON_TEXT_INPUT_TYPES = new Set([
    "button",
    "submit",
    "reset",
    "checkbox",
    "radio",
    "range",
    "color",
    "file",
    "image",
    "hidden",
]);

function isTextEntry(el: Element): boolean {
    if (el.tagName === "TEXTAREA") return true;
    if (el.tagName !== "INPUT") return false;
    const type = (el.getAttribute("type") ?? "text").toLowerCase();
    return !NON_TEXT_INPUT_TYPES.has(type);
}

/** Does this cursor value carry a meaning of the host's own? */
export function isMeaningfulCursor(
    cursor: string,
    textEntry: boolean,
): boolean {
    const value = cursor.trim().toLowerCase();
    if (value === "" || value === "auto") return false;
    if (textEntry) return value !== "text";
    return value !== "default" && value !== "pointer";
}

let root: HTMLElement | null = null;
let observer: MutationObserver | null = null;

function scan(elements: Element[]) {
    if (elements.length === 0) return;
    const html = document.documentElement;
    const verdicts: [Element, boolean][] = [];
    html.setAttribute(CURSOR_PROBE_ATTR, "");
    try {
        for (const el of elements) {
            if (!el.isConnected) continue;
            verdicts.push([
                el,
                isMeaningfulCursor(
                    getComputedStyle(el).cursor,
                    isTextEntry(el),
                ),
            ]);
        }
    } finally {
        html.removeAttribute(CURSOR_PROBE_ATTR);
    }
    for (const [el, meaningful] of verdicts) {
        // Write only on a change, so an unchanged page sends nothing to host observers.
        if (meaningful && !el.hasAttribute(HOST_CURSOR_ATTR))
            el.setAttribute(HOST_CURSOR_ATTR, "");
        else if (!meaningful && el.hasAttribute(HOST_CURSOR_ATTR))
            el.removeAttribute(HOST_CURSOR_ATTR);
    }
}

function targetsIn(from: Element, out: Set<Element>) {
    if (from.matches(TARGETS)) out.add(from);
    for (const el of from.querySelectorAll(TARGETS)) out.add(el);
}

/** Changes are collected and checked once per frame: a host that re-classes
 * <body> on every scroll step would otherwise re-read every control each time. */
const pending = new Set<Element>();
let frame: number | null = null;

function flushPending() {
    frame = null;
    const list = [...pending];
    pending.clear();
    scan(list);
}

function onMutations(records: MutationRecord[]) {
    const found = pending;
    for (const r of records) {
        if (r.type === "childList") {
            for (const n of r.addedNodes)
                if (n instanceof Element) targetsIn(n, found);
        } else if (r.type === "attributes" && r.target instanceof Element) {
            const name = r.attributeName;
            if (name === HOST_CURSOR_ATTR) continue;
            if (
                isOwnStyleMutation(
                    name,
                    r.oldValue,
                    r.target.getAttribute(name ?? ""),
                )
            )
                continue;
            // A class / style change can change the cursor of the element
            // and of the controls inside it (cursor is inherited).
            targetsIn(r.target, found);
        }
    }
    if (found.size === 0 || frame !== null) return;
    frame =
        typeof requestAnimationFrame === "function"
            ? requestAnimationFrame(flushPending)
            : (setTimeout(flushPending, 16) as unknown as number);
}

function clearMarks(from: HTMLElement | null) {
    from?.querySelectorAll(`[${HOST_CURSOR_ATTR}]`).forEach((el) => {
        el.removeAttribute(HOST_CURSOR_ATTR);
    });
}

/** Called on every settings apply. `active` = focus enhance (the large cursor) is on. */
export function syncHostCursorGuard(
    pageRoot: HTMLElement | null,
    active: boolean,
) {
    if (typeof document === "undefined") return;
    if (!active || !pageRoot) {
        stopHostCursorGuard();
        return;
    }
    if (root === pageRoot && observer) return;
    stopHostCursorGuard();
    root = pageRoot;
    const all = new Set<Element>();
    for (const el of pageRoot.querySelectorAll(TARGETS)) all.add(el);
    scan([...all]);
    if (typeof MutationObserver === "undefined") return;
    observer = new MutationObserver(onMutations);
    observer.observe(pageRoot, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeOldValue: true,
        attributeFilter: [
            "class",
            "style",
            "disabled",
            "type",
            "aria-disabled",
        ],
    });
}

export function stopHostCursorGuard() {
    if (frame !== null && typeof cancelAnimationFrame === "function")
        cancelAnimationFrame(frame);
    frame = null;
    pending.clear();
    observer?.disconnect();
    observer = null;
    clearMarks(root);
    root = null;
    document.documentElement?.removeAttribute(CURSOR_PROBE_ATTR);
}
