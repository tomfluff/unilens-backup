/**
 * Pointer followers (cursor halo, reading guide, focus-cursor dim) shown in
 * the browser's top layer.
 *
 * They used to be plain `position: fixed` elements with a huge z-index under
 * <html>, which had two consequences:
 * - A host `<dialog>.showModal()`, popover or full-screen element is in the
 *   top layer, above any z-index: the followers vanished under it, so they
 *   could not be used on a host's modal.
 * - Under the invert theme <html> carries `filter: invert(1) hue-rotate(…)`.
 *   The followers were counter-filtered, but hue-rotate clips saturated
 *   colors on the way, so the fluorescent halo came out gray.
 *
 * A manual popover is in the top layer and outside the <html> filter (top
 * layer boxes are painted as siblings of the root). Each follower registers
 * here; while it wants the top layer it is shown as a popover, and it is
 * re-shown whenever the host opens a top-layer element of its own (the most
 * recently shown one is painted on top), in registration order so the halo
 * stays above the guides.
 *
 * "always" followers live in the top layer the whole time. "withHost" ones
 * (the focus-cursor dim) only go there while the host has a top-layer element
 * open: the rest of the time they stay under the ♿ panel, which they must not
 * dim. Where popovers are not supported nothing changes.
 */

export const TOP_LAYER_ATTR = "data-unilens-a11y-top-layer";

export type TopLayerMode = "always" | "withHost";

const entries: { el: HTMLElement; mode: TopLayerMode }[] = [];
let watching = false;
let openWatch: MutationObserver | null = null;
let syncing = false;

export function topLayerSupported(): boolean {
    return (
        typeof HTMLElement !== "undefined" &&
        typeof HTMLElement.prototype.showPopover === "function"
    );
}

function isOurs(node: unknown): boolean {
    return entries.some((e) => e.el === node);
}

function matchesSafe(el: Element, selector: string): boolean {
    try {
        return el.matches(selector);
    } catch {
        return false;
    }
}

/** Does the host have something in the top layer (a modal dialog, a popover, full screen)? */
export function hostHasTopLayer(): boolean {
    if (typeof document === "undefined") return false;
    if (document.fullscreenElement) return true;
    for (const dialog of document.querySelectorAll("dialog[open]")) {
        if (matchesSafe(dialog, ":modal")) return true;
    }
    for (const el of document.querySelectorAll("[popover]")) {
        if (!isOurs(el) && matchesSafe(el, ":popover-open")) return true;
    }
    return false;
}

function lower(el: HTMLElement) {
    if (!el.hasAttribute("popover")) return;
    try {
        if (matchesSafe(el, ":popover-open")) el.hidePopover();
    } catch {
        // not open
    }
    el.removeAttribute("popover");
    el.removeAttribute(TOP_LAYER_ATTR);
}

function raise(el: HTMLElement) {
    if (!el.isConnected) return;
    if (!el.hasAttribute("popover")) el.setAttribute("popover", "manual");
    el.setAttribute(TOP_LAYER_ATTR, "");
    try {
        // Showing again moves it to the top of the top layer.
        if (matchesSafe(el, ":popover-open")) el.hidePopover();
        el.showPopover();
    } catch {
        lower(el);
    }
}

/** Put every follower where it belongs now. */
export function syncTopLayer() {
    if (syncing || !topLayerSupported()) return;
    syncing = true;
    try {
        for (let i = entries.length - 1; i >= 0; i--) {
            if (!entries[i].el.isConnected) entries.splice(i, 1);
        }
        const host = hostHasTopLayer();
        for (const { el, mode } of entries) {
            if (mode === "always" || host) raise(el);
            else lower(el);
        }
    } finally {
        syncing = false;
    }
    if (entries.length === 0) unwatch();
}

function onToggle(e: Event) {
    if (isOurs(e.target)) return;
    syncTopLayer();
}

function watch() {
    if (watching || typeof document === "undefined") return;
    watching = true;
    // A host popover opens or closes (toggle does not bubble: capture it).
    document.addEventListener("toggle", onToggle, true);
    document.addEventListener("fullscreenchange", syncTopLayer);
    // showModal() / close() flip the `open` attribute of the dialog.
    if (typeof MutationObserver !== "undefined") {
        openWatch = new MutationObserver((records) => {
            if (records.some((r) => (r.target as Element).tagName === "DIALOG"))
                syncTopLayer();
        });
        openWatch.observe(document.documentElement, {
            subtree: true,
            attributes: true,
            attributeFilter: ["open"],
        });
    }
}

function unwatch() {
    if (!watching) return;
    watching = false;
    document.removeEventListener("toggle", onToggle, true);
    document.removeEventListener("fullscreenchange", syncTopLayer);
    openWatch?.disconnect();
    openWatch = null;
}

/** A follower element was created: let it use the top layer. */
export function registerTopLayer(el: HTMLElement, mode: TopLayerMode) {
    if (!topLayerSupported()) return;
    const existing = entries.find((e) => e.el === el);
    if (existing) existing.mode = mode;
    else entries.push({ el, mode });
    watch();
    syncTopLayer();
}

/** A follower is being removed (feature off / destroy). */
export function unregisterTopLayer(el: HTMLElement | null) {
    if (!el) return;
    const i = entries.findIndex((e) => e.el === el);
    if (i < 0) return;
    entries.splice(i, 1);
    lower(el);
    if (entries.length === 0) unwatch();
}
