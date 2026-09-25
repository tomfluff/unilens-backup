import { beforeEach, describe, expect, it } from "vitest";
import { clickFeedback } from "./clickFx";
import { getSettings, updateSetting, useSettings } from "./settings";

const defaults = { ...getSettings() };
const shown = (sel: string) => document.querySelectorAll(sel).length;

beforeEach(() => {
    for (const el of document.querySelectorAll(".ul-fx")) el.remove();
    useSettings.setState(defaults);
});

describe("click feedback", () => {
    it("draws the orb's chosen layers, and keeps the halo when all are off", () => {
        updateSetting("fxHalo", true);
        updateSetting("fxSwirl", true);
        updateSetting("fxCore", false);
        clickFeedback(100, 100);
        expect(shown(".ul-fx-orb .halo")).toBe(1);
        expect(shown(".ul-fx-orb .swirl")).toBe(1);
        expect(shown(".ul-fx-orb .core")).toBe(0);
        for (const el of document.querySelectorAll(".ul-fx")) el.remove();
        updateSetting("fxHalo", false);
        updateSetting("fxSwirl", false);
        clickFeedback(100, 100);
        expect(shown(".ul-fx-orb i")).toBe(1);
        expect(shown(".ul-fx-orb .halo")).toBe(1);
    });

    it("follows the shared ripple switch", () => {
        updateSetting("fxRipple", false);
        clickFeedback(10, 10);
        expect(shown(".ul-fx-ripple")).toBe(0);
    });

    it("sends out as many sonar rings as set, around one beacon", () => {
        updateSetting("clickFx", "sonar");
        updateSetting("fxRings", 2);
        clickFeedback(10, 10);
        expect(shown(".ul-fx-sonar i:not(.c)")).toBe(2);
        expect(shown(".ul-fx-sonar .c")).toBe(1);
    });

    it("frames exactly as the highlight draws, when asked, else brackets", () => {
        updateSetting("clickFx", "frame");
        updateSetting("fxFrameShape", "highlight");
        // the highlight look this test walks through: no glow, so "nothing at all" is
        updateSetting("hlGlow", false);
        updateSetting("hlOutline", "band");
        updateSetting("ringWidth", 3);
        const box = { left: 50, top: 50, width: 120, height: 30 };
        clickFeedback(110, 65, box);
        const f = document.querySelector<HTMLElement>(".ul-fx-frame");
        // the highlight's band: three widths of the colour, a dark edge
        expect(f?.dataset.outline).toBe("band");
        expect(f?.style.borderWidth).toBe("9px");
        expect(shown(".ul-fx-frame .br")).toBe(0);
        for (const el of document.querySelectorAll(".ul-fx")) el.remove();
        // no outline: its fill shows; nothing at all: the ring
        updateSetting("hlOutline", "none");
        updateSetting("hlFill", true);
        clickFeedback(110, 65, box);
        expect(
            document.querySelector<HTMLElement>(".ul-fx-frame")?.dataset
                .outline,
        ).toBe("none");
        for (const el of document.querySelectorAll(".ul-fx")) el.remove();
        updateSetting("hlFill", false);
        clickFeedback(110, 65, box);
        expect(
            document.querySelector<HTMLElement>(".ul-fx-frame")?.dataset
                .outline,
        ).toBe("ring");
        for (const el of document.querySelectorAll(".ul-fx")) el.remove();
        updateSetting("fxFrameShape", "brackets");
        clickFeedback(110, 65, box);
        expect(shown(".ul-fx-frame .br")).toBe(4);
    });

    it("keeps the centring out of every scaled transform, so it stays on the click", () => {
        clickFeedback(10, 10);
        const css = [...document.querySelectorAll("style")]
            .map((st) => st.textContent ?? "")
            .find((t) => t.includes(".ul-fx-at"));
        // centred by the translate property, which applies outside scale and transform
        expect(css).toMatch(
            /\.ul-fx-at \{ translate: -50% -50%; transform-origin: 50% 50%/,
        );
        // a translate(-50%) inside a scaled transform drifts off the click as it scales
        expect(css).not.toMatch(/translate\(-50%/);
    });

    it("drops the edge's pin when it is off", () => {
        updateSetting("clickFx", "edge");
        updateSetting("fxPin", false);
        clickFeedback(10, 10);
        expect(shown(".ul-fx-edge")).toBe(1);
        expect(shown(".ul-fx-pin")).toBe(0);
    });
});
