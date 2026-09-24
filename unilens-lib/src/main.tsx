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
import { createRoot, type Root } from "react-dom/client";
import ChatPopover from "./ChatPopover";
import {
    type CaptureResult,
    capture,
    startTrace,
    tagLastCapture,
} from "./capture";
import { initDebug } from "./DebugPanel";
import { initHint } from "./hint";
import { initMinimap } from "./minimap";
import { initSettings } from "./SettingsPanel";
import { getSettings, updateSetting } from "./settings";
import { setSpeechBackend } from "./speech";
import { clientToContent, initZoom } from "./zoom";
import { UnilensClient } from "./UnilensClient";
import { kUnilensRootId } from "./consts";
import { useState, useEffect } from "react";

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

/** upload a capture to the backend. session id is provided by the UnilensClient instance. */
async function uploadCapture(unilens: UnilensClient, backend: string, cap: CaptureResult): Promise<string> {
    const res = await fetch(`${backend}/api/capture`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            image: cap.image,
            viewport: cap.viewportImage,
            meta: cap.meta,
            session_id: getSettings().continuity ? unilens.getSessionId() : null,
        }),
    });
    if (!res.ok) throw new Error(`capture upload failed: HTTP ${res.status}`);
    const data = await res.json();
    if (getSettings().continuity) unilens.setSessionId(data.session_id ?? null);
    return data.id;
}

type Capture = {
    clientX: number,
    clientY: number,
    captureId: string,
    cap: CaptureResult,
}

function UnilensRoot({
    unilens,
    container
}: {
    unilens: UnilensClient,
    container: HTMLDivElement
}) {
    const [captures, setCaptures] = useState<Capture[]>([]);

    useEffect(() => {
        const options = unilens.getOptions();
        const trigger = options.trigger ?? ((e: MouseEvent) => e.altKey);
        const backend = options.backend ?? "";

        startTrace(options.mouseWindow ?? 2.5);
        if (options.zoom ?? true) initZoom();
        initMinimap();
        initSettings();
        setSpeechBackend(backend);

        let dragStart: { clientX: number; clientY: number } | null = null;
        let dragBox: HTMLDivElement | null = null;
        let suppressClick = false;

        const dragBoxBaseStyles = {
            position: "fixed" as const,
            border: "2px solid rgba(255,0,200,0.9)",
            background: "rgba(255,0,200,0.08)",
            pointerEvents: "none" as const,
            zIndex: "2147483646",
        };

        function removeDragBox() {
            dragBox?.remove();
            dragBox = null;
        }

        function cancelDrag() {
            dragStart = null;
            suppressClick = false;
            removeDragBox();
        }

        async function doCapture(
            clientX: number,
            clientY: number,
            pointX: number,
            pointY: number,
            el?: Element,
            region?: { x: number; y: number; w: number; h: number },
        ) {
            const p = clientToContent(pointX, pointY);
            const cap = await capture(Math.round(p.x), Math.round(p.y), el, region);
            let id = "local";
            try {
                id = await uploadCapture(unilens, backend, cap);
                tagLastCapture(id);
            } catch (err) {
                console.warn("[UniLens] backend unreachable, chat will fail:", err);
            }
            setCaptures((prev) => [
                ...prev,
                { clientX, clientY, captureId: id, cap },
            ]);
        }

        // pointer handlers
        function onMouseDown(e: MouseEvent) {
            cancelDrag();
            if (!getSettings().regionSelect || !trigger(e)) return;
            if (container?.contains(e.target as Node)) return;
            dragStart = { clientX: e.clientX, clientY: e.clientY };
            e.preventDefault();
        }

        function onMouseMove(e: MouseEvent) {
            if (!dragStart) return;
            if ((e as MouseEvent).buttons === 0) {
                cancelDrag();
                return;
            }
            const w = Math.abs(e.clientX - dragStart.clientX);
            const h = Math.abs(e.clientY - dragStart.clientY);
            if (!dragBox && (w > 6 || h > 6)) {
                dragBox = document.createElement("div");
                Object.assign(dragBox.style, dragBoxBaseStyles as any);
                document.documentElement.appendChild(dragBox);
            }
            if (dragBox) {
                Object.assign(dragBox.style, {
                    left: `${Math.min(e.clientX, dragStart.clientX)}px`,
                    top: `${Math.min(e.clientY, dragStart.clientY)}px`,
                    width: `${w}px`,
                    height: `${h}px`,
                });
            }
        }

        function onMouseUp(e: MouseEvent) {
            if (!dragStart) return;
            const start = dragStart;
            dragStart = null;
            removeDragBox();
            const dist = Math.max(
                Math.abs(e.clientX - start.clientX),
                Math.abs(e.clientY - start.clientY),
            );
            if (dist < 10) return;
            suppressClick = true;
            window.setTimeout(() => {
                suppressClick = false;
            }, 150);
            const a = clientToContent(start.clientX, start.clientY);
            const b = clientToContent(e.clientX, e.clientY);
            const region = {
                x: Math.min(a.x, b.x),
                y: Math.min(a.y, b.y),
                w: Math.abs(b.x - a.x),
                h: Math.abs(b.y - a.y),
            };
            const centerClientX = (start.clientX + e.clientX) / 2;
            const centerClientY = (start.clientY + e.clientY) / 2;
            const el = document.elementFromPoint(centerClientX, centerClientY) ?? undefined;
            void doCapture(
                e.clientX,
                e.clientY,
                centerClientX,
                centerClientY,
                el,
                region,
            );
        }

        function onClick(e: MouseEvent) {
            if (suppressClick) {
                suppressClick = false;
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            if (container?.contains(e.target as Node)) return;
            if (!trigger(e)) return;
            e.preventDefault();
            e.stopPropagation();
            void doCapture(
                e.clientX,
                e.clientY,
                e.clientX,
                e.clientY,
                e.target instanceof Element ? e.target : undefined,
            );
        }

        window.addEventListener("blur", cancelDrag);
        document.addEventListener("mousedown", onMouseDown);
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        document.addEventListener("click", onClick, true);

        initDebug({
            sessionId: () => unilens.getSessionId(),
            popoverOpen: () => captures.length > 0,
            backend: () => backend,
        });

        initHint((clientX, clientY) => {
            const el = document.elementFromPoint(clientX, clientY) ?? undefined;
            void doCapture(clientX, clientY, clientX, clientY, el);
        });

        return () => {
            window.removeEventListener("blur", cancelDrag);
            document.removeEventListener("mousedown", onMouseDown);
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
            document.removeEventListener("click", onClick, true);
            removeDragBox();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [unilens]);

    function closeCapture(id: string) {
        setCaptures((prev) => prev.filter((c) => c.captureId !== id));
    }

    return <>
            {captures.map((capture) => (
            <ChatPopover
                key={capture.captureId}
                x={capture.clientX}
                y={capture.clientY}
                captureId={capture.captureId}
                capture={capture.cap}
                backend={unilens.getOptions().backend ?? ""}
                unilens={unilens}
                onClose={() => closeCapture(capture.captureId)}
                initialPos={{left: capture.clientX, top: capture.clientY}}
                onMove={() => {}}
            />
        ))}
    </>;
}

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
        root?.render(
            <UnilensRoot
                container={container}
                unilens={unilens}
            />
        );
    render();

    console.log(
        `[UniLens] initialized (build ${typeof __target_dist_unilens_BUILD__ === "string" ? __target_dist_unilens_BUILD__ : "dev"}) — alt+click to capture, alt+drag to select a region`,
    );
}


// Expose for plain <script> embeds
declare global {
    interface Window {
        UniLens: { init: typeof init };
    }
}
window.UniLens = { init };
