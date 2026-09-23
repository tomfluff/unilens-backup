/**
 * What UniLens sent to the model, for the debug panel: every capture uploaded
 * (full annotated page, close-up, meta, inventory), including view refreshes,
 * and each question asked against it with its reply footer. Developer-facing
 * only; the chat window shows the conversation and nothing else.
 *
 * In memory for this page, newest first. ponytail: capped at MAX_CAPTURES
 * because entries hold the image data URLs; the backend's /history page is the
 * durable record.
 */
import type { CaptureResult } from "./capture";

export interface SentAsk {
    at: number;
    question: string;
    /** citations were requested (the citeEvidence knob) */
    cite: boolean;
    /** filled when the reply completes */
    reply?: {
        provider: string;
        model: string;
        imagesSent: number;
        latencyMs: number;
    };
    error?: string;
    /** ids the reply cited that resolved on this capture */
    cited?: string[];
}

export interface SentCapture {
    id: string;
    at: number;
    cap: CaptureResult;
    /** re-captured before a follow-up because the user moved the view */
    viewRefresh: boolean;
    asks: SentAsk[];
}

const MAX_CAPTURES = 20;
let log: SentCapture[] = [];

export const getSentLog = (): readonly SentCapture[] => log;

/** main.tsx, right after an upload succeeds (or fails: id "local") */
export function recordCapture(
    id: string,
    cap: CaptureResult,
    viewRefresh = false,
) {
    log = [
        { id, at: Date.now(), cap, viewRefresh, asks: [] },
        ...log.filter((c) => c.id !== id),
    ].slice(0, MAX_CAPTURES);
}

/** the popover, when a question goes out; returns the ask to fill in later */
export function recordAsk(
    captureId: string,
    ask: Omit<SentAsk, "at">,
): SentAsk {
    const entry: SentAsk = { at: Date.now(), ...ask };
    log.find((c) => c.id === captureId)?.asks.push(entry);
    return entry;
}

export function clearSentLog() {
    log = [];
}
