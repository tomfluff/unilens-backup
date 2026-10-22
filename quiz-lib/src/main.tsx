/**
 * UniLens Quiz — entry.
 *
 * The build (dist/quiz.js) exposes window.UniLensQuiz (and window.Quiz, when
 * the page has no global of that name already). Two ways to show a survey:
 *
 * - "page" (how the study uses it): the survey server's survey page,
 *   /survey?quiz=<id>&q=2&pid=P01&session=1 (survey-backend/survey.html), runs
 *     UniLensQuiz.init({ mode: "page", container: "#survey", src: "/api/quiz/<id>", backend, question: 2 })
 *   and the survey fills the page: no floating button, nothing on the test pages.
 *   The page holds one question: `question`, else the next one to answer.
 * - "link" (on the test pages): only the "アンケート（2/4）" button, showing the
 *   next question to answer; a click opens that question's page, carrying the
 *   participant and the way back (the survey is in Japanese only),
 *     UniLensQuiz.init({ mode: "link", survey: "unilens-poc", backend: "http://127.0.0.1:5100" })
 * - "panel": a button and floating panel over any host page,
 *     UniLensQuiz.init({ src: "quiz.json", backend: "http://127.0.0.1:5100" })
 *
 * The quiz comes from the host — inline (`quiz: {...}`) or as a JSON file
 * (`src`). Answers are kept in this browser so a reload resumes the attempt,
 * and, with `backend`, logged to the survey server (quizLog.ts).
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
    prepareQuestion,
    type QuizAnswerEvent,
    QuizApp,
    type QuizCallbacks,
    type QuizResult,
} from "./QuizPanel";
import {
    initQuizLog,
    readVisitorId,
    resolveStudyIds,
    stopQuizLog,
} from "./quizLog";
import { firstUnanswered, quizFingerprint, scoreOf } from "./quizLogic";
import {
    type AnswerRecord,
    clearAttempt,
    currentAttempt,
    setOpen,
    useQuizStore,
} from "./quizStore";
import { QUIZ_CSS } from "./quizStyles";
import { normalizeQuiz, type Quiz, type QuizInput } from "./quizTypes";
import { idsOf } from "./respondentIds";
import { SurveyLink } from "./SurveyLink";
import { safeReturnUrl } from "./surveyUrl";

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
     * "page": the survey fills `container` — the survey server's survey page.
     * "link": only the button; it opens the survey page (`survey` on `backend`).
     */
    mode?: QuizMode;
    /** link mode: the survey to open, by id (survey-backend/quizzes/<id>.json). */
    survey?: string;
    /** page mode: the element (or a selector for it) to fill. Default: a new one at the end of <body>. */
    container?: HTMLElement | string;
    /** page mode: show only this question (1-based), one page per question. Default: the next one to answer. */
    question?: number;
    /** page mode: the test page to go back to after answering (an absolute http(s) address). */
    returnTo?: string;
    /**
     * page mode: the page was opened in a tab of its own (the test pages' button
     * does this): going back closes the tab instead of loading the test page in it.
     */
    ownTab?: boolean;
    /** The quiz itself. Either this or `src`. */
    quiz?: QuizInput;
    /** URL of a JSON file holding the quiz (same shape as `quiz`). */
    src?: string;
    /**
     * The survey server to log answers to, e.g. "http://127.0.0.1:5100".
     * Omit to keep everything in the browser.
     */
    backend?: string;
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
    callbacks: QuizCallbacks;
    /** page mode: the one question shown (0-based); null for a finished attempt's answers (or panel mode) */
    question: number | null;
    returnTo: string | null;
    ownTab: boolean;
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
    const {
        quiz,
        mode,
        storeKey,
        fingerprint,
        callbacks,
        question,
        returnTo,
        ownTab,
        root,
    } = mounted;
    root.render(
        <QuizApp
            quiz={quiz}
            mode={mode}
            storeKey={storeKey}
            fingerprint={fingerprint}
            callbacks={callbacks}
            question={question}
            returnTo={returnTo}
            ownTab={ownTab}
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
let link: {
    container: HTMLElement;
    root: Root;
    cleanups: (() => void)[];
} | null = null;

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
    if (options.followDisplayPanel !== false)
        followDisplayPanel(container, cleanups);
    const root = createRoot(container);
    root.render(<SurveyLink backend={backend} survey={survey} />);
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
    const mode: "panel" | "page" = options.mode === "page" ? "page" : "panel";
    let question: number | null = null;
    if (mode === "page" && options.question !== undefined) {
        const n = Number(options.question);
        if (!Number.isInteger(n) || n < 1 || n > quiz.questions.length) {
            console.error(
                `[UniLens Quiz] question ${options.question}: this survey has questions 1-${quiz.questions.length}`,
            );
            return false;
        }
        question = n - 1;
    }

    ensureStyles();
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
    if (options.followDisplayPanel !== false)
        followDisplayPanel(container, cleanups);

    initQuizLog(options.backend);
    // One lab laptop, many participants: progress is kept per participant, so the
    // next pid starts afresh instead of landing on the last one's answers. Without
    // one, per anonymous visitor id when the button sent one (?vid=).
    const study = resolveStudyIds();
    const vid = study ? null : readVisitorId(location.href);
    const storeKey = study
        ? `${quiz.id}#${study.pid}#${study.session}`
        : vid
          ? `${quiz.id}#vid:${vid}`
          : quiz.id;
    const fingerprint = quizFingerprint(quiz);
    // The survey page shows one question at a time, always: opened without
    // `question` (an old link, or the button when it could not ask the backend
    // how far the visitor is) it shows the next question to answer, and the
    // address says which, so a reload stays on it. A finished attempt shows the
    // visitor's answers instead.
    if (mode === "page" && question === null) {
        const a = currentAttempt(storeKey, fingerprint, quiz.questions.length);
        const next = a ? firstUnanswered(quiz, a.answers) : 0;
        if (!a?.finishedAt && next >= 0) {
            question = next;
            try {
                const u = new URL(location.href);
                u.searchParams.set("q", String(next + 1));
                history.replaceState(history.state, "", u.href);
            } catch {
                // the page still shows that one question
            }
        }
    }
    if (question !== null)
        prepareQuestion(quiz, storeKey, fingerprint, question);
    mounted = {
        quiz,
        mode,
        storeKey,
        fingerprint,
        callbacks: {
            onAnswer: options.onAnswer,
            onComplete: options.onComplete,
        },
        question,
        returnTo: mode === "page" ? safeReturnUrl(options.returnTo) : null,
        ownTab: mode === "page" && options.ownTab === true,
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
        ...idsOf(a),
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
    getResult,
    isOpen,
    VERSION: "0.1.0",
};

export default UniLensQuiz;
export type { AnswerRecord, QuizAnswerEvent, QuizInput, QuizResult };
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
