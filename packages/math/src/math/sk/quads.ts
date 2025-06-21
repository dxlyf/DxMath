// When the A coefficient of a quadratic is close to 0, there can be floating point error
// that arises from computing a very large root. In those cases, we would rather be
// precise about the one smaller root, so we have this arbitrary cutoff for when A is

import { sk_double_nearly_zero, sk_doubles_nearly_equal_ulps, sk_ieee_double_divide } from "./util";

// really small or small compared to B.
function close_to_linear(A: number, B: number) {
    if (sk_double_nearly_zero(B)) {
        return sk_double_nearly_zero(A);
    }
    // This is a different threshold (tighter) than the close_to_a_quadratic in SkCubics.cpp
    // because the SkQuads::RootsReal gives better answers for longer as A/B -> 0.
    return Math.abs(A / B) < 1.0e-16;
}
// Solve 0 = M * x + B. If M is 0, there are no solutions, unless B is also 0,
// in which case there are infinite solutions, so we just return 1 of them.
function solve_linear( M:number,B:number, solution:number[]) {
    if (sk_double_nearly_zero(M)) {
        solution[0] = 0;
        if (sk_double_nearly_zero(B)) {
            return 1;
        }
        return 0;
    }
    solution[0] = -B / M;
    if (!Number.isFinite(solution[0])) {
        return 0;
    }
    return 1;
}

/**
 * Utilities for dealing with quadratic formulas with one variable:
 *   f(t) = A*t^2 + B*t + C
 */
export class SkQuads {
    /**
     * Puts up to 2 real solutions to the equation
     *   A*t^2 + B*t + C = 0
     * in the provided array.
     */
    static RootsReal(A: number, B: number, C: number, solution: number[]) {
        if (close_to_linear(A, B)) {
            return solve_linear(B, C, solution);
        }
        // If A is zero (e.g. B was nan and thus close_to_linear was false), we will
        // temporarily have infinities rolling about, but will catch that when checking
        // p2 - q.
        const  p = sk_ieee_double_divide(B, 2 * A);
        const  q = sk_ieee_double_divide(C, A);
        /* normal form: x^2 + px + q = 0 */
        const  p2 = p * p;
        if (!Number.isFinite(p2 - q) ||
            (!sk_double_nearly_zero(p2 - q) && p2 < q)) {
            return 0;
        }
        let sqrt_D = 0;
        if (p2 > q) {
            sqrt_D = Math.sqrt(p2 - q);
        }
        solution[0] = sqrt_D - p;
        solution[1] = -sqrt_D - p;
        if (sk_double_nearly_zero(sqrt_D) ||
            sk_doubles_nearly_equal_ulps(solution[0], solution[1])) {
            return 1;
        }
        return 2;
    }

    /**
     * Evaluates the quadratic function with the 3 provided coefficients and the
     * provided variable.
     */
    static EvalAt(A: number, B: number, C: number, t: number) {
        return A * t * t +
            B * t +
            C;
    }
};

