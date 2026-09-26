/**
 * AI settings (R2 of the 2026-09-26 report): which provider, model and reasoning
 * level answer, and which voice reads aloud. The backend owns the catalogue
 * (GET /api/ai: the providers whose key is set and the models each reaches) and
 * checks every choice against it, so the chat only sends what the user picked.
 */
import { getSettings } from "./settings";

export interface AiChoice {
    provider?: "openai" | "gemini";
    model?: string;
    reasoning?: "low" | "medium" | "high";
}

export interface AiCatalogue {
    /** the provider the backend uses when the chat names none */
    default: string;
    providers: Record<
        string,
        {
            available: boolean;
            default: string;
            /** each model with the reasoning levels it takes (none: it does not reason) */
            models: { id: string; reasoning: string[] }[];
        }
    >;
    reasoning: string[];
    voices: string[];
    defaultVoice: string;
}

let backend = "";
let catalogue: Promise<AiCatalogue | null> | null = null;

export function setAiBackend(url: string) {
    backend = url;
    catalogue = null;
}

/** the backend's catalogue, fetched once (null when the backend cannot be reached) */
export function aiCatalogue(): Promise<AiCatalogue | null> {
    catalogue ??= fetch(`${backend}/api/ai`)
        .then((r) => (r.ok ? (r.json() as Promise<AiCatalogue>) : null))
        .catch(() => null)
        .then((c) => {
            // a failed fetch is retried the next time the panel asks
            if (!c) catalogue = null;
            return c;
        });
    return catalogue;
}

/** the request's `ai` field: only what differs from the backend's defaults */
export function aiChoice(): AiChoice | undefined {
    const s = getSettings();
    const c: AiChoice = {};
    if (s.aiProvider !== "auto") c.provider = s.aiProvider;
    if (s.aiModel) c.model = s.aiModel;
    if (s.aiReasoning !== "default") c.reasoning = s.aiReasoning;
    return Object.keys(c).length ? c : undefined;
}
