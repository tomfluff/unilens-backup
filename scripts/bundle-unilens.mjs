/**
 * Build unilens-lib and copy dist/unilens.js into every frontend target.
 * Make-free counterpart to `make bundle` (unilens half) + copy-all for unilens.
 */
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { STUDY_SITES } from "./study-sites.mjs";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

/** Keep in sync with FRONTEND_TARGETS in make-targets.mk */
const ALL_FRONTENDS = [
    "softbank-mirror",
    "softbank-mirror-recruit",
    "softbank-mirror-1",
    "dev-demo",
    ...STUDY_SITES.map((s) => s.id),
];

function gitShortHead() {
    const r = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
        cwd: root,
        encoding: "utf8",
    });
    if (r.status === 0 && r.stdout?.trim()) return r.stdout.trim();
    return "dev";
}

function buildUnilens() {
    const lib = join(root, "unilens-lib");
    const stamp = gitShortHead();
    const define = `__target_dist_unilens_BUILD__='"${stamp}"'`;
    console.log(`[bundle-unilens] building unilens.js (stamp ${stamp})…`);
    execFileSync(
        "npx",
        [
            "esbuild",
            "src/main.tsx",
            "--outfile=dist/unilens.js",
            "--bundle",
            "--minify",
            "--sourcemap",
            "--loader:.css=text",
            "--jsx=automatic",
            `--define:${define}`,
        ],
        { cwd: lib, stdio: "inherit", shell: true },
    );
}

function copyToFrontends() {
    const distJs = join(root, "unilens-lib", "dist", "unilens.js");
    const distMap = join(root, "unilens-lib", "dist", "unilens.js.map");
    if (!existsSync(distJs)) {
        throw new Error(`Missing ${distJs}; build failed?`);
    }
    for (const fe of ALL_FRONTENDS) {
        const dir = join(root, "frontend", fe);
        mkdirSync(dir, { recursive: true });
        copyFileSync(distJs, join(dir, "unilens.js"));
        if (existsSync(distMap)) {
            copyFileSync(distMap, join(dir, "unilens.js.map"));
        }
        console.log(`[bundle-unilens] → frontend/${fe}/unilens.js`);
    }
}

buildUnilens();
copyToFrontends();
