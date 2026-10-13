import { describe, expect, it } from "vitest";
import {
    correctChoiceIds,
    isAnswerable,
    isCorrect,
    isGraded,
    normalizeTextAnswer,
    orderedChoices,
    quizFingerprint,
    scoreOf,
} from "./quizLogic";
import { normalizeQuiz, type Quiz } from "./quizTypes";

const quiz = normalizeQuiz({
    id: "t",
    questions: [
        { id: "one", prompt: "p", choices: ["a", "b", "c"], answer: 1 },
        { id: "many", type: "multiple", prompt: "p", choices: ["a", "b", "c"], answer: [0, 2] },
        { id: "typed", type: "text", prompt: "p", answer: ["Tokyo", "東京"] },
        { id: "exact", type: "text", prompt: "p", answer: "ABC", caseSensitive: true },
    ],
}).quiz as Quiz;
const [one, many, typed, exact] = quiz.questions;

describe("isCorrect", () => {
    it("grades a single choice", () => {
        expect(isCorrect(one, "c2")).toBe(true);
        expect(isCorrect(one, "c1")).toBe(false);
        expect(isCorrect(one, ["c2"])).toBe(false);
    });

    it("needs exactly the correct set for multiple choice", () => {
        expect(isCorrect(many, ["c3", "c1"])).toBe(true);
        expect(isCorrect(many, ["c1"])).toBe(false);
        expect(isCorrect(many, ["c1", "c2", "c3"])).toBe(false);
        expect(isCorrect(many, "c1")).toBe(false);
    });

    it("compares typed answers after normalization", () => {
        expect(isCorrect(typed, "  tokyo ")).toBe(true);
        expect(isCorrect(typed, "ＴＯＫＹＯ")).toBe(true);
        expect(isCorrect(typed, "東京")).toBe(true);
        expect(isCorrect(typed, "Kyoto")).toBe(false);
        expect(isCorrect(exact, "ABC")).toBe(true);
        expect(isCorrect(exact, "abc")).toBe(false);
    });
});

describe("survey items (no answer key)", () => {
    const survey = normalizeQuiz({
        id: "s",
        questions: [
            { prompt: "p", choices: ["a", "b"] },
            { type: "multiple", prompt: "p", choices: ["a", "b"] },
            { type: "text", prompt: "p" },
        ],
    }).quiz as Quiz;

    it("are not graded", () => {
        for (const q of survey.questions) expect(isGraded(q)).toBe(false);
        expect(isCorrect(survey.questions[0], "c1")).toBeNull();
        expect(isCorrect(survey.questions[1], ["c1"])).toBeNull();
        expect(isCorrect(survey.questions[2], "anything")).toBeNull();
        expect(correctChoiceIds(survey.questions[0])).toEqual([]);
        expect(isGraded(one)).toBe(true);
    });

    it("count as answered, never as correct", () => {
        expect(
            scoreOf(survey, { q1: { correct: null }, q2: { correct: null } }),
        ).toEqual({ correct: 0, answered: 2, total: 3 });
    });
});

describe("normalizeTextAnswer", () => {
    it("folds width, space and case", () => {
        expect(normalizeTextAnswer("　５Ｇ　プラン ")).toBe("5g プラン");
        expect(normalizeTextAnswer("ﾌﾟﾗﾝ")).toBe("プラン");
        expect(normalizeTextAnswer("A  b", true)).toBe("A b");
    });
});

describe("isAnswerable", () => {
    it("wants something picked or typed", () => {
        expect(isAnswerable(one, undefined)).toBe(false);
        expect(isAnswerable(one, "c1")).toBe(true);
        expect(isAnswerable(many, [])).toBe(false);
        expect(isAnswerable(many, ["c1"])).toBe(true);
        expect(isAnswerable(typed, "   ")).toBe(false);
    });
});

describe("scoreOf", () => {
    it("counts answered and correct", () => {
        expect(
            scoreOf(quiz, { one: { correct: true }, typed: { correct: false } }),
        ).toEqual({ correct: 1, answered: 2, total: 4 });
    });
});

describe("orderedChoices", () => {
    const choices = "abcdefgh".split("").map((id) => ({ id, text: id }));

    it("keeps the order when not shuffling", () => {
        expect(orderedChoices(choices, false, "x")).toBe(choices);
    });

    it("deals the same order for the same seed, and every choice once", () => {
        const a = orderedChoices(choices, true, "attempt1:q1");
        expect(orderedChoices(choices, true, "attempt1:q1")).toEqual(a);
        expect(a.map((c) => c.id).sort()).toEqual(choices.map((c) => c.id));
        const others = ["s1", "s2", "s3", "s4", "s5"].map((s) =>
            orderedChoices(choices, true, s).map((c) => c.id).join(""),
        );
        expect(new Set(others).size > 1).toBe(true);
    });
});

describe("quizFingerprint", () => {
    it("changes when the content changes", () => {
        const edited = { ...quiz, questions: quiz.questions.slice(1) };
        expect(quizFingerprint(quiz)).toBe(quizFingerprint({ ...quiz }));
        expect(quizFingerprint(edited) === quizFingerprint(quiz)).toBe(false);
    });
});
