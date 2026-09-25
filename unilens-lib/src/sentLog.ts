/**
 * What UniLens sent to the model, for the debug panel: every capture uploaded
 * (full annotated page, close-up, meta, inventory), including view refreshes,
 * and each question asked against it with its reply footer. Developer-facing
 * only; the chat window shows the conversation and nothing else.
 *
 * In memory for this page, newest first, and only while the debug view is on:
 * entries hold the full-page image data URLs, so a participant's tab keeps none,
 * and turning the debug view off drops them. ponytail: capped at MAX_CAPTURES;
 * the backend's /history page is the durable record.
 */
import type { CaptureResult } from "./capture";
import { getSettings, useSettings } from "./settings";

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

const MAX_CAPTURES = 10;
/** one capture can take many follow-ups; the oldest go first */
const MAX_ASKS = 50;
let log: SentCapture[] = [];

export const getSentLog = (): readonly SentCapture[] => log;

/** main.tsx, right after an upload succeeds (or fails: id "local") */
export function recordCapture(
    id: string,
    cap: CaptureResult,
    viewRefresh = false,
) {
    if (!getSettings().debugView) return;
    // failed uploads all share the id "local": each is its own record
    log = [
        { id, at: Date.now(), cap, viewRefresh, asks: [] },
        ...log.filter((c) => c.id !== id || id === "local"),
    ].slice(0, MAX_CAPTURES);
}

/** the popover, when a question goes out; returns the ask to fill in later */
export function recordAsk(
    captureId: string,
    ask: Omit<SentAsk, "at">,
): SentAsk {
    const entry: SentAsk = { at: Date.now(), ...ask };
    // newest first, so a "local" id finds the capture the popover is on
    const asks = log.find((c) => c.id === captureId)?.asks;
    if (asks) {
        asks.push(entry);
        if (asks.length > MAX_ASKS) asks.splice(0, asks.length - MAX_ASKS);
    }
    return entry;
}

export function clearSentLog() {
    log = [];
}

// the debug view closes: its captures go with it
useSettings.subscribe((s, prev) => {
    if (prev.debugView && !s.debugView) clearSentLog();
});
