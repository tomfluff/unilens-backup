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

/** the assistant asks for a zoom (R1 of the 2026-09-27 report): into an element, a
 *  step in or out, or back to 100%. Acted on once the answer is complete */
const ZOOM = /\s?\[\[zoom:(n\d{1,5}|in|out|reset)\]\]/g;
/** ...and one still streaming in */
const PARTIAL_ZOOM = /\s?\[\[z(o(o(m(:[a-z0-9]*\]?)?)?)?)?$/;
export type ZoomAsk = { id: string } | { change: "in" | "out" | "reset" };
/** the zoom an answer asks for (its first), or null */
export function zoomAsked(text: string): ZoomAsk | null {
    const m = [...text.matchAll(ZOOM)][0];
    if (!m) return null;
    return m[1].startsWith("n")
        ? { id: m[1] }
        : { change: m[1] as "in" | "out" | "reset" };
}
/** zoom markers out of the text: one into an element is its source, as a citation */
const unzoom = (text: string) =>
    text.replace(ZOOM, (all, what: string) =>
        what.startsWith("n")
            ? `${all.startsWith("[") ? "" : " "}[[${what}]]`
            : "",
    );

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
    /** where the numbers go: where the model put them, at the end of each sentence,
     *  or all after the answer. Underlines need them where the model put them */
    placement: CitePlacement = "inline",
): Cited {
    let t = unjoin(unzoom(text.replace(/[\uE0FC-\uE0FF]/g, "")));
    if (streaming)
        t = t
            .replace(PARTIAL_ZOOM, "")
            .replace(PARTIAL_JOINED, "")
            .replace(PARTIAL, "");
    const ids: string[] = [];
    t = t.replace(MARKER, (m, id: string) => {
        if (!known(id)) return "";
        let n = ids.indexOf(id) + 1;
        if (!n) n = ids.push(id);
        return `${m.startsWith("[") ? "" : " "}\uE0FF${n}\uE0FF`;
    });
    // the numbers elsewhere than the model put them: no words are joined to them
    if (placement !== "inline") {
        phrases = false;
        t = placeSlots(t.replace(/\{\{|\}\}/g, ""), placement);
    }
    // the model marks the fewest words a citation supports as {{...}} before its marker
    t = t.replace(PHRASE, phrases ? `${OPEN}$1${CLOSE}` : "$1");
    // braces not before a citation, and a half-written `{{` while it streams, never show
    t = t.replace(/\{\{|\}\}/g, "");
    // mid-stream, a lone brace at the end is half of one: it waits for the other
    if (streaming) t = t.replace(/[{}]$/, "");
    if (phrases) t = markFallbackPhrases(t);
    const html = mdLite(t)
        .replace(
            // the space before the number goes: the number keeps its own gap (chatStyles)
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

export type CitePlacement = "inline" | "sentence" | "end";

/** a citation's slot with the spaces (not line breaks) around it */
const SPACED_SLOT = /[^\S\n]*\uE0FF(\d+)\uE0FF[^\S\n]*/g;
/** Japanese (and Chinese) text and its punctuation: no space between words */
const CJK = /[\u3000-\u30ff\u3400-\u9fff\uf900-\ufaff\uff00-\uffef]/;

/** what stays between the words on either side of a slot taken out: a space only
 *  where the model had one, and never in Japanese, before punctuation, or at a line's
 *  ends (「4,378円 [[n1]] なので」 becomes 「4,378円なので」) */
function gap(left: string, right: string, spaced: boolean): string {
    if (!spaced || !left || !right || left === "\n" || right === "\n")
        return "";
    if (right === "\uE0FF" || CJK.test(left) || CJK.test(right)) return "";
    return /[.,;:!?)\]}"'’”]/.test(right) ? "" : " ";
}
/** a sentence's end in an answer: its closing punctuation (a full stop before a
 *  space, the end, a closing quote or bracket or the end of bold, so not 3.5), with
 *  the quotes, brackets and bold marks that close after it; or a line break (a
 *  bullet, a heading, a paragraph) */
const SENTENCE_STOP =
    /(?:[.!?](?=\s|$|["'”’」』）)\]*])|[。！？])["'”’」』）)\]*]*|\n/g;

/**
 * Move the citation slots out of the sentences (Yotam, 2026-10-06: sources not in the
 * text, "at the end of the sentence or the end of the text"). "sentence": each
 * sentence's numbers, once each and in order, right after its closing punctuation (or
 * at the end of its line). A number the model gathered after a sentence stays with
 * that sentence, and one before any words goes with the sentence that follows.
 * "end": every number once, in order, on a line of its own after the answer.
 */
export function placeSlots(t: string, placement: "sentence" | "end"): string {
    const slots: { at: number; n: number }[] = [];
    let plain = "";
    let from = 0;
    for (const m of t.matchAll(SPACED_SLOT)) {
        plain += t.slice(from, m.index);
        slots.push({ at: plain.length, n: Number(m[1]) });
        from = (m.index ?? 0) + m[0].length;
        plain += gap(plain.slice(-1), t.charAt(from), /\s/.test(m[0]));
    }
    plain += t.slice(from);
    if (!slots.length) return t;
    const run = (ns: number[]) =>
        [...new Set(ns)]
            .sort((a, b) => a - b)
            .map((n) => `\uE0FF${n}\uE0FF`)
            .join(" ");
    if (placement === "end")
        return `${plain.trimEnd()}\n\n${run(slots.map((x) => x.n))}`;
    // each sentence's end: after its punctuation, or before its line break
    const ends = [...plain.matchAll(SENTENCE_STOP)].map((m) =>
        m[0] === "\n" ? (m.index ?? 0) : (m.index ?? 0) + m[0].length,
    );
    const textEnd = plain.trimEnd().length;
    const at = new Map<number, number[]>();
    for (const { at: i, n } of slots) {
        // gathered after a sentence (only spaces since its end): that sentence's
        const before = ends.findLast((e) => e <= i);
        const end =
            before !== undefined && !plain.slice(before, i).trim()
                ? before
                : Math.min(ends.find((e) => e >= i) ?? textEnd, textEnd);
        at.set(end, [...(at.get(end) ?? []), n]);
    }
    let out = "";
    let pos = 0;
    for (const end of [...at.keys()].sort((a, b) => a - b)) {
        out += plain.slice(pos, end) + run(at.get(end) ?? []);
        pos = end;
    }
    return out + plain.slice(pos);
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
 * which also splits Japanese. Several numbers gathered after a sentence's end get no
 * underline: which words each one supports cannot be told, and the last four words
 * would claim all of them (bug 5 of the 2026-09-27 report).
 */
function markFallbackPhrases(t: string, max = 4): string {
    let out = "";
    let from = 0;
    for (const m of t.matchAll(SLOT)) {
        const at = m.index ?? 0;
        let before = t.slice(from, at);
        const gathered =
            /^\s?\uE0FF\d+\uE0FF/.test(t.slice(at + m[0].length)) &&
            /[.!?。！？]["'」』）)]*\s*$/.test(before);
        if (!gathered && !before.trimEnd().endsWith(CLOSE)) {
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

/** where a sentence ends: its closing punctuation, then a space, the end, or (after
 *  Japanese punctuation) anything */
const SENTENCE_END = /[.!?](?=\s|$|["'」』）)])|[。！？]/g;

/**
 * Live's source numbers in a spoken reply (bug 4 of the 2026-09-27 report). Speech
 * cannot carry markers, so each goes where the model was when it pointed: `at`, the
 * reply's length then. It goes before the end of the sentence being said, or of the
 * next one when it pointed between sentences or before any words (the model often
 * points first, then speaks); the sentence that names the element, when one does.
 * Never before an earlier one: the numbers stay in the order it pointed, which is the
 * order the model is told.
 */
export function placeLiveMarkers(
    words: string,
    points: { id: string; at: number }[],
    labelOf: (id: string) => string,
): string {
    const ends = [...words.matchAll(SENTENCE_END)].map((m) => m.index ?? 0);
    // pointed after the last full sentence, and nothing said since: it belongs to that
    // sentence for now (Gemini's words run ahead of its voice, so they are often all
    // in when it points); it moves on if a next sentence begins
    const endFrom = (i: number) =>
        ends.find((e) => e >= i) ??
        (words.slice(i).trim() ? words.length : (ends.at(-1) ?? words.length));
    let last = 0;
    const at = points.map(({ id, at }) => {
        const name = labelOf(id);
        // where it names it, from the sentence it pointed in on: a sentence before
        // that one was said before it pointed
        const from = (ends.findLast((e) => e < at) ?? -1) + 1;
        const named = name.length >= 3 ? words.indexOf(name, from) : -1;
        const before = words.slice(0, at).trimEnd();
        const pos =
            named >= 0
                ? endFrom(named + name.length - 1)
                : !before || /[.!?。！？]["'」』）)]*$/.test(before)
                  ? endFrom(at)
                  : endFrom(at);
        last = Math.max(last, pos);
        return { id, pos: last };
    });
    let out = "";
    let from = 0;
    for (const { id, pos } of at) {
        out += `${words.slice(from, pos).trimEnd()} [[${id}]]`;
        from = pos;
    }
    return out + words.slice(from);
}

/** the reply as it should be read aloud or copied: no markers, no phrase braces */
export const speakable = (text: string) =>
    unjoin(unzoom(text))
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

/** Japanese numbers a participant may say or type for "the second one" */
const KANJI: Record<string, number> = {
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
    十: 10,
};
/** what may follow a Japanese "the second one", "next" or "all": to it, take me, go,
 *  show, highlight, please (spoken forms included: 連れてって) */
const JA_GO =
    "(?:の(?:もの|やつ|根拠|場所|ところ)?)?(?:に|へ|を|まで)?(?:連れて(?:行|い)?って|移動して|移動|行って|飛んで|見せて|表示して|ハイライトして)?(?:ください|下さい|お願いします)?";

/** the Japanese forms (co-design study 1: participants are likely Japanese) */
function navCommandJa(message: string): NavCommand | null {
    const m = message
        .normalize("NFKC")
        .replace(/\s+/g, "")
        .replace(/[.!?。！？]+$/, "");
    if (new RegExp(`^次${JA_GO}$`).test(m)) return { kind: "next" };
    if (new RegExp(`^前${JA_GO}$`).test(m)) return { kind: "prev" };
    if (new RegExp(`^(?:全部|すべて|全て)${JA_GO}$`).test(m))
        return { kind: "all" };
    if (/^(?:ハイライト|枠)を?(?:消して|消す)(?:ください|下さい)?$/.test(m))
        return { kind: "clear" };
    const nth = new RegExp(
        `^(?:その)?(\\d{1,2}|[一二三四五六七八九十])(?:番目|つ目|個目|番)${JA_GO}$`,
    ).exec(m);
    if (nth) return { kind: "nth", n: KANJI[nth[1]] ?? Number(nth[1]) };
    return null;
}

/**
 * A whole message that only steers the evidence of the last answer. Handled locally:
 * instant, free, and no model can mis-hear "next". Anything longer goes to the model.
 * ponytail: English and some Japanese phrases; extend the tables when participants
 * use others.
 */
export function navCommand(message: string): NavCommand | null {
    const ja = navCommandJa(message);
    if (ja) return ja;
    const m = message
        .trim()
        .toLowerCase()
        .replace(/[.!?。]+$/, "");
    const show =
        "(?:show |highlight |go to |take me to |bring me to |jump to |scroll to )?(?:me )?(?:the )?";
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
/** the user asks for a zoom (in, out, back to normal, bigger, smaller): the assistant
 *  zooms only then, whatever its answer or a page it quotes may say. A request, not
 *  the word: "what does zoom mean?" and a question quoting a marker are not one */
export const asksToZoom = (message: string) =>
    !/\[\[/.test(message) &&
    /\bzoom(ing)? ?(in|out|into|to|back|closer|on|it|that|this)\b|\b(enlarge|magnify|make (it|that|this|the page|them)( \w+)? (bigger|larger|smaller))\b|\b(bigger|larger|smaller|closer),? please\b|\bback to (normal|100 ?%)|拡大|縮小|ズーム|大きく|小さく|元の大きさ|等倍/i.test(
        message,
    );

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
