
// 转换成js 

import { Point } from "./point";
import { FloatPoint } from "./util";


enum  SkCubicType {
    kSerpentine,
    kLoop,
    kLocalCusp,       // Cusp at a non-infinite parameter value with an inflection at t=infinity.
    kCuspAtInfinity,  // Cusp with a cusp at t=infinity and a local inflection.
    kQuadratic,
    kLineOrPoint
};

// TypeScript没有显式的命名空间概念，但可以通过模块或对象来组织代码
function toVector(x: FloatPoint): SkVector {
    // 假设SkVector有一个合适的构造函数或静态方法来创建实例
    return Point.create(x.x, x.y);
}
////////////////////////////////////////////////////////////////////////

function is_not_monotonic(a:number, b:number, c:number) {
    let ab = a - b;
    let bc = b - c;
    if (ab < 0) {
        bc = -bc;
    }
    return ab == 0 || bc < 0;
}

////////////////////////////////////////////////////////////////////////

function valid_unit_divide(numer:number, denom:number,ratio:number[]) {
    

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
    ratio[0] = r;
    return 1;
}

// Just returns its argument, but makes it easy to set a break-point to know when
// SkFindUnitQuadRoots is going to return 0 (an error).
function return_check_zero(value) {
    if (value == 0) {
        return 0;
    }
    return value;
}



/** From Numerical Recipes in C.

    Q = -1/2 (B + sign(B) sqrt[B*B - 4*A*C])
    x1 = Q / A
    x2 = C / Q
*/
function SkFindUnitQuadRoots(A, B, C, roots: number[]) {

    if (A == 0) {
        return return_check_zero(valid_unit_divide(-C, B, roots));
    }

    let r = roots;
    let rootIndex = 0
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
    rootIndex += valid_unit_divide(Q, A, r);
    rootIndex += valid_unit_divide(C, Q, r);
    if (rootIndex == 2) {
        if (roots[0] > roots[1]) {
            let tmp = roots[0]
            roots[0] = roots[1]
            roots[1] = roots[0]
        } else if (roots[0] == roots[1]) { // nearly-equal?
            r -= 1; // skip the double root
        }
    }
    return return_check_zero((int)(r - roots));
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

function SkEvalQuadAt(src: Point[], t, pt: Point, tangent: Point) {

    if (pt) {
        pt.copy(SkEvalQuadAt_2(src, t))
    }
    if (tangent) {
        tangent.copy(SkEvalQuadTangentAt(src, t))
    }
}
function SkEvalQuadAt_2(src: Point[], t) {
    return to_point(SkQuadCoeff(src).eval(t));
}
function SkEvalQuadTangentAt(src: Point[], t: number) {
    // The derivative equation is 2(b - a +(a - 2b +c)t). This returns a
    // zero tangent vector when t is 0 or 1, and the control point is equal
    // to the end point. In this case, use the quad end points to compute the tangent.
    if ((t == 0 && src[0] == src[1]) || (t == 1 && src[1] == src[2])) {
        return src[2].clone().subtract(src[0]);
    }

    let P0 = from_point(src[0]);
    let P1 = from_point(src[1]);
    let P2 = from_point(src[2]);

    let B = P1.sub(P0);
    let A = P2.sub(p1).sub(B);
    let T = A.mulScalar(t).add(B);

    return to_point(T.add(T));
}
function interp(v0,v1, t) {
    return v0 + (v1 - v0) * t;
}

function SkChopQuadAt(src: Point[], dst: Point[], t: number) {

    let p0 = from_point(src[0]);
    let p1 = from_point(src[1]);
    let p2 = from_point(src[2]);
    let tt = FloatPoint.make(2).setElements([t, t]);

    let p01 = p0.clone().lerp(p0, p1, tt) ///interp(p0, p1, tt);
    let p12 = p1.clone().lerp(p1, p2, tt)

    dst[0] = to_point(p0);
    dst[1] = to_point(p01);
    dst[2] = to_point(p01.clone().lerp(p01, p12, tt));
    dst[3] = to_point(p12);
    dst[4] = to_point(p2);
}


function SkChopQuadAtHalf(rc: Point[], dst: Point[]) {
    SkChopQuadAt(src, dst, 0.5);
}


function SkMeasureAngleBetweenVectors(a, b) {
    let cosTheta = sk_ieee_float_divide(a.dot(b), sqrtf(a.dot(a) * b.dot(b)));
    // Pin cosTheta such that if it is NaN (e.g., if a or b was 0), then we return acos(1) = 0.
    cosTheta = Math.max(Math.min(1, cosTheta), -1);
    return Math.acos(cosTheta);
}

function SkFindBisector(a: Point, b: Point) {
    let v = [Point.zero(), Point.zero()];
    if (a.dot(b) >= 0) {
        // a,b are within +/-90 degrees apart.
        v = [a, b];
    } else if (a.cross(b) >= 0) {
        // a,b are >90 degrees apart. Find the bisector of their interior normals instead. (Above 90
        // degrees, the original vectors start cancelling each other out which eventually becomes
        // unstable.)
        v[0].set(-a.fY, +a.fX);
        v[1].set(+b.fY, -b.fX);
    } else {
        // a,b are <-90 degrees apart. Find the bisector of their interior normals instead. (Below
        // -90 degrees, the original vectors start cancelling each other out which eventually
        // becomes unstable.)
        v[0].set(+a.fY, -a.fX);
        v[1].set(-b.fY, +b.fX);
    }
    // Return "normalize(v[0]) + normalize(v[1])".
    let x0_x1 = FloatPoint.make(2).setElements([v[0].x, v[1].x]);
    let y0_y1 = FloatPoint.make(2).setElements([v[0].y, v[1].y]);
    let invLengths = x0_x1.clone().mul(x0_x1).add(y0_y1.clone().mul(y0_y1)).sqrt().inverse();
    x0_x1.mul(invLengths);
    y0_y1.mul(invLengths);
    return Point.create(x0_x1.elements[0] + x0_x1.elements[1], y0_y1.elements[0] + y0_y1.elements[1]);
}

function SkFindQuadMidTangent(src: Point[]) {
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
function SkFindQuadExtrema(a:number, b:number, c:number,  tValue:number[]) {
    /*  At + B == 0
        t = -B / A
    */
    return valid_unit_divide(a - b, a - b - b + c, tValue);
}

function flatten_double_quad_extrema(coords:number[]) {
    coords[2] = coords[6] = coords[4];
}

/*  Returns 0 for 1 quad, and 1 for two quads, either way the answer is
 stored in dst[]. Guarantees that the 1/2 quads will be monotonic.
 */
function SkChopQuadAtYExtrema(src:Point[], dst:Point[]) {
    
    

    let a = src[0].y;
    let b = src[1].y;
    let c = src[2].y;

    if (is_not_monotonic(a, b, c)) {
        let    tValue;
        if (valid_unit_divide(a - b, a - b - b + c, &tValue)) {
            SkChopQuadAt(src, dst, tValue);
            flatten_double_quad_extrema(&dst[0].y);
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
function SkChopQuadAtXExtrema(src:Point[], dst:Point[]) {
    
    

    let a = src[0].x;
    let b = src[1].x;
    let c = src[2].x;

    if (is_not_monotonic(a, b, c)) {
        let tValue;
        if (valid_unit_divide(a - b, a - b - b + c, &tValue)) {
            SkChopQuadAt(src, dst, tValue);
            flatten_double_quad_extrema(&dst[0].x);
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
// .x'.x'' +.y'.y'' = 0
//
//  t = - (Ax Bx + Ay By) / (Bx ^ 2 + By ^ 2)
//
function SkFindQuadMaxCurvature(src:Point[]) {
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

function SkChopQuadAtMaxCurvature(src:Point[], dst:Point[]) {
    let t = SkFindQuadMaxCurvature(src);
    if (t > 0 && t < 1) {
        SkChopQuadAt(src, dst, t);
        return 2;
    } else {
        memcpy(dst, src, 3 * sizeof(SkPoint));
        return 1;
    }
}

function SkConvertQuadToCubic(src:Point[], dst:Point[]) {
    let scale=(2.0 / 3.0);
    let s0 = (src[0].clone());
    let s1 = (src[1].clone());
    let s2 = (src[2].clone());

    dst[0] = s0;
    dst[1] = s0.clone().add((s1.clone().subtract(s0)).multiplyScalar(scale));
    dst[2] = s2.clone().add((s1.clone().subtract(s2)).multiplyScalar(scale));
    dst[3] = s2;
}

//////////////////////////////////////////////////////////////////////////////
///// CUBICS // CUBICS // CUBICS // CUBICS // CUBICS // CUBICS // CUBICS /////
//////////////////////////////////////////////////////////////////////////////

function eval_cubic_derivative(src:Point[], t:number) {
    let coeff;
    let P0 = from_point(src[0]);
    let P1 = from_point(src[1]);
    let P2 = from_point(src[2]);
    let P3 = from_point(src[3]);

    coeff.fA = P3 + 3 * (P1 - P2) - P0;
    coeff.fB = times_2(P2 - times_2(P1) + P0);
    coeff.fC = P1 - P0;
    return to_vector(coeff.eval(t));
}

function eval_cubic_2ndDerivative(src:Point[], t:number) {
    let P0 = from_point(src[0]);
    let P1 = from_point(src[1]);
    let P2 = from_point(src[2]);
    let P3 = from_point(src[3]);
    let A = P3 + 3 * (P1 - P2) - P0;
    let B = P2 - times_2(P1) + P0;

    return to_vector(A * t + B);
}

function SkEvalCubicAt(src:Point[], t:number, loc:Point,
                   tangent:Point, curvature:Point) {
    
    

    if (loc) {
        loc.copy(to_point(SkCubicCoeff(src).eval(t)))
    }
    if (tangent) {
        // The derivative equation returns a zero tangent vector when t is 0 or 1, and the
        // adjacent control point is equal to the end point. In this case, use the
        // next control point or the end points to compute the tangent.
        if ((t == 0 && src[0] == src[1]) || (t == 1 && src[2] == src[3])) {
            if (t == 0) {
                tangent = src[2] - src[0];
            } else {
                tangent = src[3] - src[1];
            }
            if (!tangent.x && !tangent.y) {
                tangent = src[3] - src[0];
            }
        } else {
            tangent = eval_cubic_derivative(src, t);
        }
    }
    if (curvature) {
        curvature = eval_cubic_2ndDerivative(src, t);
    }
}

/** Cubic'(t) = At^2 + Bt + C, where
    A = 3(-a + 3(b - c) + d)
    B = 6(a - 2b + c)
    C = 3(b - a)
    Solve for t, keeping only those that fit betwee 0 < t < 1
*/
function SkFindCubicExtrema(a:number, b:number, c:number, d:number,
                        tValues:number[]) {
    // we divide A,B,C by 3 to simpl.y
    let A = d - a + 3*(b - c);
    let B = 2*(a - b - b + c);
    let C = b - a;

    return SkFindUnitQuadRoots(A, B, C, tValues);
}

// This does not return b when t==1, but it otherwise seems to get better precision than
// "a*(1 - t) + b*t" for things like chopping cubics on exact cusp points.
// The responsibility falls on the caller to check that t != 1 before calling.
function unchecked_mix(a,  b,t) {
    return (b - a)*t + a;
}

function SkChopCubicAt(src:Point[], dst:Point[], t:number) {
    

    if (t == 1) {
        memcpy(dst, src, sizeof(SkPoint) * 4);
        dst[4] = dst[5] = dst[6] = src[3];
        return;
    }

    let p0 = skvx::bit_pun<float2>(src[0]);
    let p1 = skvx::bit_pun<float2>(src[1]);
    let p2 = skvx::bit_pun<float2>(src[2]);
    let p3 = skvx::bit_pun<float2>(src[3]);
    let T = t;

    let ab = unchecked_mix(p0, p1, T);
    let bc = unchecked_mix(p1, p2, T);
    let cd = unchecked_mix(p2, p3, T);
    let abc = unchecked_mix(ab, bc, T);
    let bcd = unchecked_mix(bc, cd, T);
    let abcd = unchecked_mix(abc, bcd, T);

    dst[0] = skvx::bit_pun<SkPoint>(p0);
    dst[1] = skvx::bit_pun<SkPoint>(ab);
    dst[2] = skvx::bit_pun<SkPoint>(abc);
    dst[3] = skvx::bit_pun<SkPoint>(abcd);
    dst[4] = skvx::bit_pun<SkPoint>(bcd);
    dst[5] = skvx::bit_pun<SkPoint>(cd);
    dst[6] = skvx::bit_pun<SkPoint>(p3);
}

function SkChopCubicAt(src:Point[], dst:Point[],  t0:number,t1:number) {
    

    if (t1 == 1) {
        SkChopCubicAt(src, dst, t0);
        dst[7] = dst[8] = dst[9] = src[3];
        return;
    }

    // Perform both chops in parallel using 4-lane SIMD.
    let p00, p11, p22, p33, T;
    p00.lo = p00.hi = src[0].clone()
    p11.lo = p11.hi = ssrc[1].clone()
    p22.lo = p22.hi = src[2].clone()
    p33.lo = p33.hi = src[3].clone()
    T.lo = t0;
    T.hi = t1;

    let ab = unchecked_mix(p00, p11, T);
    let bc = unchecked_mix(p11, p22, T);
    let cd = unchecked_mix(p22, p33, T);
    let abc = unchecked_mix(ab, bc, T);
    let bcd = unchecked_mix(bc, cd, T);
    let abcd = unchecked_mix(abc, bcd, T);
    let middle = unchecked_mix(abc, bcd, skvx::shuffle<2,3,0,1>(T));

    dst[0] = skvx::bit_pun<SkPoint>(p00.lo);
    dst[1] = skvx::bit_pun<SkPoint>(ab.lo);
    dst[2] = skvx::bit_pun<SkPoint>(abc.lo);
    dst[3] = skvx::bit_pun<SkPoint>(abcd.lo);
    middle.store(dst + 4);
    dst[6] = skvx::bit_pun<SkPoint>(abcd.hi);
    dst[7] = skvx::bit_pun<SkPoint>(bcd.hi);
    dst[8] = skvx::bit_pun<SkPoint>(cd.hi);
    dst[9] = skvx::bit_pun<SkPoint>(p33.hi);
}

function SkChopCubicAt(src:Point[],dst:Point[],tValues:number[],  tCount) {
    
    

    if (dst) {
        if (tCount == 0) { // nothing to chop
            memcpy(dst, src, 4*sizeof(SkPoint));
        } else {
            let i = 0;
            for (; i < tCount - 1; i += 2) {
                // Do two chops at once.
                let tt = float2::Load(tValues + i);
                if (i != 0) {
                    let lastT = tValues[i - 1];
                    tt = skvx::pin((tt - lastT) / (1 - lastT), float2(0), float2(1));
                }
                SkChopCubicAt(src, dst, tt[0], tt[1]);
                src = dst = dst + 6;
            }
            if (i < tCount) {
                // Chop the final cubic if there was an odd number of chops.
                
                let t = tValues[i];
                if (i != 0) {
                    let lastT = tValues[i - 1];
                    t = SkTPin(sk_ieee_float_divide(t - lastT, 1 - lastT), 0.f, 1.f);
                }
                SkChopCubicAt(src, dst, t);
            }
        }
    }
}

function SkChopCubicAtHalf(src:Point[], dst:Point[]) {
    SkChopCubicAt(src, dst, 0.5f);
}

function SkMeasureNonInflectCubicRotation(pts:Point[]) {
    let a = pts[1] - pts[0];
    let b = pts[2] - pts[1];
    let c = pts[3] - pts[2];
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
    return 2*SK_ScalarPI - SkMeasureAngleBetweenVectors(a,-b) - SkMeasureAngleBetweenVectors(b,-c);
}

function fma(f, m, a) {
    return skvx::fma(f, FloatPoint.make(4).setElements(m), a);
}

// Finds the root nearest 0.5. Returns 0.5 if the roots are undefined or outside 0..1.
function solve_quadratic_equation_for_midtangent( a,  b,  c,  discr) {
    // Quadratic formula from Numerical Recipes in C:
    let q = -.5f * (b + copysignf(sqrtf(discr), b));
    // The roots are q/a and c/q. Pick the midtangent closer to T=.5.
    let _5qa = -.5f*q*a;
    let T = fabsf(q*q + _5qa) < fabsf(a*c + _5qa) ? sk_ieee_float_divide(q,a)
                                                    : sk_ieee_float_divide(c,q);
    if (!(T > 0 && T < 1)) {  // Use "!(positive_logic)" so T=NaN will take this branch.
        // Either the curve is a flat line with no rotation or FP precision failed us. Chop at .5.
        T = .5;
    }
    return T;
}

function solve_quadratic_equation_for_midtangent( a,  b,  c) {
    return solve_quadratic_equation_for_midtangent(a, b, c, b*b - 4*a*c);
}

function SkFindCubicMidTangent(src:Point[]) {
    // Tangents point in the direction of increasing T, so tan0 and -tan1 both point toward the
    // midtangent. The bisector of tan0 and -tan1 is orthogonal to the midtangent:
    //
    //     bisector dot midtangent == 0
    //
    let tan0 = (src[0] == src[1]) ? src[2] - src[0] : src[1] - src[0];
    let tan1 = (src[2] == src[3]) ? src[3] - src[1] : src[3] - src[2];
    let bisector = SkFindBisector(tan0, -tan1);

    // Find the T value at the midtangent. This is a simple quadratic equation:
    //
    //     midtangent dot bisector == 0, or using a tangent matrix C' in power basis form:
    //
    //                   |C'x  C'y|
    //     |T^2  T  1| * |.    .  | * |bisector.x| == 0
    //                   |.    .  |   |bisector.y|
    //
    // The coeffs for the quadratic equation we need to solve are therefore:  C' * bisector
    let kM = [FloatPoint.make(4).setElements(-1,  2, -1,  0),
                                       FloatPoint.make(4).setElements( 3, -4,  1,  0),
                                       FloatPoint.make(4).setElements(-3,  2,  0,  0)];
                                       let C_x = fma(kM[0], src[0].x,
               fma(kM[1], src[1].x,
               fma(kM[2], src[2].x, FloatPoint.make(4).setElements(src[3].x, 0,0,0))));
               let C_y = fma(kM[0], src[0].y,
               fma(kM[1], src[1].y,
               fma(kM[2], src[2].y, FloatPoint.make(4).setElements(src[3].y, 0,0,0))));
               let coeffs = C_x * bisector.x() + C_y * bisector.y();

    // Now solve the quadratic for T.
    let T = 0;
    let a=coeffs[0], b=coeffs[1], c=coeffs[2];
    let discr = b*b - 4*a*c;
    if (discr > 0) {  // This will only be false if the curve is a line.
        return solve_quadratic_equation_for_midtangent(a, b, c, discr);
    } else {
        // This is a 0- or 360-degree flat line. It doesn't have single points of midtangent.
        // (tangent == midtangent at every point on the curve except the cusp points.)
        // Chop in between both cusps instead, if any. There can be up to two cusps on a flat line,
        // both where the tangent is perpendicular to the starting tangent:
        //
        //     tangent dot tan0 == 0
        //
        coeffs = C_x * tan0.x() + C_y * tan0.y();
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
            T = -b / (2*a);
        }
        if (!(T > 0 && T < 1)) {  // Use "!(positive_logic)" so T=NaN will take this branch.
            // Either the curve is a flat line with no rotation or FP precision failed us. Chop at
            // .5.
            T = .5;
        }
        return T;
    }
}

function flatten_double_cubic_extrema( coords:number[]) {
    coords[4] = coords[8] = coords[6];
}

/** Given 4 points on a cubic bezier, chop it into 1, 2, 3 beziers such that
    the resulting beziers are monotonic in Y. This is called by the scan
    converter.  Depending on what is returned, dst[] is treated as follows:
    0   dst[0..3] is the original cubic
    1   dst[0..3] and dst[3..6] are the two new cubics
    2   dst[0..3], dst[3..6], dst[6..9] are the three new cubics
    If dst == null, it is ignored and only the count is returned.
*/
function SkChopCubicAtYExtrema(src:Point[],  dst:Point[]) {
    let    tValues[2];
    let         roots = SkFindCubicExtrema(src[0].y, src[1].y, src[2].y,
                                           src[3].y, tValues);

    SkChopCubicAt(src, dst, tValues, roots);
    if (dst && roots > 0) {
        // we do some cleanup to ensure our Y extrema are flat
        flatten_double_cubic_extrema(&dst[0].y);
        if (roots == 2) {
            flatten_double_cubic_extrema(&dst[3].y);
        }
    }
    return roots;
}

function SkChopCubicAtXExtrema(src:Point[], dst:Point[]) {
    let    tValues=[];
    let         roots = SkFindCubicExtrema(src[0].x, src[1].x, src[2].x,
                                           src[3].x, tValues);

    SkChopCubicAt(src, dst, tValues, roots);
    if (dst && roots > 0) {
        // we do some cleanup to ensure our Y extrema are flat
        flatten_double_cubic_extrema(dst[0].x);
        if (roots == 2) {
            flatten_double_cubic_extrema(dst[3].x);
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
function SkFindCubicInflections(src:Point[], tValues:Number[]) {
    let Ax = src[1].x - src[0].x;
    let Ay = src[1].y - src[0].y;
    let Bx = src[2].x - 2 * src[1].x + src[0].x;
    let By = src[2].y - 2 * src[1].y + src[0].y;
    let Cx = src[3].x + 3 * (src[1].x - src[2].x) - src[0].x;
    let Cy = src[3].y + 3 * (src[1].y - src[2].y) - src[0].y;

    return SkFindUnitQuadRoots(Bx*Cy - By*Cx,
                               Ax*Cy - Ay*Cx,
                               Ax*By - Ay*Bx,
                               tValues);
}

function SkChopCubicAtInflections(src:Point[], dst:Point[]) {
    let    tValues=[];
    let         count = SkFindCubicInflections(src, tValues);

    if (dst) {
        if (count == 0) {
            memcpy(dst, src, 4 * sizeof(SkPoint));
        } else {
            SkChopCubicAt(src, dst, tValues, count);
        }
    }
    return count + 1;
}

// Assumes the third component of points is 1.
// Calcs p0 . (p1 x p2)
function calc_dot_cross_cubic(p0,p1,p2) {
    const  xComp = p0.x * (p1.y - p2.y);
    const  yComp = p0.y * ( p2.x -  p1.x);
    const  wComp =  p1.x *  p2.y - p1.y * p2.x;
    return (xComp + yComp + wComp);
}

// Returns a positive power of 2 that, when multiplied by n, and excepting the two edge cases listed
// below, shifts the exponent of n to yield a magnitude somewhere inside [1..2).
// Returns 2^1023 if abs(n) < 2^-1022 (including 0).
// Returns NaN if n is Inf or NaN.
function previous_inverse_pow2( n) {
    let bits;
    memcpy(&bits, &n, sizeof(double));
    bits = ((1023llu*2 << 52) + ((1llu << 52) - 1)) - bits; // exp=-exp
    bits &= (0x7ffllu) << 52; // mantissa=1.0, sign=0
    memcpy(&n, &bits, sizeof(double));
    return n;
}

function write_cubic_inflection_roots( t0,  s0,  t1,  s1,t, s) {
    t[0] = t0;
    s[0] = s0;

    // This copysign/abs business orients the implicit function so positive values are always on the
    // "left" side of the curve.
    t[1] = -copysign(t1, t1 * s1);
    s[1] = -fabs(s1);

    // Ensure t[0]/s[0] <= t[1]/s[1] (s[1] is negative from above).
    if (copysign(s[1], s[0]) * t[0] > -fabs(s[0]) * t[1]) {
        using std::swap;
        swap(t[0], t[1]);
        swap(s[0], s[1]);
    }
}

function yCubic(P:Point[],  t[2],  s[2],  d[4]) {
    // Find the cubic's inflection function, I = [T^3  -3T^2  3T  -1] dot D. (D0 will always be 0
    // for integral cubics.)
    //
    // See "Resolution Independent Curve Rendering using Programmable Graphics Hardware",
    // 4.2 Curve Categorization:
    //
    // https://www.microsoft.com/en-us/research/wp-content/uploads/2005/01/p1000-loop.pdf
    double A1 = calc_dot_cross_cubic(P[0], P[3], P[2]);
    double A2 = calc_dot_cross_cubic(P[1], P[0], P[3]);
    double A3 = calc_dot_cross_cubic(P[2], P[1], P[0]);

    double D3 = 3 * A3;
    double D2 = D3 - A2;
    double D1 = D2 - A2 + A1;

    // Shift the exponents in D so the largest magnitude falls somewhere in 1..2. This protects us
    // from overflow down the road while solving for roots and KLM functionals.
    double Dmax = std::max(std::max(fabs(D1), fabs(D2)), fabs(D3));
    double norm = previous_inverse_pow2(Dmax);
    D1 *= norm;
    D2 *= norm;
    D3 *= norm;

    if (d) {
        d[3] = D3;
        d[2] = D2;
        d[1] = D1;
        d[0] = 0;
    }

    // Now use the inflection function to class.y the cubic.
    //
    // See "Resolution Independent Curve Rendering using Programmable Graphics Hardware",
    // 4.4 Integral Cubics:
    //
    // https://www.microsoft.com/en-us/research/wp-content/uploads/2005/01/p1000-loop.pdf
    if (0 != D1) {
        let discr = 3*D2*D2 - 4*D1*D3;
        if (discr > 0) { // Serpentine.
            if (t && s) {
                let q = 3*D2 + copysign(sqrt(3*discr), D2);
                write_cubic_inflection_roots(q, 6*D1, 2*D3, q, t, s);
            }
            return SkCubicType.kSerpentine;
        } else if (discr < 0) { // Loop.
            if (t && s) {
                let q = D2 + copysign(sqrt(-discr), D2);
                write_cubic_inflection_roots(q, 2*D1, 2*(D2*D2 - D3*D1), D1*q, t, s);
            }
            return SkCubicType::kLoop;
        } else { // Cusp.
            if (t && s) {
                write_cubic_inflection_roots(D2, 2*D1, D2, 2*D1, t, s);
            }
            return SkCubicType::kLocalCusp;
        }
    } else {
        if (0 != D2) { // Cusp at T=infinity.
            if (t && s) {
                write_cubic_inflection_roots(D3, 3*D2, 1, 0, t, s); // T1=infinity.
            }
            return SkCubicType::kCuspAtInfinity;
        } else { // Degenerate.
            if (t && s) {
                write_cubic_inflection_roots(1, 0, 1, 0, t, s); // T0=T1=infinity.
            }
            return 0 != D3 ? SkCubicType::kQuadratic : SkCubicType::kLineOrPoint;
        }
    }
}

template <typename T> void bubble_sort(T array[], int count) {
    for (let i = count - 1; i > 0; --i)
        for (let j = i; j > 0; --j)
            if (array[j] < array[j-1])
            {
                T   tmp(array[j]);
                array[j] = array[j-1];
                array[j-1] = tmp;
            }
}

/**
 *  Given an array and count, remove all pair-wise duplicates from the array,
 *  keeping the existing sorting, and return the new count
 */
static function collaps_duplicates(SkScalar array[], int count) {
    for (let n = count; n > 1; --n) {
        if (array[0] == array[1]) {
            for (let i = 1; i < n; ++i) {
                array[i - 1] = array[i];
            }
            count -= 1;
        } else {
            array += 1;
        }
    }
    return count;
}

#ifdef SK_DEBUG

#define TEST_COLLAPS_ENTRY(array)   array, std::size(array)

function test_collaps_duplicates() {
    function gOnce;
    if (gOnce) { return; }
    gOnce = true;
    let  src0[] = { 0 };
    let  src1[] = { 0, 0 };
    let  src2[] = { 0, 1 };
    let  src3[] = { 0, 0, 0 };
    let  src4[] = { 0, 0, 1 };
    let  src5[] = { 0, 1, 1 };
    let  src6[] = { 0, 1, 2 };
    const struct {
        let * fData;
        int fCount;
        int fCollapsedCount;
    } data[] = {
        { TEST_COLLAPS_ENTRY(src0), 1 },
        { TEST_COLLAPS_ENTRY(src1), 1 },
        { TEST_COLLAPS_ENTRY(src2), 2 },
        { TEST_COLLAPS_ENTRY(src3), 1 },
        { TEST_COLLAPS_ENTRY(src4), 2 },
        { TEST_COLLAPS_ENTRY(src5), 2 },
        { TEST_COLLAPS_ENTRY(src6), 3 },
    };
    for (size_t i = 0; i < std::size(data); ++i) {
        SkScalar dst[3];
        memcpy(dst, data[i].fData, data[i].fCount * sizeof(dst[0]));
        int count = collaps_duplicates(dst, data[i].fCount);
        
        for (let j = 1; j < count; ++j) {
            
        }
    }
}
#endif

static SkScalar SkScalarCubeRoot(x:number) {
    return SkScalarPow(x, 0.3333333f);
}

/*  Solve coeff(t) == 0, returning the number of roots that
    lie withing 0 < t < 1.
    coeff[0]t^3 + coeff[1]t^2 + coeff[2]t + coeff[3]

    Eliminates repeated roots (so that all tValues are distinct, and are always
    in increasing order.
*/
static function solve_cubic_poly(let  coeff[4], SkScalar tValues[3]) {
    if (SkScalarNearlyZero(coeff[0])) {  // we're just a quadratic
        return SkFindUnitQuadRoots(coeff[1], coeff[2], coeff[3], tValues);
    }

    a:number, b, c, Q, R;

    {
        

        let inva = SkScalarInvert(coeff[0]);
        a = coeff[1] * inva;
        b = coeff[2] * inva;
        c = coeff[3] * inva;
    }
    Q = (a*a - b*3) / 9;
    R = (2*a*a*a - 9*a*b + 27*c) / 54;

    SkScalar Q3 = Q * Q * Q;
    SkScalar R2MinusQ3 = R * R - Q3;
    SkScalar adiv3 = a / 3;

    if (R2MinusQ3 < 0) { // we have 3 real roots
        // the divide/root can, due to finite precisions, be slightly outside of -1...1
        let theta = SkScalarACos(SkTPin(R / SkScalarSqrt(Q3), -1.0f, 1.0f));
        SkScalar neg2RootQ = -2 * SkScalarSqrt(Q);

        tValues[0] = SkTPin(neg2RootQ * SkScalarCos(theta/3) - adiv3, 0.0f, 1.0f);
        tValues[1] = SkTPin(neg2RootQ * SkScalarCos((theta + 2*SK_ScalarPI)/3) - adiv3, 0.0f, 1.0f);
        tValues[2] = SkTPin(neg2RootQ * SkScalarCos((theta - 2*SK_ScalarPI)/3) - adiv3, 0.0f, 1.0f);
        SkDEBUGCODE(test_collaps_duplicates();)

        // now sort the roots
        bubble_sort(tValues, 3);
        return collaps_duplicates(tValues, 3);
    } else {              // we have 1 real root
        let A = SkScalarAbs(R) + SkScalarSqrt(R2MinusQ3);
        A = SkScalarCubeRoot(A);
        if (R > 0) {
            A = -A;
        }
        if (A != 0) {
            A += Q / A;
        }
        tValues[0] = SkTPin(A - adiv3, 0.0f, 1.0f);
        return 1;
    }
}

/*  Looking for F' dot F'' == 0

    A = b - a
    B = c - 2b + a
    C = d - 3c + 3b - a

    F' = 3Ct^2 + 6Bt + 3A
    F'' = 6Ct + 6B

    F' dot F'' . CCt^3 + 3BCt^2 + (2BB + CA)t + AB
*/
function formulate_F1DotF2(src:number[], SkScalar coeff[4]) {
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

    F' dot F'' . CCt^3 + 3BCt^2 + (2BB + CA)t + AB
*/
function SkFindCubicMaxCurvature(src:Point[], SkScalar tValues[3]) {
    SkScalar coe.x[4], coe.y[4];
    int      i;

    formulate_F1DotF2(&src[0].x, coe.x);
    formulate_F1DotF2(&src[0].y, coe.y);

    for (i = 0; i < 4; i++) {
        coe.x[i] += coe.y[i];
    }

    int numRoots = solve_cubic_poly(coe.x, tValues);
    // now remove extrema where the curvature is zero (mins)
    // !!!! need a test for this !!!!
    return numRoots;
}

function SkChopCubicAtMaxCurvature(src:Point[], dst:Point[],
                              SkScalar tValues[3]) {
    SkScalar    t_storage[3];

    if (tValues == nullptr) {
        tValues = t_storage;
    }

    SkScalar roots[3];
    int rootCount = SkFindCubicMaxCurvature(src, roots);

    // Throw out values not inside 0..1.
    int count = 0;
    for (let i = 0; i < rootCount; ++i) {
        if (0 < roots[i] && roots[i] < 1) {
            tValues[count++] = roots[i];
        }
    }

    if (dst) {
        if (count == 0) {
            memcpy(dst, src, 4 * sizeof(SkPoint));
        } else {
            SkChopCubicAt(src, dst, tValues, count);
        }
    }
    return count + 1;
}

// Returns a constant proportional to the dimensions of the cubic.
// Constant found through experimentation -- maybe there's a better way....
static SkScalar calc_cubic_precision(src:Point[]) {
    return (SkPointPriv::DistanceToSqd(src[1], src[0]) + SkPointPriv::DistanceToSqd(src[2], src[1])
            + SkPointPriv::DistanceToSqd(src[3], src[2])) * 1e-8f;
}

// Returns true if both points src[testIndex], src[testIndex+1] are in the same half plane defined
// by the line segment src[lineIndex], src[lineIndex+1].
function on_same_side(src:Point[], int testIndex, int lineIndex) {
    SkPoint origin = src[lineIndex];
    SkVector line = src[lineIndex + 1] - origin;
    SkScalar crosses[2];
    for (let index = 0; index < 2; ++index) {
        SkVector testLine = src[testIndex + index] - origin;
        crosses[index] = line.cross(testLine);
    }
    return crosses[0] * crosses[1] >= 0;
}

// Return location (in t) of cubic cusp, if there is one.
// Note that class.y cubic code does not reliably return all cusp'd cubics, so
// it is not called here.
SkScalar SkFindCubicCusp(src:Point[]) {
    // When the adjacent control point matches the end point, it behaves as if
    // the cubic has a cusp: there's a point of max curvature where the derivative
    // goes to zero. Ideally, this would be where t is zero or one, but math
    // error makes not so. It is not uncommon to create cubics this way; skip them.
    if (src[0] == src[1]) {
        return -1;
    }
    if (src[2] == src[3]) {
        return -1;
    }
    // Cubics only have a cusp if the line segments formed by the control and end points cross.
    // Detect crossing if line ends are on opposite sides of plane formed by the other line.
    if (on_same_side(src, 0, 2) || on_same_side(src, 2, 0)) {
        return -1;
    }
    // Cubics may have multiple points of maximum curvature, although at most only
    // one is a cusp.
    SkScalar maxCurvature[3];
    int roots = SkFindCubicMaxCurvature(src, maxCurvature);
    for (let index = 0; index < roots; ++index) {
        let testT = maxCurvature[index];
        if (0 >= testT || testT >= 1) {  // no need to consider max curvature on the end
            continue;
        }
        // A cusp is at the max curvature, and also has a derivative close to zero.
        // Choose the 'close to zero' meaning by comparing the derivative length
        // with the overall cubic size.
        SkVector dPt = eval_cubic_derivative(src, testT);
        let dPtMagnitude = SkPointPriv::LengthSqd(dPt);
        let precision = calc_cubic_precision(src);
        if (dPtMagnitude < precision) {
            // All three max curvature t values may be close to the cusp;
            // return the first one.
            return testT;
        }
    }
    return -1;
}

function close_enough_to_zero( x) {
    return Math.abs(x) < 0.00001;
}

function first_axis_intersection(const double coefficients[8], bool yDirection,
                                    double axisIntercept, double* solution) {
    auto [A, B, C, D] = SkBezierCubic::ConvertToPolynomial(coefficients, yDirection);
    D -= axisIntercept;
    double roots[3] = {0, 0, 0};
    int count = SkCubics::RootsValidT(A, B, C, D, roots);
    if (count == 0) {
        return false;
    }
    // Ver.y that at least one of the roots is accurate.
    for (let i = 0; i < count; i++) {
        if (close_enough_to_zero(SkCubics::EvalAt(A, B, C, D, roots[i]))) {
            *solution = roots[i];
            return true;
        }
    }
    // None of the roots returned by our normal cubic solver were correct enough
    // (e.g. https://bugs.chromium.org/p/oss-fuzz/issues/detail?id=55732)
    // So we need to fallback to a more accurate solution.
    count = SkCubics::BinarySearchRootsValidT(A, B, C, D, roots);
    if (count == 0) {
        return false;
    }
    for (let i = 0; i < count; i++) {
        if (close_enough_to_zero(SkCubics::EvalAt(A, B, C, D, roots[i]))) {
            *solution = roots[i];
            return true;
        }
    }
    return false;
}

bool SkChopMonoCubicAtY(src:Point[], y:number, dst:Point[]) {
    double coefficients[8] = {src[0].x, src[0].y, src[1].x, src[1].y,
                              src[2].x, src[2].y, src[3].x, src[3].y};
    double solution = 0;
    if (first_axis_intersection(coefficients, true, y, &solution)) {
        double cubicPair[14];
        SkBezierCubic::Subdivide(coefficients, solution, cubicPair);
        for (let i = 0; i < 7; i ++) {
            dst[i].x = sk_double_to_float(cubicPair[i*2]);
            dst[i].y = sk_double_to_float(cubicPair[i*2 + 1]);
        }
        return true;
    }
    return false;
}

bool SkChopMonoCubicAtX(src:Point[], x:number, dst:Point[]) {
    double coefficients[8] = {src[0].x, src[0].y, src[1].x, src[1].y,
                                  src[2].x, src[2].y, src[3].x, src[3].y};
    double solution = 0;
    if (first_axis_intersection(coefficients, false, x, &solution)) {
        double cubicPair[14];
        SkBezierCubic::Subdivide(coefficients, solution, cubicPair);
        for (let i = 0; i < 7; i ++) {
            dst[i].x = sk_double_to_float(cubicPair[i*2]);
            dst[i].y = sk_double_to_float(cubicPair[i*2 + 1]);
        }
        return true;
    }
    return false;
}

///////////////////////////////////////////////////////////////////////////////
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
function conic_deriv_coeff(src:number[],
                              w:number,
                               coeff:number[]) {
    let  P20 = src[4] - src[0];
    let  P10 = src[2] - src[0];
    let  wP10 = w * P10;
    coeff[0] = w * P20 - P20;
    coeff[1] = P20 - 2 * wP10;
    coeff[2] = wP10;
}

function conic_find_extrema(src:number[], w:number, SkScalar* t) {
    let coeff=[];
    conic_deriv_coeff(src, w, coeff);

    let tValues=[];
    let roots = SkFindUnitQuadRoots(coeff[0], coeff[1], coeff[2], tValues);
    

    if (1 == roots) {
        t = tValues[0];
        return true;
    }
    return false;
}

// We only interpolate one dimension at a time (the first, at +0, +3, +6).
function p3d_interp(src:number[], dst:number[], t:number) {
    let ab = SkScalarInterp(src[0], src[3], t);
    let bc = SkScalarInterp(src[3], src[6], t);
    dst[0] = ab;
    dst[3] = SkScalarInterp(ab, bc, t);
    dst[6] = bc;
}

function ratquad_mapTo3D(src:Point[], w:number,  dst:Point[]) {
    dst[0].set(src[0].x * 1, src[0].y * 1, 1);
    dst[1].set(src[1].x * w, src[1].y * w, w);
    dst[2].set(src[2].x * 1, src[2].y * 1, 1);
}

function project_down(src:Point) {
    return {src.x / src.z, src.y / src.z};
}

// return false if infinity or NaN is generated; caller must check
function chopAt(t:number,  dst)  {
    SkPoint3 tmp[3], tmp2[3];

    ratquad_mapTo3D(fPts, fW, tmp);

    p3d_interp(&tmp[0].x, &tmp2[0].x, t);
    p3d_interp(&tmp[0].y, &tmp2[0].y, t);
    p3d_interp(&tmp[0].fZ, &tmp2[0].fZ, t);

    dst[0].fPts[0] = fPts[0];
    dst[0].fPts[1] = project_down(tmp2[0]);
    dst[0].fPts[2] = project_down(tmp2[1]); dst[1].fPts[0] = dst[0].fPts[2];
    dst[1].fPts[1] = project_down(tmp2[2]);
    dst[1].fPts[2] = fPts[2];

    // to put in "standard form", where w0 and w2 are both 1, we compute the
    // new w1 as sqrt(w1*w1/w0*w2)
    // or
    // w1 /= sqrt(w0*w2)
    //
    // However, in our case, we know that for dst[0]:
    //     w0 == 1, and for dst[1], w2 == 1
    //
    let root = SkScalarSqrt(tmp2[1].fZ);
    dst[0].fW = tmp2[0].fZ / root;
    dst[1].fW = tmp2[2].fZ / root;
    
    
    return SkScalarsAreFinite(&dst[0].fPts[0].x, 7 * 2);
}

void SkConic::chopAt(SkScalar t1, SkScalar t2, SkConic* dst) const {
    if (0 == t1 || 1 == t2) {
        if (0 == t1 && 1 == t2) {
            *dst = *this;
            return;
        } else {
            SkConic pair[2];
            if (this.chopAt(t1 ? t1 : t2, pair)) {
                *dst = pair[SkToBool(t1)];
                return;
            }
        }
    }
    SkConicCoeff coeff(*this);
    let tt1(t1);
    let aXY = coeff.fNumer.eval(tt1);
    let aZZ = coeff.fDenom.eval(tt1);
    let midTT((t1 + t2) / 2);
    let dXY = coeff.fNumer.eval(midTT);
    let dZZ = coeff.fDenom.eval(midTT);
    let tt2(t2);
    let cXY = coeff.fNumer.eval(tt2);
    let cZZ = coeff.fDenom.eval(tt2);
    let bXY = times_2(dXY) - (aXY + cXY) * 0.5f;
    let bZZ = times_2(dZZ) - (aZZ + cZZ) * 0.5f;
    dst.fPts[0] = to_point(aXY / aZZ);
    dst.fPts[1] = to_point(bXY / bZZ);
    dst.fPts[2] = to_point(cXY / cZZ);
    let ww = bZZ / sqrt(aZZ * cZZ);
    dst.fW = ww[0];
}

SkPoint SkConic::evalAt(t:number) const {
    return to_point(SkConicCoeff(*this).eval(t));
}

SkVector SkConic::evalTangentAt(t:number) const {
    // The derivative equation returns a zero tangent vector when t is 0 or 1,
    // and the control point is equal to the end point.
    // In this case, use the conic endpoints to compute the tangent.
    if ((t == 0 && fPts[0] == fPts[1]) || (t == 1 && fPts[1] == fPts[2])) {
        return fPts[2] - fPts[0];
    }
    let p0 = from_point(fPts[0]);
    let p1 = from_point(fPts[1]);
    let p2 = from_point(fPts[2]);
    let ww(fW);

    let p20 = p2 - p0;
    let p10 = p1 - p0;

    let C = ww * p10;
    let A = ww * p20 - p20;
    let B = p20 - C - C;

    return to_vector(SkQuadCoeff(A, B, C).eval(t));
}

void SkConic::evalAt(t:number, SkPoint* pt, tangent:Point) const {
    

    if (pt) {
        *pt = this.evalAt(t);
    }
    if (tangent) {
        *tangent = this.evalTangentAt(t);
    }
}

static SkScalar subdivide_w_value(w:number) {
    return SkScalarSqrt(SK_ScalarHalf + w * SK_ScalarHalf);
}

#if defined(SK_SUPPORT_LEGACY_CONIC_CHOP)
void SkConic::chop(SkConic * SK_RESTRICT dst) const {
    let scale = SkScalarInvert(SK_Scalar1 + fW);
    let newW = subdivide_w_value(fW);

    let p0 = from_point(fPts[0]);
    let p1 = from_point(fPts[1]);
    let p2 = from_point(fPts[2]);
    let ww(fW);

    let wp1 = ww * p1;
    let m = (p0 + times_2(wp1) + p2) * scale * 0.5f;
    SkPoint mPt = to_point(m);
    if (!mPt.isFinite()) {
        double w_d = fW;
        double w_2 = w_d * 2;
        double scale_half = 1 / (1 + w_d) * 0.5;
        mPt.x = SkDoubleToScalar((fPts[0].x + w_2 * fPts[1].x + fPts[2].x) * scale_half);
        mPt.y = SkDoubleToScalar((fPts[0].y + w_2 * fPts[1].y + fPts[2].y) * scale_half);
    }
    dst[0].fPts[0] = fPts[0];
    dst[0].fPts[1] = to_point((p0 + wp1) * scale);
    dst[0].fPts[2] = dst[1].fPts[0] = mPt;
    dst[1].fPts[1] = to_point((wp1 + p2) * scale);
    dst[1].fPts[2] = fPts[2];

    dst[0].fW = dst[1].fW = newW;
}
#else
void SkConic::chop(SkConic * SK_RESTRICT dst) const {

    // Observe that scale will always be smaller than 1 because fW > 0.
    const float scale = SkScalarInvert(SK_Scalar1 + fW);

    // The subdivided control points below are the sums of the following three terms. Because the
    // terms are multiplied by something <1, and the resulting control points lie within the
    // control points of the original then the terms and the sums below will not overflow. Note
    // that fW * scale approaches 1 as fW becomes very large.
    let t0 = from_point(fPts[0]) * scale;
    let t1 = from_point(fPts[1]) * (fW * scale);
    let t2 = from_point(fPts[2]) * scale;

    // Calculate the subdivided control points
    const SkPoint p1 = to_point(t0 + t1);
    const SkPoint p3 = to_point(t1 + t2);

    // p2 = (t0 + 2*t1 + t2) / 2. Divide the terms by 2 before the sum to keep the sum for p2
    // from overflowing.
    const SkPoint p2 = to_point(0.5f * t0 + t1 + 0.5f * t2);

    

    dst[0].fPts[0] = fPts[0];
    dst[0].fPts[1] = p1;
    dst[0].fPts[2] = p2;
    dst[1].fPts[0] = p2;
    dst[1].fPts[1] = p3;
    dst[1].fPts[2] = fPts[2];

    // Update w.
    dst[0].fW = dst[1].fW = subdivide_w_value(fW);
}
#endif  // SK_SUPPORT_LEGACY_CONIC_CHOP

/*
 *  "High order approximation of conic sections by quadratic splines"
 *      by Michael Floater, 1993
 */
#define AS_QUAD_ERROR_SETUP                                         \
    let a = fW - 1;                                            \
    let k = a / (4 * (2 + a));                                 \
    let x = k * (fPts[0].x - 2 * fPts[1].x + fPts[2].x);    \
    let y = k * (fPts[0].y - 2 * fPts[1].y + fPts[2].y);

void SkConic::computeAsQuadError(SkVector* err) const {
    AS_QUAD_ERROR_SETUP
    err.set(x, y);
}

bool SkConic::asQuadTol(tol:number) const {
    AS_QUAD_ERROR_SETUP
    return (x * x + y * y) <= tol * tol;
}

// Limit the number of suggested quads to approximate a conic
#define kMaxConicToQuadPOW2     5

int SkConic::computeQuadPOW2(tol:number) const {
    if (tol < 0 || !SkScalarIsFinite(tol) || !SkPointPriv::AreFinite(fPts, 3)) {
        return 0;
    }

    AS_QUAD_ERROR_SETUP

    let error = SkScalarSqrt(x * x + y * y);
    int pow2;
    for (pow2 = 0; pow2 < kMaxConicToQuadPOW2; ++pow2) {
        if (error <= tol) {
            break;
        }
        error *= 0.25f;
    }
    // float version -- using ceil gives the same results as the above.
    if ((false)) {
        let err = SkScalarSqrt(x * x + y * y);
        if (err <= tol) {
            return 0;
        }
        SkScalar tol2 = tol * tol;
        if (tol2 == 0) {
            return kMaxConicToQuadPOW2;
        }
        SkScalar fpow2 = SkScalarLog2((x * x + y * y) / tol2) * 0.25f;
        int altPow2 = SkScalarCeilToInt(fpow2);
        if (altPow2 != pow2) {
            SkDebugf("pow2 %d altPow2 %d fbits %g err %g tol %g\n", pow2, altPow2, fpow2, err, tol);
        }
        pow2 = altPow2;
    }
    return pow2;
}

// This was originally developed and tested for pathops: see SkOpTypes.h
// returns true if (a <= b <= c) || (a >= b >= c)
function between(a:number, b:number, c:number) {
    return (a - b) * (c - b) <= 0;
}

static SkPoint* subdivide(const SkConic& src, SkPoint pts[], int level) {
    

    if (0 == level) {
        memcpy(pts, &src.fPts[1], 2 * sizeof(SkPoint));
        return pts + 2;
    } else {
        SkConic dst[2];
        src.chop(dst);
        const let startY = src.fPts[0].y;
        let endY = src.fPts[2].y;
        if (between(startY, src.fPts[1].y, endY)) {
            // If the input is monotonic and the output is not, the scan converter hangs.
            // Ensure that the chopped conics maintain their y-order.
            let midY = dst[0].fPts[2].y;
            if (!between(startY, midY, endY)) {
                // If the computed midpoint is outside the ends, move it to the closer one.
                let closerY = SkTAbs(midY - startY) < SkTAbs(midY - endY) ? startY : endY;
                dst[0].fPts[2].y = dst[1].fPts[0].y = closerY;
            }
            if (!between(startY, dst[0].fPts[1].y, dst[0].fPts[2].y)) {
                // If the 1st control is not between the start and end, put it at the start.
                // This also reduces the quad to a line.
                dst[0].fPts[1].y = startY;
            }
            if (!between(dst[1].fPts[0].y, dst[1].fPts[1].y, endY)) {
                // If the 2nd control is not between the start and end, put it at the end.
                // This also reduces the quad to a line.
                dst[1].fPts[1].y = endY;
            }
            // Ver.y that all five points are in order.
            
            
            
        }
        --level;
        pts = subdivide(dst[0], pts, level);
        return subdivide(dst[1], pts, level);
    }
}

int SkConic::chopIntoQuadsPOW2(SkPoint pts[], int pow2) const {
    
    *pts = fPts[0];
    SkDEBUGCODE(SkPoint* endPts);
    if (pow2 == kMaxConicToQuadPOW2) {  // If an extreme weight generates many quads ...
        SkConic dst[2];
        this.chop(dst);
        // check to see if the first chop generates a pair of lines
        if (SkPointPriv::EqualsWithinTolerance(dst[0].fPts[1], dst[0].fPts[2]) &&
                SkPointPriv::EqualsWithinTolerance(dst[1].fPts[0], dst[1].fPts[1])) {
            pts[1] = pts[2] = pts[3] = dst[0].fPts[1];  // set ctrl == end to make lines
            pts[4] = dst[1].fPts[2];
            pow2 = 1;
            SkDEBUGCODE(endPts = &pts[5]);
            goto commonFinitePtCheck;
        }
    }
    SkDEBUGCODE(endPts = ) subdivide(*this, pts + 1, pow2);
commonFinitePtCheck:
    const int quadCount = 1 << pow2;
    const int ptCount = 2 * quadCount + 1;
    
    if (!SkPointPriv::AreFinite(pts, ptCount)) {
        // if we generated a non-finite, pin ourselves to the middle of the hull,
        // as our first and last are already on the first/last pts of the hull.
        for (let i = 1; i < ptCount - 1; ++i) {
            pts[i] = fPts[1];
        }
    }
    return 1 << pow2;
}

float SkConic::findMidTangent() const {
    // Tangents point in the direction of increasing T, so tan0 and -tan1 both point toward the
    // midtangent. The bisector of tan0 and -tan1 is orthogonal to the midtangent:
    //
    //     bisector dot midtangent = 0
    //
    SkVector tan0 = fPts[1] - fPts[0];
    SkVector tan1 = fPts[2] - fPts[1];
    SkVector bisector = SkFindBisector(tan0, -tan1);

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
    SkVector A = (fPts[2] - fPts[0]) * (fW - 1);
    SkVector B = (fPts[2] - fPts[0]) - (fPts[1] - fPts[0]) * (fW*2);
    SkVector C = (fPts[1] - fPts[0]) * fW;

    // Now solve for "bisector dot midtangent = 0":
    //
    //                            |T^2|
    //     bisector * |A  B  C| * |T  | = 0
    //                |.  .  .|   |1  |
    //
    float a = bisector.dot(A);
    float b = bisector.dot(B);
    float c = bisector.dot(C);
    return solve_quadratic_equation_for_midtangent(a, b, c);
}

bool SkConic::findXExtrema(SkScalar* t) const {
    return conic_find_extrema(&fPts[0].x, fW, t);
}

bool SkConic::findYExtrema(SkScalar* t) const {
    return conic_find_extrema(&fPts[0].y, fW, t);
}

bool SkConic::chopAtXExtrema(SkConic dst[2]) const {
    SkScalar t;
    if (this.findXExtrema(&t)) {
        if (!this.chopAt(t, dst)) {
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

bool SkConic::chopAtYExtrema(SkConic dst[2]) const {
    SkScalar t;
    if (this.findYExtrema(&t)) {
        if (!this.chopAt(t, dst)) {
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

void SkConic::computeTightBounds(SkRect* bounds) const {
    SkPoint pts[4];
    pts[0] = fPts[0];
    pts[1] = fPts[2];
    int count = 2;

    SkScalar t;
    if (this.findXExtrema(&t)) {
        this.evalAt(t, &pts[count++]);
    }
    if (this.findYExtrema(&t)) {
        this.evalAt(t, &pts[count++]);
    }
    bounds.setBounds(pts, count);
}

void SkConic::computeFastBounds(SkRect* bounds) const {
    bounds.setBounds(fPts, 3);
}

#if 0  // unimplemented
bool SkConic::findMaxCurvature(SkScalar* t) const {
    // TODO: Implement me
    return false;
}
#endif

SkScalar SkConic::TransformW(const SkPoint pts[3], w:number, const SkMatrix& matrix) {
    if (!matrix.hasPerspective()) {
        return w;
    }

    SkPoint3 src[3], dst[3];

    ratquad_mapTo3D(pts, w, src);

    matrix.mapHomogeneousPoints(dst, src, 3);

    // w' = sqrt(w1*w1/w0*w2)
    // use doubles temporarily, to handle small numer/denom
    double w0 = dst[0].fZ;
    double w1 = dst[1].fZ;
    double w2 = dst[2].fZ;
    return sk_double_to_float(sqrt(sk_ieee_double_divide(w1 * w1, w0 * w2)));
}

int SkConic::BuildUnitArc(const SkVector& uStart, const SkVector& uStop, SkRotationDirection dir,
                          const SkMatrix* userMatrix, SkConic dst[kMaxConicsForArc]) {
    // rotate by x,y so that uStart is (1.0)
    let x = SkPoint::DotProduct(uStart, uStop);
    let y = SkPoint::CrossProduct(uStart, uStop);

    let absY = SkScalarAbs(y);

    // check for (effectively) coincident vectors
    // this can happen if our angle is nearly 0 or nearly 180 (y == 0)
    // ... we use the dot-prod to distinguish between 0 and 180 (x > 0)
    if (absY <= SK_ScalarNearlyZero && x > 0 && ((y >= 0 && kCW_SkRotationDirection == dir) ||
                                                 (y <= 0 && kCCW_SkRotationDirection == dir))) {
        return 0;
    }

    if (dir == kCCW_SkRotationDirection) {
        y = -y;
    }

    // We decide to use 1-conic per quadrant of a circle. What quadrant does [xy] lie in?
    //      0 == [0  .. 90)
    //      1 == [90 ..180)
    //      2 == [180..270)
    //      3 == [270..360)
    //
    int quadrant = 0;
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

    const SkPoint quadrantPts[] = {
        { 1, 0 }, { 1, 1 }, { 0, 1 }, { -1, 1 }, { -1, 0 }, { -1, -1 }, { 0, -1 }, { 1, -1 }
    };
    const let quadrantWeight = SK_ScalarRoot2Over2;

    int conicCount = quadrant;
    for (let i = 0; i < conicCount; ++i) {
        dst[i].set(&quadrantPts[i * 2], quadrantWeight);
    }

    // Now compute any remaing (sub-90-degree) arc for the last conic
    const SkPoint finalP = { x, y };
    const SkPoint& lastQ = quadrantPts[quadrant * 2];  // will already be a unit-vector
    const let dot = SkVector::DotProduct(lastQ, finalP);
    

    if (dot < 1) {
        SkVector offCurve = { lastQ.x() + x, lastQ.y() + y };
        // compute the bisector vector, and then rescale to be the off-curve point.
        // we compute its length from cos(theta/2) = length / 1, using half-angle identity we get
        // length = sqrt(2 / (1 + cos(theta)). We already have cos() when to computed the dot.
        // This is nice, since our computed weight is cos(theta/2) as well!
        //
        let  cosThetaOver2 = SkScalarSqrt((1 + dot) / 2);
        offCurve.setLength(SkScalarInvert(cosThetaOver2));
        if (!SkPointPriv::EqualsWithinTolerance(lastQ, offCurve)) {
            dst[conicCount].set(lastQ, offCurve, finalP, cosThetaOver2);
            conicCount += 1;
        }
    }

    // now handle counter-clockwise and the initial unitStart rotation
    SkMatrix    matrix;
    matrix.setSinCos(uStart.y, uStart.x);
    if (dir == kCCW_SkRotationDirection) {
        matrix.preScale(SK_Scalar1, -SK_Scalar1);
    }
    if (userMatrix) {
        matrix.postConcat(*userMatrix);
    }
    for (let i = 0; i < conicCount; ++i) {
        matrix.mapPoints(dst[i].fPts, 3);
    }
    return conicCount;
}
