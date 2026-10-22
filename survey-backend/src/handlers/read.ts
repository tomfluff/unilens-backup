/**
 * The survey's read API: the questions, the list of surveys, the results (JSON
 * and CSV) and one visitor's progress.
 */

import {
    filterAttempts,
    questionOrder,
    quizAttempts,
    quizProgress,
} from "../core/attempts.ts";
import { field, QUIZ_ID, QUIZ_VISITOR, STUDY_PID } from "../core/quizEvents.ts";
import { resultsCsv } from "../core/resultsCsv.ts";
import { type Handler, json } from "./http.ts";

/** GET /api/quiz/:quiz — the survey's questions, under the id in its address. */
export const getSurvey: Handler = async (req, deps) => {
    const quiz = req.params.quiz;
    const data = await deps.surveys.get(quiz);
    if (!data) return json(404, { error: "no such survey" });
    // answers are logged under the name in the address, whatever the file's own id says
    return json(200, { ...data, id: quiz });
};

/** GET /api/quiz — the defined and the logged surveys, with their counts. */
export const listSurveys: Handler = async (_req, deps) => {
    const ids = new Set([
        ...(await deps.surveys.list()),
        ...(await deps.events.quizzes()),
    ]);
    const quizzes = [];
    for (const quiz of [...ids].filter((i) => QUIZ_ID.test(i)).sort()) {
        const definition = await deps.surveys.get(quiz);
        const events = (await deps.events.read(quiz)) ?? [];
        const attempts = quizAttempts(events);
        quizzes.push({
            id: quiz,
            title: definition ? (field(definition, "title") ?? null) : null,
            defined: definition !== null,
            questions: questionOrder(definition).length,
            attempts: attempts.length,
            completed: attempts.filter((a) => a.completed).length,
            last_event_at: events.length
                ? (field(events[events.length - 1], "t") ?? null)
                : null,
        });
    }
    return json(200, { quizzes });
};

/** GET /api/quiz/:quiz/results — each attempt with its answers and timings. */
export const getResults: Handler = async (req, deps) => {
    const quiz = req.params.quiz;
    const events = await deps.events.read(quiz);
    if (!events) return json(404, { error: "no log for this quiz" });
    const attempts = filterAttempts(quizAttempts(events), req.query);
    return json(200, { quiz, attempts });
};

/** GET /api/quiz/:quiz/results.csv — the same attempts, one row each. */
export const getResultsCsv: Handler = async (req, deps) => {
    const quiz = req.params.quiz;
    const events = await deps.events.read(quiz);
    if (!events) return json(404, { error: "no log for this quiz" });
    const attempts = filterAttempts(quizAttempts(events), req.query);
    return {
        statusCode: 200,
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${quiz}-results.csv"`,
        },
        body: resultsCsv(await deps.surveys.get(quiz), attempts),
    };
};

/** GET /api/quiz/:quiz/progress?pid=&session= | ?vid= — for the test pages' button. */
export const getProgress: Handler = async (req, deps) => {
    const quiz = req.params.quiz;
    const definition = await deps.surveys.get(quiz);
    if (!definition) return json(404, { error: "no such survey" });
    const pid = req.query.get("pid") ?? "";
    const vid = req.query.get("vid") ?? "";
    if (!STUDY_PID.test(pid) && !QUIZ_VISITOR.test(vid))
        return json(400, { error: "pid or vid needed" });
    const attempts = quizAttempts((await deps.events.read(quiz)) ?? []);
    return json(200, quizProgress(quiz, definition, attempts, req.query));
};
