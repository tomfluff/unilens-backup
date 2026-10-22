/**
 * Where the survey server listens and what it reads, from the environment.
 *
 * The questions (backend/quizzes/) and the page (backend/survey.html) stay
 * where the Flask backend reads them while both backends serve the survey, so
 * there is one copy of each; they move here once Flask's survey routes go. The
 * answers' log is this server's own: it does not share the Flask backend's
 * files.
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
        surveysDir: path(env.SURVEY_DEFINITIONS_DIR, "../backend/quizzes"),
        surveyPage: path(env.SURVEY_PAGE, "../backend/survey.html"),
        quizLibDist: path(env.QUIZ_LIB_DIST, "../quiz-lib/dist"),
    };
}
