/**
 * Save/restore host inline styles we touch — CONTRIBUTING host-page citizenship.
 * Our data-* / class markers are removed on undo; inline styles are restored to
 * the host's previous value when we had overwritten them.
 */

type StyleBackup = { value: string; priority: string };

const styleBackups = new WeakMap<HTMLElement, Map<string, StyleBackup>>();
/** Elements that had no `style` attribute before we first wrote one. */
const hadNoStyleAttr = new WeakSet<HTMLElement>();

/** Overwrite one inline style property, snapshotting the host value on first touch. */
export function setHostInlineStyle(
    el: HTMLElement,
    prop: string,
    value: string,
    priority = "",
) {
    let map = styleBackups.get(el);
    if (!map) {
        map = new Map();
        styleBackups.set(el, map);
        if (typeof el.hasAttribute === "function" && !el.hasAttribute("style"))
            hadNoStyleAttr.add(el);
    }
    if (!map.has(prop)) {
        map.set(prop, {
            value: el.style.getPropertyValue(prop),
            priority: el.style.getPropertyPriority(prop),
        });
    }
    el.style.setProperty(prop, value, priority);
}

/** Restore one inline style property to the host value saved on first touch. */
export function restoreHostInlineStyle(el: HTMLElement, prop: string) {
    const map = styleBackups.get(el);
    if (!map?.has(prop)) {
        el.style.removeProperty(prop);
        return;
    }
    const backup = map.get(prop);
    if (!backup) {
        el.style.removeProperty(prop);
        return;
    }
    const { value, priority } = backup;
    if (!value && !priority) el.style.removeProperty(prop);
    else el.style.setProperty(prop, value, priority);
    map.delete(prop);
    if (map.size === 0) {
        styleBackups.delete(el);
        // Leave no empty `style=""` behind on an element that had none.
        if (hadNoStyleAttr.has(el) && el.getAttribute("style") === "")
            el.removeAttribute("style");
        hadNoStyleAttr.delete(el);
    }
}

/** Restore every inline style property we have snapshotted on this element. */
export function restoreAllHostInlineStyles(el: HTMLElement) {
    const map = styleBackups.get(el);
    if (!map) return;
    for (const prop of [...map.keys()]) restoreHostInlineStyle(el, prop);
}
