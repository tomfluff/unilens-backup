import { afterEach, describe, expect, it } from "vitest";
import { aiChoice } from "./ai";
import { updateSetting } from "./settings";

afterEach(() => {
    updateSetting("aiProvider", "auto");
    updateSetting("aiModel", "");
    updateSetting("aiReasoning", "default");
});

describe("aiChoice", () => {
    it("sends nothing while every AI setting is the backend's default", () => {
        expect(aiChoice()).toBeUndefined();
    });

    it("sends only what the user picked", () => {
        updateSetting("aiProvider", "gemini");
        updateSetting("aiReasoning", "low");
        expect(aiChoice()).toEqual({ provider: "gemini", reasoning: "low" });
        updateSetting("aiModel", "gemini-3.5-flash");
        expect(aiChoice()).toEqual({
            provider: "gemini",
            model: "gemini-3.5-flash",
            reasoning: "low",
        });
    });
});
