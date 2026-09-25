/**
 * @file Click handlers. Designed in a semantically abstract way so they can be
 * reused, e.g. click-and-drag to make a box should be a general gesture and not
 * tied to a single component or window.
 */

import { useEffect, useState } from "react";
import { type Monomitter, monomitter } from "./Monomitter";
import type { Trigger } from "./types";

//------------------------------------------------------------------------------
// Types
//------------------------------------------------------------------------------

export type ClickEvent = {
    type: "click";
    x: number;
    y: number;
    /** the element clicked */
    target?: Element;
};

export type DragBoxEvent = {
    type: "drag_box";
    x: number;
    y: number;
    width: number;
    height: number;
    /** where the pointer was released */
    endX: number;
    endY: number;
};

export type ClickOrDragBoxEvent = ClickEvent | DragBoxEvent;

/** which mouse events count: a click, and a mousedown that may start a drag */
export type ClickOrDragTriggers = {
    click: Trigger;
    drag: Trigger;
};

//------------------------------------------------------------------------------
// Consts
//------------------------------------------------------------------------------

const kDragBoxBaseStyles = {
    position: "fixed" as const,
    border: "2px solid rgba(255,0,200,0.9)",
    background: "rgba(255,0,200,0.08)",
    pointerEvents: "none" as const,
    zIndex: "2147483646",
};

/**
 * Takes an HTML element and attaches the following "click or drag-box" behavior:
 * - If the user clicks-and-drags, make a box
 * - Otherwise, check for a trigger
 * Returns a monomitter which streams these events.
 * @param triggers - predicates for what counts as a click, and as the start of a
 *                   drag. Keep the object stable: a new one re-attaches the listeners.
 */
export function useClickOrDragBox(
    el: HTMLElement | Document,
    triggers: ClickOrDragTriggers,
) {
    const [emitter] = useState<Monomitter<ClickOrDragBoxEvent>>(() =>
        monomitter<ClickOrDragBoxEvent>(),
    );

    useEffect(() => {
        // internal state for drag handling
        let dragStart: { clientX: number; clientY: number } | null = null;
        let dragBox: HTMLDivElement | null = null;
        let suppressClick = false;

        function removeDragBox() {
            dragBox?.remove();
            dragBox = null;
        }

        function cancelDrag() {
            dragStart = null;
            suppressClick = false;
            removeDragBox();
        }

        function onMouseDown(evt: Event) {
            const e = evt as MouseEvent;
            // stale state must never survive into a new interaction: if the click that
            // was supposed to consume suppressClick never fired, or a drag never saw
            // its mouseup (released over browser chrome), clear both here
            cancelDrag();
            if (!triggers.drag(e)) return;
            dragStart = { clientX: e.clientX, clientY: e.clientY };
            e.preventDefault(); // no text selection while dragging
        }

        function onMouseMove(evt: Event) {
            const e = evt as MouseEvent;
            if (!dragStart) return;
            // button already released but we never saw the mouseup (happened over
            // browser chrome / outside the page): the drag is over, abandon it
            if (e.buttons === 0) {
                cancelDrag();
                return;
            }
            const w = Math.abs(e.clientX - dragStart.clientX);
            const h = Math.abs(e.clientY - dragStart.clientY);
            if (!dragBox && (w > 6 || h > 6)) {
                dragBox = document.createElement("div");
                Object.assign(dragBox.style, kDragBoxBaseStyles);
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

        function onMouseUp(evt: Event) {
            const e = evt as MouseEvent;
            if (!dragStart) return;
            const start = dragStart;
            dragStart = null;
            removeDragBox();
            const dist = Math.max(
                Math.abs(e.clientX - start.clientX),
                Math.abs(e.clientY - start.clientY),
            );
            if (dist < 10) return; // a plain click: let the click handler run
            suppressClick = true; // the click event that follows belongs to this drag
            // the browser dispatches that click immediately after mouseup; if it never
            // comes (mixed targets, keyboard click next), expire the flag so it cannot
            // swallow an unrelated click later
            window.setTimeout(() => {
                suppressClick = false;
            }, 150);
            emitter.publish({
                type: "drag_box",
                x: Math.min(e.clientX, start.clientX),
                y: Math.min(e.clientY, start.clientY),
                width: Math.abs(e.clientX - start.clientX),
                height: Math.abs(e.clientY - start.clientY),
                endX: e.clientX,
                endY: e.clientY,
            });
        }

        function onClick(evt: Event) {
            const e = evt as MouseEvent;
            if (suppressClick) {
                suppressClick = false;
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            if (!triggers.click(e)) return;
            e.preventDefault();
            e.stopPropagation();
            emitter.publish({
                type: "click",
                x: e.clientX,
                y: e.clientY,
                target: e.target instanceof Element ? e.target : undefined,
            });
        }

        // pointer released outside the window: no mouseup/click ever arrives, so
        // abandon the drag instead of leaving the rubber band and flags stuck
        window.addEventListener("blur", cancelDrag);
        el.addEventListener("mousedown", onMouseDown);
        el.addEventListener("mousemove", onMouseMove);
        el.addEventListener("mouseup", onMouseUp);
        el.addEventListener("click", onClick);

        return () => {
            window.removeEventListener("blur", cancelDrag);
            el.removeEventListener("mousedown", onMouseDown);
            el.removeEventListener("mousemove", onMouseMove);
            el.removeEventListener("mouseup", onMouseUp);
            el.removeEventListener("click", onClick);
            removeDragBox();
        };
    }, [el, triggers, emitter]);

    return emitter;
}
