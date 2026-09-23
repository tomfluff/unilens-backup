/**
 * The chat's icons, authored as one family: 24px grid, 2px round stroke, no fill,
 * currentColor. They replace the emoji the popover used (📌 ✕ 🎤 ➤ 🔊 ⏹ ⏳), which
 * render differently on every platform and are not an icon system.
 */
import type { ReactNode } from "react";

function Icon({ children }: { children: ReactNode }) {
    return (
        <svg
            viewBox="0 0 24 24"
            width="1.25em"
            height="1.25em"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
        >
            {children}
        </svg>
    );
}

export const PinIcon = () => (
    <Icon>
        <path d="M9 4h6l-1 6 3 3H7l3-3-1-6z" />
        <path d="M12 16v4" />
    </Icon>
);
export const CloseIcon = () => (
    <Icon>
        <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
);
export const MicIcon = () => (
    <Icon>
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </Icon>
);
export const SendIcon = () => (
    <Icon>
        <path d="M5 12h13M13 6l6 6-6 6" />
    </Icon>
);
export const SpeakerIcon = () => (
    <Icon>
        <path d="M4 9v6h4l5 4V5L8 9H4z" />
        <path d="M16.5 8.5a5 5 0 0 1 0 7" />
    </Icon>
);
export const StopIcon = () => (
    <Icon>
        <rect x="6" y="6" width="12" height="12" rx="2" />
    </Icon>
);
export const WaitIcon = () => (
    <Icon>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" />
    </Icon>
);
export const PrevIcon = () => (
    <Icon>
        <path d="M15 6l-6 6 6 6" />
    </Icon>
);
export const NextIcon = () => (
    <Icon>
        <path d="M9 6l6 6-6 6" />
    </Icon>
);
export const HighlightIcon = () => (
    <Icon>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </Icon>
);
export const BackIcon = () => (
    <Icon>
        <path d="M9 14l-5-5 5-5" />
        <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
    </Icon>
);
export const PlaceIcon = () => (
    <Icon>
        <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
        <circle cx="12" cy="9.5" r="2.5" />
    </Icon>
);
