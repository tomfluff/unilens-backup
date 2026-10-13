/**
 * Visitor-facing strings, Japanese and English (PRODUCT.md: the interface
 * follows the page or browser language). The quiz's own text (title, prompts,
 * choices) comes from the host as LocalizedText and is resolved by localize().
 */

import { type LocalizedText, QUIZ_LANGS, type QuizLang } from "./quizTypes";

export interface QuizMessages {
    toggle: string;
    /** name of the language switch group */
    language: string;
    /** read out after switching, in the new language */
    languageChanged: string;
    /** accessible name of the toggle, with progress */
    toggleLabel: (answered: number, total: number) => string;
    close: string;
    defaultTitle: string;
    questionCount: (n: number) => string;
    start: string;
    progress: (i: number, total: number) => string;
    chooseOne: string;
    chooseAll: string;
    typeAnswer: string;
    submit: string;
    needAnswer: string;
    correct: string;
    incorrect: string;
    correctAnswer: string;
    acceptedAnswers: string;
    yourAnswer: string;
    noAnswer: string;
    explanation: string;
    next: string;
    seeResult: string;
    /** last screen with feedback off: thanks, then the visitor's own answers */
    doneTitle: string;
    doneNote: string;
    /** last screen with feedback on: the score */
    resultTitle: string;
    score: (correct: number, total: number) => string;
    percent: (p: number) => string;
    retry: string;
    questionN: (n: number) => string;
    choiceCorrectMark: string;
    choicePickedMark: string;
}

const ja: QuizMessages = {
    toggle: "アンケート",
    language: "表示言語",
    languageChanged: "日本語で表示しています",
    toggleLabel: (a, t) => `アンケート（全${t}問中${a}問回答済み）`,
    close: "閉じる",
    defaultTitle: "アンケート",
    questionCount: (n) => `全${n}問`,
    start: "はじめる",
    progress: (i, t) => `${t}問中 ${i}問目`,
    chooseOne: "1つ選んでください",
    chooseAll: "当てはまるものをすべて選んでください",
    typeAnswer: "回答を入力してください",
    submit: "回答する",
    needAnswer: "まだ回答されていません",
    correct: "正解",
    incorrect: "不正解",
    correctAnswer: "正解",
    acceptedAnswers: "正解の例",
    yourAnswer: "あなたの回答",
    noAnswer: "（未回答）",
    explanation: "解説",
    next: "次の質問へ",
    seeResult: "結果を見る",
    doneTitle: "回答ありがとうございました",
    doneNote: "回答内容は次のとおりです。",
    resultTitle: "結果",
    score: (c, t) => `${t}問中 ${c}問正解`,
    percent: (p) => `正答率 ${p}%`,
    retry: "もう一度回答する",
    questionN: (n) => `質問 ${n}`,
    choiceCorrectMark: "正解",
    choicePickedMark: "あなたの回答",
};

const en: QuizMessages = {
    toggle: "Survey",
    language: "Language",
    languageChanged: "Now showing in English",
    toggleLabel: (a, t) => `Survey (${a} of ${t} answered)`,
    close: "Close",
    defaultTitle: "Survey",
    questionCount: (n) => (n === 1 ? "1 question" : `${n} questions`),
    start: "Start",
    progress: (i, t) => `Question ${i} of ${t}`,
    chooseOne: "Choose one",
    chooseAll: "Choose all that apply",
    typeAnswer: "Type your answer",
    submit: "Submit answer",
    needAnswer: "Not answered yet",
    correct: "Correct",
    incorrect: "Incorrect",
    correctAnswer: "Correct answer",
    acceptedAnswers: "Accepted answers",
    yourAnswer: "Your answer",
    noAnswer: "(not answered)",
    explanation: "Explanation",
    next: "Next question",
    seeResult: "See results",
    doneTitle: "Thank you for your answers",
    doneNote: "Here is what you answered.",
    resultTitle: "Results",
    score: (c, t) => `${c} of ${t} correct`,
    percent: (p) => `${p}% correct`,
    retry: "Answer again",
    questionN: (n) => `Question ${n}`,
    choiceCorrectMark: "Correct answer",
    choicePickedMark: "Your answer",
};

export const MESSAGES: Record<QuizLang, QuizMessages> = { ja, en };

/** Each language's name in itself, for the switch (a visitor finds their own). */
export const LANG_NAMES: Record<QuizLang, string> = {
    ja: "日本語",
    en: "English",
};

export const isQuizLang = (v: unknown): v is QuizLang =>
    (QUIZ_LANGS as readonly unknown[]).includes(v);

/** The first of `tags` (BCP 47, e.g. "ja-JP") that is a supported language, else English. */
export function pickLang(
    tags: readonly (string | null | undefined)[],
): QuizLang {
    for (const tag of tags) {
        const base = tag?.trim().toLowerCase().split("-")[0];
        if (isQuizLang(base)) return base;
    }
    return "en";
}

/** The page's language, then the browser's (the same order as the display panel). */
export function detectLang(): QuizLang {
    const tags: (string | undefined)[] = [document.documentElement.lang];
    if (typeof navigator !== "undefined")
        tags.push(...(navigator.languages ?? []), navigator.language);
    return pickLang(tags);
}

/** Host text in `lang`, else the other language, so a one-language quiz still shows. */
export function localize(
    text: LocalizedText | undefined,
    lang: QuizLang,
): string {
    if (text === undefined) return "";
    if (typeof text === "string") return text;
    return text[lang] ?? QUIZ_LANGS.map((l) => text[l]).find((s) => s) ?? "";
}
