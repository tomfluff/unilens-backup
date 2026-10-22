/**
 * The survey's HTTP server: the page and quiz-lib's build, and the API routes,
 * each handed to a framework-free handler (handlers/). The URLs and answers
 * are those the Flask backend's survey routes had, so quiz-lib only needed its
 * `backend` address changed when the survey moved here.
 */

import { STATUS_CODES } from "node:http";
import { join } from "node:path";
import express, {
    type ErrorRequestHandler,
    type RequestHandler,
} from "express";
import type { SurveyConfig } from "./config.ts";
import type { Deps, Handler } from "./handlers/http.ts";
import {
    getProgress,
    getResults,
    getResultsCsv,
    getSurvey,
    listSurveys,
} from "./handlers/read.ts";
import { postQuizLog } from "./handlers/write.ts";

/** quiz-lib's build, the only files served from its dist/ */
const QUIZ_LIB_ASSETS = new Set(["quiz.js", "quiz.js.map"]);
/** as the Flask backend's limit: an absurd payload is refused, not read */
const MAX_BODY = "25mb";

/**
 * Any page may call the API: the test pages ask for progress from their own
 * origin. The request's origin is echoed (else "*"), as flask-cors did.
 */
const cors: RequestHandler = (req, res, next) => {
    const origin = req.get("Origin");
    res.set("Access-Control-Allow-Origin", origin || "*");
    if (origin) res.vary("Origin");
    const method = req.get("Access-Control-Request-Method");
    if (req.method !== "OPTIONS" || !method) return next();
    res.set(
        "Access-Control-Allow-Methods",
        "DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT",
    );
    const headers = req.get("Access-Control-Request-Headers");
    if (headers) res.set("Access-Control-Allow-Headers", headers);
    res.status(200).end();
};

/** The server, on the stores in `deps` (deps.ts builds them from the configuration). */
export function createApp(config: SurveyConfig, deps: Deps) {
    const app = express();
    app.disable("x-powered-by");
    // Flask sent none; a 304 on the progress button's fetch would only add a round trip
    app.set("etag", false);
    app.use(cors);

    const route =
        (handler: Handler): RequestHandler =>
        async (req, res) => {
            // the first value of a repeated parameter, as Flask's request.args.get
            const query = new URL(req.originalUrl, "http://localhost")
                .searchParams;
            const body = typeof req.body === "string" ? req.body : "";
            const out = await handler(
                { params: req.params as Record<string, string>, query, body },
                deps,
            );
            res.status(out.statusCode).set(out.headers).send(out.body);
        };

    // quiz-lib posts as text/plain (no preflight); read any type as text, as Flask did
    const text = express.text({ type: () => true, limit: MAX_BODY });
    app.post("/api/quiz/log", text, route(postQuizLog));
    app.get("/api/quiz", route(listSurveys));
    app.get("/api/quiz/:quiz", route(getSurvey));
    app.get("/api/quiz/:quiz/results", route(getResults));
    app.get("/api/quiz/:quiz/results.csv", route(getResultsCsv));
    app.get("/api/quiz/:quiz/progress", route(getProgress));

    // The survey page (Japanese only); its address names the survey (survey.html has the parameters).
    app.get("/survey", (_req, res, next) => {
        res.sendFile(
            config.surveyPage,
            { cacheControl: false, headers: { "Cache-Control": "no-cache" } },
            (err) => err && next(err),
        );
    });

    app.get("/survey/:asset", (req, res, next) => {
        const asset = req.params.asset;
        if (!QUIZ_LIB_ASSETS.has(asset)) {
            res.status(404).json({ error: "not found" });
            return;
        }
        res.sendFile(
            join(config.quizLibDist, asset),
            { cacheControl: false, headers: { "Cache-Control": "no-cache" } },
            (err) => {
                if (!err) return;
                if ((err as { code?: string }).code !== "ENOENT")
                    return next(err);
                res.status(503).json({
                    error: `quiz-lib/dist/${asset} is missing: run make build`,
                });
            },
        );
    });

    app.get("/health", (_req, res) => {
        res.json({ status: "ok", store: config.store });
    });

    app.use((_req, res) => {
        res.status(404).json({ error: "not found" });
    });

    const onError: ErrorRequestHandler = (err, _req, res, _next) => {
        // body-parser's and send's errors carry their status (413 too large, 415
        // bad charset, 404 no page); their message can hold a server path, so it stays here
        const status = Number((err as { status?: unknown }).status);
        if (status >= 400 && status < 500) {
            res.status(status).json({ error: STATUS_CODES[status] ?? "error" });
            return;
        }
        console.error("[survey-backend]", err);
        res.status(500).json({ error: "internal error" });
    };
    app.use(onError);
    return app;
}
