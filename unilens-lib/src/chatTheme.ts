/**
 * The chat's theme as drawn (Yotam, 2026-10-10): light, dark, or the computer's
 * setting, followed live. The chat and the settings panel's preview of it both use
 * this, so the preview shows the theme chosen.
 */
import { useEffect, useState } from "react";
import type { Settings } from "./settings";

/** the computer's dark-mode setting, where the browser can tell */
const prefersDark = (): MediaQueryList | null => {
    try {
        return window.matchMedia?.("(prefers-color-scheme: dark)") ?? null;
    } catch {
        return null;
    }
};

export function useChatTheme(choice: Settings["chatTheme"]): "light" | "dark" {
    const [sysDark, setSysDark] = useState(
        () => prefersDark()?.matches ?? false,
    );
    useEffect(() => {
        const q = prefersDark();
        if (!q) return;
        const on = () => setSysDark(q.matches);
        q.addEventListener("change", on);
        return () => q.removeEventListener("change", on);
    }, []);
    if (choice === "system") return sysDark ? "dark" : "light";
    return choice;
}
