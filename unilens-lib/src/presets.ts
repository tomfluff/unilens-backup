/**
 * Presets: named sets of setting values for the studies (co-design study 1, from
 * 2026-10-07). A preset is on when:
 *   1. the page address asks for it: ?unilens-preset=baseline (or =off), which is
 *      also remembered for the site;
 *   2. else the facilitator's last choice on this site (the address, or the keys);
 *   3. else the page's own UniLens.init({ preset }).
 * While one is on, every page load starts from the defaults plus its values,
 * whatever the browser's storage holds (settings.ts keeps changes made in the panel
 * for this tab only).
 *
 * Hidden facilitator keys (nothing on screen shows them):
 *   Ctrl+Alt+Shift+B  next preset: off → baseline → … → off (the page reloads)
 *   Ctrl+Alt+Shift+S  open or close the full settings, gear or not
 *   Ctrl+Alt+Shift+R  reset for the next participant: forget the conversation and
 *                     the changes made in this tab, then reload
 */
import { toggleSettingsPanel } from "./SettingsPanel";
import {
    activePreset,
    clearPresetChanges,
    type Settings,
    startPreset,
} from "./settings";

export interface Preset {
    /** what the facilitator sees: the confirmation toast, the settings panel */
    name: string;
    values: Partial<Settings>;
}

/**
 * The presets, in the order Ctrl+Alt+Shift+B steps through them. Later sessions add
 * theirs here, each a copy of the one before with the features participants asked
 * for. Values equal to the defaults are listed anyway, where they matter, so a later
 * change of a default does not change a preset.
 */
export const PRESETS = {
    /** Session 1's first look (Yotam, 2026-10-06 and 07): Alt+click and chat, by
     *  typing or the mic, in English; answers highlight their sources in one fixed
     *  look; nothing moves or zooms the page except choosing a source, and the chat
     *  never moves to uncover a source; no settings on screen */
    baseline: {
        name: "Baseline (co-design session 1)",
        values: {
            // asking: Alt+click only, and the question typed or spoken
            regionSelect: false,
            quickActions: false,
            hints: false,
            voiceInput: true,
            voiceAutoSend: true,
            liveTalk: false,
            // hearing: read aloud on request (the button on each answer), action sounds
            autoRead: false,
            sounds: true,
            // answers point at the page: every answer outlines its sources, numbered
            // as the chips are; a chip, "next" or "the second one" goes to its source
            citeEvidence: true,
            autoHighlight: "always",
            moveToEvidence: "offscreen",
            associateText: false,
            citePlacement: "end",
            // one fixed look, every part of it named here
            hlOutline: "ring",
            hlBackdrop: "none",
            hlFill: false,
            hlGlow: true,
            hlBadges: true,
            hlColor: "#ffef26",
            ringWidth: 2,
            ringScale: false,
            // the chat stays where it opened: stepping aside (or folding) to uncover
            // a source is a later feature (Yotam, 2026-10-07)
            chatMovesAside: false,
            // no "About all 3 sources" line above the field (not decided for good)
            aboutLine: false,
            // nothing else moves or zooms the page
            offscreenCue: "none",
            minimap: "off",
            zoom: false,
            zoomKeys: false,
            smartZoom: false,
            lensPan: false,
            assistantZoom: false,
            // the chat: the standard look, in English (the study runs in English),
            // no settings gear and no debug view or its shortcut
            chatStyle: "assistant",
            chatLanguage: "en",
            clickFx: "orb",
            motion: "smooth",
            continuity: true,
            restoreAfterReload: true,
            settingsButton: false,
            debugView: false,
            debugShortcut: false,
        },
    },
} as const satisfies Record<string, Preset>;

export type PresetId = keyof typeof PRESETS;

const PARAM = "unilens-preset";
/** localStorage: the facilitator's last choice on this site, a preset id or "off" */
const CHOICE = "unilens-preset";
/** sessionStorage: a facilitator key reloaded the page; say what it did */
const TOAST = "unilens-preset-toast";

const isPreset = (v: unknown): v is PresetId =>
    typeof v === "string" && Object.hasOwn(PRESETS, v);
const isChoice = (v: unknown): v is PresetId | "off" =>
    v === "off" || isPreset(v);

function local(): Storage | null {
    try {
        return localStorage;
    } catch {
        return null;
    }
}

/**
 * The preset this page load runs, or null: the address, else the facilitator's
 * remembered choice, else the page's init option. A valid address choice is
 * remembered, so the site's other pages (whose links do not carry it) keep it.
 */
export function choosePreset(
    initOption: string | undefined,
    href: string,
    store: Storage | null = local(),
): PresetId | null {
    let asked: string | null = null;
    try {
        asked =
            new URL(href).searchParams.get(PARAM)?.trim().toLowerCase() ?? null;
    } catch {
        asked = null;
    }
    if (asked !== null && !isChoice(asked)) {
        console.warn(`[UniLens] unknown preset "${asked}"; ignored`);
        asked = null;
    }
    let kept: string | null = null;
    try {
        if (asked) store?.setItem(CHOICE, asked);
        kept = store?.getItem(CHOICE) ?? null;
    } catch {
        kept = null;
    }
    const pick = asked ?? (isChoice(kept) ? kept : null) ?? initOption ?? null;
    if (pick && pick !== "off" && !isPreset(pick))
        console.warn(`[UniLens] unknown preset "${pick}"; ignored`);
    return isPreset(pick) ? pick : null;
}

/** put this page load's preset in effect; before anything reads the settings */
export function startChosenPreset(initOption?: string): PresetId | null {
    const id = choosePreset(initOption, location.href);
    if (id) {
        startPreset(id, PRESETS[id].name, PRESETS[id].values);
        console.info(`[UniLens] preset: ${PRESETS[id].name}`);
    }
    return id;
}

/** remember a choice and reload with it; the address carries it too when it names
 *  one already, or when the choice could not be saved */
function reloadWith(choice: PresetId | "off", toast: string) {
    let saved = false;
    try {
        const store = local();
        if (store) {
            store.setItem(CHOICE, choice);
            saved = store.getItem(CHOICE) === choice;
        }
    } catch {
        saved = false;
    }
    try {
        sessionStorage.setItem(TOAST, toast);
    } catch {
        // no session storage: no confirmation after the reload
    }
    const url = new URL(location.href);
    if (url.searchParams.has(PARAM) || !saved) {
        url.searchParams.set(PARAM, choice);
        history.replaceState(history.state, "", url);
    }
    location.reload();
}

/** the next preset in PRESETS' order, off after the last */
function nextChoice(): PresetId | "off" {
    const order: (PresetId | "off")[] = [
        "off",
        ...(Object.keys(PRESETS) as PresetId[]),
    ];
    const now = activePreset()?.id ?? "off";
    return order[(order.indexOf(now as PresetId) + 1) % order.length];
}

/** a short message for the facilitator: what a key did, after its reload */
function showToast(text: string, ms = 3000) {
    document.getElementById("unilens-preset-toast")?.remove();
    const el = document.createElement("div");
    el.id = "unilens-preset-toast";
    el.setAttribute("role", "status");
    el.textContent = text;
    el.style.cssText =
        "all:initial;position:fixed;left:16px;bottom:16px;z-index:2147483647;" +
        "padding:10px 14px;border-radius:8px;background:#111;color:#fff;" +
        "border:2px solid #ffef26;font:600 16px/1.3 system-ui,sans-serif;" +
        "pointer-events:none";
    // documentElement: outside the zoomed body and out of the captures
    document.documentElement.appendChild(el);
    window.setTimeout(() => el.remove(), ms);
}

/** the facilitator's hidden keys; `forgetConversation` deletes the kept
 *  conversation and resolves true once that is confirmed */
export function initFacilitator(opts: {
    forgetConversation: () => Promise<boolean>;
}) {
    let resetting = false;
    try {
        const said = sessionStorage.getItem(TOAST);
        if (said) {
            sessionStorage.removeItem(TOAST);
            // a warning stays longer than a confirmation
            showToast(said, said.length > 60 ? 9000 : 3000);
        }
    } catch {
        // no session storage: no confirmation
    }
    window.addEventListener(
        "keydown",
        (e) => {
            if (!(e.ctrlKey && e.altKey && e.shiftKey) || e.metaKey) return;
            // by the key's place, not its letter: Option on a Mac and a Japanese
            // IME change e.key
            const key = { KeyB: "b", KeyS: "s", KeyR: "r" }[e.code];
            if (!key) return;
            e.preventDefault();
            e.stopPropagation();
            if (e.repeat) return;
            if (key === "s") {
                toggleSettingsPanel();
                return;
            }
            if (key === "b") {
                const next = nextChoice();
                reloadWith(
                    next,
                    `UniLens: ${next === "off" ? "no preset (everything on, settings gear shown)" : PRESETS[next].name}`,
                );
                return;
            }
            // reset: the changes made in this tab and the kept conversation go;
            // the reload waits for the store to confirm (it may take ~8 s at worst)
            if (resetting) return;
            resetting = true;
            showToast("UniLens: resetting…", 10000);
            clearPresetChanges();
            const now = activePreset()?.id ?? "off";
            void Promise.race([
                opts.forgetConversation().catch(() => false),
                new Promise<boolean>((r) =>
                    window.setTimeout(() => r(false), 9000),
                ),
            ]).then((forgotten) =>
                reloadWith(
                    now as PresetId | "off",
                    forgotten
                        ? "UniLens: reset for the next participant"
                        : "UniLens: settings reset, but the conversation could not be deleted. Use a new incognito window.",
                ),
            );
        },
        true,
    );
}
