import { describe, expect, it } from "vitest";
import {
    compositeBackdrop,
    contentDrawsText,
    imageOfLayer,
    isFigureBox,
    isClearGradient,
    isFlatGradient,
    isPictureSized,
    isSolidFill,
    lineSitsOnMedia,
    paintedLayerBox,
    pseudoBox,
    splitCssList,
    toneMaskSvg,
    withoutFlatGradients,
} from "./mediaTextGuard";

const box = (left: number, top: number, right: number, bottom: number) => ({
    left,
    top,
    right,
    bottom,
});
const viewport = { width: 1000, height: 800 };

describe("lineSitsOnMedia", () => {
    const photo = box(0, 0, 400, 300);

    it("counts a line drawn on the picture", () => {
        expect(lineSitsOnMedia(box(20, 100, 300, 130), photo)).toBe(true);
    });

    it("ignores a line beside the picture", () => {
        expect(lineSitsOnMedia(box(410, 100, 700, 130), photo)).toBe(false);
    });

    it("ignores a line that only grazes the edge", () => {
        expect(lineSitsOnMedia(box(350, 100, 700, 130), photo)).toBe(false);
    });
});

describe("isPictureSized", () => {
    it("accepts small images (badges, buttons)", () => {
        expect(isPictureSized(box(0, 0, 200, 30), viewport)).toBe(true);
    });

    it("rejects hairlines and dots", () => {
        expect(isPictureSized(box(0, 0, 400, 1), viewport)).toBe(false);
        expect(isPictureSized(box(0, 0, 4, 4), viewport)).toBe(false);
    });

    it("accepts a hero image", () => {
        expect(isPictureSized(box(0, 0, 1000, 600), viewport)).toBe(true);
    });

    it("rejects a whole-page backdrop", () => {
        expect(isPictureSized(box(0, 0, 1000, 5000), viewport)).toBe(false);
    });
});

describe("isFigureBox", () => {
    const photo = box(0, 0, 400, 300);
    const caption = box(20, 240, 380, 290);

    it("treats a tight wrapper as the figure", () => {
        expect(isFigureBox(box(0, 0, 400, 320), photo, caption)).toBe(true);
    });

    it("does not treat a whole section as the figure", () => {
        expect(isFigureBox(box(0, 0, 1000, 900), photo, caption)).toBe(false);
    });
});

describe("splitCssList / imageOfLayer", () => {
    it("keeps commas inside data URLs", () => {
        const svg = 'url("data:image/svg+xml,<svg a=1,b=2>")';
        const layers = splitCssList(`${svg}, linear-gradient(red, blue)`);
        expect(layers.length).toBe(2);
        expect(imageOfLayer(layers[0])).toEqual({
            kind: "url",
            url: "data:image/svg+xml,<svg a=1,b=2>",
        });
        expect(imageOfLayer(layers[1])).toEqual({ kind: "generated" });
    });

    it("reads every file format the same way", () => {
        for (const file of [
            "/a.jpg",
            "/a.png",
            "/a.webp",
            "/a.avif",
            "/a.gif",
            "/a.svg",
            "/a.svg#frag",
        ]) {
            expect(imageOfLayer(`url(${file})`)).toEqual({
                kind: "url",
                url: file,
            });
        }
    });

    it("reads image-set() with or without url()", () => {
        expect(imageOfLayer('image-set(url("/a.avif") 1x)')).toEqual({
            kind: "url",
            url: "/a.avif",
        });
        expect(imageOfLayer('-webkit-image-set("/a.png" 1x)')).toEqual({
            kind: "url",
            url: "/a.png",
        });
    });

    it("treats generated images as images", () => {
        for (const layer of [
            "radial-gradient(red, blue)",
            "repeating-linear-gradient(red 0 2px, blue 2px 4px)",
            "conic-gradient(red, blue)",
            "-webkit-linear-gradient(top, red, blue)",
            "cross-fade(url(a.png), url(b.png), 50%)",
            "paint(checker)",
        ]) {
            expect(imageOfLayer(layer)).not.toBe(null);
        }
    });

    it("ignores none", () => {
        expect(imageOfLayer("none")).toBe(null);
    });
});

describe("pseudoBox", () => {
    const host = box(100, 100, 500, 400);
    const viewport = { width: 1000, height: 800 };
    const style = (o: Record<string, string>) => ({
        position: "absolute",
        width: "auto",
        height: "auto",
        top: "auto",
        right: "auto",
        bottom: "auto",
        left: "auto",
        ...o,
    });

    it("covers the host for inset: 0", () => {
        expect(
            pseudoBox(
                host,
                viewport,
                style({ top: "0px", right: "0px", bottom: "0px", left: "0px" }),
            ),
        ).toEqual(host);
    });

    it("places a sized layer by its insets", () => {
        expect(
            pseudoBox(
                host,
                viewport,
                style({
                    width: "200px",
                    height: "100px",
                    right: "0px",
                    top: "10px",
                }),
            ),
        ).toEqual(box(300, 110, 500, 210));
    });

    it("gives up without a size", () => {
        expect(pseudoBox(host, viewport, style({}))).toBe(null);
    });
});

describe("paintedLayerBox", () => {
    const el = box(0, 0, 800, 400);

    it("covers the box for cover", () => {
        expect(
            paintedLayerBox(el, "cover", "50% 50%", "no-repeat", null),
        ).toEqual(el);
    });

    it("fits a contain image by its own aspect ratio", () => {
        // A 1000x250 banner in a 800x400 card: an 800x200 strip, centered.
        expect(
            paintedLayerBox(el, "contain", "50% 50%", "no-repeat", {
                width: 1000,
                height: 250,
            }),
        ).toEqual(box(0, 100, 800, 300));
    });

    it("cannot place a contain image without its size", () => {
        expect(
            paintedLayerBox(el, "contain", "50% 50%", "no-repeat", null),
        ).toBe(null);
    });

    it("places a small no-repeat icon by its position", () => {
        expect(
            paintedLayerBox(el, "16px 16px", "100% 50%", "no-repeat", null),
        ).toEqual(box(784, 192, 800, 208));
    });

    it("uses the natural size for auto", () => {
        expect(
            paintedLayerBox(el, "auto", "0% 0%", "no-repeat", {
                width: 300,
                height: 200,
            }),
        ).toEqual(box(0, 0, 300, 200));
    });

    it("cannot tell an auto size without the image", () => {
        expect(paintedLayerBox(el, "auto", "0% 0%", "no-repeat", null)).toBe(
            null,
        );
    });

    it("fills the box when the image repeats", () => {
        expect(
            paintedLayerBox(el, "auto", "0% 0%", "repeat", null),
        ).toEqual(el);
    });
});

describe("toneMaskSvg", () => {
    it("cuts one hole per block", () => {
        const svg = toneMaskSvg(1000, 800, [
            box(10, 20, 110, 70),
            box(200, 300, 400, 500),
        ]);
        expect(svg.match(/fill='black'/g)?.length).toBe(2);
        expect(svg).toContain("x='10' y='20' width='100' height='50'");
    });
});

describe("isSolidFill", () => {
    it("treats opaque fills as covering the picture", () => {
        expect(isSolidFill("rgb(255, 255, 255)")).toBe(true);
        expect(isSolidFill("rgba(255, 255, 255, 0.95)")).toBe(true);
        expect(isSolidFill("color(srgb 1 1 1)")).toBe(true);
    });

    it("lets the picture show through scrims and transparency", () => {
        expect(isSolidFill("rgba(0, 0, 0, 0.55)")).toBe(false);
        expect(isSolidFill("rgba(0, 0, 0, 0)")).toBe(false);
        expect(isSolidFill("rgb(0 0 0 / 0.4)")).toBe(false);
        expect(isSolidFill("transparent")).toBe(false);
    });
});

describe("isClearGradient", () => {
    it("treats a fully transparent gradient as no backdrop", () => {
        expect(
            isClearGradient(
                "linear-gradient(rgba(0, 0, 0, 0), rgba(255, 255, 255, 0))",
            ),
        ).toBe(true);
    });

    it("keeps every visible gradient as a backdrop, faint ones included", () => {
        // e-Stat's light-blue buttons: themes keep the gradient, so the
        // text on it must keep its color too.
        expect(
            imageOfLayer(
                "-webkit-linear-gradient(-270deg, rgb(163, 196, 255) 0%, rgb(193, 213, 255) 35%)",
            ),
        ).toEqual({ kind: "generated" });
        // Two different colours: a real gradient, not a flat fill.
        expect(
            imageOfLayer(
                "linear-gradient(rgb(255, 255, 255) 0%, rgb(0, 0, 0) 100%)",
            ),
        ).toEqual({ kind: "generated" });
        // A translucent stop fades the colour: not flat either.
        expect(
            imageOfLayer(
                "linear-gradient(rgb(255, 255, 255) 0%, rgba(255, 255, 255, 0.5) 100%)",
            ),
        ).toEqual({ kind: "generated" });
    });
});

describe("isFlatGradient", () => {
    // SoftBank price-plan cards: a white fill with a transparent last 3%.
    const softbankFill =
        "-webkit-linear-gradient(bottom, rgb(255, 255, 255) 97%, rgba(255, 255, 255, 0) 97%)";

    it("recognises a one-colour gradient as a solid fill", () => {
        expect(isFlatGradient(softbankFill)).toBe(true);
        expect(
            isFlatGradient("linear-gradient(rgb(10, 20, 30), rgb(10, 20, 30))"),
        ).toBe(true);
    });

    it("is not a picture: imageOfLayer skips it", () => {
        expect(imageOfLayer(softbankFill)).toBe(null);
    });

    it("keeps two-colour and fading gradients", () => {
        expect(
            isFlatGradient(
                "linear-gradient(rgb(163, 196, 255) 0%, rgb(193, 213, 255) 35%)",
            ),
        ).toBe(false);
        expect(
            isFlatGradient(
                "linear-gradient(rgb(255, 255, 255), rgba(255, 255, 255, 0.5))",
            ),
        ).toBe(false);
    });

    it("ignores fully clear gradients and other color syntaxes", () => {
        expect(
            isFlatGradient(
                "linear-gradient(rgba(0, 0, 0, 0), rgba(255, 255, 255, 0))",
            ),
        ).toBe(false);
        expect(isFlatGradient("linear-gradient(#fff, #fff)")).toBe(false);
        expect(isFlatGradient('url("a.png")')).toBe(false);
    });
});

describe("withoutFlatGradients", () => {
    const flat =
        "-webkit-linear-gradient(bottom, rgb(255, 255, 255) 97%, rgba(255, 255, 255, 0) 97%)";

    it("sets only the flat layer to none and keeps the picture", () => {
        expect(withoutFlatGradients(`url("top.webp"), ${flat}`)).toBe(
            'url("top.webp"), none',
        );
    });

    it("returns null when nothing is flat", () => {
        expect(withoutFlatGradients('url("a.png")')).toBe(null);
        expect(withoutFlatGradients("none")).toBe(null);
        expect(
            withoutFlatGradients(
                "linear-gradient(rgb(0, 0, 0), rgb(255, 255, 255))",
            ),
        ).toBe(null);
    });
});

describe("compositeBackdrop", () => {
    it("takes the first opaque color outward", () => {
        expect(
            compositeBackdrop([
                "rgba(0, 0, 0, 0)",
                "rgb(212, 220, 224)",
                "rgb(255, 255, 255)",
            ]),
        ).toBe("rgb(212, 220, 224)");
    });

    it("composites a translucent layer over what is behind it", () => {
        expect(
            compositeBackdrop(["rgba(0, 0, 0, 0.5)", "rgb(255, 255, 255)"]),
        ).toBe("rgb(128, 128, 128)");
    });

    it("falls back to the white canvas", () => {
        expect(compositeBackdrop(["rgba(0, 0, 0, 0)"])).toBe(
            "rgb(255, 255, 255)",
        );
    });
});

describe("contentDrawsText", () => {
    it("counts glyphs, counters and attr() as text", () => {
        expect(contentDrawsText('"NEW"')).toBe(true);
        expect(contentDrawsText('"\u203a"')).toBe(true);
        expect(contentDrawsText("counter(item)")).toBe(true);
        expect(contentDrawsText('attr(data-label)')).toBe(true);
    });

    it("ignores none, empty strings and images", () => {
        for (const c of ["none", "normal", "", '""', "''", 'url("a.svg")'])
            expect(contentDrawsText(c)).toBe(false);
    });

    it("ignores strings of only spaces (icon boxes like yukoyuko's external-link mark)", () => {
        for (const c of ['" "', "' '", '"\u00a0"', '"  "', '"\u3000"', '"\u200b"'])
            expect(contentDrawsText(c)).toBe(false);
    });
});
