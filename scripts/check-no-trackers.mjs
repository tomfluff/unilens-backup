#!/usr/bin/env node
// Fails when a page we serve to participants could load Google Tag Manager: the
// SoftBank mirrors carry SoftBank's own GTM tag, and a study page must never report
// a participant's visit to a third party (#49). A tag is fine only when disabled the
// way the recruit mirror's landing page does it: the loader as
// <script type="text/plain" data-local-disabled="gtm">, the <noscript> iframe's
// address moved to data-src. Every other mention (a live <script>, an iframe src, a
// .js file) fails.
//
//   node scripts/check-no-trackers.mjs [DIR ...]
// With no DIR: every folder in frontend/ except softbank-mirror-1 (Kinjo's IR mirror,
// left to him in #49). The frozen study build runs it on its copy too (freeze.sh).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKIP = new Set(["softbank-mirror-1", "node_modules"]);
const TAG = /googletagmanager|\bGTM-[A-Z0-9]{4,}\b/gi;

/** an opening tag's attributes, names lower-cased: { name: value } */
function attrs(open) {
    const out = {};
    const body = open.replace(/^<[a-z]+/i, "").replace(/\/?>$/, "");
    for (const m of body.matchAll(
        /([^\s"'=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g,
    ))
        out[m[1].toLowerCase()] ??= m[2] ?? m[3] ?? m[4] ?? "";
    return out;
}

/** the places in one file where a GTM tag is live, as line numbers */
export function liveTags(text, isHtml) {
    if (!isHtml) return [...text.matchAll(TAG)].map((m) => lineOf(text, m.index));
    // Parts are blanked (lines kept) once judged; every mention left is live.
    const blank = (x) => x.replace(/[^\n]/g, " ");
    const out = [];
    const flag = (from, x) => {
        for (const m of x.matchAll(TAG)) out.push(lineOf(text, from + m.index));
    };
    // 1. scripts first (an HTML comment inside one is JavaScript, and runs): one is
    //    inert only when its own type attribute is text/plain; any other is judged
    //    whole, its src and its code
    let t = text.replace(
        /<script\b[^>]*>[\s\S]*?(?:<\/script\s*>|$)/gi,
        (el, at) => {
            const open = el.match(/^<script\b[^>]*>/i)[0];
            const type = (attrs(open).type ?? "").trim().toLowerCase();
            if (type !== "text/plain") flag(at, el);
            return blank(el);
        },
    );
    // 2. the disabled fallback only: an iframe marked data-local-disabled="gtm"
    //    inside <noscript>, its address in data-src and no src
    t = t.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript\s*>/gi, (ns) =>
        ns.replace(/<iframe\b[^>]*>/gi, (open) => {
            const a = attrs(open);
            return a["data-local-disabled"] === "gtm" && !("src" in a)
                ? blank(open)
                : open;
        }),
    );
    // 3. real HTML comments (outside scripts now)
    t = t.replace(/<!--[\s\S]*?-->/g, blank);
    flag(0, t);
    return out.sort((a, b) => a - b);
}

const lineOf = (text, i) => text.slice(0, i).split("\n").length;

function* files(dir) {
    for (const name of readdirSync(dir)) {
        if (SKIP.has(name)) continue;
        const p = join(dir, name);
        if (statSync(p).isDirectory()) yield* files(p);
        else if (/\.(html?|m?js)$/i.test(name)) yield p;
    }
}

function selfTest() {
    const live = [
        "<script>(function(){j.src='https://www.googletagmanager.com/gtm.js?id='+i})(window,document,'script','dataLayer','GTM-BMSW');</script>",
        '<noscript><iframe src="//www.googletagmanager.com/ns.html?id=GTM-BMSW"></iframe></noscript>',
        '<script async src="https://www.googletagmanager.com/gtag/js?id=G-X"></script>',
        // Codex's three (2026-11-23): data-type isn't type; a data-src outside the
        // disabled fallback can feed a loader; a legacy <!-- wrapper still runs
        '<script data-type="text/plain" src="https://www.googletagmanager.com/gtm.js?id=GTM-BMSW"></script>',
        '<div data-src="https://www.googletagmanager.com/gtm.js?id=GTM-BMSW"></div>',
        "<script><!--\nj.src='//www.googletagmanager.com/gtm.js?id=GTM-BMSW';\n//--></script>",
        '<noscript><iframe data-local-disabled="gtm" src="//www.googletagmanager.com/ns.html"></iframe></noscript>',
        '<iframe data-local-disabled="gtm" data-src="//www.googletagmanager.com/ns.html"></iframe>',
        "<script type=\"text/plain\"></script><script>gtm('GTM-BMSW')</script>",
    ];
    const off = [
        '<script type="text/plain" data-local-disabled="gtm">j.src="//www.googletagmanager.com/gtm.js?id=GTM-BMSW"</script>',
        '<noscript><iframe data-local-disabled="gtm" data-src="//www.googletagmanager.com/ns.html?id=GTM-BMSW"></iframe></noscript>',
        "<!-- Google Tag Manager: GTM-BMSW -->",
        "<SCRIPT TYPE='TEXT/PLAIN'>gtm('GTM-BMSW')</SCRIPT>",
    ];
    for (const s of live)
        if (!liveTags(s, true).length) throw new Error(`self-test missed: ${s}`);
    for (const s of off)
        if (liveTags(s, true).length) throw new Error(`self-test flagged: ${s}`);
    if (!liveTags("x='googletagmanager.com'", false).length)
        throw new Error("self-test missed a .js mention");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    selfTest();
    const front = join(ROOT, "frontend");
    const dirs = process.argv.slice(2).length
        ? process.argv.slice(2)
        : readdirSync(front)
              .filter((d) => !SKIP.has(d) && statSync(join(front, d)).isDirectory())
              .map((d) => join(front, d));
    let bad = 0;
    let seen = 0;
    for (const dir of dirs)
        for (const f of files(dir)) {
            seen++;
            const lines = liveTags(readFileSync(f, "utf8"), /\.html?$/i.test(f));
            for (const n of new Set(lines)) {
                bad++;
                console.error(`live Google Tag Manager tag: ${relative(process.cwd(), f)}:${n}`);
            }
        }
    if (bad) {
        console.error(
            `${bad} live tag(s). Disable each as the recruit mirror does (#49): ` +
                'the loader as <script type="text/plain" data-local-disabled="gtm">, ' +
                "the iframe's src as data-src.",
        );
        process.exit(1);
    }
    console.log(`No live Google Tag Manager tag in ${seen} files (${dirs.length} folders).`);
}
