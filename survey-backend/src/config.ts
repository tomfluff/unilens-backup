/**
 * Where the survey server listens and what it reads, from the environment.
 * By default everything is in this package: the questions (quizzes/), the page
 * (survey.html) and the answers' log (quiz-logs/, git-ignored). With
 * SURVEY_STORE=dynamodb the answers go to a DynamoDB table instead.
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
    /** where the answers go: JSONL files in logsDir, or a DynamoDB table */
    store: SurveyStoreKind;
    dynamo: {
        table: string;
        /** DynamoDB Local's address; unset for AWS */
        endpoint?: string;
        region?: string;
    };
}

export type SurveyStoreKind = "jsonl" | "dynamodb";

// This module is src/config.ts or bundled into dist/server.js: one level below the package either way.
const PACKAGE_ROOT = fileURLToPath(new URL("..", import.meta.url));

export const DEFAULT_PORT = 5100;
export const DEFAULT_TABLE = "unilens-survey";

export function configFromEnv(
    env: Readonly<Record<string, string | undefined>> = process.env,
): SurveyConfig {
    const path = (value: string | undefined, fallback: string) =>
        resolve(PACKAGE_ROOT, value || fallback);
    const port = Number(env.SURVEY_PORT);
    const store = env.SURVEY_STORE || "jsonl";
    // a typo here would quietly keep the answers somewhere else: refuse to start
    if (store !== "jsonl" && store !== "dynamodb")
        throw new Error(
            `SURVEY_STORE must be jsonl or dynamodb, not "${store}"`,
        );
    return {
        port: Number.isInteger(port) && port > 0 ? port : DEFAULT_PORT,
        logsDir: path(env.SURVEY_LOGS_DIR, "quiz-logs"),
        surveysDir: path(env.SURVEY_DEFINITIONS_DIR, "quizzes"),
        surveyPage: path(env.SURVEY_PAGE, "survey.html"),
        quizLibDist: path(env.QUIZ_LIB_DIST, "../quiz-lib/dist"),
        store,
        dynamo: {
            table: env.SURVEY_TABLE || DEFAULT_TABLE,
            endpoint: env.DYNAMODB_ENDPOINT || undefined,
            region: env.AWS_REGION || undefined,
        },
    };
}
