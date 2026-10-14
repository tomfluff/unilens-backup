/**
 * Link mode's only UI: the same green "アンケート" / "Survey" pill as the panel's
 * toggle, as a link to the survey page. The address is built at the click, so
 * a participant named after the page loaded (or a facilitator's reset) is honoured.
 */

import type { MouseEvent } from "react";
import { QUIZ_TOGGLE_ID } from "./domIds";
import { MESSAGES } from "./quizI18n";
import { resolveStudyIds } from "./quizLog";
import { Icon } from "./QuizPanel";
import { surveyPageUrl } from "./surveyUrl";
import type { QuizLang } from "./quizTypes";

export interface SurveyLinkProps {
    backend: string;
    survey: string;
    lang: QuizLang;
}

export function SurveyLink({ backend, survey, lang }: SurveyLinkProps) {
    const m = MESSAGES[lang];
    const href = () => surveyPageUrl(backend, survey, resolveStudyIds(), lang);
    function onClick(e: MouseEvent<HTMLAnchorElement>) {
        e.currentTarget.href = href();
    }
    return (
        <a
            id={QUIZ_TOGGLE_ID}
            lang={lang}
            className="unilens-quiz-toggle"
            href={href()}
            aria-label={m.openSurvey}
            onClick={onClick}
        >
            <Icon name="quiz" size={20} />
            <span>{m.toggle}</span>
        </a>
    );
}
