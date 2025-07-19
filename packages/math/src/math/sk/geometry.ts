
// 转换成js 

import { Point, Point3D } from "./point";
import { FloatPoint, Ref, PointerArray, sqrt, fabs, swap, sk_ieee_float_divide, min, max, clamp, lerp, sk_double_to_float, sk_ieee_double_divide } from "./util";
import { SkScalarIsNaN, SkScalarCos, SkScalarSqrt, SkScalarACos, SkScalarInvert, SkScalarNearlyZero, SkScalarPow, SkDoubleToScalar, SK_ScalarPI, SkScalarIsFinite, SkScalarAbs, SkScalarInterp, SkScalarsAreFinite, SK_ScalarHalf, SK_Scalar1, SkScalarLog2, SkScalarCeilToInt, SK_ScalarNearlyZero, SK_ScalarRoot2Over2 } from './scalar'
import { SkBezierCubic } from "./bezier_cubic";
import { SkCubics } from "./cubics";
import { Rect } from "./rect";
import { Matrix } from "./matrix";

export const kMaxConicToQuadPOW2 = 5
export const  kMaxConicsForArc = 5
export enum SkCubicType {
    kSerpentine,
    kLoop,
    kLocalCusp,       // Cusp at a non-infinite parameter value with an inflection at t=infinity.
    kCuspAtInfinity,  // Cusp with a cusp at t=infinity and a local inflection.
    kQuadratic,
    kLineOrPoint
};
export enum SkRotationDirection {
    kCW_SkRotationDirection,
    kCCW_SkRotationDirection
};


function from_point(point: Point): FloatPoint {
    return FloatPoint.fromPoint(point)
}

function to_point(x: FloatPoint): Point {
    let point = Point.default();
    x.storePoint(point);
    return point;
}
function times_2(value: FloatPoint): FloatPoint {
    return value.clone().add(value);
}

function subdivide_w_value(w: number) {
    return SkScalarSqrt(SK_ScalarHalf + w * SK_ScalarHalf);
}
function is_not_monotonic(a: number, b: number, c: number): number {
    let ab = a - b;
    let bc = b - c;
    if (ab < 0) {
        bc = -bc;
    }
    return Number(ab == 0 || bc < 0);
}


function valid_unit_divide(numer: number, denom: number, ratio: PointerArray<number>): number {

    if (numer < 0) {
        numer = -numer;
        denom = -denom;
    }

    if (denom == 0 || numer == 0 || numer >= denom) {
        return 0;
    }

    let r = numer / denom;
    if (SkScalarIsNaN(r)) {
        return 0;
    }

    if (r == 0) { // catch underflow if numer <<<< denom
        return 0;
    }
    ratio.value = r;
    return 1;
}
// Just returns its argument, but makes it easy to set a break-point to know when
// SkFindUnitQuadRoots is going to return 0 (an error).
function return_check_zero(value: number): number {
    if (value == 0) {
        return 0;
    }
    return value;
}
/** Given a quadratic equation Ax^2 + Bx + C = 0, return 0, 1, 2 roots for the
    equation.
*/

/** From Numerical Recipes in C.

    Q = -1/2 (B + sign(B) sqrt[B*B - 4*A*C])
    x1 = Q / A
    x2 = C / Q
*/
function SkFindUnitQuadRoots(A: number, B: number, C: number, roots: PointerArray<number>): number {

    if (A == 0) {
        return return_check_zero(valid_unit_divide(-C, B, roots));
    }

    let r = roots.clone();

    // use doubles so we don't overflow temporarily trying to compute R
    let dr = B * B - 4 * A * C;
    if (dr < 0) {
        return return_check_zero(0);
    }
    dr = sqrt(dr);
    let R = SkDoubleToScalar(dr);
    if (!SkScalarIsFinite(R)) {
        return return_check_zero(0);
    }

    let Q = (B < 0) ? -(B - R) / 2 : -(B + R) / 2;
    r.curIndex += valid_unit_divide(Q, A, r);
    r.curIndex += valid_unit_divide(C, Q, r);
    if (r.curIndex - roots.curIndex == 2) {
        if (roots.get(0) > roots.get(1)) {
            let tmp = roots.get(0)
            roots.set(0, roots.get(1))
            roots.set(1, tmp)

        } else if (roots.get(0) == roots.get(1)) { // nearly-equal?
            r.curIndex -= 1; // skip the double root
        }
    }
    return return_check_zero((r.curIndex - roots.curIndex));
}

function SkEvalQuadAt(src: Point[], t: number, pt?: Point, tangent?: Point): Point | undefined {

    if (pt) {
        pt.copy(SkEvalQuadAt(src, t) as Point);
    }
    if (tangent) {
        tangent.copy(SkEvalQuadTangentAt(src, t));
    }
    if (!pt) {
        return to_point(new SkQuadCoeff(src).eval(FloatPoint.splat(t)));
    }
}

function SkEvalQuadTangentAt(src: Point[], t: number): Point {
    // The derivative equation is 2(b - a +(a - 2b +c)t). This returns a
    // zero tangent vector when t is 0 or 1, and the control point is equal
    // to the end point. In this case, use the quad end points to compute the tangent.
    if ((t == 0 && src[0] == src[1]) || (t == 1 && src[1] == src[2])) {
        return src[2].clone().subtract(src[0]);
    }

    let P0 = from_point(src[0]);
    let P1 = from_point(src[1]);
    let P2 = from_point(src[2]);

    let B = P1.clone().sub(P0);
    let A = P2.clone().sub(P1).sub(B);
    let T = A.clone().mul(A).add(B);

    return to_point(T.add(T));
}
function interp(v0: FloatPoint, v1: FloatPoint, t: FloatPoint): FloatPoint {
    return v0.clone().lerp(v0, v1, t);
}

function SkChopQuadAt(src: Point[], dst: Point[], t: number) {

    let p0 = from_point(src[0]);
    let p1 = from_point(src[1]);
    let p2 = from_point(src[2]);
    let tt = FloatPoint.splat(t);

    let p01 = interp(p0, p1, tt);
    let p12 = interp(p1, p2, tt);

    dst[0] = to_point(p0);
    dst[1] = to_point(p01);
    dst[2] = to_point(interp(p01, p12, tt));
    dst[3] = to_point(p12);
    dst[4] = to_point(p2);
}
function AreFinite(array: Point[], count: number = array.length) {
    for (let i = 0; i < count; ++i) {
        if (!SkScalarIsFinite(array[i].x) || !SkScalarIsFinite(array[i].y)) {
            return false;
        }
    }

    return true
}

function CanNormalize(dx: number, dy: number) {
    return SkScalarsAreFinite(dx, dy) && (dx || dy);
}
function EqualsWithinTolerance(p1: Point, p2: Point) {
    return !CanNormalize(p1.x - p2.x, p1.y - p2.y);
}
function SkChopQuadAtHalf(src: Point[], dst: Point[]) {
    SkChopQuadAt(src, dst, 0.5);
}

function SkMeasureAngleBetweenVectors(a: Point, b: Point) {
    let cosTheta = sk_ieee_float_divide(a.dot(b), sqrt(a.dot(a) * b.dot(b)));
    // Pin cosTheta such that if it is NaN (e.g., if a or b was 0), then we return acos(1) = 0.
    cosTheta = clamp(cosTheta, -1, 1)
    return Math.acos(cosTheta);
}

/**返回一个新的、任意缩放的向量，将给定的向量平分。返回的平分线
将始终指向所提供矢量的内部。
*/
function SkFindBisector(a: Point, b: Point): Point {
    let v = Point.make(2);
    if (a.dot(b) >= 0) {
        // a,b are within +/-90 degrees apart.
        v[0].copy(a)
        v[1].copy(b)
    } else if (a.cross(b) >= 0) {
        // a,b are >90 degrees apart. Find the bisector of their interior normals instead. (Above 90
        // degrees, the original vectors start cancelling each other out which eventually becomes
        // unstable.)
        v[0].set(-a.y, +a.x);
        v[1].set(+b.y, -b.x);
    } else {
        // a,b are <-90 degrees apart. Find the bisector of their interior normals instead. (Below
        // -90 degrees, the original vectors start cancelling each other out which eventually
        // becomes unstable.)
        v[0].set(+a.y, -a.x);
        v[1].set(-b.y, +b.x);
    }
    // Return "normalize(v[0]) + normalize(v[1])".
    let x0_x1 = FloatPoint.fromXY(v[0].x, v[1].x)
    let y0_y1 = FloatPoint.fromXY(v[0].y, v[1].y)

    let invLengths = x0_x1.clone().mul(x0_x1).add(y0_y1.clone().mul(y0_y1)).sqrt().inverse();
    x0_x1.mul(invLengths);
    y0_y1.mul(invLengths);
    return Point.create(x0_x1[0] + x0_x1[1], y0_y1[0] + y0_y1[1]);
}

function SkFindQuadMidTangent(src: Point[]): number {
    // Tangents point in the direction of increasing T, so tan0 and -tan1 both point toward the
    // midtangent. The bisector of tan0 and -tan1 is orthogonal to the midtangent:
    //
    //     n dot midtangent = 0
    //
    let tan0 = src[1].clone().subtract(src[0]);
    let tan1 = src[2].clone().subtract(src[1]);
    let bisector = SkFindBisector(tan0, tan1.clone().negate());

    // The midtangent can be found where (F' dot bisector) = 0:
    //
    //   0 = (F'(T) dot bisector) = |2*T 1| * |p0 - 2*p1 + p2| * |bisector.x|
    //                                        |-2*p0 + 2*p1  |   |bisector.y|
    //
    //                     = |2*T 1| * |tan1 - tan0| * |nx|
    //                                 |2*tan0     |   |ny|
    //
    //                     = 2*T * ((tan1 - tan0) dot bisector) + (2*tan0 dot bisector)
    //
    //   T = (tan0 dot bisector) / ((tan0 - tan1) dot bisector)
    let T = sk_ieee_float_divide(tan0.dot(bisector), (tan0.clone().subtract(tan1)).dot(bisector));
    if (!(T > 0 && T < 1)) {  // Use "!(positive_logic)" so T=nan will take this branch.
        T = .5;  // The quadratic was a line or near-line. Just chop at .5.
    }

    return T;
}

/** Quad'(t) = At + B, where
    A = 2(a - 2b + c)
    B = 2(b - a)
    Solve for t, only if it fits between 0 < t < 1
*/
function SkFindQuadExtrema(a: number, b: number, c: number, tValue: number[]): number {
    /*  At + B == 0
        t = -B / A
    */
    return valid_unit_divide(a - b, a - b - b + c, PointerArray.from(tValue));
}

function flatten_double_quad_extrema(coords: PointerArray<Point>, axis: 'x' | 'y' = 'x') {
    coords.get(2)[axis] = coords.get(6)[axis] = coords.get(4)[axis];
}



/*  Returns 0 for 1 quad, and 1 for two quads, either way the answer is
 stored in dst[]. Guarantees that the 1/2 quads will be monotonic.
 */
function SkChopQuadAtYExtrema(src: Point[], dst: Point[]): number {
    let a = src[0].y;
    let b = src[1].y;
    let c = src[2].y;

    if (is_not_monotonic(a, b, c)) {
        let tValue = PointerArray.from([0]);
        if (valid_unit_divide(a - b, a - b - b + c, tValue)) {
            SkChopQuadAt(src, dst, tValue.value);
            flatten_double_quad_extrema(PointerArray.from(dst), 'y');
            return 1;
        }
        // if we get here, we need to force dst to be monotonic, even though
        // we couldn't compute a unit_divide value (probably underflow).
        b = SkScalarAbs(a - b) < SkScalarAbs(b - c) ? a : c;
    }
    dst[0].set(src[0].x, a);
    dst[1].set(src[1].x, b);
    dst[2].set(src[2].x, c);
    return 0;
}

/*  Returns 0 for 1 quad, and 1 for two quads, either way the answer is
    stored in dst[]. Guarantees that the 1/2 quads will be monotonic.
 */
function SkChopQuadAtXExtrema(src: Point[], dst: Point[]): number {

    let a = src[0].x;
    let b = src[1].x;
    let c = src[2].x;

    if (is_not_monotonic(a, b, c)) {
        let tValue = PointerArray.from([0]);
        if (valid_unit_divide(a - b, a - b - b + c, tValue)) {
            SkChopQuadAt(src, dst, tValue.value);
            flatten_double_quad_extrema(PointerArray.from(dst), 'x');
            return 1;
        }
        // if we get here, we need to force dst to be monotonic, even though
        // we couldn't compute a unit_divide value (probably underflow).
        b = SkScalarAbs(a - b) < SkScalarAbs(b - c) ? a : c;
    }
    dst[0].set(a, src[0].y);
    dst[1].set(b, src[1].y);
    dst[2].set(c, src[2].y);
    return 0;
}


//  F(t)    = a (1 - t) ^ 2 + 2 b t (1 - t) + c t ^ 2
//  F'(t)   = 2 (b - a) + 2 (a - 2b + c) t
//  F''(t)  = 2 (a - 2b + c)
//
//  A = 2 (b - a)
//  B = 2 (a - 2b + c)
//
//  Maximum curvature for a quadratic means solving
//  Fx' Fx'' + Fy' Fy'' = 0
//
//  t = - (Ax Bx + Ay By) / (Bx ^ 2 + By ^ 2)
//
function SkFindQuadMaxCurvature(src: Point[]): number {
    let Ax = src[1].x - src[0].x;
    let Ay = src[1].y - src[0].y;
    let Bx = src[0].x - src[1].x - src[1].x + src[2].x;
    let By = src[0].y - src[1].y - src[1].y + src[2].y;

    let numer = -(Ax * Bx + Ay * By);
    let denom = Bx * Bx + By * By;
    if (denom < 0) {
        numer = -numer;
        denom = -denom;
    }
    if (numer <= 0) {
        return 0;
    }
    if (numer >= denom) {  // Also catches denom=0.
        return 1;
    }
    let t = numer / denom;
    return t;
}

function copyPointArray(target: Point[], source: Point[], count: number, start: number = 0) {
    for (let i = 0; i < count; i++) {
        target[start + i].copy(source[i]);
    }
}

function SkChopQuadAtMaxCurvature(src: Point[], dst: Point[]) {
    let t = SkFindQuadMaxCurvature(src);
    if (t > 0 && t < 1) {
        SkChopQuadAt(src, dst, t);
        return 2;
    } else {
        copyPointArray(dst, src, 3);
        return 1;
    }
}

function SkConvertQuadToCubic(src: Point[], dst: Point[]) {
    let scale = (SkDoubleToScalar(2.0 / 3.0));
    let s0 = from_point(src[0]);
    let s1 = from_point(src[1]);
    let s2 = from_point(src[2]);

    dst[0] = to_point(s0);
    dst[1] = to_point((s1.clone().sub(s0)).mulScalar(scale).add(s0));
    dst[2] = to_point((s1.clone().sub(s2)).mulScalar(scale).add(s2));
    dst[3] = to_point(s2);
}


function eval_cubic_derivative(src: Point[], t: number): Point {
    let coeff = SkQuadCoeff.default();
    let P0 = from_point(src[0]);
    let P1 = from_point(src[1]);
    let P2 = from_point(src[2]);
    let P3 = from_point(src[3]);

    coeff.fA = P3.clone().add(P1.clone().sub(P2).mulScalar(3)).sub(P0);
    coeff.fB = times_2(P2.clone().sub(times_2(P1)).add(P0));
    coeff.fC = P1.clone().sub(P0);
    return to_point(coeff.eval(FloatPoint.splat(t)));
}

function eval_cubic_2ndDerivative(src: Point[], t: number): Point {
    let P0 = from_point(src[0]);
    let P1 = from_point(src[1]);
    let P2 = from_point(src[2]);
    let P3 = from_point(src[3]);
    let A = P1.clone().sub(P2).mulScalar(3).add(P3).sub(P0);
    let B = P2.clone().sub(times_2(P1)).add(P0);

    return to_point(A.mulScalar(t).add(B));
}

function SkEvalCubicAt(src: Point[], t: number, loc: Point|null, tangent: Point|null, curvature: Point|null) {

    if (loc) {
        loc.copy(to_point(new SkCubicCoeff(src).eval(FloatPoint.splat(t))))
    }
    if (tangent) {
        // The derivative equation returns a zero tangent vector when t is 0 or 1, and the
        // adjacent control point is equal to the end point. In this case, use the
        // next control point or the end points to compute the tangent.
        if ((t == 0 && src[0] == src[1]) || (t == 1 && src[2] == src[3])) {
            if (t == 0) {
                tangent.subtractVectors(src[2], src[0])
            } else {
                tangent.subtractVectors(src[3], src[1])
            }
            if (!tangent.x && !tangent.y) {
                tangent.subtractVectors(src[3], src[0])
            }
        } else {
            tangent.copy(eval_cubic_derivative(src, t));
        }
    }
    if (curvature) {
        curvature.copy(eval_cubic_2ndDerivative(src, t));
    }
}

/** Cubic'(t) = At^2 + Bt + C, where
A = 3(-a + 3(b - c) + d)
B = 6(a - 2b + c)
C = 3(b - a)
Solve for t, keeping only those that fit betwee 0 < t < 1
*/
function SkFindCubicExtrema(a: number, b: number, c: number, d: number, tValues: number[]) {
    // we divide A,B,C by 3 to simplify
    let A = d - a + 3 * (b - c);
    let B = 2 * (a - b - b + c);
    let C = b - a;
    return SkFindUnitQuadRoots(A, B, C, PointerArray.from(tValues));
}

function unchecked_mix(a: FloatPoint, b: FloatPoint, t: FloatPoint) {
    return a.clone().lerp(a, b, t);
}


function SkChopCubicAt_3(src: Point[], dst: Point[], t: number) {

    if (t == 1) {
        copyPointArray(dst, src, 4)
        dst[4].copy(src[3])
        dst[5].copy(src[3])
        dst[6].copy(src[3])
        return;
    }

    let p0 = from_point(src[0]);
    let p1 = from_point(src[1]);
    let p2 = from_point(src[2]);
    let p3 = from_point(src[3]);
    let T = FloatPoint.splat(t);

    let ab = unchecked_mix(p0, p1, T);
    let bc = unchecked_mix(p1, p2, T);
    let cd = unchecked_mix(p2, p3, T);
    let abc = unchecked_mix(ab, bc, T);
    let bcd = unchecked_mix(bc, cd, T);
    let abcd = unchecked_mix(abc, bcd, T);

    dst[0] = to_point(p0);
    dst[1] = to_point(ab);
    dst[2] = to_point(abc);
    dst[3] = to_point(abcd);
    dst[4] = to_point(bcd);
    dst[5] = to_point(cd);
    dst[6] = to_point(p3);
}


function SkChopCubicAt_4(src: Point[], dst: Point[], t0: number, t1: number) {

    if (t1 == 1) {
        SkChopCubicAt_3(src, dst, t0);
        dst[7].copy(src[3])
        dst[8].copy(src[3])
        dst[9].copy(src[3])
        return;
    }

    // Perform both chops in parallel using 4-lane SIMD.
    let p00 = FloatPoint.make(4), p11 = FloatPoint.make(4), p22 = FloatPoint.make(4), p33 = FloatPoint.make(4), T = FloatPoint.make(4);
    p00.setElements([src[0].x, src[0].y, src[0].x, src[0].y])
    p11.setElements([src[1].x, src[1].y, src[1].x, src[1].y])
    p22.setElements([src[2].x, src[2].y, src[2].x, src[2].y])
    p33.setElements([src[3].x, src[3].y, src[3].x, src[3].y])
    T.setElements([t0, t0, t1, t1])

    let ab = unchecked_mix(p00, p11, T);
    let bc = unchecked_mix(p11, p22, T);
    let cd = unchecked_mix(p22, p33, T);
    let abc = unchecked_mix(ab, bc, T);
    let bcd = unchecked_mix(bc, cd, T);
    let abcd = unchecked_mix(abc, bcd, T);
    let middle = unchecked_mix(abc, bcd, FloatPoint.make(4).setElements([T[2], T[3], T[0], T[1]]))


    dst[0] = Point.create(p00[0], p00[1])
    dst[1] = Point.create(ab[0], ab[1])
    dst[2] = Point.create(abc[0], abc[1])
    dst[3] = Point.create(abcd[0], abcd[1])

    dst[4] = Point.create(middle[0], middle[1])
    dst[5] = Point.create(middle[2], middle[3])

    dst[6] = Point.create(abcd[2], abcd[3])
    dst[7] = Point.create(bcd[2], bcd[3]);
    dst[8] = Point.create(cd[2], cd[3])
    dst[9] = Point.create(p33[2], p33[3])
}


function SkChopCubicAt_5(src: Point[], dst: Point[], tValues: ArrayLike<number>, tCount: number) {

    if (dst) {
        if (tCount == 0) { // nothing to chop
            copyPointArray(dst, src, 4);
        } else {
            let i = 0;
            let dstIndex = 0
            for (; i < tCount - 1; i += 2) {
                // Do two chops at once.
                let tt = FloatPoint.splat(tValues[i]);
                if (i != 0) {
                    let lastT = tValues[i - 1];
                    tt = tt.clone().sub(FloatPoint.splat(lastT)).div(FloatPoint.splat(1 - lastT)).clmap(FloatPoint.splat(0), FloatPoint.splat(1))

                }
                let tmpDist: Point[] = []
                SkChopCubicAt_4(src, tmpDist, tt[0], tt[1]);
                tmpDist.forEach((p, i) => {
                    dst[dstIndex + i] = p
                })
                dstIndex += 6
                src = tmpDist.slice(6)
            }
            if (i < tCount) {
                // Chop the final cubic if there was an odd number of chops.
                let t = tValues[i];
                if (i != 0) {
                    let lastT = tValues[i - 1];
                    t = clamp(sk_ieee_float_divide(t - lastT, 1 - lastT), 0, 1);
                }
                let tmpDist: Point[] = []
                SkChopCubicAt_3(src, tmpDist, t);
                tmpDist.forEach((p, i) => {
                    dst[dstIndex + i] = p
                })
            }
        }
    }
}


function SkChopCubicAtHalf(src: Point[], dst: Point[]) {
    SkChopCubicAt_3(src, dst, 0.5);
}

function SkMeasureNonInflectCubicRotation(pts: Point[]) {
    let a = pts[1].clone().subtract(pts[0]);
    let b = pts[2].clone().subtract(pts[1]);
    let c = pts[3].clone().subtract(pts[2]);
    if (a.isZero()) {
        return SkMeasureAngleBetweenVectors(b, c);
    }
    if (b.isZero()) {
        return SkMeasureAngleBetweenVectors(a, c);
    }
    if (c.isZero()) {
        return SkMeasureAngleBetweenVectors(a, b);
    }
    // Postulate: When no points are colocated and there are no inflection points in T=0..1, the
    // rotation is: 360 degrees, minus the angle [p0,p1,p2], minus the angle [p1,p2,p3].
    return 2 * SK_ScalarPI - SkMeasureAngleBetweenVectors(a, b.clone().negate()) - SkMeasureAngleBetweenVectors(b, c.clone().negate());
}

function fma(f: FloatPoint, m: number, a: FloatPoint): FloatPoint {
    return FloatPoint.make(4).setElements([
        f[0] * m + a[0],
        f[1] * m + a[1],
        f[2] * m + a[2],
        f[3] * m + a[3],
    ]);
}
function copysign(x: number, y: number) {
    return (y >= 0 ? Math.abs(x) : -Math.abs(x));
}

// Finds the root nearest 0.5. Returns 0.5 if the roots are undefined or outside 0..1.
function solve_quadratic_equation_for_midtangent_4(a: number, b: number, c: number, discr: number) {
    // Quadratic formula from Numerical Recipes in C:
    let q = -.5 * (b + copysign(Math.sqrt(discr), b));
    // The roots are q/a and c/q. Pick the midtangent closer to T=.5.
    let _5qa = -.5 * q * a;
    let T = Math.abs(q * q + _5qa) < Math.abs(a * c + _5qa) ? sk_ieee_float_divide(q, a)
        : sk_ieee_float_divide(c, q);
    if (!(T > 0 && T < 1)) {  // Use "!(positive_logic)" so T=NaN will take this branch.
        // Either the curve is a flat line with no rotation or FP precision failed us. Chop at .5.
        T = .5;
    }
    return T;
}

function solve_quadratic_equation_for_midtangent_3(a: number, b: number, c: number) {
    return solve_quadratic_equation_for_midtangent_4(a, b, c, b * b - 4 * a * c);
}

function SkFindCubicMidTangent(src: Point[]): number {
    // Tangents point in the direction of increasing T, so tan0 and -tan1 both point toward the
    // midtangent. The bisector of tan0 and -tan1 is orthogonal to the midtangent:
    //
    //     bisector dot midtangent == 0
    //
    let tan0 = (src[0].equals(src[1])) ? src[2].clone().subtract(src[0]) : src[1].clone().subtract(src[0]);
    let tan1 = (src[2].equals(src[3])) ? src[3].clone().subtract(src[1]) : src[3].clone().subtract(src[2]);
    let bisector = SkFindBisector(tan0, tan1.clone().negate());

    // Find the T value at the midtangent. This is a simple quadratic equation:
    //
    //     midtangent dot bisector == 0, or using a tangent matrix C' in power basis form:
    //
    //                   |C'x  C'y|
    //     |T^2  T  1| * |.    .  | * |bisector.x| == 0
    //                   |.    .  |   |bisector.y|
    //
    // The coeffs for the quadratic equation we need to solve are therefore:  C' * bisector
    const kM: FloatPoint[] = [FloatPoint.fromArray([-1, 2, -1, 0]),
    FloatPoint.fromArray([3, -4, 1, 0]),
    FloatPoint.fromArray([-3, 2, 0, 0])];
    let C_x = fma(kM[0], src[0].x,
        fma(kM[1], src[1].x,
            fma(kM[2], src[2].x, FloatPoint.fromArray([src[3].x, 0, 0, 0]))));
    let C_y = fma(kM[0], src[0].y,
        fma(kM[1], src[1].y,
            fma(kM[2], src[2].y, FloatPoint.fromArray([src[3].y, 0, 0, 0]))));
    let coeffs = C_x.clone().mulScalar(bisector.x).add(C_y.clone().mulScalar(bisector.y));

    // Now solve the quadratic for T.
    let T = 0;
    let a = coeffs[0], b = coeffs[1], c = coeffs[2];
    let discr = b * b - 4 * a * c;
    if (discr > 0) {  // This will only be false if the curve is a line.
        return solve_quadratic_equation_for_midtangent_4(a, b, c, discr);
    } else {
        // This is a 0- or 360-degree flat line. It doesn't have single points of midtangent.
        // (tangent == midtangent at every point on the curve except the cusp points.)
        // Chop in between both cusps instead, if any. There can be up to two cusps on a flat line,
        // both where the tangent is perpendicular to the starting tangent:
        //
        //     tangent dot tan0 == 0
        //
        coeffs = C_x.clone().mulScalar(tan0.x).add(C_y.clone().mulScalar(tan0.y));
        a = coeffs[0];
        b = coeffs[1];
        if (a != 0) {
            // We want the point in between both cusps. The midpoint of:
            //
            //     (-b +/- sqrt(b^2 - 4*a*c)) / (2*a)
            //
            // Is equal to:
            //
            //     -b / (2*a)
            T = -b / (2 * a);
        }
        if (!(T > 0 && T < 1)) {  // Use "!(positive_logic)" so T=NaN will take this branch.
            // Either the curve is a flat line with no rotation or FP precision failed us. Chop at
            // .5.
            T = .5;
        }
        return T;
    }
}

function flatten_double_cubic_extrema(coords: PointerArray<Point>, axis: 'x' | 'y' = 'x') {
    coords.get(4)[axis] = coords.get(8)[axis] = coords.get(6)[axis];
}



/** Given 4 points on a cubic bezier, chop it into 1, 2, 3 beziers such that
    the resulting beziers are monotonic in Y. This is called by the scan
    converter.  Depending on what is returned, dst[] is treated as follows:
    0   dst[0..3] is the original cubic
    1   dst[0..3] and dst[3..6] are the two new cubics
    2   dst[0..3], dst[3..6], dst[6..9] are the three new cubics
    If dst == null, it is ignored and only the count is returned.
*/
function SkChopCubicAtYExtrema(src: Point[], dst: Point[]) {
    let tValues = [0, 0];
    let roots = SkFindCubicExtrema(src[0].y, src[1].y, src[2].y,
        src[3].y, tValues);

    let dstRef = PointerArray.from(dst)
    SkChopCubicAt_5(src, dst, tValues, roots);
    if (dst && roots > 0) {
        // we do some cleanup to ensure our Y extrema are flat
        flatten_double_cubic_extrema(dstRef, 'y');
        if (roots == 2) {
            dstRef.next(3)
            flatten_double_cubic_extrema(dstRef, 'y');
        }
    }
    return roots;
}

function SkChopCubicAtXExtrema(src: Point[], dst: Point[]) {
    let tValues = [0, 0];
    let roots = SkFindCubicExtrema(src[0].x, src[1].x, src[2].x,
        src[3].x, tValues);

    SkChopCubicAt_5(src, dst, tValues, roots);
    let dstRef = PointerArray.from(dst)
    if (dst && roots > 0) {
        // we do some cleanup to ensure our Y extrema are flat
        flatten_double_cubic_extrema(dstRef, 'x');
        if (roots == 2) {
            dstRef.next(3)
            flatten_double_cubic_extrema(dstRef, 'x');
        }
    }
    return roots;
}


/** http://www.faculty.idc.ac.il/arik/quality/appendixA.html

    Inflection means that curvature is zero.
    Curvature is [F' x F''] / [F'^3]
    So we solve F'x X F''y - F'y X F''y == 0
    After some canceling of the cubic term, we get
    A = b - a
    B = c - 2b + a
    C = d - 3c + 3b - a
    (BxCy - ByCx)t^2 + (AxCy - AyCx)t + AxBy - AyBx == 0
*/
function SkFindCubicInflections(src: Point[], tValues: number[]) {
    let Ax = src[1].x - src[0].x;
    let Ay = src[1].y - src[0].y;
    let Bx = src[2].x - 2 * src[1].x + src[0].x;
    let By = src[2].y - 2 * src[1].y + src[0].y;
    let Cx = src[3].x + 3 * (src[1].x - src[2].x) - src[0].x;
    let Cy = src[3].y + 3 * (src[1].y - src[2].y) - src[0].y;

    return SkFindUnitQuadRoots(Bx * Cy - By * Cx,
        Ax * Cy - Ay * Cx,
        Ax * By - Ay * Bx,
        PointerArray.from(tValues));
}

function SkChopCubicAtInflections(src: Point[], dst: Point[]) {
    let tValues = [0, 0];
    let count = SkFindCubicInflections(src, tValues);

    if (dst) {
        if (count == 0) {
            copyPointArray(dst, src, 4)
        } else {
            SkChopCubicAt_5(src, dst, tValues, count);
        }
    }
    return count + 1;
}

// Assumes the third component of points is 1.
// Calcs p0 . (p1 x p2)
function calc_dot_cross_cubic(p0: Point, p1: Point, p2: Point) {
    const xComp = p0.x * (p1.y - p2.y);
    const yComp = p0.y * (p2.x - p1.x);
    const wComp = p1.x * p2.y - p1.y * p2.x;
    return (xComp + yComp + wComp);
}

// Returns a positive power of 2 that, when multiplied by n, and excepting the two edge cases listed
// below, shifts the exponent of n to yield a magnitude somewhere inside [1..2).
// Returns 2^1023 if abs(n) < 2^-1022 (including 0).
// Returns NaN if n is Inf or NaN.
function previous_inverse_pow2(n: number) {
    // 把 double 转成 uint64 表示的位模式
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setFloat64(0, n, true); // little-endian
    let lo = view.getUint32(0, true);
    let hi = view.getUint32(4, true);

    // 合成 64 位位模式
    const bits = BigInt(hi) << 32n | BigInt(lo);

    // 位操作常量
    const EXP_MASK = 0x7ffn << 52n;
    const ONE = 1n << 52n;
    const BIAS = 1023n;
    const DOUBLE_EXP_MAX = BIAS * 2n;
    const INV_BITS = (DOUBLE_EXP_MAX << 52n) + (ONE - 1n);

    // 核心计算
    let inv = INV_BITS - bits;
    inv &= EXP_MASK; // 保留 exponent，清除 sign 和 mantissa

    // 拆成 hi/lo 再写回 float64
    const inv_hi = Number((inv >> 32n) & 0xffffffffn);
    const inv_lo = Number(inv & 0xffffffffn);
    view.setUint32(0, inv_lo, true);
    view.setUint32(4, inv_hi, true);
    return view.getFloat64(0, true);
}



function write_cubic_inflection_roots(t0: number, s0: number, t1: number, s1: number,
    t: PointerArray<number>, s: PointerArray<number>) {
    t.set(0, t0)
    s.set(0, s0)

    // This copysign/abs business orients the implicit function so positive values are always on the
    // "left" side of the curve.
    t.set(1, -copysign(t1, t1 * s1));
    s.set(1, -Math.abs(s1));

    // Ensure t[0]/s[0] <= t[1]/s[1] (s[1] is negative from above).
    if (copysign(s.get(1), s.get(0)) * t.get(0) > -Math.abs(s.get(0)) * t.get(1)) {
        let tpm = t.get(0)
        t.set(0, t.get(1))
        t.set(1, tpm)
        tpm = s.get(0)
        s.set(0, s.get(1))
        s.set(1, tpm)

    }
}

function SkClassifyCubic(P: Point[], t: PointerArray<number>, s: PointerArray<number>, d: number[]): SkCubicType {
    // Find the cubic's inflection function, I = [T^3  -3T^2  3T  -1] dot D. (D0 will always be 0
    // for integral cubics.)
    //
    // See "Resolution Independent Curve Rendering using Programmable Graphics Hardware",
    // 4.2 Curve Categorization:
    //
    // https://www.microsoft.com/en-us/research/wp-content/uploads/2005/01/p1000-loop.pdf
    let A1 = calc_dot_cross_cubic(P[0], P[3], P[2]);
    let A2 = calc_dot_cross_cubic(P[1], P[0], P[3]);
    let A3 = calc_dot_cross_cubic(P[2], P[1], P[0]);

    let D3 = 3 * A3;
    let D2 = D3 - A2;
    let D1 = D2 - A2 + A1;

    // Shift the exponents in D so the largest magnitude falls somewhere in 1..2. This protects us
    // from overflow down the road while solving for roots and KLM functionals.
    let Dmax = max(max(fabs(D1), fabs(D2)), fabs(D3));
    let norm = previous_inverse_pow2(Dmax);
    D1 *= norm;
    D2 *= norm;
    D3 *= norm;

    if (d) {
        d[3] = D3;
        d[2] = D2;
        d[1] = D1;
        d[0] = 0;
    }

    // Now use the inflection function to classify the cubic.
    //
    // See "Resolution Independent Curve Rendering using Programmable Graphics Hardware",
    // 4.4 Integral Cubics:
    //
    // https://www.microsoft.com/en-us/research/wp-content/uploads/2005/01/p1000-loop.pdf
    if (0 != D1) {
        let discr = 3 * D2 * D2 - 4 * D1 * D3;
        if (discr > 0) { // Serpentine.
            if (t && s) {
                let q = 3 * D2 + copysign(sqrt(3 * discr), D2);
                write_cubic_inflection_roots(q, 6 * D1, 2 * D3, q, t, s);
            }
            return SkCubicType.kSerpentine;
        } else if (discr < 0) { // Loop.
            if (t && s) {
                let q = D2 + copysign(sqrt(-discr), D2);
                write_cubic_inflection_roots(q, 2 * D1, 2 * (D2 * D2 - D3 * D1), D1 * q, t, s);
            }
            return SkCubicType.kLoop;
        } else { // Cusp.
            if (t && s) {
                write_cubic_inflection_roots(D2, 2 * D1, D2, 2 * D1, t, s);
            }
            return SkCubicType.kLocalCusp;
        }
    } else {
        if (0 != D2) { // Cusp at T=infinity.
            if (t && s) {
                write_cubic_inflection_roots(D3, 3 * D2, 1, 0, t, s); // T1=infinity.
            }
            return SkCubicType.kCuspAtInfinity;
        } else { // Degenerate.
            if (t && s) {
                write_cubic_inflection_roots(1, 0, 1, 0, t, s); // T0=T1=infinity.
            }
            return 0 != D3 ? SkCubicType.kQuadratic : SkCubicType.kLineOrPoint;
        }
    }
}


function bubble_sort(array: any[], count: number) {
    for (let i = count - 1; i > 0; --i)
        for (let j = i; j > 0; --j)
            if (array[j] < array[j - 1]) {
                let tmp = array[j];
                array[j] = array[j - 1];
                array[j - 1] = tmp;
            }
}
/**
 *  use for : eval(t) == A * t^2 + B * t + C
 */
export class SkQuadCoeff {
    static default() {
        return new SkQuadCoeff()
    }
    fA = FloatPoint.make(2);
    fB = FloatPoint.make(2);
    fC = FloatPoint.make(2);
    constructor()
    constructor(src?: Point[])
    constructor(A?: FloatPoint | Point[], B?: FloatPoint, C?: FloatPoint)
    constructor(A?: FloatPoint | Point[], B?: FloatPoint, C?: FloatPoint) {
        if (A && B && C) {
            this.fA.copy(A as FloatPoint)
            this.fB.copy(B)
            this.fC.copy(C)
        } else if (A) {
            let fC = from_point(A[0] as Point);
            let P1 = from_point(A[1] as Point);
            let P2 = from_point(A[2] as Point);
            let fB = times_2(P1.clone().sub(fC));
            let fA = P2.sub(times_2(P1)).add(fC);
            this.fA.copy(fA);
            this.fB.copy(fB);
            this.fC.copy(fC);
        }

    }

    eval(tt: FloatPoint): FloatPoint {
        return this.fA.clone().mul(tt).add(this.fB).mul(tt).add(this.fC)
    }

};


/**
 *  Given an array and count, remove all pair-wise duplicates from the array,
 *  keeping the existing sorting, and return the new count
 */
function collaps_duplicates(array: PointerArray<number>, count: number) {
    for (let n = count; n > 1; --n) {
        if (array.get(0) == array.get(1)) {
            for (let i = 1; i < n; ++i) {
                array.set(i - 1, array.get(i));
            }
            count -= 1;
        } else {
            array.next();
        }
    }
    return count;
}

function SkScalarCubeRoot(x: number) {
    return SkScalarPow(x, 0.3333333);
}



/*  Solve coeff(t) == 0, returning the number of roots that
    lie withing 0 < t < 1.
    coeff[0]t^3 + coeff[1]t^2 + coeff[2]t + coeff[3]

    Eliminates repeated roots (so that all tValues are distinct, and are always
    in increasing order.
*/
function solve_cubic_poly(coeff: number[], tValues: number[]): number {
    if (SkScalarNearlyZero(coeff[0])) {  // we're just a quadratic
        return SkFindUnitQuadRoots(coeff[1], coeff[2], coeff[3], PointerArray.from(tValues));
    }

    let a, b, c, Q, R;

    {
        let inva = SkScalarInvert(coeff[0]);
        a = coeff[1] * inva;
        b = coeff[2] * inva;
        c = coeff[3] * inva;
    }
    Q = (a * a - b * 3) / 9;
    R = (2 * a * a * a - 9 * a * b + 27 * c) / 54;

    let Q3 = Q * Q * Q;
    let R2MinusQ3 = R * R - Q3;
    let adiv3 = a / 3;

    if (R2MinusQ3 < 0) { // we have 3 real roots
        // the divide/root can, due to finite precisions, be slightly outside of -1...1
        let theta = SkScalarACos(clamp(R / SkScalarSqrt(Q3), -1, 1));
        let neg2RootQ = -2 * SkScalarSqrt(Q);

        tValues[0] = clamp(neg2RootQ * SkScalarCos(theta / 3) - adiv3, 0, 1);
        tValues[1] = clamp(neg2RootQ * SkScalarCos((theta + 2 * SK_ScalarPI) / 3) - adiv3, 0, 1);
        tValues[2] = clamp(neg2RootQ * SkScalarCos((theta - 2 * SK_ScalarPI) / 3) - adiv3, 0, 1);

        // now sort the roots
        bubble_sort(tValues, 3);
        return collaps_duplicates(PointerArray.from(tValues), 3);
    } else {              // we have 1 real root
        let A = SkScalarAbs(R) + SkScalarSqrt(R2MinusQ3);
        A = SkScalarCubeRoot(A);
        if (R > 0) {
            A = -A;
        }
        if (A != 0) {
            A += Q / A;
        }
        tValues[0] = clamp(A - adiv3, 0, 1);
        return 1;
    }
}


/*  Looking for F' dot F'' == 0

    A = b - a
    B = c - 2b + a
    C = d - 3c + 3b - a

    F' = 3Ct^2 + 6Bt + 3A
    F'' = 6Ct + 6B

    F' dot F'' -> CCt^3 + 3BCt^2 + (2BB + CA)t + AB
*/
function formulate_F1DotF2(src: number[], coeff: number[]) {
    let a = src[2] - src[0];
    let b = src[4] - 2 * src[2] + src[0];
    let c = src[6] + 3 * (src[2] - src[4]) - src[0];

    coeff[0] = c * c;
    coeff[1] = 3 * b * c;
    coeff[2] = 2 * b * b + c * a;
    coeff[3] = a * b;
}


/*  Looking for F' dot F'' == 0

    A = b - a
    B = c - 2b + a
    C = d - 3c + 3b - a

    F' = 3Ct^2 + 6Bt + 3A
    F'' = 6Ct + 6B

    F' dot F'' -> CCt^3 + 3BCt^2 + (2BB + CA)t + AB
*/
function SkFindCubicMaxCurvature(src: Point[], tValues: number[]) {
    let coeffX = new Array(4).fill(0), coeffY = new Array(4).fill(0);
    let i;

    formulate_F1DotF2(src.map(d => d.x), coeffX);
    formulate_F1DotF2(src.map(d => d.y), coeffY);

    for (i = 0; i < 4; i++) {
        coeffX[i] += coeffY[i];
    }

    let numRoots = solve_cubic_poly(coeffX, tValues);
    // now remove extrema where the curvature is zero (mins)
    // !!!! need a test for this !!!!
    return numRoots;
}



function SkChopCubicAtMaxCurvature(src: Point[], dst: Point[], tValues?: number[]) {
    let t_storage = new Array(3).fill(0);

    if (!tValues) {
        tValues = t_storage;
    }

    let roots = new Array(3).fill(0);
    let rootCount = SkFindCubicMaxCurvature(src, roots);

    // Throw out values not inside 0..1.
    let count = 0;
    for (let i = 0; i < rootCount; ++i) {
        if (0 < roots[i] && roots[i] < 1) {
            tValues[count++] = roots[i];
        }
    }

    if (dst) {
        if (count == 0) {
            copyPointArray(dst, src, 4)
        } else {
            SkChopCubicAt_5(src, dst, tValues, count);
        }
    }
    return count + 1;
}

// Returns a constant proportional to the dimensions of the cubic.
// Constant found through experimentation -- maybe there's a better way....
function calc_cubic_precision(src: Point[]) {
    // return (SkPointPriv::DistanceToSqd(src[1], src[0]) + SkPointPriv::DistanceToSqd(src[2], src[1])
    //         + SkPointPriv::DistanceToSqd(src[3], src[2])) * 1e-8f;

    return (src[1].distanceToSquared(src[0]) + src[2].distanceToSquared(src[1]) + src[3].distanceToSquared(src[2])) * 1e-8;

}


// Returns true if both points src[testIndex], src[testIndex+1] are in the same half plane defined
// by the line segment src[lineIndex], src[lineIndex+1].
function on_same_side(src: Point[], testIndex: number, lineIndex: number) {
    let origin = src[lineIndex].clone();
    let line = src[lineIndex + 1].clone().subtract(origin);
    let crosses = new Array(2).fill(0);
    for (let index = 0; index < 2; ++index) {
        let testLine = src[testIndex + index].clone().subtract(origin);
        crosses[index] = line.cross(testLine);
    }
    return crosses[0] * crosses[1] >= 0;
}


// Return location (in t) of cubic cusp, if there is one.
// Note that classify cubic code does not reliably return all cusp'd cubics, so
// it is not called here.
function SkFindCubicCusp(src: Point[]): number {
    // When the adjacent control point matches the end point, it behaves as if
    // the cubic has a cusp: there's a point of max curvature where the derivative
    // goes to zero. Ideally, this would be where t is zero or one, but math
    // error makes not so. It is not uncommon to create cubics this way; skip them.
    if (src[0].equalsEpsilon(src[1])) {
        return -1;
    }
    if (src[2].equalsEpsilon(src[3])) {
        return -1;
    }
    // Cubics only have a cusp if the line segments formed by the control and end points cross.
    // Detect crossing if line ends are on opposite sides of plane formed by the other line.
    if (on_same_side(src, 0, 2) || on_same_side(src, 2, 0)) {
        return -1;
    }
    // Cubics may have multiple points of maximum curvature, although at most only
    // one is a cusp.
    let maxCurvature = new Array(3).fill(0);
    let roots = SkFindCubicMaxCurvature(src, maxCurvature);
    for (let index = 0; index < roots; ++index) {
        let testT = maxCurvature[index];
        if (0 >= testT || testT >= 1) {  // no need to consider max curvature on the end
            continue;
        }
        // A cusp is at the max curvature, and also has a derivative close to zero.
        // Choose the 'close to zero' meaning by comparing the derivative length
        // with the overall cubic size.
        let dPt = eval_cubic_derivative(src, testT);
        let dPtMagnitude = dPt.lengthSq()
        let precision = calc_cubic_precision(src);
        if (dPtMagnitude < precision) {
            // All three max curvature t values may be close to the cusp;
            // return the first one.
            return testT;
        }
    }
    return -1;
}

function close_enough_to_zero(x: number) {
    return fabs(x) < 0.00001;
}



function first_axis_intersection(coefficients: number[], yDirection: boolean, axisIntercept: number, solution: Ref<number>) {
    let [A, B, C, D] = SkBezierCubic.ConvertToPolynomial(coefficients, yDirection);
    D -= axisIntercept;
    let roots = [0, 0, 0];
    let count = SkCubics.RootsValidT(A, B, C, D, roots);
    if (count == 0) {
        return false;
    }
    // Verify that at least one of the roots is accurate.
    for (let i = 0; i < count; i++) {
        if (close_enough_to_zero(SkCubics.EvalAt(A, B, C, D, roots[i]))) {
            solution.value = roots[i];
            return true;
        }
    }
    // None of the roots returned by our normal cubic solver were correct enough
    // (e.g. https://bugs.chromium.org/p/oss-fuzz/issues/detail?id=55732)
    // So we need to fallback to a more accurate solution.
    count = SkCubics.BinarySearchRootsValidT(A, B, C, D, roots);
    if (count == 0) {
        return false;
    }
    for (let i = 0; i < count; i++) {
        if (close_enough_to_zero(SkCubics.EvalAt(A, B, C, D, roots[i]))) {
            solution.value = roots[i];
            return true;
        }
    }
    return false;
}

function SkChopMonoCubicAtY(src: Point[], y: number, dst: Point[]) {
    let coefficients = [
        src[0].x, src[0].y, src[1].x, src[1].y,
        src[2].x, src[2].y, src[3].x, src[3].y
    ];
    let solution = Ref.from(0);
    if (first_axis_intersection(coefficients, true, y, solution)) {
        let cubicPair = new Array(14).fill(0);
        SkBezierCubic.Subdivide(coefficients, solution.value, cubicPair);
        for (let i = 0; i < 7; i++) {
            dst[i].x = sk_double_to_float(cubicPair[i * 2]);
            dst[i].y = sk_double_to_float(cubicPair[i * 2 + 1]);
        }
        return true;
    }
    return false;
}

function SkChopMonoCubicAtX(src: Point[], x: number, dst: Point[]) {
    let coefficients = [
        src[0].x, src[0].y, src[1].x, src[1].y,
        src[2].x, src[2].y, src[3].x, src[3].y
    ];
    let solution = Ref.from(0);
    if (first_axis_intersection(coefficients, false, x, solution)) {
        let cubicPair = new Array(14).fill(0);
        SkBezierCubic.Subdivide(coefficients, solution.value, cubicPair);
        for (let i = 0; i < 7; i++) {
            dst[i].x = sk_double_to_float(cubicPair[i * 2]);
            dst[i].y = sk_double_to_float(cubicPair[i * 2 + 1]);
        }
        return true;
    }
    return false;
}

//
// NURB representation for conics.  Helpful explanations at:
//
// http://citeseerx.ist.psu.edu/viewdoc/
//   download?doi=10.1.1.44.5740&rep=rep1&type=ps
// and
// http://www.cs.mtu.edu/~shene/COURSES/cs3621/NOTES/spline/NURBS/RB-conics.html
//
// F = (A (1 - t)^2 + C t^2 + 2 B (1 - t) t w)
//     ------------------------------------------
//         ((1 - t)^2 + t^2 + 2 (1 - t) t w)
//
//   = {t^2 (P0 + P2 - 2 P1 w), t (-2 P0 + 2 P1 w), P0}
//     ------------------------------------------------
//             {t^2 (2 - 2 w), t (-2 + 2 w), 1}
//

// F' = 2 (C t (1 + t (-1 + w)) - A (-1 + t) (t (-1 + w) - w) + B (1 - 2 t) w)
//
//  t^2 : (2 P0 - 2 P2 - 2 P0 w + 2 P2 w)
//  t^1 : (-2 P0 + 2 P2 + 4 P0 w - 4 P1 w)
//  t^0 : -2 P0 w + 2 P1 w
//
//  We disregard magnitude, so we can freely ignore the denominator of F', and
//  divide the numerator by 2
//
//    coeff[0] for t^2
//    coeff[1] for t^1
//    coeff[2] for t^0
//
function conic_deriv_coeff(src: number[], w: number, coeff: number[]) {
    const P20 = src[4] - src[0];
    const P10 = src[2] - src[0];
    const wP10 = w * P10;
    coeff[0] = w * P20 - P20;
    coeff[1] = P20 - 2 * wP10;
    coeff[2] = wP10;
}

function conic_find_extrema(src: number[], w: number, t: Ref<number>) {
    let coeff = new Array(3).fill(0);
    conic_deriv_coeff(src, w, coeff);

    let tValues = PointerArray.from([0, 0]);
    let roots = SkFindUnitQuadRoots(coeff[0], coeff[1], coeff[2], tValues);

    if (1 == roots) {
        t.value = tValues.get(0);
        return 1;
    }
    return 0;
}

// We only interpolate one dimension at a time (the first, at +0, +3, +6).
function p3d_interp(src: Point3D[], dst: Point3D[], t: number, axis: 'x' | 'y' | 'z' = 'x') {
    let ab = SkScalarInterp(src[0][axis], src[3][axis], t);
    let bc = SkScalarInterp(src[3][axis], src[6][axis], t);
    dst[0][axis] = ab;
    dst[3][axis] = SkScalarInterp(ab, bc, t);
    dst[6][axis] = bc;
}

function ratquad_mapTo3D(src: Point[], w: number, dst: Point3D[]) {
    dst[0].set(src[0].x * 1, src[0].y * 1, 1);
    dst[1].set(src[1].x * w, src[1].y * w, w);
    dst[2].set(src[2].x * 1, src[2].y * 1, 1);
}

function project_down(src: Point3D) {
    return Point.create(src.x / src.z, src.y / src.z)
}

class SkConicCoeff {
    fNumer = SkQuadCoeff.default();
    fDenom = SkQuadCoeff.default();
    constructor(conic: SkConic) {
        let p0 = from_point(conic.fPts[0]);
        let p1 = from_point(conic.fPts[1]);
        let p2 = from_point(conic.fPts[2]);
        let ww = FloatPoint.splat(conic.fW);

        let p1w = p1.clone().mul(ww);
        this.fNumer.fC.copy(p0);
        this.fNumer.fA.copy(p2.clone().sub(times_2(p1w)).add(p0));
        this.fNumer.fB.copy(times_2(p1w.clone().sub(p0)));

        this.fDenom.fC.setElements([1, 1]);
        this.fDenom.fB = times_2(ww.clone().sub(this.fDenom.fC));
        this.fDenom.fA.setElements([0 - this.fDenom.fB.x, 0 - this.fDenom.fB.y]);
    }

    eval(t: number): FloatPoint {
        let tt = FloatPoint.splat(t);
        let numer = this.fNumer.eval(tt);
        let denom = this.fDenom.eval(tt);
        return numer.div(denom);
    }


};



class SkCubicCoeff {
    fA = FloatPoint.make(2);
    fB = FloatPoint.make(2);
    fC = FloatPoint.make(2);
    fD = FloatPoint.make(2);
    constructor(src: Point[]) {
        let P0 = from_point(src[0]);
        let P1 = from_point(src[1]);
        let P2 = from_point(src[2]);
        let P3 = from_point(src[3]);
        let three = FloatPoint.splat(3);
        this.fA = (P1.clone().sub(P2)).mul(three).add(P3).sub(P0);
        this.fB = (P2.clone().sub(times_2(P1)).add(P0)).mul(three);
        this.fC = (P1.clone().sub(P0)).mul(three);
        this.fD = P0;
    }

    eval(t: FloatPoint): FloatPoint {
        return this.fA.clone().mul(t).add(this.fB).mul(t).add(this.fC).mul(t).add(this.fD);
    }


};




 class SkConic {
    static default() {
        return new this()
    }
    static make(count:number){
        return  Array.from({length:count},()=>new SkConic())
    }
    fPts = Point.make(3)
    fW = 0
    constructor()
    constructor(pts?: Point[], w?: number)
    constructor(p0?: Point[] | Point, p1?: Point | number, p2?: Point, w?: number) {
        this.set(p0, p1, p2, w)
    }
    copy(conic: SkConic) {
        this.fPts[0] = conic.fPts[0].clone();
        this.fPts[1] = conic.fPts[1].clone();
        this.fPts[2] = conic.fPts[2].clone();
        this.fW = conic.fW;
        return this
    }
    clone() {
        return new SkConic().copy(this)
    }

    set(p0?: Point[] | Point, p1?: Point | number, p2?: Point, w?: number) {
        if (p0 && p1 && p2) {
            this.set(p0 as Point, p1 as Point, p2, w!);
        } else if (p0) {
            this.set(p0 as Point[], p1! as number);
        }
    }

    setW(w: number) {
        // Guard against bad weights by forcing them to 1.
        this.fW = w > 0 && SkScalarIsFinite(w) ? w : 1;
    }


    // return false if infinity or NaN is generated; caller must check
    chopAt_2(t: number, dst: SkConic[]) {
        let tmp = Point3D.make(3), tmp2 = Point3D.make(3);

        ratquad_mapTo3D(this.fPts, this.fW, tmp);

        p3d_interp(tmp, tmp2, t, 'x');
        p3d_interp(tmp, tmp2, t, 'y');
        p3d_interp(tmp, tmp2, t, 'z');

        dst[0].fPts[0] = this.fPts[0].clone();
        dst[0].fPts[1] = project_down(tmp2[0]);
        dst[0].fPts[2] = project_down(tmp2[1]);
        dst[1].fPts[0] = dst[0].fPts[2].clone();
        dst[1].fPts[1] = project_down(tmp2[2]);
        dst[1].fPts[2] = this.fPts[2].clone();

        // to put in "standard form", where w0 and w2 are both 1, we compute the
        // new w1 as sqrt(w1*w1/w0*w2)
        // or
        // w1 /= sqrt(w0*w2)
        //
        // However, in our case, we know that for dst[0]:
        //     w0 == 1, and for dst[1], w2 == 1
        //
        let root = SkScalarSqrt(tmp2[1].z);
        dst[0].fW = tmp2[0].z / root;
        dst[1].fW = tmp2[2].z / root;
        return SkScalarsAreFinite(dst[0].fPts[0].x, 7 * 2);
    }
    chopAt_3(t1: number, t2: number, dst: SkConic) {
        if (0 == t1 || 1 == t2) {
            if (0 == t1 && 1 == t2) {
                dst.copy(this)
                return;
            } else {
                let pair = [SkConic.default(), SkConic.default()];
                if (this.chopAt_2(t1 ? t1 : t2, pair)) {
                    dst.copy(pair[Number(Boolean(t1))]);
                    return;
                }
            }
        }
        let coeff = new SkConicCoeff(this);
        let tt1 = FloatPoint.splat(t1);
        let aXY = coeff.fNumer.eval(tt1);
        let aZZ = coeff.fDenom.eval(tt1);
        let midTT = FloatPoint.splat((t1 + t2) / 2);
        let dXY = coeff.fNumer.eval(midTT);
        let dZZ = coeff.fDenom.eval(midTT);
        let tt2 = FloatPoint.splat(t2);
        let cXY = coeff.fNumer.eval(tt2);
        let cZZ = coeff.fDenom.eval(tt2);
        let bXY = times_2(dXY).sub((aXY.clone().add(cXY)).mulScalar(0.5));
        let bZZ = times_2(dZZ).sub((aZZ.clone().add(cZZ)).mulScalar(0.5));
        dst.fPts[0] = to_point(aXY.clone().div(aZZ));
        dst.fPts[1] = to_point(bXY.clone().div(bZZ));
        dst.fPts[2] = to_point(cXY.clone().div(cZZ));
        let ww = bZZ.clone().div((aZZ.clone().mul(cZZ)).sqrt());
        dst.fW = ww[0];
    }
    evalAt(t: number) {
        return to_point(new SkConicCoeff(this).eval(t));
    }
    evalAt_3(t: number, pt?: Point, tangent?: Point) {
        if (pt) {
            pt.copy(this.evalAt(t));
        }
        if (tangent) {
            tangent.copy(this.evalTangentAt(t));
        }

    }

    evalTangentAt(t: number) {
        const fPts = this.fPts, fW = this.fW;
        // The derivative equation returns a zero tangent vector when t is 0 or 1,
        // and the control point is equal to the end point.
        // In this case, use the conic endpoints to compute the tangent.
        if ((t == 0 && fPts[0] == fPts[1]) || (t == 1 && fPts[1] == fPts[2])) {
            return fPts[2].clone().subtract(fPts[0]);
        }
        let p0 = from_point(fPts[0]);
        let p1 = from_point(fPts[1]);
        let p2 = from_point(fPts[2]);
        let ww = FloatPoint.splat(fW);

        let p20 = p2.clone().sub(p0);
        let p10 = p1.clone().sub(p0);

        let C = ww.clone().mul(p10);
        let A = ww.clone().mul(p20).sub(p20);
        let B = p20.clone().sub(C).sub(C);

        return to_point(new SkQuadCoeff(A, B, C).eval(FloatPoint.splat(t)));
    }
    chop(dst: SkConic[]) {
        const fW = this.fW, fPts = this.fPts;
        // Observe that scale will always be smaller than 1 because fW > 0.
        const scale = SkScalarInvert(SK_Scalar1 + fW);

        // The subdivided control points below are the sums of the following three terms. Because the
        // terms are multiplied by something <1, and the resulting control points lie within the
        // control points of the original then the terms and the sums below will not overflow. Note
        // that fW * scale approaches 1 as fW becomes very large.
        const t0 = from_point(fPts[0]).mulScalar(scale);
        const t1 = from_point(fPts[1]).mulScalar((fW * scale));
        const t2 = from_point(fPts[2]).mulScalar(scale);

        // Calculate the subdivided control points
        const p1 = to_point(t0.clone().add(t1));
        const p3 = to_point(t1.clone().add(t2));

        // p2 = (t0 + 2*t1 + t2) / 2. Divide the terms by 2 before the sum to keep the sum for p2
        // from overflowing.
        const p2 = to_point(t0.clone().mulScalar(0.5).add(t1).add(t2.clone().mulScalar(0.5)));


        dst[0].fPts[0] = fPts[0];
        dst[0].fPts[1] = p1;
        dst[0].fPts[2] = p2;
        dst[1].fPts[0] = p2;
        dst[1].fPts[1] = p3;
        dst[1].fPts[2] = fPts[2];

        // Update w.
        dst[0].fW = dst[1].fW = subdivide_w_value(fW);
    }

    computeAsQuadError(err: Point) {
        const fW = this.fW, fPts = this.fPts;
        let a = fW - 1;
        let k = a / (4 * (2 + a));
        let x = k * (fPts[0].x - 2 * fPts[1].x + fPts[2].x);
        let y = k * (fPts[0].y - 2 * fPts[1].y + fPts[2].y);
        err.set(x, y);
    }

    asQuadTol(tol: number) {
        const fW = this.fW, fPts = this.fPts;
        let a = fW - 1;
        let k = a / (4 * (2 + a));
        let x = k * (fPts[0].x - 2 * fPts[1].x + fPts[2].x);
        let y = k * (fPts[0].y - 2 * fPts[1].y + fPts[2].y);
        return (x * x + y * y) <= tol * tol;
    }
    computeQuadPOW2(tol: number) {
        if (tol < 0 || !SkScalarIsFinite(tol) || !this.fPts.every(d => d.isFinite())) {
            return 0;
        }

        const fW = this.fW, fPts = this.fPts;
        let a = fW - 1;
        let k = a / (4 * (2 + a));
        let x = k * (fPts[0].x - 2 * fPts[1].x + fPts[2].x);
        let y = k * (fPts[0].y - 2 * fPts[1].y + fPts[2].y);

        let error = SkScalarSqrt(x * x + y * y);
        let pow2;
        for (pow2 = 0; pow2 < kMaxConicToQuadPOW2; ++pow2) {
            if (error <= tol) {
                break;
            }
            error *= 0.25;
        }
        // float version -- using ceil gives the same results as the above.
        if ((false)) {
            let err = SkScalarSqrt(x * x + y * y);
            if (err <= tol) {
                return 0;
            }
            let tol2 = tol * tol;
            if (tol2 == 0) {
                return kMaxConicToQuadPOW2;
            }
            let fpow2 = SkScalarLog2((x * x + y * y) / tol2) * 0.25;
            let altPow2 = SkScalarCeilToInt(fpow2);
            if (altPow2 != pow2) {
                // SkDebugf("pow2 %d altPow2 %d fbits %g err %g tol %g\n", pow2, altPow2, fpow2, err, tol);
            }
            pow2 = altPow2;
        }
        return pow2;
    }

    chopIntoQuadsPOW2(pts: PointerArray<Point>, pow2: number) {
        const fPts = this.fPts, fW = this.fW;
        pts.data = fPts

        const commonFinitePtCheck = () => {
            const quadCount = 1 << pow2;
            const ptCount = 2 * quadCount + 1;
            if (!AreFinite(pts.data, ptCount)) {
                // if we generated a non-finite, pin ourselves to the middle of the hull,
                // as our first and last are already on the first/last pts of the hull.
                for (let i = 1; i < ptCount - 1; ++i) {

                    pts.get(i).copy(fPts[1])
                }
            }
        }
        if (pow2 == kMaxConicToQuadPOW2) {  // If an extreme weight generates many quads ...
            let dst = [SkConic.default(), SkConic.default()];
            this.chop(dst);
            // check to see if the first chop generates a pair of lines
            if (EqualsWithinTolerance(dst[0].fPts[1], dst[0].fPts[2]) &&
                EqualsWithinTolerance(dst[1].fPts[0], dst[1].fPts[1])) {
                // pts[1] = pts[2] = pts[3] = dst[0].fPts[1];  // set ctrl == end to make lines
                pts.get(1).copy(dst[0].fPts[1])
                pts.get(2).copy(dst[0].fPts[1])
                pts.get(3).copy(dst[0].fPts[1])

                pts.get(4).copy(dst[1].fPts[2]);
                pow2 = 1;

                commonFinitePtCheck();
            }
        }


        return 1 << pow2;
    }

    findMidTangent() {
        const fPts = this.fPts, fW = this.fW;
        // Tangents point in the direction of increasing T, so tan0 and -tan1 both point toward the
        // midtangent. The bisector of tan0 and -tan1 is orthogonal to the midtangent:
        //
        //     bisector dot midtangent = 0
        //
        let tan0 = fPts[1].clone().subtract(fPts[0]);
        let tan1 = fPts[2].clone().subtract(fPts[1]);
        let bisector = SkFindBisector(tan0, tan1.clone().negate());

        // Start by finding the tangent function's power basis coefficients. These define a tangent
        // direction (scaled by some uniform value) as:
        //                                                |T^2|
        //     Tangent_Direction(T) = dx,dy = |A  B  C| * |T  |
        //                                    |.  .  .|   |1  |
        //
        // The derivative of a conic has a cumbersome order-4 denominator. However, this isn't necessary
        // if we are only interested in a vector in the same *direction* as a given tangent line. Since
        // the denominator scales dx and dy uniformly, we can throw it out completely after evaluating
        // the derivative with the standard quotient rule. This leaves us with a simpler quadratic
        // function that we use to find a tangent.
        let A = (fPts[2].clone().subtract(fPts[0])).multiplyScalar((fW - 1));
        let B = (fPts[2].clone().subtract(fPts[0])).subtract((fPts[1].clone().subtract(fPts[0])).multiplyScalar((fW * 2)));
        let C = (fPts[1].clone().subtract(fPts[0])).multiplyScalar(fW);

        // Now solve for "bisector dot midtangent = 0":
        //
        //                            |T^2|
        //     bisector * |A  B  C| * |T  | = 0
        //                |.  .  .|   |1  |
        //
        let a = bisector.dot(A);
        let b = bisector.dot(B);
        let c = bisector.dot(C);
        return solve_quadratic_equation_for_midtangent_3(a, b, c);
    }

    findXExtrema(t: Ref<number>) {
        return conic_find_extrema(this.fPts.map(d => d.x), this.fW, t);
    }

    findYExtrema(t: Ref<number>) {
        return conic_find_extrema(this.fPts.map(d => d.y), this.fW, t);
    }
    chopAtXExtrema(dst: SkConic[]) {
        let t = Ref.from(0);
        if (this.findXExtrema(t)) {
            if (!this.chopAt_2(t.value, dst)) {
                // if chop can't return finite values, don't chop
                return false;
            }
            // now clean-up the middle, since we know t was meant to be at
            // an X-extrema
            let value = dst[0].fPts[2].x;
            dst[0].fPts[1].x = value;
            dst[1].fPts[0].x = value;
            dst[1].fPts[1].x = value;
            return true;
        }
        return false;
    }

    chopAtYExtrema(dst: SkConic[]) {
        let t = Ref.from(0);
        if (this.findYExtrema(t)) {
            if (!this.chopAt_2(t.value, dst)) {
                // if chop can't return finite values, don't chop
                return false;
            }
            // now clean-up the middle, since we know t was meant to be at
            // an Y-extrema
            let value = dst[0].fPts[2].y;
            dst[0].fPts[1].y = value;
            dst[1].fPts[0].y = value;
            dst[1].fPts[1].y = value;
            return true;
        }
        return false;
    }

    computeTightBounds(bounds: Rect) {
        const fPts = this.fPts;
        let pts = Point.make(4);
        pts[0].copy(fPts[0]);
        pts[1].copy(fPts[2]);
        let count = 2;

        let t = Ref.from(0);
        if (this.findXExtrema(t)) {
            this.evalAt_3(t.value, pts[count++]);
        }
        if (this.findYExtrema(t)) {
            this.evalAt_3(t.value, pts[count++]);
        }
        bounds.setBounds(pts, count);
    }

    computeFastBounds(bounds: Rect) {
        bounds.setBounds(this.fPts, 3);
    }

    TransformW(pts: Point[], w: number, matrix: Matrix) {
        if (!matrix.hasPerspective()) {
            return w;
        }

        let src = Point3D.make(3), dst = Point3D.make(3);

        ratquad_mapTo3D(pts, w, src);

        matrix.mapHomogeneousPoints(dst, src, 3);

        // w' = sqrt(w1*w1/w0*w2)
        // use doubles temporarily, to handle small numer/denom
        let w0 = dst[0].z;
        let w1 = dst[1].z;
        let w2 = dst[2].z;
        return sk_double_to_float(sqrt(sk_ieee_double_divide(w1 * w1, w0 * w2)));
    }

    static BuildUnitArc(uStart: Point, uStop: Point, dir: SkRotationDirection,
        userMatrix: Matrix, dst: SkConic[]) {
        // rotate by x,y so that uStart is (1.0)
        let x = uStart.dot(uStop)
        let y = uStart.cross(uStop)

        let absY = SkScalarAbs(y);

        // check for (effectively) coincident vectors
        // this can happen if our angle is nearly 0 or nearly 180 (y == 0)
        // ... we use the dot-prod to distinguish between 0 and 180 (x > 0)
        if (absY <= SK_ScalarNearlyZero && x > 0 && ((y >= 0 && SkRotationDirection.kCW_SkRotationDirection == dir) ||
            (y <= 0 && SkRotationDirection.kCCW_SkRotationDirection == dir))) {
            return 0;
        }

        if (dir == SkRotationDirection.kCCW_SkRotationDirection) {
            y = -y;
        }

        // We decide to use 1-conic per quadrant of a circle. What quadrant does [xy] lie in?
        //      0 == [0  .. 90)
        //      1 == [90 ..180)
        //      2 == [180..270)
        //      3 == [270..360)
        //
        let quadrant = 0;
        if (0 == y) {
            quadrant = 2;        // 180

        } else if (0 == x) {

            quadrant = y > 0 ? 1 : 3; // 90 : 270
        } else {
            if (y < 0) {
                quadrant += 2;
            }
            if ((x < 0) != (y < 0)) {
                quadrant += 1;
            }
        }

        const quadrantPts: Point[] = [
            Point.create(1, 0), Point.create(1, 1), Point.create(0, 1), Point.create(-1, 1), Point.create(-1, 0), Point.create(-1, -1), Point.create(0, -1), Point.create(1, -1)
        ];
        const quadrantWeight = SK_ScalarRoot2Over2;

        let conicCount = quadrant;
        for (let i = 0; i < conicCount; ++i) {
            dst[i].set(quadrantPts[i * 2], quadrantWeight);
        }

        // Now compute any remaing (sub-90-degree) arc for the last conic
        const finalP = Point.create(x, y);
        const lastQ = quadrantPts[quadrant * 2];  // will already be a unit-vector
        const dot = lastQ.dot(finalP);

        if (dot < 1) {
            let offCurve = Point.create(lastQ.x + x, lastQ.y + y);
            // compute the bisector vector, and then rescale to be the off-curve point.
            // we compute its length from cos(theta/2) = length / 1, using half-angle identity we get
            // length = sqrt(2 / (1 + cos(theta)). We already have cos() when to computed the dot.
            // This is nice, since our computed weight is cos(theta/2) as well!
            //
            const cosThetaOver2 = SkScalarSqrt((1 + dot) / 2);
            offCurve.setLength(SkScalarInvert(cosThetaOver2));
            if (!EqualsWithinTolerance(lastQ, offCurve)) {
                dst[conicCount].set(lastQ, offCurve, finalP, cosThetaOver2);
                conicCount += 1;
            }
        }

        // now handle counter-clockwise and the initial unitStart rotation
        let matrix = Matrix.identity();
        matrix.setSinCos(uStart.y, uStart.x);
        if (dir == SkRotationDirection.kCCW_SkRotationDirection) {
            matrix.preScale(SK_Scalar1, -SK_Scalar1);
        }
        if (userMatrix) {
            matrix.postConcat(userMatrix);
        }
        for (let i = 0; i < conicCount; ++i) {
            matrix.mapPoints(dst[i].fPts, dst[i].fPts, 3);
        }
        return conicCount;
    }

};



/**
 * 计算二次贝塞尔曲线极值点。
 * @param src 控制点
 * @param extremas 极值点
 * @returns 极值点个数
 */
 function SkComputeQuadExtremas(src: Point[], extremas: Point[]) {
    let ts: number[] = [], tmp: number[] = [];
    let n = 0
    if (SkFindQuadExtrema(src[0].x, src[1].x, src[2].x, tmp) > 0) {
        ts[n] = tmp[0]
        n++
    }
    if (SkFindQuadExtrema(src[0].y, src[1].y, src[2].y, tmp) > 0) {
        ts[n] = tmp[0]
        n++
    }
    for (let i = 0; i < n; ++i) {
        extremas[i] = SkEvalQuadAt(src, ts[i])!;
    }
    extremas[n] = src[2];
    return n + 1;
}

/**
 *  计算三次贝塞尔曲线极值点。
 * @param src 控制点数组
 * @param extremas  极值点数组
 * @returns  极值点个数
 */
 function SkComputeCubicExtremas(src: Point[], extremas: Point[]) {
    let ts: number[] = [], tmp: number[] = [];
    let n = 0
    if (SkFindCubicExtrema(src[0].x, src[1].x, src[2].x, src[3].x, tmp) > 0) {
        ts[n] = tmp[0]
        n++
    }
    if (SkFindCubicExtrema(src[0].y, src[1].y, src[2].y, src[3].y, tmp) > 0) {
        ts[n] = tmp[0]
        n++
    }
    for (let i = 0; i < n; ++i) {
        extremas[i]=extremas[i]||Point.default()
        SkEvalCubicAt(src, ts[i], extremas[i], null, null);
    }
    extremas[n] = src[3];
    return n + 1;
}
function SkComputeConicExtremas(src: Point[],w:number, extremas: Point[])  {
    let conic=new SkConic([src[0], src[1], src[2]], w);
    let ts=[Ref.from(0),Ref.from(0)]
    let n  = conic.findXExtrema(ts[0]);
        n += conic.findYExtrema(ts[1]);

    for (let i = 0; i < n; ++i) {
        extremas[i] = conic.evalAt(ts[i].value);
    }
    extremas[n] = src[2];
    return n + 1;
}
export {
    SkConic,
    SkFindCubicExtrema,
    SkFindCubicMaxCurvature,
    SkFindBisector,
    SkFindCubicCusp,
    SkFindCubicInflections,
    SkFindCubicMidTangent,
    SkFindQuadExtrema,
    SkFindQuadMaxCurvature,
    SkFindQuadMidTangent,
    SkFindUnitQuadRoots,
    SkChopCubicAt_3,
    SkChopCubicAt_4,
    SkChopCubicAt_5,
    SkChopQuadAt,
    SkEvalQuadAt,
    SkEvalCubicAt,
    SkChopCubicAtHalf,
    SkChopCubicAtXExtrema,
    SkChopCubicAtYExtrema,
    SkChopQuadAtYExtrema,
    SkEvalQuadTangentAt,
    SkComputeQuadExtremas,
    SkComputeCubicExtremas,
    SkComputeConicExtremas
    
}