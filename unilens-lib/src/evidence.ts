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
/** placeholder that survives the markdown pass; a private-use char, stripped from model text first */
const SLOT = /\uE0FF(\d+)\uE0FF/g;

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
): Cited {
    let t = text.replace(/\uE0FF/g, "");
    if (streaming) t = t.replace(PARTIAL, "");
    const ids: string[] = [];
    t = t.replace(MARKER, (m, id: string) => {
        if (!known(id)) return "";
        let n = ids.indexOf(id) + 1;
        if (!n) n = ids.push(id);
        return `${m.startsWith("[") ? "" : " "}\uE0FF${n}\uE0FF`;
    });
    const html = mdLite(t).replace(SLOT, (_, n: string) => {
        const id = ids[Number(n) - 1];
        const label = escapeHtml(labelOf(id));
        return `<button type="button" class="unilens-cite" data-cite="${id}" aria-label="Evidence ${n}: ${label}" title="${label}">${n}</button>`;
    });
    return { html, ids };
}

/** the reply as it should be read aloud or copied: no markers */
export const speakable = (text: string) => text.replace(MARKER, "");

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
    const cited = [...text.matchAll(MARKER)].map((m) => m[1]);
    lastEvidence = {
        ids,
        labels: ids.map(labelOf),
        dropped: cited.filter((id) => !ids.includes(id)).length,
        at: Date.now(),
    };
}
