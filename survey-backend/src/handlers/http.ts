/**
 * The handlers' contract, shaped like a Lambda proxy integration so the same
 * functions can run behind Express now and API Gateway later: a request is its
 * path parameters, query and raw body; a response is a status, headers and a
 * string body. Nothing here knows about Express.
 */

import type { Query } from "../core/quizEvents.ts";
import type { QuizEventStore, SurveyDefinitions } from "../store/types.ts";

export interface ApiRequest {
    params: Readonly<Record<string, string>>;
    query: Query;
    /** the raw body, "" when there is none */
    body: string;
}

export interface ApiResponse {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
}

export interface Deps {
    events: QuizEventStore;
    surveys: SurveyDefinitions;
    now: () => Date;
}

export type Handler = (req: ApiRequest, deps: Deps) => Promise<ApiResponse>;

export function json(statusCode: number, data: unknown): ApiResponse {
    return {
        statusCode,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    };
}
