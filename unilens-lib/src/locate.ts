/**
 * Locate client — asks the backend "where is X?" for a capture and turns the
 * HTTP outcome into what the popover shows, says and draws. Pure mapping in
 * locateOutcome (tested row by row); one fetch in postLocate.
 */

import { type Highlight, nextToken } from "./highlight";

export type LocateCode = "found" | "empty" | "rate_limited" | "error";

export interface LocateOutcome {
    code: LocateCode;
    /** assistant bubble text; error-styled when code is rate_limited or error */
    bubble: string;
    /** live-region text for the non-found outcomes; found announces via showHighlights */
    live: string;
    highlights: Highlight[];
}

interface LocateBody {
    capture_id?: string;
    answer?: string;
    error?: string;
    highlights?: Highlight[];
}

const FAILED = "Locate failed";

/**
 * Outcome table (design doc, eng review issue 4): every branch explicit so a
 * participant can always tell "the model didn't find it" from "the system broke".
 */
export function locateOutcome(
    status: number,
    body: unknown,
    labelFor: (id: string) => string,
): LocateOutcome {
    if (body instanceof Error || status === 0) {
        return { code: "error", bubble: FAILED, live: FAILED, highlights: [] };
    }
    const data = (body ?? {}) as LocateBody;
    if (status === 429) {
        return {
            code: "rate_limited",
            bubble: "Too many requests, wait a minute",
            live: FAILED,
            highlights: [],
        };
    }
    if (status !== 200) {
        return {
            code: "error",
            bubble: data.error ?? FAILED,
            live: FAILED,
            highlights: [],
        };
    }
    const highlights = Array.isArray(data.highlights) ? data.highlights : [];
    const answer = data.answer ?? "";
    if (highlights.length === 0) {
        return {
            code: "empty",
            bubble: answer,
            live: "Nothing matched on this page",
            highlights,
        };
    }
    return {
        code: "found",
        bubble: answer,
        live: `Found: ${labelFor(highlights[0].id)}`,
        highlights,
    };
}

export interface LocateRequest {
    captureId: string;
    sessionId?: string | null;
    question: string;
    screenshot: boolean;
}

/** POST /api/locate. The token is minted before the request so a later question supersedes it. */
export async function postLocate(
    backend: string,
    req: LocateRequest,
    labelFor: (id: string) => string,
): Promise<{ outcome: LocateOutcome; token: number; captureId: string }> {
    const token = nextToken();
    try {
        const res = await fetch(`${backend}/api/locate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                capture_id: req.captureId,
                session_id: req.sessionId ?? null,
                question: req.question,
                screenshot: req.screenshot,
            }),
        });
        const body = await res.json().catch(() => ({}));
        return {
            outcome: locateOutcome(res.status, body, labelFor),
            token,
            captureId: (body as LocateBody).capture_id ?? req.captureId,
        };
    } catch (err) {
        return {
            outcome: locateOutcome(0, err, labelFor),
            token,
            captureId: req.captureId,
        };
    }
}
