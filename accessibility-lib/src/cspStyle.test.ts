import { afterEach, describe, expect, it } from "vitest";
import { getCspNonce, setCspNonce } from "./cspStyle";

describe("CSP nonce for injected styles", () => {
    afterEach(() => setCspNonce(null));

    it("uses the nonce passed to init()", () => {
        setCspNonce("abc123");
        expect(getCspNonce()).toBe("abc123");
    });

    it("ignores an empty value and falls back to detection", () => {
        setCspNonce("  ");
        expect(getCspNonce()).toBe(null);
    });
});
