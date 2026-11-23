/**
 * The surveys' questions: one JSON file per survey, <dir>/<id>.json, kept in the
 * repository (quiz-lib/README.md has the format). The file name is the survey's
 * id, whatever the file's own "id" says.
 */

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { isObject, QUIZ_ID, type QuizEvent } from "../core/quizEvents.ts";
import type { SurveyDefinitions } from "./types.ts";

export class FileDefinitions implements SurveyDefinitions {
    private readonly dir: string;

    constructor(dir: string) {
        this.dir = dir;
    }

    async get(quiz: string): Promise<QuizEvent | null> {
        if (!QUIZ_ID.test(quiz)) return null;
        try {
            const data: unknown = JSON.parse(
                await readFile(join(this.dir, `${quiz}.json`), "utf8"),
            );
            return isObject(data) ? data : null;
        } catch {
            // missing, unreadable or not JSON: no such survey, as for a mistyped id
            return null;
        }
    }

    async list(): Promise<string[]> {
        try {
            const names = await readdir(this.dir);
            return names
                .filter((n) => n.endsWith(".json"))
                .map((n) => n.slice(0, -".json".length));
        } catch {
            return [];
        }
    }
}
