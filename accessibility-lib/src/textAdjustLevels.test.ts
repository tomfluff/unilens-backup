import { describe, expect, it } from "vitest";
import {
    BODY_TEXT_EXPAND_CONFIG,
    bodyTextExpandConfig,
    bodyTextExpandHint,
    computeBodyTextTargetPx,
    computeSmallTextTargetPx,
    normalizeTextAdjustLevel,
    SMALL_TEXT_BOOST_CONFIG,
    smallTextBoostConfig,
    smallTextBoostHint,
    TEXT_ADJUST_LEVELS,
    type TextAdjustLevel,
} from "./textAdjustLevels";

describe("normalizeTextAdjustLevel", () => {
    it("passes 0–3 through unchanged", () => {
        TEXT_ADJUST_LEVELS.forEach((level) => {
            expect(normalizeTextAdjustLevel(level)).toBe(level);
        });
    });

    it("rounds out-of-range or invalid values down to off", () => {
        [-1, 4, 1.5, "2", null, undefined, {}].forEach((input) => {
            expect(normalizeTextAdjustLevel(input)).toBe(0);
        });
    });
});

describe("computeBodyTextTargetPx", () => {
    it("leaves the original size unchanged when off", () => {
        expect(computeBodyTextTargetPx(13, 0)).toBe(13);
    });

    it("returns the size multiplied by the scale", () => {
        // 20px × 1.25 = 25px (above the 16px floor, so the scale applies as-is)
        expect(computeBodyTextTargetPx(20, 2)).toBe(25);
    });

    it("raises the result to the floor when scaling would leave it too small", () => {
        const { minPx } = BODY_TEXT_EXPAND_CONFIG[1];
        expect(computeBodyTextTargetPx(10, 1)).toBe(minPx);
    });

    it("gets larger as the level increases", () => {
        const sizes = [1, 2, 3].map((level) =>
            computeBodyTextTargetPx(20, level as TextAdjustLevel),
        );
        expect(sizes).toStrictEqual([...sizes].sort((a, b) => a - b));
        expect(new Set(sizes).size).toBe(3);
    });
});

describe("computeSmallTextTargetPx", () => {
    it("leaves the original size unchanged when off", () => {
        expect(computeSmallTextTargetPx(11, 0)).toBe(11);
    });

    it("uses the floor when the value after adding addPx is still below it", () => {
        const { minPx } = SMALL_TEXT_BOOST_CONFIG[3];
        expect(computeSmallTextTargetPx(9, 3)).toBe(minPx);
    });

    it("uses the added value when it exceeds the floor", () => {
        const { minPx, addPx } = SMALL_TEXT_BOOST_CONFIG[1];
        const original = minPx + 1;
        expect(computeSmallTextTargetPx(original, 1)).toBe(original + addPx);
    });

    it("never boosts below the configured floor", () => {
        [1, 2, 3].forEach((level) => {
            const cfg = SMALL_TEXT_BOOST_CONFIG[level as 1 | 2 | 3];
            for (let px = 6; px < 16; px += 1) {
                expect(
                    computeSmallTextTargetPx(px, level as TextAdjustLevel),
                ).toBeGreaterThanOrEqual(cfg.minPx);
            }
        });
    });
});

describe("deriving the level labels", () => {
    it('has no config for "off"', () => {
        expect(bodyTextExpandConfig(0)).toBeNull();
        expect(smallTextBoostConfig(0)).toBeNull();
        expect(bodyTextExpandHint(0)).toBe("");
        expect(smallTextBoostHint(0)).toBe("");
    });

    it("the hint is derived from the config value, so it always matches", () => {
        [1, 2, 3].forEach((level) => {
            expect(bodyTextExpandHint(level as TextAdjustLevel)).toBe(
                `${BODY_TEXT_EXPAND_CONFIG[level as 1 | 2 | 3].scale}×`,
            );
            expect(smallTextBoostHint(level as TextAdjustLevel)).toBe(
                `${SMALL_TEXT_BOOST_CONFIG[level as 1 | 2 | 3].minPx}px+`,
            );
        });
    });

    it("the hint is digits and symbols only, no language-dependent characters", () => {
        [1, 2, 3].forEach((level) => {
            expect(bodyTextExpandHint(level as TextAdjustLevel)).toMatch(
                /^[\d.]+×$/,
            );
            expect(smallTextBoostHint(level as TextAdjustLevel)).toMatch(
                /^\d+px\+$/,
            );
        });
    });
});
