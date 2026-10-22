/**
 * The survey's write API: quiz-lib's events, POST /api/quiz/log.
 */

import {
    field,
    isLoggable,
    isObject,
    QUIZ_MAX_EVENTS,
    stampEvents,
    studyIds,
} from "../core/quizEvents.ts";
import { type Handler, json } from "./http.ts";

/**
 * {"events": [...]}, sent as plain text (no CORS preflight; it also goes as the
 * page closes). Events that are not kept are counted, not refused: one bad
 * event must not cost the batch's answers.
 */
export const postQuizLog: Handler = async (req, deps) => {
    let data: unknown;
    try {
        data = JSON.parse(req.body || "{}");
    } catch {
        return json(400, { error: "not JSON" });
    }
    const events = isObject(data) ? field(data, "events") : undefined;
    if (
        !Array.isArray(events) ||
        events.length < 1 ||
        events.length > QUIZ_MAX_EVENTS
    )
        return json(400, { error: `events: a list of 1-${QUIZ_MAX_EVENTS}` });
    const kept = events.filter(isLoggable);
    if (kept.length)
        await deps.events.append(
            stampEvents(kept, studyIds(req.query), deps.now()),
        );
    return json(200, {
        logged: kept.length,
        dropped: events.length - kept.length,
    });
};
