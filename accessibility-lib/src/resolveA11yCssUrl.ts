/**
 * Resolve an optional extra stylesheet URL from `init({ cssUrl })`.
 * Variable path segments are encoded per CONTRIBUTING host-page rules.
 * Page theme CSS is bundled into accessibility.js and does not use this helper.
 */
import { DEFAULT_A11Y_CSS_PATH } from "./domIds";

function encodePathSegments(path: string): string {
    return path
        .split("/")
        .map((segment) => (segment ? encodeURIComponent(segment) : segment))
        .join("/");
}

/** Resolve a cssUrl relative to the page, current script, or the library default. */
export function resolveA11yCssUrl(explicit?: string): string {
    const base =
        typeof document !== "undefined"
            ? document.baseURI
            : "http://localhost/";

    if (explicit) {
        try {
            return new URL(explicit, base).href;
        } catch {
            return encodePathSegments(explicit);
        }
    }

    const script =
        typeof document !== "undefined"
            ? (document.currentScript as HTMLScriptElement | null)
            : null;
    if (script?.src) {
        const scriptUrl = new URL(script.src, base);
        const dir = scriptUrl.pathname.replace(/\/[^/]*$/, "");
        scriptUrl.pathname = `${dir}/style.css`;
        return scriptUrl.href;
    }

    return new URL(DEFAULT_A11Y_CSS_PATH, base).href;
}
