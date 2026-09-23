import { beforeEach, describe, expect, it } from "vitest";
import {
    buildInventory,
    type InventoryOptions,
    inventoryOptionsFrom,
    labelOf,
    labelOfWire,
    type Measure,
    roleOf,
} from "./inventory";
import { getSettings } from "./settings";

// jsdom has no layout: every element's box comes from a stub keyed by data-box="x,y,w,h"
// (client px); elements without one are given a small box below the last one so the
// walk sees non-zero areas in document order.
const measure: Measure = (el) => {
    const b = el.getAttribute("data-box");
    if (b) {
        const [x, y, w, h] = b.split(",").map(Number);
        return { x, y, width: w, height: h };
    }
    const i = Array.from(document.querySelectorAll("*")).indexOf(el);
    return { x: 0, y: i * 20, width: 200, height: 18 };
};

const OPTS: InventoryOptions = {
    maxDepth: 12,
    summaryDepth: 2,
    summaryCap: 160,
    maxBytes: 200_000,
    maxNodes: 900,
    viewport: { w: 800, h: 600 },
};

const build = (html: string, opts: Partial<InventoryOptions> = {}) => {
    document.body.innerHTML = html;
    return buildInventory(document.body, { ...OPTS, ...opts }, measure);
};
const byName = (inv: ReturnType<typeof build>, name: string) =>
    inv.nodes.find((n) => n.name === name);

beforeEach(() => {
    document.body.innerHTML = "";
});

describe("roleOf", () => {
    it("maps every row of the role table, first match wins", () => {
        document.body.innerHTML = `
      <button id="b">B</button>
      <input id="s" type="submit" value="Go">
      <div id="rb" role="button">RB</div>
      <a id="l" href="#">L</a>
      <a id="nl">no href</a>
      <input id="t" type="text">
      <select id="sel"></select>
      <div id="ce" contenteditable="true"></div>
      <h2 id="h">H</h2>
      <div id="rh" role="heading">RH</div>
      <nav id="n"></nav>
      <div id="rr" role="region"></div>
      <div id="ti" tabindex="0">focusable</div>
      <span id="plain">text</span>`;
        const r = (id: string) =>
            roleOf(document.getElementById(id) as Element);
        expect(r("b")).toBe("button");
        expect(r("s")).toBe("button");
        expect(r("rb")).toBe("button");
        expect(r("l")).toBe("link");
        expect(r("nl")).toBeNull();
        expect(r("t")).toBe("input");
        expect(r("sel")).toBe("input");
        expect(r("ce")).toBe("input");
        expect(r("h")).toBe("heading");
        expect(r("rh")).toBe("heading");
        expect(r("n")).toBe("landmark");
        expect(r("rr")).toBe("landmark");
        expect(r("ti")).toBe("button");
        expect(r("plain")).toBeNull();
    });
});

describe("buildInventory: names", () => {
    it("takes own text, then aria-labelledby, aria-label, label-for, alt, title, placeholder", () => {
        const inv = build(`
      <p>Own text</p>
      <span id="lbl">Labelled by</span><div aria-labelledby="lbl"><i></i><i></i></div>
      <button aria-label="Search">⌕</button>
      <label for="em">Email</label><input id="em" type="email" value="secret@example.com">
      <img alt="Company logo">
      <a href="#" title="Docs link"></a>
      <input type="text" placeholder="Your name">`);
        for (const n of [
            "Own text",
            "Labelled by",
            "Search",
            "Email",
            "Company logo",
            "Docs link",
            "Your name",
        ])
            expect(byName(inv, n), n).toBeDefined();
    });

    it("gives links, buttons and headings name-from-content and merges the covered leaf", () => {
        const inv = build(`<a href="#"><span>Apply</span></a>`);
        const link = byName(inv, "Apply");
        expect(link?.role).toBe("link");
        expect(inv.nodes.filter((n) => n.name === "Apply")).toHaveLength(1);
    });

    it("never reads a field's value or contents", () => {
        const inv = build(`
      <label for="q">Query</label><input id="q" type="text" value="typed secret">
      <textarea aria-label="Message">draft body</textarea>
      <div contenteditable="true" aria-label="Note">private note</div>`);
        const json = JSON.stringify(inv.wire);
        expect(json).not.toContain("typed secret");
        expect(json).not.toContain("draft body");
        expect(json).not.toContain("private note");
        expect(byName(inv, "Query")).toBeDefined();
        expect(byName(inv, "Message")).toBeDefined();
        expect(byName(inv, "Note")).toBeDefined();
    });
});

describe("buildInventory: skipping and structure", () => {
    it("never walks password, hidden, aria-hidden, inert, script/style/template", () => {
        const inv = build(`
      <input type="password" aria-label="Password">
      <input type="hidden" aria-label="Token">
      <div aria-hidden="true"><p>hidden text</p></div>
      <div inert><p>inert text</p></div>
      <script>var x = "script text";</script>
      <style>.a{}</style>
      <template><p>template text</p></template>
      <p>kept</p>`);
        const json = JSON.stringify(inv.wire);
        for (const s of [
            "Password",
            "Token",
            "hidden text",
            "inert text",
            "script text",
            "template text",
        ])
            expect(json).not.toContain(s);
        expect(byName(inv, "kept")).toBeDefined();
    });

    it("drops display:none and visibility:hidden subtrees, keeps off-screen with v:0", () => {
        const inv = build(`
      <p style="display:none">gone</p>
      <p style="visibility:hidden">also gone</p>
      <p data-box="0,5000,200,18">below the fold</p>
      <p data-box="0,10,200,18">in view</p>`);
        expect(byName(inv, "gone")).toBeUndefined();
        expect(byName(inv, "also gone")).toBeUndefined();
        expect(byName(inv, "below the fold")?.visible).toBe(false);
        expect(byName(inv, "in view")?.visible).toBe(true);
        expect(inv.wire.find((w) => w.n === "below the fold")?.v).toBe(0);
    });

    it("emits a container only for landmarks, headings, labelled or forking ancestors", () => {
        const inv = build(`
      <div id="chain"><div><div><p>deep</p></div></div></div>
      <div id="fork"><p>left</p><p>right</p></div>
      <div id="labelled" aria-label="Plans"><p>one</p></div>
      <nav><a href="#">Home</a></nav>`);
        const roles = inv.nodes.map((n) => n.role);
        // body itself forks (chain, fork, labelled, nav) and is the root container
        expect(inv.nodes[0].parentId).toBeNull();
        expect(byName(inv, "deep")?.parentId).toBe(inv.nodes[0].id); // chain collapsed
        const fork = inv.nodes.find(
            (n) =>
                n.role === "container" &&
                n.id === byName(inv, "left")?.parentId,
        );
        expect(fork).toBeDefined();
        expect(byName(inv, "Plans")?.role).toBe("container");
        expect(byName(inv, "Home")?.parentId).toBe(
            inv.nodes.find((n) => n.role === "landmark")?.id,
        );
        expect(roles.filter((r) => r === "container").length).toBe(3); // body, fork, labelled
    });

    it("assigns sequential pre-order ids whose parentId is always already emitted", () => {
        const inv = build(
            `<nav><a href="#">A</a><a href="#">B</a></nav><h1>T</h1>`,
        );
        inv.nodes.forEach((n, i) => {
            expect(n.id).toBe(`n${i}`);
            if (n.parentId) expect(Number(n.parentId.slice(1))).toBeLessThan(i);
        });
        expect(inv.registry.size).toBe(inv.nodes.length);
        expect(inv.registry.get("n0")).toBe(document.body);
    });

    it("caps depth on the emitted tree, not on DOM nesting", () => {
        // real pages wrap content 15-20 divs deep; collapsed wrappers must not count
        const wrapped = build(
            `<div><div><div><div><div><p>deep</p></div></div></div></div></div>`,
            { maxDepth: 1 },
        );
        expect(byName(wrapped, "deep")).toBeDefined();
        const nested = build(
            `<nav aria-label="Outer"><section aria-label="Inner"><p>x</p><p>y</p></section><a href="#">z</a></nav>`,
            { maxDepth: 2 },
        );
        expect(byName(nested, "Outer")).toBeDefined(); // level 1
        expect(byName(nested, "Inner")).toBeDefined(); // level 2
        expect(byName(nested, "z")).toBeDefined(); // level 2
        expect(byName(nested, "x")).toBeUndefined(); // level 3
    });

    it("adds an additive region summary on regions at or above summaryDepth", () => {
        const inv = build(
            `<section aria-label="Pricing"><h2>Basic</h2><span>¥980</span><button>Choose</button></section>`,
            { summaryDepth: 1 },
        );
        const region = byName(inv, "Pricing");
        expect(region?.text).toContain("Basic");
        expect(region?.text).toContain("¥980");
        expect(region?.text).toContain("Choose");
        expect(byName(inv, "¥980")).toBeDefined(); // leaf kept, summary is additive
        // depth is the inventory tree's: wrapper divs collapse and do not count
        const wrapped = build(
            `<div><div><section aria-label="Top"><p>x</p><p>y</p></section></div></div>`,
            { summaryDepth: 1 },
        );
        expect(byName(wrapped, "Top")?.text).toContain("x");
        const deeper = build(
            `<nav aria-label="Outer"><section aria-label="Deep"><p>x</p><p>y</p></section><a href="#">z</a></nav>`,
            { summaryDepth: 1 },
        );
        expect(byName(deeper, "Outer")?.text).toContain("z");
        expect(byName(deeper, "Deep")?.text).toBeUndefined();
    });

    it("records checked/expanded/disabled/selected state", () => {
        const inv = build(`
      <button aria-expanded="true">Menu</button>
      <button disabled>Off</button>
      <input type="checkbox" aria-label="Agree" checked>`);
        expect(byName(inv, "Menu")?.state).toBe("expanded");
        expect(byName(inv, "Off")?.state).toBe("disabled");
        expect(byName(inv, "Agree")?.state).toBe("checked");
    });

    it("emits only the root for an empty body", () => {
        const inv = build("");
        expect(inv.nodes).toHaveLength(1);
        expect(inv.nodes[0]).toMatchObject({
            id: "n0",
            role: "container",
            parentId: null,
        });
        expect(inv.truncated).toBe(0);
    });
});

describe("buildInventory: geometry", () => {
    it("converts both box corners to content space, so sizes shrink under zoom", () => {
        document.body.innerHTML = `<p data-box="200,100,300,60">zoomed</p>`;
        // page zoom 2 with the view panned to (40, 1000) in client px
        const inv = buildInventory(document.body, OPTS, measure, (x, y) => ({
            x: (x + 40) / 2,
            y: (y + 1000) / 2,
        }));
        expect(byName(inv, "zoomed")?.rect).toEqual({
            x: 120,
            y: 550,
            w: 150,
            h: 30,
        });
    });

    it("gives a box-less wrapper (display:contents) the union of its children", () => {
        document.body.innerHTML = `
      <ul><li data-box="0,0,0,0"><span data-box="50,400,20,30">※</span><span data-box="80,400,500,30">footnote</span></li>
      <li data-box="0,0,0,0"><span data-box="50,440,20,30">†</span><span data-box="80,440,500,30">other</span></li></ul>`;
        // the viewport origin maps to content (93, 8060): a 0x0 box must not land there
        const inv = buildInventory(document.body, OPTS, measure, (x, y) => ({
            x: x + 93,
            y: y + 8060,
        }));
        const li = inv.nodes.find(
            (n) =>
                n.role === "container" &&
                inv.nodes.some((c) => c.parentId === n.id && c.name === "※"),
        );
        expect(li?.rect).toEqual({ x: 143, y: 8460, w: 530, h: 30 });
        expect(li?.visible).toBe(true);
    });

    it("keeps a node with no box at all at 0x0 instead of the viewport corner", () => {
        document.body.innerHTML = `<div><span data-box="0,0,0,0">collapsed</span><p>x</p></div>`;
        const inv = buildInventory(document.body, OPTS, measure, (x, y) => ({
            x: x + 93,
            y: y + 8060,
        }));
        expect(byName(inv, "collapsed")?.rect).toEqual({
            x: 0,
            y: 0,
            w: 0,
            h: 0,
        });
        expect(byName(inv, "collapsed")?.visible).toBe(false);
    });
});

describe("buildInventory: budget guard", () => {
    const many = (n: number) =>
        Array.from(
            { length: n },
            (_, i) => `<p data-box="0,${i * 100},200,18">item ${i}</p>`,
        ).join("");

    it("drops the leaves farthest from the viewport centre first and counts them", () => {
        const inv = build(many(20), { maxNodes: 6 });
        expect(inv.nodes.length).toBeLessThanOrEqual(6);
        expect(inv.truncated).toBe(20 + 1 - inv.nodes.length);
        // centre is (400,300): the nearest items survive
        expect(byName(inv, "item 3")).toBeDefined();
        expect(byName(inv, "item 19")).toBeUndefined();
        expect(inv.registry.has("n20")).toBe(false);
    });

    it("respects maxBytes and never drops headings, landmarks or containers", () => {
        const inv = build(
            `<h1 data-box="0,9000,200,18">Far heading</h1>${many(30)}`,
            {
                maxBytes: 600,
            },
        );
        expect(inv.bytes).toBeLessThanOrEqual(600);
        expect(byName(inv, "Far heading")).toBeDefined();
        expect(inv.truncated).toBeGreaterThan(0);
    });

    it("holds the hard caps even when leaves alone cannot, without orphaning a node", () => {
        const sections = Array.from(
            { length: 30 },
            (_, i) =>
                `<section aria-label="S${i}" data-box="0,${i * 300},400,200"><h2 data-box="0,${i * 300},400,30">Heading ${i}</h2><p data-box="0,${i * 300 + 40},400,20">text ${i}</p><p data-box="0,${i * 300 + 70},400,20">more ${i}</p></section>`,
        ).join("");
        const inv = build(sections, { maxNodes: 20 });
        expect(inv.nodes.length).toBeLessThanOrEqual(20);
        const ids = new Set(inv.nodes.map((n) => n.id));
        for (const n of inv.nodes)
            if (n.parentId) expect(ids.has(n.parentId)).toBe(true);
        expect(inv.nodes[0].id).toBe("n0"); // the root is never dropped
        expect(inv.bytes).toBe(
            new TextEncoder().encode(JSON.stringify(inv.wire)).length,
        );
    });

    it("prunes a 3000-node page without quadratic re-serialisation", () => {
        const t0 = performance.now();
        const inv = build(many(3000), { maxNodes: 900 });
        expect(inv.nodes.length).toBeLessThanOrEqual(900);
        expect(performance.now() - t0).toBeLessThan(3000);
    });

    it("serialises with short keys and integer boxes", () => {
        const inv = build(`<a href="#" data-box="10.4,20.6,30.2,40.9">L</a>`);
        const w = inv.wire.find((x) => x.n === "L");
        expect(w).toMatchObject({ r: "link", n: "L", v: 1 });
        expect(w?.b).toEqual([10, 21, 30, 41]);
        expect(Object.keys(w ?? {}).sort()).toEqual([
            "b",
            "i",
            "n",
            "p",
            "r",
            "v",
        ]);
    });
});

describe("inventoryOptionsFrom", () => {
    it("maps every knob and the viewport; the store's defaults are valid options", () => {
        const opts = inventoryOptionsFrom(getSettings(), { w: 1024, h: 768 });
        expect(opts).toEqual({
            maxDepth: getSettings().inventoryMaxDepth,
            summaryDepth: getSettings().inventorySummaryDepth,
            summaryCap: getSettings().inventorySummaryCap,
            maxBytes: getSettings().inventoryMaxBytes,
            maxNodes: getSettings().inventoryMaxNodes,
            viewport: { w: 1024, h: 768 },
        });
        expect(opts.maxNodes).toBeLessThanOrEqual(1000); // OpenAI strict-mode enum cap
    });
});

describe("labelOf", () => {
    it("falls back name → region text → first named child → role", () => {
        const inv = build(
            `<section aria-label="Sec"><p>inner</p><p>more</p></section><div><p>a</p><p>b</p></div>`,
            { summaryDepth: 0 },
        );
        expect(labelOf(byName(inv, "Sec")?.id ?? "", inv)).toBe("Sec");
        const forkId = byName(inv, "a")?.parentId ?? "";
        expect(inv.nodes.find((n) => n.id === forkId)?.role).toBe("container");
        expect(labelOf(forkId, inv)).toBe("a");
        expect(labelOf("nope", inv)).toBe("nope");
        // the wire form gives the same answers
        expect(labelOfWire(byName(inv, "Sec")?.id ?? "", inv.wire)).toBe("Sec");
        expect(labelOfWire(forkId, inv.wire)).toBe("a");
        expect(labelOfWire("nope", inv.wire)).toBe("nope");
    });
});
