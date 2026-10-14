/**
 * Quiz store (zustand) — the library's one store (CONTRIBUTING §2).
 *
 * Persisted: each quiz's current attempt, so a reload or a visit to another
 * page of the same site picks up where the visitor left off. Not persisted:
 * whether the panel is open (a page load never opens it by itself unless the
 * host asks with `init({ open: true })`).
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { QUIZ_STORE_KEY } from "./domIds";
import type { QuizResponse } from "./quizTypes";
import type { RespondentIds } from "./respondentIds";

export interface AnswerRecord {
    response: QuizResponse;
    /** the answer in words, in the language it was given in */
    responseText: string;
    /** null: the question has no answer key (a survey item) */
    correct: boolean | null;
    /** epoch ms of the answer */
    at: number;
    /** ms from the question appearing to the answer */
    ms: number;
}

export interface Attempt {
    /** random id grouping one run through the quiz in the log */
    attempt: string;
    /** quizFingerprint() of the quiz this attempt was taken on */
    fingerprint: string;
    startedAt: number;
    /** index of the question on screen */
    index: number;
    /**
     * epoch ms the question on screen first appeared: each answer's `ms` runs from
     * here. Stored, so a reload does not restart a question's clock.
     */
    shownAt?: number;
    /** by question id */
    answers: Record<string, AnswerRecord>;
    finishedAt: number | null;
    /** typed by the respondent before the first question (respondentIds.ts) */
    userId?: string;
    surveyId?: string;
}

interface QuizState {
    open: boolean;
    /** by quiz id */
    attempts: Record<string, Attempt>;
}

/** Storage that may be blocked (privacy modes, sandboxed frames): degrade to memory. */
function safeStorage(): Storage {
    try {
        const s = window.localStorage;
        const probe = `${QUIZ_STORE_KEY}-probe`;
        s.setItem(probe, "1");
        s.removeItem(probe);
        return s;
    } catch {
        const mem = new Map<string, string>();
        return {
            get length() {
                return mem.size;
            },
            clear: () => mem.clear(),
            getItem: (k) => mem.get(k) ?? null,
            key: (i) => [...mem.keys()][i] ?? null,
            removeItem: (k) => {
                mem.delete(k);
            },
            setItem: (k, v) => {
                mem.set(k, v);
            },
        };
    }
}

export const useQuizStore = create<QuizState>()(
    persist(() => ({ open: false, attempts: {} }) as QuizState, {
        name: QUIZ_STORE_KEY,
        storage: createJSONStorage(safeStorage),
        partialize: (s) => ({ attempts: s.attempts }),
    }),
);

export const getQuizState = () => useQuizStore.getState();

export function setOpen(open: boolean) {
    useQuizStore.setState({ open });
}

function newAttemptId(): string {
    try {
        return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    } catch {
        return Math.random().toString(36).slice(2, 14);
    }
}

/**
 * The stored attempt for a quiz, if it was taken on this same quiz content and
 * its numbers are sane (hydrated values are validated where consumed, §2).
 */
export function currentAttempt(
    quizId: string,
    fingerprint: string,
    questionCount: number,
): Attempt | null {
    const a = getQuizState().attempts[quizId];
    if (!a || a.fingerprint !== fingerprint) return null;
    if (
        typeof a.attempt !== "string" ||
        !Number.isInteger(a.index) ||
        a.index < 0 ||
        a.index >= questionCount ||
        typeof a.answers !== "object" ||
        a.answers === null
    )
        return null;
    return a;
}

function patchAttempt(quizId: string, patch: Partial<Attempt>) {
    useQuizStore.setState((s) => {
        const prev = s.attempts[quizId];
        if (!prev) return s;
        return { attempts: { ...s.attempts, [quizId]: { ...prev, ...patch } } };
    });
}

export function startAttempt(
    quizId: string,
    fingerprint: string,
    ids?: RespondentIds,
): Attempt {
    const attempt: Attempt = {
        ...(ids ? { userId: ids.userId, surveyId: ids.surveyId } : {}),
        attempt: newAttemptId(),
        fingerprint,
        startedAt: Date.now(),
        index: 0,
        // the first question appears as the attempt starts
        shownAt: Date.now(),
        answers: {},
        finishedAt: null,
    };
    useQuizStore.setState((s) => ({
        attempts: { ...s.attempts, [quizId]: attempt },
    }));
    return attempt;
}

export function recordAnswer(
    quizId: string,
    questionId: string,
    record: AnswerRecord,
) {
    const prev = getQuizState().attempts[quizId];
    if (!prev) return;
    patchAttempt(quizId, {
        answers: { ...prev.answers, [questionId]: record },
    });
}

/** The respondent's IDs, for an attempt started before they were asked. */
export function setAttemptIds(quizId: string, ids: RespondentIds) {
    patchAttempt(quizId, { userId: ids.userId, surveyId: ids.surveyId });
}

export function goToQuestion(quizId: string, index: number) {
    patchAttempt(quizId, { index, shownAt: Date.now() });
}

export function finishAttempt(quizId: string) {
    patchAttempt(quizId, { finishedAt: Date.now() });
}

/** Forget a quiz's progress (the next open shows its start screen). */
export function clearAttempt(quizId: string) {
    useQuizStore.setState((s) => {
        const { [quizId]: _gone, ...rest } = s.attempts;
        return { attempts: rest };
    });
}
