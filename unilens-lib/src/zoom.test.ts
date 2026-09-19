import { describe, expect, it, vi } from "vitest";
import { onViewChange, setView } from "./zoom";

describe("onViewChange", () => {
    it("returns an unsubscribe that stops later notifications", () => {
        window.scrollTo = vi.fn(); // jsdom does not implement it
        const cb = vi.fn();
        const off = onViewChange(cb);
        setView(10, 20);
        expect(cb).toHaveBeenCalledTimes(1);
        off();
        setView(30, 40);
        expect(cb).toHaveBeenCalledTimes(1);
    });
});
