/**
 * Settings in the study's log (P01's session 2 had none: Sessions and Yotam,
 * 2026-10-13). Logging only: nothing behaves differently, in any preset.
 *
 *   setting_changed    one per setting that changes: its key and panel label, the old
 *                      and new value, and what changed it (the panel, the Sources
 *                      button, the panel's reset, the facilitator, or other)
 *   settings_snapshot  every setting in the participant's panel, with its default:
 *                      at page load, when the page is hidden or left, and on a
 *                      facilitator key, so the last state is known even if a change
 *                      event was lost
 *   settings_opened / settings_closed   the panel, and how many changes it saw
 *
 * The store is watched, not the controls, so every way of changing a setting
 * counts, once: it is compared with what this module saw last. What another tab
 * changed is taken up quietly (that tab logged it). Only plain values are logged.
 */
import {
    activePreset,
    defaultOf,
    ENUM_CHOICES,
    isHydrating,
    NUMBER_KNOBS,
    type Settings,
    TOGGLE_LABELS,
    useSettings,
} from "./settings";
import { OWN_SETTINGS } from "./settingsText";
import { flush, logEvent } from "./studyLog";

export type ChangeSource =
    | "panel"
    | "sources button"
    | "reset"
    | "facilitator"
    | "other";
type Plain = string | number | boolean | null;

let source: ChangeSource | null = null;
let panelOpen: "participant" | "full" | null = null;
let panelChanges = 0;
let last: Partial<Record<keyof Settings, Plain>> = {};
let installed = false;

/** run `fn`, its setting changes logged as made by `src` */
export function asSource<T>(src: ChangeSource, fn: () => T): T {
    const was = source;
    source = src;
    try {
        return fn();
    } finally {
        source = was;
    }
}

const isPlain = (v: unknown): v is Plain =>
    v === null || ["string", "number", "boolean"].includes(typeof v);

/** the settings logged: the participant's panel under a preset that has one, else
 *  every setting with a plain value */
function tracked(): (keyof Settings)[] {
    const panel = activePreset()?.panel;
    if (panel) return [...panel];
    const s = useSettings.getState();
    return (Object.keys(s) as (keyof Settings)[]).filter((k) => isPlain(s[k]));
}

function valuesNow(): Partial<Record<keyof Settings, Plain>> {
    const s = useSettings.getState();
    const out: Partial<Record<keyof Settings, Plain>> = {};
    for (const k of tracked()) if (isPlain(s[k])) out[k] = s[k] as Plain;
    return out;
}

/** a setting's name as the panel shows it, in English */
export function labelOf(key: keyof Settings): string {
    return (
        OWN_SETTINGS[key]?.label.en ??
        (TOGGLE_LABELS as Record<string, string>)[key] ??
        (ENUM_CHOICES as Record<string, { label: string }>)[key]?.label ??
        (NUMBER_KNOBS as Record<string, { label: string }>)[key]?.label ??
        (key === "hlColor" ? "Color" : key)
    );
}

/** every setting in the participant's panel, now, with its default (none without
 *  a participant's panel) */
export function logSettingsSnapshot(reason: "load" | "hidden" | "facilitator") {
    const p = activePreset();
    if (!p?.panel) return;
    const values = valuesNow();
    const defaults: Partial<Record<keyof Settings, Plain>> = {};
    for (const k of p.panel) {
        const d = defaultOf(k);
        if (isPlain(d)) defaults[k] = d;
    }
    logEvent("settings_snapshot", { reason, preset: p.id, values, defaults });
}

function onChange() {
    // the store as it is now, not the state this call was made for: a setting that
    // pulls another one with it (the source style) updates the store inside this
    // update, and each change is logged once
    const now = valuesNow();
    if (!isHydrating())
        for (const k of Object.keys(now) as (keyof Settings)[]) {
            if (now[k] === last[k] || !(k in last)) continue;
            if (panelOpen) panelChanges++;
            logEvent("setting_changed", {
                key: k,
                label: labelOf(k),
                from: last[k],
                to: now[k],
                source: source ?? (panelOpen ? "panel" : "other"),
            });
        }
    last = now;
}

/** start watching (once, at init, after the preset): a snapshot now, another each
 *  time the page is hidden or left */
export function initSettingsLog() {
    if (installed) return;
    installed = true;
    last = valuesNow();
    useSettings.subscribe(onChange);
    logSettingsSnapshot("load");
    const hidden = () => {
        logSettingsSnapshot("hidden");
        flush();
    };
    window.addEventListener("pagehide", hidden);
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") hidden();
    });
}

/** the panel open: logged, and its changes counted; returns what to call as it closes */
export function logPanelSession(
    panel: "participant" | "full",
    tab: string,
): () => void {
    panelOpen = panel;
    panelChanges = 0;
    logEvent("settings_opened", { panel, tab });
    return () => {
        logEvent("settings_closed", { panel, changes: panelChanges });
        panelOpen = null;
        panelChanges = 0;
    };
}

/** for tests: forget what was seen */
export function resetSettingsLogForTest() {
    last = valuesNow();
    panelOpen = null;
    panelChanges = 0;
    source = null;
}
