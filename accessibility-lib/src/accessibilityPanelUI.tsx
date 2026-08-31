/**
 * Display adjustment panel — shared UI primitives (React components).
 *
 * Design principles:
 * - Keep every touch target at least 44px (WCAG 2.5.5 equivalent).
 * - Never rely on color alone for selection state — also show a checkmark,
 *   bold weight, and a border (for color-vision diversity).
 * - Exclusive choices are operable as a radiogroup with arrow keys (roving tabindex).
 */
import {
    type CSSProperties,
    type KeyboardEvent,
    type ReactNode,
    useEffect,
    useRef,
    useState,
} from "react";

import { A11Y_ROOT_ID, FOCUS_KEY_ATTR } from "./domIds";

export { A11Y_ROOT_ID as ROOT_ID, FOCUS_KEY_ATTR };

/**
 * Subscribes a component to an external store's plain `(cb) => unsubscribe`
 * change notifier (accessibilityStore.ts, settings.ts, accessibilityI18n.ts,
 * speakSelection.ts, and selectionTextSize.ts all expose this shape). The
 * stores mutate a single shared object in place rather than replacing it, so
 * this just forces a re-render on every notification instead of trying to
 * compare snapshots — the component body then reads the live object fresh.
 */
export function useExternalSignal(
    subscribe: (cb: () => void) => () => void,
): void {
    const [, setTick] = useState(0);
    useEffect(() => subscribe(() => setTick((n) => n + 1)), [subscribe]);
}

/** An identifying attribute used to restore focus across re-renders. */
export type IconName =
    | "contrast"
    | "text"
    | "textColor"
    | "sliders"
    | "lab"
    | "close"
    | "check"
    | "reset"
    | "refresh"
    | "chart"
    | "plus"
    | "minus"
    | "access"
    | "selection"
    | "auto"
    | "expand"
    | "boost"
    | "chevron"
    | "palette"
    | "type"
    | "globe"
    | "preset"
    | "link"
    | "cursor"
    | "speaker"
    | "play"
    | "pause"
    | "stop";

const ICON_PATHS: Record<IconName, string> = {
    contrast:
        '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" stroke="none"/>',
    text: '<path d="M4 7V5h16v2"/><path d="M12 5v14"/><path d="M9 19h6"/>',
    textColor:
        '<path d="M3 7V5h12v2"/><path d="M9 5v14"/><path d="M6 19h6"/><circle cx="18.5" cy="16.5" r="3.5" fill="currentColor" stroke="none"/>',
    sliders:
        '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    lab: '<path d="M9 3h6"/><path d="M10 3v6.2L5.2 18.2A2.4 2.4 0 0 0 7.3 21.5h9.4a2.4 2.4 0 0 0 2.1-3.3L14 9.2V3"/><path d="M8.2 14h7.6"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    reset: '<path d="M3 12a9 9 0 1 0 2.6-6.4L3 8"/><path d="M3 3v5h5"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/>',
    chart: '<path d="M3 21h18"/><path d="M7 21v-5M12 21V7M17 21v-9"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    access: '<circle cx="12" cy="4" r="1.8"/><path d="M4.5 8.4 12 9.8l7.5-1.4"/><path d="m9.2 21 1.5-7.2M14.8 21l-1.5-7.2"/><path d="M9.6 13.8h4.8"/>',
    selection:
        '<path d="M9 4h6M9 20h6M12 4v16"/><path d="M4 8V6a2 2 0 0 1 2-2h1M20 8V6a2 2 0 0 0-2-2h-1M4 16v2a2 2 0 0 0 2 2h1M20 16v2a2 2 0 0 1-2 2h-1"/>',
    auto: '<path d="m12 3 1.8 4.4L18 9.2l-4.2 1.8L12 15.4l-1.8-4.4L6 9.2l4.2-1.8z"/><path d="m18 15.4.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
    expand: '<path d="M3 19 8 6l5 13"/><path d="M4.8 14.6h6.4"/><path d="M18 20V9"/><path d="m14.8 12.2 3.2-3.2 3.2 3.2"/>',
    boost: '<path d="M4 19 8 9l4 10"/><path d="M5.6 15.4h4.8"/><path d="M17.5 20v-6.5"/><path d="m14.8 16.2 2.7-2.7 2.7 2.7"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    palette:
        '<path d="M12 3a9 9 0 1 0 0 18 2 2 0 0 0 1.6-3.2 2 2 0 0 1 1.6-3.2H18a3 3 0 0 0 3-3A9 9 0 0 0 12 3Z"/><circle cx="7.5" cy="12" r="1"/><circle cx="9.8" cy="7.9" r="1"/><circle cx="14.4" cy="7.5" r="1"/>',
    type: '<path d="M4 7V5h16v2"/><path d="M12 5v14"/><path d="M9 19h6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3.2 9h17.6M3.2 15h17.6"/><path d="M12 3c2.3 2.5 3.5 5.6 3.5 9s-1.2 6.5-3.5 9c-2.3-2.5-3.5-5.6-3.5-9s1.2-6.5 3.5-9Z"/>',
    preset: '<path d="m12 3 1.6 4.8L18.5 9.5l-4.9 1.7L12 16l-1.6-4.8L5.5 9.5l4.9-1.7z"/><path d="M18.5 15.5 19.3 18l2.5.8-2.5.8-.8 2.5-.8-2.5-2.5-.8 2.5-.8z"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 0 0-7.07-7.07L11 5"/><path d="M14 11a5 5 0 0 0-7.07 0L4.8 13.12a5 5 0 0 0 7.07 7.07L13 19"/>',
    cursor: '<path d="M5 3v16l5.2-5 3.2 7.5 2.8-1.2-3.3-7.6L19 11.5Z"/>',
    speaker:
        '<path d="M11 5 6.5 8.8H3v6.4h3.5L11 19z"/><path d="M15 9.4a3.6 3.6 0 0 1 0 5.2"/><path d="M17.8 6.6a7.6 7.6 0 0 1 0 10.8"/>',
    play: '<path d="M7.5 4.8v14.4L19.5 12z"/>',
    pause: '<path d="M9.5 5v14M14.5 5v14"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2.5"/>',
};

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
    return (
        <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: Static SVG path definitions from ICON_PATHS
            dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] }}
        />
    );
}

/** A shared arrow-key handler for radiogroup-style button rows (WAI-ARIA roving tabindex pattern). */
function rovingKeyDown(
    e: KeyboardEvent,
    index: number,
    count: number,
    moveTo: (index: number) => void,
) {
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown")
        next = (index + 1) % count;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
        next = (index - 1 + count) % count;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = count - 1;
    if (next < 0) return;
    e.preventDefault();
    moveTo(next);
}

/** Suppresses the button's mousedown so a click doesn't clear a text selection. */
function keepSelection(e: { preventDefault(): void }) {
    e.preventDefault();
}

// ── Button ─────────────────────────────────────────────────────────────────

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";

export interface ButtonProps {
    label?: string;
    iconName?: IconName;
    variant?: ButtonVariant;
    ariaLabel?: string;
    focusKey?: string;
    full?: boolean;
    disabled?: boolean;
    onClick: () => void;
}

export function Button({
    label,
    iconName,
    variant = "secondary",
    ariaLabel,
    focusKey,
    full,
    disabled,
    onClick,
}: ButtonProps) {
    const classes = ["unilens-a11y-btn", `unilens-a11y-btn--${variant}`];
    if (full) classes.push("unilens-a11y-btn--full");
    if (!label) classes.push("unilens-a11y-btn--icon");

    return (
        <button
            type="button"
            className={classes.join(" ")}
            aria-label={ariaLabel ?? label ?? ""}
            disabled={disabled}
            data-unilens-a11y-focus-key={focusKey}
            onMouseDown={keepSelection}
            onClick={onClick}
        >
            {iconName && <Icon name={iconName} size={17} />}
            {label && <span>{label}</span>}
        </button>
    );
}

export function ButtonRow({ children }: { children: ReactNode }) {
    return <div className="unilens-a11y-btn-row">{children}</div>;
}

// ── Card ───────────────────────────────────────────────────────────────────

export interface CardProps {
    title: string;
    iconName: IconName;
    desc?: string;
    /** A badge shown next to the title when active (e.g. "Medium", "Applied"). */
    badge?: string;
    children?: ReactNode;
}

export function Card({ title, iconName, desc, badge, children }: CardProps) {
    return (
        <section className="unilens-a11y-card">
            <div className="unilens-a11y-card-head">
                <span className="unilens-a11y-card-icon" aria-hidden="true">
                    <Icon name={iconName} size={18} />
                </span>
                <h3 className="unilens-a11y-card-title">{title}</h3>
                {badge && (
                    <span className="unilens-a11y-card-badge">{badge}</span>
                )}
            </div>
            {desc && <p className="unilens-a11y-card-desc">{desc}</p>}
            {children}
        </section>
    );
}

// ── Exclusive choice (radiogroup) ─────────────────────────────────────────

export interface ChoiceOption<T extends string> {
    value: T;
    label: string;
    /** A hint shown below the label (e.g. "150%"). */
    hint?: string;
    ariaLabel: string;
    /** A preview element that shows the result of choosing this option. */
    preview?: () => ReactNode;
    /**
     * A language tag for when the option label itself is written in a
     * different language (e.g. "English" in the language switcher).
     * Changes the pronunciation used by screen readers.
     */
    lang?: string;
}

export interface ChoiceGroupProps<T extends string> {
    label: string;
    /** Grid column count. Auto-derived from the option count if omitted. */
    columns?: number;
    options: ChoiceOption<T>[];
    current: T;
    /** Prefix for the focus-restoration key. */
    focusPrefix: string;
    /** Blocks interaction when a prerequisite isn't met (e.g. no range selected). */
    disabled?: boolean;
    onSelect: (value: T) => void;
}

/**
 * An exclusive-choice group. Lays out card-like buttons and highlights the
 * selected one with a checkmark.
 */
export function ChoiceGroup<T extends string>({
    label,
    columns,
    options,
    current,
    focusPrefix,
    disabled,
    onSelect,
}: ChoiceGroupProps<T>) {
    const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const cols = columns ?? (options.length >= 4 ? 4 : options.length);

    const moveTo = (index: number) => {
        btnRefs.current[index]?.focus();
        onSelect(options[index].value);
    };

    return (
        <fieldset className="unilens-a11y-group">
            <legend className="unilens-a11y-group-label">{label}</legend>
            <div
                className="unilens-a11y-choices"
                role="radiogroup"
                aria-label={label}
                style={{ "--unilens-a11y-panel-cols": cols } as CSSProperties}
            >
                {options.map((opt, i) => {
                    const selected = opt.value === current;
                    return (
                        // biome-ignore lint/a11y/useSemanticElements: ARIA radio button pattern with roving tabindex for custom segmented control
                        <button
                            key={opt.value}
                            ref={(node: HTMLButtonElement | null) => {
                                btnRefs.current[i] = node;
                            }}
                            type="button"
                            className="unilens-a11y-choice"
                            role="radio"
                            aria-checked={selected}
                            aria-label={opt.ariaLabel}
                            tabIndex={selected ? 0 : -1}
                            disabled={disabled}
                            lang={opt.lang}
                            data-unilens-a11y-focus-key={`${focusPrefix}:${opt.value}`}
                            onMouseDown={keepSelection}
                            onClick={() => onSelect(opt.value)}
                            onKeyDown={(e: KeyboardEvent) =>
                                rovingKeyDown(e, i, options.length, moveTo)
                            }
                        >
                            <span
                                className="unilens-a11y-choice-check"
                                aria-hidden="true"
                            >
                                <Icon name="check" size={12} />
                            </span>
                            {opt.preview?.()}
                            <span className="unilens-a11y-choice-label">
                                {opt.label}
                            </span>
                            {opt.hint && (
                                <span className="unilens-a11y-choice-hint">
                                    {opt.hint}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </fieldset>
    );
}

// ── Preview components ──────────────────────────────────────────────────────

/** A color swatch showing how a color mode looks. */
export function SwatchPreview({
    background,
    color,
    sample = "あA",
}: {
    background: string;
    color: string;
    sample?: string;
}) {
    return (
        <span
            className="unilens-a11y-swatch"
            aria-hidden="true"
            style={{ background, color }}
        >
            {sample}
        </span>
    );
}

/** A color strip that shows saturation/contrast through the actual CSS filter. */
export function StripPreview({ filter }: { filter: string }) {
    return (
        <span
            className="unilens-a11y-strip"
            aria-hidden="true"
            style={{ filter }}
        />
    );
}

/** A text sample showing how a font size/typeface looks. */
export function TextPreview({
    sample,
    style,
}: {
    sample: string;
    style: CSSProperties;
}) {
    return (
        <span className="unilens-a11y-sample" aria-hidden="true" style={style}>
            {sample}
        </span>
    );
}

/** A set of horizontal lines showing how a line height looks. */
export function LinesPreview({ gap }: { gap: number }) {
    return (
        <span
            className="unilens-a11y-lines"
            aria-hidden="true"
            style={{ gap: `${gap}px` }}
        >
            {[0, 1, 2].map((i) => (
                <span key={i} className="unilens-a11y-line" />
            ))}
        </span>
    );
}

// ── Level choice (Off / Low / Medium / High) ──────────────────────────────

export interface LevelOption {
    value: number;
    label: string;
    hint?: string;
    ariaLabel: string;
}

export interface LevelControlProps {
    label: string;
    options: LevelOption[];
    current: number;
    focusPrefix: string;
    onSelect: (value: number) => void;
}

function LevelMeter({ level }: { level: number }) {
    if (level <= 0) {
        return (
            <span className="unilens-a11y-level-meter" aria-hidden="true">
                <span className="unilens-a11y-level-off" />
            </span>
        );
    }
    const heights = [5, 8, 11];
    return (
        <span className="unilens-a11y-level-meter" aria-hidden="true">
            {heights.map((h, i) => (
                <span
                    key={h}
                    className={`unilens-a11y-level-bar${i < level ? " unilens-a11y-level-bar--on" : ""}`}
                    style={{ height: `${h}px` }}
                />
            ))}
        </span>
    );
}

/**
 * A level choice with an intensity meter — the number of filled bars makes
 * the strength intuitive at a glance.
 */
export function LevelControl({
    label,
    options,
    current,
    focusPrefix,
    onSelect,
}: LevelControlProps) {
    const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const moveTo = (index: number) => {
        btnRefs.current[index]?.focus();
        onSelect(options[index].value);
    };

    return (
        <fieldset className="unilens-a11y-group">
            <legend className="unilens-a11y-group-label">{label}</legend>
            <div
                className="unilens-a11y-level"
                role="radiogroup"
                aria-label={label}
            >
                {options.map((opt, i) => {
                    const selected = opt.value === current;
                    return (
                        // biome-ignore lint/a11y/useSemanticElements: ARIA radio button pattern with roving tabindex for custom segmented control
                        <button
                            key={opt.value}
                            ref={(node: HTMLButtonElement | null) => {
                                btnRefs.current[i] = node;
                            }}
                            type="button"
                            className="unilens-a11y-level-btn"
                            role="radio"
                            aria-checked={selected}
                            aria-label={opt.ariaLabel}
                            tabIndex={selected ? 0 : -1}
                            data-unilens-a11y-focus-key={`${focusPrefix}:${opt.value}`}
                            onMouseDown={keepSelection}
                            onClick={() => onSelect(opt.value)}
                            onKeyDown={(e: KeyboardEvent) =>
                                rovingKeyDown(e, i, options.length, moveTo)
                            }
                        >
                            <LevelMeter level={opt.value} />
                            <span className="unilens-a11y-level-label">
                                {opt.label}
                            </span>
                            {opt.hint && (
                                <span className="unilens-a11y-level-hint">
                                    {opt.hint}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </fieldset>
    );
}

// ── Switch ─────────────────────────────────────────────────────────────────

export interface SwitchRowProps {
    label: string;
    hint?: string;
    checked: boolean;
    focusKey: string;
    onChange: (checked: boolean) => void;
}

/** A toggle switch whose state reads more clearly than a checkbox's. */
export function SwitchRow({
    label,
    hint,
    checked,
    focusKey,
    onChange,
}: SwitchRowProps) {
    const labelId = `unilens-a11y-switch-${focusKey.replace(/[^a-z0-9]+/gi, "-")}`;
    return (
        <div className="unilens-a11y-switch-row">
            <div className="unilens-a11y-switch-text">
                <span className="unilens-a11y-switch-label" id={labelId}>
                    {label}
                </span>
                {hint && (
                    <span className="unilens-a11y-switch-hint">{hint}</span>
                )}
            </div>
            <button
                type="button"
                className="unilens-a11y-switch"
                role="switch"
                aria-checked={checked}
                aria-labelledby={labelId}
                data-unilens-a11y-focus-key={focusKey}
                onMouseDown={keepSelection}
                onClick={() => onChange(!checked)}
            />
        </div>
    );
}

// ── Stepper ────────────────────────────────────────────────────────────────

export interface StepperProps {
    label: string;
    value: string;
    decreaseLabel: string;
    increaseLabel: string;
    focusPrefix: string;
    onDecrease: () => void;
    onIncrease: () => void;
}

/** A numeric adjuster that ties +/- to the current value, clearer in intent than standalone buttons. */
export function Stepper({
    label,
    value,
    decreaseLabel,
    increaseLabel,
    focusPrefix,
    onDecrease,
    onIncrease,
}: StepperProps) {
    return (
        <div className="unilens-a11y-group">
            <span className="unilens-a11y-group-label">{label}</span>
            <div className="unilens-a11y-stepper">
                <Button
                    iconName="minus"
                    variant="secondary"
                    ariaLabel={decreaseLabel}
                    focusKey={`${focusPrefix}:dec`}
                    onClick={onDecrease}
                />
                <span className="unilens-a11y-stepper-value" role="status">
                    {value}
                </span>
                <Button
                    iconName="plus"
                    variant="secondary"
                    ariaLabel={increaseLabel}
                    focusKey={`${focusPrefix}:inc`}
                    onClick={onIncrease}
                />
            </div>
        </div>
    );
}

// ── Chip (currently applied setting) ──────────────────────────────────────

export function Chip({
    label,
    removeLabel,
    focusKey,
    onRemove,
}: {
    label: string;
    removeLabel: string;
    focusKey: string;
    onRemove: () => void;
}) {
    return (
        <span className="unilens-a11y-chip">
            <span className="unilens-a11y-chip-text">{label}</span>
            <button
                type="button"
                className="unilens-a11y-chip-x"
                aria-label={removeLabel}
                data-unilens-a11y-focus-key={focusKey}
                onMouseDown={keepSelection}
                onClick={onRemove}
            >
                <Icon name="close" size={12} />
            </button>
        </span>
    );
}

// ── Note display ───────────────────────────────────────────────────────────

export type NoteTone = "neutral" | "info" | "ok" | "error";

export function Note({
    text,
    tone = "neutral",
    iconName,
}: {
    text: string;
    tone?: NoteTone;
    iconName?: IconName;
}) {
    return (
        <p className={`unilens-a11y-note unilens-a11y-note--${tone}`}>
            {iconName && <Icon name={iconName} size={15} />}
            <span>{text}</span>
        </p>
    );
}

/** Displays analysis results and the like as organized term/value pairs. */
export function Metrics({ rows }: { rows: [string, string][] }) {
    return (
        <dl className="unilens-a11y-metrics">
            {rows.flatMap(([term, value]) => [
                <dt key={`${term}-t`}>{term}</dt>,
                <dd key={`${term}-d`}>{value}</dd>,
            ])}
        </dl>
    );
}

// ── Announcement (aria-live) ──────────────────────────────────────────────

let liveRegionEl: HTMLElement | null = null;
let liveTimer = 0;

/**
 * The live region that announces the result of an action.
 *
 * Mounted once at the widget root (outside the tab content that gets
 * rebuilt on every settings change) so an announcement is never mistaken
 * for a fresh insertion, and never missed because the text happens to be
 * unchanged.
 */
export function LiveRegion() {
    return (
        <div
            ref={(node: HTMLDivElement | null) => {
                liveRegionEl = node;
            }}
            className="unilens-a11y-sr-only"
            role="status"
            aria-live="polite"
            aria-atomic="true"
        />
    );
}

/**
 * Announces the result of an action to screen readers.
 * Clears the region first, then refills it, so consecutive identical
 * messages are still announced.
 */
export function announce(message: string) {
    if (!liveRegionEl || !message) return;
    const region = liveRegionEl;
    region.textContent = "";
    window.clearTimeout(liveTimer);
    liveTimer = window.setTimeout(() => {
        region.textContent = message;
    }, 60);
}
