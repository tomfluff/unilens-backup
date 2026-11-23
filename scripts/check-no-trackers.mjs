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
// With no DIR: all of frontend/ (its root files too: the study pages' shared template)
// except softbank-mirror-1 (Kinjo's IR mirror, left to him in #49). The frozen study build runs it on its copy too (freeze.sh).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "parse5";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKIP = new Set(["softbank-mirror-1", "node_modules"]);
const TAG = /googletagmanager|\bGTM-[A-Z0-9]{4,}\b/gi;

/**
 * The places in one file where a GTM tag is live, as line numbers. An HTML page is
 * parsed as a browser parses it (parse5, the parser jsdom uses), so comments, script
 * bodies and attribute values (character references decoded) are what the browser
 * sees. <noscript> is parsed as markup, as a browser with JavaScript off does.
 * - A <script> is inert only when its own type attribute is text/plain; any other
 *   is judged on its attributes and its code (a legacy <!-- wrapper included).
 * - The disabled fallback: in an <iframe data-local-disabled="gtm"> inside
 *   <noscript>, with no src, only data-src may hold the address.
 * - Every other element's attributes are judged, and <style> text; comments and
 *   page text load nothing.
 */
export function liveTags(text, isHtml) {
    if (!isHtml) return [...text.matchAll(TAG)].map((m) => lineOf(text, m.index));
    const doc = parse(text, { scriptingEnabled: false, sourceCodeLocationInfo: true });
    const out = [];
    const has = (v) => TAG.test(v) && ((TAG.lastIndex = 0), true);
    const walk = (node, inNoscript) => {
        const name = node.tagName;
        if (name) {
            const at = Object.fromEntries(node.attrs.map((a) => [a.name, a.value]));
            const where = node.sourceCodeLocation;
            const line = (attr) =>
                where?.attrs?.[attr]?.startLine ?? where?.startLine ?? 0;
            const inert = name === "script" && (at.type ?? "").trim().toLowerCase() === "text/plain";
            if (inert) return;
            const fallback =
                name === "iframe" &&
                inNoscript &&
                at["data-local-disabled"] === "gtm" &&
                !("src" in at);
            for (const a of node.attrs)
                if (!(fallback && a.name === "data-src") && has(a.value)) out.push(line(a.name));
            if (name === "script" || name === "style")
                for (const c of node.childNodes)
                    if (c.nodeName === "#text" && has(c.value))
                        for (const m of c.value.matchAll(TAG))
                            out.push(
                                (c.sourceCodeLocation?.startLine ?? where?.startLine ?? 0) +
                                    c.value.slice(0, m.index).split("\n").length -
                                    1,
                            );
        }
        const kids = name === "template" ? node.content.childNodes : node.childNodes;
        for (const c of kids ?? []) walk(c, inNoscript || name === "noscript");
    };
    walk(doc, false);
    return out.sort((a, b) => a - b);
}

const lineOf = (text, i) => text.slice(0, i).split("\n").length;

function* files(dir) {
    if (!statSync(dir).isDirectory()) {
        if (/\.(html?|m?js)$/i.test(dir)) yield dir;
        return;
    }
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
        // Codex's second pass: a comment mentioning a script doesn't hide the next
        // real one; a marked iframe's other attributes are still judged
        '<!-- <script type="text/plain"> --><script>gtm("GTM-BMSW")</script>',
        '<noscript><iframe data-local-disabled="gtm" srcdoc="<script src=//www.googletagmanager.com/gtm.js></script>"></iframe></noscript>',
        // and its third: a script opener quoted in an attribute isn't a script; an
        // address written with character references is what the browser fetches
        '<div title="<script type=text/plain>"></div><script>gtm("GTM-BMSW")</script>',
        '<script src="https://www.googletag&#109;anager.com/gtm.js"></script>',
        '<style>@import url("https://www.googletagmanager.com/x.css");</style>',
    ];
    const off = [
        '<script type="text/plain" data-local-disabled="gtm">j.src="//www.googletagmanager.com/gtm.js?id=GTM-BMSW"</script>',
        '<noscript><iframe data-local-disabled="gtm" data-src="//www.googletagmanager.com/ns.html?id=GTM-BMSW"></iframe></noscript>',
        "<!-- Google Tag Manager: GTM-BMSW -->",
        "<SCRIPT TYPE='TEXT/PLAIN'>gtm('GTM-BMSW')</SCRIPT>",
        "<!-- <script>gtm('GTM-BMSW')</script> -->",
    ];
    // in a body, where the mirrors have them (a <noscript> in <head> can't hold an
    // iframe, so a parser moves it out)
    const page = (s) => `<!doctype html><html><head></head><body>${s}</body></html>`;
    for (const s of live)
        if (!liveTags(page(s), true).length) throw new Error(`self-test missed: ${s}`);
    for (const s of off)
        if (liveTags(page(s), true).length) throw new Error(`self-test flagged: ${s}`);
    if (!liveTags("x='googletagmanager.com'", false).length)
        throw new Error("self-test missed a .js mention");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    selfTest();
    const front = join(ROOT, "frontend");
    const dirs = process.argv.slice(2).length
        ? process.argv.slice(2)
        : readdirSync(front)
              .filter((d) => !SKIP.has(d))
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
    console.log(`No live Google Tag Manager tag in ${seen} files.`);
}
