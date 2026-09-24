/**
 * @file Contains UnilensRoot implementation, a react component that is rendered
 * into the container and contains the entire Unilens app state.
 */

import { useEffect, useState } from "react";
import ChatPopover from "./ChatPopover";
import { type Capture, capture, startTrace, tagLastCapture } from "./capture";
import { type ClickOrDragBoxEvent, useClickOrDragBox } from "./clickHandlers";
import { initDebug } from "./DebugPanel";
import { initHint } from "./hint";
import { initMinimap } from "./minimap";
import { initSettings } from "./SettingsPanel";
import { setSpeechBackend } from "./speech";
import type { UnilensClient } from "./UnilensClient";
import { clientToContent, initZoom } from "./zoom";
import { addCapture, removeCapture, UnilensState, useUnilensState } from "./sessionState";

//------------------------------------------------------------------------------
// UnilensRoot implementation
//------------------------------------------------------------------------------

export function UnilensRoot({
    unilens,
    container,
}: {
    unilens: UnilensClient;
    container: HTMLDivElement;
}) {
    const [state, actions] = useUnilensState(unilens);

    // Init a bunch of things off of unilens client
    useEffect(() => {
        const options = unilens.getOptions();
        const backend = unilens.getOptions().backend;

        startTrace(options.mouseWindow ?? 2.5);
        if (options.zoom ?? true) initZoom();
        initMinimap();
        initSettings();
        setSpeechBackend(backend);

        initDebug({
            sessionId: () => unilens.getSessionId(),
            popoverOpen: () => state.captures.length > 0,
            backend: () => backend,
        });
    }, [unilens, state.captures.length])

    // Subscribe capture to click-or-drag-box emitter
    const clickActionEmitter = useClickOrDragBox(document, unilens.getOptions().trigger);
    useEffect(() => {
        // Use centralized click/drag emitter to handle alt-click and region drag

        async function doCapture(
            clientX: number,
            clientY: number,
            pointX: number,
            pointY: number,
            el?: Element,
            region?: { x: number; y: number; w: number; h: number },
        ) {
            const p = clientToContent(pointX, pointY);
            const cap = await capture(
                Math.round(p.x),
                Math.round(p.y),
                el,
                region,
            );
            let id = "local";
            try {
                id = await unilens.api().uploadCapture(cap);
                tagLastCapture(id);
            } catch (err) {
                console.warn(
                    "[UniLens] backend unreachable, chat will fail:",
                    err,
                );
            }
            actions.addCapture({ clientX, clientY, captureId: id, cap, pinned: false })
        }

        // subscribe to the click/drag emitter
        const sub = clickActionEmitter.subscribe((ev: ClickOrDragBoxEvent) => {
            if (ev.type === "click") {
                // ignore clicks originating inside the UI container
                const elAtPoint = document.elementFromPoint(ev.x, ev.y);
                if (container?.contains(elAtPoint as Node)) return;
                void doCapture(
                    ev.x,
                    ev.y,
                    ev.x,
                    ev.y,
                    elAtPoint instanceof Element ? elAtPoint : undefined,
                );
            } else if (ev.type === "drag_box") {
                // for drag, compute content coordinates and region
                const a = clientToContent(ev.x, ev.y);
                const b = clientToContent(ev.x + ev.width, ev.y + ev.height);
                const region = {
                    x: Math.min(a.x, b.x),
                    y: Math.min(a.y, b.y),
                    w: Math.abs(b.x - a.x),
                    h: Math.abs(b.y - a.y),
                };
                const centerClientX = ev.x + ev.width / 2;
                const centerClientY = ev.y + ev.height / 2;
                const elAtCenter =
                    document.elementFromPoint(centerClientX, centerClientY) ??
                    undefined;
                void doCapture(
                    ev.x + ev.width / 2,
                    ev.y + ev.height / 2,
                    centerClientX,
                    centerClientY,
                    elAtCenter instanceof Element ? elAtCenter : undefined,
                    region,
                );
            }
        });

        initHint((clientX, clientY) => {
            const el = document.elementFromPoint(clientX, clientY) ?? undefined;
            void doCapture(clientX, clientY, clientX, clientY, el);
        });

        return sub.unsubscribe;
    }, [unilens, container, clickActionEmitter, actions.addCapture]);

    return (
        <>
            {state.captures.map((capture) => (
                <ChatPopover
                    key={capture.captureId}
                    captureObj={capture}
                    unilens={unilens}
                    onClose={() => actions.removeCapture(capture.captureId)}
                    initialPos={{ left: capture.clientX, top: capture.clientY }}
                    onMove={() => {}}
                />
            ))}
        </>
    );
}
