import { describe, it, expect, vi } from "vitest";
import { createSealed, deepSignal } from "../../deepSignal.ts";

describe("Sealed objects", () => {
    // multiple sealed versions of an object
    // modifications by call on array or set
    // modifications on nested prop by path
    // modifications on nested prop by wild-card
    it("allows modifications to non-sealed props", () => {
        const dsObject = deepSignal({ "@id": "did:ng:z:t1", foo: "bar" });
        const sealed = createSealed(dsObject, ["@id"]);
        sealed.foo = "barbar";
        expect(sealed.foo).toBe("barbar");
    });

    it("prohibits modifications to sealed props", () => {
        const dsObject = deepSignal({ "@id": "did:ng:z:t2", foo: "bar" });
        const sealed = createSealed(dsObject, ["@id"]);

        expect(() => {
            sealed["@id"] = "disallowed";
        }).toThrow();
    });

    it("prohibits modifications to nested sealed props", () => {
        const dsObject = deepSignal({
            "@id": "did:ng:z:t3",
            child: { childKey: "k1" },
        });
        const sealed = createSealed(dsObject, ["child"]);

        expect(() => {
            sealed.child = { childKey: "disallowed object assigned" };
        }).toThrow();

        expect(() => {
            sealed.child.childKey = "disallowed nested property assigned";
        }).toThrow();
    });

    it("prohibits modifications on arrays", () => {
        const dsObject = deepSignal({
            writableProp: "some val",
            sealedArray: [1, 2, 3],
        });
        const sealed = createSealed(dsObject, ["sealedArray"]);

        expect(() => {
            sealed.sealedArray = [1];
        }).toThrow();

        expect(() => {
            sealed.sealedArray.push(2);
        }).toThrow();

        expect(() => {
            sealed.sealedArray.splice(1, 1);
        }).toThrow();

        expect(() => {
            sealed.sealedArray.length = 0;
        }).toThrow();

        expect(sealed.sealedArray.map((v) => v + 1)).toEqual([2, 3, 4]);
        expect(sealed.sealedArray).toEqual([1, 2, 3]);
    });
});
