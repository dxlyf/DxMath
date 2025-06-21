import { SkQuads } from "./quads";
import { clamp, PointerArray, sk_double_nearly_zero, sk_doubles_nearly_equal_ulps, sk_ieee_double_divide } from "./util";


export const PI = 3.141592653589793;
export function nearly_equal(x: number, y: number) {
    if (sk_double_nearly_zero(x)) {
        return sk_double_nearly_zero(y);
    }
    return sk_doubles_nearly_equal_ulps(x, y, 0);
}

function approximately_zero(x: number) {
    // This cutoff for our binary search hopefully strikes a good balance between
    // performance and accuracy.
    return Math.abs(x) < 0.00000001;
}

function find_extrema_valid_t(A: number, B: number, C: number,t:number[]) {
// To find the local min and max of a cubic, we take the derivative and
// solve when that is equal to 0.
// d/dt (A*t^3 + B*t^2 + C*t + D) = 3A*t^2 + 2B*t + C
let roots =[0, 0];
let numRoots = SkQuads.RootsReal(3 * A, 2 * B, C, roots);
let validRoots = 0;
    for (let i = 0; i < numRoots; i++) {
        let tValue = roots[i];
        if (tValue >= 0 && tValue <= 1.0) {
            t[validRoots++] = tValue;
        }
    }
    return validRoots;
}

function binary_search(A: number, B: number, C: number, D: number, start: number, stop: number) {

    let left = SkCubics.EvalAt(A, B, C, D, start);
    if (approximately_zero(left)) {
        return start;
    }
    let right = SkCubics.EvalAt(A, B, C, D, stop);
    if (!Number.isFinite(left) || !Number.isFinite(right)) {
        return -1; // Not going to deal with one or more endpoints being non-finite.
    }
    if ((left > 0 && right > 0) || (left < 0 && right < 0)) {
        return -1; // We can only have a root if one is above 0 and the other is below 0.
    }

    let maxIterations = 1000; // prevent infinite loop
    for (let i = 0; i < maxIterations; i++) {
        let step = (start + stop) / 2;
        let curr = SkCubics.EvalAt(A, B, C, D, step);
        if (approximately_zero(curr)) {
            return step;
        }
        if ((curr < 0 && left < 0) || (curr > 0 && left > 0)) {
            // go right
            start = step;
        } else {
            // go left
            stop = step;
        }
    }
    return -1;
}

// When the A coefficient of a cubic is close to 0, there can be floating point error
// that arises from computing a very large root. In those cases, we would rather be
// precise about the smaller 2 roots, so we have this arbitrary cutoff for when A is
// really small or small compared to B.
function close_to_a_quadratic(A: number, B: number) {
    if (sk_double_nearly_zero(B)) {
        return sk_double_nearly_zero(A);
    }
    return Math.abs(A / B) < 1.0e-7;
}
export class SkCubics {
    /**
 * Puts up to 3 real solutions to the equation
 *   A*t^3 + B*t^2 + C*t + d = 0
 * in the provided array and returns how many roots that was.
 */
    static RootsReal(A: number, B: number, C: number, D: number, solution: number[]) {
        if (close_to_a_quadratic(A, B)) {
            return SkQuads.RootsReal(B, C, D, solution);
        }
        if (sk_double_nearly_zero(D)) {  // 0 is one root
            let num = SkQuads.RootsReal(A, B, C, solution);
            for (let i = 0; i < num; ++i) {
                if (sk_double_nearly_zero(solution[i])) {
                    return num;
                }
            }
            solution[num++] = 0;
            return num;
        }
        if (sk_double_nearly_zero(A + B + C + D)) {  // 1 is one root
            let num = SkQuads.RootsReal(A, A + B, -D, solution);
            for (let i = 0; i < num; ++i) {
                if (sk_doubles_nearly_equal_ulps(solution[i], 1)) {
                    return num;
                }
            }
            solution[num++] = 1;
            return num;
        }
        let a, b, c;
        {
            // If A is zero (e.g. B was nan and thus close_to_a_quadratic was false), we will
            // temporarily have infinities rolling about, but will catch that when checking
            // R2MinusQ3.
            let invA = sk_ieee_double_divide(1, A);
            a = B * invA;
            b = C * invA;
            c = D * invA;
        }
        let a2 = a * a;
        let Q = (a2 - b * 3) / 9;
        let R = (2 * a2 * a - 9 * a * b + 27 * c) / 54;
        let R2 = R * R;
        let Q3 = Q * Q * Q;
        let R2MinusQ3 = R2 - Q3;
        // If one of R2 Q3 is infinite or nan, subtracting them will also be infinite/nan.
        // If both are infinite or nan, the subtraction will be nan.
        // In either case, we have no finite roots.
        if (!Number.isFinite(R2MinusQ3)) {
            return 0;
        }
        let adiv3 = a / 3;
        let r;
        let roots = PointerArray.from(solution);
        if (R2MinusQ3 < 0) {   // we have 3 real roots
            // the divide/root can, due to finite precisions, be slightly outside of -1...1
            const theta = Math.acos(clamp(R / Math.sqrt(Q3), -1., 1.));
            const neg2RootQ = -2 * Math.sqrt(Q);

            r = neg2RootQ * Math.cos(theta / 3) - adiv3;

            roots.value = r
            roots.next()

            r = neg2RootQ * Math.cos((theta + 2 * PI) / 3) - adiv3;
            if (!nearly_equal(solution[0], r)) {
                roots.value = r
                roots.next()
            }
            r = neg2RootQ * Math.cos((theta - 2 * PI) / 3) - adiv3;
            if (!nearly_equal(solution[0], r) &&
                (roots.curIndex == 1 || !nearly_equal(solution[1], r))) {
                roots.value = r
                roots.next()
            }
        } else {  // we have 1 real root
            const sqrtR2MinusQ3 = Math.sqrt(R2MinusQ3);
            A = Math.abs(R) + sqrtR2MinusQ3;
            A = Math.cbrt(A); // cube root
            if (R > 0) {
                A = -A;
            }
            if (!sk_double_nearly_zero(A)) {
                A += Q / A;
            }
            r = A - adiv3;
            roots.value = r
            roots.next()
            if (!sk_double_nearly_zero(R2) &&
                sk_doubles_nearly_equal_ulps(R2, Q3)) {
                r = -A / 2 - adiv3;
                if (!nearly_equal(solution[0], r)) {
                    roots.value = r
                    roots.next()
                }
            }
        }
        return roots.curIndex;
    }

    /**
    * Puts up to 3 real solutions to the equation
    *   A*t^3 + B*t^2 + C*t + D = 0
    * in the provided array, with the constraint that t is in the range [0.0, 1.0],
    * and returns how many roots that was.
    */
    static RootsValidT(A: number, B: number, C: number, D: number, solution: number[]) {
        let allRoots = [0, 0, 0];
        let realRoots = SkCubics.RootsReal(A, B, C, D, allRoots);
        let foundRoots = 0;
        for (let index = 0; index < realRoots; ++index) {
            let tValue = allRoots[index];
            if (tValue >= 1.0 && tValue <= 1.00005) {
                // Make sure we do not already have 1 (or something very close) in the list of roots.
                if ((foundRoots < 1 || !sk_doubles_nearly_equal_ulps(solution[0], 1)) &&
                    (foundRoots < 2 || !sk_doubles_nearly_equal_ulps(solution[1], 1))) {
                    solution[foundRoots++] = 1;
                }
            } else if (tValue >= -0.00005 && (tValue <= 0.0 || sk_double_nearly_zero(tValue))) {
                // Make sure we do not already have 0 (or something very close) in the list of roots.
                if ((foundRoots < 1 || !sk_double_nearly_zero(solution[0])) &&
                    (foundRoots < 2 || !sk_double_nearly_zero(solution[1]))) {
                    solution[foundRoots++] = 0;
                }
            } else if (tValue > 0.0 && tValue < 1.0) {
                solution[foundRoots++] = tValue;
            }
        }
        return foundRoots;
    }


    /**
    * Puts up to 3 real solutions to the equation
    *   A*t^3 + B*t^2 + C*t + D = 0
    * in the provided array, with the constraint that t is in the range [0.0, 1.0],
    * and returns how many roots that was.
    * This is a slower method than RootsValidT, but more accurate in circumstances
    * where floating point error gets too big.
    */
    static BinarySearchRootsValidT(A: number, B: number, C: number, D: number, solution: number[]) {
        if (!Number.isFinite(A) || !Number.isFinite(B) || !Number.isFinite(C) || !Number.isFinite(D)) {
            return 0;
        }
        let regions = [0,0,0,1];
        // Find local minima and maxima
        let minMax = [0,0];
        let extremaCount = find_extrema_valid_t(A, B, C, minMax);
        let startIndex = 2 - extremaCount;
        if (extremaCount == 1) {
            regions[startIndex + 1] = minMax[0];
        }
        if (extremaCount == 2) {
            // While the roots will be in the range 0 to 1 inclusive, they might not be sorted.
            regions[startIndex + 1] = Math.min(minMax[0], minMax[1]);
            regions[startIndex + 2] = Math.max(minMax[0], minMax[1]);
        }
        // Starting at regions[startIndex] and going up through regions[3], we have
        // an ascending list of numbers in the range 0 to 1.0, between which are the possible
        // locations of a root.
        let foundRoots = 0;
        for (;startIndex < 3; startIndex++) {
            let root = binary_search(A, B, C, D, regions[startIndex], regions[startIndex + 1]);
            if (root >= 0) {
                // Check for duplicates
                if ((foundRoots < 1 || !approximately_zero(solution[0] - root)) &&
                    (foundRoots < 2 || !approximately_zero(solution[1] - root))) {
                    solution[foundRoots++] = root;
                }
            }
        }
        return foundRoots;
    }

    /**
    * Evaluates the cubic function with the 4 provided coefficients and the
    * provided variable.
    */
    static EvalAt(A: number, B: number, C: number, D: number, t: number) {
        return A * t * t * t +
            B * t * t +
            C * t +
            D;
    }

    static EvalAt_2(coefficients: number[], t: number) {
        return this.EvalAt(coefficients[0], coefficients[1], coefficients[2], coefficients[3], t);
    }
}