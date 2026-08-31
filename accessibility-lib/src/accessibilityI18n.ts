/**
 * Display adjustment panel — display strings (Japanese / English).
 *
 * Design principles:
 * - The Japanese dictionary is the source of the type. Imposing `typeof ja`
 *   on the English dictionary catches missing keys or mismatched function
 *   arities at compile time.
 * - Numbers and scales (1.25× / 16px+, etc.) are language-independent, so
 *   they don't live in this dictionary.
 */
import { getSettings, onSettingsChange, updateSetting } from "./settings";

export type A11yLang = "ja" | "en";

export const A11Y_LANGS: A11yLang[] = ["ja", "en"];

/**
 * Language names are always written in that language's own script.
 * If the switch target were shown in an unreadable script, a visitor who
 * picked it by mistake would have no way back.
 */
export const A11Y_LANG_NAMES: Record<A11yLang, string> = {
    ja: "日本語",
    en: "English",
};

// ── Japanese (the type's source of truth) ─────────────────────────────────

const ja = {
    // Panel shell
    panelTitle: "表示調整",
    panelSubtitle: "このページの見え方を変えられます",
    closePanel: "パネルを閉じる",
    openPanel: "表示調整パネルを開く",
    openPanelWithCount: (count: number) =>
        `表示調整パネルを開く（${count} 件適用中）`,
    toggleLabel: "表示調整",
    tabsLabel: "表示調整のカテゴリ",
    tabWithCount: (label: string, count: number) =>
        `${label}（${count} 件適用中）`,
    chipsLabel: "適用中",
    chipRemove: (label: string) => `${label} を解除する`,
    chipRemoved: (label: string) => `${label} を解除しました`,
    resetAll: "すべて元に戻す",
    resetAllAria: "すべての表示設定を初期状態に戻す",
    resetArmed: "もう一度押すと全部戻ります",
    resetArmedAria: "もう一度押すとすべての設定が初期状態に戻ります",
    resetConfirm: "確認のため、もう一度押すとすべての設定が初期状態に戻ります",
    resetDone: "すべての設定を初期状態に戻しました",
    hintTabs: "タブ移動",
    hintClose: "閉じる",

    tabs: {
        visual: "見やすさ",
        text: "文字・色",
        tools: "Lab",
    },

    // "Currently applied" chip labels
    adjSaturation: (value: string) => `彩度 ${value}`,
    adjContrast: (value: string) => `コントラスト ${value}`,
    adjFontSize: (value: string) => `文字 ${value}`,
    adjUdFont: "UD フォント",
    adjCustomFont: (name: string) => `カスタムフォント ${name}`,
    adjLineHeight: "行間 広め",
    adjBodyExpand: (name: string) => `本文拡大 ${name}`,
    adjSmallBoost: (name: string) => `小文字底上げ ${name}`,
    adjAutoSize: (scale: string) => `自動サイズ ×${scale}`,
    adjLetterSpacing: "文字間隔 広め",
    adjLinkUnderline: "リンク下線",
    adjLinkBackground: "リンク背景色",
    adjLinkBorder: "リンク枠線",
    adjImageBorder: "画像枠線",
    adjElementHighlight: "要素ハイライト",
    adjFocusEnhance: "フォーカス強調",
    adjReduceMotion: "アニメ停止",

    // Choice option names
    theme: {
        standard: "標準",
        light: "ライト",
        soft: "低刺激",
        dark: "ダーク",
        "high-contrast": "高コントラスト",
        invert: "色を反転",
    },
    saturation: {
        standard: "標準",
        soft: "50%",
        low: "控えめ",
        mono: "モノクロ",
        high: "鮮やか",
    },
    contrast: {
        standard: "標準",
        strong: "くっきり",
        max: "最大",
    },
    fontSize: {
        standard: "標準",
        large: "大きめ",
        xlarge: "特大",
    },
    levelNames: {
        0: "オフ",
        1: "弱",
        2: "中",
        3: "強",
    },
    autoMode: {
        viewport: { label: "画面幅", hint: "端末に合わせる" },
        content: { label: "ページ内容", hint: "文字量から判定" },
        combined: { label: "おまかせ", hint: "両方の大きい方" },
    },
    fontScale: {
        1: { label: "標準", hint: "100%" },
        2: { label: "大", hint: "150%" },
        3: { label: "特大", hint: "200%" },
    },

    /** Sample glyphs shown in the typeface/font-size preview. */
    previewSample: "あA",

    // Language switcher
    languageTitle: "表示言語",
    languageDesc:
        "この表示調整パネルの言語を切り替えます。ページ本文は翻訳されません。",
    languageGroup: "パネルの言語",
    languageAria: (name: string) => `パネルの言語: ${name}`,
    languageAnnounce: (name: string) => `パネルの言語を ${name} にしました`,

    // Frequently used settings (presets)
    presetsTitle: "よく使う設定",
    presetsDesc:
        "用途別の組み合わせをワンタップで適用します。もう一度押すとオフになります。",
    presetsGroup: "プリセット",
    presetLowVision: "弱視向け",
    presetLowVisionHint: "大きく・空けて・くっきり",
    presetColorVision: "色覚サポート",
    presetColorVisionHint: "色に頼らず区別",
    presetMild: "低刺激",
    presetMildHint: "クリーム地・彩度50%",
    presetSenior: "くっきり",
    presetSeniorHint: "本文1.25×・下線",
    presetHighContrast: "ハイコントラスト黒",
    presetHighContrastHint: "黒地・黄文字",
    presetFocus: "シンプル",
    presetFocusHint: "行間広め・モノクロ",
    presetAria: (name: string, hint: string) => `${name}: ${hint}`,
    presetAnnounce: (name: string) => `「${name}」の設定を適用しました`,
    presetAnnounceOff: (name: string) => `「${name}」の設定をオフにしました`,
    presetActive: "適用中",

    // Visibility tab — cues (beyond color)
    cuesTitle: "見つけやすさの手がかり",
    cuesDesc:
        "色だけに頼らず、リンクや今の位置が分かるようにします。動きを止めることもできます。",
    linkUnderlineSwitch: "リンクに常に下線を付ける",
    linkUnderlineHintOn: "色が分かりにくくてもリンクだと見分けられます",
    linkUnderlineHintOff: "色覚サポートや弱視のときに特に役立ちます",
    linkUnderlineOn: "リンクの下線をオンにしました",
    linkUnderlineOff: "リンクの下線をオフにしました",
    linkBackgroundSwitch: "リンクに背景色を付ける",
    linkBackgroundHintOn: "下線や色以外に、面としても見分けられます",
    linkBackgroundHintOff: "下線が目立ちにくい背景のときに役立ちます",
    linkBackgroundOn: "リンクの背景色をオンにしました",
    linkBackgroundOff: "リンクの背景色をオフにしました",
    linkBorderSwitch: "リンクに枠線を付ける",
    linkBorderHintOn: "リンクの範囲が輪郭でも分かるようになります",
    linkBorderHintOff: "背景色や下線と組み合わせても使えます",
    linkBorderOn: "リンクの枠線をオンにしました",
    linkBorderOff: "リンクの枠線をオフにしました",
    imageBorderSwitch: "画像に枠線を付ける",
    imageBorderHintOn: "画像の境界がはっきりします",
    imageBorderHintOff: "背景に溶け込みやすい画像があるときに役立ちます",
    imageBorderOn: "画像の枠線をオンにしました",
    imageBorderOff: "画像の枠線をオフにしました",
    elementHighlightSwitch: "リンク・ボタン・入力欄を常に目立たせる",
    elementHighlightHintOn:
        "フォーカスしていなくても操作できる場所が分かります",
    elementHighlightHintOff:
        "注意がそれやすいときに、操作対象を見失いにくくします",
    elementHighlightOn: "要素のハイライトをオンにしました",
    elementHighlightOff: "要素のハイライトをオフにしました",
    focusEnhanceSwitch: "大きなカーソルと太いフォーカス枠",
    focusEnhanceHintOn: "マウス位置とキーボードの場所が見つけやすくなります",
    focusEnhanceHintOff: "今どこを見ているかを見失いにくくします",
    focusEnhanceOn: "フォーカス強調をオンにしました",
    focusEnhanceOff: "フォーカス強調をオフにしました",
    reduceMotionSwitch: "アニメーションを止める",
    reduceMotionHintOn: "動きのある演出をすべて止めます",
    reduceMotionHintOff: "低刺激にしたいときに使います",
    reduceMotionOn: "アニメーション停止をオンにしました",
    reduceMotionOff: "アニメーション停止をオフにしました",

    // Visibility tab
    colorModeTitle: "カラーモード",
    colorModeDesc:
        "「標準」はサイト本来の色のままです。「ライト」以降はページ全体の配色を切り替えます。ボタンの色見本が、そのまま変更後の見え方です。",
    colorModeGroup: "配色",
    themeAria: (name: string) => `カラーモード: ${name}`,
    themeAnnounce: (name: string) => `カラーモードを${name}にしました`,
    toneTitle: "色みとメリハリ",
    toneDesc:
        "カラーモードが「標準」のときは画像（img / picture / video）だけに効きます。それ以外のモードではページ全体に効きます。",
    saturationGroup: "彩度",
    saturationAria: (name: string) => `彩度: ${name}`,
    saturationAnnounce: (name: string) => `彩度を${name}にしました`,
    contrastGroup: "コントラスト",
    contrastAria: (name: string) => `コントラスト: ${name}`,
    contrastAnnounce: (name: string) => `コントラストを${name}にしました`,

    // Text tab
    pageTextTitle: "ページ全体の文字",
    pageTextDesc:
        "サイト全体の文字サイズ・書体・行間・文字間隔をまとめて変更します。",
    fontSizeGroup: "文字サイズ",
    fontSizeAria: (name: string, hint: string) => `文字サイズ: ${name} ${hint}`,
    fontSizeAnnounce: (name: string) => `ページの文字サイズを${name}にしました`,
    typefaceGroup: "書体",
    typefaceStandard: "標準",
    typefaceUd: "UD フォント",
    typefaceUdHint: "読み分けやすい",
    typefaceStandardAria: "書体: 標準",
    typefaceUdAria: "書体: UD フォント（読み分けやすい書体）",
    typefaceAnnounce: (name: string) => `書体を${name}にしました`,
    lineHeightGroup: "行間",
    lineHeightStandard: "標準",
    lineHeightWide: "広め",
    lineHeightAria: (name: string) => `行間: ${name}`,
    lineHeightAnnounce: (name: string) => `行間を${name}にしました`,
    letterSpacingGroup: "文字間隔",
    letterSpacingStandard: "標準",
    letterSpacingWide: "広め",
    letterSpacingAria: (name: string) => `文字間隔: ${name}`,
    letterSpacingAnnounce: (name: string) => `文字間隔を${name}にしました`,

    bodyExpandTitle: "本文だけ大きく",
    bodyExpandDesc:
        "見出しはそのままに、段落やリンクなど本文の文字だけを拡大します。レイアウトが崩れにくい方法です。",
    bodyExpandGroup: "拡大の強さ",
    bodyExpandAriaOff: "本文拡大: オフ",
    bodyExpandAria: (label: string) => `本文拡大: ${label}`,
    bodyExpandAnnounceOff: "本文拡大をオフにしました",
    bodyExpandAnnounce: (name: string, expanded: number) =>
        `本文拡大を${name}にしました。${expanded} 箇所を拡大しました`,
    bodyExpandNote: (expanded: number, scanned: number) =>
        `${expanded} 箇所を拡大中（${scanned} 箇所を確認）`,
    rescan: "もう一度さがす",
    rescanBodyAria: "本文をもう一度さがして拡大する",
    rescanBodyResult: (expanded: number, scanned: number) =>
        `${expanded} 箇所を拡大しました（${scanned} 箇所を確認）`,

    smallBoostTitle: "小さすぎる文字を底上げ",
    smallBoostDesc:
        "注釈やキャプションなど 16px 未満の文字だけを、読める大きさまで引き上げます。",
    smallBoostGroup: "底上げの強さ",
    smallBoostAriaOff: "小文字の底上げ: オフ",
    smallBoostAria: (label: string) => `小文字の底上げ: ${label}`,
    smallBoostAnnounceOff: "小文字の底上げをオフにしました",
    smallBoostAnnounce: (name: string, boosted: number) =>
        `小文字の底上げを${name}にしました。${boosted} 箇所を底上げしました`,
    smallBoostNote: (boosted: number, scanned: number) =>
        `${boosted} 箇所を底上げ中（${scanned} 箇所を確認）`,
    rescanSmallAria: "小さな文字をもう一度さがして底上げする",
    rescanSmallResult: (boosted: number, scanned: number) =>
        `${boosted} 箇所を底上げしました（${scanned} 箇所を確認）`,

    // Tools tab
    selectionTitle: "選んだ文字だけ拡大",
    selectionDesc:
        "ページ上でドラッグして選んだ範囲だけ、その場で大きくできます。",
    selectionQuoted: (text: string, charCount: number) =>
        `「${text}」${charCount} 文字`,
    selectionSticky: "保持中",
    selectionEmpty: "まずページ上の文字をドラッグして選んでください。",
    selectionGroup: "拡大率（押すとその場で適用）",
    selectionAria: (label: string) => `選んだ文字のサイズ: ${label}`,
    selectionClear: "元に戻す",
    selectionClearAria: "選んだ範囲のサイズ変更を元に戻す",

    speakTitle: "選んだ文字を読み上げ",
    speakDesc:
        "ページ上でドラッグして選んだ文章を音声で読み上げます。読んでいる場所は色で追えます。",
    speakUnsupported: "このブラウザは音声読み上げに対応していません。",
    speakEmpty: "まずページ上の文字をドラッグして選んでください。",
    speakReady: (charCount: number) => `${charCount} 文字を読み上げられます`,
    speakSpeakingNow: (charCount: number) =>
        `${charCount} 文字を読み上げています`,
    speakStatusSpeaking: "読み上げ中",
    speakStatusPaused: "一時停止中",
    speakStart: "読み上げる",
    speakStartAria: "選んだ文字を読み上げる",
    speakPause: "一時停止",
    speakPauseAria: "読み上げを一時停止する",
    speakResume: "続きから読む",
    speakResumeAria: "読み上げを続きから再開する",
    speakStop: "停止",
    speakStopAria: "読み上げを停止して先頭に戻す",
    speakStarted: "読み上げを始めました",
    speakPausedAnnounce: "読み上げを一時停止しました",
    speakResumedAnnounce: "読み上げを再開しました",
    speakStoppedAnnounce: "読み上げを停止しました",
    speakFailed: "読み上げを始められませんでした",
    speakRateGroup: "読み上げの速さ",
    speakRateNames: {
        0: "ゆっくり",
        1: "標準",
        2: "速い",
        3: "とても速い",
    },
    speakRateAria: (label: string) => `読み上げの速さ: ${label}`,
    speakRateAnnounce: (label: string) => `読み上げの速さを${label}にしました`,
    speakHighlightSwitch: "読んでいる場所を光らせる",
    speakHighlightHintOn:
        "読み上げ中の範囲と語を、選択の青とは別の色で示します",
    speakHighlightHintOff: "目で追いながら聞きたいときに使います",
    speakHighlightOn: "読み上げ位置の強調をオンにしました",
    speakHighlightOff: "読み上げ位置の強調をオフにしました",

    autoTitle: "自動で読みやすく",
    autoDesc:
        "ページの文字量と画面幅を調べ、ちょうどよい倍率を自動で当てはめます。",
    autoSwitch: "自動調整を使う",
    autoSwitchHintOn: "画面サイズが変わると自動で調整し直します",
    autoSwitchHintOff: "オンにすると調整のしかたを選べます",
    autoOnAnnounce: (scale: string) =>
        `自動調整をオンにしました。倍率 ×${scale}`,
    autoOffAnnounce: "自動調整をオフにしました",
    autoModeGroup: "判定のしかた",
    autoModeAria: (label: string, hint: string) =>
        `判定のしかた: ${label} — ${hint}`,
    autoModeAnnounce: (label: string, scale: string) =>
        `判定のしかたを${label}にしました。倍率 ×${scale}`,
    autoMinGroup: "目標にする最小サイズ",
    autoMinAria: (px: number) => `目標にする最小サイズ: ${px} ピクセル`,
    autoMinAnnounce: (px: number, scale: string) =>
        `目標にする最小サイズを ${px} ピクセルにしました。倍率 ×${scale}`,
    autoStepGroup: "倍率を手で微調整",
    autoStepDecrease: "倍率を 0.1 下げる",
    autoStepIncrease: "倍率を 0.1 上げる",
    autoScaleAnnounce: (scale: string) => `倍率 ×${scale}`,
    analyze: "いまのページを調べる",
    analyzeAria: "いまのページの文字サイズを調べる",
    analyzeAnnounce: (medianPx: number, smallPercent: number, scale: string) =>
        `ページを調べました。文字サイズ中央値 ${medianPx} ピクセル、` +
        `小さい文字の割合 ${smallPercent} パーセント、適用中の倍率 ×${scale}`,
    analyzeEmpty: "ページを調べましたが、対象の文字が見つかりませんでした",
    metricSamples: "調べた要素",
    metricSamplesValue: (count: number) => `${count} 個`,
    metricMedian: "文字サイズ中央値",
    metricMinMax: "最小 / 最大",
    metricSmallRatio: "小さい文字の割合",
    metricScale: "適用中の倍率",

    // Selection resize (operation results returned by selectionTextSize.ts)
    selNeedSelection: "先にページ上の文字をドラッグして選択してください",
    selUiBlocked: "UniLens の UI 内の文字は変更できません",
    selWhitespaceOnly: "空白のみの選択は変更できません",
    selApplied: (label: string, px: number) =>
        `選択文字を ${label}（${px}px）に変更しました（選択を維持）`,
    selApplyFailed: (reason: string) => `適用に失敗しました: ${reason}`,
    selNothingToClear: "サイズ変更済みの選択範囲がありません",
    selClearFailed: "解除に失敗しました",
    selCleared: "選択範囲の文字サイズ変更を解除しました（選択を維持）",
};

export type A11yMessages = typeof ja;

// ── English ────────────────────────────────────────────────────────────────

const en: A11yMessages = {
    panelTitle: "Display Options",
    panelSubtitle: "Change how this page looks",
    closePanel: "Close panel",
    openPanel: "Open display options",
    openPanelWithCount: (count) => `Open display options (${count} applied)`,
    toggleLabel: "Display",
    tabsLabel: "Display option categories",
    tabWithCount: (label, count) => `${label} (${count} applied)`,
    chipsLabel: "Applied",
    chipRemove: (label) => `Remove ${label}`,
    chipRemoved: (label) => `${label} removed`,
    resetAll: "Reset everything",
    resetAllAria: "Reset all display settings to their defaults",
    resetArmed: "Press again to reset everything",
    resetArmedAria: "Press again to reset every setting to its default",
    resetConfirm:
        "To confirm, press again to reset every setting to its default",
    resetDone: "All settings have been reset",
    hintTabs: "switch tabs",
    hintClose: "close",

    tabs: {
        visual: "Visibility",
        text: "Text & Color",
        tools: "Lab",
    },

    adjSaturation: (value) => `Saturation: ${value}`,
    adjContrast: (value) => `Contrast: ${value}`,
    adjFontSize: (value) => `Text size: ${value}`,
    adjUdFont: "UD font",
    adjCustomFont: (name) => `Custom font: ${name}`,
    adjLineHeight: "Line spacing: wide",
    adjBodyExpand: (name) => `Body text: ${name}`,
    adjSmallBoost: (name) => `Small text: ${name}`,
    adjAutoSize: (scale) => `Auto size ×${scale}`,
    adjLetterSpacing: "Letter spacing: wide",
    adjLinkUnderline: "Link underlines",
    adjLinkBackground: "Link background",
    adjLinkBorder: "Link border",
    adjImageBorder: "Image border",
    adjElementHighlight: "Element highlight",
    adjFocusEnhance: "Focus enhance",
    adjReduceMotion: "Stop motion",

    theme: {
        standard: "Standard",
        light: "Light",
        soft: "Soft",
        dark: "Dark",
        "high-contrast": "High contrast",
        invert: "Invert",
    },
    saturation: {
        standard: "Normal",
        soft: "50%",
        low: "Muted",
        mono: "Grayscale",
        high: "Vivid",
    },
    contrast: {
        standard: "Normal",
        strong: "Strong",
        max: "Maximum",
    },
    fontSize: {
        standard: "Normal",
        large: "Large",
        xlarge: "Extra large",
    },
    levelNames: {
        0: "Off",
        1: "Low",
        2: "Medium",
        3: "High",
    },
    autoMode: {
        viewport: { label: "Screen", hint: "Match the device" },
        content: { label: "Content", hint: "Judge by the text" },
        combined: { label: "Automatic", hint: "Larger of the two" },
    },
    fontScale: {
        1: { label: "Normal", hint: "100%" },
        2: { label: "Large", hint: "150%" },
        3: { label: "X-large", hint: "200%" },
    },

    previewSample: "Aa",

    languageTitle: "Language",
    languageDesc:
        "Switches the language of this display options panel. The page content itself is not translated.",
    languageGroup: "Panel language",
    languageAria: (name) => `Panel language: ${name}`,
    languageAnnounce: (name) => `Panel language set to ${name}`,

    presetsTitle: "Quick presets",
    presetsDesc:
        "One-tap combinations for common needs. Press again to turn off.",
    presetsGroup: "Presets",
    presetLowVision: "Low vision",
    presetLowVisionHint: "Larger, roomier, clearer",
    presetColorVision: "Color vision",
    presetColorVisionHint: "Rely less on color",
    presetMild: "Mild",
    presetMildHint: "Cream page, 50% color",
    presetSenior: "Crisp",
    presetSeniorHint: "Body 1.25×, underlines",
    presetHighContrast: "High-contrast black",
    presetHighContrastHint: "Black and yellow",
    presetFocus: "Focus",
    presetFocusHint: "Wide lines, grayscale",
    presetAria: (name, hint) => `${name}: ${hint}`,
    presetAnnounce: (name) => `Applied the ${name} preset`,
    presetAnnounceOff: (name) => `Turned off the ${name} preset`,
    presetActive: "Applied",

    cuesTitle: "Extra visual cues",
    cuesDesc:
        "Make links and your current position clearer without relying on color alone. You can also stop motion.",
    linkUnderlineSwitch: "Always underline links",
    linkUnderlineHintOn:
        "Links stay recognizable even when colors are hard to tell apart",
    linkUnderlineHintOff:
        "Especially helpful for color vision support and low vision",
    linkUnderlineOn: "Link underlines turned on",
    linkUnderlineOff: "Link underlines turned off",
    linkBackgroundSwitch: "Give links a background color",
    linkBackgroundHintOn:
        "Recognizable as a shape, not just an underline or color",
    linkBackgroundHintOff:
        "Useful when underlines are hard to spot against the background",
    linkBackgroundOn: "Link background turned on",
    linkBackgroundOff: "Link background turned off",
    linkBorderSwitch: "Give links a border",
    linkBorderHintOn: "Makes a link's extent clear from its outline alone",
    linkBorderHintOff: "Can be combined with the background or underline",
    linkBorderOn: "Link border turned on",
    linkBorderOff: "Link border turned off",
    imageBorderSwitch: "Give images a border",
    imageBorderHintOn: "Makes an image’s edges unambiguous",
    imageBorderHintOff: "Useful for images that blend into the background",
    imageBorderOn: "Image border turned on",
    imageBorderOff: "Image border turned off",
    elementHighlightSwitch: "Always highlight links, buttons, and form fields",
    elementHighlightHintOn:
        "Shows what you can interact with, even without focusing it first",
    elementHighlightHintOff:
        "Helps you keep track of interactive targets when attention drifts easily",
    elementHighlightOn: "Element highlight turned on",
    elementHighlightOff: "Element highlight turned off",
    focusEnhanceSwitch: "Large cursor and thick focus ring",
    focusEnhanceHintOn: "Makes the mouse and keyboard focus easier to find",
    focusEnhanceHintOff: "Helps you keep track of where you are on the page",
    focusEnhanceOn: "Focus enhance turned on",
    focusEnhanceOff: "Focus enhance turned off",
    reduceMotionSwitch: "Stop animations",
    reduceMotionHintOn: "Turns off animated effects on the page",
    reduceMotionHintOff: "Useful when you want a calmer, milder display",
    reduceMotionOn: "Motion stop turned on",
    reduceMotionOff: "Motion stop turned off",

    colorModeTitle: "Color mode",
    colorModeDesc:
        "“Standard” keeps the site’s own colors. “Light” and the modes after it recolor the whole page. Each button shows the colors you will get.",
    colorModeGroup: "Color scheme",
    themeAria: (name) => `Color mode: ${name}`,
    themeAnnounce: (name) => `Color mode set to ${name}`,
    toneTitle: "Color and contrast",
    toneDesc:
        "With Color mode set to Standard, these apply only to images (img / picture / video). With any other mode, they apply to the whole page.",
    saturationGroup: "Saturation",
    saturationAria: (name) => `Saturation: ${name}`,
    saturationAnnounce: (name) => `Saturation set to ${name}`,
    contrastGroup: "Contrast",
    contrastAria: (name) => `Contrast: ${name}`,
    contrastAnnounce: (name) => `Contrast set to ${name}`,

    pageTextTitle: "Page text",
    pageTextDesc:
        "Changes the text size, typeface, line spacing and letter spacing across the whole site.",
    fontSizeGroup: "Text size",
    fontSizeAria: (name, hint) => `Text size: ${name} ${hint}`,
    fontSizeAnnounce: (name) => `Page text size set to ${name}`,
    typefaceGroup: "Typeface",
    typefaceStandard: "Standard",
    typefaceUd: "UD font",
    typefaceUdHint: "Easier to tell apart",
    typefaceStandardAria: "Typeface: standard",
    typefaceUdAria:
        "Typeface: UD font, with letters that are easier to tell apart",
    typefaceAnnounce: (name) => `Typeface set to ${name}`,
    lineHeightGroup: "Line spacing",
    lineHeightStandard: "Normal",
    lineHeightWide: "Wide",
    lineHeightAria: (name) => `Line spacing: ${name}`,
    lineHeightAnnounce: (name) => `Line spacing set to ${name}`,
    letterSpacingGroup: "Letter spacing",
    letterSpacingStandard: "Normal",
    letterSpacingWide: "Wide",
    letterSpacingAria: (name) => `Letter spacing: ${name}`,
    letterSpacingAnnounce: (name) => `Letter spacing set to ${name}`,

    bodyExpandTitle: "Enlarge body text only",
    bodyExpandDesc:
        "Leaves headings untouched and enlarges only body text such as paragraphs and links. This is the least likely to break the layout.",
    bodyExpandGroup: "Strength",
    bodyExpandAriaOff: "Body text enlargement: off",
    bodyExpandAria: (label) => `Body text enlargement: ${label}`,
    bodyExpandAnnounceOff: "Body text enlargement turned off",
    bodyExpandAnnounce: (name, expanded) =>
        `Body text enlargement set to ${name}. ${expanded} places enlarged`,
    bodyExpandNote: (expanded, scanned) =>
        `${expanded} places enlarged (${scanned} checked)`,
    rescan: "Scan again",
    rescanBodyAria: "Scan the page again and enlarge body text",
    rescanBodyResult: (expanded, scanned) =>
        `${expanded} places enlarged (${scanned} checked)`,

    smallBoostTitle: "Raise text that is too small",
    smallBoostDesc:
        "Raises only text below 16px, such as footnotes and captions, up to a readable size.",
    smallBoostGroup: "Strength",
    smallBoostAriaOff: "Small text boost: off",
    smallBoostAria: (label) => `Small text boost: ${label}`,
    smallBoostAnnounceOff: "Small text boost turned off",
    smallBoostAnnounce: (name, boosted) =>
        `Small text boost set to ${name}. ${boosted} places raised`,
    smallBoostNote: (boosted, scanned) =>
        `${boosted} places raised (${scanned} checked)`,
    rescanSmallAria: "Scan the page again and raise small text",
    rescanSmallResult: (boosted, scanned) =>
        `${boosted} places raised (${scanned} checked)`,

    selectionTitle: "Enlarge selected text",
    selectionDesc:
        "Drag to select text on the page, then enlarge just that part on the spot.",
    selectionQuoted: (text, charCount) => `“${text}” — ${charCount} characters`,
    selectionSticky: "kept",
    selectionEmpty: "First, drag to select some text on the page.",
    selectionGroup: "Scale (applied as soon as you press)",
    selectionAria: (label) => `Selected text size: ${label}`,
    selectionClear: "Undo",
    selectionClearAria: "Undo the size change on the selected text",

    speakTitle: "Read the selection aloud",
    speakDesc:
        "Speaks the text you select on the page. You can follow along with the highlighted word.",
    speakUnsupported: "This browser does not support speech synthesis.",
    speakEmpty: "First, drag to select some text on the page.",
    speakReady: (charCount) => `${charCount} characters ready to read`,
    speakSpeakingNow: (charCount) => `Reading ${charCount} characters`,
    speakStatusSpeaking: "Reading",
    speakStatusPaused: "Paused",
    speakStart: "Read aloud",
    speakStartAria: "Read the selected text aloud",
    speakPause: "Pause",
    speakPauseAria: "Pause the reading",
    speakResume: "Continue",
    speakResumeAria: "Continue reading from where it stopped",
    speakStop: "Stop",
    speakStopAria: "Stop reading and return to the beginning",
    speakStarted: "Reading started",
    speakPausedAnnounce: "Reading paused",
    speakResumedAnnounce: "Reading resumed",
    speakStoppedAnnounce: "Reading stopped",
    speakFailed: "Could not start reading",
    speakRateGroup: "Reading speed",
    speakRateNames: {
        0: "Slow",
        1: "Normal",
        2: "Fast",
        3: "Fastest",
    },
    speakRateAria: (label) => `Reading speed: ${label}`,
    speakRateAnnounce: (label) => `Reading speed set to ${label}`,
    speakHighlightSwitch: "Highlight the word being read",
    speakHighlightHintOn:
        "Marks the passage and the current word in a color distinct from the selection",
    speakHighlightHintOff:
        "Useful when you want to follow along while listening",
    speakHighlightOn: "Reading highlight turned on",
    speakHighlightOff: "Reading highlight turned off",

    autoTitle: "Adjust automatically",
    autoDesc:
        "Measures the amount of text and the screen width, then applies a suitable scale automatically.",
    autoSwitch: "Use automatic adjustment",
    autoSwitchHintOn: "Re-adjusts whenever the screen size changes",
    autoSwitchHintOff: "Turn on to choose how it decides",
    autoOnAnnounce: (scale) => `Automatic adjustment on. Scale ×${scale}`,
    autoOffAnnounce: "Automatic adjustment off",
    autoModeGroup: "How it decides",
    autoModeAria: (label, hint) => `How it decides: ${label} — ${hint}`,
    autoModeAnnounce: (label, scale) =>
        `Decision method set to ${label}. Scale ×${scale}`,
    autoMinGroup: "Target minimum size",
    autoMinAria: (px) => `Target minimum size: ${px} pixels`,
    autoMinAnnounce: (px, scale) =>
        `Target minimum size set to ${px} pixels. Scale ×${scale}`,
    autoStepGroup: "Fine-tune the scale",
    autoStepDecrease: "Decrease the scale by 0.1",
    autoStepIncrease: "Increase the scale by 0.1",
    autoScaleAnnounce: (scale) => `Scale ×${scale}`,
    analyze: "Analyze this page",
    analyzeAria: "Analyze the text sizes on this page",
    analyzeAnnounce: (medianPx, smallPercent, scale) =>
        `Page analyzed. Median text size ${medianPx} pixels, ` +
        `${smallPercent} percent of the text is small, current scale ×${scale}`,
    analyzeEmpty: "The page was analyzed, but no matching text was found",
    metricSamples: "Elements checked",
    metricSamplesValue: (count) => `${count}`,
    metricMedian: "Median text size",
    metricMinMax: "Min / max",
    metricSmallRatio: "Small text share",
    metricScale: "Current scale",

    selNeedSelection: "First, drag to select some text on the page",
    selUiBlocked: "Text inside the UniLens UI cannot be changed",
    selWhitespaceOnly:
        "A selection containing only whitespace cannot be changed",
    selApplied: (label, px) =>
        `Selected text set to ${label} (${px}px). The selection is kept`,
    selApplyFailed: (reason) => `Could not apply the change: ${reason}`,
    selNothingToClear: "There is no resized selection to undo",
    selClearFailed: "Could not undo the change",
    selCleared:
        "The size change on the selection has been undone. The selection is kept",
};

const MESSAGES: Record<A11yLang, A11yMessages> = { ja, en };

// ── Language state (persisted via settings.ts panelLang) ───────────────────

let configuredLang: A11yLang | null = null;
const ephemeralListeners: (() => void)[] = [];

function notifyLangListeners() {
    ephemeralListeners.forEach((cb) => cb());
}

/**
 * Guesses the initial language from the embedding page.
 *
 * `<html lang>` is checked first, since the site's own language is most
 * likely to match its readers' language. The browser's language settings
 * are checked next. If neither is Japanese or English, this falls back to
 * English (more people can read English than can read Japanese they don't understand).
 */
function detectLang(): A11yLang {
    if (typeof document === "undefined") return "ja";

    const tags: string[] = [document.documentElement.lang];
    if (typeof navigator !== "undefined") {
        tags.push(...(navigator.languages ?? []), navigator.language);
    }

    let sawTag = false;
    for (const tag of tags) {
        if (!tag) continue;
        sawTag = true;
        const primary = tag.toLowerCase().split("-")[0];
        if (primary === "ja") return "ja";
        if (primary === "en") return "en";
    }
    return sawTag ? "en" : "ja";
}

let currentLang: A11yLang | null = null;

export function getA11yLang(): A11yLang {
    const stored = getSettings().panelLang;
    if (stored) return stored;
    if (configuredLang) return configuredLang;
    if (currentLang === null) currentLang = detectLang();
    return currentLang;
}

/** The language chosen by the visitor. Persisted and carried over to later visits. */
export function setA11yLang(lang: A11yLang) {
    if (getA11yLang() === lang) return;
    configuredLang = null;
    currentLang = lang;
    updateSetting("panelLang", lang);
    notifyLangListeners();
}

/**
 * The default language specified by the embedding page. If the visitor has
 * already chosen their own, that takes priority, and this is never
 * persisted (so it keeps following the auto-detection condition if that ever changes).
 */
export function configureA11yLang(lang: A11yLang) {
    if (getSettings().panelLang != null) return;
    if (configuredLang === lang) return;
    configuredLang = lang;
    currentLang = lang;
    notifyLangListeners();
}

export function onA11yLangChange(cb: () => void): () => void {
    ephemeralListeners.push(cb);
    const unsubSettings = onSettingsChange(cb);
    return () => {
        ephemeralListeners.splice(ephemeralListeners.indexOf(cb), 1);
        unsubSettings();
    };
}

/** The current language's dictionary. Looked up fresh on every call, so it always reflects the latest language after a switch. */
export function t(): A11yMessages {
    return MESSAGES[getA11yLang()];
}

/**
 * Returns the language-switcher card's description text for every
 * supported language at once (regardless of the currently active language).
 *
 * This card is where a visitor who can't read the panel's language finds
 * the switcher, so it always shows every language's description, not just the current one.
 */
export function languageDescByLang(): { lang: A11yLang; text: string }[] {
    return A11Y_LANGS.map((lang) => ({
        lang,
        text: MESSAGES[lang].languageDesc,
    }));
}

/**
 * A label like "Standard 100%" that joins the name and the scale.
 * Assembled once here since both the panel and selectionTextSize use it.
 */
export function fontScaleLabel(level: 1 | 2 | 3): string {
    const { label, hint } = t().fontScale[level];
    return `${label} ${hint}`;
}

/** For tests/verification. Exposes the Japanese dictionary as the reference for the type and for coverage checks. */
export const A11Y_MESSAGES = MESSAGES;
