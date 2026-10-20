/**
 * Link mode's only UI: the same green "アンケート" / "Survey" pill as the panel's
 * toggle, as a link to the survey page. It shows how far the visitor is —
 * "アンケート（2/4）": the next question to answer, of all — and leads to that
 * question's own page; once every question is answered, "アンケート（完了）" leads
 * to the visitor's answers.
 *
 * The progress comes from the backend (GET /api/quiz/<id>/progress), since the
 * survey page lives on the backend's origin and keeps its own storage there. It
 * is asked again whenever the page is shown (back from the survey, a tab coming
 * to the front), and the last answer is kept for the session so the next page
 * shows it at once. The address is built at the click, so a participant named
 * after the page loaded (or a facilitator's reset) is honoured.
 */

import { type MouseEvent, useEffect, useState } from "react";
import { QUIZ_PROGRESS_KEY, QUIZ_TOGGLE_ID } from "./domIds";
import { Icon } from "./QuizPanel";
import { MESSAGES, SURVEY_LANG } from "./quizI18n";
import { browserVisitorId, resolveStudyIds, type StudyIds } from "./quizLog";
import {
    parseProgress,
    SURVEY_TAB,
    type SurveyProgress,
    surveyPageUrl,
    surveyProgressUrl,
} from "./surveyUrl";

export interface SurveyLinkProps {
    backend: string;
    survey: string;
}

/** Who the survey is for: the participant, else this browser's anonymous id. */
function visitor(): { study: StudyIds | null; vid: string | null } {
    const study = resolveStudyIds();
    return { study, vid: study ? null : browserVisitorId() };
}

function cacheKey(survey: string): string {
    const { study, vid } = visitor();
    const who = study ? `${study.pid}#${study.session}` : (vid ?? "");
    return `${QUIZ_PROGRESS_KEY}:${survey}:${who}`;
}

function readCached(survey: string): SurveyProgress | null {
    try {
        const raw = window.sessionStorage.getItem(cacheKey(survey));
        return raw ? parseProgress(JSON.parse(raw)) : null;
    } catch {
        return null;
    }
}

function writeCached(survey: string, p: SurveyProgress | null) {
    try {
        const key = cacheKey(survey);
        if (p) window.sessionStorage.setItem(key, JSON.stringify(p));
        else window.sessionStorage.removeItem(key);
    } catch {
        // storage blocked: the button just waits for the backend each time
    }
}

export function SurveyLink({ backend, survey }: SurveyLinkProps) {
    // Japanese only, like the survey itself (quizI18n SURVEY_LANG)
    const lang = SURVEY_LANG;
    const m = MESSAGES[lang];
    const [progress, setProgress] = useState<SurveyProgress | null>(() =>
        readCached(survey),
    );

    useEffect(() => {
        let alive = true;
        let asked = 0;
        const refresh = () => {
            const { study, vid } = visitor();
            const url = surveyProgressUrl(backend, survey, study, vid);
            if (!url) return;
            const n = ++asked;
            fetch(url, { cache: "no-store" })
                .then((r) => (r.ok ? r.json() : null))
                .then((data) => {
                    // only the latest answer counts
                    if (!alive || n !== asked) return;
                    const p = parseProgress(data);
                    setProgress(p);
                    writeCached(survey, p);
                })
                // backend down: keep what is shown (or the plain button)
                .catch(() => {});
        };
        refresh();
        // back from the survey page with the browser's Back (a page from the cache)
        const onShow = (e: PageTransitionEvent) => {
            if (e.persisted) refresh();
        };
        // back to this tab from the survey's own tab (or window)
        const onVisible = () => {
            if (document.visibilityState === "visible") refresh();
        };
        window.addEventListener("pageshow", onShow);
        document.addEventListener("visibilitychange", onVisible);
        window.addEventListener("focus", refresh);
        return () => {
            alive = false;
            window.removeEventListener("pageshow", onShow);
            document.removeEventListener("visibilitychange", onVisible);
            window.removeEventListener("focus", refresh);
        };
    }, [backend, survey]);

    const href = () => {
        const { study, vid } = visitor();
        return surveyPageUrl(backend, survey, study, {
            // the next question's own page; once all are answered (or the progress
            // is unknown) the survey page, which shows the answers or the next question
            question: progress && !progress.completed ? progress.next : null,
            vid,
            returnTo: location.href,
            tab: true,
        });
    };
    /**
     * The survey opens in a tab of its own, so the test page stays as it is in
     * this one. Opened by script (in the click), the survey tab may close itself
     * when the participant goes back ("元のページに戻る"). Ctrl / Shift / middle
     * clicks are left to the browser; a blocked window falls back on the link's
     * own target, still a new tab.
     */
    function onClick(e: MouseEvent<HTMLAnchorElement>) {
        const url = href();
        e.currentTarget.href = url;
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
            return;
        const tab = window.open(url, SURVEY_TAB);
        if (!tab) return;
        e.preventDefault();
        tab.focus();
    }

    const text = !progress
        ? m.toggle
        : progress.completed || progress.next === null
          ? m.surveyDone
          : m.surveyAt(progress.next, progress.total);
    const label = !progress
        ? m.openSurvey
        : progress.completed || progress.next === null
          ? m.surveyDoneLabel
          : m.surveyAtLabel(progress.next, progress.total);

    return (
        <a
            id={QUIZ_TOGGLE_ID}
            lang={lang}
            className="unilens-quiz-toggle"
            href={href()}
            target={SURVEY_TAB}
            aria-label={label}
            data-progress={
                progress
                    ? progress.completed
                        ? "done"
                        : `${progress.next}/${progress.total}`
                    : undefined
            }
            onClick={onClick}
        >
            <Icon name="quiz" size={20} />
            <span>{text}</span>
        </a>
    );
}
