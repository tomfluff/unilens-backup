/**
 * Regenerate HTML for all study mock sites (after changing build.mjs or unilens-embed.mjs).
 */
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { STUDY_SITES } from "./study-sites.mjs";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

for (const { id } of STUDY_SITES) {
    const dir = join(root, "frontend", id);
    console.log(`[rebuild-study] ${id}…`);
    execFileSync("node", ["build.mjs"], { cwd: dir, stdio: "inherit" });
}

console.log("[rebuild-study] done.");
