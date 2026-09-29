import { describe, expect, it } from "vitest";
import {
    asksToLocate,
    asksToZoom,
    getLastEvidenceDebug,
    mdLite,
    navCommand,
    placeLiveMarkers,
    recordEvidence,
    renderCited,
    sourcesIn,
    speakable,
    zoomAsked,
} from "./evidence";

const known = (id: string) => ["n3", "n12", "n40"].includes(id);
const label = (id: string) => `label of ${id}`;

describe("renderCited", () => {
    it("numbers citations by first appearance and reuses the number for a repeat", () => {
        const r = renderCited(
            "Starter is $9 [[n12]], Team $29 [[n40]]; Starter again [[n12]].",
            known,
            label,
        );
        expect(r.ids).toEqual(["n12", "n40"]);
        const chips = [...r.html.matchAll(/data-cite="(n\d+)"[^>]*>(\d+)</g)];
        expect(chips.map((c) => [c[1], c[2]])).toEqual([
            ["n12", "1"],
            ["n40", "2"],
            ["n12", "1"],
        ]);
        expect(r.html).not.toContain("[[");
    });

    it("drops markers the inventory does not know, with their leading space", () => {
        const r = renderCited("Price $9 [[n99]].", known, label);
        expect(r.ids).toEqual([]);
        expect(r.html).toBe("Price $9.");
    });

    it("hides an unfinished marker at the end of a stream only", () => {
        for (const tail of [" [", " [[", " [[n", " [[n1", " [[n12]"])
            expect(renderCited(`Price${tail}`, known, label, true).html).toBe(
                "Price",
            );
        expect(renderCited("a [b", known, label, false).html).toBe("a [b");
        expect(renderCited("Price [[n12]]", known, label, true).ids).toEqual([
            "n12",
        ]);
    });

    it("escapes model text and labels, so only our own tags reach the bubble", () => {
        const r = renderCited(
            "<img src=x onerror=alert(1)> **ok** [[n3]]",
            known,
            () => '"><script>x</script>',
        );
        expect(r.html).not.toMatch(/<img|<script/);
        expect(r.html).toContain("<b>ok</b>");
        expect(r.html).toContain("&quot;&gt;&lt;script&gt;");
    });

    it("strips the slot char so model text cannot forge a chip slot", () => {
        const r = renderCited("x \uE0FF1\uE0FF [[n3]]", known, label);
        expect(r.ids).toEqual(["n3"]);
        expect(r.html.match(/unilens-cite/g)).toHaveLength(1);
    });
});

describe("joined markers (Gemini's [[n42], [n43]])", () => {
    const chips = (html: string) =>
        [...html.matchAll(/data-cite="(n\d+)"[^>]*>(\d+)</g)].map((c) => c[1]);

    it("become one chip per id, in either form", () => {
        for (const text of [
            "Starter is $9 [[n12], [n40]].",
            "Starter is $9 [[n12, n40]].",
        ]) {
            const r = renderCited(text, known, label);
            expect(r.ids).toEqual(["n12", "n40"]);
            expect(chips(r.html)).toEqual(["n12", "n40"]);
            expect(r.html).not.toContain("[");
        }
    });

    it("stay hidden while they stream in, and are never read aloud", () => {
        for (const tail of [
            " [[n12],",
            " [[n12], [n4",
            " [[n12], [n40]",
            " [[n12, n",
        ])
            expect(
                renderCited(`Starter is $9${tail}`, known, label, true).html,
            ).toBe("Starter is $9");
        expect(speakable("Starter is $9 [[n12], [n40]].")).toBe(
            "Starter is $9.",
        );
    });
});

describe("sourcesIn (a chosen source, sent with a newer capture)", () => {
    const a = document.createElement("p");
    const b = document.createElement("p");

    it("goes by its id in the capture the question goes with", () => {
        const now = new Map<string, Element>([
            ["n39", document.createElement("tr")],
            ["n42", a],
        ]);
        expect(sourcesIn([{ id: "n39", label: "¥1,000", el: a }], now)).toEqual(
            [{ id: "n42", label: "¥1,000" }],
        );
    });

    it("goes by its label when that capture does not hold it, and a place as it is", () => {
        expect(
            sourcesIn(
                [{ id: "n41", label: "Events", el: b }, { label: "P2 · 内容" }],
                new Map([["n41", a]]),
            ),
        ).toEqual([{ label: "Events" }, { label: "P2 · 内容" }]);
    });
});

describe("speakable", () => {
    it("removes every marker and the space before it", () => {
        expect(speakable("It is $9 [[n12]] and $29 [[n40]].")).toBe(
            "It is $9 and $29.",
        );
    });
});

describe("mdLite", () => {
    it("keeps the bubble formatting", () => {
        expect(mdLite("- a\n**b** `c`")).toContain("• a\n<b>b</b> <code");
    });
});

describe("navCommand", () => {
    it.each([
        ["next", { kind: "next" }],
        ["Show me the next one.", { kind: "next" }],
        ["previous", { kind: "prev" }],
        ["back", { kind: "return" }],
        ["go back", { kind: "return" }],
        ["戻る", { kind: "return" }],
        ["where I clicked", { kind: "place" }],
        ["take me to where I asked", { kind: "place" }],
        ["クリックした場所", { kind: "place" }],
        ["show all", { kind: "all" }],
        ["all of them", { kind: "all" }],
        ["clear", { kind: "clear" }],
        ["hide highlights", { kind: "clear" }],
        ["show the second one", { kind: "nth", n: 2 }],
        ["the 3rd", { kind: "nth", n: 3 }],
        ["number 4", { kind: "nth", n: 4 }],
        ["#2", { kind: "nth", n: 2 }],
    ])("reads %s", (msg, cmd) => {
        expect(navCommand(msg)).toEqual(cmd);
    });

    it("leaves real questions to the model", () => {
        for (const q of [
            "what's next on this page?",
            "show me the image",
            "where is the second price?",
            "all prices please",
        ])
            expect(navCommand(q)).toBeNull();
    });
});

describe("asksToLocate", () => {
    it("spots find/see requests, in English and a few Japanese forms", () => {
        for (const q of [
            "Where is the contact form?",
            "show me the image",
            "find the price",
            "料金はどこ？",
        ])
            expect(asksToLocate(q)).toBe(true);
        expect(asksToLocate("How much does it cost?")).toBe(false);
    });
});

describe("recordEvidence", () => {
    it("records ids, labels and how many cited ids were unknown", () => {
        recordEvidence("a [[n12]] b [[n99]] c [[n12]]", ["n12"], label);
        expect(getLastEvidenceDebug()).toMatchObject({
            ids: ["n12"],
            labels: ["label of n12"],
            dropped: 1,
        });
    });
});

describe("renderCited with phrases (Associate response text)", () => {
    const known = (id: string) => ["n12", "n13"].includes(id);
    const label = (id: string) => `label ${id}`;
    /** each source's underlined words, its spans joined (the last word is its own) */
    const spans = (html: string) => {
        const out: [string, string][] = [];
        for (const m of html.matchAll(
            /<span class="unilens-cite-text" data-cite="(n\d+)">([^<]*)<\/span>/g,
        )) {
            const last = out[out.length - 1];
            if (last && last[0] === m[1]) last[1] += m[2];
            else out.push([m[1], m[2]]);
        }
        return out;
    };

    it("underlines nothing for numbers gathered after a sentence (bug 5)", () => {
        const on = (text: string) =>
            spans(
                renderCited(
                    text,
                    known,
                    label,
                    false,
                    undefined,
                    undefined,
                    true,
                ).html,
            );
        // several numbers after the full stop: no words can be told apart
        expect(
            on(
                "You must hold 100 shares for one year or longer. [[n12]] [[n13]]",
            ),
        ).toEqual([]);
        expect(on("100株以上を1年以上保有。[[n12]][[n13]]")).toEqual([]);
        // one number right after its words still gets the last words
        expect(on("You must hold 100 shares for one year [[n12]].")).toEqual([
            ["n12", "shares for one year"],
        ]);
    });

    it("underlines the phrase the model marked, right before its chip", () => {
        const r = renderCited(
            "Shareholders get {{¥1,000 of PayPay Money Lite}}[[n12]], and more.",
            known,
            label,
            false,
            undefined,
            undefined,
            true,
        );
        expect(spans(r.html)).toEqual([["n12", "¥1,000 of PayPay Money Lite"]]);
        expect(r.html).toMatch(
            /<span class="unilens-cite-end"><span[^>]*>Lite<\/span><button[^>]*data-cite="n12"[^>]*>1<\/button><\/span>/,
        );
        expect(r.html).not.toContain("{{");
    });

    it("falls back to the last few words of the clause when there are no braces", () => {
        const r = renderCited(
            "Yes, you qualify. The benefit is described in the table [[n13]].",
            known,
            label,
            false,
            undefined,
            undefined,
            true,
        );
        expect(spans(r.html)).toEqual([["n13", "described in the table"]]);
    });

    it("finds Japanese words too", () => {
        const r = renderCited(
            "対象は、100株以上保有の株主さまです[[n12]]。",
            known,
            label,
            false,
            undefined,
            undefined,
            true,
        );
        const [[, words]] = spans(r.html);
        expect(words.length).toBeGreaterThan(0);
        expect("100株以上保有の株主さまです".endsWith(words)).toBe(true);
    });

    it("drops the braces when the setting is off, and never shows a half-written one", () => {
        const off = renderCited("Get {{¥1,000}}[[n12]].", known, label);
        expect(off.html).not.toContain("{{");
        expect(spans(off.html)).toEqual([]);
        const streaming = renderCited(
            "Get {{¥1,0",
            known,
            label,
            true,
            undefined,
            undefined,
            true,
        );
        expect(streaming.html).toBe("Get ¥1,0");
    });

    it("reads aloud without braces", () => {
        expect(speakable("Get {{¥1,000}}[[n12]].")).toBe("Get ¥1,000.");
    });
});

describe("renderCited phrases: the review's edge cases", () => {
    const known = (id: string) => ["n12", "n13"].includes(id);
    const label = (id: string) => `label ${id}`;
    const on = (text: string, streaming = false) =>
        renderCited(text, known, label, streaming, undefined, undefined, true);
    const words = (html: string) =>
        [
            ...html.matchAll(
                /<span class="unilens-cite-text" data-cite="n\d+">([^<]*)<\/span>/g,
            ),
        ]
            .map((m) => m[1])
            .join("");

    it("keeps an amount whole in the fallback", () => {
        expect(words(on("The amount is $1,000 [[n12]].").html)).toBe(
            "The amount is $1,000",
        );
        expect(words(on("It costs $1,000.00 [[n12]].").html)).toContain(
            "1,000.00",
        );
    });

    it("keeps side-by-side numbers with the words before the first", () => {
        const { html } = on("Get {{foo}}[[n12]][[n13]].");
        expect(html).toMatch(
            /<span class="unilens-cite-end"><span[^>]*>foo<\/span><button[^>]*n12[^>]*>1<\/button><button[^>]*n13[^>]*>2<\/button><\/span>/,
        );
    });

    it("never cuts a word or an emoji to keep the last word with its number", () => {
        expect(on("See {{PayPay}}[[n12]].").html).toContain(
            '<span class="unilens-cite-end"><span class="unilens-cite-text" data-cite="n12">PayPay</span>',
        );
        expect(on("Hi {{👩‍💻}}[[n12]].").html).toContain("👩‍💻");
    });

    it("keeps a phrase with markup whole in the group", () => {
        expect(on("See {{**PayPay Money Lite**}}[[n12]].").html).toContain(
            '<span class="unilens-cite-end"><span class="unilens-cite-text" data-cite="n12"><b>PayPay Money Lite</b></span><button',
        );
    });

    it("never shows a lone brace mid-stream", () => {
        expect(on("Get {", true).html).toBe("Get ");
        expect(on("Get {{foo}", true).html).toBe("Get foo");
    });

    it("renders chips exactly as before with the setting off", () => {
        const off = renderCited(
            "A [[n12]][[n13]] and B [[n12]].",
            known,
            label,
        );
        expect(off.html.match(/<button/g)?.length).toBe(3);
        expect(off.html).not.toContain("unilens-cite-end");
    });
});

describe("placeLiveMarkers (Live's numbers in its spoken words)", () => {
    const words =
        "Shareholders get ¥1,000 of PayPay Money Lite. It is in the table under 内容.";
    const second = words.indexOf("It is");
    const none = (_: string) => "";
    const place = (
        points: { id: string; at: number }[],
        labelOf: (id: string) => string = none,
    ) => placeLiveMarkers(words, points, labelOf);

    it("pointed before any words: after the sentence said next", () => {
        expect(place([{ id: "n1", at: 0 }])).toBe(
            "Shareholders get ¥1,000 of PayPay Money Lite [[n1]]. It is in the table under 内容.",
        );
    });

    it("pointed mid-sentence: at that sentence's end; between sentences: the next", () => {
        expect(place([{ id: "n2", at: second + 6 }])).toBe(
            "Shareholders get ¥1,000 of PayPay Money Lite. It is in the table under 内容 [[n2]].",
        );
        expect(place([{ id: "n2", at: second - 1 }])).toBe(
            "Shareholders get ¥1,000 of PayPay Money Lite. It is in the table under 内容 [[n2]].",
        );
    });

    it("the sentence that names it wins, and the order it pointed in holds", () => {
        const label = (id: string) => (id === "n9" ? "the table" : "");
        expect(place([{ id: "n9", at: 0 }], label)).toBe(
            "Shareholders get ¥1,000 of PayPay Money Lite. It is in the table under 内容 [[n9]].",
        );
        // n2 was pointed at after n9: never before it
        expect(
            place(
                [
                    { id: "n9", at: 0 },
                    { id: "n2", at: 0 },
                ],
                label,
            ),
        ).toBe(
            "Shareholders get ¥1,000 of PayPay Money Lite. It is in the table under 内容 [[n9]] [[n2]].",
        );
    });

    it("a sentence that named it before it pointed does not take its number", () => {
        const w = "Apply is in the menu. Choose Apply when you are ready.";
        const label = () => "Apply";
        expect(
            placeLiveMarkers(
                w,
                [{ id: "n6", at: w.indexOf("Choose") + 3 }],
                label,
            ),
        ).toBe("Apply is in the menu. Choose Apply when you are ready [[n6]].");
    });

    it("pointed once every word is in (Gemini's words run ahead): the last sentence", () => {
        expect(place([{ id: "n5", at: words.length }])).toBe(
            "Shareholders get ¥1,000 of PayPay Money Lite. It is in the table under 内容 [[n5]].",
        );
    });

    it("a sentence still being spoken: at the end for now; Japanese sentences too", () => {
        expect(
            placeLiveMarkers("It is in the", [{ id: "n3", at: 5 }], none),
        ).toBe("It is in the [[n3]]");
        expect(
            placeLiveMarkers(
                "1,000円分が進呈されます。詳しくはタブにあります。",
                [{ id: "n4", at: 0 }],
                none,
            ),
        ).toBe("1,000円分が進呈されます [[n4]]。詳しくはタブにあります。");
    });
});

describe("the zoom marker (R1 of the 2026-09-27 report)", () => {
    it("says what zoom the answer asks for, the first one", () => {
        expect(zoomAsked("Here it is, larger [[zoom:n12]].")).toEqual({
            id: "n12",
        });
        expect(zoomAsked("Zooming in [[zoom:in]]. [[zoom:out]]")).toEqual({
            change: "in",
        });
        expect(zoomAsked("No zoom here [[n12]].")).toBeNull();
    });

    it("never shows or reads the marker; a zoom into an element is its source", () => {
        const r = renderCited(
            "Here it is [[zoom:n12]]. Back [[zoom:reset]].",
            known,
            label,
        );
        expect(r.ids).toEqual(["n12"]);
        expect(r.html).not.toContain("zoom");
        expect(
            renderCited("Zooming in [[zoom:i", known, label, true).html,
        ).toBe("Zooming in");
        expect(speakable("Zooming in [[zoom:in]].")).toBe("Zooming in.");
    });
});

describe("asksToZoom: the assistant zooms only when asked", () => {
    it("hears a zoom request in English and Japanese", () => {
        for (const q of [
            "Can you zoom into that?",
            "Make it bigger, please",
            "zoom back out to normal",
            "そこを拡大して",
            "もっと大きくして",
            "元の大きさに戻して",
        ])
            expect(asksToZoom(q)).toBe(true);
    });

    it("does not hear one in other questions", () => {
        for (const q of [
            "What do shareholders get?",
            "Quote the page's text exactly",
            "株主優待は何ですか？",
            "What does zoom mean on this page?",
            "What does [[zoom:in]] mean?",
        ])
            expect(asksToZoom(q)).toBe(false);
    });
});
