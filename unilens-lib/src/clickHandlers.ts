/**
 * @file Click handlers. Designed in a semantically abstract way so they can be
 * reused, e.g. click-and-drag to make a box should be a general gesture and not
 * tied to a single component or window.
 */

import { useEffect, useState } from "react";
import { Trigger } from "./types";
import { Monomitter, monomitter } from "./Monomitter";

export type ClickEvent = {
    type: "click";
    x: number;
    y: number;
}

export type DragBoxEvent = {
    type: "drag_box";
    x: number;
    y: number;
    width: number;
    height: number;
}

export type ClickOrDragBoxEvent = ClickEvent | DragBoxEvent;

/**
 * Takes an HTML element and attaches the following "click or drag-box" behavior:
 * - If the user clicks-and-drags, make a box
 * - Otherwise, check for a trigger
 * Returns a monomitter which streams these events.
 * @param {Trigger} clickTrigger - predicate to determine a click
 * @returns Cleanup function
 */
export function useClickOrDragBox(el: HTMLElement | Document, clickTrigger: Trigger) {

    const [emitter, _setEmitter] = useState<Monomitter<ClickOrDragBoxEvent>>(monomitter<ClickOrDragBoxEvent>());

    useEffect(() => {

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
        };

    },[el, clickTrigger])

    return emitter;

}