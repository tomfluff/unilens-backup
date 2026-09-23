/**
 * Page inventory — the DOM distilled into a tree of nodes the model can point at.
 *
 * Every node the model may name gets an id; the client keeps a registry id → Element
 * so an answer resolves to a live node. Design and evidence: the phase-1 design doc
 * ("Definitions") and docs/research/2026-09-19-phase1-research-probes.md.
 *
 *   body ─┬─ nav (landmark, region)            ← containers earn a node only if they are a
 *         │   ├─ a "Home" (link)                  landmark/heading/labelled, or fork into ≥2
 *         │   └─ button "Search" (aria-label)     branches that each hold a visible node
 *         ├─ h1 "Choose a plan" (heading)
 *         └─ section (region, t: "Basic ¥980 …")  ← region text is additive to the leaves
 *             ├─ h2 "Basic"
 *             ├─ span "¥980" (text)               ← text leaves are candidates: "where is the
 *             └─ button "Choose Basic"               price?" must be answerable
 *
 * Privacy (eng review T4): a form field is described by its label, never its value or
 * contents; password and hidden inputs, aria-hidden and inert subtrees are never walked.
 */

export type InventoryRole =
    | "button"
    | "link"
    | "input"
    | "heading"
    | "landmark"
    | "text"
    | "container";

export interface InventoryNode {
    id: string;
    role: InventoryRole;
    /** accessible name (own text, else label/aria/alt/title/placeholder), capped */
    name: string;
    /** content-space box, integer px */
    rect: { x: number; y: number; w: number; h: number };
    /** intersects the viewport at capture time; off-screen nodes are still sent */
    visible: boolean;
    /** region text summary, additive to the leaves beneath; regions only */
    text?: string;
    state?: string;
    parentId: string | null;
}

/** wire form: short keys and integer boxes — bytes are the budget */
export interface WireNode {
    i: string;
    r: InventoryRole;
    n: string;
    b: [number, number, number, number];
    v: 0 | 1;
    t?: string;
    s?: string;
    p?: string;
}

export interface InventoryOptions {
    /** deepest level of the emitted inventory tree (root is 0). Wrapper elements that
     * collapse away do not count: real pages nest their content 15-20 divs deep */
    maxDepth: number;
    /** regions at or above this inventory-tree depth carry a text summary */
    summaryDepth: number;
    /** max chars per name / summary */
    summaryCap: number;
    /** serialized-size budget; farthest-from-viewport leaves are dropped first */
    maxBytes: number;
    /** node budget; the locate schema's id enum must stay under the provider cap */
    maxNodes: number;
    /** client viewport size, for `visible` and for the budget guard's centre */
    viewport: { w: number; h: number };
}

/** the knobs, as capture.ts reads them; a pure mapping so the wiring is testable */
export function inventoryOptionsFrom(
    s: {
        inventoryMaxDepth: number;
        inventorySummaryDepth: number;
        inventorySummaryCap: number;
        inventoryMaxBytes: number;
        inventoryMaxNodes: number;
    },
    viewport: { w: number; h: number },
): InventoryOptions {
    return {
        maxDepth: s.inventoryMaxDepth,
        summaryDepth: s.inventorySummaryDepth,
        summaryCap: s.inventorySummaryCap,
        maxBytes: s.inventoryMaxBytes,
        maxNodes: s.inventoryMaxNodes,
        viewport,
    };
}

export interface Inventory {
    nodes: InventoryNode[];
    wire: WireNode[];
    registry: Map<string, Element>;
    /** number of nodes dropped by the budget guard */
    truncated: number;
    bytes: number;
}

/** client-space box of an element; injectable because jsdom has no layout */
export type Measure = (el: Element) => {
    x: number;
    y: number;
    width: number;
    height: number;
};
/** client → content space; capture.ts passes clientToContent, tests pass identity */
export type ToContent = (x: number, y: number) => { x: number; y: number };

export const defaultMeasure: Measure = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, width: r.width, height: r.height };
};
const identity: ToContent = (x, y) => ({ x, y });

const LANDMARK_TAGS = new Set([
    "nav",
    "main",
    "header",
    "footer",
    "aside",
    "form",
]);
const LANDMARK_ROLES = new Set([
    "navigation",
    "main",
    "banner",
    "contentinfo",
    "complementary",
    "region",
    "form",
    "search",
]);
const INPUT_TAGS = new Set(["input", "select", "textarea"]);
const SKIP_TAGS = new Set(["script", "style", "template", "noscript", "svg"]);
/** recursion guard only: the HTML parser nests at most 512 deep; the knob that shapes the
 * inventory is maxDepth, counted on the emitted tree */
const DOM_DEPTH_LIMIT = 256;

const collapse = (s: string | null | undefined) =>
    (s ?? "").replace(/\s+/g, " ").trim();
const cap = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}…` : s);

/** first match wins; null = not a candidate in its own right */
export function roleOf(el: Element): InventoryRole | null {
    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute("role");
    const type = (el.getAttribute("type") ?? "").toLowerCase();
    if (
        tag === "button" ||
        (tag === "input" && ["button", "submit", "reset"].includes(type)) ||
        role === "button"
    )
        return "button";
    if ((tag === "a" && el.hasAttribute("href")) || role === "link")
        return "link";
    if (INPUT_TAGS.has(tag) || el.hasAttribute("contenteditable"))
        return "input";
    if (/^h[1-6]$/.test(tag) || role === "heading") return "heading";
    if (LANDMARK_TAGS.has(tag) || (role !== null && LANDMARK_ROLES.has(role)))
        return "landmark";
    const ti = el.getAttribute("tabindex");
    if (ti !== null && Number(ti) >= 0) return "button";
    return null;
}

/** never walked: privacy-sensitive fields, hidden subtrees, non-content tags */
function isSkipped(el: Element): boolean {
    const tag = el.tagName.toLowerCase();
    if (SKIP_TAGS.has(tag)) return true;
    if (el.getAttribute("aria-hidden") === "true" || el.hasAttribute("inert"))
        return true;
    if (tag === "input") {
        const type = (el.getAttribute("type") ?? "").toLowerCase();
        if (type === "password" || type === "hidden") return true;
    }
    const view = el.ownerDocument.defaultView;
    if (view) {
        const cs = view.getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden") return true;
    }
    return false;
}

/** direct text nodes only — a form field's typed content is never read */
function ownText(el: Element): string {
    if (roleOf(el) === "input") return "";
    let t = "";
    for (const n of el.childNodes)
        if (n.nodeType === 3) t += n.textContent ?? "";
    return collapse(t);
}

function labelFor(el: Element): string {
    const doc = el.ownerDocument;
    const id = el.getAttribute("id");
    if (id) {
        const lbl = doc.querySelector(`label[for="${CSS.escape(id)}"]`);
        if (lbl) return collapse(lbl.textContent);
    }
    const wrap = el.closest("label");
    return wrap ? collapse(wrap.textContent) : "";
}

function labelledBy(el: Element): string {
    const ids = el.getAttribute("aria-labelledby");
    if (!ids) return "";
    return collapse(
        ids
            .split(/\s+/)
            .map((id) => el.ownerDocument.getElementById(id)?.textContent ?? "")
            .join(" "),
    );
}

/**
 * Accessible name, in accname order as far as this needs to go. Interactables and
 * headings take name-from-content (the subtree text) when they carry no own text, so
 * `<a><span>Apply</span></a>` reaches the model as "Apply".
 */
function nameOf(el: Element, role: InventoryRole | null, capN: number): string {
    // accname order: aria-labelledby, aria-label, own text, native label/alt/title/
    // placeholder, then name-from-content for controls and headings
    const n =
        labelledBy(el) ||
        collapse(el.getAttribute("aria-label")) ||
        ownText(el) ||
        labelFor(el) ||
        collapse(el.getAttribute("alt")) ||
        collapse(el.getAttribute("title")) ||
        collapse(el.getAttribute("placeholder")) ||
        (role === "button" || role === "link" || role === "heading"
            ? contentText(el)
            : "");
    return cap(n, capN);
}

/** subtree text for name-from-content, skipping anything a field could hold */
function contentText(el: Element): string {
    const parts: string[] = [];
    const walk = (n: Node) => {
        if (n.nodeType === 3) parts.push(n.textContent ?? "");
        else if (n.nodeType === 1) {
            const e = n as Element;
            if (roleOf(e) === "input" || isSkipped(e)) return;
            for (const c of e.childNodes) walk(c);
        }
    };
    for (const c of el.childNodes) walk(c);
    return collapse(parts.join(" "));
}

function stateOf(el: Element): string | undefined {
    const s: string[] = [];
    const aria = (k: string) => el.getAttribute(`aria-${k}`);
    if (aria("checked") === "true" || (el as HTMLInputElement).checked === true)
        s.push("checked");
    if (aria("expanded") === "true") s.push("expanded");
    if (
        aria("disabled") === "true" ||
        (el as HTMLButtonElement).disabled === true
    )
        s.push("disabled");
    if (aria("selected") === "true") s.push("selected");
    return s.length ? s.join(" ") : undefined;
}

function isLabelled(el: Element): boolean {
    return el.hasAttribute("aria-label") || el.hasAttribute("aria-labelledby");
}

interface Walked {
    el: Element;
    role: InventoryRole | null;
    name: string;
    /** qualifies in its own right (role or text) */
    own: boolean;
    /** earns a node as a region (landmark/heading/labelled, or a fork of ≥2 visible branches) */
    region: boolean;
    box: { x: number; y: number; width: number; height: number };
    visible: boolean;
    children: Walked[];
    /** any descendant (or self) that is emitted and visible */
    hasVisible: boolean;
}

/**
 * Build the inventory for `root` (normally document.body). Two passes: mark what
 * qualifies bottom-up, then emit top-down with sequential ids; then the budget guard.
 */
export function buildInventory(
    root: Element,
    opts: InventoryOptions,
    measure: Measure = defaultMeasure,
    toContent: ToContent = identity,
): Inventory {
    const { w: vw, h: vh } = opts.viewport;
    const visibleIn = (b: Walked["box"]) =>
        b.width > 0 &&
        b.height > 0 &&
        b.x < vw &&
        b.y < vh &&
        b.x + b.width > 0 &&
        b.y + b.height > 0;

    // pass 1: post-order marking over the whole DOM; depth is capped on the emitted
    // tree in pass 2, where wrapper divs have already collapsed away
    const mark = (el: Element, domDepth = 0): Walked | null => {
        if (isSkipped(el)) return null;
        let box = measure(el);
        const children: Walked[] = [];
        if (domDepth < DOM_DEPTH_LIMIT)
            for (const c of el.children) {
                const w = mark(c, domDepth + 1);
                if (w) children.push(w);
            }
        // display:contents (and other box-less wrappers) report a 0x0 rect at the
        // viewport origin; their content is the union of their children's boxes
        if (box.width === 0 && box.height === 0 && children.length)
            box = unionOf(children.map((c) => c.box));
        const role = roleOf(el);
        const name = nameOf(el, role, opts.summaryCap);
        // a labelled container is a region, not a text leaf: its name came from
        // aria-label, not from text of its own
        const own = role !== null || (name.length > 0 && !isLabelled(el));
        const branches = children.filter((c) => c.hasVisible || c.own).length;
        const region =
            el === root ||
            role === "landmark" ||
            role === "heading" ||
            (role === null && isLabelled(el)) ||
            (role === null && branches >= 2);
        const visible = visibleIn(box);
        // children are already pruned, so any child at all means something below is kept
        const kept = own || region || children.length > 0;
        if (!kept) return null;
        const hasVisible =
            ((own || region) && visible) || children.some((c) => c.hasVisible);
        return {
            el,
            role,
            name,
            own,
            region,
            box,
            visible,
            children,
            hasVisible,
        };
    };
    const tree = mark(root);

    // pass 2: pre-order emit; unqualified intermediates collapse (parent = nearest emitted)
    const nodes: InventoryNode[] = [];
    const registry = new Map<string, Element>();
    const emit = (w: Walked, parentId: string | null, level: number) => {
        let id = parentId;
        if (w.own || w.region) {
            if (level > opts.maxDepth) return;
            id = `n${nodes.length}`;
            // text leaves already covered by an interactable/heading ancestor's name are
            // merged into it (AgentOccam): a <span> inside a link named by its content
            const inheritedName = parentId ? registry.get(parentId) : undefined;
            const parentNode = inheritedName
                ? nodes[Number(parentId?.slice(1))]
                : undefined;
            const mergeable =
                w.role === null &&
                !w.region &&
                parentNode !== undefined &&
                parentNode.role !== "container" &&
                parentNode.role !== "landmark" &&
                parentNode.name.includes(w.name);
            if (!mergeable) {
                const node: InventoryNode = {
                    id,
                    role: w.role ?? (w.own ? "text" : "container"),
                    name: w.name,
                    rect: contentRect(w.box, toContent),
                    visible: w.visible,
                    parentId,
                };
                if (w.region && level <= opts.summaryDepth) {
                    // built from descendant names, never textContent: a textarea's draft
                    // or an editable field's contents must never reach the inventory
                    const names: string[] = [];
                    const collect = (x: Walked) => {
                        for (const c of x.children) {
                            if (c.own && c.name) names.push(c.name);
                            collect(c);
                        }
                    };
                    collect(w);
                    const t = cap(collapse(names.join(" · ")), opts.summaryCap);
                    if (t && t !== node.name) node.text = t;
                }
                const s = stateOf(w.el);
                if (s) node.state = s;
                nodes.push(node);
                registry.set(id, w.el);
            } else id = parentId;
        }
        const next = id === parentId ? level : level + 1;
        for (const c of w.children) emit(c, id, next);
    };
    if (tree) emit(tree, null, 0);

    // budget guard: drop the leaves farthest from the viewport centre first; never a
    // region, heading or landmark, never a node something kept still points at
    const wireOf = (n: InventoryNode): WireNode => {
        const wn: WireNode = {
            i: n.id,
            r: n.role,
            n: n.name,
            b: [n.rect.x, n.rect.y, n.rect.w, n.rect.h],
            v: n.visible ? 1 : 0,
        };
        if (n.text) wn.t = n.text;
        if (n.state) wn.s = n.state;
        if (n.parentId) wn.p = n.parentId;
        return wn;
    };
    // Leaves go first, farthest from the viewport centre first; headings, landmarks
    // and containers only once leaves alone cannot meet the budget, because the caps
    // are hard (the backend rejects past them). A node is dropped only once nothing
    // kept points at it, so the tree never orphans. Byte cost is tracked per node:
    // re-serializing after every drop is quadratic on a real page.
    const cost = nodes.map((n) => byteLength(JSON.stringify(wireOf(n))) + 1);
    let bytes = 1 + cost.reduce((a, b) => a + b, 0); // "[" + each node and its "," / "]"
    const kids = new Map<string, number>();
    for (const n of nodes)
        if (n.parentId) kids.set(n.parentId, (kids.get(n.parentId) ?? 0) + 1);
    const dropped = new Set<number>();
    const over = () =>
        bytes > opts.maxBytes || nodes.length - dropped.size > opts.maxNodes;
    if (over()) {
        const centre = toContent(vw / 2, vh / 2);
        const dist = (n: InventoryNode) =>
            Math.hypot(
                n.rect.x + n.rect.w / 2 - centre.x,
                n.rect.y + n.rect.h / 2 - centre.y,
            );
        const protectedRole = (n: InventoryNode) =>
            n.role === "container" ||
            n.role === "heading" ||
            n.role === "landmark";
        const order = nodes
            .map((n, i) => ({ i, d: dist(n) }))
            .sort((a, b) => b.d - a.d)
            .map((x) => x.i);
        for (const protect of [true, false]) {
            let progress = true;
            // dropping a leaf can make its parent a leaf: sweep until nothing moves
            while (over() && progress) {
                progress = false;
                for (const i of order) {
                    if (!over()) break;
                    const n = nodes[i];
                    if (i === 0 || dropped.has(i) || kids.get(n.id)) continue;
                    if (protect && protectedRole(n)) continue;
                    dropped.add(i);
                    bytes -= cost[i];
                    if (n.parentId)
                        kids.set(n.parentId, (kids.get(n.parentId) ?? 1) - 1);
                    registry.delete(n.id);
                    progress = true;
                }
            }
        }
    }
    const kept = nodes.filter((_, i) => !dropped.has(i));
    const truncated = dropped.size;
    bytes = byteLength(JSON.stringify(kept.map(wireOf)));
    return { nodes: kept, wire: kept.map(wireOf), registry, truncated, bytes };
}

type Box = Walked["box"];

function unionOf(boxes: Box[]): Box {
    const real = boxes.filter((b) => b.width > 0 || b.height > 0);
    if (!real.length) return { x: 0, y: 0, width: 0, height: 0 };
    const x = Math.min(...real.map((b) => b.x));
    const y = Math.min(...real.map((b) => b.y));
    const r = Math.max(...real.map((b) => b.x + b.width));
    const btm = Math.max(...real.map((b) => b.y + b.height));
    return { x, y, width: r - x, height: btm - y };
}

/**
 * Client box to content space. Both corners go through toContent: under the page
 * zoom a client box is `scale` times its content size. A box-less node stays 0x0 at
 * the origin rather than borrowing the viewport's corner as its position.
 */
function contentRect(b: Box, toContent: ToContent): InventoryNode["rect"] {
    if (b.width === 0 && b.height === 0) return { x: 0, y: 0, w: 0, h: 0 };
    const a = toContent(b.x, b.y);
    const z = toContent(b.x + b.width, b.y + b.height);
    return {
        x: Math.round(a.x),
        y: Math.round(a.y),
        w: Math.round(z.x - a.x),
        h: Math.round(z.y - a.y),
    };
}

function byteLength(s: string): number {
    return typeof TextEncoder === "undefined"
        ? s.length
        : new TextEncoder().encode(s).length;
}

/** same fallback chain over the wire form, which is all the popover holds after upload */
export function labelOfWire(id: string, wire: WireNode[]): string {
    const node = wire.find((n) => n.i === id);
    if (!node) return id;
    if (node.n) return node.n;
    if (node.t) return node.t;
    const child = wire.find((n) => n.p === id && n.n);
    return child ? child.n : node.r;
}

/** what the popover announces: name, else region text, else the first named child, else tag */
export function labelOf(id: string, inv: Pick<Inventory, "nodes">): string {
    const node = inv.nodes.find((n) => n.id === id);
    if (!node) return id;
    if (node.name) return node.name;
    if (node.text) return node.text;
    const child = inv.nodes.find((n) => n.parentId === id && n.name);
    return child ? child.name : node.role;
}
