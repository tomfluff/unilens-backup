/**
 * Opportunistic zoom (Lab) — magnify the whole page only as far as it can
 * go without breaking.
 *
 * A reproduction of Bigham, "Making the Web Easier to See with Opportunistic
 * Accessibility Improvement" (UIST 2014). What the paper describes, done the
 * same way here:
 * - Magnify with CSS `zoom` on <body>, which reflows the page much like the
 *   browser's own Ctrl/Cmd + (images grow too).
 * - Measure "page health" before magnifying (some pages are already broken
 *   at 1x), then step up 0.1 at a time and stop as soon as health has fallen
 *   more than 0.05 below that starting value. Never beyond 3x.
 * - Page health = 1 − (problem area / page area). The page area is the full
 *   document, visible or not. The problems:
 *     overflow — page area scrolled out of the viewport sideways
 *     overlap  — area where text lies on top of other text (line sweep)
 *     narrow   — block elements whose text wraps to fewer than 5 words per
 *                line (elements with fewer than 10 words are ignored)
 * - Remember the result per page, so the next visit is magnified at once
 *   (the paper uses a page-specific cookie; this uses localStorage).
 *
 * Where this departs from the paper, and why:
 * - Text is measured as the line boxes of text nodes (Range#getClientRects),
 *   not as element boxes: element boxes nest (a <p> contains its <a>), which
 *   would read as overlap on every page.
 * - Japanese and Chinese put no spaces between words. Two CJK characters
 *   count as one word, so "fewer than 5 words per line" means fewer than 10
 *   characters per line in Japanese.
 * - Line boxes that merely touch (tight line-height) are not overlap: a pair
 *   counts once the shared height is 30% of the shorter line. Text inside
 *   position: fixed / sticky boxes is left out of the overlap check, since
 *   those boxes sit over the scrolling content by design.
 * - The remembered scale is reused only at the same window width and text
 *   settings, and the page is measured again when the window is resized or
 *   a text setting changes. The paper does not discuss either.
 */

import { afterNextPaint } from "./afterPaint";
import { appendA11yStyle } from "./cspStyle";
import {
    OPP_ZOOM_HTML_ATTR,
    OPP_ZOOM_STYLE_ID,
    OPP_ZOOM_VAR,
    UI_ATTR,
    UNILENS_OVERLAY_ROOT_IDS,
} from "./domIds";
import { restoreHostInlineStyle, setHostInlineStyle } from "./hostSurface";
import {
    getSettings,
    patchSettings,
    type Settings,
    saveSettings,
    useSettings,
} from "./settings";

/** Magnification step (paper: 0.1). */
export const OPP_ZOOM_STEP = 0.1;
/** Health may fall this far below the 1x value before we stop (paper: 0.05). */
export const OPP_ZOOM_TOLERANCE = 0.05;
/** Upper bound (paper: 3x). */
export const OPP_ZOOM_MAX = 3;
/** Fewer words per line than this is narrow wrapping (paper: 5). */
export const NARROW_WORDS_PER_LINE = 5;
/** Elements with fewer words than this are not checked (paper: 10). */
export const NARROW_MIN_WORDS = 10;
/** CJK characters per "word" for scripts without spaces. */
export const CJK_CHARS_PER_WORD = 2;
/** Vertical share of the shorter line two lines must share to overlap. */
export const OVERLAP_MIN_Y_SHARE = 0.3;

const CACHE_STORAGE_KEY = "unilens-a11y-opp-zoom";
const CACHE_LIMIT = 100;
/** Wait for the window to settle before measuring again. */
const RESIZE_DELAY_MS = 300;
/** Other text features apply after a paint; measure once they have. */
const SETTINGS_DELAY_MS = 400;

/**
 * Settings that change how text lays out. When one changes while zoom is on,
 * the page is measured again, and a remembered scale is only reused when they
 * are all the same as when it was measured.
 */
const TEXT_SETTING_KEYS = [
    "fontSize",
    "fontFamily",
    "customFontFamily",
    "lineHeight",
    "letterSpacing",
    "bodyTextExpandLevel",
    "smallTextBoostLevel",
    "autoTextSize",
    "autoTextMode",
    "autoTextMinPx",
    "autoTextMaxScale",
] as const satisfies readonly (keyof Settings)[];

// ── Types ──────────────────────────────────────────────────────────────────

export type OppZoomProblem = "overflow" | "overlap" | "narrow";
/**
 * Why the search stopped where it did. "cached": the remembered scale was
 * applied without measuring.
 */
export type OppZoomStop = OppZoomProblem | "max" | "empty" | "cached";

/** One page-health measurement. Areas are CSS px² of the document. */
export interface PageHealth {
    /** 0..1 — 1 means no part of the page has a problem. */
    health: number;
    pageArea: number;
    overflow: number;
    overlap: number;
    narrow: number;
}

export interface OppZoomResult {
    /** The scale now applied. */
    scale: number;
    stopReason: OppZoomStop;
    /** At 1x. null when the scale came from the remembered value. */
    baseline: PageHealth | null;
    /** At `scale`. null when the scale came from the remembered value. */
    final: PageHealth | null;
    /** The first step that fell below the tolerance, and its scale. */
    failed: { scale: number; health: PageHealth } | null;
    /** Health measurements made (= layouts of the page). */
    trials: number;
    /** Time the whole search took. */
    ms: number;
    viewportWidth: number;
    fromCache: boolean;
}

export interface Box {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

/** A line box of text; lines of the same text node share a `group`. */
export interface LineBox extends Box {
    group: number;
}

// ── Pure parts (unit-tested) ───────────────────────────────────────────────

/** Hiragana, katakana and CJK ideographs: scripts written without spaces. */
const CJK_RE = /[぀-ヿ㐀-䶿一-鿿豈-﫿]/g;
const WORD_RE = /[\p{L}\p{N}]/u;

/**
 * Words in `text`: space-separated tokens with a letter or digit, plus one
 * word per CJK_CHARS_PER_WORD characters of CJK.
 */
export function countWords(text: string): number {
    let cjk = 0;
    const rest = text.replace(CJK_RE, () => {
        cjk++;
        return " ";
    });
    let words = 0;
    for (const token of rest.split(/\s+/)) if (WORD_RE.test(token)) words++;
    return words + cjk / CJK_CHARS_PER_WORD;
}

/** Narrow word wrapping, as the paper defines it. */
export function isNarrowWrap(words: number, lines: number): boolean {
    if (lines < 1 || words < NARROW_MIN_WORDS) return false;
    return words / lines < NARROW_WORDS_PER_LINE;
}

/** Number of text lines among line boxes (boxes on one line share a row). */
export function countLines(boxes: Box[]): number {
    const sorted = boxes
        .filter((b) => b.bottom > b.top)
        .sort((a, b) => a.top - b.top);
    let lines = 0;
    let rowBottom = Number.NEGATIVE_INFINITY;
    for (const b of sorted) {
        if ((b.top + b.bottom) / 2 > rowBottom) {
            lines++;
            rowBottom = b.bottom;
        } else rowBottom = Math.max(rowBottom, b.bottom);
    }
    return lines;
}

/**
 * Total area where line boxes of different text nodes overlap, by a sweep
 * down the page: only boxes still open at a box's top can meet it.
 */
export function overlapArea(
    boxes: LineBox[],
    minYShare = OVERLAP_MIN_Y_SHARE,
): number {
    const sorted = boxes
        .filter((b) => b.right > b.left && b.bottom > b.top)
        .sort((a, b) => a.top - b.top);
    let open: LineBox[] = [];
    let area = 0;
    for (const b of sorted) {
        open = open.filter((o) => o.bottom > b.top);
        for (const o of open) {
            if (o.group === b.group) continue;
            const ix = Math.min(o.right, b.right) - Math.max(o.left, b.left);
            if (ix <= 0) continue;
            const iy = Math.min(o.bottom, b.bottom) - Math.max(o.top, b.top);
            const shorter = Math.min(o.bottom - o.top, b.bottom - b.top);
            if (iy <= 0 || iy < minYShare * shorter) continue;
            area += ix * iy;
        }
        open.push(b);
    }
    return area;
}

/** Health from problem areas; floored at 0 (problem areas can add up). */
export function healthFromAreas(areas: Omit<PageHealth, "health">): PageHealth {
    const { pageArea, overflow, overlap, narrow } = areas;
    if (!(pageArea > 0)) return { ...areas, health: 1 };
    const health = 1 - (overflow + overlap + narrow) / pageArea;
    return { ...areas, health: Math.max(0, Math.min(1, health)) };
}

function share(h: PageHealth, key: OppZoomProblem): number {
    return h.pageArea > 0 ? h[key] / h.pageArea : 0;
}

/** The problem whose share of the page grew most from 1x to `failed`. */
export function dominantProblem(
    baseline: PageHealth,
    failed: PageHealth,
): OppZoomProblem {
    let best: OppZoomProblem = "overflow";
    let bestDelta = Number.NEGATIVE_INFINITY;
    for (const key of ["overflow", "overlap", "narrow"] as const) {
        const delta = share(failed, key) - share(baseline, key);
        if (delta > bestDelta) {
            best = key;
            bestDelta = delta;
        }
    }
    return best;
}

export interface OppZoomSearchOptions {
    /** Apply `scale` to the page and measure it. */
    healthAt: (scale: number) => PageHealth;
    step?: number;
    tolerance?: number;
    max?: number;
}

export type OppZoomSearch = Omit<
    OppZoomResult,
    "ms" | "viewportWidth" | "fromCache"
>;

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * The paper's search: measure 1x, then walk up one step at a time and keep
 * the last scale whose health is within `tolerance` of the 1x value.
 */
export function searchOppZoom({
    healthAt,
    step = OPP_ZOOM_STEP,
    tolerance = OPP_ZOOM_TOLERANCE,
    max = OPP_ZOOM_MAX,
}: OppZoomSearchOptions): OppZoomSearch {
    const baseline = healthAt(1);
    let trials = 1;
    if (!(baseline.pageArea > 0)) {
        return {
            scale: 1,
            stopReason: "empty",
            baseline,
            final: baseline,
            failed: null,
            trials,
        };
    }
    const floor = baseline.health - tolerance;
    let scale = 1;
    let final = baseline;
    for (let i = 1; ; i++) {
        const next = round2(1 + i * step);
        if (next > max + 1e-9) break;
        const health = healthAt(next);
        trials++;
        if (health.health < floor - 1e-9) {
            return {
                scale,
                stopReason: dominantProblem(baseline, health),
                baseline,
                final,
                failed: { scale: next, health },
                trials,
            };
        }
        scale = next;
        final = health;
    }
    return { scale, stopReason: "max", baseline, final, failed: null, trials };
}

/** One remembered result. */
export interface OppZoomCacheEntry {
    /** Scale. */
    s: number;
    /** Window width it was measured at. */
    w: number;
    /** Text settings it was measured with (see textSettingsKey). */
    k: string;
    /** When it was stored (ms since epoch), to drop the oldest. */
    t: number;
}

export type OppZoomCache = Record<string, OppZoomCacheEntry>;

/** The remembered scale for `page`, if it was measured in the same conditions. */
export function cachedScale(
    cache: OppZoomCache,
    page: string,
    width: number,
    settingsKey: string,
): number | null {
    const e = cache[page];
    if (!e || typeof e !== "object") return null;
    if (e.w !== width || e.k !== settingsKey) return null;
    if (typeof e.s !== "number" || !(e.s >= 1 && e.s <= OPP_ZOOM_MAX))
        return null;
    return e.s;
}

/** Keep the `limit` most recent entries. */
export function pruneCache(cache: OppZoomCache, limit = CACHE_LIMIT) {
    const pages = Object.keys(cache);
    if (pages.length <= limit) return cache;
    pages.sort((a, b) => (cache[b]?.t ?? 0) - (cache[a]?.t ?? 0));
    const out: OppZoomCache = {};
    for (const page of pages.slice(0, limit)) out[page] = cache[page];
    return out;
}

export function textSettingsKey(s: Settings): string {
    return TEXT_SETTING_KEYS.map((k) => String(s[k])).join("|");
}

// ── Page measurement ───────────────────────────────────────────────────────

/** Subtrees whose text is not page reading content. */
const SKIP_TAGS = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "TEMPLATE",
    "TEXTAREA",
    "SELECT",
    "OPTION",
    "SVG",
    "IFRAME",
    "CANVAS",
]);
const OWN_ROOT_IDS = new Set<string>(UNILENS_OVERLAY_ROOT_IDS);

interface BlockText {
    words: number;
    boxes: Box[];
}

/** Measure page health now. Reads layout only; the caller sets the zoom. */
export function measurePageHealth(doc: Document = document): PageHealth {
    const html = doc.documentElement;
    const body = doc.body;
    const viewportWidth = html.clientWidth;
    const pageWidth = Math.max(html.scrollWidth, viewportWidth);
    const pageHeight = Math.max(html.scrollHeight, html.clientHeight);
    const pageArea = pageWidth * pageHeight;
    const overflow = Math.max(0, pageWidth - viewportWidth) * pageHeight;
    if (!body || !(pageArea > 0))
        return healthFromAreas({ pageArea, overflow, overlap: 0, narrow: 0 });

    const view = doc.defaultView;
    const sx = view?.scrollX ?? 0;
    const sy = view?.scrollY ?? 0;
    const styles = new Map<Element, CSSStyleDeclaration>();
    const styleOf = (el: Element) => {
        let cs = styles.get(el);
        if (!cs) {
            cs = getComputedStyle(el);
            styles.set(el, cs);
        }
        return cs;
    };
    const blocks = new Map<Element, Element>();
    /** The nearest ancestor that lays its text out in lines of its own. */
    const blockOf = (el: Element): Element => {
        const known = blocks.get(el);
        if (known) return known;
        const display = styleOf(el).display;
        const parent = el.parentElement;
        const inline =
            display === "inline" ||
            display === "contents" ||
            display.startsWith("ruby");
        const block = inline && parent ? blockOf(parent) : el;
        blocks.set(el, block);
        return block;
    };
    const pinned = new Map<Element, boolean>();
    /** Inside a position: fixed / sticky box. */
    const isPinned = (el: Element): boolean => {
        const known = pinned.get(el);
        if (known !== undefined) return known;
        const position = styleOf(el).position;
        const parent = el.parentElement;
        const out =
            position === "fixed" ||
            position === "sticky" ||
            (parent ? isPinned(parent) : false);
        pinned.set(el, out);
        return out;
    };

    const walker = doc.createTreeWalker(
        body,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
        {
            acceptNode(node) {
                if (node.nodeType !== Node.ELEMENT_NODE)
                    return node.nodeValue?.trim()
                        ? NodeFilter.FILTER_ACCEPT
                        : NodeFilter.FILTER_SKIP;
                const el = node as Element;
                if (
                    SKIP_TAGS.has(el.tagName.toUpperCase()) ||
                    OWN_ROOT_IDS.has(el.id) ||
                    el.getAttribute(UI_ATTR) === "1"
                )
                    return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_SKIP;
            },
        },
    );

    const range = doc.createRange();
    const lines: LineBox[] = [];
    const blockText = new Map<Element, BlockText>();
    let group = 0;
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const parent = node.parentElement;
        if (!parent) continue;
        range.selectNodeContents(node);
        const boxes: Box[] = [];
        for (const r of Array.from(range.getClientRects())) {
            if (r.width < 1 || r.height < 1) continue;
            boxes.push({
                left: r.left + sx,
                top: r.top + sy,
                right: r.right + sx,
                bottom: r.bottom + sy,
            });
        }
        if (boxes.length === 0) continue;
        group++;
        if (!isPinned(parent))
            for (const b of boxes) lines.push({ ...b, group });
        const block = blockOf(parent);
        let entry = blockText.get(block);
        if (!entry) {
            entry = { words: 0, boxes: [] };
            blockText.set(block, entry);
        }
        entry.words += countWords(node.nodeValue ?? "");
        entry.boxes.push(...boxes);
    }
    range.detach();

    let narrow = 0;
    for (const [block, { words, boxes }] of blockText) {
        if (!isNarrowWrap(words, countLines(boxes))) continue;
        const r = block.getBoundingClientRect();
        narrow += r.width * r.height;
    }

    return healthFromAreas({
        pageArea,
        overflow,
        overlap: overlapArea(lines),
        narrow,
    });
}

// ── Applying the zoom ──────────────────────────────────────────────────────

let appliedScale = 1;

function ensureStylesheet() {
    if (document.getElementById(OPP_ZOOM_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = OPP_ZOOM_STYLE_ID;
    // Zoom from a stylesheet, not body's inline style: the page-text code
    // clears an inline `zoom` on <body> left by an older version of itself.
    // `html[…] > body` also follows a <body> the host swaps in (Turbo).
    style.textContent = `html[${OPP_ZOOM_HTML_ATTR}] > body { zoom: var(${OPP_ZOOM_VAR}, 1) !important; }`;
    appendA11yStyle(style);
}

function setPageZoom(scale: number) {
    const html = document.documentElement;
    if (scale === 1) {
        html.removeAttribute(OPP_ZOOM_HTML_ATTR);
        restoreHostInlineStyle(html, OPP_ZOOM_VAR);
    } else {
        ensureStylesheet();
        setHostInlineStyle(html, OPP_ZOOM_VAR, String(scale));
        html.setAttribute(OPP_ZOOM_HTML_ATTR, "");
    }
    appliedScale = scale;
}

// ── Remembered results (localStorage; never throws) ────────────────────────

function pageKey(): string {
    return `${location.origin}${location.pathname}`;
}

function readCache(): OppZoomCache {
    try {
        const raw = window.localStorage.getItem(CACHE_STORAGE_KEY);
        const parsed: unknown = raw ? JSON.parse(raw) : null;
        return parsed && typeof parsed === "object" && !Array.isArray(parsed)
            ? (parsed as OppZoomCache)
            : {};
    } catch {
        return {};
    }
}

function rememberScale(scale: number, width: number) {
    try {
        const cache = readCache();
        cache[pageKey()] = {
            s: scale,
            w: width,
            k: textSettingsKey(getSettings()),
            t: Date.now(),
        };
        window.localStorage.setItem(
            CACHE_STORAGE_KEY,
            JSON.stringify(pruneCache(cache)),
        );
    } catch {
        // Storage full or blocked: the zoom still applies, it is just not
        // remembered for the next visit.
    }
}

// ── Running it ─────────────────────────────────────────────────────────────

let lastResult: OppZoomResult | null = null;
const listeners = new Set<() => void>();
let appliedCallbacks: (() => void)[] = [];

function emit() {
    for (const listener of listeners) listener();
}

/** Notified whenever the applied zoom or the last result changes. */
export function onOppZoomChange(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function getAppliedOppZoom(): number {
    return appliedScale;
}

export function getLastOppZoomResult(): OppZoomResult | null {
    return lastResult;
}

/** Keep the reader at the same place in the text while the page grows. */
function scrollShare(): number {
    const html = document.documentElement;
    const max = html.scrollHeight - html.clientHeight;
    return max > 0 ? window.scrollY / max : 0;
}

function restoreScrollShare(shareY: number) {
    const html = document.documentElement;
    const max = html.scrollHeight - html.clientHeight;
    if (max > 0 && shareY > 0)
        window.scrollTo({ top: shareY * max, behavior: "instant" });
}

/**
 * Measure this page and apply the largest healthy zoom (or, with
 * `useCache`, the remembered one when it was measured in the same
 * conditions). Runs synchronously: the browser paints none of the trial
 * steps, only the result.
 */
export function refreshOpportunisticZoom({
    useCache = false,
}: { useCache?: boolean } = {}): OppZoomResult {
    const width = window.innerWidth;
    if (useCache) {
        const scale = cachedScale(
            readCache(),
            pageKey(),
            width,
            textSettingsKey(getSettings()),
        );
        if (scale !== null) {
            const shareY = scrollShare();
            setPageZoom(scale);
            restoreScrollShare(shareY);
            lastResult = {
                scale,
                stopReason: "cached",
                baseline: null,
                final: null,
                failed: null,
                trials: 0,
                ms: 0,
                viewportWidth: width,
                fromCache: true,
            };
            emit();
            return lastResult;
        }
    }

    const start = performance.now();
    const shareY = scrollShare();
    const search = searchOppZoom({
        healthAt: (scale) => {
            setPageZoom(scale);
            return measurePageHealth();
        },
    });
    setPageZoom(search.scale);
    restoreScrollShare(shareY);
    lastResult = {
        ...search,
        ms: Math.round(performance.now() - start),
        viewportWidth: width,
        fromCache: false,
    };
    if (search.stopReason !== "empty") rememberScale(search.scale, width);
    emit();
    return lastResult;
}

const deferredRefresh = afterNextPaint(() => runRefresh(false));
const deferredCachedRefresh = afterNextPaint(() => runRefresh(true));

function runRefresh(useCache: boolean) {
    if (!zoomActive || !getSettings().oppZoom) return;
    refreshOpportunisticZoom({ useCache });
    const callbacks = appliedCallbacks;
    appliedCallbacks = [];
    for (const cb of callbacks) cb();
}

/** Measure again after the next paint (the panel button repaints first). */
export function remeasureOpportunisticZoom() {
    deferredRefresh.schedule();
}

/**
 * Runs `cb` once the zoom just asked for is on the page — after the next
 * paint when a measurement is pending, otherwise right away.
 */
export function afterOppZoomApplied(cb: () => void) {
    if (deferredRefresh.pending || deferredCachedRefresh.pending)
        appliedCallbacks.push(cb);
    else cb();
}

export function isOppZoomPending(): boolean {
    return deferredRefresh.pending || deferredCachedRefresh.pending;
}

/** Take the zoom off the page (the setting is left as it is). */
export function clearOpportunisticZoom() {
    deferredRefresh.cancel();
    deferredCachedRefresh.cancel();
    window.clearTimeout(delayTimer);
    const changed = appliedScale !== 1 || lastResult !== null;
    if (appliedScale !== 1) {
        const shareY = scrollShare();
        setPageZoom(1);
        restoreScrollShare(shareY);
    } else setPageZoom(1);
    lastResult = null;
    const callbacks = appliedCallbacks;
    appliedCallbacks = [];
    for (const cb of callbacks) cb();
    if (changed) emit();
}

/** Turn the feature off and take the zoom off the page. */
export function resetOpportunisticZoom() {
    if (getSettings().oppZoom) {
        patchSettings({ oppZoom: false });
        saveSettings();
    }
    clearOpportunisticZoom();
}

let zoomActive = false;
let settingsUnsub: (() => void) | null = null;
let delayTimer: number | undefined;
let loadHandler: (() => void) | null = null;

function refreshLater(ms: number) {
    window.clearTimeout(delayTimer);
    delayTimer = window.setTimeout(() => {
        if (getSettings().oppZoom) deferredRefresh.schedule();
    }, ms);
}

function onResize() {
    if (getSettings().oppZoom) refreshLater(RESIZE_DELAY_MS);
}

/** On (page load, or another tab turned it on): remembered scale first. */
function startFromSettings() {
    if (document.readyState === "complete") {
        deferredCachedRefresh.schedule();
        return;
    }
    if (loadHandler) return;
    loadHandler = () => {
        loadHandler = null;
        if (zoomActive && getSettings().oppZoom)
            deferredCachedRefresh.schedule();
    };
    window.addEventListener("load", loadHandler, { once: true });
}

export function initOpportunisticZoom() {
    if (zoomActive) return;
    zoomActive = true;
    window.addEventListener("resize", onResize);
    settingsUnsub = useSettings.subscribe((live, prev) => {
        if (live.oppZoom !== prev.oppZoom) {
            if (live.oppZoom) deferredRefresh.schedule();
            else clearOpportunisticZoom();
            return;
        }
        if (!live.oppZoom) return;
        if (TEXT_SETTING_KEYS.some((k) => live[k] !== prev[k]))
            refreshLater(SETTINGS_DELAY_MS);
    });
    if (getSettings().oppZoom) startFromSettings();
}

/** The host replaced <body>: the stylesheet follows it; measure it again. */
export function rebindOpportunisticZoom() {
    if (zoomActive && getSettings().oppZoom) refreshLater(0);
}

export function destroyOpportunisticZoom() {
    if (!zoomActive) return;
    zoomActive = false;
    window.removeEventListener("resize", onResize);
    if (loadHandler) window.removeEventListener("load", loadHandler);
    loadHandler = null;
    settingsUnsub?.();
    settingsUnsub = null;
    clearOpportunisticZoom();
    document.getElementById(OPP_ZOOM_STYLE_ID)?.remove();
}
