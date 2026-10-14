/**
 * UniLens Quiz — entry.
 *
 * The build (dist/quiz.js) exposes window.UniLensQuiz (and window.Quiz, when
 * the page has no global of that name already). Two ways to show a survey:
 *
 * - "page" (how the study uses it): the backend's survey page,
 *   /survey?quiz=<id>&pid=P01&session=1&lang=ja (backend/survey.html), runs
 *     UniLensQuiz.init({ mode: "page", container: "#survey", src: "/api/quiz/<id>", backend })
 *   and the survey fills the page: no floating button, nothing on the test pages.
 * - "link" (on the test pages): only the "アンケート" button; a click opens that
 *   survey page, carrying the participant and the language,
 *     UniLensQuiz.init({ mode: "link", survey: "unilens-poc", backend: "http://127.0.0.1:5000" })
 * - "panel": a button and floating panel over any host page,
 *     UniLensQuiz.init({ src: "quiz.json", backend: "http://127.0.0.1:5000" })
 *
 * The quiz comes from the host — inline (`quiz: {...}`) or as a JSON file
 * (`src`). Answers are kept in this browser so a reload resumes the attempt,
 * and, with `backend`, logged to the UniLens backend (quizLog.ts).
 *
 * Widget CSS is bundled into the script and injected on init.
 */

import { createRoot, type Root } from "react-dom/client";
import {
    CONTRAST_ATTR,
    FOCUS_ATTR,
    MODE_ATTR,
    POSITION_ATTR,
    QUIZ_ROOT_ID,
    QUIZ_STYLE_ID,
    TEXT_SIZE_ATTR,
    UI_ATTR,
} from "./domIds";
import {
    type QuizAnswerEvent,
    QuizApp,
    type QuizCallbacks,
    type QuizResult,
} from "./QuizPanel";
import { detectLang, isQuizLang } from "./quizI18n";
import { initQuizLog, resolveStudyIds, stopQuizLog } from "./quizLog";
import { quizFingerprint, scoreOf } from "./quizLogic";
import {
    type AnswerRecord,
    clearAttempt,
    currentAttempt,
    setChosenLang,
    setOpen,
    useQuizStore,
} from "./quizStore";
import { QUIZ_CSS } from "./quizStyles";
import { SurveyLink } from "./SurveyLink";
import {
    normalizeQuiz,
    type Quiz,
    type QuizInput,
    type QuizLang,
} from "./quizTypes";

export const QUIZ_POSITIONS = [
    "top-right",
    "top-left",
    "bottom-right",
    "bottom-left",
] as const;
export type QuizPosition = (typeof QUIZ_POSITIONS)[number];
export type QuizMode = "panel" | "page" | "link";

export interface QuizInitOptions extends QuizCallbacks {
    /**
     * "panel" (default): a button and floating panel over the host page.
     * "page": the survey fills `container` — the backend's survey page.
     * "link": only the button; it opens the survey page (`survey` on `backend`).
     */
    mode?: QuizMode;
    /** link mode: the survey to open, by id (backend/quizzes/<id>.json). */
    survey?: string;
    /** page mode: the element (or a selector for it) to fill. Default: a new one at the end of <body>. */
    container?: HTMLElement | string;
    /** The quiz itself. Either this or `src`. */
    quiz?: QuizInput;
    /** URL of a JSON file holding the quiz (same shape as `quiz`). */
    src?: string;
    /**
     * UniLens backend to log answers to, e.g. "http://127.0.0.1:5000".
     * Omit to keep everything in the browser.
     */
    backend?: string;
    /** Interface language. Default: `<html lang>`, then the browser's. */
    lang?: QuizLang;
    /**
     * Corner for the toggle; the panel opens from it. Default "top-left": the
     * display panel's button sits bottom-right and UniLens' settings gear
     * bottom-left, and the quiz leaves both where they are.
     */
    position?: QuizPosition;
    /** Open the panel as soon as it is ready. Default false. */
    open?: boolean;
    /**
     * Follow the display panel when it is on the page: its high-contrast theme,
     * and its text size (large / extra large make the survey's text larger too).
     * Default true.
     */
    followDisplayPanel?: boolean;
}

/** The slice of accessibility-lib's API this widget reads, when it is on the page. */
interface DisplayPanelApi {
    a11ySettings?: { theme?: string; fontSize?: string };
    onA11yChange?: (cb: () => void) => () => void;
}

interface Mounted {
    quiz: Quiz;
    mode: "panel" | "page";
    /** where this browser keeps the attempt: per quiz, and per participant when the address names one */
    storeKey: string;
    fingerprint: string;
    lang: QuizLang;
    callbacks: QuizCallbacks;
    container: HTMLElement;
    root: Root;
    cleanups: (() => void)[];
}

let mounted: Mounted | null = null;
/** bumped by destroy(), so a fetch that lands afterwards mounts nothing */
let generation = 0;

async function loadQuizInput(options: QuizInitOptions): Promise<unknown> {
    if (options.quiz) return options.quiz;
    if (!options.src) throw new Error('pass "quiz" or "src"');
    const res = await fetch(new URL(options.src, location.href).href, {
        credentials: "same-origin",
    });
    if (!res.ok) throw new Error(`${options.src}: HTTP ${res.status}`);
    return res.json();
}

function ensureStyles() {
    let style = document.getElementById(QUIZ_STYLE_ID);
    if (!style) {
        style = document.createElement("style");
        style.id = QUIZ_STYLE_ID;
        document.head.appendChild(style);
    }
    style.textContent = QUIZ_CSS;
}

function displayPanel(): DisplayPanelApi | undefined {
    const w = window as unknown as {
        Accessibility?: DisplayPanelApi;
        UniLensA11y?: DisplayPanelApi;
    };
    return w.Accessibility ?? w.UniLensA11y;
}

function render() {
    if (!mounted) return;
    const { quiz, mode, storeKey, fingerprint, lang, callbacks, root } =
        mounted;
    // the toggle and panel carry `lang` themselves: the visitor's switch can change it
    root.render(
        <QuizApp
            quiz={quiz}
            mode={mode}
            storeKey={storeKey}
            fingerprint={fingerprint}
            defaultLang={lang}
            callbacks={callbacks}
        />,
    );
}

/** Follow the display panel's high-contrast theme and text size, when it is on the page. */
function followDisplayPanel(container: HTMLElement, cleanups: (() => void)[]) {
    const a11y = displayPanel();
    const sync = () => {
        if (a11y?.a11ySettings?.theme === "high-contrast")
            container.setAttribute(CONTRAST_ATTR, "high");
        else container.removeAttribute(CONTRAST_ATTR);
        const size = a11y?.a11ySettings?.fontSize;
        if (size === "large" || size === "xlarge")
            container.setAttribute(TEXT_SIZE_ATTR, size);
        else container.removeAttribute(TEXT_SIZE_ATTR);
    };
    sync();
    const off = a11y?.onA11yChange?.(sync);
    if (off) cleanups.push(off);
}

/** link mode: what is on the page (no quiz is loaded there) */
let link: { container: HTMLElement; root: Root; cleanups: (() => void)[] } | null =
    null;

/** The "アンケート" button as a link to the survey page; no questions load here. */
function mountLink(options: QuizInitOptions): boolean {
    if (link) return true;
    const backend = (options.backend ?? "").trim();
    const survey = (options.survey ?? "").trim();
    if (!backend || !/^[A-Za-z0-9_-]{1,64}$/.test(survey)) {
        console.error(
            '[UniLens Quiz] link mode needs `backend` and `survey` (a survey id, e.g. "unilens-poc")',
        );
        return false;
    }
    ensureStyles();
    const container = document.createElement("div");
    container.id = QUIZ_ROOT_ID;
    container.setAttribute(UI_ATTR, "1");
    container.setAttribute(MODE_ATTR, "link");
    const position = QUIZ_POSITIONS.includes(options.position as QuizPosition)
        ? (options.position as QuizPosition)
        : "top-left";
    container.setAttribute(POSITION_ATTR, position);
    // documentElement, not body, as the panel (CONTRIBUTING §1)
    document.documentElement.appendChild(container);
    const cleanups: (() => void)[] = [];
    if (options.followDisplayPanel !== false) followDisplayPanel(container, cleanups);
    const root = createRoot(container);
    // the button speaks the page's language, and the survey opens in it
    const lang = isQuizLang(options.lang) ? options.lang : detectLang();
    root.render(<SurveyLink backend={backend} survey={survey} lang={lang} />);
    link = { container, root, cleanups };
    return true;
}

/**
 * Load the quiz and show the toggle. Resolves true once mounted, false when the
 * quiz could not be loaded or is invalid (the reasons go to the console; the
 * page is left untouched).
 */
export async function init(options: QuizInitOptions = {}): Promise<boolean> {
    if (mounted) {
        console.warn(
            "[UniLens Quiz] already initialized; call destroy() first",
        );
        return true;
    }
    if (options.mode === "link") return mountLink(options);
    const gen = ++generation;
    let raw: unknown;
    try {
        raw = await loadQuizInput(options);
    } catch (err) {
        console.error("[UniLens Quiz] could not load the quiz:", err);
        return false;
    }
    if (gen !== generation || mounted) return false;

    const { quiz, errors } = normalizeQuiz(raw);
    for (const e of errors) console.warn(`[UniLens Quiz] ${e}`);
    if (!quiz) return false;

    ensureStyles();
    const mode: "panel" | "page" = options.mode === "page" ? "page" : "panel";
    const container = document.createElement("div");
    container.id = QUIZ_ROOT_ID;
    container.setAttribute(UI_ATTR, "1");
    container.setAttribute(MODE_ATTR, mode);
    if (mode === "page") {
        const host =
            typeof options.container === "string"
                ? document.querySelector<HTMLElement>(options.container)
                : options.container;
        (host ?? document.body).appendChild(container);
    } else {
        const position = QUIZ_POSITIONS.includes(
            options.position as QuizPosition,
        )
            ? (options.position as QuizPosition)
            : "top-left";
        container.setAttribute(POSITION_ATTR, position);
        // documentElement, not body: UniLens' magnifier transforms body, and its
        // own chrome stays at 1x outside it (CONTRIBUTING §1)
        document.documentElement.appendChild(container);
    }

    const cleanups: (() => void)[] = [];
    if (options.followDisplayPanel !== false) followDisplayPanel(container, cleanups);

    initQuizLog(options.backend);
    // One lab laptop, many participants: progress is kept per participant, so the
    // next pid starts afresh instead of landing on the last one's answers.
    const study = resolveStudyIds();
    mounted = {
        quiz,
        mode,
        storeKey: study ? `${quiz.id}#${study.pid}#${study.session}` : quiz.id,
        fingerprint: quizFingerprint(quiz),
        lang: isQuizLang(options.lang) ? options.lang : detectLang(),
        callbacks: {
            onAnswer: options.onAnswer,
            onComplete: options.onComplete,
        },
        container,
        root: createRoot(container),
        cleanups,
    };
    // a page is the survey itself: always open
    setOpen(mode === "page" || options.open === true);
    render();
    return true;
}

/** Remove the widget and its styles. Progress stays in the browser. */
export function destroy() {
    generation++;
    if (link) {
        for (const off of link.cleanups) off();
        link.root.unmount();
        link.container.remove();
        document.getElementById(QUIZ_STYLE_ID)?.remove();
        link = null;
    }
    if (!mounted) return;
    for (const off of mounted.cleanups) off();
    mounted.root.unmount();
    mounted.container.remove();
    document.getElementById(QUIZ_STYLE_ID)?.remove();
    stopQuizLog();
    setOpen(false);
    mounted = null;
}

export function open() {
    if (!mounted) return;
    setOpen(true);
    // move focus in, as a click on the toggle would — after React has shown the panel
    window.setTimeout(() =>
        mounted?.container
            .querySelector<HTMLElement>(`[${FOCUS_ATTR}]`)
            ?.focus(),
    );
}

export function close() {
    if (mounted && mounted.mode === "panel") setOpen(false);
}

/** Forget this quiz's progress in the browser; the panel shows the start screen. */
export function reset() {
    if (mounted) clearAttempt(mounted.storeKey);
}

/** Switch the interface language, as the panel's 日本語 / English switch does (remembered). */
export function setLang(lang: QuizLang) {
    if (!mounted || !isQuizLang(lang)) return;
    setChosenLang(mounted.storeKey, lang);
}

/** The current attempt's score and answers, or null before the first start. */
export function getResult(): QuizResult | null {
    if (!mounted) return null;
    const { quiz, fingerprint, storeKey } = mounted;
    const a = currentAttempt(storeKey, fingerprint, quiz.questions.length);
    if (!a) return null;
    const { correct, total } = scoreOf(quiz, a.answers);
    const last = Math.max(
        a.startedAt,
        ...Object.values(a.answers).map((r) => r.at),
    );
    return {
        quizId: quiz.id,
        attempt: a.attempt,
        correct,
        total,
        answers: a.answers,
        durationMs: last - a.startedAt,
    };
}

/** Whether the panel is open. */
export const isOpen = () => useQuizStore.getState().open;

const UniLensQuiz = {
    init,
    destroy,
    open,
    close,
    reset,
    setLang,
    getResult,
    isOpen,
    VERSION: "0.1.0",
};

export default UniLensQuiz;
export type { AnswerRecord, QuizAnswerEvent, QuizInput, QuizLang, QuizResult };
export { UniLensQuiz };

declare global {
    interface Window {
        UniLensQuiz: typeof UniLensQuiz;
    }
}

window.UniLensQuiz = UniLensQuiz;
// the short name only when the page does not use it for something of its own
if (!("Quiz" in window))
    (window as unknown as { Quiz: typeof UniLensQuiz }).Quiz = UniLensQuiz;
