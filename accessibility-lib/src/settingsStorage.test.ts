import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./autoTextSize", () => ({ runAutoTextAction: vi.fn() }));

const g = globalThis as { window?: unknown };

describe("settings storage that never throws", () => {
    afterEach(() => {
        delete g.window;
        vi.resetModules();
    });

    it("keeps a value in memory when localStorage refuses the write", async () => {
        const store = new Map<string, string>();
        g.window = {
            localStorage: {
                getItem: (k: string) => store.get(k) ?? null,
                setItem: () => {
                    throw new Error("QuotaExceededError");
                },
                removeItem: (k: string) => store.delete(k),
            },
        };
        const { safeSettingsStorage } = await import("./settings");
        expect(() => safeSettingsStorage.setItem("k", "v1")).not.toThrow();
        expect(safeSettingsStorage.getItem("k")).toBe("v1");
        safeSettingsStorage.removeItem("k");
        expect(safeSettingsStorage.getItem("k")).toBe(null);
    });

    it("works when touching localStorage itself throws", async () => {
        g.window = {
            get localStorage() {
                throw new Error("SecurityError");
            },
        };
        const { safeSettingsStorage } = await import("./settings");
        expect(safeSettingsStorage.getItem("k")).toBe(null);
        expect(() => safeSettingsStorage.setItem("k", "v")).not.toThrow();
        expect(safeSettingsStorage.getItem("k")).toBe("v");
    });

    it("writes through and reads back when localStorage works", async () => {
        const store = new Map<string, string>();
        g.window = {
            localStorage: {
                getItem: (k: string) => store.get(k) ?? null,
                setItem: (k: string, v: string) => store.set(k, v),
                removeItem: (k: string) => store.delete(k),
            },
        };
        const { safeSettingsStorage } = await import("./settings");
        safeSettingsStorage.setItem("k", "v");
        expect(store.get("k")).toBe("v");
        expect(safeSettingsStorage.getItem("k")).toBe("v");
    });
});
