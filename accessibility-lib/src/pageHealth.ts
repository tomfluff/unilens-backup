/**
 * Page health — how much of the page's text is still readable after
 * magnification. Adapted from Bigham, "Making the Web Easier to See with
 * Opportunistic Accessibility Improvement" (UIST 2014): magnify as far as
 * the page allows, and stop just before magnification starts to hurt.
 *
 * Health is 1 minus the share of text area that has one of the three
 * side effects the paper found most common:
 *   - overflow: pushed outside the page width (horizontal scrolling)
 *   - overlap:  drawn on top of other text
 *   - narrow:   wrapped so tightly that only a few words fit per line
 *
 * Differences from the paper, all deliberate:
 *   - Only text is measured, via per-line text-node rects
 *     (Range#getClientRects).
 *     Element boxes nest (a <p> contains its <a>), which reads as overlap;
 *     line fragments of text nodes never do unless text really collides.
 *   - The area is normalized by total text area, not page area, so a page
 *     that is mostly images does not hide a broken text column.
 *   - The search is coarse-to-fine (0.2 steps, then bisection to 0.05)
 *     instead of a flat 0.1 walk: fewer reflows, finer result. Every scale it
 *     returns has itself been measured healthy, so skipping a grid point can
 *     never apply an unmeasured layout.
 */
import { isUniLensOverlayNode } from "./domIds";

export type HealthProblem = "overflow" | "overlap" | "narrow";
export type HealthStopReason = HealthProblem | "max" | "empty";

/** Text area (px²) in each state, and the health they add up to. */
export interface HealthSample {
    /** 0..1 — 1 means no text area has a side effect. */
    health: number;
    total: number;
    overflow: number;
    overlap: number;
    narrow: number;
}

export interface HealthRect {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

/** Health may drop this far below the starting layout (paper: 0.05). */
export const HEALTH_TOLERANCE = 0.05;
/** Coarse step for the first pass up the scale range. */
export const HEALTH_COARSE_STEP = 0.2;
/** Bisection stops once the safe/unsafe gap is this small. */
export const HEALTH_RESOLUTION = 0.05;
/** Upper bound on text nodes read per measurement, to keep one trial cheap. */
export const HEALTH_MAX_TEXT_NODES = 1500;
/** A text run must wrap at least this many lines before "narrow" can apply. */
export const NARROW_MIN_LINES = 3;
/** Fewer words per line reads as narrow wrapping (space-separated text). */
export const NARROW_MIN_WORDS_PER_LINE = 3;
/** Fewer characters per line than this reads as narrow wrapping (CJK). */
export const NARROW_MIN_CJK_CHARS_PER_LINE = 6;

const EMPTY_SAMPLE: HealthSample = {
    health: 1,
    total: 0,
    overflow: 0,
    overlap: 0,
    narrow: 0,
};

/** Problem areas to a sample. Areas can double-count; health floors at 0. */
export function healthFromAreas(
    areas: Omit<HealthSample, "health">,
): HealthSample {
    const { total, overflow, overlap, narrow } = areas;
    if (!(total > 0)) return { ...EMPTY_SAMPLE };
    const bad = overflow + overlap + narrow;
    const health = Math.max(0, Math.min(1, 1 - bad / total));
    return { health, total, overflow, overlap, narrow };
}

/**
 * Sum of pairwise intersection areas, by a top-edge sweep. Text lines are
 * stacked vertically, so the active set is only the lines sharing one row
 * (a few columns), not every full-width line on the page.
 *
 * A pair only counts when the vertical overlap is a real share of the
 * shorter line: glyph boxes of adjacent lines touch or overlap by a few
 * pixels whenever line-height is tight, and that is not text on text.
 */
export function overlapArea(rects: HealthRect[], minYShare = 0.3): number {
    const sorted = rects
        .filter((r) => r.right > r.left && r.bottom > r.top)
        .sort((a, b) => a.top - b.top);
    let active: HealthRect[] = [];
    let area = 0;
    for (const r of sorted) {
        active = active.filter((a) => a.bottom > r.top);
        for (const a of active) {
            const ix = Math.min(a.right, r.right) - Math.max(a.left, r.left);
            if (ix <= 1) continue;
            const iy = Math.min(a.bottom, r.bottom) - Math.max(a.top, r.top);
            const shorter = Math.min(a.bottom - a.top, r.bottom - r.top);
            if (iy <= minYShare * shorter) continue;
            area += ix * iy;
        }
        active.push(r);
    }
    return area;
}

/** Width of [left, right] that falls outside [0, viewportWidth]. */
export function outsideWidth(
    left: number,
    right: number,
    viewportWidth: number,
): number {
    const inside = Math.max(
        0,
        Math.min(right, viewportWidth) - Math.max(left, 0),
    );
    return Math.max(0, right - left - inside);
}

const CJK_RE = /[぀-ヿ㐀-鿿豈-﫿가-힯]/g;

export interface TextRunStats {
    lines: number;
    chars: number;
    words: number;
    cjk: boolean;
}

export function textRunStats(text: string, lines: number): TextRunStats {
    const compact = text.replace(/\s+/g, "");
    const cjkCount = compact.match(CJK_RE)?.length ?? 0;
    const words = text.split(/\s+/).filter(Boolean).length;
    return {
        lines,
        chars: compact.length,
        words,
        cjk: compact.length > 0 && cjkCount / compact.length >= 0.3,
    };
}

/** Too few words (or CJK characters) per line to read comfortably. */
export function isNarrowWrap({
    lines,
    chars,
    words,
    cjk,
}: TextRunStats): boolean {
    if (lines < NARROW_MIN_LINES) return false;
    return cjk
        ? chars / lines < NARROW_MIN_CJK_CHARS_PER_LINE
        : words / lines < NARROW_MIN_WORDS_PER_LINE;
}

export interface HealthSearchOptions {
    /** Scale to search up to. */
    maxScale: number;
    /** Starting scale, also where the baseline is measured. */
    minScale?: number;
    tolerance?: number;
    coarseStep?: number;
    resolution?: number;
    /** Apply `scale` to the page and measure it. */
    healthAt: (scale: number) => HealthSample;
}

export interface HealthSearchResult {
    scale: number;
    baseline: HealthSample;
    /** Measurement at `scale`. */
    final: HealthSample;
    stopReason: HealthStopReason;
    /** Number of `healthAt` calls (= page reflows). */
    trials: number;
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;

function share(s: HealthSample, key: HealthProblem): number {
    return s.total > 0 ? s[key] / s.total : 0;
}

/** The problem that grew the most from the baseline to the failing layout. */
export function dominantProblem(
    baseline: HealthSample,
    failed: HealthSample,
): HealthProblem {
    const keys: HealthProblem[] = ["overflow", "overlap", "narrow"];
    let best: HealthProblem = "overflow";
    let bestDelta = Number.NEGATIVE_INFINITY;
    for (const key of keys) {
        const delta = share(failed, key) - share(baseline, key);
        if (delta > bestDelta) {
            best = key;
            bestDelta = delta;
        }
    }
    return best;
}

/**
 * Largest scale in [minScale, maxScale] whose health stays within
 * `tolerance` of the baseline.
 *
 * Walks up in `coarseStep` until the first unhealthy scale (like the
 * paper's walk, which also stops at the first failure — a page that heals
 * again at a larger scale is not trusted), then bisects between the last
 * healthy and first unhealthy scale down to `resolution`.
 */
export function searchHealthyScale({
    maxScale,
    minScale = 1,
    tolerance = HEALTH_TOLERANCE,
    coarseStep = HEALTH_COARSE_STEP,
    resolution = HEALTH_RESOLUTION,
    healthAt,
}: HealthSearchOptions): HealthSearchResult {
    const baseline = healthAt(minScale);
    let trials = 1;
    if (baseline.total <= 0 || !(maxScale > minScale)) {
        return {
            scale: minScale,
            baseline,
            final: baseline,
            stopReason: baseline.total <= 0 ? "empty" : "max",
            trials,
        };
    }
    const healthy = (s: HealthSample) =>
        baseline.health - s.health <= tolerance + 1e-9;

    let good = minScale;
    let goodSample = baseline;
    let bad: number | null = null;
    let badSample: HealthSample = baseline;

    for (let i = 1; ; i++) {
        const scale = round3(Math.min(minScale + i * coarseStep, maxScale));
        if (scale <= good) break;
        const sample = healthAt(scale);
        trials++;
        if (!healthy(sample)) {
            bad = scale;
            badSample = sample;
            break;
        }
        good = scale;
        goodSample = sample;
        if (scale >= maxScale) break;
    }

    if (bad === null) {
        return {
            scale: good,
            baseline,
            final: goodSample,
            stopReason: "max",
            trials,
        };
    }

    let lo = good;
    let hi = bad;
    while (hi - lo > resolution + 1e-9) {
        const mid = round3(Math.round((lo + hi) / 2 / resolution) * resolution);
        if (mid <= lo || mid >= hi) break;
        const sample = healthAt(mid);
        trials++;
        if (healthy(sample)) {
            lo = mid;
            goodSample = sample;
        } else {
            hi = mid;
            badSample = sample;
        }
    }

    return {
        scale: lo,
        baseline,
        final: goodSample,
        stopReason: dominantProblem(baseline, badSample),
        trials,
    };
}

/* ------------------------------------------------------------------ */
/* DOM measurement                                                     */
/* ------------------------------------------------------------------ */

/** Subtrees whose text is not page reading content. */
const SKIP_TAGS = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "TEMPLATE",
    "TEXTAREA",
    "SELECT",
    "SVG",
    "IFRAME",
]);

/**
 * Measure page health now. Reads layout only — the caller applies the
 * trial scale first. One forced layout per call; the rest are cached reads.
 */
export function measurePageHealth(doc: Document = document): HealthSample {
    const body = doc.body;
    const html = doc.documentElement;
    if (!body || !html) return { ...EMPTY_SAMPLE };
    const view = doc.defaultView;
    const sx = view?.scrollX ?? 0;
    const sy = view?.scrollY ?? 0;
    const viewportWidth = html.clientWidth;
    // Only count overflow when the page itself scrolls sideways. Carousels
    // and clipped menus sit off-screen on purpose and do not scroll the page.
    const pageScrolls = html.scrollWidth > viewportWidth + 1;

    const walker = doc.createTreeWalker(
        body,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
        {
            acceptNode(node) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const el = node as Element;
                    if (SKIP_TAGS.has(el.tagName.toUpperCase()))
                        return NodeFilter.FILTER_REJECT;
                    if (isUniLensOverlayNode(el))
                        return NodeFilter.FILTER_REJECT;
                    return NodeFilter.FILTER_SKIP;
                }
                return node.nodeValue?.trim()
                    ? NodeFilter.FILTER_ACCEPT
                    : NodeFilter.FILTER_SKIP;
            },
        },
    );

    const range = doc.createRange();
    const rects: HealthRect[] = [];
    let total = 0;
    let overflow = 0;
    let narrow = 0;
    let seen = 0;

    for (
        let node = walker.nextNode();
        node && seen < HEALTH_MAX_TEXT_NODES;
        node = walker.nextNode()
    ) {
        seen++;
        range.selectNodeContents(node);
        const list = range.getClientRects();
        let nodeArea = 0;
        let lines = 0;
        for (const r of Array.from(list)) {
            if (r.width < 1 || r.height < 1) continue;
            lines++;
            const area = r.width * r.height;
            nodeArea += area;
            const left = r.left + sx;
            const right = r.right + sx;
            rects.push({ left, right, top: r.top + sy, bottom: r.bottom + sy });
            if (pageScrolls)
                overflow += outsideWidth(left, right, viewportWidth) * r.height;
        }
        if (lines === 0) continue;
        total += nodeArea;
        if (isNarrowWrap(textRunStats(node.nodeValue ?? "", lines)))
            narrow += nodeArea;
    }
    range.detach();

    return healthFromAreas({
        total,
        overflow,
        overlap: overlapArea(rects),
        narrow,
    });
}
