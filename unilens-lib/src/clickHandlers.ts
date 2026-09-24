/**
 * @file Click handlers. Designed in a semantically abstract way so they can be
 * reused, e.g. click-and-drag to make a box should be a general gesture and not
 * tied to a single component or window.
 */

import { useEffect, useState } from "react";
import { type Monomitter, monomitter } from "./Monomitter";
import { getSettings } from "./settings";
import type { Trigger } from "./types";

//------------------------------------------------------------------------------
// Types
//------------------------------------------------------------------------------

export type ClickEvent = {
    type: "click";
    x: number;
    y: number;
};

export type DragBoxEvent = {
    type: "drag_box";
    x: number;
    y: number;
    width: number;
    height: number;
};

export type ClickOrDragBoxEvent = ClickEvent | DragBoxEvent;

//------------------------------------------------------------------------------
// Consts
//------------------------------------------------------------------------------

const kDragBoxBaseStyles: Partial<CSSStyleDeclaration> = {
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
 * @param {Trigger} clickTrigger - predicate to determine what counts as a click or not
 * @returns Cleanup function
 */
export function useClickOrDragBox(
    el: HTMLElement | Document,
    clickTrigger: Trigger,
) {
    const [emitter, _setEmitter] = useState<Monomitter<ClickOrDragBoxEvent>>(
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
            cancelDrag();
            if (!getSettings().regionSelect || !clickTrigger(e)) return;
            dragStart = { clientX: e.clientX, clientY: e.clientY };
            e.preventDefault();
        }

        function onMouseMove(evt: Event) {
            const e = evt as MouseEvent;
            if (!dragStart) return;
            if ((e as MouseEvent).buttons === 0) {
                cancelDrag();
                return;
            }
            const w = Math.abs(e.clientX - dragStart.clientX);
            const h = Math.abs(e.clientY - dragStart.clientY);
            if (!dragBox && (w > 6 || h > 6)) {
                dragBox = document.createElement("div");
                Object.assign(dragBox.style, kDragBoxBaseStyles as any);
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
            if (dist < 10) return;
            suppressClick = true;
            window.setTimeout(() => {
                suppressClick = false;
            }, 150);
            const left = Math.min(e.clientX, start.clientX);
            const top = Math.min(e.clientY, start.clientY);
            const width = Math.abs(e.clientX - start.clientX);
            const height = Math.abs(e.clientY - start.clientY);
            emitter.publish({
                type: "drag_box",
                x: left,
                y: top,
                width,
                height,
            } as DragBoxEvent);
        }

        function onClick(evt: Event) {
            const e = evt as MouseEvent;
            if (suppressClick) {
                suppressClick = false;
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            if (!clickTrigger(e)) return;
            e.preventDefault();
            e.stopPropagation();
            emitter.publish({
                type: "click",
                x: e.clientX,
                y: e.clientY,
            } as ClickEvent);
        }

        window.addEventListener("blur", cancelDrag);
        el.addEventListener("mousedown", onMouseDown);
        el.addEventListener("mousemove", onMouseMove);
        el.addEventListener("mouseup", onMouseUp);
        el.addEventListener("click", onClick, true);

        return () => {
            window.removeEventListener("blur", cancelDrag);
            el.removeEventListener("mousedown", onMouseDown);
            el.removeEventListener("mousemove", onMouseMove);
            el.removeEventListener("mouseup", onMouseUp);
            el.removeEventListener("click", onClick, true);
            removeDragBox();
        };
    }, [el, clickTrigger, emitter.publish]);

    return emitter;
}
