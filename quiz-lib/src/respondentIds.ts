/**
 * The two IDs a respondent types before the survey starts: their user ID and the
 * survey ID (a number the facilitator gives each user's survey). Kept with the
 * attempt, so the survey's pages (one per question) ask once, and sent with
 * every event as `user_id` / `survey_id`.
 */

export interface RespondentIds {
    userId: string;
    surveyId: string;
}

/** Letters, digits, "-" and "_", up to 32: safe in a log, a file name and a spreadsheet. */
export const RESPONDENT_ID = /^[A-Za-z0-9_-]{1,32}$/;

export type IdError = "missing" | "invalid";

/**
 * A typed ID, cleaned (full-width "Ｐ０１" typed with a Japanese IME becomes
 * "P01"; spaces around it go), and whether it can be used.
 */
export function checkId(raw: string): { value: string; error: IdError | null } {
    const value = raw.normalize("NFKC").trim();
    if (!value) return { value, error: "missing" };
    return { value, error: RESPONDENT_ID.test(value) ? null : "invalid" };
}

/** Both IDs, when a stored attempt has valid ones (hydrated values are checked where read). */
export function idsOf(
    a: { userId?: unknown; surveyId?: unknown } | null | undefined,
): RespondentIds | null {
    if (!a) return null;
    const { userId, surveyId } = a;
    return typeof userId === "string" &&
        RESPONDENT_ID.test(userId) &&
        typeof surveyId === "string" &&
        RESPONDENT_ID.test(surveyId)
        ? { userId, surveyId }
        : null;
}

/** The IDs as the log names them. */
export function idFields(ids: RespondentIds | null): Record<string, string> {
    return ids ? { user_id: ids.userId, survey_id: ids.surveyId } : {};
}

// ── The name and start time, asked after the IDs (a quiz's `askProfile`) ──

/** The respondent's name and the time they say they started, typed on the screen after the IDs. */
export interface RespondentProfile {
    name: string;
    /** "HH:MM", 24-hour, as an `<input type="time">` gives it */
    startTime: string;
}

/** A name long enough for anyone's, short enough for one spreadsheet cell. */
export const NAME_MAX = 64;
/** "08:30": what an `<input type="time">` gives (seconds are not asked) */
export const START_TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** A typed name: spaces around it go, inner runs of space become one; must be there and not too long. */
export function checkName(raw: string): {
    value: string;
    error: IdError | null;
} {
    const value = raw.trim().replace(/\s+/g, " ");
    if (!value) return { value, error: "missing" };
    return { value, error: [...value].length <= NAME_MAX ? null : "invalid" };
}

/**
 * A typed start time. A time field gives "08:30"; a browser without one gives
 * whatever was typed, so "8:30" and full-width "８：３０" are read as well.
 */
export function checkStartTime(raw: string): {
    value: string;
    error: IdError | null;
} {
    const t = raw.normalize("NFKC").trim();
    if (!t) return { value: t, error: "missing" };
    const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(t);
    const value = m ? `${m[1].padStart(2, "0")}:${m[2]}` : t;
    return { value, error: START_TIME.test(value) ? null : "invalid" };
}

/** The name and start time, when a stored attempt has valid ones. */
export function profileOf(
    a: { name?: unknown; startTime?: unknown } | null | undefined,
): RespondentProfile | null {
    if (!a) return null;
    const { name, startTime } = a;
    return typeof name === "string" &&
        checkName(name).error === null &&
        typeof startTime === "string" &&
        START_TIME.test(startTime)
        ? { name, startTime }
        : null;
}

/** The name and start time as the log names them. */
export function profileFields(
    p: RespondentProfile | null,
): Record<string, string> {
    return p ? { name: p.name, start_time: p.startTime } : {};
}
