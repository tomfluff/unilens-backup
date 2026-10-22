/**
 * Visitor-facing strings, Japanese and English (PRODUCT.md: the interface
 * follows the page or browser language). The quiz's own text (title, prompts,
 * choices) comes from the host as LocalizedText and is resolved by localize().
 */

import { type LocalizedText, QUIZ_LANGS, type QuizLang } from "./quizTypes";

export interface QuizMessages {
    toggle: string;
    /** accessible name of the toggle, with progress */
    toggleLabel: (answered: number, total: number) => string;
    /** accessible name of the link to the survey page (link mode) */
    openSurvey: string;
    /** link mode: the button's text with the next question, "アンケート（2/4）" */
    surveyAt: (next: number, total: number) => string;
    /** link mode: the button's text once every question is answered */
    surveyDone: string;
    /** link mode: the button's accessible name (starts with its visible text) */
    surveyAtLabel: (next: number, total: number) => string;
    surveyDoneLabel: string;
    /** one question's page: after the answer */
    savedTitle: string;
    /** one question's page, opened again after it was answered */
    alreadyAnswered: string;
    answeredOf: (answered: number, total: number) => string;
    allAnswered: string;
    backToPage: string;
    /** the same way back, on the last page (every question answered) */
    finishSurvey: string;
    backNote: string;
    /** the same, when the survey has a tab of its own (going back closes it) */
    backNoteTab: string;
    nextQuestionAt: (next: number, total: number) => string;
    /** before the first question: the respondent types two IDs */
    idsLead: string;
    userIdLabel: string;
    surveyIdLabel: string;
    idHint: string;
    idMissing: (label: string) => string;
    idInvalid: (label: string) => string;
    /** on every screen after: who is answering */
    idsShown: (userId: string, surveyId: string) => string;
    /** the start button, when the attempt had begun before the IDs were asked */
    resume: string;
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
    /** last screen with feedback off: thanks (the answers are not listed again) */
    doneTitle: string;
    doneNote: string;
    /** last screen with feedback on: the score */
    resultTitle: string;
    score: (correct: number, total: number) => string;
    percent: (p: number) => string;
    questionN: (n: number) => string;
    choiceCorrectMark: string;
    choicePickedMark: string;
}

const ja: QuizMessages = {
    toggle: "アンケート",
    toggleLabel: (a, t) => `アンケート（全${t}問中${a}問回答済み）`,
    openSurvey: "アンケートに回答する（新しいタブでアンケートのページを開く）",
    surveyAt: (n, t) => `アンケート（${n}/${t}）`,
    surveyDone: "アンケート（完了）",
    surveyAtLabel: (n, t) =>
        `アンケート（${n}/${t}）：${t}問中${n}問目に回答する（新しいタブで開く）`,
    surveyDoneLabel: "アンケート（完了）：お礼のページを開く（新しいタブで開く）",
    savedTitle: "回答を記録しました",
    alreadyAnswered: "この質問には回答済みです",
    answeredOf: (a, t) => `${t}問中 ${a}問に回答済み`,
    allAnswered: "すべての質問に回答しました。ご協力ありがとうございました。",
    backToPage: "元のページに戻る",
    finishSurvey: "アンケートを終了する",
    backNote: "元のページに戻って、作業を続けてください。",
    backNoteTab:
        "「元のページに戻る」でこのタブを閉じ、元のページで作業を続けてください。",
    nextQuestionAt: (n, t) => `次の質問へ（${n}/${t}）`,
    idsLead: "回答を始める前に、ユーザーIDとアンケートIDを入力してください。",
    userIdLabel: "ユーザーID",
    surveyIdLabel: "アンケートID",
    idHint: "半角英数字と「-」「_」で入力してください（32文字まで）。",
    idMissing: (l) => `${l}を入力してください`,
    idInvalid: (l) =>
        `${l}は半角英数字と「-」「_」で入力してください（32文字まで）`,
    idsShown: (u, s) => `ユーザーID：${u}　アンケートID：${s}`,
    resume: "回答を続ける",
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
    doneNote: "すべての質問への回答を記録しました。",
    resultTitle: "結果",
    score: (c, t) => `${t}問中 ${c}問正解`,
    percent: (p) => `正答率 ${p}%`,
    questionN: (n) => `質問 ${n}`,
    choiceCorrectMark: "正解",
    choicePickedMark: "あなたの回答",
};

const en: QuizMessages = {
    toggle: "Survey",
    toggleLabel: (a, t) => `Survey (${a} of ${t} answered)`,
    openSurvey: "Survey: answer it (opens the survey in a new tab)",
    surveyAt: (n, t) => `Survey (${n}/${t})`,
    surveyDone: "Survey (done)",
    surveyAtLabel: (n, t) =>
        `Survey (${n}/${t}): answer question ${n} of ${t} (opens the survey in a new tab)`,
    surveyDoneLabel:
        "Survey (done): open the thank-you page (opens the survey in a new tab)",
    savedTitle: "Your answer is saved",
    alreadyAnswered: "You have answered this question",
    answeredOf: (a, t) => `${a} of ${t} questions answered`,
    allAnswered: "You have answered every question. Thank you for taking part.",
    backToPage: "Back to the page",
    finishSurvey: "Finish the survey",
    backNote: "Please go back to the page and carry on.",
    backNoteTab:
        "“Back to the page” closes this tab; carry on in the page you came from.",
    nextQuestionAt: (n, t) => `Next question (${n}/${t})`,
    idsLead: "Before you start, enter your user ID and survey ID.",
    userIdLabel: "User ID",
    surveyIdLabel: "Survey ID",
    idHint: "Use letters, digits, - and _ (up to 32 characters).",
    idMissing: (l) => `Enter your ${l}`,
    idInvalid: (l) =>
        `${l}: use letters, digits, - and _ only (up to 32 characters)`,
    idsShown: (u, s) => `User ID: ${u} · Survey ID: ${s}`,
    resume: "Continue",
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
    doneNote: "All your answers are recorded.",
    resultTitle: "Results",
    score: (c, t) => `${c} of ${t} correct`,
    percent: (p) => `${p}% correct`,
    questionN: (n) => `Question ${n}`,
    choiceCorrectMark: "Correct answer",
    choicePickedMark: "Your answer",
};

export const MESSAGES: Record<QuizLang, QuizMessages> = { ja, en };

/**
 * The survey is shown in Japanese only: no language switch, whatever the page's
 * or browser's language (the study's request). A survey's `{ "ja", "en" }` text
 * shows its Japanese; the English messages above stay for a return to two languages.
 */
export const SURVEY_LANG: QuizLang = "ja";

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
