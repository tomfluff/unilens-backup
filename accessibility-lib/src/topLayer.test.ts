import { describe, expect, it } from "vitest";
import {
    hostHasTopLayer,
    registerTopLayer,
    syncTopLayer,
    topLayerSupported,
    unregisterTopLayer,
} from "./topLayer";

describe("pointer followers in the top layer", () => {
    it("does nothing where there is no DOM / no popover support", () => {
        expect(topLayerSupported()).toBe(false);
        expect(hostHasTopLayer()).toBe(false);
        const el = {} as HTMLElement;
        expect(() => registerTopLayer(el, "always")).not.toThrow();
        expect(() => syncTopLayer()).not.toThrow();
        expect(() => unregisterTopLayer(el)).not.toThrow();
        expect(() => unregisterTopLayer(null)).not.toThrow();
    });
});
