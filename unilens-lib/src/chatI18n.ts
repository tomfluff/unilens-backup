/**
 * Interface text of the chat, in Japanese and English (PRODUCT.md: the interface
 * follows the page's language, as the Display panel does). The model's answers are
 * not translated here; they come in whatever language the user asks in.
 *
 * Language: the chatLanguage setting, or on "auto" the page's `<html lang>` first
 * (the site's language is most likely its readers'), then the browser's languages.
 */
import { getSettings } from "./settings";

export type ChatLang = "en" | "ja";

export function chatLang(): ChatLang {
    const pick = getSettings().chatLanguage;
    if (pick === "en" || pick === "ja") return pick;
    const tags = [
        document.documentElement.lang,
        ...(typeof navigator !== "undefined"
            ? [...(navigator.languages ?? []), navigator.language]
            : []),
    ];
    for (const t of tags) {
        const l = (t ?? "").toLowerCase();
        if (l.startsWith("ja")) return "ja";
        if (l.startsWith("en")) return "en";
    }
    return "en";
}

const EN = {
    title: "UniLens",
    subtitle: "Ask about this page",
    pin: "Keep the chat here for the next question",
    unpin: "Stop keeping the chat here",
    close: "Close the chat",
    emptyHint: "Ask about what you clicked, or pick a quick action below.",
    placeholder: "Ask about this page…",
    send: "Send",
    micStart: "Speak your question",
    micStop: "Stop listening",
    readAloud: "Read aloud",
    stopReading: "Stop reading",
    preparingAudio: "Preparing audio…",
    quickExplain: "Explain this",
    quickSummary: "Summarize",
    quickTranslate: "Translate",
    promptExplain: "Explain what I am looking at, simply.",
    promptSummary: "Summarize this page briefly.",
    promptTranslate: "Translate the content I am looking at into English.",
    highlightAll: (n: number) => (n > 1 ? `Highlight all ${n}` : "Highlight"),
    prevEvidence: "Previous source",
    nextEvidence: "Next source",
    back: "Back",
    backTitle: "Return to where you were reading",
    whereClicked: "Where I clicked",
    whereClickedTitle: "Go back to where you clicked to ask this",
    ofN: (i: number, n: number) => `${i} of ${n}`,
    ofTotal: (n: number) => `of ${n}`,
    found: (n: number) => (n === 1 ? "1 place found" : `${n} places found`),
    evidenceLabel: (n: number, label: string) => `Source ${n}: ${label}`,
    // status line and live region
    sAsking: "Sent. Waiting for the answer…",
    sUpdatingView: "Sending your current view…",
    sAnswer: (n: number) =>
        n
            ? `Answer ready: ${n === 1 ? "1 source" : `${n} sources`}.`
            : "Answer ready.",
    sError: "Something went wrong. You can ask again.",
    sListening: "Listening… speak your question.",
    sStoppedListening: "Stopped listening.",
    sReading: "Reading the answer aloud.",
    sStoppedReading: "Stopped reading.",
    sCleared: "Outlines cleared.",
    sAll: (n: number, labels: string) =>
        n > 1 ? `Showing all ${n}: ${labels}.` : `Showing it: ${labels}.`,
    sItem: (i: number, n: number, label: string) =>
        n > 1 ? `Source ${i} of ${n}, ${label}` : `Source, ${label}`,
    sMoved: ". Brought into view; say back to return.",
    sWhere: (where: string) => `, ${where}.`,
    sBack: "Back to where you were.",
    sNoBack: "Nothing to go back to.",
    sPlace: (label: string, moved: boolean) =>
        `Where you clicked: ${label}.${moved ? " Say back to return." : ""}`,
    sNoPlace: "No click recorded yet.",
    sOnly: (n: number) =>
        n === 1 ? "There is only 1." : `There are only ${n}.`,
    sEnd: ".",
    sAllNote: (n: number) => (n > 1 ? `Showing all ${n}.` : "Showing it."),
    sItemNote: (i: number, n: number) => `Showing ${i} of ${n}.`,
    otherName: "ユニレンズ",
    sBackendError: (e: string) => `Could not reach UniLens: ${e}`,
    // directions from zoom.directionOf
    dir: {
        "on screen": "on screen",
        above: "above",
        below: "below",
        "to the left": "to the left",
        "to the right": "to the right",
        "": "",
    } as Record<string, string>,
};

type Strings = typeof EN;

const JA: Strings = {
    title: "UniLens",
    subtitle: "このページについて質問",
    pin: "次の質問でもチャットをこの位置に表示",
    unpin: "位置の固定をやめる",
    close: "チャットを閉じる",
    emptyHint:
        "クリックしたところについて質問するか、下のボタンを選んでください。",
    placeholder: "このページについて質問…",
    send: "送信",
    micStart: "声で質問する",
    micStop: "聞き取りを止める",
    readAloud: "読み上げる",
    stopReading: "読み上げを止める",
    preparingAudio: "音声を準備しています…",
    quickExplain: "説明して",
    quickSummary: "要約して",
    quickTranslate: "翻訳して",
    promptExplain: "今見ているものをやさしく説明してください。",
    promptSummary: "このページを短く要約してください。",
    promptTranslate: "今見ている内容を日本語に翻訳してください。",
    highlightAll: (n: number) => (n > 1 ? `${n}か所すべて表示` : "ハイライト"),
    prevEvidence: "前の出典",
    nextEvidence: "次の出典",
    back: "戻る",
    backTitle: "読んでいた場所に戻る",
    whereClicked: "クリックした場所",
    whereClickedTitle: "この質問をした場所に戻る",
    ofN: (i: number, n: number) => `${n}件中 ${i}`,
    ofTotal: (n: number) => `${n}件中`,
    found: (n: number) => `${n}か所見つかりました`,
    evidenceLabel: (n: number, label: string) => `出典 ${n}: ${label}`,
    sAsking: "送信しました。回答を待っています…",
    sUpdatingView: "今の表示を送っています…",
    sAnswer: (n: number) =>
        n ? `回答しました。出典 ${n}件。` : "回答しました。",
    sError: "エラーが起きました。もう一度質問できます。",
    sListening: "聞き取り中… 質問をどうぞ。",
    sStoppedListening: "聞き取りを止めました。",
    sReading: "回答を読み上げています。",
    sStoppedReading: "読み上げを止めました。",
    sCleared: "ハイライトを消しました。",
    sAll: (n: number, labels: string) =>
        n > 1
            ? `${n}か所すべて表示: ${labels}。`
            : `表示しています: ${labels}。`,
    sItem: (i: number, n: number, label: string) =>
        n > 1 ? `出典 ${n}件中 ${i}、${label}` : `出典、${label}`,
    sMoved: "。表示しました。「戻る」で元の場所に戻れます。",
    sWhere: (where: string) => `、${where}。`,
    sBack: "元の場所に戻りました。",
    sNoBack: "戻る場所がありません。",
    sPlace: (label: string, moved: boolean) =>
        `クリックした場所: ${label}。${moved ? "「戻る」で元の場所に戻れます。" : ""}`,
    sNoPlace: "まだクリックした場所がありません。",
    sOnly: (n: number) => `${n}件しかありません。`,
    sEnd: "。",
    sAllNote: (n: number) =>
        n > 1 ? `${n}か所すべて表示しています。` : "表示しています。",
    sItemNote: (i: number, n: number) => `${n}件中 ${i}件目を表示しています。`,
    otherName: "UniLens",
    sBackendError: (e: string) => `UniLens に接続できません: ${e}`,
    dir: {
        "on screen": "画面内",
        above: "上にあります",
        below: "下にあります",
        "to the left": "左にあります",
        "to the right": "右にあります",
        "": "",
    },
};

export const chatText = (): Strings => (chatLang() === "ja" ? JA : EN);
