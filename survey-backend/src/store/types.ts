/**
 * Where the survey keeps its data, behind two small interfaces so the storage
 * can change without touching the handlers: the answers' log (JSONL files now,
 * DynamoDB next) and the surveys' definitions (JSON files in the repository).
 */

import type { QuizEvent } from "../core/quizEvents.ts";

/** The answers' log: append-only, one stream of events per survey. */
export interface QuizEventStore {
    /** Append stamped events; each goes to the survey its `quiz` field names. */
    append(events: readonly QuizEvent[]): Promise<void>;
    /**
     * Every event of a survey in arrival order, or null when it has no log.
     * Order matters: a retried answer replaces the earlier one, so a store
     * that cannot keep insertion order (DynamoDB) must sort on arrival.
     */
    read(quiz: string): Promise<QuizEvent[] | null>;
    /** The ids of the surveys that have a log. */
    quizzes(): Promise<string[]>;
}

/** The surveys' questions, one JSON object per survey id. */
export interface SurveyDefinitions {
    /** The survey's definition, or null when there is none (or it is not a JSON object). */
    get(quiz: string): Promise<QuizEvent | null>;
    /** The ids of the defined surveys. */
    list(): Promise<string[]>;
}
