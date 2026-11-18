import { describe, expect, it } from "vitest";
import {
    checkId,
    checkName,
    checkStartTime,
    idFields,
    idsOf,
    profileFields,
    profileOf,
} from "./respondentIds";

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

describe("the name and start time", () => {
    it("checks a name", () => {
        expect(checkName("  山田　 太郎 ")).toEqual({
            value: "山田 太郎",
            error: null,
        });
        expect(checkName(" ").error).toBe("missing");
        expect(checkName("あ".repeat(64)).error).toBeNull();
        expect(checkName("あ".repeat(65)).error).toBe("invalid");
    });

    it("checks a start time", () => {
        expect(checkStartTime("08:30")).toEqual({
            value: "08:30",
            error: null,
        });
        expect(checkStartTime("8:30")).toEqual({ value: "08:30", error: null });
        expect(checkStartTime("８：３０")).toEqual({
            value: "08:30",
            error: null,
        });
        expect(checkStartTime("13:05:00")).toEqual({
            value: "13:05",
            error: null,
        });
        expect(checkStartTime("").error).toBe("missing");
        expect(checkStartTime("24:00").error).toBe("invalid");
        expect(checkStartTime("午前8時").error).toBe("invalid");
    });

    it("reads them from an attempt, and names them as the log does", () => {
        expect(profileOf({ name: "山田", startTime: "08:30" })).toEqual({
            name: "山田",
            startTime: "08:30",
        });
        expect(profileOf({ name: "山田" })).toBeNull();
        expect(profileOf({ name: "山田", startTime: "8時" })).toBeNull();
        expect(profileOf(null)).toBeNull();
        expect(profileFields({ name: "山田", startTime: "08:30" })).toEqual({
            name: "山田",
            start_time: "08:30",
        });
        expect(profileFields(null)).toEqual({});
    });
});
