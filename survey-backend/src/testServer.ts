/**
 * A survey server for the tests: its own temporary folders, on a free port.
 * The page is the real backend/survey.html, as the server serves by default.
 */

import { once } from "node:events";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "./app.ts";
import { configFromEnv, type SurveyConfig } from "./config.ts";

export interface TestServer {
    config: SurveyConfig;
    /** the temporary folder holding every folder the server writes */
    root: string;
    url(path: string): string;
    /** POST /api/quiz/log<query> as quiz-lib sends it: text/plain */
    post(query: string, body: unknown): Promise<Response>;
    get(path: string): Promise<Response>;
    close(): Promise<void>;
}

export async function startServer(): Promise<TestServer> {
    const root = await mkdtemp(join(tmpdir(), "survey-backend-"));
    const config: SurveyConfig = {
        ...configFromEnv({}),
        port: 0,
        logsDir: join(root, "quiz-logs"),
        surveysDir: join(root, "quizzes"),
        quizLibDist: join(root, "quiz-dist"),
    };
    const server: Server = createApp(config).listen(0, "127.0.0.1");
    await once(server, "listening");
    const { port } = server.address() as AddressInfo;
    const url = (path: string) => `http://127.0.0.1:${port}${path}`;
    return {
        config,
        root,
        url,
        post: (query, body) =>
            fetch(url(`/api/quiz/log${query}`), {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: typeof body === "string" ? body : JSON.stringify(body),
            }),
        get: (path) => fetch(url(path)),
        close: async () => {
            server.closeAllConnections();
            await new Promise((done) => server.close(done));
            await rm(root, { recursive: true, force: true });
        },
    };
}

/** A JSONL file's lines, parsed. */
export async function jsonLines(
    path: string,
): Promise<Record<string, unknown>[]> {
    const text = await readFile(path, "utf8");
    return text
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line));
}
