import compare from "./compare";
import orient from "./orient";
import snap from "./snap";

const set = (eps?: number) => {
    return {
        set: (eps?: number) => { precision = set(eps) },
        reset: () => set(eps),
        compare: compare(eps),
        snap: snap(eps),
        orient: orient(eps)
    }
}

export let precision: ReturnType<typeof set> = set()