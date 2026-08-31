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
import { getA11yLang, onA11yLangChange, t } from "./accessibilityI18n";
import {
    bodyExpandLevelLabels,
    type PanelTab,
    smallBoostLevelLabels,
    TABS,
    tabLabel,
} from "./accessibilityPanelOptions";
import { WIDGET_CSS } from "./accessibilityPanelStyles";
import { TextTab, ToolsTab, VisualTab } from "./accessibilityPanelTabs";
import {
    announce,
    Button,
    Icon,
    LiveRegion,
    ROOT_ID,
    useExternalSignal,
} from "./accessibilityPanelUI";
import {
    a11ySettings,
    applyA11yToDocument,
    onA11yChange,
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
    A11Y_OPEN_CLASS,
    A11Y_PAGE_STYLE_ID,
    A11Y_WIDGET_STYLE_ID,
    REDUCE_MOTION_ATTR,
    UI_ATTR,
} from "./domIds";
import { clearSelectionFontSize } from "./selectionTextSize";
// Read-aloud disabled — see accessibility-umd.ts init().
// import { stopSpeech } from './speakSelection'
import { onSettingsChange, settings, updateSetting } from "./settings";
import PAGE_CSS from "./unilens-a11y/style.css";

const RESET_CONFIRM_MS = 4000;

let panelDomRoot: HTMLElement | null = null;
let panelReactRoot: ReturnType<typeof createRoot> | null = null;
let panelAltPointerDown: ((e: globalThis.MouseEvent) => void) | null = null;

/** Restores the previously-open tab (many visitors keep working on the same adjustment). */
function restoreActiveTab(): PanelTab {
    const tab = settings.panelTab;
    if (TABS.some((t) => t.id === tab)) return tab;
    return "visual";
}

function persistActiveTab(tab: PanelTab) {
    updateSetting("panelTab", tab);
}

function ensureStyles() {
    const pageStyle = document.getElementById(A11Y_PAGE_STYLE_ID);
    if (pageStyle) {
        pageStyle.textContent = PAGE_CSS;
    } else {
        const style = document.createElement("style");
        style.id = A11Y_PAGE_STYLE_ID;
        style.textContent = PAGE_CSS;
        document.head.appendChild(style);
    }
    const existing = document.getElementById(A11Y_WIDGET_STYLE_ID);
    if (existing) {
        existing.textContent = WIDGET_CSS;
        return;
    }
    const style = document.createElement("style");
    style.id = A11Y_WIDGET_STYLE_ID;
    style.textContent = WIDGET_CSS;
    document.head.appendChild(style);
}

/** Page display settings must not restyle the overlay — only invert counter-filter and reduce-motion. */
function syncOverlayIsolation() {
    syncWidgetDisplayIsolation();
    const root = document.getElementById(ROOT_ID);
    if (!root) return;
    if (a11ySettings.reduceMotion)
        root.setAttribute(REDUCE_MOTION_ATTR, "true");
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
function activeAdjustments(): Adjustment[] {
    const s = a11ySettings;
    const list: Adjustment[] = [];
    const add = (
        tab: PanelTab,
        key: string,
        label: string,
        clear: () => void,
    ) => list.push({ tab, key, label, clear });

    if (s.theme !== "standard") {
        add("text", "theme", t().theme[s.theme], () =>
            patchA11ySettings({ theme: "standard" }),
        );
    }
    if (s.saturation !== "standard") {
        add(
            "text",
            "saturation",
            t().adjSaturation(t().saturation[s.saturation]),
            () => patchA11ySettings({ saturation: "standard" }),
        );
    }
    if (s.contrast !== "standard") {
        add("text", "contrast", t().adjContrast(t().contrast[s.contrast]), () =>
            patchA11ySettings({ contrast: "standard" }),
        );
    }
    if (s.fontSize !== "standard") {
        add("text", "fontSize", t().adjFontSize(t().fontSize[s.fontSize]), () =>
            patchA11ySettings({ fontSize: "standard" }),
        );
    }
    if (s.fontFamily === "ud") {
        add("text", "fontFamily", t().adjUdFont, () =>
            patchA11ySettings({ fontFamily: "standard" }),
        );
    }
    if (s.fontFamily === "custom" && s.customFontFamily) {
        add("text", "fontFamily", t().adjCustomFont(s.customFontFamily), () =>
            patchA11ySettings({
                fontFamily: "standard",
                customFontFamily: null,
            }),
        );
    }
    if (s.lineHeight === "wide") {
        add("text", "lineHeight", t().adjLineHeight, () =>
            patchA11ySettings({ lineHeight: "standard" }),
        );
    }
    if (s.letterSpacing === "wide") {
        add("text", "letterSpacing", t().adjLetterSpacing, () =>
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
    if (s.focusEnhance) {
        add("visual", "focusEnhance", t().adjFocusEnhance, () =>
            patchA11ySettings({ focusEnhance: false }),
        );
    }
    if (s.reduceMotion) {
        add("visual", "reduceMotion", t().adjReduceMotion, () =>
            patchA11ySettings({ reduceMotion: false }),
        );
    }
    if (s.bodyTextExpandLevel > 0) {
        const name = bodyExpandLevelLabels()[s.bodyTextExpandLevel][0];
        add("text", "bodyTextExpandLevel", t().adjBodyExpand(name), () =>
            patchA11ySettings({ bodyTextExpandLevel: 0 }),
        );
    }
    if (s.smallTextBoostLevel > 0) {
        const name = smallBoostLevelLabels()[s.smallTextBoostLevel][0];
        add("text", "smallTextBoostLevel", t().adjSmallBoost(name), () =>
            patchA11ySettings({ smallTextBoostLevel: 0 }),
        );
    }
    if (settings.autoTextSize && settings.autoTextMode !== "off") {
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
            <span className="unilens-a11y-header-icon" aria-hidden="true">
                <Icon name="access" size={20} />
            </span>
            <div className="unilens-a11y-header-text">
                <h2 id="unilens-a11y-title" className="unilens-a11y-title">
                    {t().panelTitle}
                </h2>
                <p className="unilens-a11y-subtitle">{t().panelSubtitle}</p>
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
        <ul className="unilens-a11y-tabs" aria-label={t().tabsLabel}>
            {TABS.map((tab, index) => {
                const selected = activeTab === tab.id;
                const label = tabLabel(tab.id);
                return (
                    <li key={tab.id}>
                        <button
                            type="button"
                            id={`da-tab-${tab.id}`}
                            className="unilens-a11y-tab"
                            role="tab"
                            aria-selected={selected}
                            aria-controls={`da-tabpanel-${tab.id}`}
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
    useExternalSignal(onA11yChange);
    useExternalSignal(onSettingsChange);
    useExternalSignal(onA11yLangChange);

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

    const adjustments = activeAdjustments();

    // Reflects the widget's language and display-isolation flags into the
    // mount point's own attributes (set outside React — see the file header).
    useEffect(() => {
        document.getElementById(ROOT_ID)?.setAttribute("lang", getA11yLang());
        syncOverlayIsolation();
    });

    useEffect(() => {
        document
            .getElementById(ROOT_ID)
            ?.classList.toggle(A11Y_OPEN_CLASS, panelOpen);
    }, [panelOpen]);

    useEffect(() => {
        if (panelOpen) tabBtnRefs.current[activeTab]?.focus();
        // Only the open transition should move focus — switching tabs while
        // already open is handled by the tab bar's own click/keydown handlers.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [panelOpen, activeTab]);

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
         * Stops the page's double-click zoom (zoom.ts's smart zoom) from interrupting
         * display-adjustment interactions, by intercepting dblclick in the relevant cases.
         *
         * Two conditions trigger this:
         * - A double-click inside the widget. Zooming the page just from operating
         *   the panel would be a misfire.
         * - A double-click on the page while the panel is open. That's most likely a
         *   word selection meant for "enlarge only the selected text" — if zoom fires
         *   there, the selection gesture never completes.
         *
         * zoom.ts registers on document's bubble phase, so intercepting during
         * document's capture phase always runs first regardless of init order.
         * stopPropagation doesn't block the default action, so double-click word
         * selection itself still works normally.
         */
        function onDblClick(e: globalThis.MouseEvent) {
            const root = document.getElementById(ROOT_ID);
            const insideWidget =
                e.target instanceof Node && root?.contains(e.target) === true;
            if (insideWidget || panelOpenRef.current) e.stopPropagation();
        }
        function onKeyDown(e: globalThis.KeyboardEvent) {
            if (e.key === "Escape" && panelOpenRef.current) {
                e.preventDefault();
                setPanelOpen(false);
                setResetArmed(false);
                window.clearTimeout(resetTimerRef.current);
                toggleBtnRef.current?.focus();
            }
        }
        document.addEventListener("keydown", onKeyDown);
        document.addEventListener("dblclick", onDblClick, true);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.removeEventListener("dblclick", onDblClick, true);
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
        clearSelectionFontSize();
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
                            id={`da-tabpanel-${id}`}
                            className={
                                id === activeTab
                                    ? "da-tabpanel unilens-a11y-tabpanel-active"
                                    : "da-tabpanel"
                            }
                            role="tabpanel"
                            aria-labelledby={`da-tab-${id}`}
                            hidden={id !== activeTab}
                        >
                            {openedTabs.has(id) &&
                                (id === "visual" ? (
                                    <VisualTab />
                                ) : id === "text" ? (
                                    <TextTab />
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
}
