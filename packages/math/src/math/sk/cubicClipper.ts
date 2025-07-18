import { Point } from "./point";
import { Ref } from "./util";
import { SkScalarInterp, SK_Scalar1, SkScalarAbs } from './scalar'
const NEWTON_RAPHSON = false
function ChopMonoAtY(pts: Point[], y: number, t: Ref<number>) {
    let ycrv = new Array(4).fill(0)
    ycrv[0] = pts[0].y - y;
    ycrv[1] = pts[1].y - y;
    ycrv[2] = pts[2].y - y;
    ycrv[3] = pts[3].y - y;

    if (NEWTON_RAPHSON) {   // Quadratic convergence, typically <= 3 iterations.
        // Initial guess.
        // TODO(turk): Check for zero denominator? Shouldn't happen unless the curve
        // is not only monotonic but degenerate.
        let t1 = ycrv[0] / (ycrv[0] - ycrv[3]);

        // Newton's iterations.
        const tol = SK_Scalar1 / 16384;  // This leaves 2 fixed noise bits.
        let t0 = 0;
        const maxiters = 5;
        let iters = 0;
        let converged;
        do {
            t0 = t1;
            let y01 = SkScalarInterp(ycrv[0], ycrv[1], t0);
            let y12 = SkScalarInterp(ycrv[1], ycrv[2], t0);
            let y23 = SkScalarInterp(ycrv[2], ycrv[3], t0);
            let y012 = SkScalarInterp(y01, y12, t0);
            let y123 = SkScalarInterp(y12, y23, t0);
            let y0123 = SkScalarInterp(y012, y123, t0);
            let yder = (y123 - y012) * 3;
            // TODO(turk): check for yder==0: horizontal.
            t1 -= y0123 / yder;
            converged = SkScalarAbs(t1 - t0) <= tol;  // NaN-safe
            ++iters;
        } while (!converged && (iters < maxiters));
        t.value = t1;                  // Return the result.

        // The result might be valid, even if outside of the range [0, 1], but
        // we never evaluate a Bezier outside this interval, so we return false.
        if (t1 < 0 || t1 > SK_Scalar1)
            return false;         // This shouldn't happen, but check anyway.
        return converged;

        // BISECTION    // Linear convergence, typically 16 iterations.
    } else {
        // Check that the endpoints straddle zero.
        let tNeg = 0, tPos = 0;    // Negative and positive function parameters.
        if (ycrv[0] < 0) {
            if (ycrv[3] < 0)
                return false;
            tNeg = 0;
            tPos = SK_Scalar1;
        } else if (ycrv[0] > 0) {
            if (ycrv[3] > 0)
                return false;
            tNeg = SK_Scalar1;
            tPos = 0;
        } else {
            t.value = 0;
            return true;
        }

        const tol = SK_Scalar1 / 65536;  // 1 for fixed, 1e-5 for float.
        do {
            let tMid = (tPos + tNeg) / 2;
            let y01 = SkScalarInterp(ycrv[0], ycrv[1], tMid);
            let y12 = SkScalarInterp(ycrv[1], ycrv[2], tMid);
            let y23 = SkScalarInterp(ycrv[2], ycrv[3], tMid);
            let y012 = SkScalarInterp(y01, y12, tMid);
            let y123 = SkScalarInterp(y12, y23, tMid);
            let y0123 = SkScalarInterp(y012, y123, tMid);
            if (y0123 == 0) {
                t.value = tMid;
                return true;
            }
            if (y0123 < 0) tNeg = tMid;
            else tPos = tMid;
        } while (!(SkScalarAbs(tPos - tNeg) <= tol));   // Nan-safe

        t.value = (tNeg + tPos) / 2;
        return true;
    }
}

export {
    ChopMonoAtY
}