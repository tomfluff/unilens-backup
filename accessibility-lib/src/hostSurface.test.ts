import { describe, expect, it } from "vitest";
import {
    restoreAllHostInlineStyles,
    restoreHostInlineStyle,
    setHostInlineStyle,
} from "./hostSurface";

function mockHostElement(initial: Record<string, string> = {}) {
    const props = new Map<string, { value: string; priority: string }>();
    for (const [key, value] of Object.entries(initial)) {
        props.set(key, { value, priority: "" });
    }
    const el = {
        style: {
            setProperty: (key: string, value: string, priority = "") =>
                props.set(key, { value, priority }),
            getPropertyValue: (key: string) => props.get(key)?.value ?? "",
            getPropertyPriority: (key: string) =>
                props.get(key)?.priority ?? "",
            removeProperty: (key: string) => props.delete(key),
        },
    };
    return el as HTMLElement;
}

describe("hostSurface", () => {
    it("restores a host inline style after we overwrite it", () => {
        const el = mockHostElement({
            "--unilens-a11y-body-target-size": "12px",
        });

        setHostInlineStyle(el, "--unilens-a11y-body-target-size", "20px");
        expect(
            el.style.getPropertyValue("--unilens-a11y-body-target-size"),
        ).toBe("20px");

        restoreHostInlineStyle(el, "--unilens-a11y-body-target-size");
        expect(
            el.style.getPropertyValue("--unilens-a11y-body-target-size"),
        ).toBe("12px");
    });

    it("restoreAllHostInlineStyles clears every snapshotted property", () => {
        const el = mockHostElement({
            "--unilens-a11y-display-saturate": "1",
            "--unilens-a11y-display-contrast": "1",
        });

        setHostInlineStyle(el, "--unilens-a11y-display-saturate", "0.5");
        setHostInlineStyle(el, "--unilens-a11y-display-contrast", "1.4");

        restoreAllHostInlineStyles(el);
        expect(
            el.style.getPropertyValue("--unilens-a11y-display-saturate"),
        ).toBe("1");
        expect(
            el.style.getPropertyValue("--unilens-a11y-display-contrast"),
        ).toBe("1");
    });
});
