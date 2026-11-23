import { describe, expect, it } from "vitest";
import { resolveA11yCssUrl } from "./resolveA11yCssUrl";

describe("resolveA11yCssUrl", () => {
    it("encodes variable segments in relative paths", () => {
        expect(resolveA11yCssUrl("assets/spaced dir/style.css")).toBe(
            "http://localhost/assets/spaced%20dir/style.css",
        );
    });

    it("resolves relative paths against document.baseURI", () => {
        expect(resolveA11yCssUrl("unilens-a11y/style.css")).toBe(
            "http://localhost/unilens-a11y/style.css",
        );
    });

    it("returns absolute URLs unchanged", () => {
        expect(resolveA11yCssUrl("https://cdn.example.com/pkg/style.css")).toBe(
            "https://cdn.example.com/pkg/style.css",
        );
    });
});
