/**
 * UniLens embeddable entry.
 *
 * Embed build (dist/unilens.js) exposes window.UniLens:
 *   <script src="unilens.js"></script>
 *   <script>UniLens.init({ backend: 'http://127.0.0.1:5000' })</script>
 *
 * Options:
 *   trigger      MouseEvent → bool. Default: alt+click.
 *   mouseWindow  Seconds of trace history. Default: 2.5.
 *   backend      Flask base URL. Default: '' (same origin).
 */
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { startTrace } from "./capture";
import { init as initHighlight } from "./highlight";
import { initMinimap } from "./minimap";
import { initSettings } from "./SettingsPanel";
import { setSpeechBackend } from "./speech";
import { UnilensClient } from "./UnilensClient";
import { UnilensRoot } from "./UnilensRoot";
import { initZoom } from "./zoom";

//------------------------------------------------------------------------------
// Types
//------------------------------------------------------------------------------

export interface InitOptions {
    trigger?: (e: MouseEvent) => boolean;
    mouseWindow?: number;
    backend?: string;
    /** ctrl+wheel pinch-style page zoom. Default: true. */
    zoom?: boolean;
}

//------------------------------------------------------------------------------
// Consts
//------------------------------------------------------------------------------

/** build stamp injected by esbuild --define (see the lib Makefile); absent in dev */
declare const __target_dist_unilens_BUILD__: string;

export const kUnilensRootId = "unilens-root";

//------------------------------------------------------------------------------
// init function implementation
//------------------------------------------------------------------------------

// Set up the page-wide parts, then the React root that holds the chat
export function init(options: InitOptions = {}) {
    // Create unilens client
    const unilens: UnilensClient = new UnilensClient(options);

    startTrace(unilens.getOption("mouseWindow"));
    if (unilens.getOption("zoom")) initZoom();
    initMinimap();
    initHighlight();
    initSettings();
    setSpeechBackend(unilens.getBackend());

    // Create container element
    const container = document.createElement("div");
    container.id = kUnilensRootId;
    // documentElement, not body: body carries the zoom transform, which would
    // break position:fixed and scale the popover. Also keeps it out of captures.
    document.documentElement.appendChild(container);

    // Initialize react on container element. Synchronously, effects included: the
    // page's alt+click listeners are attached before init returns
    const root = createRoot(container);
    flushSync(() =>
        root.render(<UnilensRoot container={container} unilens={unilens} />),
    );

    console.log(
        `[UniLens] initialized (build ${typeof __target_dist_unilens_BUILD__ === "string" ? __target_dist_unilens_BUILD__ : "dev"}) — alt+click to capture, alt+drag to select a region`,
    );
}

//------------------------------------------------------------------------------
// Exports for script embeds
//------------------------------------------------------------------------------

// Expose for plain <script> embeds
declare global {
    interface Window {
        UniLens: { init: typeof init };
    }
}
window.UniLens = { init };
