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
import { createRoot } from "react-dom/client";
import { kUnilensRootId } from "./consts";
import { UnilensClient } from "./UnilensClient";
import { UnilensRoot } from "./UnilensRoot";

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

const kContainerStyles: Partial<CSSStyleDeclaration> = {
    position: "absolute",
    top: "0",
    left: "0",
    zIndex: "999",
};

//------------------------------------------------------------------------------
// init function implementation
//------------------------------------------------------------------------------

// Initialize the React document root and create the unilens client
export function init(options: InitOptions = {}) {
    // Create unilens client
    const unilens: UnilensClient = new UnilensClient(options);

    // Create container element
    const container = document.createElement("div");
    container.id = kUnilensRootId;

    // documentElement, not body: body carries the zoom transform, which would
    // break position:fixed and scale the popover. Also keeps it out of captures.
    document.documentElement.appendChild(container);
    Object.assign(container.style, kContainerStyles);

    // Initialize react on container element
    const root = createRoot(container);
    const render = () =>
        root?.render(<UnilensRoot container={container} unilens={unilens} />);
    render();

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
