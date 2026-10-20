import { describe, expect, it } from "vitest";
import {
    parseProgress,
    safeReturnUrl,
    surveyPageUrl,
    surveyProgressUrl,
} from "./surveyUrl";

describe("surveyPageUrl", () => {
    it("names the survey and the participant (no language: Japanese only)", () => {
        expect(
            surveyPageUrl("http://127.0.0.1:5000/", "unilens-poc", {
                pid: "P01",
                session: "2",
            }),
        ).toBe(
            "http://127.0.0.1:5000/survey?quiz=unilens-poc&pid=P01&session=2",
        );
    });

    it("leaves out what the page does not know", () => {
        expect(surveyPageUrl("http://h:5000", "s1", null)).toBe(
            "http://h:5000/survey?quiz=s1",
        );
    });

    it("encodes what goes into the address", () => {
        expect(surveyPageUrl("http://h", "a b&c", null)).toBe(
            "http://h/survey?quiz=a+b%26c",
        );
    });
});

describe("one page per question", () => {
    it("opens a question's page, with the visitor and the way back", () => {
        expect(
            surveyPageUrl("http://h:5000", "s1", null, {
                question: 2,
                vid: "vabc123",
                returnTo: "http://localhost:8001/?x=1",
            }),
        ).toBe(
            "http://h:5000/survey?quiz=s1&q=2&vid=vabc123&return=http%3A%2F%2Flocalhost%3A8001%2F%3Fx%3D1",
        );
    });

    it("says when the page has a tab of its own", () => {
        expect(
            surveyPageUrl("http://h", "s1", null, { question: 1, tab: true }),
        ).toBe("http://h/survey?quiz=s1&q=1&tab=1");
    });

    it("names the participant rather than the visitor when there is one", () => {
        expect(
            surveyPageUrl(
                "http://h",
                "s1",
                { pid: "P01", session: "1" },
                {
                    question: 1,
                    vid: "vabc123",
                },
            ),
        ).toBe("http://h/survey?quiz=s1&q=1&pid=P01&session=1");
    });

    it("asks the backend for the participant's or the visitor's progress", () => {
        expect(
            surveyProgressUrl(
                "http://h/",
                "s1",
                { pid: "P01", session: "2" },
                null,
            ),
        ).toBe("http://h/api/quiz/s1/progress?pid=P01&session=2");
        expect(surveyProgressUrl("http://h", "s1", null, "vabc123")).toBe(
            "http://h/api/quiz/s1/progress?vid=vabc123",
        );
        expect(surveyProgressUrl("http://h", "s1", null, null)).toBeNull();
    });

    it("reads the progress, and nothing else", () => {
        expect(parseProgress({ total: 4, next: 2, completed: false })).toEqual({
            total: 4,
            next: 2,
            completed: false,
        });
        expect(
            parseProgress({ total: 4, next: null, completed: true }),
        ).toEqual({
            total: 4,
            next: null,
            completed: true,
        });
        expect(parseProgress({ total: 0, next: 1 })).toBeNull();
        expect(parseProgress("nope")).toBeNull();
    });

    it("goes back only to a web page", () => {
        expect(safeReturnUrl("http://localhost:8001/a?pid=P01")).toBe(
            "http://localhost:8001/a?pid=P01",
        );
        expect(safeReturnUrl("javascript:alert(1)")).toBeNull();
        expect(safeReturnUrl("/relative")).toBeNull();
        expect(safeReturnUrl(null)).toBeNull();
    });
});
