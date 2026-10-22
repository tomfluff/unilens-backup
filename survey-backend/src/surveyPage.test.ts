/**
 * The survey page (/survey) and what it loads: the survey's questions from
 * <surveys dir>/<id>.json (/api/quiz/<id>) and quiz-lib's build
 * (/survey/quiz.js). Ported from the Flask backend's tests/test_survey_page.py.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { configFromEnv } from "./config.ts";
import { startServer, type TestServer } from "./testServer.ts";

let s: TestServer;
beforeEach(async () => {
    s = await startServer();
});
afterEach(async () => {
    await s.close();
});

const POC = {
    id: "whatever-the-file-says",
    title: { ja: "UniLens PoC アンケート", en: "UniLens PoC survey" },
    questions: [{ id: "q1", prompt: "p", choices: ["a", "b"], answer: 1 }],
};

async function define(quiz: string, text: string) {
    await mkdir(s.config.surveysDir, { recursive: true });
    await writeFile(join(s.config.surveysDir, `${quiz}.json`), text, "utf8");
}

describe("the survey page", () => {
    it("is served", async () => {
        const r = await s.get("/survey?quiz=unilens-poc&pid=P01&session=1");
        expect(r.status).toBe(200);
        expect(r.headers.get("content-type")).toMatch(/^text\/html/);
        expect(await r.text()).toContain('src="/survey/quiz.js"');
    });

    it("serves a survey under the id in its address", async () => {
        await define("unilens-poc", JSON.stringify(POC));
        const r = await s.get("/api/quiz/unilens-poc");
        expect(r.status).toBe(200);
        const body = (await r.json()) as typeof POC;
        // answers are logged under the file's name, whatever the file's own id says
        expect(body.id).toBe("unilens-poc");
        expect(body.title).toEqual(POC.title);
    });

    it("gives 404 for unknown, malformed and broken surveys", async () => {
        await define("broken", "{not json");
        await define("a-list", "[1, 2]");
        for (const quiz of [
            "nothing-here",
            "broken",
            "a-list",
            "..%2Fapp",
            "a%20b",
        ])
            expect((await s.get(`/api/quiz/${quiz}`)).status).toBe(404);
    });

    it("loads quiz.js from quiz-lib's build", async () => {
        expect((await s.get("/survey/quiz.js")).status).toBe(503); // not built yet
        await mkdir(s.config.quizLibDist, { recursive: true });
        await writeFile(join(s.config.quizLibDist, "quiz.js"), "window.x=1");
        const r = await s.get("/survey/quiz.js");
        expect(r.status).toBe(200);
        expect(await r.text()).toBe("window.x=1");
        expect((await s.get("/survey/app.ts")).status).toBe(404);
        expect((await s.get("/survey/..%2Fapp.ts")).status).toBe(404);
    });

    it("lists the defined surveys and the logged ones", async () => {
        await define("unilens-poc", JSON.stringify(POC));
        await s.post("", {
            events: [
                {
                    t: "2026-10-14T01:00:00.000Z",
                    type: "quiz_start",
                    quiz: "old-one",
                    attempt: "a1",
                },
            ],
        });
        const { quizzes } = (await (await s.get("/api/quiz")).json()) as {
            quizzes: Record<string, unknown>[];
        };
        const byId = Object.fromEntries(quizzes.map((q) => [q.id, q]));
        expect(byId["unilens-poc"].defined).toBe(true);
        expect(byId["unilens-poc"].title).toEqual(POC.title);
        expect(byId["unilens-poc"].attempts).toBe(0);
        expect(byId["old-one"].defined).toBe(false);
        expect(byId["old-one"].attempts).toBe(1);
    });

    it("reports itself healthy", async () => {
        expect(await (await s.get("/health")).json()).toEqual({ status: "ok" });
    });
});

describe("the defaults", () => {
    it("read the surveys the Flask backend ships", async () => {
        const { surveysDir } = configFromEnv({});
        const path = join(surveysDir, "unilens-poc.json");
        const data = JSON.parse(await readFile(path, "utf8"));
        expect(data.questions).toHaveLength(4);
        for (const q of data.questions) {
            expect(q.prompt.ja).toBeTruthy();
            expect(q.prompt.en).toBeTruthy();
        }
    });

    it("can be moved by the environment", () => {
        const config = configFromEnv({
            SURVEY_PORT: "5200",
            SURVEY_LOGS_DIR: "/srv/answers",
        });
        expect(config.port).toBe(5200);
        expect(config.logsDir).toBe(resolve("/srv/answers"));
        expect(configFromEnv({ SURVEY_PORT: "x" }).port).toBe(5100);
    });
});
