import { describe, expect, it } from "vitest";
import { checkId, idFields, idsOf } from "./respondentIds";

describe("checkId", () => {
    it("accepts letters, digits, - and _", () => {
        expect(checkId("P01")).toEqual({ value: "P01", error: null });
        expect(checkId("survey_3-b")).toEqual({
            value: "survey_3-b",
            error: null,
        });
    });

    it("turns full-width input into half-width and trims it", () => {
        expect(checkId(" Ｐ０１　")).toEqual({ value: "P01", error: null });
    });

    it("says what is wrong", () => {
        expect(checkId("  ").error).toBe("missing");
        expect(checkId("山田").error).toBe("invalid");
        expect(checkId("a b").error).toBe("invalid");
        expect(checkId("x".repeat(33)).error).toBe("invalid");
    });
});

describe("idsOf / idFields", () => {
    it("reads both IDs from an attempt, or none", () => {
        expect(idsOf({ userId: "U1", surveyId: "3" })).toEqual({
            userId: "U1",
            surveyId: "3",
        });
        expect(idsOf({ userId: "U1" })).toBeNull();
        expect(idsOf({ userId: "U 1", surveyId: "3" })).toBeNull();
        expect(idsOf(null)).toBeNull();
    });

    it("names them as the log does", () => {
        expect(idFields({ userId: "U1", surveyId: "3" })).toEqual({
            user_id: "U1",
            survey_id: "3",
        });
        expect(idFields(null)).toEqual({});
    });
});
