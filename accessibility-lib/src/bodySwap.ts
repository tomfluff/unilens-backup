/**
 * Notices when the host replaces <body> (Turbo / pjax-style navigation:
 * `document.body.replaceWith(newBody)` or `documentElement.replaceChild`).
 *
 * Every page-scoped feature is bound to the <body> it saw at init: the page
 * root attribute the stylesheet is written against, and the MutationObservers
 * that keep markers and enlarged sizes up to date. After a swap the theme's
 * text colors and the enlarged text dropped off the new page, and nothing
 * re-applied them. The callback rebinds every feature to the new body.
 */

let watcher: MutationObserver | null = null;
let lastBody: HTMLElement | null = null;

export function watchBodySwap(onSwap: () => void): void {
    if (watcher || typeof MutationObserver === "undefined") return;
    if (typeof document === "undefined" || !document.documentElement) return;
    lastBody = document.body;
    watcher = new MutationObserver(() => {
        const body = document.body;
        if (!body || body === lastBody) return;
        lastBody = body;
        onSwap();
    });
    watcher.observe(document.documentElement, { childList: true });
}

export function stopBodySwapWatch(): void {
    watcher?.disconnect();
    watcher = null;
    lastBody = null;
}
