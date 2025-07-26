


import { Vector2 } from '../math/vec2'
import {Matrix2D} from '../math/mat2d'
import { clamp,scalarNearlyZero } from '../math/math';
export const SCALAR_MAX = 3.402823466e+38;

export const SCALAR_NEARLY_ZERO = 1.0 / (1 << 12) 

export const SCALAR_ROOT_2_OVER_2 = 0.707106781;
export enum PathDirection {
    CW,
    CCW,
}

const FLOAT_PI=Math.PI
const EPSILON: number = 1.19209290e-07;
class QuadCoeff{
    static from_points(points:Vector2[]){
        let c = points[0].clone();
        let p1 = points[1].clone();
        let p2 = points[2].clone();
        let b = times_2(p1.clone().sub(c));
        let a = p2.clone().sub(times_2(p1)).add(c);
        return new this({
            a, b, c
        })
    }
    a:Vector2=Vector2.default()
    b:Vector2=Vector2.default()
    c:Vector2=Vector2.default()
    constructor(options?:{
        a:Vector2
        b:Vector2
        c:Vector2
    }){
        if(options){
            Object.assign(this,options)
        }
    }
    eval(t:Vector2):Vector2{
        return new Vector2().copy(this.a).multiply(t).add(this.b).mul(t).add(this.c)
    }
}




class CubicCoeff{
    static from_points(points:Vector2[]){
        let p0 = points[0].clone();
        let p1 = points[1].clone();
        let p2 = points[2].clone();
        let p3 = points[3].clone();
        let three = Vector2.splat(3.0);
        return new this({
            a: p3.clone().add(p1.clone().sub(p2).mul(three)).sub(p0),
            b:three.clone().mul(p2.clone().sub(times_2(p1)).add(p0)),
            c: three.clone().mul(p1.clone().sub(p0)),
            d: p0.clone(),
        })
    }
    a:Vector2=Vector2.default()
    b:Vector2=Vector2.default()
    c:Vector2=Vector2.default()
    d:Vector2=Vector2.default()
    constructor(options?:{
        a:Vector2
        b:Vector2
        c:Vector2
        d:Vector2
    }){
        if(options){
            Object.assign(this,options)
        }
    }
    eval(t:Vector2){
        return new Vector2().copy(this.a).multiply(t).add(this.b).mul(t).add(this.c).mul(t).add(this.d)
    }
}

function new_t_values(){
    return new Array(3)
}

function chop_quad_at(src: Vector2[], t: number, dst: Vector2[]) {
    let p0 = src[0].clone();
    let p1 = src[1].clone();
    let p2 = src[2].clone();
    let tt = Vector2.splat(t);

    let p01 = interp(p0, p1, tt);
    let p12 = interp(p1, p2, tt);

    dst[0] = Vector2.from(p0);
    dst[1] = Vector2.from(p01);
    dst[2] = Vector2.from(interp(p01, p12, tt));
    dst[3] = Vector2.from(p12);
    dst[4] = Vector2.from(p2);
}


// From Numerical Recipes in C.
//
// Q = -1/2 (B + sign(B) sqrt[B*B - 4*A*C])
// x1 = Q / A
// x2 = C / Q
function find_unit_quad_roots(
    a: number,
    b: number,
    c: number,
    roots:number[]
){
    if (a == 0.0 ){
        let r = valid_unit_divide(-c, b)
        if (r) {
            roots[0] = r;
            return 1;
        } else {
            return 0;
        }
    }

    // use doubles so we don't overflow temporarily trying to compute R
    let  dr = b * b - 4.0 * a * c;
    if (dr < 0.0 ){
        return 0;
    }
    dr = Math.sqrt(dr);
    let r = dr;
    if (!Number.isFinite(r)) {
        return 0;
    }

    let q =  b < 0.0?-(b - r) / 2.0:-(b + r) / 2.0;

    let  roots_offset = 0;
    {
        let r = valid_unit_divide(q, a)
        if (r) {
            roots[roots_offset] = r;
            roots_offset += 1;
        }
    }

    {
        let r= valid_unit_divide(c, q)
        if (r){
            roots[roots_offset] = r;
            roots_offset += 1;
        }
    }

    if(roots_offset == 2) {
        if (roots[0] > roots[1]) {
          //  roots.swap(0, 1);
            [roots[0],roots[1]]=[roots[1],roots[0]]
        } else if (roots[0] == roots[1]) {
            // nearly-equal?
            roots_offset -= 1; // skip the double root
        }
    }

    return roots_offset
}
function swap(arr:any[],from:number,to:number){
    let temp=arr[from]
    arr[from]=arr[to]
    arr[to]=temp
    return arr
}


function chop_cubic_at2(src:Vector2[], t: number, dst:Vector2[]) {
    let p0 = src[0].clone();
    let p1 = src[1].clone();
    let p2 = src[2].clone();
    let p3 = src[3].clone();
    let tt = Vector2.splat(t);

    let ab = interp(p0, p1, tt);
    let bc = interp(p1, p2, tt);
    let cd = interp(p2, p3, tt);
    let abc = interp(ab, bc, tt);
    let bcd = interp(bc, cd, tt);
    let abcd = interp(abc, bcd, tt);

    dst[0] = Vector2.from(p0);
    dst[1] = Vector2.from(ab);
    dst[2] = Vector2.from(abc);
    dst[3] = Vector2.from(abcd);
    dst[4] = Vector2.from(bcd);
    dst[5] = Vector2.from(cd);
    dst[6] = Vector2.from(p3);
}
type NormalizedF32Exclusive=number
type f32=number

// Quad'(t) = At + B, where
// A = 2(a - 2b + c)
// B = 2(b - a)
// Solve for t, only if it fits between 0 < t < 1
function find_quad_extrema(a: f32, b: f32, c: f32) {
    // At + B == 0
    // t = -B / A
    return valid_unit_divide(a - b, a - b - b + c)
}
function valid_unit_divide(numer: f32,denom: f32):NormalizedF32Exclusive|undefined {
    if (numer < 0.0) {
        numer = -numer;
        denom = -denom;
    }

    if (denom == 0.0 || numer == 0.0 || numer >= denom) {
        return;
    }

    let r = numer / denom;
   // NormalizedF32Exclusive::new(r)
    return r
}
function interp(v0: Vector2, v1: Vector2, t: Vector2) {
    return new Vector2().copy(v0).add(v1.clone().sub(v0)).multiply(t)
}

function times_2(value: Vector2) {
   return new Vector2().copy(value).add(value)
}



// F(t)    = a (1 - t) ^ 2 + 2 b t (1 - t) + c t ^ 2
// F'(t)   = 2 (b - a) + 2 (a - 2b + c) t
// F''(t)  = 2 (a - 2b + c)
//
// A = 2 (b - a)
// B = 2 (a - 2b + c)
//
// Maximum curvature for a quadratic means solving
// Fx' Fx'' + Fy' Fy'' = 0
//
// t = - (Ax Bx + Ay By) / (Bx ^ 2 + By ^ 2)
function find_quad_max_curvature(src:Vector2[]) {
    let ax = src[1].x - src[0].x;
    let ay = src[1].y - src[0].y;
    let bx = src[0].x - src[1].x - src[1].x + src[2].x;
    let by = src[0].y - src[1].y - src[1].y + src[2].y;

    let  numer = -(ax * bx + ay * by);
    let  denom = bx * bx + by * by;
    if (denom < 0.0) {
        numer = -numer;
        denom = -denom;
    }

    if (numer <= 0.0) {
        return 0;//NormalizedF32::ZERO;
    }

    if (numer >= denom) {
        // Also catches denom=0
        return 1;//NormalizedF32::ONE;
    }

    let t = numer / denom;
    if(t<0||t>1){
        console.assert('值无效')
    }
    return t
}
class NormalizedF32{
    static ZERO=0
    static ONE=1
    static new_clamped(n:number){
         if(Number.isFinite(n)){
            return clamp(n,0,1)
         }else{
            return this.ZERO
         }
    }
}
function eval_quad_at(src:Vector2[], t: number):Vector2 {
    return Vector2.from(QuadCoeff.from_points(src).eval(Vector2.splat(t)))
}

function eval_quad_tangent_at(src: Vector2[], tol: number):Vector2 {
    // The derivative equation is 2(b - a +(a - 2b +c)t). This returns a
    // zero tangent vector when t is 0 or 1, and the control point is equal
    // to the end point. In this case, use the quad end points to compute the tangent.
    if((tol == NormalizedF32.ZERO && src[0] == src[1])
        || (tol == NormalizedF32.ONE && src[1] == src[2]))
    {
        return src[2].clone().sub(src[0]);
    }

    let p0 = src[0].clone();
    let p1 = src[1].clone();
    let p2 = src[2].clone();

    let b = p1.clone().sub( p0);
    let a = p2.clone().sub(p1).sub(b);
    let t = a.clone().mul(Vector2.splat(tol)).add(b)

    return Vector2.from(t).add(t);
}


// Looking for F' dot F'' == 0
//
// A = b - a
// B = c - 2b + a
// C = d - 3c + 3b - a
//
// F' = 3Ct^2 + 6Bt + 3A
// F'' = 6Ct + 6B
//
// F' dot F'' -> CCt^3 + 3BCt^2 + (2BB + CA)t + AB
function find_cubic_max_curvature(
    src: Vector2[],
    t_values:number[],
):number[]{
    let  coeff_x = formulate_f1_dot_f2([src[0].x, src[1].x, src[2].x, src[3].x]);
    let coeff_y = formulate_f1_dot_f2([src[0].y, src[1].y, src[2].y, src[3].y]);

    for(let i=0;i<4;i++){
        coeff_x[i] += coeff_y[i];
    }

    let len = solve_cubic_poly(coeff_x, t_values);
 //   t_values[0..len]
    return t_values.slice(0,len)
}

// Looking for F' dot F'' == 0
//
// A = b - a
// B = c - 2b + a
// C = d - 3c + 3b - a
//
// F' = 3Ct^2 + 6Bt + 3A
// F'' = 6Ct + 6B
//
// F' dot F'' -> CCt^3 + 3BCt^2 + (2BB + CA)t + AB
function formulate_f1_dot_f2(src:number[]):number[]{
    let a = src[1] - src[0];
    let b = src[2] - 2.0 * src[1] + src[0];
    let c = src[3] + 3.0 * (src[1] - src[2]) - src[0];
    return [c * c, 3.0 * b * c, 2.0 * b * b + c * a, a * b]
}



/// Solve coeff(t) == 0, returning the number of roots that lie within 0 < t < 1.
/// coeff[0]t^3 + coeff[1]t^2 + coeff[2]t + coeff[3]
///
/// Eliminates repeated roots (so that all t_values are distinct, and are always
/// in increasing order.
function solve_cubic_poly(coeff:number[], t_values:number[]):number {
    if (scalarNearlyZero(coeff[0])) {
        // we're just a quadratic
        let  tmp_t = new_t_values();
        let count = find_unit_quad_roots(coeff[1], coeff[2], coeff[3],tmp_t);
        for(let i=0;i<count;i++){
            t_values[i] = tmp_t[i] //.to_normalized();
        }

        return count;
    }

  //  debug_assert!(coeff[0] != 0.0);

    let inva = 1/coeff[0];
    let a = coeff[1] * inva;
    let b = coeff[2] * inva;
    let c = coeff[3] * inva;

    let q = (a * a - b * 3.0) / 9.0;
    let r = (2.0 * a * a * a - 9.0 * a * b + 27.0 * c) / 54.0;

    let q3 = q * q * q;
    let r2_minus_q3 = r * r - q3;
    let adiv3 = a / 3.0;

    if (r2_minus_q3 < 0.0 ){
        // we have 3 real roots
        // the divide/root can, due to finite precisions, be slightly outside of -1...1
        let theta =Math.acos(clamp( (r / Math.sqrt(q3)),-1,1));
        let neg2_root_q = -2.0 * Math.sqrt(q);

        t_values[0] = NormalizedF32.new_clamped(neg2_root_q * Math.cos(theta / 3.0) - adiv3);
        t_values[1] = NormalizedF32.new_clamped(
            neg2_root_q * Math.cos(((theta + 2.0 * FLOAT_PI) / 3.0)) - adiv3,
        );
        t_values[2] = NormalizedF32.new_clamped(
            neg2_root_q * Math.cos((theta - 2.0 * FLOAT_PI) / 3.0) - adiv3,
        );

        // now sort the roots
        sort_array3(t_values);
        return collapse_duplicates3(t_values)
    } else {
        // we have 1 real root
        let a = Math.abs(r) + Math.sqrt(r2_minus_q3);
        a = scalar_cube_root(a);
        if (r > 0.0) {
            a = -a;
        }

        if (a != 0.0 ){
            a += q / a;
        }

        t_values[0] = NormalizedF32.new_clamped(a - adiv3);
        return 1
    }
}

function sort_array3(array:number[]) {
    if (array[0] > array[1]) {
        //array.swap(0, 1);
        swap(array,0,1)
    }   

    if (array[1] > array[2]) {
        //array.swap(1, 2);
        swap(array,1,2)
    }

    if (array[0] > array[1]) {
       // array.swap(0, 1);
       swap(array,0,1)
    }
}

function collapse_duplicates3(array:number[]):number {
    let  len = 3;

    if (array[1] == array[2]) {
        len = 2;
    }

    if (array[0] == array[1]) {
        len = 1;
    }

    return len
}
function scalar_cube_root(x: f32){
    return Math.pow(x,0.3333333)
}
// This is SkEvalCubicAt split into three functions.
function eval_cubic_pos_at(src:Vector2[], t: number):Vector2 {
    return Vector2.from(CubicCoeff.from_points(src).eval(Vector2.splat(t)))
}


// This is SkEvalCubicAt split into three functions.
function eval_cubic_tangent_at(src:Vector2[], t: number): Vector2 {
    // The derivative equation returns a zero tangent vector when t is 0 or 1, and the
    // adjacent control point is equal to the end point. In this case, use the
    // next control point or the end points to compute the tangent.
    if ((t == 0.0 && src[0] == src[1]) || (t == 1.0 && src[2] == src[3])) {
        let tangent = t == 0.0?src[2].clone().sub(src[0]):src[3].clone().sub( src[1]);

        if (tangent.x == 0.0 && tangent.y == 0.0) {
            tangent = src[3].clone().sub(src[0]);
        }

       return tangent
    } else {
        return eval_cubic_derivative(src, t)
    }
}

function eval_cubic_derivative(src:Vector2[], t: number):Vector2 {
    let p0 = src[0].clone();
    let p1 = src[1].clone();
    let p2 = src[2].clone();
    let p3 = src[3].clone();

    let coeff = new QuadCoeff({
        a: p3.clone().add(Vector2.splat(3.0).mul(p1.clone().sub(p2))).sub(p0),
        b: times_2(p2.clone().sub(times_2(p1)).add(p0)),
        c: p1.clone().sub(p0),
    });

    return Vector2.from(coeff.eval(Vector2.splat(t)))
}



// Cubic'(t) = At^2 + Bt + C, where
// A = 3(-a + 3(b - c) + d)
// B = 6(a - 2b + c)
// C = 3(b - a)
// Solve for t, keeping only those that fit between 0 < t < 1
function find_cubic_extrema(
    a: f32,
    b: f32,
    c: f32,
    d: f32,
    t_values:number[],
) {
    // we divide A,B,C by 3 to simplify
    let aa = d - a + 3.0 * (b - c);
    let bb = 2.0 * (a - b - b + c);
    let cc = b - a;

    return find_unit_quad_roots(aa, bb, cc, t_values)
}

// http://www.faculty.idc.ac.il/arik/quality/appendixA.html
//
// Inflection means that curvature is zero.
// Curvature is [F' x F''] / [F'^3]
// So we solve F'x X F''y - F'y X F''y == 0
// After some canceling of the cubic term, we get
// A = b - a
// B = c - 2b + a
// C = d - 3c + 3b - a
// (BxCy - ByCx)t^2 + (AxCy - AyCx)t + AxBy - AyBx == 0
function find_cubic_inflections(
    src:Vector2[],
    t_values: number[],
):number[] {
    let ax = src[1].x - src[0].x;
    let ay = src[1].y - src[0].y;
    let bx = src[2].x - 2.0 * src[1].x + src[0].x;
    let by = src[2].y - 2.0 * src[1].y + src[0].y;
    let cx = src[3].x + 3.0 * (src[1].x - src[2].x) - src[0].x;
    let cy = src[3].y + 3.0 * (src[1].y - src[2].y) - src[0].y;

    let len = find_unit_quad_roots(
        bx * cy - by * cx,
        ax * cy - ay * cx,
        ax * by - ay * bx,
        t_values,
    );
    //&t_values[0..len]
    return t_values.slice(0,len)
}



// Return location (in t) of cubic cusp, if there is one.
// Note that classify cubic code does not reliably return all cusp'd cubics, so
// it is not called here.
function find_cubic_cusp(src:Vector2[]):number|undefined {
    // When the adjacent control point matches the end point, it behaves as if
    // the cubic has a cusp: there's a point of max curvature where the derivative
    // goes to zero. Ideally, this would be where t is zero or one, but math
    // error makes not so. It is not uncommon to create cubics this way; skip them.
    if (src[0].equals(src[1])) {
        return;
    }

    if (src[2].equals( src[3]) ){
        return;
    }

    // Cubics only have a cusp if the line segments formed by the control and end points cross.
    // Detect crossing if line ends are on opposite sides of plane formed by the other line.
    if (on_same_side(src, 0, 2) || on_same_side(src, 2, 0)) {
        return ;
    }

    // Cubics may have multiple points of maximum curvature, although at most only
    // one is a cusp.
    let  t_values =Array.from({length:3},()=>NormalizedF32.ZERO);
    let max_curvature = find_cubic_max_curvature(src, t_values);
    for(let test_t of max_curvature) {
        if( 0.0 >= test_t || test_t >= 1.0) {
            // no need to consider max curvature on the end
            continue;
        }

        // A cusp is at the max curvature, and also has a derivative close to zero.
        // Choose the 'close to zero' meaning by comparing the derivative length
        // with the overall cubic size.
        let d_pt = eval_cubic_derivative(src,test_t);
        let d_pt_magnitude = d_pt.lengthSq();
        let precision = calc_cubic_precision(src);
        if (d_pt_magnitude < precision) {
            // All three max curvature t values may be close to the cusp;
            // return the first one.
            //return NormalizedF32Exclusive::new_bounded(test_t);
            return clamp(test_t,EPSILON,1-EPSILON)
        }
    }

}

// Returns true if both points src[testIndex], src[testIndex+1] are in the same half plane defined
// by the line segment src[lineIndex], src[lineIndex+1].
function on_same_side(src:Vector2[], test_index: number, line_index: number):boolean {
    let origin = src[line_index];
    let line = src[line_index + 1].clone().sub(origin);
    let crosses = [0.0, 0.0];
    for (let index=0;index<2;index++){
        let test_line = src[test_index + index].clone().sub(origin);
        crosses[index] = line.clone().cross(test_line);
    }

    return crosses[0] * crosses[1] >= 0.0
}

// Returns a constant proportional to the dimensions of the cubic.
// Constant found through experimentation -- maybe there's a better way....
function calc_cubic_precision(src:Vector2[]):number {
    return (src[1].distanceToSquared(src[0])
        + src[2].distanceToSquared(src[1])
        + src[3].distanceToSquared(src[2]))
        * 1e-8
}

 class Conic{
    points:Vector2[]=[]
    weight:number=0
    static default(){
        return new this({
            points:[],
            weight:0
        })
    }
    static new(pt0: Vector2, pt1: Vector2, pt2: Vector2, weight: f32){
        return new this({
            points: [pt0, pt1, pt2],
            weight,
        })
    }
    static from_points(points:Vector2[], weight: f32) {
        return new this({
            points: [points[0], points[1], points[2]],
            weight,
        })
    }
    static build_unit_arc(
        u_start: Vector2,
        u_stop: Vector2,
        dir: PathDirection,
        user_transform: Matrix2D,
        dst: Conic[],
    ):Conic[]|undefined{
        // rotate by x,y so that u_start is (1.0)
        let x = u_start.dot(u_stop);
        let  y = u_start.cross(u_stop);

        let abs_y = Math.abs(y);

        // check for (effectively) coincident vectors
        // this can happen if our angle is nearly 0 or nearly 180 (y == 0)
        // ... we use the dot-prod to distinguish between 0 and 180 (x > 0)
        if (abs_y <= SCALAR_NEARLY_ZERO
            && x > 0.0
            && ((y >= 0.0 && dir == PathDirection.CW) || (y <= 0.0 && dir == PathDirection.CCW)))
        {
            return;
        }

        if(dir == PathDirection.CCW) {
            y = -y;
        }

        // We decide to use 1-conic per quadrant of a circle. What quadrant does [xy] lie in?
        //      0 == [0  .. 90)
        //      1 == [90 ..180)
        //      2 == [180..270)
        //      3 == [270..360)
        //
        let  quadrant = 0;
        if (y == 0.0) {
            quadrant = 2; // 180
            //debug_assert!((x + 1.0) <= SCALAR_NEARLY_ZERO);
        } else if(x == 0.0){
          //  debug_assert!(abs_y - 1.0 <= SCALAR_NEARLY_ZERO);
            quadrant =  y > 0.0 ? 1: 3; // 90 / 270
        } else {
            if( y < 0.0) {
                quadrant += 2;
            }

            if( (x < 0.0) != (y < 0.0)) {
                quadrant += 1;
            }
        }

        let quadrant_points = [
            Vector2.create(1.0, 0.0),
            Vector2.create(1.0, 1.0),
            Vector2.create(0.0, 1.0),
            Vector2.create(-1.0, 1.0),
            Vector2.create(-1.0, 0.0),
            Vector2.create(-1.0, -1.0),
            Vector2.create(0.0, -1.0),
            Vector2.create(1.0, -1.0),
        ];

        const QUADRANT_WEIGHT: f32 = SCALAR_ROOT_2_OVER_2;

        let  conic_count = quadrant;
        for(let i=0;i<conic_count;i++) {
            dst[i] = Conic.from_points(quadrant_points.slice(i*2), QUADRANT_WEIGHT);
        }

        // Now compute any remaining (sub-90-degree) arc for the last conic
        let final_pt = Vector2.create(x, y);
        let last_q = quadrant_points[quadrant * 2]; // will already be a unit-vector
        let dot = last_q.dot(final_pt);
      //  debug_assert!(0.0 <= dot && dot <= 1.0 + SCALAR_NEARLY_ZERO);

        if(dot < 1.0 ){
            let  off_curve = Vector2.create(last_q.x + x, last_q.y + y);
            // compute the bisector vector, and then rescale to be the off-curve point.
            // we compute its length from cos(theta/2) = length / 1, using half-angle identity we get
            // length = sqrt(2 / (1 + cos(theta)). We already have cos() when to computed the dot.
            // This is nice, since our computed weight is cos(theta/2) as well!
            let cos_theta_over_2 = Math.sqrt((1.0 + dot) / 2.0);
            off_curve.setLength(1/cos_theta_over_2);
            if (!last_q.almostEqual(off_curve)) {
                dst[conic_count] = Conic.new(last_q, off_curve, final_pt, cos_theta_over_2);
                conic_count += 1;
            }
        }

        // now handle counter-clockwise and the initial unitStart rotation
        let  transform = Matrix2D.fromSinCos(u_start.y, u_start.x);
        if(dir == PathDirection.CCW ){
            transform = transform.preScale(1.0, -1.0);
        }

        transform = transform.premultiply(user_transform);

        // for conic in dst.iter_mut().take(conic_count) {
        //     transform.map_points(&mut conic.points);
        // }
        for(let i=0,conic=dst[i];i<conic_count;i++){
            transform.mapPoints(conic.points,conic.points);
        }

        if(conic_count == 0 ){
            
        } else {
          //  Some(&dst[0..conic_count])
          return dst.slice(0,conic_count)
        }
    }
    constructor(options?:{
        points:Vector2[]
        weight:number
    }){
        if(options){
            Object.assign(this,options)
        }
    }
     compute_quad_pow2(tolerance: f32) {
        if (tolerance < 0.0 || !Number.isFinite(tolerance)) {
            return ;
        }
        const self=this;

        if (!self.points[0].isFinite() || !self.points[1].isFinite() || !self.points[2].isFinite())
        {
            return ;
        }

        // Limit the number of suggested quads to approximate a conic
        const MAX_CONIC_TO_QUAD_POW2 = 4;

        // "High order approximation of conic sections by quadratic splines"
        // by Michael Floater, 1993
        let a = self.weight - 1.0;
        let k = a / (4.0 * (2.0 + a));
        let x = k * (self.points[0].x - 2.0 * self.points[1].x + self.points[2].x);
        let y = k * (self.points[0].y - 2.0 * self.points[1].y + self.points[2].y);

        let  error = Math.sqrt((x * x + y * y));
        let  pow2 = 0;
        for(let _=0;_< MAX_CONIC_TO_QUAD_POW2;_++) {
            if (error <= tolerance) {
                break;
            }

            error *= 0.25;
            pow2 += 1;
        }

        // Unlike Skia, we always expect `pow2` to be at least 1.
        // Otherwise it produces ugly results.
      //  Some(pow2.max(1))
        return Math.max(pow2,1)
    }
    // Chop this conic into N quads, stored continuously in pts[], where
    // N = 1 << pow2. The amount of storage needed is (1 + 2 * N)
    chop_into_quads_pow2( pow2:number, points: Vector2[]){
       // debug_assert!(pow2 < 5);
        const self=this
        points[0] = self.points[0];
        subdivide(self, points.slice(1), pow2);

        let quad_count = 1 << pow2;
        let pt_count = 2 * quad_count + 1;
        const hasNonFinite = points.slice(0, pt_count).some(n => !Number.isFinite(n));
        if (hasNonFinite) {
            // if we generated a non-finite, pin ourselves to the middle of the hull,
            // as our first and last are already on the first/last pts of the hull.
            // for p in points.iter_mut().take(pt_count - 1).skip(1) {
            //     *p = self.points[1];
            // }
            for(let i=0;i<pt_count-1;i++){
                this.points[i+1]=this.points[1]
            }
        }

        return 1<<pow2
    }
     chop():[Conic, Conic] {
        const self=this;
        let scale = Vector2.splat(1/(1.0 + self.weight));
        let new_w = subdivide_weight_value(self.weight);

        let p0 = self.points[0].clone();
        let p1 = self.points[1].clone();
        let p2 = self.points[2].clone();
        let ww = Vector2.splat(self.weight);

        let wp1 = ww.clone().mul(p1);
        let m = (p0.clone().add(times_2(wp1)).add(p2)).multiply(scale).mul( Vector2.splat(0.5));
        let  m_pt = Vector2.from(m);
        if(!m_pt.isFinite()) {
            let w_d = self.weight;
            let w_2 = w_d * 2.0;
            let scale_half = 1.0 / (1.0 + w_d) * 0.5;
            m_pt.x = ((self.points[0].x
                + w_2 * self.points[1].x
                + self.points[2].x)
                * scale_half);

            m_pt.y = ((self.points[0].y 
                + w_2 * self.points[1].y
                + self.points[2].y)
                * scale_half);
        }

        return [
            new Conic({
                points: [self.points[0], Vector2.from((p0.clone().add(wp1)).mul(scale)), m_pt],
                weight: new_w,
            }),
            new Conic({
                points: [m_pt, Vector2.from((wp1.clone().add(p2)).mul(scale)), self.points[2]],
                weight: new_w,
            }),
        ]
    }
   
}


export function build_unit_arc(
    u_start: Vector2,
    u_stop: Vector2,
    dir: PathDirection,
    user_transform: Transform,
    dst: Conic[],
):Conic[]|undefined {
    // rotate by x,y so that u_start is (1.0)
    let x = u_start.dot(u_stop);
    let  y = u_start.cross(u_stop);

    let abs_y = Math.abs(y);

    // check for (effectively) coincident vectors
    // this can happen if our angle is nearly 0 or nearly 180 (y == 0)
    // ... we use the dot-prod to distinguish between 0 and 180 (x > 0)
    if(abs_y <= SCALAR_NEARLY_ZERO
        && x > 0.0
        && ((y >= 0.0 && dir == PathDirection.CW) || (y <= 0.0 && dir == PathDirection.CCW)))
    {
        return;
    }

    if (dir == PathDirection.CCW) {
        y = -y;
    }

    // We decide to use 1-conic per quadrant of a circle. What quadrant does [xy] lie in?
    //      0 == [0  .. 90)
    //      1 == [90 ..180)
    //      2 == [180..270)
    //      3 == [270..360)
    //
    let quadrant = 0;
    if(y == 0.0) {
        quadrant = 2; // 180
        //debug_assert!((x + 1.0) <= SCALAR_NEARLY_ZERO);
    } else if(x == 0.0) {
        //debug_assert!(abs_y - 1.0 <= SCALAR_NEARLY_ZERO);
        quadrant =  y > 0.0 ?1:3; // 90 / 270
    } else {
        if (y < 0.0) {
            quadrant += 2;
        }

        if ((x < 0.0) != (y < 0.0)) {
            quadrant += 1;
        }
    }

    let quadrant_points = [
        Vector2.create(1.0, 0.0),
        Vector2.create(1.0, 1.0),
        Vector2.create(0.0, 1.0),
        Vector2.create(-1.0, 1.0),
        Vector2.create(-1.0, 0.0),
        Vector2.create(-1.0, -1.0),
        Vector2.create(0.0, -1.0),
        Vector2.create(1.0, -1.0),
    ];

    const QUADRANT_WEIGHT: f32 = SCALAR_ROOT_2_OVER_2;

    let  conic_count = quadrant;
    for(let i=0;i<conic_count;i++) {
        dst[i] = Conic.from_points(quadrant_points.slice(i*2), QUADRANT_WEIGHT);
    }

    // Now compute any remaining (sub-90-degree) arc for the last conic
    let final_pt = Vector2.create(x, y);
    let last_q = quadrant_points[quadrant * 2]; // will already be a unit-vector
    let dot = last_q.dot(final_pt);
   // debug_assert!(0.0 <= dot && dot <= 1.0 + SCALAR_NEARLY_ZERO);

    if (dot < 1.0) {
        let  off_curve = Vector2.create(last_q.x + x, last_q.y + y);
        // compute the bisector vector, and then rescale to be the off-curve point.
        // we compute its length from cos(theta/2) = length / 1, using half-angle identity we get
        // length = sqrt(2 / (1 + cos(theta)). We already have cos() when to computed the dot.
        // This is nice, since our computed weight is cos(theta/2) as well!
        let cos_theta_over_2 = Math.sqrt((1.0 + dot) / 2.0);
        off_curve.setLength(1/cos_theta_over_2);
        if(!last_q.almostEqual(off_curve)) {
            dst[conic_count] = Conic.new(last_q, off_curve, final_pt, cos_theta_over_2);
            conic_count += 1;
        }
    }

    // now handle counter-clockwise and the initial unitStart rotation
    let  transform = Transform.from_sin_cos(u_start.y, u_start.x);
    if (dir == PathDirection.CCW) {
        transform = transform.pre_scale(1.0, -1.0);
    }

    transform = transform.post_concat(user_transform);


    // for conic in dst.iter_mut().take(conic_count) {
    //     transform.map_points(&mut conic.points);
    // }
    dst.slice(conic_count).forEach((c,i)=>{
            transform.map_points(c.points,c.points)
    })

    if (conic_count == 0) {
        return
    } else {
        //Some(&dst[0..conic_count])
        return dst.slice(0,conic_count)
    }
}

function subdivide_weight_value(w: f32){
    return Math.sqrt(0.5 + w * 0.5)
}

function subdivide(src:Conic,points:Vector2[],level:number):Vector2[] {
    if (level == 0) {
        points[0] = src.points[1];
        points[1] = src.points[2];
        return points.slice(2)
    } else {
        let  dst = src.chop();

        let start_y = src.points[0].y;
        let end_y = src.points[2].y;
        if( between(start_y, src.points[1].y, end_y)) {
            // If the input is monotonic and the output is not, the scan converter hangs.
            // Ensure that the chopped conics maintain their y-order.
            let mid_y = dst[0].points[2].y;
            if( !between(start_y, mid_y, end_y)) {
                // If the computed midpoint is outside the ends, move it to the closer one.
                let closer_y = Math.abs((mid_y - start_y)) < Math.abs((mid_y - end_y))?
                 start_y
                : end_y;
                dst[0].points[2].y = closer_y;
                dst[1].points[0].y = closer_y;
            }

            if (!between(start_y, dst[0].points[1].y, dst[0].points[2].y)) {
                // If the 1st control is not between the start and end, put it at the start.
                // This also reduces the quad to a line.
                dst[0].points[1].y = start_y;
            }

            if (!between(dst[1].points[0].y, dst[1].points[1].y, end_y)) {
                // If the 2nd control is not between the start and end, put it at the end.
                // This also reduces the quad to a line.
                dst[1].points[1].y = end_y;
            }

            // Verify that all five points are in order.
            // debug_assert!(between(start_y, dst.0.points[1].y, dst.0.points[2].y));
            // debug_assert!(between(
            //     dst.0.points[1].y,
            //     dst.0.points[2].y,
            //     dst.1.points[1].y
            // ));
            // debug_assert!(between(dst.0.points[2].y, dst.1.points[1].y, end_y));
       
        }

        level -= 1;
        points = subdivide(dst[0], points, level);
        return subdivide(dst[1] ,points, level)
    }
}

// This was originally developed and tested for pathops: see SkOpTypes.h
// returns true if (a <= b <= c) || (a >= b >= c)
function between(a: f32, b: f32, c: f32) {
  return  (a - b) * (c - b) <= 0.0
}

class AutoConicToQuads{
    points:Vector2[]=[]
    len:number=0
    static compute(pt0: Vector2, pt1: Vector2, pt2: Vector2, weight: f32) {
        let conic = Conic.new(pt0, pt1, pt2, weight);
        let pow2 = conic.compute_quad_pow2(0.25);
        if(pow2===void 0){
            return
        }
        let points = Array.from({length:64},()=>Vector2.zero())
        let len = conic.chop_into_quads_pow2(pow2,points);
        //Some(AutoConicToQuads { points, len })
        return new this({
            points,
            len
        })
    }
    constructor(options?:{

    }){
        if(options){
            Object.assign(this,options)
        }
    }
}
export {
    AutoConicToQuads,
    QuadCoeff,
    Conic,
    CubicCoeff,
    find_cubic_cusp,
    find_cubic_extrema,
    find_quad_max_curvature,
    find_cubic_inflections,
    find_cubic_max_curvature,
    find_quad_extrema,
    find_unit_quad_roots,
    eval_cubic_pos_at,
    eval_quad_tangent_at,
    eval_cubic_tangent_at,
    eval_quad_at,
    chop_quad_at,
    chop_cubic_at2,
    new_t_values
    
}