/** DOM ids, classes, data attributes and storage keys — all prefixed with `unilens` per CONTRIBUTING.md. */

export const QUIZ_ROOT_ID = "unilens-quiz-root";
export const QUIZ_STYLE_ID = "unilens-quiz-styles";
export const QUIZ_PANEL_ID = "unilens-quiz-panel";
export const QUIZ_TITLE_ID = "unilens-quiz-title";
export const QUIZ_TOGGLE_ID = "unilens-quiz-toggle";

/** Panel widget class prefix — every class is `${QUIZ_CLASS_PREFIX}-*`. */
export const QUIZ_CLASS_PREFIX = "unilens-quiz";

/**
 * Shared with accessibility-lib and unilens-lib: a node carrying it is UniLens'
 * own chrome, so the display panel's page effects (theme, text plates, size
 * boosts) and UniLens' captures leave it alone.
 */
export const UI_ATTR = "data-unilens-ui";

/** Set on the root: which corner the toggle sits in. */
export const POSITION_ATTR = "data-unilens-quiz-position";
/** Set on the root while accessibility-lib's high-contrast theme is on. */
export const CONTRAST_ATTR = "data-unilens-quiz-contrast";
/** Set on the root: "large" / "xlarge" while the display panel's text size is up. */
export const TEXT_SIZE_ATTR = "data-unilens-quiz-text";
/** Marks the element that should take focus after a screen change. */
export const FOCUS_ATTR = "data-unilens-quiz-focus";

/** localStorage key of the quiz store (zustand persist). */
export const QUIZ_STORE_KEY = "unilens-quiz";
/**
 * unilens-lib's study log key ({pid, session}). quizLog.ts reads it only when
 * UniLens is not on the page; otherwise it uses UniLens.studyIds() after init.
 */
export const STUDY_IDS_KEY = "unilens-study";
