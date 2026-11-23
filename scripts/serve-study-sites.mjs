/**
 * Serve all six study mock sites with live-server (no make).
 * Usage: node scripts/serve-study-sites.mjs [study-support|…]
 * Omit the argument to start all six. Backend is not started — run Flask on :5000.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { concurrently } from "concurrently";
import { STUDY_SITES } from "./study-sites.mjs";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const arg = process.argv[2];
const sites =
    arg && arg !== "all"
        ? STUDY_SITES.filter((s) => s.id === arg)
        : STUDY_SITES;

if (sites.length === 0) {
    console.error(
        `Unknown site "${arg}". Use one of: ${STUDY_SITES.map((s) => s.id).join(", ")}, or omit for all.`,
    );
    process.exit(1);
}

for (const site of sites) {
    const dir = join(root, "frontend", site.id);
    for (const file of ["unilens.js", "accessibility.js"]) {
        const bundle = join(dir, file);
        if (!existsSync(bundle)) {
            console.error(
                `[serve-study] Missing frontend/${site.id}/${file} — run: npm run bundle`,
            );
            process.exit(1);
        }
    }
}

const liveServer = join(root, "node_modules", "live-server", "live-server.js");
if (!existsSync(liveServer)) {
    console.error("[serve-study] Run `npm install` at the repo root first.");
    process.exit(1);
}

console.log("[serve-study] Starting (Ctrl+C to stop all):\n");
for (const s of sites) {
    console.log(`  ${s.label}: http://127.0.0.1:${s.port}/  (${s.id})`);
}
console.log(
    "\n  UniLens backend (chat): http://127.0.0.1:5000 — start Flask separately.\n",
);

const quote = (p) => `"${p.replace(/"/g, '\\"')}"`;

const commands = sites.map((s) => ({
    name: s.id,
    cwd: join(root, "frontend", s.id),
    command: `${quote(process.execPath)} ${quote(liveServer)} . --port=${s.port} --no-browser`,
}));

const { result } = concurrently(commands, {
    killOthersOn: ["failure"],
});

result
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
