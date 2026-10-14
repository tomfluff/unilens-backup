/**
 * Link mode: the survey's own button on a test page only takes the participant
 * to the survey page on the backend (backend/survey.html), carrying who they are
 * and the page's language. The survey itself, its progress and its log live there.
 */

import type { StudyIds } from "./quizLog";
import type { QuizLang } from "./quizTypes";

/**
 * The survey page's address: /survey on `backend`, with the survey's id, the
 * participant and session when the page names one, and the language.
 */
export function surveyPageUrl(
    backend: string,
    survey: string,
    study: StudyIds | null,
    lang: QuizLang | null,
): string {
    const params = new URLSearchParams({ quiz: survey });
    if (study) {
        params.set("pid", study.pid);
        params.set("session", study.session);
    }
    if (lang) params.set("lang", lang);
    return `${backend.trim().replace(/\/+$/, "")}/survey?${params}`;
}
