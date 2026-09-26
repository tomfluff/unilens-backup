import { describe, expect, it } from "vitest";
import { aliasPlace, clearPlaces, recordPlace } from "./places";
import { savedPlaces } from "./restore";

describe("savedPlaces", () => {
    it("keeps the places in order, without their elements, and the view refreshes' ids", () => {
        clearPlaces();
        const el = document.createElement("p");
        recordPlace({
            captureId: "a",
            at: 1,
            x: 10,
            y: 20,
            el,
            label: "P one",
        });
        recordPlace({ captureId: "b", at: 2, x: 30, y: 40, label: "P two" });
        aliasPlace("a2", "a");
        expect(savedPlaces()).toEqual({
            places: [
                { captureId: "a", at: 1, x: 10, y: 20, label: "P one" },
                { captureId: "b", at: 2, x: 30, y: 40, label: "P two" },
            ],
            aliases: [["a2", "a"]],
        });
    });
});
