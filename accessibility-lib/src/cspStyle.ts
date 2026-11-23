/**
 * Injected <style> elements that keep working under a Content-Security-Policy.
 *
 * Every feature injects its rules as a `<style id="unilens-…">` in <head>
 * (the ids are how features find, update and remove their own rules). On a
 * site whose CSP has `style-src` without 'unsafe-inline', the browser refuses
 * those elements: the panel showed up as a bare button at the bottom of the
 * page and no display setting had any effect.
 *
 * Two remedies, in order:
 * 1. A nonce. When the host gives one (`init({ cspNonce })`), or the script
 *    tag that loaded this bundle carries one (`<script nonce>` — sites with a
 *    nonce-based script-src need it there anyway), every injected <style>
 *    gets it, and a policy that allows that nonce accepts the element.
 * 2. A constructed stylesheet. When the element was refused anyway (no nonce,
 *    or a policy without one), the same CSS is mirrored into a
 *    `CSSStyleSheet` adopted by the document: constructed sheets are CSSOM,
 *    which CSP does not restrict (the same as `el.style.setProperty`). A
 *    `<unilens-style>` element with the same id takes the <style>'s place as
 *    the handle the features already use (they find it by id, set its text,
 *    remove it): a change to its text is copied to the mirror, and removing
 *    it removes the mirror.
 */

let explicitNonce: string | null = null;

/** The nonce of the <script> that evaluated this bundle, read once at load. */
const loaderNonce: string | null = (() => {
    if (typeof document === "undefined") return null;
    try {
        const script = document.currentScript as HTMLScriptElement | null;
        return script?.nonce || null;
    } catch {
        return null;
    }
})();

/** `init({ cspNonce })`. An empty value goes back to auto-detection. */
export function setCspNonce(nonce: string | null | undefined) {
    explicitNonce =
        typeof nonce === "string" && nonce.trim() ? nonce.trim() : null;
}

export function getCspNonce(): string | null {
    if (explicitNonce) return explicitNonce;
    if (loaderNonce) return loaderNonce;
    if (typeof document === "undefined") return null;
    try {
        // Browsers hide the attribute after parsing; the property keeps it.
        const tagged = document.querySelector<HTMLElement>(
            "style[nonce], script[nonce]",
        );
        return tagged?.nonce || null;
    } catch {
        return null;
    }
}

/**
 * Set once the page has refused one of our <style> elements. Every refused
 * <style> — and every later change to its text — is a console error and a
 * CSP violation report to the site's report endpoint, and Chromium checks the
 * element even with a non-CSS `type`. So after the first refusal the handle a
 * feature finds by id is a `<unilens-style>` element instead: same id, same
 * text, never parsed as CSS, and its rules reach the page only through the
 * mirror. One report per page load at most.
 */
let inlineRefused = false;
export const STYLE_HANDLE_TAG = "unilens-style";

interface Mirror {
    sheet: CSSStyleSheet;
    text: string;
}

const mirrors = new Map<Element, Mirror>();
let mirrorWatch: MutationObserver | null = null;

function canAdopt(): boolean {
    return (
        typeof document !== "undefined" &&
        typeof CSSStyleSheet === "function" &&
        "adoptedStyleSheets" in document &&
        typeof CSSStyleSheet.prototype.replaceSync === "function"
    );
}

/** The browser refused the element: it is in the document but has no sheet. */
function wasRefused(style: HTMLStyleElement): boolean {
    if (!style.isConnected) return false;
    if (!(style.textContent ?? "").trim()) return false;
    return style.sheet == null;
}

function setAdopted(next: CSSStyleSheet[]) {
    document.adoptedStyleSheets = next;
}

function syncMirrors() {
    for (const [handle, mirror] of mirrors) {
        if (!handle.isConnected) {
            setAdopted(
                document.adoptedStyleSheets.filter((s) => s !== mirror.sheet),
            );
            mirrors.delete(handle);
            continue;
        }
        const text = handle.textContent ?? "";
        if (text !== mirror.text) {
            mirror.text = text;
            try {
                mirror.sheet.replaceSync(text);
            } catch {
                // keep the previous rules
            }
        }
    }
    if (mirrors.size === 0) {
        mirrorWatch?.disconnect();
        mirrorWatch = null;
    }
}

function mirror(handle: Element): boolean {
    if (mirrors.has(handle)) return true;
    const sheet = new CSSStyleSheet();
    const text = handle.textContent ?? "";
    try {
        sheet.replaceSync(text);
    } catch {
        return false;
    }
    mirrors.set(handle, { sheet, text });
    setAdopted([...document.adoptedStyleSheets, sheet]);
    if (!mirrorWatch && typeof MutationObserver !== "undefined") {
        mirrorWatch = new MutationObserver(syncMirrors);
        // Feature styles live in <head>: watching it (not the whole page)
        // catches their text changes and their removal.
        mirrorWatch.observe(document.head ?? document.documentElement, {
            childList: true,
            subtree: true,
            characterData: true,
        });
    }
    return true;
}

/** A `<unilens-style>` standing in for a refused <style> (same id and text). */
function handleFor(style: HTMLStyleElement): HTMLElement {
    const handle = document.createElement(STYLE_HANDLE_TAG);
    if (style.id) handle.id = style.id;
    handle.textContent = style.textContent;
    return handle;
}

/**
 * Appends a feature's <style> to <head> with the page's nonce. When the
 * page's CSP refuses it anyway, its rules are applied through an adopted
 * stylesheet, and a `<unilens-style>` handle takes its place.
 */
export function appendA11yStyle(style: HTMLStyleElement) {
    if (typeof document === "undefined") return;
    const parent = document.head ?? document.documentElement;
    if (inlineRefused && canAdopt()) {
        const handle = handleFor(style);
        parent.appendChild(handle);
        mirror(handle);
        return;
    }
    const nonce = getCspNonce();
    if (nonce) style.nonce = nonce;
    parent.appendChild(style);
    if (!wasRefused(style) || !canAdopt()) return;
    inlineRefused = true;
    const handle = handleFor(style);
    style.replaceWith(handle);
    mirror(handle);
}

/** Test hook: how many feature stylesheets are being mirrored. */
export function mirroredA11yStyleCount(): number {
    return mirrors.size;
}
