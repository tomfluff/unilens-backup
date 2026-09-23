import { describe, expect, it } from "vitest";
import {
    asksToLocate,
    getLastEvidenceDebug,
    mdLite,
    navCommand,
    recordEvidence,
    renderCited,
    speakable,
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
        ["back", { kind: "prev" }],
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
