import { BoundingRect } from '../BoundingRect'
import { Vector2 } from '../Vector2'
import { Bezier } from 'math/math/bezier-js/bezier'
import { nCr } from '../util'



export class QuadBezier {
    static fromPoints(p0: Vector2, p1: Vector2, p2: Vector2) {
        return new QuadBezier(p0, p1, p2)
    }
    static fromXY(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number) {
        return new QuadBezier(new Vector2(x0, y0), new Vector2(x1, y1), new Vector2(x2, y2))
    }
    p0: Vector2 = Vector2.default()
    p1: Vector2 = Vector2.default()
    p2: Vector2 = Vector2.default()
    constructor(p0: Vector2, p1: Vector2, p2: Vector2) {
        this.p0.copy(p0)
        this.p1.copy(p1)
        this.p2.copy(p2)
    }
    getBoundingBox() {
        let bounds = BoundingRect.default()
        let extrenas: Vector2[] = []
        const count = computeQuadExtremas([this.p0, this.p1, this.p2], extrenas)
        for (let i = 0; i < count; i++) {
            bounds.expandByXY(extrenas[i].x, extrenas[i].y)
        }
        // const bbox=new Bezier([this.p0, this.p1, this.p2]).bbox()
        // bounds.min.setXY(bbox.x.min, bbox.y.min)
        // bounds.max.setXY(bbox.x.max, bbox.y.max)
        return bounds
    }
    subdivide(t: number) {

    }

    /**
     * 获取贝塞尔曲线上某一点的坐标
     * @param {number} t
     * @returns
     * @memberof QuadBezier
     */
    getPoint(t: number) {
        const _tt = t * t, _1t = 1 - t, _1tt = _1t * _1t
        const x = this.p0.x * _1tt + 2 * _1t * t * this.p1.x + _tt * this.p2.x
        const y = this.p0.y * _1tt + 2 * _1t * t * this.p1.y + _tt * this.p2.y
        return Vector2.create(x, y)
    }
    getPoints(tolerance: number = 0.01) {

    }

}
export class CubicBezier {
    static fromQuadBezier(q: QuadBezier) {
        const cp1 = Vector2.lerp(Vector2.default(), q.p0, q.p1, 2 / 3)
        const cp2 = Vector2.lerp(Vector2.default(), q.p2, q.p1, 2 / 3)
        return this.fromPoints(q.p0, cp1, cp2, q.p2)
    }
    static fromPoints(p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2) {
        return new CubicBezier(p0, p1, p2, p3)
    }
    static fromXY(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
        return new CubicBezier(new Vector2(x0, y0), new Vector2(x1, y1), new Vector2(x2, y2), new Vector2(x3, y3))
    }
    p0: Vector2 = Vector2.default()
    p1: Vector2 = Vector2.default()
    p2: Vector2 = Vector2.default()
    p3: Vector2 = Vector2.default()
    constructor(p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2) {
        this.p0.copy(p0)
        this.p1.copy(p1)
        this.p2.copy(p2)
        this.p3.copy(p3)
    }
    getBoundingBox() {
        let bounds = BoundingRect.default()
        let extrenas: Vector2[] = []
        const count = computeCubicExtremas([this.p0, this.p1, this.p2, this.p3], extrenas)
        for (let i = 0; i < count; i++) {
            bounds.expandByXY(extrenas[i].x, extrenas[i].y)
        }
        // const bbox=new Bezier([this.p0, this.p1, this.p2, this.p3]).bbox()
        // bounds.min.setXY(bbox.x.min, bbox.y.min)
        // bounds.max.setXY(bbox.x.max, bbox.y.max)
        return bounds
    }
}



// 伯恩斯坦多项式
export function bernstein(n: number, i: number, t: number): number {
    return nCr(n, i) * Math.pow(t, i) * Math.pow(1 - t, n - i)
}

/**
 * 获取贝塞尔曲线的一阶导数
 * @param points 
 * @param t 
 * @returns 
 */
export function getBernsteinDerivative(points: Vector2[], t: number): Vector2 {
    const n = points.length - 1
    if (n < 0) return Vector2.default()
    let ret = Vector2.default()
    for (let i = 0; i < n; i++) {
        const b = bernstein(n - 1, i, t)
        ret.x += (points[i + 1].x - points[i].x) * b
        ret.y += (points[i + 1].y - points[i].y) * b
    }
    return ret.multiplyScalar(n)
}

/**
 * 伯恩斯坦多项式，用于计算贝塞尔曲线上的点
 * B(t)=∑(nCi)ti(1-t)(n-i)p_i
 */
export function getBezierPointWithBernstein(points: Vector2[], t: number): Vector2 {
    const n = points.length - 1
    if (n < 0) return Vector2.default()
    const ret = Vector2.default()
    for (let i = 0; i <= n; i++) {
        const p = points[i]
        const b = bernstein(n, i, t)
        ret.x += p.x * b
        ret.y += p.y * b
    }
    return ret
}
/**
 * 使用德卡斯特尔朱算法计算贝塞尔曲线上的点
 */
export function getBezierPointWithDeCasteljau(points: Vector2[], t: number): Vector2 {
    const n = points.length - 1
    if (n < 0) return Vector2.default()
    let result: Vector2[] = points.map(d => d.clone())
    for (let j = 1; j <= n; j++) {
        for (let i = 0; i < n - j + 1; i++) {
            result[i] = result[i].lerp(result[i + 1], t)
        }
    }
    return result[0]
}
/**
 * 计算贝塞尔曲线的N阶导数控制点
 * 求t的导
 * const  derivativeControls=getBezierDerivativeControlPoints(points)
 * const  tangent =getBezierPointWithDeCasteljau(derivativeControls, t)
*  计算p0点切线方向直线
* (x-p0.x)*tangent.y=(y-p0.y)*tangent.x
* 
*   求二阶导数控制点
const  firstDerivativeControls=getBezierDerivativeControlPoints(points)
const  secondDerivativeControls=getBezierDerivativeControlPoints(firstDerivativeControls)
 */
export function getBezierDerivativeControlPoints(points: Vector2[]): Vector2[] {
    const n = points.length - 1
    if (n < 0) return []
    let result: Vector2[] = Array.from({ length: n }).map(() => Vector2.default())
    for (let i = 0; i < n; i++) {
        result[i].x = n * (points[i + 1].x - points[i].x)
        result[i].y = n * (points[i + 1].y - points[i].y)
    }
    return result
}

/**
 * N阶贝塞尔曲线细分（使用德卡斯特里奥算法）
 * @param {Array} points - 控制点数组，格式 [{x, y}, ...]
 * @param {number} t - 分割参数 (0 < t < 1)
 * @returns {Array} [leftCurve, rightCurve] 分割后的两条曲线控制点
 */
export function subdivideBezier(points: Vector2[], t: number = 0.5) {
    if (points.length === 0) return [[], []];

    const n = points.length - 1;
    const left: Vector2[] = [];
    const right: Vector2[] = [];
    const tmpPoints = points.map(d => d.clone()); // 深拷贝避免修改原数组

    left.push(tmpPoints[0].clone());
    right.unshift(tmpPoints[n].clone());

    // 德卡斯特里奥算法递归插值
    for (let level = 1; level <= n; level++) {
        for (let i = 0; i < n - level + 1; i++) {
            tmpPoints[i].x = (1 - t) * tmpPoints[i].x + t * tmpPoints[i + 1].x;
            tmpPoints[i].y = (1 - t) * tmpPoints[i].y + t * tmpPoints[i + 1].y;
        }
        left.push(tmpPoints[0].clone());
        right.unshift(tmpPoints[n - level].clone());
    }

    return [left, right];
}
// 细分
export function subdivideQuadBezier(p0: Vector2, p1: Vector2, p2: Vector2, t: number = 0.5) {
    const v0 = p0.clone().lerp(p1, t)
    const v1 = p1.clone().lerp(p2, t)
    const v2 = v0.clone().lerp(v1, t)
    return [p0, v0, v2, v1, p2]
}
// 细分
export function subdivideCubicBezier(p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2, t: number = 0.5) {
    const v0 = p0.clone().lerp(p1, t)
    const v1 = p1.clone().lerp(p2, t)
    const v2 = p2.clone().lerp(p3, t)

    const v01 = v0.clone().lerp(v1, t)
    const v12 = v1.clone().lerp(v2, t)

    const v0112 = v01.clone().lerp(v12, t)
    return [p0, v0, v01, v0112, v12, v2, p3]
}
function pointOnSegmentDistance(x:number,y:number,x1:number,y1:number,x2:number,y2:number) {
    const dx = x2 - x1
    const dy = y2 - y1
    const px=x-x1;
    const py=y-y1;
    const d=dx*dx+dy*dy;
    if(d==0){
        return 0;
    }
    const t=Math.max(0,Math.min(1,(px*dx+py*dy)/d));
    const projX=x1+t*dx;
    const projY=y1+t*dy;
    const dx0=(x-projX)
    const dy0=(y-projY)
    const dist=dx0*dx0+dy0*dy0;
    return dist
}

function pointOnLineDistance(x:number,y:number,x1:number,y1:number,x2:number,y2:number) {
    const dx = x2 - x1
    const dy = y2 - y1
    const A=dy,B=-dx,C=dx*y1-dy*x1;
    return Math.abs(A*x+B*y+C)/Math.sqrt(A*A+B*B)

}

// 二次贝塞尔曲线扁平化转换成线段
export function flattenQuadBezier(p0: Vector2, p1: Vector2, p2: Vector2) {
    const points:Vector2[] = []
    function recurse(p0: Vector2, p1: Vector2, p2: Vector2, depth = 0) {
        const d01 = pointOnLineDistance(p0.x, p0.y, p0.x, p0.y, p2.x, p2.y)
        if (d01 < 0.01 ) {
            points.push(p1.clone())
            return
        }
        const midPoint = Vector2.lerp(Vector2.default(), p0, p2, 0.5)
        const cp = Vector2.lerp(Vector2.default(), p1, midPoint, 0.5)
        recurse(p0, cp, p1, depth + 1)
        recurse(cp, p2, p1, depth + 1)
    }
    recurse(p0, p1,p2)
    return points
}




/**
 * 两次贝塞尔曲线转换为三次贝塞尔曲线。
 * @param p0 
 * @param p1 
 * @param p2 
 * @returns 
 */
export function quadBezierToCubic(p0: Vector2, p1: Vector2, p2: Vector2) {
    const cp1 = Vector2.lerp(Vector2.default(), p0, p1, 2 / 3)
    const cp2 = Vector2.lerp(Vector2.default(), p2, p1, 2 / 3)
    return [p0, cp1, cp2, p2]
}

/**
 * 返回1，结果有效，0结果无效。
 * @param numer 被除数。
 * @param denom 除数
 * @param ratio 结果
 * @returns 
 */
function validUnitDivide(numer: number, denom: number, ratio: number[]) {
    if (numer < 0) {
        numer = -numer;
        denom = -denom;
    }

    if (denom == 0 || numer == 0 || numer >= denom) {
        return 0;
    }

    let r = numer / denom;
    if (!Number.isFinite(r)) {
        return 0;
    }

    if (r == 0) { // catch underflow if numer <<<< denom
        return 0;
    }
    ratio[0] = r;
    return 1;
}
/** 
 * 获取二次贝塞尔曲线极值。
 * Quad'(t) = At + B, where
    A = 2(a - 2b + c)
    B = 2(b - a)
    Solve for t, only if it fits between 0 < t < 1
*/
export function findQuadExtrema(a: number, b: number, c: number, tValue: number[]) {
    /*  At + B == 0
          t = -B / A
      */
    return validUnitDivide(a - b, a - b - b + c, tValue);
}

/** 
 * 获取三次贝塞尔曲线极值。
 * Cubic'(t) = At^2 + Bt + C, where
    A = 3(-a + 3(b - c) + d)
    B = 6(a - 2b + c)
    C = 3(b - a)
    Solve for t, keeping only those that fit betwee 0 < t < 1
*/
export function findCubicExtrema(a: number, b: number, c: number, d: number, tValue: number[]) {
    // we divide A,B,C by 3 to simplify
    const A = d - a + 3 * (b - c);
    const B = 2 * (a - b - b + c);
    const C = b - a;
    return findUnitQuadRoots(A, B, C, tValue);
}

/** From Numerical Recipes in C.

    Q = -1/2 (B + sign(B) sqrt[B*B - 4*A*C])
    x1 = Q / A
    x2 = C / Q
*/
export function findUnitQuadRoots(A: number, B: number, C: number, roots: number[]) {

    if (A == 0) {
        return validUnitDivide(-C, B, roots);
    }

    let rootsIndex = 0;

    // use doubles so we don't overflow temporarily trying to compute R
    let dr = B * B - 4 * A * C;
    if (dr < 0) {
        return 0;
    }
    dr = Math.sqrt(dr);
    let R = dr;
    if (!Number.isFinite(R)) {
        return 0;
    }

    let Q = (B < 0) ? -(B - R) / 2 : -(B + R) / 2;
    let tmp: number[] = []
    if (validUnitDivide(Q, A, tmp) > 0) {
        roots[rootsIndex] = tmp[0]
        rootsIndex++
    }
    if (validUnitDivide(C, Q, tmp)) {
        roots[rootsIndex] = tmp[0]
        rootsIndex++
    }
    if (rootsIndex == 2) {
        if (roots[0] > roots[1]) {
            let tmpValue = roots[0]
            roots[0] = roots[1]
            roots[1] = tmpValue
        } else if (roots[0] == roots[1]) { // nearly-equal?
            rootsIndex -= 1; // skip the double root
        }
    }
    return rootsIndex;
}

/**
 * 计算二次贝塞尔曲线极值点。
 * @param src 控制点
 * @param extremas 极值点
 * @returns 极值点个数
 */
export function computeQuadExtremas(src: Vector2[], extremas: Vector2[]) {
    let ts: number[] = [], tmp: number[] = [];
    let n = 0
    if (findQuadExtrema(src[0].x, src[1].x, src[2].x, tmp) > 0) {
        ts[n] = tmp[0]
        n++
    }
    if (findQuadExtrema(src[0].y, src[1].y, src[2].y, tmp) > 0) {
        ts[n] = tmp[0]
        n++
    }
    for (let i = 0; i < n; ++i) {
        extremas[i] = getBezierPointWithDeCasteljau(src, ts[i]);
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
export function computeCubicExtremas(src: Vector2[], extremas: Vector2[]) {
    let ts: number[] = [], tmp: number[] = [];
    let n = 0
    if (findCubicExtrema(src[0].x, src[1].x, src[2].x, src[3].x, tmp) > 0) {
        ts[n] = tmp[0]
        n++
    }
    if (findCubicExtrema(src[0].y, src[1].y, src[2].y, src[3].y, tmp) > 0) {
        ts[n] = tmp[0]
        n++
    }
    for (let i = 0; i < n; ++i) {
        extremas[i] = getBezierPointWithDeCasteljau(src, ts[i]);
    }
    extremas[n] = src[3];
    return n + 1;
}