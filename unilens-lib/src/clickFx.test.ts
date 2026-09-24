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

    it("frames with the highlight's outline when asked, else brackets", () => {
        updateSetting("clickFx", "frame");
        updateSetting("fxFrameShape", "highlight");
        updateSetting("hlOutline", "band");
        const box = { left: 50, top: 50, width: 120, height: 30 };
        clickFeedback(110, 65, box);
        expect(shown(".ul-fx-frame.band")).toBe(1);
        expect(shown(".ul-fx-frame .br")).toBe(0);
        for (const el of document.querySelectorAll(".ul-fx")) el.remove();
        updateSetting("fxFrameShape", "brackets");
        clickFeedback(110, 65, box);
        expect(shown(".ul-fx-frame .br")).toBe(4);
    });

    it("drops the edge's pin when it is off", () => {
        updateSetting("clickFx", "edge");
        updateSetting("fxPin", false);
        clickFeedback(10, 10);
        expect(shown(".ul-fx-edge")).toBe(1);
        expect(shown(".ul-fx-pin")).toBe(0);
    });
});
