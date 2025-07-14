import BigNumber from "../../bignumber"
import constant from "./constant"

export default (eps?: number) => {
    const almostEqual = eps ? (a: BigNumber, b: BigNumber) =>
        b.minus(a).abs().isLessThanOrEqualTo(eps)
        : constant(false)

    return (a: BigNumber, b: BigNumber) => {
        if (almostEqual(a, b)) return 0

        return a.comparedTo(b)
    }
}