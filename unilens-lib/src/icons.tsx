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
/** a speech bubble with a plus: a new conversation */
export const NewChatIcon = () => (
    <Icon>
        <path d="M5 5h14v10H10l-4 4v-4H5z" />
        <path d="M12 7.5v5M9.5 10h5" />
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
/** Live: a spoken conversation, as sound waves */
export const LiveIcon = () => (
    <Icon>
        <path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4" />
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
export const PlayIcon = () => (
    <Icon>
        <path d="M8 5.5v13l10-6.5z" />
    </Icon>
);
export const PauseIcon = () => (
    <Icon>
        <path d="M9 5v14M15 5v14" />
    </Icon>
);
export const WaveIcon = () => (
    <Icon>
        <path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4" />
    </Icon>
);
export const MinimizeIcon = () => (
    <Icon>
        <path d="M6 12h12" />
    </Icon>
);
export const ExpandIcon = () => (
    <Icon>
        <path d="M6 15l6-6 6 6" />
    </Icon>
);

/* the settings panel's icons, same family */
export const SettingsIcon = () => (
    <Icon>
        {/* after Feather's settings icon (MIT) */}
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </Icon>
);
export const ResetIcon = () => (
    <Icon>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5" />
    </Icon>
);
export const SearchIcon = () => (
    <Icon>
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
    </Icon>
);
export const CheckIcon = () => (
    <Icon>
        <path d="M5 12l5 5 9-10" />
    </Icon>
);
export const ChevronIcon = () => (
    <Icon>
        <path d="M9 6l6 6-6 6" />
    </Icon>
);
export const SaveIcon = () => (
    <Icon>
        <path d="M12 4v11" />
        <path d="M7 10l5 5 5-5" />
        <path d="M5 20h14" />
    </Icon>
);
export const LoadIcon = () => (
    <Icon>
        <path d="M12 20V9" />
        <path d="M7 14l5-5 5 5" />
        <path d="M5 4h14" />
    </Icon>
);
