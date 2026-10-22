/**
 * Copy dist/quiz.js (+ .map) into every frontend that embeds it.
 * Used after one-shot builds and by the dev watcher.
 *
 * Those pages show only the "アンケート" button (link mode), which opens the
 * survey page on the survey server (/survey, survey-backend/survey.html); that page loads
 * dist/quiz.js straight from here.
 */
import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const distJs = join(root, "dist", "quiz.js");
const distMap = join(root, "dist", "quiz.js.map");

/** frontends whose pages carry the survey button */
const FRONTENDS = ["softbank-mirror", "softbank-mirror-recruit", "dev-demo"];

export function syncDist() {
    for (const fe of FRONTENDS) {
        const dir = join(root, "..", "frontend", fe);
        // a frontend not checked out on this machine is skipped, not an error
        if (!existsSync(dir)) continue;
        copyFileSync(distJs, join(dir, "quiz.js"));
        try {
            copyFileSync(distMap, join(dir, "quiz.js.map"));
        } catch {
            // Source map is optional for page preview.
        }
        console.log(`[quiz-lib] synced → frontend/${fe}/quiz.js`);
    }
}

if (process.argv[1]?.endsWith("sync-dist.mjs")) {
    syncDist();
}
