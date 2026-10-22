/**
 * Watch src/, rebuild dist/server.js, and restart the server after each
 * successful build. A failed build leaves the last good server running.
 */
import { spawn } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const outfile = join(root, "dist", "server.js");
let server = null;

function restart() {
    const start = () => {
        server = spawn(process.execPath, ["--enable-source-maps", outfile], {
            stdio: "inherit",
        });
    };
    if (!server || server.exitCode !== null) return start();
    server.once("exit", start);
    server.kill();
}

const ctx = await esbuild.context({
    entryPoints: [join(root, "src/server.ts")],
    outfile,
    bundle: true,
    platform: "node",
    format: "esm",
    packages: "external",
    sourcemap: true,
    plugins: [
        {
            name: "restart-server",
            setup(build) {
                build.onEnd((result) => {
                    if (result.errors.length === 0) restart();
                });
            },
        },
    ],
});

await ctx.watch();
console.log("[survey-backend] watching src/ — saves restart the server");
