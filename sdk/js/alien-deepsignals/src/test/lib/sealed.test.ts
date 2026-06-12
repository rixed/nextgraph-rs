import { describe, it, expect } from "vitest";
import { deepSignal } from "../../deepSignal.ts";
import { effect, computed } from "../../core.ts";
import { createSeal, sealAllProps } from "../../sealedSignal.ts";

describe("Sealed objects", () => {
    it("allows modifications to non-sealed props", () => {
        const dsObject = deepSignal({ "@id": "did:ng:z:t1", foo: "bar" });
        const sealed = createSeal(dsObject, ["@id"]);
        sealed.foo = "barbar";
        expect(sealed.foo).toBe("barbar");
    });

    it("prohibits modifications to sealed props", () => {
        const dsObject = deepSignal({ "@id": "did:ng:z:t2", foo: "bar" });
        const sealed = createSeal(dsObject, ["@id"]);

        expect(() => {
            sealed["@id"] = "disallowed";
        }).toThrow(/Cannot set value on sealed property/);
    });

    it("prohibits modifications for root sealAllProps symbol", () => {
        const dsObject = deepSignal({
            rootProp: "sealed root",
            child: { childProp: "sealed child" },
        });
        const sealed = createSeal(dsObject, [sealAllProps]);

        expect(() => {
            sealed.rootProp = "disallowed";
        }).toThrow(/Cannot set value on sealed property/);

        expect(() => {
            sealed.child.childProp = "disallowed";
        }).toThrow(/Cannot set value on sealed property/);
    });

    it("prohibits modifications to string-specified sealed props in nested object", () => {
        const dsObject = deepSignal({
            sealedProp: "sealed root",
            nonSealedRootProp: "non sealed",
            child: { sealedProp: "sealed child" },
        });
        const sealed = createSeal(dsObject, ["sealedProp"]);

        expect(() => {
            sealed.sealedProp = "disallowed";
        }).toThrow(/Cannot set value on sealed property/);

        expect(() => {
            sealed.child.sealedProp = "disallowed";
        }).toThrow(/Cannot set value on sealed property/);
    });

    it("prohibits modifications to path-specified sealed props in root object", () => {
        const dsObject = deepSignal({
            sealedPropAtRoot: "sealed root",
            nonSealedRootProp: "non sealed",
            child: { sealedPropAtRoot: "sealed child" },
        });
        const sealed = createSeal(dsObject, [["sealedPropAtRoot"]]);

        expect(() => {
            sealed.sealedPropAtRoot = "disallowed";
        }).toThrow(/Cannot set value on sealed property/);

        expect(() => {
            sealed.nonSealedRootProp = "allowedRoot";
            sealed.child.sealedPropAtRoot = "allowedChild";
        }).not.toThrow();

        expect(dsObject).toEqual({
            sealedPropAtRoot: "sealed root",
            nonSealedRootProp: "allowedRoot",
            child: { sealedPropAtRoot: "allowedChild" },
        });
    });

    it("prohibits modifications to path-scoped props", () => {
        const dsObject = deepSignal({
            sealedPropAtRoot: "sealed root",
            nonSealedRootProp: "non sealed",
            child: {
                sealedPropAtChild: "sealed child",
                nonSealedPropAtChild: "non sealed child",
                childChild: {
                    nonSealedPropAtChildChild: "non-sealed child child",
                    sealedPropAtChildChild: "sealed child child",
                },
            },
        });
        const sealed = createSeal(dsObject, [
            ["sealedPropAtRoot"],
            ["child", "sealedPropAtChild"],
            ["child", "childChild", "sealedPropAtChildChild"],
        ]);

        expect(() => {
            sealed.sealedPropAtRoot = "disallowed";
        }).toThrow(/Cannot set value on sealed property/);
        expect(() => {
            sealed.child.sealedPropAtChild = "disallowed";
        }).toThrow(/Cannot set value on sealed property/);
        expect(() => {
            sealed.child.childChild.sealedPropAtChildChild = "disallowed";
        }).toThrow(/Cannot set value on sealed property/);

        expect(() => {
            sealed.nonSealedRootProp = "allowedRoot";
            sealed.child.nonSealedPropAtChild = "allowedChild";
            sealed.child.childChild.nonSealedPropAtChildChild =
                "allowedChildChild";
        }).not.toThrow();

        expect(dsObject).toEqual({
            sealedPropAtRoot: "sealed root",
            nonSealedRootProp: "allowedRoot",
            child: {
                sealedPropAtChild: "sealed child",
                nonSealedPropAtChild: "allowedChild",
                childChild: {
                    nonSealedPropAtChildChild: "allowedChildChild",
                    sealedPropAtChildChild: "sealed child child",
                },
            },
        });
    });

    it("prohibits modifications to nested sealed props", () => {
        const dsObject = deepSignal({
            "@id": "did:ng:z:t3",
            child: { childKey: "k1" },
        });
        const sealed = createSeal(dsObject, ["child"]);

        expect(() => {
            sealed.child = { childKey: "disallowed object assigned" };
        }).toThrow(/Cannot set value on sealed property/);

        expect(() => {
            sealed.child.childKey = "disallowed nested property assigned";
        }).toThrow(/Cannot set value on sealed property/);
    });

    it("prohibits modifications on arrays", () => {
        const dsObject = deepSignal({
            writableProp: "some val",
            sealedArray: [1, 2, 3],
        });
        const sealed = createSeal(dsObject, ["sealedArray"]);

        expect(() => {
            sealed.sealedArray = [1];
        }).toThrow(/Cannot set value on sealed property/);

        expect(() => {
            sealed.sealedArray.push(2);
        }).toThrow(
            /Arrays of sealed deep signal objects only expose non-mutating functions./
        );

        expect(() => {
            sealed.sealedArray.splice(1, 1);
        }).toThrow(
            /Arrays of sealed deep signal objects only expose non-mutating functions./
        );

        expect(() => {
            sealed.sealedArray.length = 0;
        }).toThrow(/Cannot set value on sealed property/);

        expect(sealed.sealedArray.map((v) => v + 1)).toEqual([2, 3, 4]);
        // Need to destructure for vitest to be happy.
        expect([...sealed.sealedArray]).toEqual([1, 2, 3]);
    });

    it("prohibits modifications on sets", () => {
        const dsObject = deepSignal({
            writableProp: "some val",
            sealedSet: new Set([1, 2, 3]),
        });
        const sealed = createSeal(dsObject, ["sealedSet"]);

        expect(() => {
            // @ts-ignore
            sealed.sealedSet = new Set();
        }).toThrow(/Cannot set value on sealed property/);

        expect(() => {
            sealed.sealedSet.add(2);
        }).toThrow(
            /Sets of sealed deep signal objects only expose non-mutating functions./
        );

        expect(() => {
            sealed.sealedSet.clear();
        }).toThrow(
            /Sets of sealed deep signal objects only expose non-mutating functions./
        );

        expect(sealed.sealedSet.map((v) => v + 1).toArray()).toEqual([2, 3, 4]);
        // Need to destructure for vitest to be happy.
        expect([...sealed.sealedSet]).toEqual([1, 2, 3]);
    });
    it("triggers effect on modifications", () => {
        const dsObject = deepSignal({
            sealedPropAtRoot: "sealed root",
            nonSealedRootProp: "non sealed",
            child: {
                sealedPropAtChild: "sealed child",
                nonSealedPropAtChild: "non sealed child",
            },
        });
        const sealed = createSeal(dsObject, [
            ["sealedPropAtRoot"],
            ["child", "sealedPropAtChild"],
        ]);

        // Listen to sealed object; dsObject modifies.
        let callCounter = 0;
        let disposeEffect = effect(() => {
            // Trigger listening effect on this prop.
            const _sealedVal = sealed.sealedPropAtRoot;
            callCounter += 1;
        });
        dsObject.sealedPropAtRoot =
            "Listen to sealed object; dsObject modifies";
        expect(callCounter).toBe(2);
        disposeEffect();

        // Listen to sealed object; seal modifies.
        callCounter = 0;
        disposeEffect = effect(() => {
            // Trigger listening to effect on this prop.
            const _sealedVal = sealed.nonSealedRootProp;
            callCounter += 1;
        });
        sealed.nonSealedRootProp = "Listen to sealed object; seal modifies";
        expect(callCounter).toBe(2);
        disposeEffect();

        // Listen to dsObject; seal modifies.
        callCounter = 0;
        disposeEffect = effect(() => {
            // Trigger listening to effect on this prop.
            const _sealedVal = dsObject.nonSealedRootProp;
            callCounter += 1;
        });
        sealed.nonSealedRootProp = "Listen to dsObject; seal modifies";
        expect(callCounter).toBe(2);
        disposeEffect();

        // Nested objects

        // Listen to sealed object; dsObject modifies.
        callCounter = 0;
        disposeEffect = effect(() => {
            // Trigger listening effect on this prop.
            const _sealedVal = sealed.child.sealedPropAtChild;
            callCounter += 1;
        });
        dsObject.child.sealedPropAtChild =
            "Listen to sealed object; dsObject modifies";
        expect(callCounter).toBe(2);
        disposeEffect();

        // Listen to sealed object; seal modifies.
        callCounter = 0;
        disposeEffect = effect(() => {
            // Trigger listening to effect on this prop.
            const _sealedVal = sealed.child.nonSealedPropAtChild;
            callCounter += 1;
        });
        sealed.child.nonSealedPropAtChild =
            "Listen to sealed object; seal modifies";
        expect(callCounter).toBe(2);
        disposeEffect();

        // Listen to dsObject; seal modifies.
        callCounter = 0;
        disposeEffect = effect(() => {
            // Trigger listening to effect on this prop.
            const _sealedVal = dsObject.child.nonSealedPropAtChild;
            callCounter += 1;
        });
        sealed.child.nonSealedPropAtChild = "Listen to dsObject; seal modifies";
        expect(callCounter).toBe(2);
        disposeEffect();
    });

    it("triggers computed on modifications", () => {
        const dsObject = deepSignal({
            sealedPropAtRoot: "sealed root",
            nonSealedRootProp: "non sealed",
        });
        const sealed = createSeal(dsObject, [
            ["sealedPropAtRoot"],
            ["child", "sealedPropAtChild"],
        ]);

        // Listen to sealed object; dsObject modifies.
        let computedValue: () => string;
        computedValue = computed(() => {
            return sealed.sealedPropAtRoot + ", computed";
        });
        dsObject.sealedPropAtRoot =
            "Listen to sealed object; dsObject modifies";
        expect(computedValue()).toBe(
            "Listen to sealed object; dsObject modifies, computed"
        );

        // Listen to sealed object; seal modifies.
        computedValue = computed(() => {
            return sealed.nonSealedRootProp + ", computed";
        });
        sealed.nonSealedRootProp = "modified by sealed";
        expect(computedValue()).toBe("modified by sealed, computed");

        // Listen to dsObject; seal modifies.
        computedValue = computed(() => {
            return dsObject.nonSealedRootProp + ", computed";
        });
        sealed.nonSealedRootProp = "Listen to dsObject; seal modifies";
        expect(computedValue()).toBe(
            "Listen to dsObject; seal modifies, computed"
        );
    });

    // // Not supported currently.
    //
    // it("supports multiple sealed versions of an object", () => {
    //     const dsObject = deepSignal({
    //         sealedPropAtRoot: "sealed root",
    //         nonSealedRootProp: "non sealed",
    //         child: {
    //             sealedPropAtChild: "sealed child",
    //             nonSealedPropAtChild: "non sealed child",
    //             childChild: {
    //                 nonSealedPropAtChildChild: "non-sealed child child",
    //                 sealedPropAtChildChild: "sealed child child",
    //                 sealedPropAtChild: "sealed child in child child",
    //                 sealedForSealChild1: "modify me with seal1",
    //             },
    //         },
    //     });

    //     const parentSeal = createSeal(dsObject, [
    //         ["sealedPropAtRoot"],
    //         ["child", "sealedPropAtChild"],
    //         ["child", "childChild", "sealedPropAtChildChild"],
    //     ]);

    //     const childSeal = createSeal(dsObject.child, [
    //         "sealedPropAtChild",
    //         ["childChild", "sealedForSealChild1"],
    //     ]);

    //     expect(() => {
    //         parentSeal.sealedPropAtRoot = "disallowed";
    //     }).toThrow(/Cannot set value on sealed property/);
    //     expect(() => {
    //         parentSeal.child.sealedPropAtChild = "disallowed";
    //     }).toThrow(/Cannot set value on sealed property/);
    //     expect(() => {
    //         parentSeal.child.childChild.sealedPropAtChildChild = "disallowed";
    //     }).toThrow(/Cannot set value on sealed property/);

    //     expect(() => {
    //         parentSeal.nonSealedRootProp = "allowedRoot";
    //         parentSeal.child.nonSealedPropAtChild = "allowedChild";
    //         parentSeal.child.childChild.nonSealedPropAtChildChild =
    //             "allowedChildChild";
    //     }).not.toThrow();

    //     expect(() => {
    //         childSeal.childChild.sealedForSealChild1 = "disallowed";
    //     }).toThrow(/Cannot set value on sealed property/);

    //     expect(() => {
    //         childSeal.childChild.sealedPropAtChild = "disallowed";
    //     }).toThrow(/Cannot set value on sealed property/);

    //     expect(() => {
    //         childSeal.sealedPropAtChild = "disallowed";
    //     }).toThrow(/Cannot set value on sealed property/);

    //     expect(() => {
    //         childSeal.childChild.sealedPropAtChildChild =
    //             "modified by childSeal";
    //     }).not.toThrow();
    // });

    // effect
    // derived
});
