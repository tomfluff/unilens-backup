/**
 * Quiz definitions: what the host page passes in (`*Input`), and the normalized
 * shape the widget works with.
 *
 * The input is forgiving so a quiz can be written by hand in a JSON file —
 * choices may be plain strings, an answer may be a choice index, any visible
 * text may be one string or one per language — and normalizeQuiz() turns it
 * into one strict shape. `answer` is optional: without it a question is a
 * survey item, recorded but never graded. Problems are reported as developer-facing messages
 * (English, console) and the offending question is skipped rather than
 * breaking the whole widget (CONTRIBUTING §3, fail soft).
 */

export const QUIZ_LANGS = ["ja", "en"] as const;
export type QuizLang = (typeof QUIZ_LANGS)[number];

/** Visitor-facing text: one string, or one per language (`{ ja: "…", en: "…" }`). */
export type LocalizedText = string | Partial<Record<QuizLang, string>>;

export const QUESTION_TYPES = ["single", "multiple", "text"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

// ── Input (what the host writes) ─────────────────────────────────────────

export interface QuizChoiceInput {
    /** Stable id, used in the log and in `answer`. Default: c1, c2, … */
    id?: string;
    text: LocalizedText;
}

interface QuestionInputBase {
    /** Stable id, used in the log and in stored progress. Default: q1, q2, … */
    id?: string;
    prompt: LocalizedText;
    /** Shown after answering (when feedback is on) and on the result screen. */
    explanation?: LocalizedText;
}

export interface SingleQuestionInput extends QuestionInputBase {
    /** One correct choice. Default type. */
    type?: "single";
    choices: (LocalizedText | QuizChoiceInput)[];
    /** The correct choice: its id, or its 0-based index. Omit for a survey item. */
    answer?: string | number;
}

export interface MultipleQuestionInput extends QuestionInputBase {
    /** Every correct choice must be picked, and nothing else. */
    type: "multiple";
    choices: (LocalizedText | QuizChoiceInput)[];
    /** Omit for a survey item. */
    answer?: (string | number)[];
}

export interface TextQuestionInput extends QuestionInputBase {
    /** A typed answer, compared after normalization (see normalizeTextAnswer). */
    type: "text";
    /** The accepted answers. Omit for a survey item. */
    answer?: string | string[];
    /** Default false: "Tokyo" and "tokyo" are the same answer. */
    caseSensitive?: boolean;
}

export type QuizQuestionInput =
    | SingleQuestionInput
    | MultipleQuestionInput
    | TextQuestionInput;

export interface QuizInput {
    /** Names the quiz in the log and in stored progress: letters, digits, - and _. */
    id: string;
    title?: LocalizedText;
    description?: LocalizedText;
    questions: QuizQuestionInput[];
    /**
     * Show whether answers were right: the verdict and explanation after each
     * answer, and the score on the last screen. Default false — the visitor sees
     * no verdict (a survey); grading, when there is an answer key, still goes to
     * the log.
     */
    showFeedback?: boolean;
    /** Shuffle the choices, once per attempt. Default false. */
    shuffleChoices?: boolean;
}

// ── Normalized ───────────────────────────────────────────────────────────

export interface QuizChoice {
    id: string;
    text: LocalizedText;
}

interface QuestionBase {
    id: string;
    prompt: LocalizedText;
    explanation?: LocalizedText;
}

export interface SingleQuestion extends QuestionBase {
    type: "single";
    choices: QuizChoice[];
    /** absent: not graded */
    answer?: string;
}

export interface MultipleQuestion extends QuestionBase {
    type: "multiple";
    choices: QuizChoice[];
    /** absent: not graded */
    answer?: string[];
}

export interface TextQuestion extends QuestionBase {
    type: "text";
    /** empty: not graded */
    accepted: string[];
    caseSensitive: boolean;
}

export type QuizQuestion = SingleQuestion | MultipleQuestion | TextQuestion;
export type ChoiceQuestion = SingleQuestion | MultipleQuestion;

export interface Quiz {
    id: string;
    title?: LocalizedText;
    description?: LocalizedText;
    questions: QuizQuestion[];
    showFeedback: boolean;
    shuffleChoices: boolean;
}

/** single: a choice id; multiple: choice ids; text: what was typed */
export type QuizResponse = string | string[];

/** Quiz, question and choice ids. Quiz ids name a log file on the backend. */
export const QUIZ_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

// ── Normalization ────────────────────────────────────────────────────────

const isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null && !Array.isArray(v);

/** A LocalizedText with at least one non-empty string, or null. */
export function toLocalizedText(v: unknown): LocalizedText | null {
    if (typeof v === "string") return v.trim() ? v : null;
    if (!isRecord(v)) return null;
    const out: Partial<Record<QuizLang, string>> = {};
    for (const lang of QUIZ_LANGS) {
        const s = v[lang];
        if (typeof s === "string" && s.trim()) out[lang] = s;
    }
    return Object.keys(out).length ? out : null;
}

function normalizeChoices(
    raw: unknown,
    where: string,
    errors: string[],
): QuizChoice[] | null {
    if (!Array.isArray(raw) || raw.length < 2) {
        errors.push(`${where}: "choices" needs at least 2 entries`);
        return null;
    }
    const choices: QuizChoice[] = [];
    const seen = new Set<string>();
    for (const [i, c] of raw.entries()) {
        // a choice object has `text`; anything else is the text itself
        const hasText = isRecord(c) && "text" in c;
        const text = toLocalizedText(hasText ? c.text : c);
        const rawId = hasText ? c.id : undefined;
        const id = typeof rawId === "string" ? rawId : `c${i + 1}`;
        if (!text) {
            errors.push(`${where}: choice ${i + 1} has no text`);
            return null;
        }
        if (!QUIZ_ID_PATTERN.test(id) || seen.has(id)) {
            errors.push(`${where}: choice id "${id}" is invalid or repeated`);
            return null;
        }
        seen.add(id);
        choices.push({ id, text });
    }
    return choices;
}

/** A choice reference (id, or 0-based index) resolved to a choice id. */
function resolveChoice(
    ref: unknown,
    choices: QuizChoice[],
): string | undefined {
    if (typeof ref === "number" && Number.isInteger(ref))
        return choices[ref]?.id;
    if (typeof ref === "string") return choices.find((c) => c.id === ref)?.id;
    return undefined;
}

function normalizeQuestion(
    raw: unknown,
    index: number,
    errors: string[],
): QuizQuestion | null {
    const where = `question ${index + 1}`;
    if (!isRecord(raw)) {
        errors.push(`${where}: not an object`);
        return null;
    }
    const id = typeof raw.id === "string" ? raw.id : `q${index + 1}`;
    if (!QUIZ_ID_PATTERN.test(id)) {
        errors.push(`${where}: id "${id}" must be letters, digits, - and _`);
        return null;
    }
    const prompt = toLocalizedText(raw.prompt);
    if (!prompt) {
        errors.push(`${where}: "prompt" is missing`);
        return null;
    }
    const explanation = toLocalizedText(raw.explanation) ?? undefined;
    const base = { id, prompt, ...(explanation ? { explanation } : {}) };
    const type = raw.type ?? "single";

    if (type === "single" || type === "multiple") {
        const choices = normalizeChoices(raw.choices, where, errors);
        if (!choices) return null;
        if (raw.answer === undefined) return { ...base, type, choices };
        if (type === "single") {
            const answer = resolveChoice(raw.answer, choices);
            if (!answer) {
                errors.push(`${where}: "answer" names no choice`);
                return null;
            }
            return { ...base, type, choices, answer };
        }
        const refs = Array.isArray(raw.answer) ? raw.answer : [raw.answer];
        const answer = refs.map((r) => resolveChoice(r, choices));
        if (!answer.length || answer.some((a) => a === undefined)) {
            errors.push(`${where}: "answer" must list the correct choices`);
            return null;
        }
        return {
            ...base,
            type,
            choices,
            answer: [...new Set(answer as string[])],
        };
    }

    if (type === "text") {
        if (raw.answer === undefined)
            return {
                ...base,
                type,
                accepted: [],
                caseSensitive: raw.caseSensitive === true,
            };
        const list = Array.isArray(raw.answer) ? raw.answer : [raw.answer];
        const accepted = list.filter(
            (a): a is string => typeof a === "string" && a.trim() !== "",
        );
        if (!accepted.length) {
            errors.push(`${where}: "answer" needs at least one accepted text`);
            return null;
        }
        return {
            ...base,
            type,
            accepted,
            caseSensitive: raw.caseSensitive === true,
        };
    }

    errors.push(`${where}: unknown type "${String(type)}"`);
    return null;
}

/**
 * Check and normalize a host-provided quiz. Returns null when nothing usable is
 * left (bad id, or no valid question); `errors` lists every problem found.
 */
export function normalizeQuiz(raw: unknown): {
    quiz: Quiz | null;
    errors: string[];
} {
    const errors: string[] = [];
    if (!isRecord(raw)) return { quiz: null, errors: ["quiz: not an object"] };
    const id = raw.id;
    if (typeof id !== "string" || !QUIZ_ID_PATTERN.test(id)) {
        errors.push(
            'quiz: "id" is required (1-64 letters, digits, - and _); it names the quiz in the log',
        );
        return { quiz: null, errors };
    }
    if (!Array.isArray(raw.questions)) {
        errors.push('quiz: "questions" must be a list');
        return { quiz: null, errors };
    }
    const questions: QuizQuestion[] = [];
    const seen = new Set<string>();
    for (const [i, q] of raw.questions.entries()) {
        const question = normalizeQuestion(q, i, errors);
        if (!question) continue;
        if (seen.has(question.id)) {
            errors.push(`question ${i + 1}: id "${question.id}" is repeated`);
            continue;
        }
        seen.add(question.id);
        questions.push(question);
    }
    if (!questions.length) {
        errors.push("quiz: no valid question");
        return { quiz: null, errors };
    }
    const title = toLocalizedText(raw.title) ?? undefined;
    const description = toLocalizedText(raw.description) ?? undefined;
    return {
        quiz: {
            id,
            ...(title ? { title } : {}),
            ...(description ? { description } : {}),
            questions,
            showFeedback: raw.showFeedback === true,
            shuffleChoices: raw.shuffleChoices === true,
        },
        errors,
    };
}
