/**
 * Telling this library's own class / style writes apart from the host's.
 * Shared by the surface pass (documentEffects.ts) and the text-size features
 * (textSizeLayers.ts).
 */

const OWN_CLASS_PREFIX = "unilens-";
const OWN_STYLE_PREFIX = "--unilens-";

function withoutOwnClasses(value: string): string {
    let out = "";
    // classList re-serializes with single spaces, so split on any whitespace.
    for (const c of value.split(/\s+/)) {
        if (c === "" || c.startsWith(OWN_CLASS_PREFIX)) continue;
        out = out === "" ? c : `${out} ${c}`;
    }
    return out;
}

function withoutOwnStyles(value: string): string {
    let out = "";
    for (const d of value.split(";")) {
        // Writing one property re-serializes the attribute ("a:b" → "a: b").
        const t = d.trim().replace(/\s*:\s*/, ": ");
        if (t === "" || t.startsWith(OWN_STYLE_PREFIX)) continue;
        out = out === "" ? t : `${out};${t}`;
    }
    return out;
}

/**
 * True when a class/style mutation only touched what this library writes
 * (`unilens-*` classes, `--unilens-*` custom properties — the text-size
 * features). Those never change a host background, and reacting to them made
 * every text-size change walk the page a second time.
 */
export function isOwnStyleMutation(
    attributeName: string | null,
    oldValue: string | null,
    newValue: string | null,
): boolean {
    if (attributeName !== "class" && attributeName !== "style") return false;
    const before = oldValue ?? "";
    const after = newValue ?? "";
    if (before === after) return true;
    // Nothing of ours on either side: any difference is the host's.
    const own = attributeName === "class" ? OWN_CLASS_PREFIX : OWN_STYLE_PREFIX;
    if (!before.includes(own) && !after.includes(own)) return false;
    return attributeName === "class"
        ? withoutOwnClasses(before) === withoutOwnClasses(after)
        : withoutOwnStyles(before) === withoutOwnStyles(after);
}

/**
 * True when a host write removed a class or custom property this library had
 * put on the element — e.g. a React / Vue re-render that sets `className` to
 * the component's own value. The write looks like ours (the host part did not
 * change) but our marks are gone and have to be put back.
 */
export function removedOwnMarks(
    attributeName: string | null,
    oldValue: string | null,
    newValue: string | null,
): boolean {
    if (attributeName !== "class" && attributeName !== "style") return false;
    const before = oldValue ?? "";
    const after = newValue ?? "";
    if (attributeName === "class") {
        const now = new Set(after.split(/\s+/));
        return before
            .split(/\s+/)
            .some((c) => c.startsWith(OWN_CLASS_PREFIX) && !now.has(c));
    }
    const names = (v: string) =>
        v
            .split(";")
            .map((d) => d.split(":")[0].trim())
            .filter((n) => n.startsWith(OWN_STYLE_PREFIX));
    const now = new Set(names(after));
    return names(before).some((n) => !now.has(n));
}

/**
 * Inline-style properties that move, size or fade an element but never
 * change a background or text color. Hosts write these every frame
 * (rAF animations, scroll-linked headers, parallax, carousels), and
 * custom properties usually feed the same kind of motion.
 */
const MOTION_STYLE_PROPS = new Set([
    "transform",
    "transform-origin",
    "transform-style",
    "translate",
    "rotate",
    "scale",
    "perspective",
    "perspective-origin",
    "opacity",
    "top",
    "right",
    "bottom",
    "left",
    "inset",
    "width",
    "height",
    "min-width",
    "min-height",
    "max-width",
    "max-height",
    "margin",
    "margin-top",
    "margin-right",
    "margin-bottom",
    "margin-left",
    "padding",
    "padding-top",
    "padding-right",
    "padding-bottom",
    "padding-left",
    "z-index",
    "will-change",
    "transition",
    "transition-property",
    "transition-duration",
    "transition-delay",
    "transition-timing-function",
    "animation",
    "animation-name",
    "animation-duration",
    "animation-delay",
    "animation-play-state",
    "animation-iteration-count",
    "animation-timing-function",
    "animation-direction",
    "animation-fill-mode",
    "clip-path",
    "filter",
    "backdrop-filter",
    "background-position",
    "background-position-x",
    "background-position-y",
    "background-size",
    "object-position",
    "offset",
    "offset-distance",
    "offset-path",
    "offset-rotate",
    "pointer-events",
    "cursor",
]);

/** Split a style attribute into `name → value`, keeping `;` inside url() / quotes. */
export function parseInlineStyle(value: string | null): Map<string, string> {
    const out = new Map<string, string>();
    if (!value) return out;
    let depth = 0;
    let quote = "";
    let start = 0;
    const take = (end: number) => {
        const decl = value.slice(start, end);
        const i = decl.indexOf(":");
        if (i > 0) {
            const name = decl.slice(0, i).trim();
            const v = decl.slice(i + 1).trim();
            out.set(name.startsWith("--") ? name : name.toLowerCase(), v);
        }
        start = end + 1;
    };
    for (let i = 0; i < value.length; i++) {
        const c = value[i];
        if (quote) {
            if (c === "\\") i++;
            else if (c === quote) quote = "";
        } else if (c === '"' || c === "'") quote = c;
        else if (c === "(") depth++;
        else if (c === ")") depth = Math.max(0, depth - 1);
        else if (c === ";" && depth === 0) take(i);
    }
    take(value.length);
    return out;
}

/**
 * What a host `style` attribute change can affect:
 *  - "none":   nothing but this library's own custom properties changed
 *  - "motion": only position / size / fade / custom properties changed —
 *              colors are untouched; only where text sits over a picture
 *              can move
 *  - "paint":  anything else (backgrounds, colors, display, …)
 */
export function styleChangeKind(
    oldValue: string | null,
    newValue: string | null,
): "none" | "motion" | "paint" {
    const before = parseInlineStyle(oldValue);
    const after = parseInlineStyle(newValue);
    let kind: "none" | "motion" = "none";
    const names = new Set([...before.keys(), ...after.keys()]);
    for (const name of names) {
        if (name.startsWith(OWN_STYLE_PREFIX)) continue;
        if (before.get(name) === after.get(name)) continue;
        const base = name.replace(/^-(webkit|moz|ms|o)-/, "");
        if (name.startsWith("--") || MOTION_STYLE_PROPS.has(base)) {
            kind = "motion";
            continue;
        }
        return "paint";
    }
    return kind;
}
