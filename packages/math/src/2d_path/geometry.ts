import { Vector2 } from "../math/vec2";
import { Vector3 } from '../math/vec3'
import { BoundingRect } from '../math/bounding_rect'
import { Matrix2D } from "../math/mat2d";
import { RotationDirection } from './type'
import { interpolate } from '../math/math'



const kMaxConicsForArc = 5
const kMaxConicToQuadPOW2 = 5
function subdivide_w_value(w: number) {
    return Math.sqrt(0.5 + w * 0.5);
}
function project_down(src: Vector3) {
    return Vector2.create(src.x / src.z, src.y / src.z);
}
// We only interpolate one dimension at a time (the first, at +0, +3, +6).
function p3d_interp(axis: 'x' | 'y' | 'z', src: Vector3[], dst: Vector3[], t: number) {
    let ab = interpolate(src[0][axis], src[3][axis], t);
    let bc = interpolate(src[3][axis], src[6][axis], t);
    dst[0][axis] = ab;
    dst[3][axis] = interpolate(ab, bc, t);
    dst[6][axis] = bc;
}
function ratquad_mapTo3D(src: Vector2[], w: number, dst: Vector3[]) {
    dst[0].set(src[0].x * 1, src[0].y * 1, 1);
    dst[1].set(src[1].x * w, src[1].y * w, w);
    dst[2].set(src[2].x * 1, src[2].y * 1, 1);
}

function findBisector(a: Vector2, b: Vector2) {
    // std::array<SkVector, 2> v;
    let v = Vector2.makeZeroArray(2)
    if (a.dot(b) >= 0) {
        // a,b are within +/-90 degrees apart.
        v = [a, b]
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
    let x0_x1 = Vector2.create(v[0].x, v[1].x);
    let y0_y1 = Vector2.create(v[0].y, v[1].y);
    let invLengths = 1.0 / Math.sqrt(x0_x1.dot(x0_x1) + y0_y1.dot(y0_y1));
    x0_x1.multiplyScalar(invLengths);
    y0_y1.multiplyScalar(invLengths);
    return Vector2.create(x0_x1.x + x0_x1.y, y0_y1.x + y0_y1.y);
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
export function findCubicInflections(src:Vector2[],tValues:number[]) {
    let    Ax = src[1].x - src[0].x;
    let    Ay = src[1].y - src[0].y;
    let    Bx = src[2].x - 2 * src[1].x + src[0].x;
    let    By = src[2].y - 2 * src[1].y + src[0].y;
    let    Cx = src[3].x + 3 * (src[1].x - src[2].x) - src[0].x;
    let    Cy = src[3].y + 3 * (src[1].y - src[2].y) - src[0].y;

    return findUnitQuadRoots(Bx*Cy - By*Cx,
                               Ax*Cy - Ay*Cx,
                               Ax*By - Ay*Bx,
                               tValues);
}
function findQuadMidTangent(src: Vector2[]) {
    // Tangents point in the direction of increasing T, so tan0 and -tan1 both point toward the
    // midtangent. The bisector of tan0 and -tan1 is orthogonal to the midtangent:
    //
    //     n dot midtangent = 0
    //
    let tan0 = src[1].clone().subtract(src[0]);
    let tan1 = src[2].clone().subtract(src[1]);
    let bisector = findBisector(tan0, tan1.clone().negate());

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
    let T = tan0.dot(bisector) / tan0.clone().subtract(tan1).dot(bisector);
    if (!(T > 0 && T < 1)) {  // Use "!(positive_logic)" so T=nan will take this branch.
        T = .5;  // The quadratic was a line or near-line. Just chop at .5.
    }

    return T;
}

function valid_unit_divide(numer: number, denom: number, ratio: { value: number } | number[]|Float32Array) {

    if (numer < 0) {
        numer = -numer;
        denom = -denom;
    }

    if (denom == 0 || numer == 0 || numer >= denom) {
        return 0;
    }

    let r = numer / denom;
    if (Number.isNaN(r)) {
        return 0;
    }
    // SkASSERTF(r >= 0 && r < SK_Scalar1, "numer %f, denom %f, r %f", numer, denom, r);
    if (r == 0) { // catch underflow if numer <<<< denom
        return 0;
    }

    if (Array.isArray(ratio)) {
        ratio[0] = r
    } else {
        (ratio as any).value = r
    }
    return 1;
}
/** Quad'(t) = At + B, where
    A = 2(a - 2b + c)
    B = 2(b - a)
    Solve for t, only if it fits between 0 < t < 1
*/
export function findQuadExtrema(a: number, b: number, c: number, tValue: { value: number }) {
    /*  At + B == 0
        t = -B / A
    */
    return valid_unit_divide(a - b, a - b - b + c, tValue);
}
/**
 * 返回 x 的绝对值，但符号与 y 相同
 * @param {number} x - 数值
 * @param {number} y - 用于决定符号的数值
 * @returns {number} x 的绝对值，但符号与 y 相同
 */
function copysign(x: number, y: number) {
    // 利用 1/y 来判断 y 的符号：对于 -0，1/y === -Infinity
    return Math.abs(x) * ((1 / y === -Infinity) ? -1 : 1);
}



function solve_quadratic_equation_for_midtangent(a: number, b: number, c: number, discr?: number) {
    if (discr === undefined) {
        discr = b * b - 4 * a * c;
    }
    // Quadratic formula from Numerical Recipes in C:
    let q = -.5 * (b + copysign(Math.sqrt(discr), b));
    // The roots are q/a and c/q. Pick the midtangent closer to T=.5.
    let _5qa = -.5 * q * a;
    let T = Math.abs(q * q + _5qa) < Math.abs(a * c + _5qa) ? (q / a)
        : (c / q);
    if (!(T > 0 && T < 1)) {  // Use "!(positive_logic)" so T=NaN will take this branch.
        // Either the curve is a flat line with no rotation or FP precision failed us. Chop at .5.
        T = .5;
    }
    return T;
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
function conic_deriv_coeff(src: number[], w: number, coeff: number[] | Float32Array) {
    const P20 = src[4] - src[0];
    const P10 = src[2] - src[0];
    const wP10 = w * P10;
    coeff[0] = w * P20 - P20;
    coeff[1] = P20 - 2 * wP10;
    coeff[2] = wP10;
}

export function conic_find_extrema(src: number[], w: number, t: number[] | Float32Array) {
    let coeff = new Float32Array(3)
    conic_deriv_coeff(src, w, coeff);

    let tValues = new Float32Array(2);
    let roots = findUnitQuadRoots(coeff[0], coeff[1], coeff[2], tValues);
    //SkASSERT(0 == roots || 1 == roots);

    if (1 == roots) {
        t[0]=tValues[0]
        t[1]=tValues[1]
        return true;
    }
    return false;
}


function return_check_zero(value: number) {
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
export function findUnitQuadRoots(A: number, B: number, C: number, roots: number[] | Float32Array) {

    if (A == 0) {
        return return_check_zero(valid_unit_divide(-C, B, roots));
    }

    let r = roots.slice();
    let rIndex = 0

    // use doubles so we don't overflow temporarily trying to compute R
    let dr = B * B - 4 * A * C;
    if (dr < 0) {
        return return_check_zero(0);
    }
    dr = Math.sqrt(dr);
    let R = (dr);
    if (!Number.isFinite(R)) {
        return return_check_zero(0);
    }

    let Q = (B < 0) ? -(B - R) / 2 : -(B + R) / 2;
    let ref = { value: r[rIndex] }
    let prev_rIndex = rIndex
    rIndex += valid_unit_divide(Q, A, ref);
    r[prev_rIndex] = ref.value
    ref = { value: r[rIndex] }
    prev_rIndex = rIndex
    rIndex += valid_unit_divide(C, Q, ref);
    r[prev_rIndex] = ref.value
    if (rIndex == 2) {
        if (roots[0] > roots[1]) {
            let tmp = roots[0]
            roots[0] = roots[1]
            roots[1] = tmp
        } else if (roots[0] == roots[1]) { // nearly-equal?
            rIndex -= 1; // skip the double root
        }
    }
    return return_check_zero((r[rIndex] - roots[0]));
}

const SK_Scalar1=1
const SK_ScalarNearlyZero=        (SK_Scalar1 / (1 << 12))
function scalarCubeRoot( x:number) {
    return Math.pow(x, 0.3333333);
}
function scalarNearlyZero( x:number,
     tolerance = SK_ScalarNearlyZero) {

return Math.abs(x) <= tolerance;
}
function clamp(value:number, min:number, max:number) {
    return Math.max(min, Math.min(value, max));
}
function bubble_sort<T=any>(array:T[]|Float32Array, count:number) {
    for (let i = count - 1; i > 0; --i)
        for (let j = i; j > 0; --j)
            if (array[j] < array[j-1])
            {
                let   tmp=array[j];
                array[j] = array[j-1];
                array[j-1] = tmp;
            }
}
/**
 *  Given an array and count, remove all pair-wise duplicates from the array,
 *  keeping the existing sorting, and return the new count
 */
function collaps_duplicates(array:number[]|Float32Array,  count:number) {
    let index=0
    for (let n = count; n > 1; --n) {
        if (array[index] == array[index+1]) {
            for (let i = 1; i < n; ++i) {
                array[index+i - 1] = array[index+i];
            }
            count -= 1;
        } else {
            index += 1;
        }
    }
    return count;
}

/*  Solve coeff(t) == 0, returning the number of roots that
    lie withing 0 < t < 1.
    coeff[0]t^3 + coeff[1]t^2 + coeff[2]t + coeff[3]

    Eliminates repeated roots (so that all tValues are distinct, and are always
    in increasing order.
*/
function solve_cubic_poly(coeff:number[]|Float32Array, tValues:number[]|Float32Array):number {
    if (scalarNearlyZero(coeff[0])) {  // we're just a quadratic
        return findUnitQuadRoots(coeff[1], coeff[2], coeff[3], tValues);
    }

    let a, b, c, Q, R;

    {
        let inva = 1/(coeff[0]);
        a = coeff[1] * inva;
        b = coeff[2] * inva;
        c = coeff[3] * inva;
    }
    Q = (a*a - b*3) / 9;
    R = (2*a*a*a - 9*a*b + 27*c) / 54;

    let Q3 = Q * Q * Q;
    let R2MinusQ3 = R * R - Q3;
    let adiv3 = a / 3;

    if (R2MinusQ3 < 0) { // we have 3 real roots
        // the divide/root can, due to finite precisions, be slightly outside of -1...1
        let theta = Math.cos(clamp(R / Math.sqrt(Q3), -1.0, 1.0));
        let neg2RootQ = -2 * Math.sqrt(Q);

        tValues[0] = clamp(neg2RootQ * Math.cos(theta/3) - adiv3, 0.0, 1.0);
        tValues[1] = clamp(neg2RootQ * Math.cos((theta + 2*Math.PI)/3) - adiv3, 0.0, 1.0);
        tValues[2] = clamp(neg2RootQ * Math.cos((theta - 2*Math.PI)/3) - adiv3, 0.0, 1.0);
       
        // now sort the roots
        bubble_sort(tValues, 3);
        return collaps_duplicates(tValues, 3);
    } else {              // we have 1 real root
        let A = Math.abs(R) + Math.sqrt(R2MinusQ3);
        A = scalarCubeRoot(A);
        if (R > 0) {
            A = -A;
        }
        if (A != 0) {
            A += Q / A;
        }
        tValues[0] = clamp(A - adiv3, 0.0, 1.0);
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
function formulate_F1DotF2(src:number[], coeff:number[]|Float32Array) {
    let    a = src[2] - src[0];
    let    b = src[4] - 2 * src[2] + src[0];
    let    c = src[6] + 3 * (src[2] - src[4]) - src[0];

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
export function findCubicMaxCurvature(src:Vector2[],tValues:number[]|Float32Array):number {
    let coeffX=new Float32Array(4), coeffY=new Float32Array(4);
    let      i;

    formulate_F1DotF2(src.map(d=>d.x), coeffX);
    formulate_F1DotF2(src.map(d=>d.y), coeffY);

    for (i = 0; i < 4; i++) {
        coeffX[i] += coeffY[i];
    }

    let numRoots = solve_cubic_poly(coeffX, tValues);
    // now remove extrema where the curvature is zero (mins)
    // !!!! need a test for this !!!!
    return numRoots;
}

function SkChopCubicAtMaxCurvature(src:Vector2[],  dst:Vector2[],
                               tValues:number[]) {
    let    t_storage=new Float32Array(3);

    // if (tValues) {
    //     tValues = t_storage;
    // }

    let roots=new Float32Array(3);
    let rootCount = findCubicMaxCurvature(src, roots);

    // Throw out values not inside 0..1.
    let count = 0;
    for (let i = 0; i < rootCount; ++i) {
        if (0 < roots[i] && roots[i] < 1) {
            tValues[count++] = roots[i];
        }
    }

    if (dst) {
        if (count == 0) {
            copyVector2Array(dst,src)
        } else {
            chopCubicAt(src, dst, tValues, count);
        }
    }
    return count + 1;
}
function copyVector2Array(dst:Vector2[], src:Vector2[]){
    src.forEach((d,i)=>{
        if(dst[i]){
            dst[i].copy(d)
        }else{
            dst[i]=d.clone()
        }
    })
}

function chopCubicAt(src:Vector2[],dst:Vector2[], t0:number|number[],t1?:number){
    if(arguments.length==3){
        chopCubicAt3(src,dst,t0 as number)
    }else if(Array.isArray(t0)){
        chopCubicAtArray(src,dst,t0,t1 as number)
    }else{
        chopCubicAt4(src,dst,t0,t1 as number)
    }
}
function chopCubicAt3(src:Vector2[],dst:Vector2[], t:number) {
  
    if (t == 1) {
        copyVector2Array(dst,src)
       // dst[4] = dst[5] = dst[6] = src[3];
        dst[4]=src[3].clone()
        dst[5]=src[3].clone()
        dst[6]=src[3].clone()
        return;
    }

    let p0 = Vector2.from(src[0]);
    let p1 = Vector2.from(src[1]);
    let p2 = Vector2.from(src[2]);
    let p3 = Vector2.from(src[3]);
    let T=t
    let ab =p0.clone().interpolateVectors(p0,p1,T);
    let bc = p1.clone().interpolateVectors(p1, p2, T);
    let cd = p2.clone().interpolateVectors(p2, p3, T);
    let abc = ab.clone().interpolateVectors(ab, bc, T);
    let bcd = bc.clone().interpolateVectors(bc, cd, T);
    let abcd = abc.clone().interpolateVectors(abc, bcd, T);

    dst[0] = Vector2.from(p0);
    dst[1] = Vector2.from(ab);
    dst[2] = Vector2.from(abc);
    dst[3] = Vector2.from(abcd);
    dst[4] = Vector2.from(bcd);
    dst[5] = Vector2.from(cd);
    dst[6] = Vector2.from(p3);
}

function chopCubicAt4(src:Vector2[],dst:Vector2[], t0:number,t1:number) {
  
    if (t1 == 1) {
        chopCubicAt(src, dst, t0);
        //dst[7] = dst[8] = dst[9] = src[3];
        dst[7]=src[3].clone()
        dst[8]=src[3].clone()
        dst[9]=src[3].clone()
        return;
    }
    function vec4(){
        return {lo:Vector2.default(),hi:Vector2.default()}
    }
    // Perform both chops in parallel using 4-lane SIMD.
    let p00=vec4(), p11=vec4(), p22=vec4(), p33=vec4(), T=vec4();
    p00.lo.copy(src[0])
    p00.hi.copy(src[0])
    p11.lo.copy(src[1])
    p11.hi.copy(src[1])
    p22.lo.copy(src[2])
    p22.hi.copy(src[2])
    p33.lo.copy(src[3])
    p33.hi.copy(src[4])

    T.lo.set(t0,t0)
    T.hi.set(t1,t1)

    let ab=vec4(), bc=vec4(), cd=vec4(), abc=vec4(), bcd=vec4(), abcd=vec4(),middle=vec4()
    ab.lo=p00.lo.clone().interpolatesVectors(p00.lo, p11.lo,T.lo)
    ab.hi=p00.hi.clone().interpolatesVectors(p00.hi, p11.hi,T.hi)

    bc.lo=p11.lo.clone().interpolatesVectors(p11.lo, p22.lo,T.lo)
    bc.hi=p11.hi.clone().interpolatesVectors(p11.hi, p22.hi,T.hi)

    cd.lo=p22.lo.clone().interpolatesVectors(p22.lo, p33.lo,T.lo)
    cd.hi=p22.hi.clone().interpolatesVectors(p22.hi, p33.hi,T.hi)

    
    abc.lo=ab.lo.clone().interpolatesVectors(ab.lo, bc.lo,T.lo)
    abc.hi=ab.hi.clone().interpolatesVectors(ab.hi, bc.hi,T.hi)


    bcd.lo=ab.lo.clone().interpolatesVectors(bc.lo, cd.lo,T.lo)
    bcd.hi=ab.hi.clone().interpolatesVectors(bc.hi, cd.hi,T.hi)

    middle.lo=abc.lo.clone().interpolatesVectors(abc.lo, cd.lo,T.hi)
    middle.hi=abc.hi.clone().interpolatesVectors(abc.hi, cd.hi,T.lo)

 
    dst[0] = Vector2.from(p00.lo);
    dst[1] = Vector2.from(ab.lo);
    dst[2] = Vector2.from(abc.lo);
    dst[3] = Vector2.from(abcd.lo);
    //middle.store(dst + 4);
    dst[4]=Vector2.from(middle.lo);
    dst[5]=Vector2.from(middle.hi);

    dst[6] = Vector2.from(abcd.hi);
    dst[7] = Vector2.from(bcd.hi);
    dst[8] = Vector2.from(cd.hi);
    dst[9] = Vector2.from(p33.hi);
}

function chopCubicAtArray(src:Vector2[],dst:Vector2[], tValues:number[],tCount:number) {

    if (tCount == 0) {
       // memcpy(dst, src, sizeof(SkPoint) * 4);
       copyVector2Array(dst,src)
        return;
    }   
  
    if (dst) {
        if (tCount == 0) { // nothing to chop
          //  memcpy(dst, src, 4*sizeof(SkPoint));
            copyVector2Array(dst,src)
        } else {
            let i = 0;
            let dstIndex=0,srcIndex=0
            for (; i < tCount - 1; i += 2) {
                // Do two chops at once.
                let tt_x = tValues[i];
                let tt_y=tValues[i+1]
                if (i != 0) {
                    let lastT = tValues[i - 1];
                    tt_x=clamp((tt_x-lastT)/(1-lastT),0,1)
                    tt_y=clamp((tt_y-lastT)/(1-lastT),0,1)
                }
                let tmpDst:Vector2[]=[]

                chopCubicAt(src, tmpDst, tt_x, tt_y);
                for (let j = 0; j < tmpDst.length; j++) {
                    dst[dstIndex+j] = tmpDst[j].clone();
                    if(j>=6){
                        src[j-6] = tmpDst[j].clone();
                    }
                }
                dstIndex+=6
            }
            if (i < tCount) {
                // Chop the final cubic if there was an odd number of chops.
     
                let t = tValues[i];
                if (i != 0) {
                    let lastT = tValues[i - 1];
                    t = clamp((t - lastT)/(1 - lastT), 0, 1);
                }
                chopCubicAt(src, dst, t);
            }
        }
    }
}

export class SkConic {

    static kMaxConicsForArc = kMaxConicsForArc
    static make(n: number) {
        return Array.from({ length: n }, (_, i) => new SkConic())
    }
    static BuildUnitArc(uStart: Vector2, uStop: Vector2, dir: RotationDirection, userMatrix: Matrix2D, dst: SkConic[]) {
        // 计算点积和叉积
        let x = uStart.dot(uStop);
        let y = uStart.cross(uStop);
        const absY = Math.abs(y);
        const SK_Scalar1 = 1
        const SK_ScalarNearlyZero = SK_Scalar1 / (1 << 12)
        // 检查向量是否几乎重合（角度接近 0 或 180 度，y == 0）
        if (
            absY <= SK_ScalarNearlyZero &&
            x > 0 &&
            ((y >= 0 && !dir) ||
                (y <= 0 && dir))
        ) {
            return 0;
        }

        if (dir) {
            y = -y;
        }

        // 计算落在第几个象限
        let quadrant = 0;
        if (y === 0) {
            quadrant = 2; // 180度
            console.assert(
                Math.abs(x + SK_Scalar1) <= SK_ScalarNearlyZero,
                "Assertion failed: |x + 1| <= nearlyZero"
            );
        } else if (x === 0) {
            console.assert(
                Math.abs(absY - SK_Scalar1) <= SK_ScalarNearlyZero,
                "Assertion failed: |absY - 1| <= nearlyZero"
            );
            quadrant = y > 0 ? 1 : 3; // 90度 或 270度
        } else {
            if (y < 0) {
                quadrant += 2;
            }
            if ((x < 0) !== (y < 0)) {
                quadrant += 1;
            }
        }

        // 定义象限点数组（用于构造单位圆弧的 conic 分段）
        const quadrantPts: Vector2[] = [
            Vector2.create(1, 0),
            Vector2.create(1, 1),
            Vector2.create(0, 1),
            Vector2.create(-1, 1),
            Vector2.create(-1, 0),
            Vector2.create(-1, -1),
            Vector2.create(0, -1),
            Vector2.create(1, -1),
        ];
        const quadrantWeight = 0.707106781;

        let conicCount = quadrant;
        // 使用每个完整象限（90度）构造 conic
        for (let i = 0; i < conicCount; i++) {
            // 取出连续 3 个点（注意数组循环取模）
            const pts: Vector2[] = [
                quadrantPts[(i * 2) % quadrantPts.length].clone(),
                quadrantPts[(i * 2 + 1) % quadrantPts.length].clone(),
                quadrantPts[(i * 2 + 2) % quadrantPts.length].clone(),
            ];
            dst[i] = new SkConic(pts[0], pts[1], pts[2], quadrantWeight);
        }

        // 计算剩余部分（小于 90 度）的弧段
        const finalP: Vector2 = Vector2.create(x, y);
        const lastQ = quadrantPts[(quadrant * 2) % quadrantPts.length]; // 已是单位向量
        const dotVal = lastQ.dot(finalP)
        console.assert(
            dotVal >= 0 && dotVal <= SK_Scalar1 + SK_ScalarNearlyZero,
            "Assertion failed: dot in [0,1]"
        );

        if (dotVal < 1) {
            const offCurve: Vector2 = Vector2.create(lastQ.x + x, lastQ.y + y);
            // 计算半角余弦
            const cosThetaOver2 = Math.sqrt((1 + dotVal) / 2);
            // 调整 offCurve 的长度，使其为 1/cosThetaOver2

            offCurve.setLength(1 / cosThetaOver2)
            if (!lastQ.equalsEpsilon(offCurve)) {
                dst[conicCount] = new SkConic(lastQ, offCurve, finalP, cosThetaOver2);
                conicCount++;
            }
        }

        // 处理初始单位向量旋转和逆时针情况
        const matrix = Matrix2D.identity();
        // C++ 中调用 matrix.setSinCos(uStart.y, uStart.x)，这里用 uStart.y 和 uStart.x
        matrix.setSinCos(uStart.y, uStart.x);
        if (dir) {
            matrix.preScale(SK_Scalar1, -SK_Scalar1);
        }
        if (userMatrix) {
            matrix.premultiply(userMatrix);
        }
        // 对每个 conic 的控制点进行矩阵变换（假设每个 conic 有 3 个控制点）
        for (let i = 0; i < conicCount; i++) {
            matrix.mapPoints(dst[i].fPts, dst[i].fPts);
        }

        return conicCount;
    }

    fPts: Vector2[] = []
    fW: number = 1
    constructor();
    constructor(p0: Vector2, p1: Vector2, p2: Vector2, w: number);
    constructor(pts: Vector2[], w: number);
    constructor(...args: any[]) {
        this.fPts = Vector2.makeZeroArray(3)
        if (args.length == 4) {
            const p0 = args[0], p1 = args[1], p2 = args[2], w = args[3];
            this.set(p0, p1, p2, w);
        } else if (args.length === 2) {
            const pts = args[0], w = args[1];
            this.set(pts, w);
        }
    }
    copy(source: SkConic) {
        this.fPts[0].copy(source.fPts[0]);
        this.fPts[1].copy(source.fPts[1]);
        this.fPts[2].copy(source.fPts[2]);
        this.fW = source.fW;
    }
    set(p0: Vector2, p1: Vector2, p2: Vector2, w: number): void;
    set(pts: Vector2[], w: number): void;
    set(...args: any[]) {
        let w = 1
        if (args.length === 2) {
            const pts = args[0] as Vector2[]
            w = args[1]

            this.fPts.forEach((p, i) => {
                p.copy(pts[i])
            })
        } else if (args.length === 4) {
            this.fPts[0].copy(args[0])
            this.fPts[1].copy(args[1])
            this.fPts[2].copy(args[2])
            w = args[3]

        }
        this.setW(w);
    }

    setW(w: number) {
        // Guard against bad weights by forcing them to 1.
        this.fW = w > 0 && Number.isFinite(w) ? w : 1;
    }

    /**
     *  Given a t-value [0...1] return its position and/or tangent.
     *  If pos is not null, return its position at the t-value.
     *  If tangent is not null, return its tangent at the t-value. NOTE the
     *  tangent value's length is arbitrary, and only its direction should
     *  be used.
     */
    evalAt(t: number): Vector2;
    evalAt(t: number, pos: Vector2, tangent?: Vector2): void
    evalAt(...args: any[]) {
        if (args.length === 1) {
            return new SkConicCoeff(this).eval(args[0]);
        } else {
            const t = args[0] as number, pt = args[1] as Vector2, tangent = args[2] as Vector2;

            if (pt) {
                pt.copy(this.evalAt(t))
            }
            if (tangent) {
                tangent.copy(this.evalTangentAt(t))
            }
        }

    };
    chopAt(t: number, dst: SkConic[]): boolean;
    chopAt(t1: number, t2: number, dst: SkConic): boolean
    chopAt(...args: any[]) {

        if (args.length === 2) {
            const t = args[0] as number, dst = args[1] as SkConic[];

            let tmp = Vector3.makeZeroArray(3), tmp2 = Vector3.makeZeroArray(3);

            ratquad_mapTo3D(this.fPts, this.fW, tmp);

            p3d_interp('x', tmp, tmp, t);
            p3d_interp('y', tmp, tmp, t);
            p3d_interp('z', tmp, tmp, t);

            dst[0].fPts[0].copy(this.fPts[0]);
            dst[0].fPts[1].copy(project_down(tmp2[0]));
            dst[0].fPts[2].copy(project_down(tmp2[1]));
            dst[1].fPts[0].copy(dst[0].fPts[2]);
            dst[1].fPts[1].copy(project_down(tmp2[2]));
            dst[1].fPts[2].copy(this.fPts[2]);

            // to put in "standard form", where w0 and w2 are both 1, we compute the
            // new w1 as sqrt(w1*w1/w0*w2)
            // or
            // w1 /= sqrt(w0*w2)
            //
            // However, in our case, we know that for dst[0]:
            //     w0 == 1, and for dst[1], w2 == 1
            //
            let root = Math.sqrt(tmp2[1].z);
            dst[0].fW = tmp2[0].z / root;
            dst[1].fW = tmp2[2].z / root;
            return dst[0].fPts.every(v => Number.isFinite(v.x))
        } else {
            const t1 = args[0] as number, t2 = args[1] as number, dst = args[2] as SkConic;

            if (0 == t1 || 1 == t2) {
                if (0 == t1 && 1 == t2) {
                    dst.copy(this)
                    return;
                } else {
                    let pair = SkConic.make(2);
                    if (this.chopAt(t1 ? t1 : t2, pair)) {
                        dst.copy(pair[t1 ? 1 : 0]);
                        return;
                    }
                }
            }
            let coeff = new SkConicCoeff(this);
            let tt1 = Vector2.splat(t1);
            let aXY = coeff.fNumer.eval(tt1);
            let aZZ = coeff.fDenom.eval(tt1);
            let midTT = Vector2.splat(((t1 + t2) / 2));
            let dXY = coeff.fNumer.eval(midTT);
            let dZZ = coeff.fDenom.eval(midTT);
            let tt2 = Vector2.splat(t2);
            let cXY = coeff.fNumer.eval(tt2);
            let cZZ = coeff.fDenom.eval(tt2);
            let bXY = dXY.clone().multiplyScalar(2).sub(aXY.clone().add(cXY).multiplyScalar(0.5));
            let bZZ = dZZ.clone().sub(aZZ.clone().add(cZZ).multiplyScalar(0.5));
            dst.fPts[0].divideVectors(aXY, aZZ);
            dst.fPts[1].divideVectors(bXY, bZZ);
            dst.fPts[2].divideVectors(cXY, cZZ);
            let ww = bZZ.div(aZZ.clone().multiply(cZZ).sqrt())
            dst.fW = ww.x;
        }
        return true
    }
    chop(dst: SkConic[]) {

        // Observe that scale will always be smaller than 1 because fW > 0.
        const scale = 1 / (1 + this.fW);

        // The subdivided control points below are the sums of the following three terms. Because the
        // terms are multiplied by something <1, and the resulting control points lie within the
        // control points of the original then the terms and the sums below will not overflow. Note
        // that fW * scale approaches 1 as fW becomes very large.
        const t0 = this.fPts[0].clone().multiplyScalar(scale);
        const t1 = this.fPts[1].clone().multiplyScalar((this.fW * scale));
        const t2 = this.fPts[2].clone().multiplyScalar(scale);

        // Calculate the subdivided control points
        const p1 = t0.clone().add(t1);
        const p3 = t1.clone().add(t2);

        // p2 = (t0 + 2*t1 + t2) / 2. Divide the terms by 2 before the sum to keep the sum for p2
        // from overflowing.
        const p2 = t0.clone().multiplyScalar(0.5).add(t1).add(t2.multiplyScalar(0.5));


        dst[0].fPts[0].copy(this.fPts[0]);
        dst[0].fPts[1].copy(p1);
        dst[0].fPts[2].copy(p2);
        dst[1].fPts[0].copy(p2);
        dst[1].fPts[1].copy(p3);
        dst[1].fPts[2].copy(this.fPts[2]);

        // Update w.
        dst[0].fW = dst[1].fW = subdivide_w_value(this.fW);
    };

    evalTangentAt(t: number) {
        const fPts = this.fPts
        // The derivative equation returns a zero tangent vector when t is 0 or 1,
        // and the control point is equal to the end point.
        // In this case, use the conic endpoints to compute the tangent.
        if ((t == 0 && fPts[0].equalsEpsilon(fPts[1])) || (t == 1 && fPts[1].equalsEpsilon(fPts[2]))) {
            return fPts[2].clone().sub(fPts[0]);
        }
        let p0 = fPts[0].clone();
        let p1 = fPts[1].clone();
        let p2 = fPts[2].clone();
        let ww = Vector2.splat(this.fW);

        let p20 = p2.sub(p0);
        let p10 = p1.sub(p0);

        let C = ww.clone().multiply(p10);
        let A = ww.clone().multiply(p20).sub(p20);
        let B = p20.clone().sub(C).sub(C);

        return new SkQuadCoeff(A, B, C).eval(Vector2.splat(t));
    }

    computeAsQuadError(err: Vector2) {
        const a = this.fW - 1;
        const k = a / (4 * (2 + a));
        const x = k * (this.fPts[0].x - 2 * this.fPts[1].x + this.fPts[2].x);
        const y = k * (this.fPts[0].y - 2 * this.fPts[1].y + this.fPts[2].y);
        err.set(x, y);
    };
    asQuadTol(tol: number) {
        const a = this.fW - 1;
        const k = a / (4 * (2 + a));
        const x = k * (this.fPts[0].x - 2 * this.fPts[1].x + this.fPts[2].x);
        const y = k * (this.fPts[0].y - 2 * this.fPts[1].y + this.fPts[2].y);
        return (x * x + y * y) <= tol * tol;
    };

    /**
     *  return the power-of-2 number of quads needed to approximate this conic
     *  with a sequence of quads. Will be >= 0.
     */
    computeQuadPOW2(tol: number) {
        if (tol < 0 || !Number.isFinite(tol) || !Vector2.areFinite(this.fPts)) {
            return 0;
        }

        const a = this.fW - 1;
        const k = a / (4 * (2 + a));
        const x = k * (this.fPts[0].x - 2 * this.fPts[1].x + this.fPts[2].x);
        const y = k * (this.fPts[0].y - 2 * this.fPts[1].y + this.fPts[2].y);

        let error = Math.sqrt(x * x + y * y);
        let pow2;

        for (pow2 = 0; pow2 < kMaxConicToQuadPOW2; ++pow2) {
            if (error <= tol) {
                break;
            }
            error *= 0.25;
        }
        // float version -- using ceil gives the same results as the above.
        if ((false)) {
            let err = Math.sqrt(x * x + y * y);
            if (err <= tol) {
                return 0;
            }
            let tol2 = tol * tol;
            if (tol2 == 0) {
                return kMaxConicToQuadPOW2;
            }
            let fpow2 = Math.log2((x * x + y * y) / tol2) * 0.25;
            let altPow2 = Math.ceil(fpow2);
            if (altPow2 != pow2) {
                //SkDebugf("pow2 %d altPow2 %d fbits %g err %g tol %g\n", pow2, altPow2, fpow2, err, tol);
            }
            pow2 = altPow2;
        }
        return pow2;
    }

    /**
     *  Chop this conic into N quads, stored continguously in pts[], where
     *  N = 1 << pow2. The amount of storage needed is (1 + 2 * N)
     */
    chopIntoQuadsPOW2(pts: Vector2[], pow2: number) {
        //SkASSERT(pow2 >= 0);
        pts.forEach((v, i) => {
            v.copy(this.fPts[i])
        });
        //SkDEBUGCODE(SkPoint* endPts);
        if (pow2 == kMaxConicToQuadPOW2) {  // If an extreme weight generates many quads ...
            let dst: SkConic[] = SkConic.make(2);
            this.chop(dst);
            // check to see if the first chop generates a pair of lines
            dst[0].fPts[1].equalsEpsilon
            if (Vector2.equalsWithinTolerance(dst[0].fPts[1], dst[0].fPts[2]) &&
                Vector2.equalsWithinTolerance(dst[1].fPts[0], dst[1].fPts[1])) {
                pts[1] = pts[2] = pts[3] = dst[0].fPts[1];  // set ctrl == end to make lines
                pts[4] = dst[1].fPts[2];
                pow2 = 1;
                //  SkDEBUGCODE(endPts = &pts[5]);
                // goto commonFinitePtCheck;
            }
        }
        // SkDEBUGCODE(endPts = ) subdivide(*this, pts + 1, pow2);
        /// commonFinitePtCheck:
        const quadCount = 1 << pow2;
        const ptCount = 2 * quadCount + 1;
        //   SkASSERT(endPts - pts == ptCount);
        if (!Vector2.areFinite(pts)) {
            // if we generated a non-finite, pin ourselves to the middle of the hull,
            // as our first and last are already on the first/last pts of the hull.
            for (let i = 1; i < ptCount - 1; ++i) {
                pts[i].copy(this.fPts[1])
            }
        }
        return 1 << pow2;
    }

    findMidTangent() {
        // Tangents point in the direction of increasing T, so tan0 and -tan1 both point toward the
        // midtangent. The bisector of tan0 and -tan1 is orthogonal to the midtangent:
        //
        //     bisector dot midtangent = 0
        //
        const fPts = this.fPts, fW = this.fW
        let tan0 = fPts[1].clone().subtract(fPts[0]);
        let tan1 = fPts[2].clone().subtract(fPts[1]);
        let bisector = findBisector(tan0, tan1.clone().negate());

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
        return solve_quadratic_equation_for_midtangent(a, b, c);
    }
    findXExtrema(t: number[]|Float32Array) { 
        return   conic_find_extrema(this.fPts.map(d=>d.x), this.fW, t);
    }
    findYExtrema(t:number[]|Float32Array) {
        return conic_find_extrema(this.fPts.map(d=>d.y), this.fW, t);
    };
    chopAtXExtrema(dst: SkConic[]) { 
        let t=new Float32Array(2);
        if (this.findXExtrema(t)) {
            if (!this.chopAt(t[0], dst)) {
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
    };
    chopAtYExtrema(dst: SkConic[]) {
        let t=new Float32Array(2);
        if (this.findYExtrema(t)) {
            if (!this.chopAt(t[0], dst)) {
                // if chop can't return finite values, don't chop
                return false;
            }
            // now clean-up the middle, since we know t was meant to be at
            // an X-extrema
            let value = dst[0].fPts[2].y;
            dst[0].fPts[1].y = value;
            dst[1].fPts[0].y = value;
            dst[1].fPts[1].y = value;
            return true;
        }
        return false;
     };

    computeTightBounds(bounds: BoundingRect) {
        let pts=Vector2.makeZeroArray(4);
        pts[0].copy(this.fPts[0]);
        pts[1].copy(this.fPts[2]);
        let count = 2;
    
        let t=new Float32Array(2);
        if (this.findXExtrema(t)) {
            this.evalAt(t[0], pts[count++]);
        }
        if (this.findYExtrema(t)) {
            this.evalAt(t[0], pts[count++]);
        }
        bounds.setFromPoints(pts);
    };
    computeFastBounds(bounds: BoundingRect) {
        bounds.setFromPoints(this.fPts);
    }

};



/**
 *  use for : eval(t) == A * t^2 + B * t + C
 */
class SkQuadCoeff {
    fA: Vector2 = Vector2.zero()
    fB: Vector2 = Vector2.zero()
    fC: Vector2 = Vector2.zero()
    constructor();
    constructor(A: Vector2, B: Vector2, C: Vector2);
    constructor(src: Vector2[]);
    constructor(...args: any[]) {
        if (args.length === 1) {
            this.fC.copy(args[0])
            this.fB.subVectors(args[1], this.fC).multiplyScalar(2)
            this.fA.subVectors(args[2], args[1].clone().multiplyScalar(2)).add(this.fC)
        } else if (args.length === 3) {
            this.fA.copy(args[0])
            this.fB.copy(args[1])
            this.fC.copy(args[2])
        }
    }

    eval(tt: Vector2) {
        const fA = this.fA, fB = this.fB, fC = this.fC;
        return fA.clone().multiply(tt).add(fB).multiply(tt).add(fC)
    }

};


export class SkConicCoeff {
    fNumer: SkQuadCoeff;
    fDenom: SkQuadCoeff;
    constructor(conic: SkConic) {
        const p0 = conic.fPts[0].clone();
        const p1 = conic.fPts[1].clone();
        const p2 = conic.fPts[2].clone();
        const ww = Vector2.splat(conic.fW);

        const p1w = p1.clone().multiply(ww);
        this.fNumer = new SkQuadCoeff();
        this.fDenom = new SkQuadCoeff();
        this.fNumer.fC = p0.clone();

        this.fNumer.fA = p2.clone().sub(p1w.clone().multiplyScalar(2)).add(p0)
        this.fNumer.fB = Vector2.create().subVectors(p1w, p0);

        this.fDenom.fC.set(1, 1);
        this.fDenom.fB = ww.sub(this.fDenom.fC).multiplyScalar(2);
        this.fDenom.fA = this.fDenom.fB.negate();
    }

    eval(t: number) {
        let tt = Vector2.splat(t);
        let numer = this.fNumer.eval(tt);
        let denom = this.fDenom.eval(tt);
        return numer.divide(denom);
    }


};

export class SkCubicCoeff{
    
    fA:Vector2=Vector2.zero()
    fB:Vector2=Vector2.zero()
    fC:Vector2=Vector2.zero()
    fD:Vector2=Vector2.zero()
    constructor(src:Vector2[]) {
        let P0 = src[0].clone();
        let P1 = src[1].clone();
        let P2 = src[2].clone();
        let P3 = src[3].clone();
        let three=Vector2.splat(3)
        this.fA.copy(P3).add(three).multiply(P1.clone().subtract(P2)).subtract(P0);
        this.fB.copy(three).multiply(P2.subtract(P1.clone().multiplyScalar(2).add(P0)));
        this.fC.copy(three).multiply(P1.clone().subtract(P0));
        this.fD.copy(P0);
    }

    eval(t:Vector2) {
        return this.fA.clone().multiply(t).add(this.fB).multiply(t).add(this.fC).multiply(t).add(this.fD)
    }
}