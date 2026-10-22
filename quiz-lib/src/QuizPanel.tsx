/**
 * Quiz panel — the React part of the widget: a toggle pill and a non-modal
 * dialog that walks through the questions (start → questions → last screen).
 * On the survey page it fills the page instead, with one question (`question`):
 * its answer, then a way back to the test page (or, once all are answered, the
 * visitor's answers).
 * By default it is a survey: nothing on screen says whether an answer was
 * right (quiz.showFeedback turns the verdicts and the score on).
 *
 * The screen on display is derived from the stored attempt (quizStore.ts), so
 * a reload lands on the same question, with the same feedback if it was
 * already answered. Focus follows the visitor: each new screen moves focus to
 * its heading (or, after an answer, to the verdict), so keyboard and
 * screen-reader users are never left on a control that just disappeared; the
 * verdict is also announced through a live region.
 */

import {
    createContext,
    type FormEvent,
    type HTMLAttributes,
    type KeyboardEvent,
    type ReactNode,
    type RefObject,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import {
    FOCUS_ATTR,
    QUIZ_PANEL_ID,
    QUIZ_TITLE_ID,
    QUIZ_TOGGLE_ID,
} from "./domIds";
import { localize, MESSAGES, type QuizMessages, SURVEY_LANG } from "./quizI18n";
import { flushQuizLog, logQuizEvent } from "./quizLog";
import {
    correctChoiceIds,
    isAnswerable,
    isCorrect,
    isGraded,
    nextUnanswered,
    orderedChoices,
    scoreOf,
} from "./quizLogic";
import {
    type AnswerRecord,
    type Attempt,
    currentAttempt,
    finishAttempt,
    goToQuestion,
    recordAnswer,
    setAttemptIds,
    setOpen,
    startAttempt,
    useQuizStore,
} from "./quizStore";
import type {
    ChoiceQuestion,
    Quiz,
    QuizLang,
    QuizQuestion,
    QuizResponse,
} from "./quizTypes";
import {
    checkId,
    type IdError,
    idFields,
    idsOf,
    type RespondentIds,
} from "./respondentIds";

// ── Public callback payloads ──────────────────────────────────────────────

export interface QuizAnswerEvent {
    quizId: string;
    attempt: string;
    questionId: string;
    /** 0-based position in the quiz */
    index: number;
    response: QuizResponse;
    /** the answer in words: the chosen choices' text, or what was typed */
    responseText: string;
    /** null: the question has no answer key */
    correct: boolean | null;
    /** ms from the question appearing to this answer */
    ms: number;
    /** the IDs typed before the first question */
    userId?: string;
    surveyId?: string;
}

export interface QuizResult {
    quizId: string;
    attempt: string;
    /** answers graded right (0 when nothing has an answer key) */
    correct: number;
    total: number;
    /** by question id */
    answers: Record<string, AnswerRecord>;
    /** ms from start to the last answer */
    durationMs: number;
    /** the IDs typed before the first question */
    userId?: string;
    surveyId?: string;
}

export interface QuizCallbacks {
    onAnswer?: (e: QuizAnswerEvent) => void;
    onComplete?: (r: QuizResult) => void;
}

/** A host callback that throws must not break the panel (CONTRIBUTING §3). */
function safeCall<T>(fn: ((arg: T) => void) | undefined, arg: T) {
    try {
        fn?.(arg);
    } catch (err) {
        console.error("[UniLens Quiz] callback failed", err);
    }
}

// ── Icons (no emoji as interface icons: PRODUCT.md) ───────────────────────

type IconName = "quiz" | "close" | "check" | "cross" | "next" | "alert";

const ICON_PATHS: Record<IconName, string> = {
    // a clipboard with lines: a form to fill in
    quiz: '<rect x="5" y="4.5" width="14" height="16.5" rx="2"/><path d="M9 4.5V3h6v1.5"/><path d="M8.5 10h7M8.5 13.5h7M8.5 17h4"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    cross: '<path d="M17 7 7 17M7 7l10 10"/>',
    next: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5"/><path d="M12 16.5h.01"/>',
};

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
    return (
        <svg
            viewBox="0 0 24 24"
            // in em, so icons grow with the text (the display panel's text size)
            width={`${size / 16}em`}
            height={`${size / 16}em`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            // a host `svg { fill: … }` rule beats presentation attributes; inline style wins
            style={{ fill: "none", stroke: "currentColor" }}
            // Paths are compile-time constants in ICON_PATHS, never host/user input.
            // biome-ignore lint/security/noDangerouslySetInnerHtml: static SVG fragments
            dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] }}
        />
    );
}

// ── Live region ───────────────────────────────────────────────────────────

let liveRegionEl: HTMLDivElement | null = null;
let liveTimer: number | undefined;

/** Clear, then refill, so the same message twice in a row is still read. */
function announce(message: string) {
    const region = liveRegionEl;
    if (!region || !message) return;
    region.textContent = "";
    window.clearTimeout(liveTimer);
    liveTimer = window.setTimeout(() => {
        region.textContent = message;
    }, 60);
}

// ── Helpers ───────────────────────────────────────────────────────────────

function choiceText(q: ChoiceQuestion, id: string, lang: QuizLang): string {
    const c = q.choices.find((c) => c.id === id);
    return c ? localize(c.text, lang) : id;
}

/** A response as words, for the verdict and the result list. */
function responseText(
    q: QuizQuestion,
    r: QuizResponse | undefined,
    lang: QuizLang,
    m: QuizMessages,
): string {
    if (r === undefined) return m.noAnswer;
    if (q.type === "text") return typeof r === "string" ? r : m.noAnswer;
    const ids = Array.isArray(r) ? r : [r];
    return ids.length
        ? ids
              .map((id) => choiceText(q, id, lang))
              .join(lang === "ja" ? "、" : ", ")
        : m.noAnswer;
}

function correctText(q: QuizQuestion, lang: QuizLang): string {
    if (q.type === "text") return q.accepted.join(lang === "ja" ? "、" : ", ");
    return correctChoiceIds(q)
        .map((id) => choiceText(q, id, lang))
        .join(lang === "ja" ? "、" : ", ");
}

const focusProps = (key: string) => ({ [FOCUS_ATTR]: key, tabIndex: -1 });

/**
 * Screen headings sit one level under the title: h3 under the panel's h2, h2
 * under the survey page's h1 (no skipped levels for screen-reader navigation).
 */
const ScreenHeadingLevel = createContext<"h2" | "h3">("h3");

function ScreenHeading(props: HTMLAttributes<HTMLHeadingElement>) {
    const Tag = useContext(ScreenHeadingLevel);
    return <Tag {...props} />;
}

/**
 * One question's page: make this question the one on screen, so its clock runs
 * from now. Nothing to do before the attempt has started (the respondent types
 * their IDs first; starting shows the question), for a question already answered
 * or a finished attempt, or for a question already on screen (a reload keeps its
 * clock).
 */
export function prepareQuestion(
    quiz: Quiz,
    storeKey: string,
    fingerprint: string,
    index: number,
) {
    const a = currentAttempt(storeKey, fingerprint, quiz.questions.length);
    if (!a || !idsOf(a) || a.finishedAt) return;
    if (a.answers[quiz.questions[index].id]) return;
    if (a.index !== index) goToQuestion(storeKey, index);
}

/** Back to the test page, once the answer has reached the backend (its button counts it), or after 2 s at most. */
function backTo(url: string, ownTab: boolean) {
    void Promise.race([
        flushQuizLog(),
        new Promise((done) => window.setTimeout(done, 2000)),
    ]).then(() => {
        if (!ownTab) {
            location.assign(url);
            return;
        }
        // The survey has a tab of its own (opened by the test page's button): close
        // it, and the test page is there in its tab. A browser that will not let
        // the page close the tab gets the test page in this one instead.
        try {
            window.opener?.focus();
        } catch {
            // another origin's window may refuse: closing still brings it back
        }
        window.close();
        window.setTimeout(() => {
            if (!window.closed) location.assign(url);
        }, 300);
    });
}

/** The survey page was opened in a tab of its own (?tab=1): going back closes it. */
const OwnTab = createContext(false);

/** This page's address for another question of the same survey (one page per question). */
function questionPageUrl(index: number): string {
    const u = new URL(location.href);
    u.searchParams.set("q", String(index + 1));
    return u.href;
}

// ── The widget ────────────────────────────────────────────────────────────

export interface QuizAppProps {
    quiz: Quiz;
    /** "panel": toggle + floating dialog; "page": the survey page itself (no toggle, no close) */
    mode: "panel" | "page";
    /** the store's key for this attempt (per quiz, and per participant) */
    storeKey: string;
    fingerprint: string;
    callbacks: QuizCallbacks;
    /** page mode: show only this question (0-based), one page per question */
    question?: number | null;
    /** page mode: the test page to go back to (an absolute http(s) address) */
    returnTo?: string | null;
    /** page mode: the page has a tab of its own; going back closes it */
    ownTab?: boolean;
}

export function QuizApp({
    quiz,
    mode,
    storeKey,
    fingerprint,
    callbacks,
    question = null,
    returnTo = null,
    ownTab = false,
}: QuizAppProps) {
    const page = mode === "page";
    /** one question's page: its index */
    const only =
        page &&
        typeof question === "number" &&
        question >= 0 &&
        question < quiz.questions.length
            ? question
            : null;
    // Japanese only (quizI18n SURVEY_LANG): no switch
    const lang: QuizLang = SURVEY_LANG;
    const m = MESSAGES[lang];
    const open = useQuizStore((s) => s.open);
    // subscribe to this quiz's attempt; read it through the validating accessor
    useQuizStore((s) => s.attempts[storeKey]);
    const attempt = currentAttempt(
        storeKey,
        fingerprint,
        quiz.questions.length,
    );

    const toggleRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLElement>(null);
    /** a focus request: the FOCUS_ATTR key, and a counter so the same key re-fires */
    const [focusReq, setFocusReq] = useState<{ key: string; n: number } | null>(
        null,
    );
    const requestFocus = (key: string) =>
        setFocusReq((prev) => ({ key, n: (prev?.n ?? 0) + 1 }));
    /** fallback start of the question on screen, for an attempt stored before
     *  `shownAt` was (the stored start is used whenever there is one) */
    const shownAt = useRef(Date.now());
    /** one question's page: answered here, now (not on an earlier visit) */
    const [savedNow, setSavedNow] = useState(false);
    const ids = idsOf(attempt);

    useEffect(() => {
        if (!focusReq || !open) return;
        panelRef.current
            ?.querySelector<HTMLElement>(`[${FOCUS_ATTR}="${focusReq.key}"]`)
            ?.focus();
    }, [focusReq, open]);

    const questionIndex = attempt && !attempt.finishedAt ? attempt.index : -1;
    // The clock runs from the question's first appearance to its answer, including
    // time with the panel closed: the answer is usually looked up on the page itself.
    // The start is stored with the attempt (quizStore `shownAt`), so a reload does
    // not restart it.
    // biome-ignore lint/correctness/useExhaustiveDependencies: restart the clock per question shown
    useEffect(() => {
        shownAt.current = Date.now();
    }, [questionIndex, attempt?.attempt]);

    /** what every event carries: the quiz, the language, and the respondent's IDs once typed */
    const base = (a: Attempt | null = attempt) => ({
        quiz: quiz.id,
        lang,
        ...idFields(idsOf(a)),
    });

    // The survey page is opened by its address: that counts as opening the survey.
    // biome-ignore lint/correctness/useExhaustiveDependencies: once per page load
    useEffect(() => {
        if (page)
            logQuizEvent("quiz_open", {
                ...base(),
                attempt: attempt?.attempt,
                ...(only !== null ? { question: quiz.questions[only].id } : {}),
            });
    }, []);

    // one question's page: that question is the one on screen (its clock), even if
    // another page of the survey moved the attempt on in the meantime
    useEffect(() => {
        if (only === null || !attempt || !ids || attempt.finishedAt) return;
        if (attempt.answers[quiz.questions[only].id]) return;
        if (attempt.index !== only) goToQuestion(storeKey, only);
    }, [only, attempt, ids, quiz, storeKey]);

    function openPanel() {
        setOpen(true);
        requestFocus("screen");
        logQuizEvent("quiz_open", { ...base(), attempt: attempt?.attempt });
    }

    function closePanel() {
        setOpen(false);
        toggleRef.current?.focus();
        logQuizEvent("quiz_close", { ...base(), attempt: attempt?.attempt });
    }

    /**
     * The respondent typed their IDs: start the attempt with them (on a question's
     * page, at that question), or add them to an attempt begun before they were
     * asked — its question's clock then runs from now, as it is only now shown.
     */
    function start(typed: RespondentIds) {
        if (attempt && !attempt.finishedAt) {
            setAttemptIds(storeKey, typed);
            logQuizEvent("quiz_ids", {
                ...base(),
                ...idFields(typed),
                attempt: attempt.attempt,
            });
            const at = only ?? attempt.index;
            if (!attempt.answers[quiz.questions[at].id])
                goToQuestion(storeKey, at);
        } else {
            const a = startAttempt(storeKey, fingerprint, typed);
            logQuizEvent("quiz_start", {
                ...base(a),
                attempt: a.attempt,
                total: quiz.questions.length,
                retry: false,
            });
            if (only !== null && only > 0) goToQuestion(storeKey, only);
        }
        requestFocus("screen");
    }

    function finish(a: Attempt) {
        finishAttempt(storeKey);
        // re-read: the last answer was recorded a moment ago
        const done =
            currentAttempt(storeKey, fingerprint, quiz.questions.length) ?? a;
        const score = scoreOf(quiz, done.answers);
        const last = Math.max(
            done.startedAt,
            ...Object.values(done.answers).map((r) => r.at),
        );
        const durationMs = last - done.startedAt;
        logQuizEvent("quiz_complete", {
            ...base(done),
            attempt: done.attempt,
            correct: score.correct,
            total: score.total,
            ms: durationMs,
        });
        safeCall(callbacks.onComplete, {
            quizId: quiz.id,
            attempt: done.attempt,
            correct: score.correct,
            total: score.total,
            answers: done.answers,
            durationMs,
            ...idsOf(done),
        });
        announce(
            quiz.showFeedback
                ? m.score(score.correct, score.total)
                : m.doneTitle,
        );
        requestFocus("screen");
    }

    function advance(a: Attempt) {
        // the next question not answered yet (one may have been answered on its own page)
        // (later ones first, then one skipped earlier); the end when none is left
        const next = nextUnanswered(quiz, a.answers, a.index);
        if (next >= 0) {
            goToQuestion(storeKey, next);
            requestFocus("screen");
        } else finish(a);
    }

    function submit(a: Attempt, q: QuizQuestion, response: QuizResponse) {
        const correct = isCorrect(q, response);
        const at = Date.now();
        const start =
            Number.isFinite(a.shownAt) && (a.shownAt as number) <= at
                ? (a.shownAt as number)
                : shownAt.current;
        const ms = Math.max(0, at - start);
        // the answer as the visitor read it (choice ids alone mean little in a log)
        const text = responseText(q, response, lang, m);
        recordAnswer(storeKey, q.id, {
            response,
            responseText: text,
            correct,
            at,
            ms,
        });
        logQuizEvent("quiz_answer", {
            ...base(a),
            attempt: a.attempt,
            question: q.id,
            index: a.index,
            response,
            response_text: text,
            correct,
            ms,
        });
        safeCall(callbacks.onAnswer, {
            quizId: quiz.id,
            attempt: a.attempt,
            questionId: q.id,
            index: a.index,
            response,
            responseText: text,
            correct,
            ms,
            ...idsOf(a),
        });
        if (only !== null) {
            // one question's page: say it is saved; the whole survey is done once
            // every question has its answer, whichever page each was answered on
            setSavedNow(true);
            const now = currentAttempt(
                storeKey,
                fingerprint,
                quiz.questions.length,
            );
            if (
                now &&
                !now.finishedAt &&
                nextUnanswered(quiz, now.answers, only) < 0
            )
                finish(now);
            else {
                announce(m.savedTitle);
                requestFocus("screen");
            }
            return;
        }
        if (quiz.showFeedback && correct !== null) {
            announce(
                correct
                    ? m.correct
                    : `${m.incorrect}. ${m.correctAnswer}: ${correctText(q, lang)}`,
            );
            requestFocus("feedback");
        } else advance(a);
    }

    function onPanelKeyDown(e: KeyboardEvent<HTMLDivElement>) {
        if (page) return; // a page has nothing to close
        if (e.key === "Escape" && !e.nativeEvent.isComposing) {
            e.stopPropagation();
            closePanel();
        }
    }

    const answered = attempt ? Object.keys(attempt.answers).length : 0;
    const total = quiz.questions.length;
    const title = localize(quiz.title, lang) || m.defaultTitle;

    // On the survey page the document is the survey: its title and language follow
    useEffect(() => {
        if (!page) return;
        document.title =
            only === null
                ? title
                : lang === "ja"
                  ? `${title}（${m.progress(only + 1, total)}）`
                  : `${title} (${m.progress(only + 1, total)})`;
        document.documentElement.lang = lang;
    }, [page, title, only, total, m]);

    let screen: ReactNode;
    // The IDs come first: before a new attempt, and for one begun before they were asked
    const needIds = !attempt || (!attempt.finishedAt && !ids);
    if (needIds) {
        screen = (
            <Intro
                quiz={quiz}
                lang={lang}
                m={m}
                resume={attempt !== null}
                onStart={start}
            />
        );
    } else if (only !== null && attempt) {
        const q = quiz.questions[only];
        if (attempt.answers[q.id] || attempt.finishedAt) {
            const next = nextUnanswered(quiz, attempt.answers, only);
            screen = (
                <QuestionDone
                    q={q}
                    index={only}
                    total={total}
                    answered={answered}
                    record={attempt.answers[q.id]}
                    savedNow={savedNow}
                    lang={lang}
                    m={m}
                    returnTo={returnTo}
                    nextIndex={next}
                />
            );
        } else {
            screen = (
                <QuestionView
                    key={`${attempt.attempt}-${q.id}`}
                    quiz={quiz}
                    q={q}
                    attempt={attempt}
                    index={only}
                    lang={lang}
                    m={m}
                    onSubmit={(r) => submit({ ...attempt, index: only }, q, r)}
                    onNext={() => {}}
                />
            );
        }
    } else if (attempt?.finishedAt) {
        screen = (
            <Result
                quiz={quiz}
                attempt={attempt}
                m={m}
                returnTo={page ? returnTo : null}
            />
        );
    } else if (attempt) {
        const q = quiz.questions[attempt.index];
        screen = (
            <QuestionView
                key={`${attempt.attempt}-${q.id}`}
                quiz={quiz}
                q={q}
                attempt={attempt}
                lang={lang}
                m={m}
                onSubmit={(r) => submit(attempt, q, r)}
                onNext={() => advance(attempt)}
            />
        );
    }

    // Fixed roles (not a ternary on `role`): biome a11y rejects onKeyDown /
    // aria-modal when the same element can also be a region.
    const panelInner = (
        <>
            <div className="unilens-quiz-header">
                {page ? (
                    <h1 id={QUIZ_TITLE_ID} className="unilens-quiz-title">
                        {title}
                    </h1>
                ) : (
                    <h2 id={QUIZ_TITLE_ID} className="unilens-quiz-title">
                        {title}
                    </h2>
                )}
                {!page && (
                    <button
                        type="button"
                        className="unilens-quiz-icon-btn"
                        aria-label={m.close}
                        title={m.close}
                        onClick={closePanel}
                    >
                        <Icon name="close" size={20} />
                    </button>
                )}
            </div>
            <div className="unilens-quiz-body">
                {ids && !needIds && (
                    // who is answering, on every screen after the IDs
                    <p className="unilens-quiz-ids">
                        {m.idsShown(ids.userId, ids.surveyId)}
                    </p>
                )}
                <OwnTab.Provider value={page && ownTab}>
                    <ScreenHeadingLevel.Provider value={page ? "h2" : "h3"}>
                        {screen}
                    </ScreenHeadingLevel.Provider>
                </OwnTab.Provider>
            </div>
            <div
                ref={(node) => {
                    liveRegionEl = node;
                }}
                className="unilens-quiz-sr-only"
                role="status"
                aria-live="polite"
                aria-atomic="true"
            />
        </>
    );

    return (
        <>
            {!page && (
                <button
                    ref={toggleRef}
                    id={QUIZ_TOGGLE_ID}
                    lang={lang}
                    type="button"
                    className="unilens-quiz-toggle"
                    aria-expanded={open}
                    aria-controls={QUIZ_PANEL_ID}
                    aria-label={m.toggleLabel(answered, total)}
                    onClick={() => (open ? closePanel() : openPanel())}
                >
                    <Icon name="quiz" size={20} />
                    <span>{m.toggle}</span>
                    {attempt && (
                        <span className="unilens-quiz-badge" aria-hidden="true">
                            {answered}/{total}
                        </span>
                    )}
                </button>
            )}
            {page ? (
                <section
                    ref={panelRef}
                    id={QUIZ_PANEL_ID}
                    lang={lang}
                    className="unilens-quiz-panel"
                    aria-labelledby={QUIZ_TITLE_ID}
                >
                    {panelInner}
                </section>
            ) : (
                <div
                    ref={panelRef as RefObject<HTMLDivElement | null>}
                    id={QUIZ_PANEL_ID}
                    lang={lang}
                    className="unilens-quiz-panel"
                    role="dialog"
                    aria-modal="false"
                    aria-labelledby={QUIZ_TITLE_ID}
                    hidden={!open}
                    onKeyDown={onPanelKeyDown}
                >
                    {panelInner}
                </div>
            )}
        </>
    );
}

// ── Screens ───────────────────────────────────────────────────────────────

/**
 * The start: the survey's length and description, then the respondent's user ID
 * and survey ID, both typed by hand (never filled in from the address), checked
 * before the first question.
 */
function Intro({
    quiz,
    lang,
    m,
    resume,
    onStart,
}: {
    quiz: Quiz;
    lang: QuizLang;
    m: QuizMessages;
    /** the attempt had begun before the IDs were asked: "continue" rather than "start" */
    resume: boolean;
    onStart: (ids: RespondentIds) => void;
}) {
    const description = localize(quiz.description, lang);
    const [userId, setUserId] = useState("");
    const [surveyId, setSurveyId] = useState("");
    const [errors, setErrors] = useState<{
        user: IdError | null;
        survey: IdError | null;
    }>({ user: null, survey: null });
    const userRef = useRef<HTMLInputElement>(null);
    const surveyRef = useRef<HTMLInputElement>(null);

    const errorText = (e: IdError, label: string) =>
        e === "missing" ? m.idMissing(label) : m.idInvalid(label);

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        const u = checkId(userId);
        const sv = checkId(surveyId);
        setErrors({ user: u.error, survey: sv.error });
        if (u.error || sv.error) {
            announce(
                u.error
                    ? errorText(u.error, m.userIdLabel)
                    : errorText(sv.error as IdError, m.surveyIdLabel),
            );
            (u.error ? userRef : surveyRef).current?.focus();
            return;
        }
        onStart({ userId: u.value, surveyId: sv.value });
    }

    return (
        <>
            <ScreenHeading
                className="unilens-quiz-heading"
                {...focusProps("screen")}
            >
                {m.questionCount(quiz.questions.length)}
            </ScreenHeading>
            {description && <p className="unilens-quiz-text">{description}</p>}
            <p className="unilens-quiz-text">{m.idsLead}</p>
            <form onSubmit={handleSubmit} noValidate>
                <p id="unilens-quiz-id-hint" className="unilens-quiz-legend">
                    {m.idHint}
                </p>
                <IdField
                    id="unilens-quiz-user-id"
                    label={m.userIdLabel}
                    value={userId}
                    onChange={(v) => {
                        setUserId(v);
                        setErrors((x) => ({ ...x, user: null }));
                    }}
                    error={errors.user && errorText(errors.user, m.userIdLabel)}
                    inputRef={userRef}
                />
                <IdField
                    id="unilens-quiz-survey-id"
                    label={m.surveyIdLabel}
                    value={surveyId}
                    onChange={(v) => {
                        setSurveyId(v);
                        setErrors((x) => ({ ...x, survey: null }));
                    }}
                    error={
                        errors.survey &&
                        errorText(errors.survey, m.surveyIdLabel)
                    }
                    inputRef={surveyRef}
                />
                <div className="unilens-quiz-actions">
                    <button type="submit" className="unilens-quiz-btn">
                        {resume ? m.resume : m.start}
                        <Icon name="next" />
                    </button>
                </div>
            </form>
        </>
    );
}

function IdField({
    id,
    label,
    value,
    onChange,
    error,
    inputRef,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    error: string | null;
    inputRef: RefObject<HTMLInputElement | null>;
}) {
    const errorId = `${id}-error`;
    return (
        <div className="unilens-quiz-field">
            <label htmlFor={id} className="unilens-quiz-field-label">
                {label}
            </label>
            <input
                ref={inputRef}
                id={id}
                className="unilens-quiz-input"
                type="text"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                required
                aria-required="true"
                aria-invalid={error ? true : undefined}
                aria-describedby={
                    error
                        ? `unilens-quiz-id-hint ${errorId}`
                        : "unilens-quiz-id-hint"
                }
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                    // Enter that confirms a Japanese IME conversion must not submit
                    if (
                        e.key === "Enter" &&
                        (e.nativeEvent.isComposing || e.keyCode === 229)
                    )
                        e.preventDefault();
                }}
            />
            {error && (
                <p id={errorId} className="unilens-quiz-error">
                    <Icon name="alert" />
                    {error}
                </p>
            )}
        </div>
    );
}

function Progress({
    index,
    total,
    m,
}: {
    index: number;
    total: number;
    m: QuizMessages;
}) {
    const pct = Math.round(((index + 1) / total) * 100);
    return (
        <div className="unilens-quiz-progress">
            <p className="unilens-quiz-progress-label">
                {m.progress(index + 1, total)}
            </p>
            <div className="unilens-quiz-bar" aria-hidden="true">
                <span style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

function QuestionView({
    quiz,
    q,
    attempt,
    index = attempt.index,
    lang,
    m,
    onSubmit,
    onNext,
}: {
    quiz: Quiz;
    q: QuizQuestion;
    attempt: Attempt;
    /** the question's position, when not the attempt's (one question's page) */
    index?: number;
    lang: QuizLang;
    m: QuizMessages;
    onSubmit: (r: QuizResponse) => void;
    onNext: () => void;
}) {
    const record = attempt.answers[q.id];
    const locked = record !== undefined;
    const [draft, setDraft] = useState<QuizResponse | undefined>(
        record?.response ?? (q.type === "multiple" ? [] : undefined),
    );
    const [missing, setMissing] = useState(false);
    const firstInput = useRef<HTMLInputElement>(null);
    const promptId = `unilens-quiz-prompt-${q.id}`;
    const hintId = `unilens-quiz-hint-${q.id}`;
    const errorId = `unilens-quiz-error-${q.id}`;
    const isLast = index + 1 >= quiz.questions.length;
    /** right/wrong is shown for this answer */
    const judged = locked && quiz.showFeedback && record?.correct != null;

    function update(r: QuizResponse) {
        if (locked) return;
        setDraft(r);
        setMissing(false);
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (locked) return;
        if (!isAnswerable(q, draft)) {
            setMissing(true);
            announce(m.needAnswer);
            firstInput.current?.focus();
            return;
        }
        onSubmit(draft as QuizResponse);
    }

    const hint =
        q.type === "single"
            ? m.chooseOne
            : q.type === "multiple"
              ? m.chooseAll
              : m.typeAnswer;
    const describedBy = missing ? `${hintId} ${errorId}` : hintId;

    return (
        <>
            <Progress index={index} total={quiz.questions.length} m={m} />
            <ScreenHeading
                id={promptId}
                className="unilens-quiz-heading"
                {...focusProps("screen")}
            >
                {localize(q.prompt, lang)}
            </ScreenHeading>
            <form onSubmit={handleSubmit} noValidate>
                {q.type === "text" ? (
                    <>
                        <p id={hintId} className="unilens-quiz-legend">
                            {hint}
                        </p>
                        <input
                            ref={firstInput}
                            className="unilens-quiz-input"
                            type="text"
                            autoComplete="off"
                            spellCheck={false}
                            aria-labelledby={promptId}
                            aria-describedby={describedBy}
                            aria-invalid={missing || undefined}
                            readOnly={locked}
                            value={typeof draft === "string" ? draft : ""}
                            onChange={(e) => update(e.target.value)}
                            onKeyDown={(e) => {
                                // Enter that confirms a Japanese IME conversion must not submit
                                if (
                                    e.key === "Enter" &&
                                    (e.nativeEvent.isComposing ||
                                        e.keyCode === 229)
                                )
                                    e.preventDefault();
                            }}
                        />
                    </>
                ) : (
                    <Choices
                        quiz={quiz}
                        q={q}
                        attempt={attempt}
                        draft={draft}
                        locked={locked}
                        showMarks={judged}
                        lang={lang}
                        m={m}
                        promptId={promptId}
                        hintId={hintId}
                        hint={hint}
                        describedBy={describedBy}
                        firstInput={firstInput}
                        onChange={update}
                    />
                )}
                {missing && (
                    <p
                        id={errorId}
                        className="unilens-quiz-error"
                        style={{ marginTop: "0.6em" }}
                    >
                        <Icon name="alert" />
                        {m.needAnswer}
                    </p>
                )}
                {!locked && (
                    <div
                        className="unilens-quiz-actions"
                        style={{ marginTop: "0.9em" }}
                    >
                        <button type="submit" className="unilens-quiz-btn">
                            {m.submit}
                        </button>
                    </div>
                )}
            </form>
            {judged && record && (
                <div
                    className="unilens-quiz-feedback"
                    data-correct={String(record.correct)}
                    {...focusProps("feedback")}
                >
                    <p className="unilens-quiz-verdict">
                        <Icon
                            name={record.correct ? "check" : "cross"}
                            size={22}
                        />
                        {record.correct ? m.correct : m.incorrect}
                    </p>
                    {!record.correct && (
                        <p className="unilens-quiz-text">
                            <span className="unilens-quiz-label">
                                {q.type === "text" && q.accepted.length > 1
                                    ? m.acceptedAnswers
                                    : m.correctAnswer}
                                {lang === "ja" ? "：" : ": "}
                            </span>
                            {correctText(q, lang)}
                        </p>
                    )}
                    {q.explanation && (
                        <p className="unilens-quiz-text">
                            <span className="unilens-quiz-label">
                                {m.explanation}
                                {lang === "ja" ? "：" : ": "}
                            </span>
                            {localize(q.explanation, lang)}
                        </p>
                    )}
                </div>
            )}
            {locked && (
                // Normally only after a verdict; also a way on if an answer was
                // stored without moving on (a reload at that very moment).
                <div className="unilens-quiz-actions">
                    <button
                        type="button"
                        className="unilens-quiz-btn"
                        onClick={onNext}
                    >
                        {isLast ? m.seeResult : m.next}
                        <Icon name="next" />
                    </button>
                </div>
            )}
        </>
    );
}

function Choices({
    quiz,
    q,
    attempt,
    draft,
    locked,
    showMarks,
    lang,
    m,
    promptId,
    hintId,
    hint,
    describedBy,
    firstInput,
    onChange,
}: {
    quiz: Quiz;
    q: ChoiceQuestion;
    attempt: Attempt;
    draft: QuizResponse | undefined;
    locked: boolean;
    showMarks: boolean;
    lang: QuizLang;
    m: QuizMessages;
    promptId: string;
    hintId: string;
    hint: string;
    describedBy: string;
    firstInput: RefObject<HTMLInputElement | null>;
    onChange: (r: QuizResponse) => void;
}) {
    const multiple = q.type === "multiple";
    const picked = new Set(Array.isArray(draft) ? draft : draft ? [draft] : []);
    const correct = new Set(correctChoiceIds(q));
    const choices = orderedChoices(
        q.choices,
        quiz.shuffleChoices,
        `${attempt.attempt}:${q.id}`,
    );
    const name = `unilens-quiz-${q.id}`;

    return (
        <fieldset
            className="unilens-quiz-fieldset"
            aria-labelledby={promptId}
            aria-describedby={describedBy}
        >
            <p id={hintId} className="unilens-quiz-legend">
                {hint}
            </p>
            <ul className="unilens-quiz-choices">
                {choices.map((c, i) => {
                    const isPicked = picked.has(c.id);
                    const isRight = correct.has(c.id);
                    const state = !showMarks
                        ? undefined
                        : isRight
                          ? "correct"
                          : isPicked
                            ? "wrong"
                            : undefined;
                    const inputId = `${name}-${c.id}`;
                    return (
                        <li key={c.id}>
                            <label
                                className="unilens-quiz-choice"
                                htmlFor={inputId}
                                data-state={state}
                                aria-disabled={locked || undefined}
                            >
                                <input
                                    ref={i === 0 ? firstInput : undefined}
                                    id={inputId}
                                    type={multiple ? "checkbox" : "radio"}
                                    name={name}
                                    value={c.id}
                                    checked={isPicked}
                                    aria-disabled={locked || undefined}
                                    onChange={(e) => {
                                        if (!multiple) {
                                            onChange(c.id);
                                            return;
                                        }
                                        const next = new Set(picked);
                                        if (e.target.checked) next.add(c.id);
                                        else next.delete(c.id);
                                        // keep the choices' own order, not the click order
                                        onChange(
                                            q.choices
                                                .map((x) => x.id)
                                                .filter((id) => next.has(id)),
                                        );
                                    }}
                                />
                                <span className="unilens-quiz-choice-body">
                                    <span>{localize(c.text, lang)}</span>
                                    {showMarks && (isRight || isPicked) && (
                                        <span className="unilens-quiz-marks">
                                            {isRight && (
                                                <span
                                                    className="unilens-quiz-mark"
                                                    data-kind="correct"
                                                >
                                                    <Icon
                                                        name="check"
                                                        size={14}
                                                    />
                                                    {m.choiceCorrectMark}
                                                </span>
                                            )}
                                            {isPicked && (
                                                <span
                                                    className="unilens-quiz-mark"
                                                    data-kind={
                                                        isRight
                                                            ? "picked"
                                                            : "wrong"
                                                    }
                                                >
                                                    {!isRight && (
                                                        <Icon
                                                            name="cross"
                                                            size={14}
                                                        />
                                                    )}
                                                    {m.choicePickedMark}
                                                </span>
                                            )}
                                        </span>
                                    )}
                                </span>
                            </label>
                        </li>
                    );
                })}
            </ul>
        </fieldset>
    );
}

/**
 * The end, once every question is answered: thanks (or, with feedback on, the
 * score), and the way back to the test page. No list of the answers and no
 * "answer again": the survey is answered once.
 */
function Result({
    quiz,
    attempt,
    m,
    returnTo = null,
}: {
    quiz: Quiz;
    attempt: Attempt;
    m: QuizMessages;
    returnTo?: string | null;
}) {
    const score = scoreOf(quiz, attempt.answers);
    const pct = score.total
        ? Math.round((score.correct / score.total) * 100)
        : 0;
    // the score only counts when there was something to grade
    const scored = quiz.showFeedback && quiz.questions.some(isGraded);
    return (
        <>
            <ScreenHeading
                className="unilens-quiz-heading"
                {...focusProps("screen")}
            >
                {scored ? m.resultTitle : m.doneTitle}
            </ScreenHeading>
            {scored ? (
                <>
                    <p className="unilens-quiz-score">
                        {m.score(score.correct, score.total)}
                    </p>
                    <p className="unilens-quiz-muted">{m.percent(pct)}</p>
                </>
            ) : (
                <p className="unilens-quiz-muted">{m.doneNote}</p>
            )}
            {returnTo && (
                <div className="unilens-quiz-actions">
                    <BackLink url={returnTo} label={m.finishSurvey} />
                </div>
            )}
        </>
    );
}

/**
 * The way back to the test page ("元のページに戻る", or "アンケートを終了する" on
 * the last page): a real link (it can be opened elsewhere), that first lets the
 * answer reach the backend.
 */
function BackLink({ url, label }: { url: string; label: string }) {
    const ownTab = useContext(OwnTab);
    return (
        <a
            className="unilens-quiz-btn"
            href={url}
            onClick={(e) => {
                if (
                    e.button !== 0 ||
                    e.metaKey ||
                    e.ctrlKey ||
                    e.shiftKey ||
                    e.altKey
                )
                    return;
                e.preventDefault();
                backTo(url, ownTab);
            }}
        >
            {label}
            <Icon name="next" />
        </a>
    );
}

/**
 * One question's page, once it is answered: saved (or answered on an earlier
 * visit), what the visitor answered, how many of the survey's questions are
 * answered, and the way back to the test page — or, opened without one, to the
 * next question's page.
 */
function QuestionDone({
    q,
    index,
    total,
    answered,
    record,
    savedNow,
    lang,
    m,
    returnTo,
    nextIndex,
}: {
    q: QuizQuestion;
    index: number;
    total: number;
    answered: number;
    record: AnswerRecord | undefined;
    savedNow: boolean;
    lang: QuizLang;
    m: QuizMessages;
    returnTo: string | null;
    nextIndex: number;
}) {
    const ownTab = useContext(OwnTab);
    const all = nextIndex < 0;
    return (
        <>
            <ScreenHeading
                className="unilens-quiz-heading"
                {...focusProps("screen")}
            >
                {savedNow ? m.savedTitle : m.alreadyAnswered}
            </ScreenHeading>
            <p className="unilens-quiz-text">
                {all ? m.allAnswered : m.answeredOf(answered, total)}
            </p>
            <ol className="unilens-quiz-review" start={index + 1}>
                <li>
                    <p className="unilens-quiz-review-head">
                        <span>{m.questionN(index + 1)}</span>
                    </p>
                    <p className="unilens-quiz-text">
                        {localize(q.prompt, lang)}
                    </p>
                    <dl>
                        <dt>{m.yourAnswer}</dt>
                        <dd>
                            {record
                                ? record.responseText ||
                                  responseText(q, record.response, lang, m)
                                : m.noAnswer}
                        </dd>
                    </dl>
                </li>
            </ol>
            {returnTo && !all && (
                <p className="unilens-quiz-muted">
                    {ownTab ? m.backNoteTab : m.backNote}
                </p>
            )}
            <div className="unilens-quiz-actions">
                {returnTo && (
                    <BackLink
                        url={returnTo}
                        label={all ? m.finishSurvey : m.backToPage}
                    />
                )}
                {!returnTo && !all && (
                    <a
                        className="unilens-quiz-btn"
                        href={questionPageUrl(nextIndex)}
                    >
                        {m.nextQuestionAt(nextIndex + 1, total)}
                        <Icon name="next" />
                    </a>
                )}
            </div>
        </>
    );
}
