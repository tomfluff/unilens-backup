/**
 * Text over images keeps the host's own colors.
 *
 * A color mode repaints every text node with the theme palette, but the
 * picture underneath is never remapped, so a hero heading designed as white
 * on a dark photo turns into dark-gray (light theme) or yellow on a black
 * plate (high-contrast) on top of the untouched photo. Saturation / contrast
 * and invert likewise shift the type away from the colors the designer
 * matched to that photo.
 *
 * This module finds those "picture blocks" — any image with text drawn on top
 * of it — and marks them so every color adjustment leaves them alone.
 * "Any image" means every way a page can paint one (see collectMedia):
 *   - elements: <img> (any format: jpg/png/webp/avif/gif/svg, srcset and
 *     <picture> included), <svg> (and the <image>/<foreignObject> in it),
 *     <video>, <canvas>, <iframe>, <object>, <embed>, <input type=image>;
 *   - CSS on an element or its ::before / ::after: background-image and
 *     mask-image layers — url() of any format, data: URIs, image-set(),
 *     gradients, cross-fade(), element(), paint() — and content: url().
 *     Text clipped to an image (background-clip: text) is the same case.
 * Rule of thumb: a theme never repaints these backdrops, so it must not
 * repaint the text on them either — or a light-blue gradient button ends up
 * with yellow text. Any size counts: only text whose line actually lies on
 * the image (MEDIA_TEXT_MIN_LINE_SHARE) is affected, so an icon beside a
 * label is not.
 *
 * "Text" is every way a page draws glyphs: text nodes (HTML and SVG), form
 * controls (<input> value / placeholder, <select>, <textarea>, buttons) and
 * ::before / ::after content.
 *
 * Marks:
 *   - MEDIA_TEXT_ATTR on the block and all its descendants: CSS color rules
 *     (theme palette, text plates, text outline, link background) skip them.
 *   - MEDIA_TEXT_ROOT_ATTR on the block itself: whole-page filters are undone
 *     there — a hole in the saturation/contrast layer's mask, and a
 *     counter-filter under invert.
 *
 * Text color is inherited, so excluding the block from the color rules is not
 * enough: a heading that never set its own color would inherit the themed
 * color of the block's (repainted) parent. Each pass therefore measures with
 * the color attributes briefly lifted off <html> — a synchronous read, so
 * nothing is painted in between — which also lets detection see the host's
 * own fills and images (a theme resets backgrounds, text plates drop
 * background images), and pins the host's text paint on each block
 * (HOST_PAINT_VARS, applied by the stylesheet).
 *
 * Detection is geometric and uses text *line* rects (Range#getClientRects),
 * not element boxes, so an inline icon next to a sentence never counts.
 */
import {
    HTML_ATTR_DISPLAY_ACTIVE,
    HTML_ATTR_LINK_BACKGROUND,
    HTML_ATTR_TEXT_PLATE,
    HTML_ATTR_TEXT_STROKE,
    isUniLensOverlayNode,
    MEDIA_OWNER_ATTR,
    MEDIA_TEXT_ATTR,
    MEDIA_TEXT_ROOT_ATTR,
} from "./domIds";
import { restoreHostInlineStyle, setHostInlineStyle } from "./hostSurface";

export interface Box {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

/** A text line counts as on the picture when this share of it overlaps. */
export const MEDIA_TEXT_MIN_LINE_SHARE = 0.5;
/** Smaller than this is a hairline or a dot, not something text sits on. */
export const MEDIA_MIN_SIDE_PX = 8;
/** A background image box larger than this many viewports is a page backdrop. */
export const MEDIA_MAX_VIEWPORTS = 1.5;
/** A shared ancestor at most this much larger than image + text is the figure. */
export const FIGURE_MAX_GROWTH = 1.25;
/** Upper bound on text nodes read per pass. */
export const MEDIA_TEXT_MAX_TEXT_NODES = 4000;

export function boxArea(b: Box): number {
    return Math.max(0, b.right - b.left) * Math.max(0, b.bottom - b.top);
}

export function intersectionArea(a: Box, b: Box): number {
    const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    return w > 0 && h > 0 ? w * h : 0;
}

export function unionBox(a: Box, b: Box): Box {
    return {
        left: Math.min(a.left, b.left),
        top: Math.min(a.top, b.top),
        right: Math.max(a.right, b.right),
        bottom: Math.max(a.bottom, b.bottom),
    };
}

export function lineSitsOnMedia(line: Box, media: Box): boolean {
    const a = boxArea(line);
    return (
        a > 0 &&
        intersectionArea(line, media) >= MEDIA_TEXT_MIN_LINE_SHARE * a
    );
}

/** Big enough to be a picture, small enough not to be the page backdrop. */
export function isPictureSized(
    media: Box,
    viewport: { width: number; height: number },
): boolean {
    const w = media.right - media.left;
    const h = media.bottom - media.top;
    if (w < MEDIA_MIN_SIDE_PX || h < MEDIA_MIN_SIDE_PX) return false;
    return (
        boxArea(media) <= MEDIA_MAX_VIEWPORTS * viewport.width * viewport.height
    );
}

/** True when the shared ancestor is essentially just the image + its text. */
export function isFigureBox(ancestor: Box, media: Box, overlay: Box): boolean {
    const figure = boxArea(unionBox(media, overlay));
    return boxArea(ancestor) <= FIGURE_MAX_GROWTH * figure;
}

/** Split a CSS list on top-level commas (data: URLs carry their own commas). */
export function splitCssList(value: string): string[] {
    const out: string[] = [];
    let depth = 0;
    let quote = "";
    let start = 0;
    for (let i = 0; i < value.length; i++) {
        const c = value[i];
        if (quote) {
            if (c === "\\") i++;
            else if (c === quote) quote = "";
        } else if (c === '"' || c === "'") quote = c;
        else if (c === "(") depth++;
        else if (c === ")") depth = Math.max(0, depth - 1);
        else if (c === "," && depth === 0) {
            out.push(value.slice(start, i).trim());
            start = i + 1;
        }
    }
    out.push(value.slice(start).trim());
    return out;
}

/**
 * One CSS <image> layer: a file (url(), image-set()) or an image the browser
 * generates at the box size (gradients, cross-fade(), element(), paint()).
 */
export type ImageLayer = { kind: "url"; url: string } | { kind: "generated" };

const GENERATED_IMAGE_RE =
    /^(?:-webkit-|-moz-)?(?:(?:repeating-)?(?:linear|radial|conic)-gradient|cross-fade|element|paint)\(/i;

/** A gradient whose every color stop is transparent paints nothing. */
export function isClearGradient(layer: string): boolean {
    if (!/gradient\(/i.test(layer)) return false;
    // Computed styles serialize every color as rgb()/rgba(); a gradient
    // written with other color syntax is kept as a backdrop.
    const stops = [...layer.matchAll(/rgba?\(([^)]*)\)/gi)];
    if (stops.length === 0) return false;
    if (/\b(?:#|hsla?\(|oklch\(|lab\(|color\()/i.test(layer)) return false;
    return stops.every((m) => {
        const a = m[1].split(/[\s,/]+/).filter(Boolean)[3];
        return a !== undefined && parseFloat(a) <= 0.05;
    });
}

export function imageOfLayer(layer: string): ImageLayer | null {
    const l = layer.trim();
    if (!l || l === "none") return null;
    const url = l.match(/url\(\s*(['"]?)(.*?)\1\s*\)/i);
    if (url) return { kind: "url", url: url[2] };
    if (/^(?:-webkit-)?image-set\(/i.test(l)) {
        const quoted = l.match(/(['"])(.*?)\1/);
        return quoted ? { kind: "url", url: quoted[2] } : { kind: "generated" };
    }
    if (!GENERATED_IMAGE_RE.test(l)) return null;
    // Themes keep every gradient (they reset background-color only), so
    // even a faint one stays under the text: only fully clear ones are no
    // backdrop at all.
    return isClearGradient(l) ? null : { kind: "generated" };
}

function lengthPx(token: string, basis: number): number | null {
    if (token.endsWith("%")) return (parseFloat(token) / 100) * basis;
    if (token.endsWith("px")) return parseFloat(token);
    const n = parseFloat(token);
    return Number.isFinite(n) && n === 0 ? 0 : null;
}

/**
 * Where one background layer actually paints, inside the element's box.
 * Returns null when it cannot tell (auto size with no known image size).
 */
export function paintedLayerBox(
    box: Box,
    size: string,
    position: string,
    repeat: string,
    natural: { width: number; height: number } | null,
): Box | null {
    const bw = box.right - box.left;
    const bh = box.bottom - box.top;
    const repeats = repeat.split(/\s+/);
    const repeatX = !/no-repeat/.test(repeats[0] ?? "");
    const repeatY = !/no-repeat/.test(repeats[1] ?? repeats[0] ?? "");

    let w: number | null;
    let h: number | null;
    const s = size.trim();
    if (s === "cover" || s === "contain") {
        // Scaled to fill (cover) or fit (contain) the box, keeping the
        // image's own aspect ratio. A contain image in a tall card paints a
        // strip, not the card; without the ratio only cover is knowable.
        if (natural && natural.width > 0 && natural.height > 0) {
            const k = (s === "cover" ? Math.max : Math.min)(
                bw / natural.width,
                bh / natural.height,
            );
            w = natural.width * k;
            h = natural.height * k;
        } else if (s === "cover") {
            w = bw;
            h = bh;
        } else {
            w = null;
            h = null;
        }
    } else {
        const [sx = "auto", sy = "auto"] = s.split(/\s+/);
        w = sx === "auto" ? null : lengthPx(sx, bw);
        h = sy === "auto" ? null : lengthPx(sy, bh);
        if (natural && natural.width > 0 && natural.height > 0) {
            const ratio = natural.height / natural.width;
            if (w === null && h === null) {
                w = natural.width;
                h = natural.height;
            } else if (w === null && h !== null) w = h / ratio;
            else if (h === null && w !== null) h = w * ratio;
        }
    }
    if (repeatX) w = bw;
    if (repeatY) h = bh;
    if (w === null || h === null) return null;

    const [px = "0%", py = "0%"] = position.trim().split(/\s+/);
    const ox = repeatX ? 0 : (lengthPx(px, bw - w) ?? 0);
    const oy = repeatY ? 0 : (lengthPx(py, bh - h) ?? 0);
    const left = box.left + ox;
    const top = box.top + oy;
    return {
        left: Math.max(box.left, left),
        top: Math.max(box.top, top),
        right: Math.min(box.right, left + w),
        bottom: Math.min(box.bottom, top + h),
    };
}

/* ------------------------------------------------------------------ */
/* DOM                                                                 */
/* ------------------------------------------------------------------ */

/** Elements that are an image themselves (<picture> paints through its <img>). */
const MEDIA_TAGS = new Set([
    "IMG",
    "SVG",
    "VIDEO",
    "CANVAS",
    "IFRAME",
    "OBJECT",
    "EMBED",
]);

function isMediaElement(el: Element): boolean {
    const tag = el.tagName.toUpperCase();
    if (MEDIA_TAGS.has(tag)) return true;
    return tag === "INPUT" && (el as HTMLInputElement).type === "image";
}
const SKIP_TEXT_TAGS = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "TEMPLATE",
    "TEXTAREA",
    "SELECT",
    "OPTION",
]);

interface Media {
    el: Element;
    box: Box;
}

type Size = { width: number; height: number };

const naturalSizes = new Map<string, Size | null>();

const loadingSizes = new Set<string>();
let resyncAfterLoad: (() => void) | null = null;

/** Called when a background image's size becomes known, to run a new pass. */
export function onMediaTextResync(fn: (() => void) | null) {
    resyncAfterLoad = fn;
}

/**
 * Natural size of a CSS image. Needed only for `background-size: auto`.
 * CSS images are not in the document's list of available images, so the
 * size is often unknown on the first pass even when the image is on screen:
 * the image is then loaded (from cache) and a new pass is requested.
 */
function naturalSize(url: string): Size | null {
    if (!url) return null;
    if (naturalSizes.has(url)) return naturalSizes.get(url) ?? null;
    const img = new Image();
    img.src = url;
    if (img.complete && img.naturalWidth > 0) {
        const size = { width: img.naturalWidth, height: img.naturalHeight };
        naturalSizes.set(url, size);
        return size;
    }
    if (!loadingSizes.has(url)) {
        loadingSizes.add(url);
        img.onload = () => {
            loadingSizes.delete(url);
            if (img.naturalWidth <= 0) return;
            naturalSizes.set(url, {
                width: img.naturalWidth,
                height: img.naturalHeight,
            });
            resyncAfterLoad?.();
        };
        img.onerror = () => {
            loadingSizes.delete(url);
            naturalSizes.set(url, null); // broken: do not retry every pass
        };
    }
    return null;
}

/** Not painted: hidden, or fully transparent (closed menus, inactive slides). */
function isInvisible(el: Element, cs?: CSSStyleDeclaration): boolean {
    const check = (
        el as Element & {
            checkVisibility?: (o: Record<string, boolean>) => boolean;
        }
    ).checkVisibility;
    if (typeof check === "function")
        return !check.call(el, {
            opacityProperty: true,
            visibilityProperty: true,
        });
    const style = cs ?? getComputedStyle(el);
    return style.visibility === "hidden" || style.opacity === "0";
}

function toBox(r: DOMRect): Box {
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
}

function hasFill(cs: CSSStyleDeclaration): boolean {
    const c = cs.backgroundColor;
    const transparent =
        !c || c === "transparent" || /rgba?\([^)]*[,/]\s*0\s*\)$/.test(c);
    return !transparent || (cs.backgroundImage ?? "none") !== "none";
}

function prop(cs: CSSStyleDeclaration, name: string): string {
    return (
        cs.getPropertyValue(name) ||
        cs.getPropertyValue(`-webkit-${name}`) ||
        ""
    );
}

/** Every image layer one style paints inside `box`. */
function pushLayers(
    media: Media[],
    el: Element,
    box: Box,
    images: string,
    sizes: string,
    positions: string,
    repeats: string,
    viewport: Size,
) {
    if (!images || images === "none") return;
    const sizeList = splitCssList(sizes || "auto");
    const posList = splitCssList(positions || "0% 0%");
    const repeatList = splitCssList(repeats || "repeat");
    splitCssList(images).forEach((layer, i) => {
        const image = imageOfLayer(layer);
        if (!image) return;
        const natural =
            image.kind === "url"
                ? naturalSize(image.url)
                : // Generated images have no size of their own: auto = the box.
                  { width: box.right - box.left, height: box.bottom - box.top };
        const painted = paintedLayerBox(
            box,
            sizeList[i % sizeList.length] ?? "auto",
            posList[i % posList.length] ?? "0% 0%",
            repeatList[i % repeatList.length] ?? "repeat",
            natural,
        );
        if (painted && isPictureSized(painted, viewport))
            media.push({ el, box: painted });
    });
}

/** Background, mask and content images of one element or pseudo-element. */
function pushStyleImages(
    media: Media[],
    el: Element,
    box: Box,
    cs: CSSStyleDeclaration,
    viewport: Size,
) {
    pushLayers(
        media,
        el,
        box,
        cs.backgroundImage,
        cs.backgroundSize,
        cs.backgroundPosition,
        cs.backgroundRepeat,
        viewport,
    );
    // A mask cuts the element's own fill into the image's shape.
    if (hasFill(cs)) {
        pushLayers(
            media,
            el,
            box,
            prop(cs, "mask-image"),
            prop(cs, "mask-size"),
            prop(cs, "mask-position"),
            prop(cs, "mask-repeat"),
            viewport,
        );
    }
    // content: url() replaces the box with the image.
    const content = cs.content ?? "";
    if (/^url\(|image-set\(/i.test(content) && isPictureSized(box, viewport))
        media.push({ el, box });
}

/**
 * Box of a rendered ::before / ::after. Pseudo-elements have no rect API, so
 * this rebuilds it from the resolved width/height/insets (decorative image
 * layers are almost always absolutely positioned over their host).
 */
export function pseudoBox(
    host: Box,
    viewport: Size,
    cs: Pick<
        CSSStyleDeclaration,
        "position" | "width" | "height" | "top" | "right" | "bottom" | "left"
    >,
): Box | null {
    const n = (v: string) => {
        const x = parseFloat(v);
        return v.endsWith("px") && Number.isFinite(x) ? x : null;
    };
    const screen = {
        left: 0,
        top: 0,
        right: viewport.width,
        bottom: viewport.height,
    };
    const base = cs.position === "fixed" ? screen : host;
    const absolute = cs.position === "absolute" || cs.position === "fixed";
    const [l, t, r, b] = [n(cs.left), n(cs.top), n(cs.right), n(cs.bottom)];
    let w = n(cs.width);
    let h = n(cs.height);
    if (absolute && w === null && l !== null && r !== null)
        w = base.right - base.left - l - r;
    if (absolute && h === null && t !== null && b !== null)
        h = base.bottom - base.top - t - b;
    if (w === null || h === null || w <= 0 || h <= 0) return null;
    let x = base.left;
    let y = base.top;
    if (absolute) {
        if (l !== null) x = base.left + l;
        else if (r !== null) x = base.right - r - w;
        if (t !== null) y = base.top + t;
        else if (b !== null) y = base.bottom - b - h;
    }
    return { left: x, top: y, right: x + w, bottom: y + h };
}

const CLIPS = new Set(["hidden", "clip", "auto", "scroll"]);

/**
 * The part of `box` actually on screen: ancestors with overflow other than
 * visible crop it (a 410px product photo shown in a 228px carousel slide
 * must not reach into the next slide's badge).
 */
function clipToAncestors(
    el: Element,
    box: Box,
    stop: Element,
    cache: Map<Element, Box | null>,
): Box | null {
    let out = box;
    for (let a = el.parentElement; a && a !== stop.parentElement; a = a.parentElement) {
        let clip = cache.get(a);
        if (clip === undefined) {
            const cs = getComputedStyle(a);
            clip =
                CLIPS.has(cs.overflowX) || CLIPS.has(cs.overflowY)
                    ? toBox(a.getBoundingClientRect())
                    : null;
            if (clip && !CLIPS.has(cs.overflowX)) {
                clip.left = Number.NEGATIVE_INFINITY;
                clip.right = Number.POSITIVE_INFINITY;
            }
            if (clip && !CLIPS.has(cs.overflowY)) {
                clip.top = Number.NEGATIVE_INFINITY;
                clip.bottom = Number.POSITIVE_INFINITY;
            }
            cache.set(a, clip);
        }
        if (!clip) continue;
        out = {
            left: Math.max(out.left, clip.left),
            top: Math.max(out.top, clip.top),
            right: Math.min(out.right, clip.right),
            bottom: Math.min(out.bottom, clip.bottom),
        };
        if (out.right <= out.left || out.bottom <= out.top) return null;
    }
    return out;
}

function collectMedia(root: HTMLElement, viewport: Size) {
    const found = collectMediaUnclipped(root, viewport);
    const cache = new Map<Element, Box | null>();
    const media: Media[] = [];
    for (const m of found) {
        // Clip from the element itself for CSS layers (its own overflow too).
        const start = m.el.firstElementChild ?? m.el;
        const box =
            start === m.el
                ? clipToAncestors(m.el, m.box, root, cache)
                : clipToAncestors(start, m.box, root, cache);
        if (box && isPictureSized(box, viewport)) media.push({ el: m.el, box });
    }
    return media;
}

function collectMediaUnclipped(root: HTMLElement, viewport: Size) {
    const media: Media[] = [];
    for (const el of Array.from(root.querySelectorAll("*"))) {
        if (isUniLensOverlayNode(el)) continue;
        const box = toBox(el.getBoundingClientRect());
        if (box.right - box.left < 1 || box.bottom - box.top < 1) continue;
        if (isMediaElement(el)) {
            if (isPictureSized(box, viewport) && !isInvisible(el))
                media.push({ el, box });
            continue;
        }
        const cs = getComputedStyle(el);
        if (cs.display === "none" || isInvisible(el, cs)) continue;
        pushStyleImages(media, el, box, cs, viewport);
        for (const pseudo of ["::before", "::after"] as const) {
            const pcs = getComputedStyle(el, pseudo);
            const content = pcs.content;
            if (!content || content === "none" || content === "normal")
                continue;
            if (pcs.display === "none") continue;
            const pbox = pseudoBox(box, viewport, pcs);
            if (pbox) pushStyleImages(media, el, pbox, pcs, viewport);
        }
    }
    return media;
}

function commonAncestor(a: Element, b: Element): Element | null {
    let node: Element | null = a;
    while (node && !node.contains(b)) node = node.parentElement;
    return node;
}

/** Child of `ancestor` on the way down to `el` (or `el` itself). */
function childToward(ancestor: Element, el: Element): Element {
    let node = el;
    while (node.parentElement && node.parentElement !== ancestor)
        node = node.parentElement;
    return node;
}

/**
 * The block to leave untouched for text owner `owner` sitting on `media`:
 *   - background image: the element painting it (the text is inside it);
 *   - <img> etc. inside the text's own element: that element;
 *   - otherwise the figure that holds both, or just the text layer when the
 *     shared ancestor is a whole section.
 */
/** A solid fill (alpha > 0.9): whatever lies under it is hidden. */
export function isSolidFill(color: string): boolean {
    if (!color || color === "transparent") return false;
    const m = color.match(/rgba?\(([^)]*)\)/i);
    if (!m) return true;
    const parts = m[1].split(/[\s,/]+/).filter(Boolean);
    const alpha = parts.length >= 4 ? parseFloat(parts[3]) : 1;
    return !(alpha <= 0.9);
}

/**
 * True when the text sits on its own solid fill between it and the picture:
 * a sticky header scrolled over a hero image, a white card on a photo.
 * Semi-transparent scrims (caption bars) do not count — the photo shows.
 */
function sitsOnSolidFill(owner: Element, stopAt: Element): boolean {
    for (let e: Element | null = owner; e && e !== stopAt; e = e.parentElement)
        if (isSolidFill(getComputedStyle(e).backgroundColor)) return true;
    return false;
}

/**
 * True when the text rides on a fixed / sticky layer that the picture is not
 * part of: a sticky header or floating table of contents only passes over
 * the article's photos while scrolling. That overlap is incidental.
 */
function floatsOver(owner: Element, stopAt: Element): boolean {
    for (let e: Element | null = owner; e && e !== stopAt; e = e.parentElement) {
        const position = getComputedStyle(e).position;
        if (position === "fixed" || position === "sticky") return true;
    }
    return false;
}

function regionFor(
    owner: Element,
    media: Media,
    stop: Element,
    viewport: Size,
): Element | null {
    let region: Element | null;
    if (media.el.contains(owner) || owner.contains(media.el)) {
        if (media.el.contains(owner) && sitsOnSolidFill(owner, media.el))
            return null;
        region = media.el.contains(owner) ? media.el : owner;
    } else {
        const shared = commonAncestor(owner, media.el);
        if (!shared) return null;
        if (sitsOnSolidFill(owner, shared) || floatsOver(owner, shared))
            return null;
        const overlay = childToward(shared, owner);
        // Compare against the part of the picture inside the ancestor: an
        // image cropped by its card (overflow: hidden) must not make the
        // whole card, title and price included, look like the picture.
        const sharedBox = toBox(shared.getBoundingClientRect());
        const shown = {
            left: Math.max(media.box.left, sharedBox.left),
            top: Math.max(media.box.top, sharedBox.top),
            right: Math.min(media.box.right, sharedBox.right),
            bottom: Math.min(media.box.bottom, sharedBox.bottom),
        };
        const figure = isFigureBox(
            sharedBox,
            boxArea(shown) > 0 ? shown : media.box,
            toBox(overlay.getBoundingClientRect()),
        );
        region = figure ? shared : overlay;
    }
    // Never swallow the page itself.
    if (!region || region === stop || region.contains(stop)) return null;
    const area = boxArea(toBox(region.getBoundingClientRect()));
    if (area > MEDIA_MAX_VIEWPORTS * viewport.width * viewport.height)
        return null;
    return region;
}

/** Host text paint pinned on each block, read by the stylesheet. */
export const HOST_PAINT_VARS = {
    color: "--unilens-a11y-media-text-color",
    fill: "--unilens-a11y-media-text-fill",
    strokeWidth: "--unilens-a11y-media-text-stroke-width",
    strokeColor: "--unilens-a11y-media-text-stroke-color",
    backdrop: "--unilens-a11y-media-text-backdrop",
} as const;

type Rgba = [number, number, number, number];

export function parseRgba(color: string): Rgba | null {
    const m = color.match(/rgba?\(([^)]*)\)/i);
    if (!m) return null;
    const [r, g, b, a = "1"] = m[1].split(/[\s,/]+/).filter(Boolean);
    return [+r, +g, +b, Math.max(0, Math.min(1, parseFloat(a)))];
}

/**
 * The solid color showing behind an element: its own background-color
 * composited over its ancestors' down to the first opaque one (the canvas is
 * white). A picture block keeps this backdrop, so a transparent image (a tag
 * outline, a frame) still shows the host's gray, not the theme's dark page.
 */
export function compositeBackdrop(layers: string[]): string {
    // layers: own color first, then ancestors outward
    let out: [number, number, number] = [255, 255, 255];
    const stack: Rgba[] = [];
    for (const c of layers) {
        const rgba = parseRgba(c);
        if (!rgba) {
            // Non-rgb syntax: trust it as the backdrop as is.
            if (c && c !== "transparent" && stack.length === 0) return c;
            continue;
        }
        if (rgba[3] <= 0) continue;
        stack.push(rgba);
        if (rgba[3] >= 1) break;
    }
    for (let i = stack.length - 1; i >= 0; i--) {
        const [r, g, b, a] = stack[i];
        out = [
            r * a + out[0] * (1 - a),
            g * a + out[1] * (1 - a),
            b * a + out[2] * (1 - a),
        ];
    }
    return `rgb(${out.map((v) => Math.round(v)).join(", ")})`;
}

/** <html> attributes whose CSS repaints text (theme, plate, outline, link fill). */
const TEXT_PAINT_ATTRS = [
    HTML_ATTR_DISPLAY_ACTIVE,
    HTML_ATTR_TEXT_STROKE,
    HTML_ATTR_TEXT_PLATE,
    HTML_ATTR_LINK_BACKGROUND,
];

/** Run `fn` with the color attributes lifted off <html>: host styling only. */
function withHostPaint<T>(doc: Document, fn: () => T): T {
    const html = doc.documentElement;
    const lifted: [string, string][] = [];
    for (const attr of TEXT_PAINT_ATTRS) {
        const v = html.getAttribute(attr);
        if (v !== null) {
            lifted.push([attr, v]);
            html.removeAttribute(attr);
        }
    }
    try {
        return fn();
    } finally {
        for (const [attr, v] of lifted) html.setAttribute(attr, v);
    }
}

type HostPaint = [string, string, string, string, string];

function readHostTextPaint(el: Element): HostPaint {
    const cs = getComputedStyle(el);
    const layers: string[] = [];
    for (let e: Element | null = el; e; e = e.parentElement)
        layers.push(getComputedStyle(e).backgroundColor);
    return [
        cs.color,
        cs.getPropertyValue("-webkit-text-fill-color"),
        cs.getPropertyValue("-webkit-text-stroke-width"),
        cs.getPropertyValue("-webkit-text-stroke-color"),
        compositeBackdrop(layers),
    ];
}

/** Pin the host's text paint on a block (read by the stylesheet). */
/** HTML and SVG elements both carry inline style (an <svg> can be a block). */
function styled(el: Element): HTMLElement | null {
    return el instanceof HTMLElement || el instanceof SVGElement
        ? (el as HTMLElement)
        : null;
}

function pinHostTextPaint(node: Element, paint: HostPaint) {
    const el = styled(node);
    if (!el) return;
    const [color, fill, strokeWidth, strokeColor, backdrop] = paint;
    // Fill / stroke colors default to currentcolor, which computes to the
    // same rgb() as `color`. Pinning that rgb() would stop descendants
    // from following their own `color` (a yellow link would paint white).
    const follow = (v: string) => (!v || v === color ? "currentcolor" : v);
    setHostInlineStyle(el, HOST_PAINT_VARS.color, color);
    setHostInlineStyle(el, HOST_PAINT_VARS.fill, follow(fill));
    setHostInlineStyle(el, HOST_PAINT_VARS.strokeWidth, strokeWidth || "0");
    setHostInlineStyle(el, HOST_PAINT_VARS.strokeColor, follow(strokeColor));
    setHostInlineStyle(el, HOST_PAINT_VARS.backdrop, backdrop);
}

function unpinHostTextPaint(node: Element) {
    const el = styled(node);
    if (!el) return;
    for (const prop of Object.values(HOST_PAINT_VARS))
        restoreHostInlineStyle(el, prop);
}

export function clearMediaTextMarkers(root: ParentNode | null = document) {
    if (!root || typeof root.querySelectorAll !== "function") return;
    root.querySelectorAll(`[${MEDIA_OWNER_ATTR}]`).forEach((el) => {
        el.removeAttribute(MEDIA_OWNER_ATTR);
    });
    root.querySelectorAll(`[${MEDIA_TEXT_ATTR}]`).forEach((el) => {
        el.removeAttribute(MEDIA_TEXT_ATTR);
    });
    root.querySelectorAll(`[${MEDIA_TEXT_ROOT_ATTR}]`).forEach((el) => {
        el.removeAttribute(MEDIA_TEXT_ROOT_ATTR);
        unpinHostTextPaint(el);
    });
}

/** Form controls draw their text from attributes, not text nodes. */
const TEXT_INPUT_TYPES = new Set([
    "button",
    "submit",
    "reset",
    "text",
    "search",
    "email",
    "tel",
    "url",
    "number",
    "password",
    "date",
    "datetime-local",
    "month",
    "week",
    "time",
]);

function controlDrawsText(el: Element): boolean {
    const tag = el.tagName.toUpperCase();
    if (tag === "SELECT" || tag === "TEXTAREA") return true;
    if (tag !== "INPUT") return false;
    const input = el as HTMLInputElement;
    if (!TEXT_INPUT_TYPES.has(input.type)) return false;
    return Boolean(
        input.value ||
            input.placeholder ||
            ["button", "submit", "reset"].includes(input.type),
    );
}

/** True when CSS `content` paints glyphs (not none / empty / an image). */
function contentDrawsText(content: string): boolean {
    const v = (content ?? "").trim();
    if (!v || v === "none" || v === "normal" || v === '""' || v === "''")
        return false;
    return !/^(?:url|image-set|-webkit-image-set)\(/i.test(v);
}

interface TextRun {
    owner: Element;
    lines: Box[];
}

/** Every place the page draws glyphs, with the boxes of its lines. */
function* textRuns(
    pageRoot: HTMLElement,
    doc: Document,
    viewport: Size,
): Generator<TextRun> {
    const walker = doc.createTreeWalker(
        pageRoot,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
        {
            acceptNode(node) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const el = node as Element;
                    if (SKIP_TEXT_TAGS.has(el.tagName.toUpperCase()))
                        return NodeFilter.FILTER_REJECT;
                    if (isUniLensOverlayNode(el))
                        return NodeFilter.FILTER_REJECT;
                    return NodeFilter.FILTER_ACCEPT;
                }
                return node.nodeValue?.trim()
                    ? NodeFilter.FILTER_ACCEPT
                    : NodeFilter.FILTER_SKIP;
            },
        },
    );
    const range = doc.createRange();
    let seen = 0;
    try {
        for (
            let node = walker.nextNode();
            node && seen < MEDIA_TEXT_MAX_TEXT_NODES;
            node = walker.nextNode()
        ) {
            if (node.nodeType === Node.TEXT_NODE) {
                const owner = node.parentElement;
                if (!owner) continue;
                seen++;
                range.selectNodeContents(node);
                const lines = Array.from(range.getClientRects())
                    .filter((r) => r.width >= 1 && r.height >= 1)
                    .map(toBox);
                if (lines.length) yield { owner, lines };
                continue;
            }
            const el = node as Element;
            const box = toBox(el.getBoundingClientRect());
            if (box.right - box.left < 1 || box.bottom - box.top < 1) continue;
            if (controlDrawsText(el)) {
                seen++;
                yield { owner: el, lines: [box] };
            }
            for (const pseudo of ["::before", "::after"] as const) {
                const pcs = getComputedStyle(el, pseudo);
                if (!contentDrawsText(pcs.content) || pcs.display === "none")
                    continue;
                seen++;
                yield {
                    owner: el,
                    lines: [pseudoBox(box, viewport, pcs) ?? box],
                };
            }
        }
    } finally {
        range.detach();
    }
}

function findRegions(
    pageRoot: HTMLElement,
    doc: Document,
    viewport: Size,
    media: Media[],
): Set<Element> {
    const regions = new Set<Element>();
    if (media.length === 0) return regions;
    for (const { owner, lines } of textRuns(pageRoot, doc, viewport)) {
        // Already inside a block found from an earlier text run.
        if (Array.from(regions).some((r) => r.contains(owner))) continue;
        for (const m of media) {
            if (!lines.some((line) => lineSitsOnMedia(line, m.box))) continue;
            // This picture may sit under the text's own solid fill; another
            // one (the fill's own gradient, say) may still be the backdrop.
            const region = regionFor(owner, m, pageRoot, viewport);
            if (!region) continue;
            for (const r of Array.from(regions))
                if (region.contains(r)) regions.delete(r);
            regions.add(region);
            break;
        }
    }
    return regions;
}

/** Find picture blocks under `pageRoot` and (re)mark them. Returns the count. */
export function syncMediaTextMarkers(pageRoot: HTMLElement | null): number {
    if (!pageRoot) return 0;
    const doc = pageRoot.ownerDocument;
    const view = doc.defaultView;
    const viewport = {
        width: view?.innerWidth ?? 0,
        height: view?.innerHeight ?? 0,
    };
    // Measure the page as the host styles it: under a theme the background
    // reset and text plates hide the very fills and images we look for.
    const { regions, paints, owners } = withHostPaint(doc, () => {
        const media = collectMedia(pageRoot, viewport);
        const found = findRegions(pageRoot, doc, viewport, media);
        const read = new Map<Element, HostPaint>();
        for (const el of found) read.set(el, readHostTextPaint(el));
        // CSS-painted pictures (not <img> & co, which plates never touch).
        const cssOwners = new Set(
            media.filter((m) => !isMediaElement(m.el)).map((m) => m.el),
        );
        return { regions: found, paints: read, owners: cssOwners };
    });
    pageRoot.querySelectorAll(`[${MEDIA_OWNER_ATTR}]`).forEach((el) => {
        if (!owners.has(el)) el.removeAttribute(MEDIA_OWNER_ATTR);
    });
    for (const el of owners)
        if (!el.hasAttribute(MEDIA_OWNER_ATTR))
            el.setAttribute(MEDIA_OWNER_ATTR, "true");

    // Rewrite only what changed, so a re-sync does not churn attributes.
    const marked = new Set<Element>();
    for (const region of regions) {
        marked.add(region);
        for (const el of Array.from(region.querySelectorAll("*")))
            marked.add(el);
    }
    pageRoot.querySelectorAll(`[${MEDIA_TEXT_ATTR}]`).forEach((el) => {
        if (!marked.has(el)) el.removeAttribute(MEDIA_TEXT_ATTR);
    });
    pageRoot.querySelectorAll(`[${MEDIA_TEXT_ROOT_ATTR}]`).forEach((el) => {
        if (regions.has(el)) return;
        el.removeAttribute(MEDIA_TEXT_ROOT_ATTR);
        unpinHostTextPaint(el);
    });
    for (const el of marked) {
        if (!el.hasAttribute(MEDIA_TEXT_ATTR))
            el.setAttribute(MEDIA_TEXT_ATTR, "true");
    }
    for (const el of regions) {
        if (!el.hasAttribute(MEDIA_TEXT_ROOT_ATTR))
            el.setAttribute(MEDIA_TEXT_ROOT_ATTR, "true");
    }
    for (const [el, paint] of paints) pinHostTextPaint(el, paint);
    scheduleToneMask();
    return regions.size;
}

/* ------------------------------------------------------------------ */
/* Saturation / contrast layer: cut the picture blocks out of its mask  */
/* ------------------------------------------------------------------ */

let maskLayer: HTMLElement | null = null;
let maskFrame = 0;

const MASK_PROPS = [
    "mask-image",
    "-webkit-mask-image",
    "mask-size",
    "-webkit-mask-size",
    "mask-repeat",
    "-webkit-mask-repeat",
] as const;

/** SVG (alpha) mask: opaque everywhere except the holes. */
export function toneMaskSvg(
    width: number,
    height: number,
    holes: Box[],
): string {
    const w = Math.max(1, Math.round(width));
    const h = Math.max(1, Math.round(height));
    const rects = holes
        .map((b) => {
            const x = Math.round(b.left);
            const y = Math.round(b.top);
            const rw = Math.round(b.right - b.left);
            const rh = Math.round(b.bottom - b.top);
            return `<rect x='${x}' y='${y}' width='${rw}' height='${rh}' fill='black'/>`;
        })
        .join("");
    const full = `width='${w}' height='${h}'`;
    return (
        `<svg xmlns='http://www.w3.org/2000/svg' ${full} viewBox='0 0 ${w} ${h}'>` +
        `<mask id='m'><rect ${full} fill='white'/>${rects}</mask>` +
        `<rect ${full} fill='white' mask='url(#m)'/></svg>`
    );
}

function clipToLayer(b: Box, layer: Box): Box | null {
    const clipped = {
        left: Math.max(b.left, layer.left) - layer.left,
        top: Math.max(b.top, layer.top) - layer.top,
        right: Math.min(b.right, layer.right) - layer.left,
        bottom: Math.min(b.bottom, layer.bottom) - layer.top,
    };
    return boxArea(clipped) > 0 ? clipped : null;
}

function paintToneMask() {
    const layer = maskLayer;
    if (!layer?.isConnected) return;
    const doc = layer.ownerDocument;
    const layerBox = toBox(layer.getBoundingClientRect());
    const holes: Box[] = [];
    doc.querySelectorAll(`[${MEDIA_TEXT_ROOT_ATTR}]`).forEach((el) => {
        const b = clipToLayer(toBox(el.getBoundingClientRect()), layerBox);
        if (b) holes.push(b);
    });
    if (holes.length === 0) {
        for (const p of MASK_PROPS) layer.style.removeProperty(p);
        return;
    }
    const svg = toneMaskSvg(
        layerBox.right - layerBox.left,
        layerBox.bottom - layerBox.top,
        holes,
    );
    const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    layer.style.setProperty("mask-image", url);
    layer.style.setProperty("-webkit-mask-image", url);
    layer.style.setProperty("mask-size", "100% 100%");
    layer.style.setProperty("-webkit-mask-size", "100% 100%");
    layer.style.setProperty("mask-repeat", "no-repeat");
    layer.style.setProperty("-webkit-mask-repeat", "no-repeat");
}

/** Repaint the mask on the next frame; repeated calls coalesce. */
export function scheduleToneMask() {
    if (!maskLayer || maskFrame || typeof requestAnimationFrame !== "function")
        return;
    maskFrame = requestAnimationFrame(() => {
        maskFrame = 0;
        paintToneMask();
    });
}

/**
 * Track `layer` (the saturation/contrast layer) or stop with null. The holes
 * follow the blocks on scroll and resize, since the layer is fixed and the
 * blocks are not.
 */
export function setToneMaskLayer(layer: HTMLElement | null) {
    if (layer === maskLayer) {
        scheduleToneMask();
        return;
    }
    if (maskLayer) {
        for (const p of MASK_PROPS) maskLayer.style.removeProperty(p);
    }
    if (!layer && maskLayer) {
        window.removeEventListener("scroll", scheduleToneMask, true);
        window.removeEventListener("resize", scheduleToneMask);
    }
    if (layer && !maskLayer) {
        window.addEventListener("scroll", scheduleToneMask, {
            capture: true,
            passive: true,
        });
        window.addEventListener("resize", scheduleToneMask, { passive: true });
    }
    maskLayer = layer;
    if (!layer && maskFrame) {
        cancelAnimationFrame(maskFrame);
        maskFrame = 0;
    }
    scheduleToneMask();
}
