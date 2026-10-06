/**
 * The settings panel's words, in English and Japanese (it follows the chat's
 * language). The participant's own settings carry a label and a one-line hint in
 * both; the research variables keep their English labels in settings.ts.
 */
import type { PanelTabId, Settings } from "./settings";

export type PanelLang = "en" | "ja";

const EN = {
    title: "UniLens settings",
    open: "UniLens settings",
    /** a study preset is on (presets.ts): for the facilitator, who opened the panel
     *  with its hidden key */
    presetOn: (name: string) =>
        `Preset on: ${name}. Changes made here last until this tab is closed. Ctrl+Alt+Shift+B switches the preset.`,
    close: "Close settings",
    preview: "Preview",
    tabs: {
        general: "General",
        look: "Look and feel",
        conversation: "Conversation",
        zoom: "Zoom",
        voice: "Voice and sound",
        ai: "AI",
        advanced: "Advanced",
    } satisfies Record<PanelTabId, string>,
    groups: {
        chat: "The chat",
        highlight: "Highlight",
        cues: "Off-screen arrows",
        clickFeedback: "Click feedback",
        movement: "Movement",
        conversation: "Asking and answers",
        zoom: "Zoom",
        minimap: "Minimap",
        voiceSound: "Voice and sound",
        live: "Live conversation",
        models: "Answers",
        speech: "Speech",
        liveModels: "Live conversation",
        capture: "What the assistant sees",
        inventory: "Page structure",
        diagnostics: "Diagnostics",
    } as Record<string, string>,
    more: (n: number) => `More options (${n})`,
    changed: "Changed",
    previewChat: "Preview of the chat with these settings",
    previewPage: "Preview of a highlighted source with these settings",
    sampleQuestion: "When does the museum open?",
    /** the answer as the model writes it: the words a source supports in {{ }}, then
     *  its marker; the chat's own renderer turns them into a chip and an underline */
    sampleCited: "It opens at {{9:30 on weekdays}} [[n1]].",
    samplePlace: "Opening hours",
    sampleSource: "Open 9:30–17:00 (sample)",
    hearSound: "Hear the action sound",
    tryFx: "Try the click feedback",
    custom: "Other colour",
    search: "Find a setting",
    noMatch: (q: string) => `No setting matches “${q}”.`,
    hiddenNow: "Shown only with another setting on",
    reset: "Reset this tab",
    resetDone: (tab: string) => `${tab} is back to the defaults.`,
    save: "Save all settings",
    load: "Load settings…",
    saved: "Settings saved to a file.",
    loaded: (n: number) => `Loaded ${n} settings.`,
    ignored: (n: number, names: string) => ` Ignored ${n} unknown: ${names}.`,
    tooLarge: "That file is too large to be UniLens settings.",
    notSettings: "That file is not UniLens settings. Nothing changed.",
    zoomOut: "Zoom out",
    zoomIn: "Zoom in",
    zoomReset: "Back to 100%",
    on: "On",
    off: "Off",
    // the AI catalogue's choices
    providerDefault: (m?: string) => `Provider default${m ? ` (${m})` : ""}`,
    byDefault: (m?: string) => `Default${m ? ` (${m})` : ""}`,
    liveNoKey: "Live unavailable (no key)",
    readNoKey: "Read aloud unavailable (no key)",
    unreachable: "Backend unreachable",
    notForModel: "Not for this model",
    edgeGlow: "Edge glow",
};

const JA: typeof EN = {
    title: "UniLens 設定",
    open: "UniLens 設定",
    presetOn: (name: string) =>
        `プリセット使用中：${name}。ここでの変更はこのタブを閉じるまで有効です。Ctrl＋Alt＋Shift＋B でプリセットを切り替えます。`,
    close: "設定を閉じる",
    preview: "プレビュー",
    tabs: {
        general: "一般",
        look: "見た目と操作感",
        conversation: "会話",
        zoom: "拡大",
        voice: "音声と音",
        ai: "AI",
        advanced: "詳細",
    },
    groups: {
        chat: "チャット",
        highlight: "ハイライト",
        cues: "画面外の矢印",
        clickFeedback: "クリックの反応",
        movement: "移動",
        conversation: "質問と回答",
        zoom: "拡大",
        minimap: "ミニマップ",
        voiceSound: "音声と音",
        live: "ライブ会話",
        models: "回答",
        speech: "音声",
        liveModels: "ライブ会話",
        capture: "アシスタントが見るもの",
        inventory: "ページの構造",
        diagnostics: "診断",
    },
    more: (n) => `その他の設定（${n}）`,
    changed: "変更あり",
    previewChat: "この設定でのチャットのプレビュー",
    previewPage: "この設定でのハイライトのプレビュー",
    sampleQuestion: "博物館は何時に開きますか？",
    sampleCited: "開館は{{平日の 9 時 30 分}} [[n1]]です。",
    samplePlace: "開館時間",
    sampleSource: "開館 9:30〜17:00（見本）",
    hearSound: "操作音を聞く",
    tryFx: "クリックの反応を試す",
    custom: "その他の色",
    search: "設定を検索",
    noMatch: (q) => `「${q}」に合う設定はありません。`,
    hiddenNow: "別の設定がオンのときだけ表示",
    reset: "このタブを初期値に戻す",
    resetDone: (tab) => `「${tab}」を初期値に戻しました。`,
    save: "すべての設定を保存",
    load: "設定を読み込む…",
    saved: "設定をファイルに保存しました。",
    loaded: (n) => `${n} 件の設定を読み込みました。`,
    ignored: (n, names) => ` 不明な ${n} 件は無視しました：${names}。`,
    tooLarge: "UniLens の設定にしては大きすぎるファイルです。",
    notSettings: "UniLens の設定ファイルではありません。何も変わっていません。",
    zoomOut: "縮小",
    zoomIn: "拡大",
    zoomReset: "100% に戻す",
    on: "オン",
    off: "オフ",
    providerDefault: (m) => `提供元の既定${m ? `（${m}）` : ""}`,
    byDefault: (m) => `既定${m ? `（${m}）` : ""}`,
    liveNoKey: "ライブ会話は使えません（キーがありません）",
    readNoKey: "読み上げは使えません（キーがありません）",
    unreachable: "サーバーにつながりません",
    notForModel: "このモデルにはありません",
    edgeGlow: "縁が光る",
};

export const PANEL_TEXT: Record<PanelLang, typeof EN> = { en: EN, ja: JA };

type Words = { en: string; ja: string };
/** the participant's settings: what each is called, and one line on what it does */
export const OWN_SETTINGS: Partial<
    Record<keyof Settings, { label: Words; hint?: Words }>
> = {
    chatStyle: {
        label: { en: "Chat look", ja: "チャットの見た目" },
    },
    chatLanguage: { label: { en: "Language", ja: "言語" } },
    chatFontSize: {
        label: { en: "Chat size", ja: "チャットの大きさ" },
        hint: {
            en: "The whole chat: words, buttons and panel",
            ja: "文字・ボタン・パネル全体",
        },
    },
    chatTextScale: {
        label: { en: "Text size", ja: "文字の大きさ" },
        hint: { en: "The words of the messages", ja: "メッセージの文字" },
    },
    highContrast: {
        label: { en: "High contrast", ja: "ハイコントラスト" },
        hint: { en: "Black, white and yellow", ja: "黒・白・黄色で表示" },
    },
    quickActions: {
        label: { en: "Quick-action buttons", ja: "クイック操作ボタン" },
        hint: { en: "Explain, Summarize, Translate", ja: "説明・要約・翻訳" },
    },
    dragPopover: {
        label: {
            en: "Move the chat by its title",
            ja: "タイトルでチャットを動かす",
        },
    },
    continuity: {
        label: {
            en: "One conversation across clicks",
            ja: "クリックをまたいで会話を続ける",
        },
    },
    restoreAfterReload: {
        label: {
            en: "Keep it after the page reloads",
            ja: "再読み込み後も会話を残す",
        },
    },
    hlColor: {
        label: { en: "Highlight colour", ja: "ハイライトの色" },
        hint: {
            en: "Around the sources on the page",
            ja: "ページ上の根拠を囲む色",
        },
    },
    minimap: {
        label: { en: "Minimap", ja: "ミニマップ" },
        hint: {
            en: "A small map of the whole page",
            ja: "ページ全体の小さな地図",
        },
    },
    zoom: {
        label: { en: "Page zoom", ja: "ページの拡大" },
        hint: { en: "Ctrl + mouse wheel", ja: "Ctrl＋マウスホイール" },
    },
    motion: {
        label: { en: "Moving to a source", ja: "根拠への移動" },
    },
    zoomKeys: {
        label: {
            en: "Zoom keys (Ctrl + / − / 0)",
            ja: "拡大キー（Ctrl＋ / − / 0）",
        },
    },
    smoothZoom: { label: { en: "Smooth zoom", ja: "なめらかに拡大" } },
    smartZoom: {
        label: { en: "Double-click to fit", ja: "ダブルクリックで合わせる" },
    },
    voiceInput: {
        label: { en: "Speak your question", ja: "声で質問する" },
        hint: { en: "The microphone button", ja: "マイクのボタン" },
    },
    liveTalk: {
        label: { en: "Talk live", ja: "ライブで話す" },
        hint: {
            en: "The Live button: a spoken conversation",
            ja: "ライブのボタン：声で会話する",
        },
    },
    autoRead: { label: { en: "Read answers aloud", ja: "回答を読み上げる" } },
    sounds: {
        label: { en: "A sound for every action", ja: "操作ごとの音" },
    },
    voiceAutoSend: {
        label: { en: "Send when I pause", ja: "話し終えたら送信" },
    },
    ttsVoice: { label: { en: "Reading voice", ja: "読み上げの声" } },
};

/** the participant's choices, in both languages; Study keeps settings.ts's labels */
export const OWN_CHOICES: Partial<
    Record<keyof Settings, Record<string, Words>>
> = {
    chatStyle: {
        assistant: { en: "Assistant", ja: "アシスタント" },
        audioGuide: { en: "Audio guide", ja: "音声ガイド" },
        station: { en: "Station signs", ja: "駅の案内" },
    },
    chatLanguage: {
        auto: { en: "Follow the page", ja: "ページに合わせる" },
        en: { en: "English", ja: "English" },
        ja: { en: "日本語", ja: "日本語" },
    },
    chatFontSize: {
        "14": { en: "Normal", ja: "標準" },
        "17": { en: "Large", ja: "大" },
        "20": { en: "Extra large", ja: "特大" },
    },
    minimap: {
        off: { en: "Off", ja: "オフ" },
        zoomed: { en: "While zoomed", ja: "拡大中" },
        always: { en: "Always", ja: "常に" },
    },
    motion: {
        smooth: { en: "Glide", ja: "なめらか" },
        instant: { en: "Jump", ja: "すぐに" },
    },
};

/** the research variables' names in Japanese (the English stay in settings.ts); a
 *  unit in brackets is kept, as the panel shows it beside the value */
export const NAMES_JA: Partial<Record<keyof Settings, string>> = {
    mouseTrace: "マウスの軌跡を記録",
    zoomTrace: "拡大の履歴を記録",
    viewportCrop: "拡大した画面の切り抜きを送る",
    streamReplies: "回答を少しずつ表示",
    elementContext: "クリックした要素のまわりも送る",
    regionSelect: "Alt＋ドラッグで範囲を選ぶ",
    hints: "先回りのヒント",
    lensPan: "レンズ移動（拡大中はページを固定）",
    debugView: "デバッグ表示（Ctrl＋Shift＋D）",
    inventory: "キャプチャと一緒にページの構造を送る",
    ringScale: "拡大に合わせて枠を太くする",
    hlFill: "色で塗る",
    hlGlow: "光彩",
    hlBadges: "番号バッジ",
    mmFollowHighlight: "ハイライトと同じ見た目",
    mmFill: "色で塗る（半透明）",
    mmGlow: "対象のまわりを光らせる",
    mmNumbers: "対象に番号を表示",
    citeEvidence: "回答にページ上の根拠を示す",
    chatMovesAside: "根拠に重ならないようチャットをずらす",
    assistantZoom: "頼まれたらアシスタントがページを拡大する",
    associateText: "回答と根拠を結ぶ（根拠が支える語句に下線）",
    settingsButton: "設定ボタン（隠しても Ctrl＋Alt＋Shift＋S で設定を開く）",
    citePlacement: "根拠の番号の位置",
    refreshView: "続けて質問するとき今の画面を送る",
    fxCore: "オーブ：光沢のある芯",
    fxSwirl: "オーブ：2色の渦",
    fxRipple: "クリック位置に波紋",
    fxHalo: "オーブ：後光",
    fxDot: "オーロラ：クリック位置に点",
    fxThirdTone: "3色目（コーラル）",
    fxSheen: "枠：走る光",
    fxHug: "枠：呼吸する動き",
    fxEdgeGradient: "画面の縁：流れるグラデーション",
    fxPin: "画面の縁：クリック位置にピン",
    liveBargeIn: "話しかけると止まる",
    livePoint: "話している箇所を光らせる",
    liveScreenshot: "今の画面の画像を送る",
    liveCaptions: "話している言葉をその場で表示",
    captureRes: "キャプチャの解像度",
    liveSpeed: "話す速さ (%, OpenAI)",
    inventoryMaxDepth: "構造の最大の深さ",
    inventorySummaryDepth: "構造の要約の深さ",
    inventorySummaryCap: "構造の文字数の上限 (chars)",
    inventoryMaxBytes: "構造のバイト数の上限",
    inventoryMaxNodes: "構造の要素数の上限",
    ringWidth: "枠の太さ (px)",
    minimapMarkerSize: "地図上の対象の最小サイズ (px)",
    cueRadius: "ポインターからの距離 (px)",
    fxSize: "大きさ (%)",
    fxSoftness: "オーロラ：やわらかさ (px)",
    fxRings: "ソナー：輪の数",
    fxEdgeWidth: "画面の縁：太さ (px)",
    cueSize: "矢印の大きさ (px)",
    motionMs: "移動にかける時間 (ms)",
    hlOutline: "枠の形",
    hlBackdrop: "背景",
    offscreenCue: "矢印",
    clickFx: "スタイル",
    fxEnding: "終わり方",
    fxRippleLook: "波紋の見た目",
    fxSpeed: "速さ",
    fxRingStyle: "ソナー：輪の見た目",
    fxFrameShape: "枠：形",
    mmOutline: "枠の形",
    mmBackdrop: "背景",
    moveToEvidence: "根拠までページを動かす",
    autoHighlight: "自動ハイライト",
    aiProvider: "提供元",
    trailColor: "ポインターの軌跡の色（アシスタントに送る画像）",
    ttsProvider: "読み上げの提供元",
    sttEngine: "音声認識",
    aiReasoning: "推論の深さ",
    liveProvider: "提供元",
    liveTurnEnd: "話し終わりとみなす間",
    escapeOrder: "Esc キーの順番",
    aiModel: "モデル",
    ttsModel: "読み上げのモデル",
    sttModel: "音声認識のモデル（サーバー）",
    liveModel: "ライブ会話のモデル",
    liveVoice: "ライブ会話の声",
};

const OUTLINES_JA = {
    band: "色の太い帯",
    ring: "黒と白の二重の枠",
    brackets: "角のかっこ",
    underline: "マーカーの下線",
    none: "枠なし",
};
const BACKDROPS_JA = {
    none: "背景はそのまま",
    dim: "まわりを暗くする",
    spotlight: "スポットライト（より暗く、縁をぼかす）",
};
const BY_SERVER = {
    auto: "サーバーの既定",
    openai: "OpenAI",
    gemini: "Gemini",
};

/** the research variables' choices in Japanese, by stored value */
export const CHOICES_JA: Partial<
    Record<keyof Settings, Record<string, string>>
> = {
    hlOutline: OUTLINES_JA,
    mmOutline: OUTLINES_JA,
    hlBackdrop: BACKDROPS_JA,
    mmBackdrop: BACKDROPS_JA,
    offscreenCue: {
        none: "なし",
        edge: "画面の端に",
        pointer: "ポインターのまわりに",
    },
    clickFx: {
        orb: "呼吸するオーブ",
        aurora: "オーロラ",
        sonar: "ソナー",
        frame: "クリックしたものを枠で囲む",
        edge: "画面の縁が光る",
    },
    fxEnding: {
        auto: "スタイルに合わせる",
        fade: "消える",
        fly: "チャットへ飛んでいく",
        found: "見つかった合図の波",
    },
    fxRippleLook: {
        rimmed: "ハイライトの色に黒い縁",
        taper: "ハイライトの色で太から細へ",
    },
    fxSpeed: { calm: "ゆっくり", normal: "ふつう", lively: "きびきび" },
    fxRingStyle: { filled: "塗りつぶし", outline: "線だけ" },
    fxFrameShape: {
        brackets: "角のかっこ",
        highlight: "ハイライトの枠と同じ",
    },
    moveToEvidence: {
        offscreen: "画面の外にあるときだけ",
        always: "いつも中央に",
        never: "動かさない（矢印だけ）",
    },
    citePlacement: {
        inline: "文の中（語句のすぐ後）",
        sentence: "各文の終わり",
        end: "回答の最後にまとめて",
    },
    autoHighlight: {
        where: "「どこ」「見せて」と聞いたときに根拠を囲む",
        always: "すべての回答の根拠を囲む",
        never: "クリックしたときだけ囲む",
    },
    aiProvider: BY_SERVER,
    ttsProvider: BY_SERVER,
    liveProvider: {
        auto: "AI の設定と同じ",
        openai: "OpenAI",
        gemini: "Gemini",
    },
    trailColor: { orange: "オレンジ", lime: "ライム" },
    sttEngine: {
        auto: "ブラウザー、使えなければサーバー",
        browser: "ブラウザーのみ",
        openai: "OpenAI（サーバー）",
        gemini: "Gemini（サーバー）",
    },
    liveTurnEnd: {
        patient: "長めの間（ゆっくり話せる）",
        normal: "ふつうの間",
        quick: "短い間（テンポよく）",
    },
    escapeOrder: {
        highlight: "まず枠を消す",
        popover: "まずチャットを閉じる",
        both: "枠を消してチャットも閉じる",
    },
    captureRes: { "1": "画面と同じ（1x）", "0.5": "縮小（0.5x）" },
    aiReasoning: {
        default: "モデルの既定",
        low: "低",
        medium: "中",
        high: "高",
    },
};

/** the look cards' short names in Japanese, by stored value (the full name is the tooltip) */
export const SHORT_JA: Record<string, string> = {
    band: "太い帯",
    ring: "黒と白の枠",
    brackets: "角のかっこ",
    underline: "下線",
    dim: "暗くする",
    spotlight: "スポットライト",
    edge: "画面の端",
    pointer: "ポインターのそば",
    orb: "オーブ",
    aurora: "オーロラ",
    sonar: "ソナー",
    frame: "枠",
    none: "なし",
};
