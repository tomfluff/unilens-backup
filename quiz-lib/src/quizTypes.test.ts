import { describe, expect, it } from "vitest";
import { normalizeQuiz, toLocalizedText } from "./quizTypes";

describe("normalizeQuiz", () => {
    it("fills in ids, the default type and the defaults", () => {
        const { quiz, errors } = normalizeQuiz({
            id: "demo",
            questions: [{ prompt: "2 + 2?", choices: ["3", "4"], answer: 1 }],
        });
        expect(errors).toEqual([]);
        expect(quiz).toEqual({
            id: "demo",
            questions: [
                {
                    id: "q1",
                    type: "single",
                    prompt: "2 + 2?",
                    choices: [
                        { id: "c1", text: "3" },
                        { id: "c2", text: "4" },
                    ],
                    answer: "c2",
                },
            ],
            showFeedback: false,
            shuffleChoices: false,
        });
    });

    it("takes choice objects, answers by id, and per-language text", () => {
        const { quiz } = normalizeQuiz({
            id: "q",
            title: { ja: "確認", en: "Check" },
            questions: [
                {
                    id: "plan",
                    type: "multiple",
                    prompt: { ja: "どれ？", en: "Which?" },
                    choices: [
                        { id: "a", text: { ja: "あ", en: "A" } },
                        { id: "b", text: "B" },
                        { id: "c", text: "C" },
                    ],
                    answer: ["c", 0, "c"],
                },
            ],
        });
        const q = quiz?.questions[0];
        expect(quiz?.title).toEqual({ ja: "確認", en: "Check" });
        expect(q?.type).toBe("multiple");
        // repeated references collapse
        expect(q && "answer" in q ? q.answer : null).toEqual(["c", "a"]);
    });

    it("skips a broken question and keeps the rest", () => {
        const { quiz, errors } = normalizeQuiz({
            id: "q",
            questions: [
                { prompt: "no choices", answer: 0 },
                {
                    prompt: "answer out of range",
                    choices: ["a", "b"],
                    answer: 5,
                },
                { type: "essay", prompt: "x" },
                {
                    type: "text",
                    prompt: "Capital of Japan?",
                    answer: ["Tokyo", "東京"],
                },
            ],
        });
        expect(quiz?.questions.map((q) => q.type)).toEqual(["text"]);
        expect(errors).toHaveLength(3);
    });

    it("takes questions without an answer key as survey items", () => {
        const { quiz, errors } = normalizeQuiz({
            id: "survey",
            questions: [
                { prompt: "Which?", choices: ["a", "b"] },
                { type: "multiple", prompt: "All?", choices: ["a", "b"] },
                { type: "text", prompt: "Why?" },
            ],
        });
        expect(errors).toEqual([]);
        expect(quiz?.questions.map((q) => q.type)).toEqual([
            "single",
            "multiple",
            "text",
        ]);
        expect(quiz?.questions[0]).toEqual({
            id: "q1",
            type: "single",
            prompt: "Which?",
            choices: [
                { id: "c1", text: "a" },
                { id: "c2", text: "b" },
            ],
        });
        expect(quiz?.questions[2]).toEqual({
            id: "q3",
            type: "text",
            prompt: "Why?",
            accepted: [],
            caseSensitive: false,
        });
    });

    it("rejects a quiz without a usable id or questions", () => {
        expect(normalizeQuiz({ questions: [] }).quiz).toBeNull();
        expect(normalizeQuiz({ id: "../x", questions: [] }).quiz).toBeNull();
        expect(normalizeQuiz({ id: "ok", questions: [] }).quiz).toBeNull();
        expect(normalizeQuiz("nope").quiz).toBeNull();
    });

    it("refuses repeated question ids", () => {
        const { quiz, errors } = normalizeQuiz({
            id: "q",
            questions: [
                { id: "a", prompt: "1", choices: ["x", "y"], answer: 0 },
                { id: "a", prompt: "2", choices: ["x", "y"], answer: 0 },
            ],
        });
        expect(quiz?.questions).toHaveLength(1);
        expect(errors).toHaveLength(1);
    });
});

describe("toLocalizedText", () => {
    it("keeps strings and known languages, drops empties", () => {
        expect(toLocalizedText("a")).toBe("a");
        expect(toLocalizedText("  ")).toBeNull();
        expect(toLocalizedText({ ja: "あ", fr: "x", en: "" })).toEqual({
            ja: "あ",
        });
        expect(toLocalizedText({ fr: "x" })).toBeNull();
        expect(toLocalizedText(3)).toBeNull();
    });
});
