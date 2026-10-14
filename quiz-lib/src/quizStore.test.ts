import { describe, expect, it } from "vitest";
import {
    currentAttempt,
    goToQuestion,
    recordAnswer,
    startAttempt,
} from "./quizStore";

describe("each question's start time", () => {
    it("is stored as the attempt starts, and again for each next question", async () => {
        const before = Date.now();
        const a = startAttempt("timing#P01#1", "fp");
        expect((a.shownAt ?? 0) >= before).toBe(true);
        recordAnswer("timing#P01#1", "q1", {
            response: "c1",
            responseText: "A",
            correct: null,
            at: Date.now(),
            ms: 1,
        });
        await new Promise((r) => setTimeout(r, 5));
        goToQuestion("timing#P01#1", 1);
        const next = currentAttempt("timing#P01#1", "fp", 4);
        expect(next?.index).toBe(1);
        // the second question's clock starts when it appears, not at the attempt's start
        expect((next?.shownAt ?? 0) > (a.shownAt ?? 0)).toBe(true);
    });
});
