/**
 * Serve the SoftBank IR mirror copy on :8003 with live-server (no make).
 * Its survey button follows ?p=: http://localhost:8003/?p=1 … ?p=4 opens the
 * survey unilens-poc-p1 … p4 (survey-backend/quizzes/), no p opens unilens-poc.
 * Usage: node scripts/serve-softbank-mirrors.mjs
 * The UniLens backend (:5000) and the survey server (:5100) are not started here.
 * Keep the port in sync with make-targets.mk.
 */
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const site = { id: "softbank-mirror-1", port: 8003 };
const dir = join(root, "frontend", site.id);

for (const file of ["index.html", "accessibility.js", "unilens.js", "quiz.js"]) {
    if (!existsSync(join(dir, file))) {
        console.error(
            `[serve-mirrors] Missing frontend/${site.id}/${file} — run: npm run bundle`,
        );
        process.exit(1);
    }
}

const liveServer = join(root, "node_modules", "live-server", "live-server.js");
if (!existsSync(liveServer)) {
    console.error("[serve-mirrors] Run `npm install` at the repo root first.");
    process.exit(1);
}

console.log("[serve-mirrors] Starting (Ctrl+C to stop):\n");
for (const n of [1, 2, 3, 4]) {
    console.log(`  http://localhost:${site.port}/?p=${n}  → survey unilens-poc-p${n}`);
}
console.log(
    "\n  UniLens backend (chat): http://127.0.0.1:5000 — make serve-backend" +
        "\n  Survey server:          http://127.0.0.1:5100 — make serve-survey\n",
);

const child = spawn(
    process.execPath,
    [liveServer, ".", `--port=${site.port}`, "--no-browser"],
    { cwd: dir, stdio: "inherit" },
);
child.on("exit", (code) => process.exit(code ?? 0));
