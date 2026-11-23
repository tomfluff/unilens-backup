/**
 * Watch quiz-lib sources, rebuild, and copy to frontend targets.
 * Pair with live-server on a frontend directory for instant browser refresh.
 */
import * as esbuild from "esbuild";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { syncDist } from "./sync-dist.mjs";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

const ctx = await esbuild.context({
    entryPoints: [join(root, "src/main.tsx")],
    outfile: join(root, "dist", "quiz.js"),
    bundle: true,
    minify: true,
    sourcemap: true,
    jsx: "automatic",
    plugins: [
        {
            name: "sync-frontends",
            setup(build) {
                build.onEnd((result) => {
                    if (result.errors.length === 0) syncDist();
                });
            },
        },
    ],
});

await ctx.watch();
console.log("[quiz-lib] watching src/ — saves copy to frontend/*/quiz.js");
