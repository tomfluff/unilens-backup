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
