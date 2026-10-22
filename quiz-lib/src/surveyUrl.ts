/**
 * Link mode: the survey's own button on a test page only takes the participant
 * to the survey page on the survey server (survey-backend/survey.html), carrying
 * who they are. The survey itself, its progress and its log live there; the
 * button asks that server how far this visitor is (surveyProgressUrl) to show "アンケート（2/4）"
 * and open the next question's page.
 */

import type { StudyIds } from "./quizLog";

export interface SurveyPageExtras {
    /** 1-based: open only this question's page */
    question?: number | null;
    /** the anonymous visitor id, when the page names no participant */
    vid?: string | null;
    /** the test page to come back to after answering */
    returnTo?: string | null;
    /** the page opens in a tab of its own: going back closes that tab */
    tab?: boolean;
}

/** The window name the test pages' button opens the survey under: one survey tab, reused. */
export const SURVEY_TAB = "unilens-survey";

const root = (backend: string) => backend.trim().replace(/\/+$/, "");

/**
 * The survey page's address: /survey on `backend`, with the survey's id, the
 * question (when one page per question), the participant and session when the
 * page names one (else the visitor id) and the page to return to.
 */
export function surveyPageUrl(
    backend: string,
    survey: string,
    study: StudyIds | null,
    extras: SurveyPageExtras = {},
): string {
    const params = new URLSearchParams({ quiz: survey });
    const q = extras.question;
    if (typeof q === "number" && Number.isInteger(q) && q >= 1)
        params.set("q", String(q));
    if (study) {
        params.set("pid", study.pid);
        params.set("session", study.session);
    } else if (extras.vid) params.set("vid", extras.vid);
    if (extras.returnTo) params.set("return", extras.returnTo);
    if (extras.tab) params.set("tab", "1");
    return `${root(backend)}/survey?${params}`;
}

/** The backend's progress for this visitor (GET /api/quiz/<id>/progress), or null when there is no one to ask about. */
export function surveyProgressUrl(
    backend: string,
    survey: string,
    study: StudyIds | null,
    vid: string | null,
): string | null {
    const params = new URLSearchParams();
    if (study) {
        params.set("pid", study.pid);
        params.set("session", study.session);
    } else if (vid) params.set("vid", vid);
    else return null;
    return `${root(backend)}/api/quiz/${encodeURIComponent(survey)}/progress?${params}`;
}

/** What the button shows and where it leads, from the backend's answer. */
export interface SurveyProgress {
    total: number;
    /** 1-based, the first question not answered yet; null once all are */
    next: number | null;
    completed: boolean;
}

/** The progress endpoint's JSON, checked (it comes over the network). */
export function parseProgress(data: unknown): SurveyProgress | null {
    if (!data || typeof data !== "object") return null;
    const d = data as Record<string, unknown>;
    const total = d.total;
    if (typeof total !== "number" || !Number.isInteger(total) || total < 1)
        return null;
    const next =
        typeof d.next === "number" &&
        Number.isInteger(d.next) &&
        d.next >= 1 &&
        d.next <= total
            ? d.next
            : null;
    const completed = d.completed === true || next === null;
    return { total, next: completed ? null : next, completed };
}

/**
 * The survey page's ?return=: the test page to go back to, only as an absolute
 * http(s) address (never javascript: or the like).
 */
export function safeReturnUrl(raw: string | null | undefined): string | null {
    if (!raw) return null;
    try {
        const u = new URL(raw);
        return u.protocol === "http:" || u.protocol === "https:"
            ? u.href
            : null;
    } catch {
        return null;
    }
}
