/**
 * Where the survey server listens and what it reads, from the environment.
 * By default everything is in this package: the questions (quizzes/), the page
 * (survey.html) and the answers' log (quiz-logs/, git-ignored).
 */

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface SurveyConfig {
    port: number;
    /** the answers' log: <dir>/<quiz id>.jsonl */
    logsDir: string;
    /** the surveys' questions: <dir>/<quiz id>.json */
    surveysDir: string;
    /** the survey page, GET /survey */
    surveyPage: string;
    /** quiz-lib's build (quiz.js), which the survey page loads */
    quizLibDist: string;
}

// This module is src/config.ts or bundled into dist/server.js: one level below the package either way.
const PACKAGE_ROOT = fileURLToPath(new URL("..", import.meta.url));

export const DEFAULT_PORT = 5100;

export function configFromEnv(
    env: Readonly<Record<string, string | undefined>> = process.env,
): SurveyConfig {
    const path = (value: string | undefined, fallback: string) =>
        resolve(PACKAGE_ROOT, value || fallback);
    const port = Number(env.SURVEY_PORT);
    return {
        port: Number.isInteger(port) && port > 0 ? port : DEFAULT_PORT,
        logsDir: path(env.SURVEY_LOGS_DIR, "quiz-logs"),
        surveysDir: path(env.SURVEY_DEFINITIONS_DIR, "quizzes"),
        surveyPage: path(env.SURVEY_PAGE, "survey.html"),
        quizLibDist: path(env.QUIZ_LIB_DIST, "../quiz-lib/dist"),
    };
}
