/**
 * Evidence in chat. Answers cite the page elements they drew on as `[[n12]]`
 * markers right after each claim (backend EVIDENCE_RULES); ids name inventory
 * nodes. This module turns a reply into bubble HTML with numbered chips and the
 * cited id list, gives TTS a marker-free text, and reads the short navigation
 * commands a user can type instead of clicking ("next", "show the second one").
 */

const MARKER = /\s?\[\[(n\d{1,5})\]\]/g;
/** an unfinished marker at the end of a streaming reply stays hidden until it completes */
const PARTIAL = /\s?\[(\[(n\d{0,5}(\](?!\]))?)?)?$/;
/** several ids in one marker, as Gemini writes them: [[n42], [n43]] or [[n42, n43]] */
const JOINED = /\[\[(n\d{1,5}(?:\]?\s*,\s*\[?n\d{1,5})+)\]\]/g;
/** ...and one still streaming in: [[n42], [n4 */
const PARTIAL_JOINED = /\s?\[\[n\d{1,5}\]?(?:\s*,\s*\[?(?:n\d{0,5}\]?)?)+$/;

/** a joined marker as one marker per id, the form everything else reads */
export const unjoin = (text: string) =>
    text.replace(JOINED, (_, ids: string) =>
        (ids.match(/n\d{1,5}/g) ?? []).map((id) => `[[${id}]]`).join(" "),
    );
/** placeholder that survives the markdown pass; a private-use char, stripped from model text first */
const SLOT = /\uE0FF(\d+)\uE0FF/g;
/** an open no-wrap group (a phrase's last word) that the next number closes */
const GROUP = "\uE0FC";
const GROUPED_SLOT = /(\uE0FC)?(\uE0FF\d+\uE0FF(?:\s?\uE0FF\d+\uE0FF)*)/g;
/** a supported phrase's ends, `{{` and `}}` in model text, kept through the markdown pass */
const OPEN = "\uE0FE";
const CLOSE = "\uE0FD";
/** `{{phrase}}` right before a citation (after its marker became a slot) */
const PHRASE = /\{\{([^{}\n]*?)\}\}(?=\s?\uE0FF\d+\uE0FF)/g;
/** where the fallback phrase stops looking back: a clause's punctuation */
const CLAUSE_END = /[!?。！？、，;；:：]|[.,](?!\d)|(?<!\d)[.,]/g;

const escapeHtml = (s: string) =>
    s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

/**
 * Minimal markdown for a 340px chat bubble: bold, inline code, dash bullets,
 * headings flattened to bold. HTML is escaped BEFORE any transform, so the
 * only tags in the output are ones we emit ourselves.
 */
export function mdLite(text: string): string {
    return escapeHtml(text)
        .replace(/^#{1,4} (.+)$/gm, "<b>$1</b>")
        .replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>")
        .replace(
            /`([^`\n]+)`/g,
            '<code style="background:rgba(255,255,255,0.12);border-radius:3px;padding:0 4px">$1</code>',
        )
        .replace(/^[-*] (.+)$/gm, "• $1");
}

export interface Cited {
    /** bubble HTML: markdown-lite plus one numbered chip button per citation */
    html: string;
    /** cited ids in first-citation order; chip n is ids[n - 1] */
    ids: string[];
}

/**
 * Render a reply. Markers whose id `known` rejects are dropped (a model can invent an
 * id; the backend strips them from history but a stream arrives unfiltered).
 */
export function renderCited(
    text: string,
    known: (id: string) => boolean,
    labelOf: (id: string) => string,
    streaming = false,
    /** the chip's accessible name, in the chat's language */
    nameOf: (n: number, label: string) => string = (n, label) =>
        `Evidence ${n}: ${label}`,
    /** what the chip shows: the number, or a code such as "U1" */
    chipText: (n: number) => string = String,
    /** underline the words each citation supports ("Associate response text") */
    phrases = false,
): Cited {
    let t = unjoin(text.replace(/[\uE0FC-\uE0FF]/g, ""));
    if (streaming) t = t.replace(PARTIAL_JOINED, "").replace(PARTIAL, "");
    const ids: string[] = [];
    t = t.replace(MARKER, (m, id: string) => {
        if (!known(id)) return "";
        let n = ids.indexOf(id) + 1;
        if (!n) n = ids.push(id);
        return `${m.startsWith("[") ? "" : " "}\uE0FF${n}\uE0FF`;
    });
    // the model marks the fewest words a citation supports as {{...}} before its marker
    t = t.replace(PHRASE, phrases ? `${OPEN}$1${CLOSE}` : "$1");
    // braces not before a citation, and a half-written `{{` while it streams, never show
    t = t.replace(/\{\{|\}\}/g, "");
    // mid-stream, a lone brace at the end is half of one: it waits for the other
    if (streaming) t = t.replace(/[{}]$/, "");
    if (phrases) t = markFallbackPhrases(t);
    const html = mdLite(t)
        .replace(
            // the space before the number goes: the underline runs straight into it
            /\uE0FE([^\uE0FE\uE0FD]*)\uE0FD\s?(?=\uE0FF(\d+)\uE0FF)/g,
            (_, words: string, n: string) =>
                phraseHtml(words, ids[Number(n) - 1]),
        )
        .replace(/[\uE0FE\uE0FD]/g, "")
        .replace(
            GROUPED_SLOT,
            (_, grouped: string | undefined, run: string) => {
                // each number as its chip, the spacing between them as the model wrote it
                const chips = run.replace(SLOT, (__, n: string) => {
                    const id = ids[Number(n) - 1];
                    const raw = labelOf(id);
                    const label = escapeHtml(raw);
                    const name = escapeHtml(nameOf(Number(n), raw));
                    return `<button type="button" class="unilens-cite" data-cite="${id}" aria-label="${name}" title="${label}">${escapeHtml(chipText(Number(n)))}</button>`;
                });
                // after underlined words, the numbers (side by side ones too) close their
                // no-wrap group, so none starts a line alone
                return grouped ? `${chips}</span>` : chips;
            },
        );
    return { html, ids };
}

/**
 * The underlined words of a citation. Their last word and the number that follows
 * stay on one line (the number never starts a line alone): the words split in two
 * spans, the second opening a no-wrap group the number's slot closes.
 */
function phraseHtml(words: string, id: string): string {
    const span = (w: string) =>
        `<span class="unilens-cite-text" data-cite="${id}">${w}</span>`;
    const end = (w: string) =>
        `<span class="unilens-cite-end">${span(w)}${GROUP}`;
    // markup inside (bold, code) keeps the phrase whole: it goes into the group as is
    if (words.includes("<")) return end(words);
    // the last word as the word segmenter finds it, so no word, emoji or CJK run is
    // cut; a phrase with no word in it stays whole
    const segments = [
        ...new Intl.Segmenter(undefined, { granularity: "word" }).segment(
            words,
        ),
    ];
    const last = segments.findLast((w) => w.isWordLike);
    const cut = last?.index ?? 0;
    const head = words.slice(0, cut);
    return `${head ? span(head) : ""}${end(words.slice(cut))}`;
}

/**
 * A citation the model gave no phrase: underline the last words before it (at most
 * four, never past the clause's punctuation or the previous citation), so every
 * citation has words to point at. Words are found by the browser's word segmenter,
 * which also splits Japanese.
 */
function markFallbackPhrases(t: string, max = 4): string {
    let out = "";
    let from = 0;
    for (const m of t.matchAll(SLOT)) {
        const at = m.index ?? 0;
        let before = t.slice(from, at);
        if (!before.trimEnd().endsWith(CLOSE)) {
            const trimmed = before.replace(/\s+$/, "");
            // the clause the citation closes: back to its punctuation, or a phrase end
            let start = 0;
            for (const c of trimmed.matchAll(CLAUSE_END))
                if ((c.index ?? 0) < trimmed.length - 1)
                    start = (c.index ?? 0) + 1;
            start = Math.max(start, trimmed.lastIndexOf(CLOSE) + 1);
            const clause = trimmed.slice(start);
            const words = [
                ...new Intl.Segmenter(undefined, {
                    granularity: "word",
                }).segment(clause),
            ].filter((w) => w.isWordLike);
            if (words.length) {
                const first =
                    start + words[Math.max(0, words.length - max)].index;
                before = `${trimmed.slice(0, first)}${OPEN}${trimmed.slice(first)}${CLOSE}${before.slice(trimmed.length)}`;
            }
        }
        out += before + m[0];
        from = at + m[0].length;
    }
    return out + t.slice(from);
}

/**
 * Chosen sources as a question sends them: each by its id in `registry`, the capture
 * the question goes with, found by its element. That capture can be newer than the
 * answer the sources came from (choosing one moves the page, so the question takes a
 * fresh capture), and its ids are not the answer's. A source it does not hold goes by
 * its label alone; an item with no element (a place) goes as it is.
 */
export function sourcesIn(
    items: { id?: string; label: string; el?: Element }[],
    registry: Map<string, Element> | undefined,
): { id?: string; label: string }[] {
    return items.map(({ id, label, el }) => {
        if (!el) return id ? { id, label } : { label };
        const now = registry
            ? [...registry].find(([, e]) => e === el)?.[0]
            : undefined;
        return now ? { id: now, label } : { label };
    });
}

/** the reply as it should be read aloud or copied: no markers, no phrase braces */
export const speakable = (text: string) =>
    unjoin(text)
        .replace(MARKER, "")
        .replace(/\{\{|\}\}/g, "");

export type NavCommand =
    | { kind: "next" }
    | { kind: "prev" }
    /** return to where the user was before the latest move to evidence */
    | { kind: "return" }
    /** go to where the user last clicked to ask */
    | { kind: "place" }
    | { kind: "all" }
    | { kind: "clear" }
    | { kind: "nth"; n: number };

const ORDINALS: Record<string, number> = {
    first: 1,
    second: 2,
    third: 3,
    fourth: 4,
    fifth: 5,
    "1st": 1,
    "2nd": 2,
    "3rd": 3,
    "4th": 4,
    "5th": 5,
};

/**
 * A whole message that only steers the evidence of the last answer. Handled locally:
 * instant, free, and no model can mis-hear "next". Anything longer goes to the model.
 * ponytail: English phrases only; extend the table when participants use others.
 */
export function navCommand(message: string): NavCommand | null {
    const m = message
        .trim()
        .toLowerCase()
        .replace(/[.!?。]+$/, "");
    const show = "(?:show |highlight |go to )?(?:me )?(?:the )?";
    if (new RegExp(`^${show}next(?: one)?$`).test(m)) return { kind: "next" };
    if (
        /^(?:go |take me )?(?:back )?to (?:where i (?:clicked|asked)|my click)$|^where i (?:clicked|asked)$|^my click$|^クリックした(?:場所|所|ところ)(?:へ|に)?(?:戻る|行く)?$/.test(
            m,
        )
    )
        return { kind: "place" };
    // "back" returns the view to where the user was; "previous" steps the evidence
    if (
        /^(?:go )?back(?: to where i was)?$|^return$|^戻る$|^戻って$|^もどる$/.test(
            m,
        )
    )
        return { kind: "return" };
    if (new RegExp(`^${show}(?:prev|previous|last one)(?: one)?$`).test(m))
        return { kind: "prev" };
    if (/^(?:show |highlight )?(?:me )?(?:them )?all(?: of them)?$/.test(m))
        return { kind: "all" };
    if (/^(?:clear|hide)(?: (?:the )?highlights?)?$/.test(m))
        return { kind: "clear" };
    const nth = new RegExp(
        `^${show}(?:number |#)?(first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th|\\d{1,2})(?: one)?$`,
    ).exec(m);
    if (nth) return { kind: "nth", n: ORDINALS[nth[1]] ?? Number(nth[1]) };
    return null;
}

/**
 * The user asked to find or see something: under autoHighlight "where", only these
 * answers outline their evidence on arrival.
 * ponytail: keyword heuristic (English + a few Japanese forms); a model-side signal
 * is the upgrade if it misfires in sessions.
 */
export const asksToLocate = (message: string) =>
    /\b(where|show|find|locate|point|highlight|which (?:one|button|link|part|section))\b|どこ|見せ|表示|探し/i.test(
        message,
    );

/** the last answer's citations, for the debug panel */
export interface EvidenceDebug {
    ids: string[];
    labels: string[];
    dropped: number;
    at: number;
}
let lastEvidence: EvidenceDebug | null = null;
export const getLastEvidenceDebug = () => lastEvidence;
export function recordEvidence(
    text: string,
    ids: string[],
    labelOf: (id: string) => string,
) {
    const cited = [...unjoin(text).matchAll(MARKER)].map((m) => m[1]);
    lastEvidence = {
        ids,
        labels: ids.map(labelOf),
        dropped: cited.filter((id) => !ids.includes(id)).length,
        at: Date.now(),
    };
}
