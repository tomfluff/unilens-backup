/**
 * Display adjustment panel — the embeddable accessibility UI (tabbed layout).
 *
 * Division of responsibilities:
 * - accessibilityPanelUI.tsx     … UI primitives (icons, buttons, etc.)
 * - accessibilityPanelStyles.ts  … design tokens and widget CSS
 * - accessibilityPanelOptions.ts … choice ordering, scales, and other data
 * - accessibilityI18n.ts         … Japanese / English display strings
 * - accessibilityPanelTabs.tsx   … the contents of each tab
 * - this file                    … state management, the panel shell, keyboard handling
 *
 * Rendering is React (react-dom's createRoot), mounted once onto a plain
 * `#unilens-a11y-root` container that's created and attached to
 * <html> imperatively in initAccessibilityPanel() — the container's own id
 * and a couple of state-driven attributes (lang, the open/closed class, the
 * invert counter-filter) are set outside React since they belong to the
 * mount point itself, not to anything this component renders as a child.
 */
import {
    type KeyboardEvent,
    type MouseEvent,
    useEffect,
    useRef,
    useState,
} from "react";
import { createRoot } from "react-dom/client";
import { installToggleDrag } from "./toggleDrag";
import {
    getA11yLang,
    onA11yLangChange,
    focusCursorBandName,
    pointerHaloSizeName,
    t,
} from "./accessibilityI18n";
import {
    bodyExpandLevelLabels,
    type PanelTab,
    smallBoostLevelLabels,
    TABS,
    tabLabel,
} from "./accessibilityPanelOptions";
import { WIDGET_CSS } from "./accessibilityPanelStyles";
import { ToolsTab, VisualTab } from "./accessibilityPanelTabs";
import {
    announce,
    Button,
    Icon,
    LiveRegion,
    ROOT_ID,
    useExternalSignal,
} from "./accessibilityPanelUI";
import {
    applyA11yToDocument,
    patchA11ySettings,
    resetA11ySettings,
    syncWidgetDisplayIsolation,
} from "./accessibilityStore";
import {
    getAppliedTextScale,
    runAutoTextAction,
    type TextAnalysis,
} from "./autoTextSize";
import {
    focusCursorOn,
    normalizeFocusCursorBandPx,
} from "./accessibilityStoreTypes";
import { pointerHaloOn, rememberPointerHaloOnPx } from "./cursorHalo";
import {
    A11Y_CSS_LINK_ID,
    A11Y_OPEN_CLASS,
    A11Y_PAGE_STYLE_ID,
    A11Y_WIDGET_STYLE_ID,
    a11yTabId,
    a11yTabpanelId,
    REDUCE_MOTION_ATTR,
    UI_ATTR,
} from "./domIds";
import { resolveA11yCssUrl } from "./resolveA11yCssUrl";
import {
    clearAllSelectionFontSizes,
    hasSelectionFontSizes,
    onSelectionWrappersChange,
} from "./selectionTextSize";
// Read-aloud disabled — see accessibility-umd.ts init().
// import { stopSpeech } from './speakSelection'
import {
    getSettings,
    type Settings,
    updateSetting,
    useSettings,
} from "./settings";
import { namedTextAdjustLevel } from "./textAdjustLevels";
import pageCss from "./unilens-a11y/style.css";

const RESET_CONFIRM_MS = 4000;

/** Optional extra stylesheet from `init({ cssUrl })`. Page theme CSS is bundled. */
let externalCssUrl: string | null = null;
let panelDomRoot: HTMLElement | null = null;
let panelReactRoot: ReturnType<typeof createRoot> | null = null;
let panelAltPointerDown: ((e: globalThis.MouseEvent) => void) | null = null;

/** Restores the previously-open tab (many visitors keep working on the same adjustment). */
function restoreActiveTab(): PanelTab {
    const tab = getSettings().panelTab;
    if (TABS.some((t) => t.id === tab)) return tab;
    return "visual";
}

function persistActiveTab(tab: PanelTab) {
    updateSetting("panelTab", tab);
}

export function configureAccessibilityCssUrl(url: string) {
    externalCssUrl = resolveA11yCssUrl(url);
    const link = document.getElementById(
        A11Y_CSS_LINK_ID,
    ) as HTMLLinkElement | null;
    if (link) link.href = externalCssUrl;
}

function ensureStyleTag(id: string, css: string) {
    const existing = document.getElementById(id);
    if (existing) {
        existing.textContent = css;
        return;
    }
    const style = document.createElement("style");
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
}

function ensureExternalCssLink() {
    if (!externalCssUrl) {
        document.getElementById(A11Y_CSS_LINK_ID)?.remove();
        return;
    }
    let link = document.getElementById(
        A11Y_CSS_LINK_ID,
    ) as HTMLLinkElement | null;
    if (!link) {
        link = document.createElement("link");
        link.id = A11Y_CSS_LINK_ID;
        link.rel = "stylesheet";
        document.head.appendChild(link);
    }
    link.href = externalCssUrl;
}

function ensureStyles() {
    // Host-page theme rules travel inside accessibility.js (single dist file).
    ensureStyleTag(A11Y_PAGE_STYLE_ID, pageCss);
    ensureStyleTag(A11Y_WIDGET_STYLE_ID, WIDGET_CSS);
    ensureExternalCssLink();
}

/** Inject bundled page + widget CSS. Safe to call with the panel off. */
export function ensureAccessibilityStyles() {
    ensureStyles();
}

/** Page display settings must not restyle the overlay — only invert counter-filter and reduce-motion. */
function syncOverlayIsolation(reduceMotion: boolean) {
    syncWidgetDisplayIsolation();
    const root = document.getElementById(ROOT_ID);
    if (!root) return;
    if (reduceMotion) root.setAttribute(REDUCE_MOTION_ATTR, "true");
    else root.removeAttribute(REDUCE_MOTION_ATTR);
}

// ── Currently applied adjustments ─────────────────────────────────────────

interface Adjustment {
    tab: PanelTab;
    key: string;
    label: string;
    clear: () => void;
}

/** The list of adjustments currently in effect. Used to decide whether resetting is offered. */
function activeAdjustments(s: Settings): Adjustment[] {
    const list: Adjustment[] = [];
    const add = (
        tab: PanelTab,
        key: string,
        label: string,
        clear: () => void,
    ) => list.push({ tab, key, label, clear });

    if (s.theme !== "standard") {
        add("visual", "theme", t().theme[s.theme], () =>
            patchA11ySettings({ theme: "standard" }),
        );
    }
    if (s.saturation !== "standard") {
        add(
            "visual",
            "saturation",
            t().adjSaturation(t().saturation[s.saturation]),
            () => patchA11ySettings({ saturation: "standard" }),
        );
    }
    if (s.contrast !== "standard") {
        add("visual", "contrast", t().adjContrast(t().contrast[s.contrast]), () =>
            patchA11ySettings({ contrast: "standard" }),
        );
    }
    if (s.fontSize !== "standard") {
        add("visual", "fontSize", t().adjFontSize(t().fontSize[s.fontSize]), () =>
            patchA11ySettings({ fontSize: "standard" }),
        );
    }
    if (s.fontFamily === "ud") {
        add("visual", "fontFamily", t().adjUdFont, () =>
            patchA11ySettings({ fontFamily: "standard" }),
        );
    }
    if (s.fontFamily === "custom" && s.customFontFamily) {
        add("visual", "fontFamily", t().adjCustomFont(s.customFontFamily), () =>
            patchA11ySettings({
                fontFamily: "standard",
                customFontFamily: null,
            }),
        );
    }
    if (s.lineHeight === "wide") {
        add("visual", "lineHeight", t().adjLineHeight, () =>
            patchA11ySettings({ lineHeight: "standard" }),
        );
    }
    if (s.letterSpacing === "wide") {
        add("visual", "letterSpacing", t().adjLetterSpacing, () =>
            patchA11ySettings({ letterSpacing: "standard" }),
        );
    }
    if (s.linkUnderline) {
        add("visual", "linkUnderline", t().adjLinkUnderline, () =>
            patchA11ySettings({ linkUnderline: false }),
        );
    }
    if (s.linkBackground) {
        add("visual", "linkBackground", t().adjLinkBackground, () =>
            patchA11ySettings({ linkBackground: false }),
        );
    }
    if (s.linkBorder) {
        add("visual", "linkBorder", t().adjLinkBorder, () =>
            patchA11ySettings({ linkBorder: false }),
        );
    }
    if (s.imageBorder) {
        add("visual", "imageBorder", t().adjImageBorder, () =>
            patchA11ySettings({ imageBorder: false }),
        );
    }
    if (s.elementHighlight) {
        add("visual", "elementHighlight", t().adjElementHighlight, () =>
            patchA11ySettings({ elementHighlight: false }),
        );
    }
    if (s.focusEnhanceLevel > 0) {
        const name = namedTextAdjustLevel(
            t().focusEnhanceLevelName,
            s.focusEnhanceLevel,
        );
        add("tools", "focusEnhanceLevel", t().adjFocusEnhance(name), () =>
            patchA11ySettings({ focusEnhanceLevel: 0 }),
        );
    }
    if (pointerHaloOn(s.pointerHaloPx)) {
        add(
            "visual",
            "pointerHaloPx",
            t().adjPointerHalo(pointerHaloSizeName(s.pointerHaloPx)),
            () => {
                rememberPointerHaloOnPx(s.pointerHaloPx);
                patchA11ySettings({ pointerHaloPx: 0 });
            },
        );
    }
    const focusBandPx = normalizeFocusCursorBandPx(s.focusCursorBandPx);
    if (focusCursorOn(focusBandPx)) {
        add(
            "visual",
            "focusCursorBandPx",
            t().adjFocusCursor(focusCursorBandName(focusBandPx)),
            () => patchA11ySettings({ focusCursorBandPx: 0 }),
        );
    }
    if (s.readingGuide) {
        add("visual", "readingGuide", t().adjReadingGuide, () =>
            patchA11ySettings({ readingGuide: false }),
        );
    }
    if (s.textStroke) {
        add(
            "tools",
            "textStroke",
            t().adjTextStroke(t().textStrokeStyle[s.textStrokeStyle]),
            () => patchA11ySettings({ textStroke: false }),
        );
    }
    if (s.reduceMotion) {
        add("visual", "reduceMotion", t().adjReduceMotion, () =>
            patchA11ySettings({ reduceMotion: false }),
        );
    }
    if (s.bodyTextExpandLevel > 0) {
        const name = bodyExpandLevelLabels()[s.bodyTextExpandLevel][0];
        add("tools", "bodyTextExpandLevel", t().adjBodyExpand(name), () =>
            patchA11ySettings({ bodyTextExpandLevel: 0 }),
        );
    }
    if (s.smallTextBoostLevel > 0) {
        const name = smallBoostLevelLabels()[s.smallTextBoostLevel][0];
        add("tools", "smallTextBoostLevel", t().adjSmallBoost(name), () =>
            patchA11ySettings({ smallTextBoostLevel: 0 }),
        );
    }
    if (hasSelectionFontSizes()) {
        add("tools", "selectionText", t().adjSelectionText, () => {
            clearAllSelectionFontSizes();
        });
    }
    if (s.autoTextSize && s.autoTextMode !== "off") {
        add(
            "tools",
            "autoTextSize",
            t().adjAutoSize(getAppliedTextScale().toFixed(2)),
            () => {
                runAutoTextAction("reset");
            },
        );
    }
    return list;
}

// ── Panel shell ────────────────────────────────────────────────────────────

function Header({ onClose }: { onClose: () => void }) {
    return (
        <div className="unilens-a11y-header">
            {/* the name only, as the UniLens chat's header (DESIGN.md: Assistant has no subtitle) */}
            <div className="unilens-a11y-header-text">
                <h2 id="unilens-a11y-title" className="unilens-a11y-title">
                    {t().panelTitle}
                </h2>
            </div>
            <button
                type="button"
                className="unilens-a11y-close"
                aria-label={t().closePanel}
                data-unilens-a11y-focus-key="close"
                onMouseDown={(e: MouseEvent) => e.preventDefault()}
                onClick={onClose}
            >
                <Icon name="close" size={18} />
            </button>
        </div>
    );
}

function TabBar({
    activeTab,
    onSwitch,
    btnRefs,
}: {
    activeTab: PanelTab;
    onSwitch: (tab: PanelTab) => void;
    btnRefs: React_MutableRefObject<
        Partial<Record<PanelTab, HTMLButtonElement | null>>
    >;
}) {
    return (
        // role="tablist" so screen readers announce the buttons as tabs
        // ("tab 1 of 2"); the <li> wrappers are presentation only.
        <ul
            className="unilens-a11y-tabs"
            role="tablist"
            aria-label={t().tabsLabel}
        >
            {TABS.map((tab, index) => {
                const selected = activeTab === tab.id;
                const label = tabLabel(tab.id);
                return (
                    <li key={tab.id} role="presentation">
                        <button
                            type="button"
                            id={a11yTabId(tab.id)}
                            className="unilens-a11y-tab"
                            role="tab"
                            aria-selected={selected}
                            aria-controls={a11yTabpanelId(tab.id)}
                            aria-label={label}
                            tabIndex={selected ? 0 : -1}
                            data-unilens-a11y-focus-key={`tab:${tab.id}`}
                            ref={(node: HTMLButtonElement | null) => {
                                btnRefs.current[tab.id] = node;
                            }}
                            onMouseDown={(e: MouseEvent) => e.preventDefault()}
                            onClick={() => onSwitch(tab.id)}
                            onKeyDown={(e: KeyboardEvent) => {
                                let next = -1;
                                if (e.key === "ArrowRight")
                                    next = (index + 1) % TABS.length;
                                else if (e.key === "ArrowLeft")
                                    next =
                                        (index - 1 + TABS.length) % TABS.length;
                                else if (e.key === "Home") next = 0;
                                else if (e.key === "End")
                                    next = TABS.length - 1;
                                if (next < 0) return;
                                e.preventDefault();
                                const nextTab = TABS[next].id;
                                onSwitch(nextTab);
                                btnRefs.current[nextTab]?.focus();
                            }}
                        >
                            <Icon name={tab.iconName} size={19} />
                            <span>{label}</span>
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}

function Footer({
    hasAdjustments,
    resetArmed,
    onResetPress,
}: {
    hasAdjustments: boolean;
    resetArmed: boolean;
    onResetPress: () => void;
}) {
    return (
        <div className="unilens-a11y-footer">
            <Button
                label={resetArmed ? t().resetArmed : t().resetAll}
                iconName="reset"
                variant={resetArmed ? "danger" : "quiet"}
                ariaLabel={resetArmed ? t().resetArmedAria : t().resetAllAria}
                focusKey="reset-all"
                full
                disabled={!hasAdjustments}
                onClick={onResetPress}
            />
            <p className="unilens-a11y-hint">
                <span className="unilens-a11y-kbd">←</span>{" "}
                <span className="unilens-a11y-kbd">→</span>
                {` ${t().hintTabs} · `}
                <span className="unilens-a11y-kbd">Esc</span>
                {` ${t().hintClose}`}
            </p>
        </div>
    );
}

// Minimal local alias so TabBar's prop type doesn't need to import React's
// namespace form — see accessibilityPanelUI.tsx's MutableRefObject.
type React_MutableRefObject<T> = { current: T };

function AccessibilityPanelApp() {
    useExternalSignal(onA11yLangChange);
    useExternalSignal(onSelectionWrappersChange);
    const settingsState = useSettings();

    const [panelOpen, setPanelOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<PanelTab>(() =>
        restoreActiveTab(),
    );
    const [openedTabs, setOpenedTabs] = useState<Set<PanelTab>>(
        () => new Set([restoreActiveTab()]),
    );
    const [resetArmed, setResetArmed] = useState(false);
    const [lastAnalysis, setLastAnalysis] = useState<TextAnalysis | null>(null);
    const [lastSelectionMessage, setLastSelectionMessage] = useState<{
        text: string;
        ok: boolean;
    } | null>(null);

    const toggleBtnRef = useRef<HTMLButtonElement | null>(null);
    const tabBtnRefs = useRef<
        Partial<Record<PanelTab, HTMLButtonElement | null>>
    >({});
    const bodyRef = useRef<HTMLDivElement | null>(null);
    const resetTimerRef = useRef<number | undefined>(undefined);
    const panelOpenRef = useRef(false);
    panelOpenRef.current = panelOpen;

    const adjustments = activeAdjustments(settingsState);

    // Reflects the widget's language and display-isolation flags into the
    // mount point's own attributes (set outside React — see the file header).
    useEffect(() => {
        const btn = toggleBtnRef.current;
        const root = document.getElementById(ROOT_ID);
        if (!btn || !root) return;
        return installToggleDrag(btn, root);
    }, []);

    useEffect(() => {
        document.getElementById(ROOT_ID)?.setAttribute("lang", getA11yLang());
    }, []);

    useEffect(() => {
        const syncLang = () =>
            document
                .getElementById(ROOT_ID)
                ?.setAttribute("lang", getA11yLang());
        return onA11yLangChange(syncLang);
    }, []);

    useEffect(() => {
        syncOverlayIsolation(settingsState.reduceMotion);
    }, [settingsState.reduceMotion]);

    useEffect(() => {
        document
            .getElementById(ROOT_ID)
            ?.classList.toggle(A11Y_OPEN_CLASS, panelOpen);
    }, [panelOpen]);

    useEffect(() => {
        if (panelOpen) tabBtnRefs.current[activeTab]?.focus();
        // Only the open transition should move focus — switching tabs while
        // already open is handled by the tab bar's own click/keydown handlers.
        // eslint-disable-next-line react-hooks/exhaustive-deps -- activeTab is read on open, not a trigger
    }, [panelOpen]);

    // A destructive action was reset out from under the confirmation state
    // (e.g. everything got cleared some other way) — don't leave a stale
    // "press again to confirm" armed with nothing left to reset.
    useEffect(() => {
        if (adjustments.length === 0 && resetArmed) {
            setResetArmed(false);
            window.clearTimeout(resetTimerRef.current);
        }
    }, [adjustments.length, resetArmed]);

    useEffect(() => {
        /**
         * Keeps the page's double-click zoom (unilens-lib zoom.ts) from firing
         * on accessibility panel interactions:
         * - a double-click inside the widget, and
         * - while the panel is open, a double-click that selected a word on the
         *   page (most likely a selection for "enlarge only the selected text";
         *   a zoom there would interrupt the gesture).
         *
         * zoom.ts listens on `document` (bubble). This listener sits one step
         * earlier on <html> (bubble), so it can stop the event before it reaches
         * `document` while every host handler on the target and its ancestors
         * has already run. It used to stop the event in document's capture
         * phase, which silently disabled every host dblclick handler on the
         * page while the panel was open.
         */
        function onDblClick(e: globalThis.MouseEvent) {
            const root = document.getElementById(ROOT_ID);
            const insideWidget =
                e.target instanceof Node && root?.contains(e.target) === true;
            if (insideWidget) {
                e.stopPropagation();
                return;
            }
            if (!panelOpenRef.current) return;
            const sel = window.getSelection();
            if (sel && !sel.isCollapsed && sel.toString().trim() !== "")
                e.stopPropagation();
        }
        function onKeyDown(e: globalThis.KeyboardEvent) {
            if (e.key !== "Escape" || !panelOpenRef.current) return;
            if (e.defaultPrevented) return;
            // Only Esc meant for the panel: focus inside the widget, or nothing
            // focused at all. Esc in a host input / dialog belongs to the host.
            const active = document.activeElement;
            const root = document.getElementById(ROOT_ID);
            const inWidget = !!active && root?.contains(active) === true;
            const nothingFocused =
                !active ||
                active === document.body ||
                active === document.documentElement;
            if (!inWidget && !nothingFocused) return;
            e.preventDefault();
            setPanelOpen(false);
            setResetArmed(false);
            window.clearTimeout(resetTimerRef.current);
            if (inWidget) toggleBtnRef.current?.focus();
        }
        const html = document.documentElement;
        document.addEventListener("keydown", onKeyDown);
        html.addEventListener("dblclick", onDblClick);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            html.removeEventListener("dblclick", onDblClick);
        };
    }, []);

    function switchTab(tab: PanelTab) {
        if (tab === activeTab) return;
        setActiveTab(tab);
        persistActiveTab(tab);
        setOpenedTabs((prev) =>
            prev.has(tab) ? prev : new Set(prev).add(tab),
        );
        if (bodyRef.current) bodyRef.current.scrollTop = 0;
    }

    function closePanel() {
        const hadFocusInside =
            document
                .getElementById(ROOT_ID)
                ?.contains(document.activeElement) === true;
        setPanelOpen(false);
        setResetArmed(false);
        window.clearTimeout(resetTimerRef.current);
        if (hadFocusInside) toggleBtnRef.current?.focus();
    }

    function togglePanel() {
        if (panelOpen) closePanel();
        else setPanelOpen(true);
    }

    function handleResetPress() {
        if (!resetArmed) {
            setResetArmed(true);
            window.clearTimeout(resetTimerRef.current);
            resetTimerRef.current = window.setTimeout(
                () => setResetArmed(false),
                RESET_CONFIRM_MS,
            );
            announce(t().resetConfirm);
            return;
        }
        setResetArmed(false);
        window.clearTimeout(resetTimerRef.current);
        resetA11ySettings();
        runAutoTextAction("reset");
        clearAllSelectionFontSizes();
        // stopSpeech()
        setLastAnalysis(null);
        setLastSelectionMessage(null);
        announce(t().resetDone);
    }

    return (
        <>
            <button
                type="button"
                className="unilens-a11y-toggle"
                id="unilens-a11y-toggle"
                aria-expanded={panelOpen}
                aria-controls="unilens-a11y-panel"
                aria-haspopup="dialog"
                aria-label={t().openPanel}
                ref={toggleBtnRef}
                onClick={togglePanel}
            >
                <Icon name="access" size={19} />
                <span className="unilens-a11y-toggle-text">
                    {t().toggleLabel}
                </span>
            </button>

            <div
                id="unilens-a11y-panel"
                className="unilens-a11y-panel"
                role="dialog"
                aria-labelledby="unilens-a11y-title"
                aria-modal="false"
                hidden={!panelOpen}
            >
                <Header onClose={closePanel} />
                <TabBar
                    activeTab={activeTab}
                    onSwitch={switchTab}
                    btnRefs={tabBtnRefs}
                />

                <div className="unilens-a11y-body" ref={bodyRef}>
                    {TABS.map(({ id }) => (
                        <div
                            key={id}
                            id={a11yTabpanelId(id)}
                            className={
                                id === activeTab
                                    ? "unilens-a11y-tabpanel unilens-a11y-tabpanel-active"
                                    : "unilens-a11y-tabpanel"
                            }
                            role="tabpanel"
                            aria-labelledby={a11yTabId(id)}
                            hidden={id !== activeTab}
                        >
                            {openedTabs.has(id) &&
                                (id === "visual" ? (
                                    <VisualTab />
                                ) : (
                                    <ToolsTab
                                        lastAnalysis={lastAnalysis}
                                        setLastAnalysis={setLastAnalysis}
                                        lastSelectionMessage={
                                            lastSelectionMessage
                                        }
                                        setLastSelectionMessage={
                                            setLastSelectionMessage
                                        }
                                    />
                                ))}
                        </div>
                    ))}
                </div>

                <Footer
                    hasAdjustments={adjustments.length > 0}
                    resetArmed={resetArmed}
                    onResetPress={handleResetPress}
                />
            </div>

            <LiveRegion />
        </>
    );
}

export function initAccessibilityPanel() {
    if (document.getElementById(ROOT_ID)) return;

    ensureStyles();
    applyA11yToDocument();

    const container = document.createElement("div");
    container.id = ROOT_ID;
    container.setAttribute(UI_ATTR, "1");
    document.documentElement.appendChild(container);

    panelAltPointerDown = (e: globalThis.MouseEvent) => {
        if (e.altKey) e.stopPropagation();
    };
    container.addEventListener("mousedown", panelAltPointerDown, true);
    container.addEventListener("click", panelAltPointerDown, true);

    panelDomRoot = container;
    panelReactRoot = createRoot(container);
    panelReactRoot.render(<AccessibilityPanelApp />);
}

export function destroyAccessibilityPanel() {
    panelReactRoot?.unmount();
    if (panelDomRoot && panelAltPointerDown) {
        panelDomRoot.removeEventListener(
            "mousedown",
            panelAltPointerDown,
            true,
        );
        panelDomRoot.removeEventListener("click", panelAltPointerDown, true);
    }
    panelDomRoot?.remove();
    panelReactRoot = null;
    panelDomRoot = null;
    panelAltPointerDown = null;
    document.getElementById(A11Y_WIDGET_STYLE_ID)?.remove();
    document.getElementById(A11Y_PAGE_STYLE_ID)?.remove();
    document.getElementById(A11Y_CSS_LINK_ID)?.remove();
    externalCssUrl = null;
}
