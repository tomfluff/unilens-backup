/**
 * Copy dist/quiz.js (+ .map) into every frontend that embeds it.
 * Used after one-shot builds and by the dev watcher.
 */
import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const distJs = join(root, "dist", "quiz.js");
const distMap = join(root, "dist", "quiz.js.map");

/** Keep in sync with FRONTEND_TARGETS in ../make-targets.mk */
const FRONTENDS = [
    "softbank-mirror",
    "softbank-mirror-recruit",
    "dev-demo",
    "study-support",
    "study-wiki",
    "study-shop",
    "study-transit",
    "study-news",
    "study-recipes",
];

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
