import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    browserZoom,
    initFloatingButton,
    layoutNow,
    stepUp,
} from "./floatingButton";
import { updateSetting } from "./settings";

const root = () => document.querySelector<HTMLElement>(".ul-fab");
let off: (() => void) | null = null;
let asked: boolean[] = [];
let open = false;

beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = "";
    asked = [];
    open = false;
    updateSetting("floatingButton", "off");
    updateSetting("fabReminder", false);
    updateSetting("fabReminderSec", 120);
    updateSetting("voiceInput", true);
    updateSetting("chatLanguage", "en");
    off = initFloatingButton({
        ask: (voice) => asked.push(voice),
        chatOpen: () => open,
    });
});
afterEach(() => {
    off?.();
    vi.useRealTimers();
});

describe("floating button", () => {
    it("shows nothing while off", () => {
        expect(root()).toBeNull();
    });

    it("is a round button that asks about the page", () => {
        updateSetting("floatingButton", "round");
        layoutNow();
        const b = root()?.querySelector<HTMLButtonElement>(".ul-fab-a");
        expect(b?.getAttribute("aria-label")).toBe(
            "Ask UniLens about this page",
        );
        b?.click();
        expect(asked).toEqual([false]);
    });

    it("is a bar to type or speak, without the microphone when voice is off", () => {
        updateSetting("floatingButton", "bar");
        layoutNow();
        const [t, m] = [...(root()?.querySelectorAll("button") ?? [])];
        expect(t.textContent).toBe("Ask about this page");
        t.click();
        m.click();
        expect(asked).toEqual([false, true]);
        updateSetting("voiceInput", false);
        layoutNow();
        expect(root()?.querySelectorAll("button")).toHaveLength(1);
    });

    it("reminds now and then beside the round button, never while the chat is open", () => {
        updateSetting("floatingButton", "round");
        updateSetting("fabReminder", true);
        updateSetting("fabReminderSec", 30);
        layoutNow();
        const tip = () => root()?.querySelector(".ul-fab-tip");
        vi.advanceTimersByTime(29_000);
        expect(tip()).toBeFalsy();
        vi.advanceTimersByTime(2_000);
        expect(tip()?.textContent).toBe("Ask me about this page");
        expect(tip()?.getAttribute("role")).toBe("status");
        // gone after a few seconds, back a whole wait later
        vi.advanceTimersByTime(9_000);
        expect(tip()).toBeFalsy();
        // the chat open: no reminder, however long
        open = true;
        vi.advanceTimersByTime(120_000);
        expect(tip()).toBeFalsy();
        // the bar has no reminder
        open = false;
        updateSetting("floatingButton", "bar");
        layoutNow();
        vi.advanceTimersByTime(120_000);
        expect(tip()).toBeFalsy();
    });

    it("steps up above what the page fixes at the bottom", () => {
        const banner = document.createElement("div");
        banner.style.position = "fixed";
        document.body.appendChild(banner);
        const H = window.innerHeight;
        banner.getBoundingClientRect = () =>
            ({
                left: 0,
                top: H - 80,
                width: 1024,
                height: 80,
                right: 1024,
                bottom: H,
            }) as DOMRect;
        document.elementsFromPoint = (_x: number, y: number) =>
            y > H - 80 ? [banner, document.body] : [document.body];
        expect(stepUp(10, 56, 56, 14)).toBe(80 + 10);
        // a fixed header near the top is not stepped over
        banner.getBoundingClientRect = () =>
            ({
                left: 0,
                top: 0,
                width: 1024,
                height: 80,
                right: 1024,
                bottom: 80,
            }) as DOMRect;
        expect(stepUp(10, 56, 56, 14)).toBe(14);
    });

    it("reads the browser's zoom, in and out", () => {
        const at = (outer: number, inner: number) => {
            Object.defineProperty(window, "outerWidth", {
                value: outer,
                configurable: true,
            });
            Object.defineProperty(window, "innerWidth", {
                value: inner,
                configurable: true,
            });
            return browserZoom();
        };
        expect(at(1296, 1280)).toBe(1);
        expect(at(1296, 648)).toBe(2);
        expect(at(1296, 1620)).toBe(0.8);
    });
});
