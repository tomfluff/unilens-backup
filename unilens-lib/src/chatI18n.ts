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
    /** the station sign's main name; otherName is the other language below it */
    stationName: "UniLens",
    pin: "Keep the chat here for the next question",
    unpin: "Stop keeping the chat here",
    close: "Close the chat",
    minimize: "Minimize the chat",
    expand: "Show the whole chat",
    sMinimized: "Chat minimized to its header.",
    sExpanded: "Chat shown in full.",
    emptyHint: "Ask about what you clicked, or pick a quick action below.",
    placeholder: "Ask about this page…",
    send: "Send",
    micStart: "Speak your question",
    micStop: "Stop listening",
    readAloud: "Read aloud",
    stopReading: "Stop reading",
    preparingAudio: "Preparing audio…",
    quickExplain: "Explain",
    quickSummary: "Summarize",
    quickTranslate: "Translate",
    promptExplain: "Explain what I am looking at, simply.",
    promptSummary: "Summarize this page briefly.",
    promptTranslate: "Translate the content I am looking at into English.",
    highlightAll: (n: number) => (n > 1 ? `Highlight all ${n}` : "Highlight"),
    allShort: "All",
    prevEvidence: "Previous source",
    nextEvidence: "Next source",
    back: "Back",
    backTitle: "Return to where you were reading",
    placeEntry: (n: number, label: string) =>
        `Where you clicked, P${n}: ${label}. Go there`,
    evidenceLabel: (n: number, label: string) => `Source ${n}: ${label}`,
    // status line and live region
    sAsking: "Sent. Waiting for the answer…",
    sCapturing: "Capturing what you clicked…",
    sNewPlace: (n: number, label: string) =>
        `New place, P${n}: ${label}. Ask about it.`,
    sCovered: " The chat is minimized so it does not cover the source.",
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
    sMoved: ". Moved there; Back returns you.",
    sWhere: (where: string) => `, ${where}.`,
    sBack: "Back to where you were.",
    sNoBack: "Nothing to go back to.",
    sPlace: (label: string, moved: boolean) =>
        `Where you clicked: ${label}.${moved ? " Back returns you." : ""}`,
    sNoPlace: "No click recorded yet.",
    sOnly: (n: number) =>
        n === 1 ? "There is only 1." : `There are only ${n}.`,
    sEnd: ".",
    sAllNote: (n: number) => (n > 1 ? `Showing all ${n}.` : "Showing it."),
    sItemNote: (i: number, n: number) => `Showing ${i} of ${n}.`,
    otherName: "ユニレンズ",
    placeRegion: "the area you selected",
    placeClick: "where you clicked",
    placeNear: (h: string) => `near "${h}"`,
    placeTag: (tag: string) => `the ${tag}`,
    sBackendError:
        "Could not reach UniLens. Check the connection and ask again.",
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
    stationName: "ユニレンズ",
    pin: "次の質問でもチャットをこの位置に表示",
    unpin: "位置の固定をやめる",
    close: "チャットを閉じる",
    minimize: "チャットを最小化",
    expand: "チャット全体を表示",
    sMinimized: "チャットを最小化しました。",
    sExpanded: "チャット全体を表示しました。",
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
    allShort: "すべて",
    prevEvidence: "前の出典",
    nextEvidence: "次の出典",
    back: "戻る",
    backTitle: "読んでいた場所に戻る",
    placeEntry: (n: number, label: string) =>
        `クリックした場所 P${n}: ${label}。移動する`,
    evidenceLabel: (n: number, label: string) => `出典 ${n}: ${label}`,
    sAsking: "送信しました。回答を待っています…",
    sCapturing: "クリックした場所を取り込んでいます…",
    sNewPlace: (n: number, label: string) =>
        `新しい場所 P${n}: ${label}。質問をどうぞ。`,
    sCovered: "出典が隠れないよう、チャットを最小化しました。",
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
        n > 1 ? `出典 ${n}件中 ${i}件目、${label}` : `出典、${label}`,
    sMoved: "。移動しました。「戻る」で元の場所へ。",
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
    placeRegion: "選択した範囲",
    placeClick: "クリックした場所",
    placeNear: (h: string) => `「${h}」の近く`,
    placeTag: (tag: string) => `${tag} 要素`,
    sBackendError:
        "UniLens に接続できません。接続を確認して、もう一度質問してください。",
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
