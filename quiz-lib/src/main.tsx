/**
 * UniLens Quiz — embeddable entry.
 *
 * Embed build (dist/quiz.js) exposes window.UniLensQuiz (and window.Quiz, when
 * the page has no global of that name already):
 *
 *   <script src="quiz.js"></script>
 *   <script>
 *     UniLensQuiz.init({ src: "quiz.json", backend: "http://127.0.0.1:5000" })
 *   </script>
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
import { initQuizLog, stopQuizLog } from "./quizLog";
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

export interface QuizInitOptions extends QuizCallbacks {
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
    const { quiz, fingerprint, lang, callbacks, root } = mounted;
    // the toggle and panel carry `lang` themselves: the visitor's switch can change it
    root.render(
        <QuizApp
            quiz={quiz}
            fingerprint={fingerprint}
            defaultLang={lang}
            callbacks={callbacks}
        />,
    );
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
    const container = document.createElement("div");
    container.id = QUIZ_ROOT_ID;
    container.setAttribute(UI_ATTR, "1");
    const position = QUIZ_POSITIONS.includes(options.position as QuizPosition)
        ? (options.position as QuizPosition)
        : "top-left";
    container.setAttribute(POSITION_ATTR, position);
    // documentElement, not body: UniLens' magnifier transforms body, and its
    // own chrome stays at 1x outside it (CONTRIBUTING §1)
    document.documentElement.appendChild(container);

    const cleanups: (() => void)[] = [];
    if (options.followDisplayPanel !== false) {
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

    initQuizLog(options.backend);
    mounted = {
        quiz,
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
    setOpen(options.open === true);
    render();
    return true;
}

/** Remove the widget and its styles. Progress stays in the browser. */
export function destroy() {
    generation++;
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
    if (mounted) setOpen(false);
}

/** Forget this quiz's progress in the browser; the panel shows the start screen. */
export function reset() {
    if (mounted) clearAttempt(mounted.quiz.id);
}

/** Switch the interface language, as the panel's 日本語 / English switch does (remembered). */
export function setLang(lang: QuizLang) {
    if (!mounted || !isQuizLang(lang)) return;
    setChosenLang(lang);
}

/** The current attempt's score and answers, or null before the first start. */
export function getResult(): QuizResult | null {
    if (!mounted) return null;
    const { quiz, fingerprint } = mounted;
    const a = currentAttempt(quiz.id, fingerprint, quiz.questions.length);
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
