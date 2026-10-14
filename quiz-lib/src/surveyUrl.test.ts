import { describe, expect, it } from "vitest";
import { surveyPageUrl } from "./surveyUrl";

describe("surveyPageUrl", () => {
    it("names the survey, the participant and the language", () => {
        expect(
            surveyPageUrl(
                "http://127.0.0.1:5000/",
                "unilens-poc",
                { pid: "P01", session: "2" },
                "ja",
            ),
        ).toBe(
            "http://127.0.0.1:5000/survey?quiz=unilens-poc&pid=P01&session=2&lang=ja",
        );
    });

    it("leaves out what the page does not know", () => {
        expect(surveyPageUrl("http://h:5000", "s1", null, null)).toBe(
            "http://h:5000/survey?quiz=s1",
        );
    });

    it("encodes what goes into the address", () => {
        expect(surveyPageUrl("http://h", "a b&c", null, "en")).toBe(
            "http://h/survey?quiz=a+b%26c&lang=en",
        );
    });
});
