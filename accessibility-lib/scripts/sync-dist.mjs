/**
 * Copy dist/accessibility.js (+ .map) into every frontend that embeds it.
 * Used after one-shot builds and by the dev watcher.
 */
import { copyFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const distJs = join(root, "dist", "accessibility.js");
const distMap = join(root, "dist", "accessibility.js.map");

/** Keep in sync with FRONTEND_TARGETS in ../make-targets.mk */
const FRONTENDS = [
    "softbank-mirror",
    "softbank-mirror-recruit",
    "softbank-mirror-1",
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
        copyFileSync(distJs, join(dir, "accessibility.js"));
        try {
            copyFileSync(distMap, join(dir, "accessibility.js.map"));
        } catch {
            // Source map is optional for page preview.
        }
        console.log(`[accessibility-lib] synced → frontend/${fe}/accessibility.js`);
    }
}

if (process.argv[1]?.endsWith("sync-dist.mjs")) {
    syncDist();
}

