// @ts-nocheck
import { nCr,interpolate,almostEqual } from "../math/math"
import { Vector2 } from "../math/vec2"
import { AutoConicToQuads } from "./conic"
import {endpoint_to_center,center_to_endpoint} from './arc'
import { BoundingRect } from "../math/bounding_rect"

function deg(rad) {
    return rad * 180 / Math.PI

}
function rad(degrees) {
    return degrees * Math.PI / 180
}
// N阶贝塞尔曲线
export const bezierCurveInterpolate=(vectors,t)=>{
    let n=vectors.length-1,c,t1,t2
    let ret=Vector2.create(0,0)
    for(let i=0;i<=n;i++){
        c=nCr(n,i)
        t1=Math.pow(1-t,n-i)
        t2=Math.pow(t,i)
        ret.x+=c*vectors[i].x*t1*t2
        ret.y+=c*vectors[i].y*t1*t2
    }
    return ret;
}
export const cubicBezierInterpolate=(p0,p1,p2,p3,t)=>{
    let inv_t=1-t,inv_tt=inv_t*inv_t,inv_ttt=inv_tt*inv_t;
    let tt=t*t,ttt=tt*t;
    let t0=inv_ttt,t1=3*inv_tt*t,t2=3*inv_t*tt,t3=ttt
    return p0*t0+p1*t1+p2*t2+p3*t3
}
export const quadraticBezierInterpolate=(p0,p1,p2,t)=>{
    let inv_t=1-t,inv_tt=inv_t*inv_t;
    let tt=t*t;
    let t0=inv_tt,t1=2*inv_t*t,t2=tt
    return p0*t0+p1*t1+p2*t2
}
// 三次曲率
export function cubicBezierCurvature(t, P0, P1, P2, P3) {
    const x0 = P0.x, y0 = P0.y;
    const x1 = P1.x, y1 = P1.y;
    const x2 = P2.x, y2 = P2.y;
    const x3 = P3.x, y3 = P3.y;

    // First derivative
    const dx = 3 * Math.pow(1 - t, 2) * (x1 - x0) +
               6 * (1 - t) * t * (x2 - x1) +
               3 * Math.pow(t, 2) * (x3 - x2);

    const dy = 3 * Math.pow(1 - t, 2) * (y1 - y0) +
               6 * (1 - t) * t * (y2 - y1) +
               3 * Math.pow(t, 2) * (y3 - y2);

    // Second derivative
    const ddx = 6 * (1 - t) * (x2 - 2 * x1 + x0) +
                6 * t * (x3 - 2 * x2 + x1);

    const ddy = 6 * (1 - t) * (y2 - 2 * y1 + y0) +
                6 * t * (y3 - 2 * y2 + y1);

    // Curvature
    const numerator = Math.abs(dx * ddy - dy * ddx);
    const denominator = Math.pow(dx * dx + dy * dy, 1.5);

    return denominator === 0 ? 0 : numerator / denominator;
}
// 二次曲率
export function quadraticBezierCurvature(t, P0, P1, P2) {
    const x0 = P0.x, y0 = P0.y;
    const x1 = P1.x, y1 = P1.y;
    const x2 = P2.x, y2 = P2.y;

    // First derivative
    const dx = 2 * ((x1 - x0) + t * (x2 - 2 * x1 + x0));
    const dy = 2 * ((y1 - y0) + t * (y2 - 2 * y1 + y0));

    // Second derivative
    const ddx = 2 * (x2 - 2 * x1 + x0);
    const ddy = 2 * (y2 - 2 * y1 + y0);

    // Curvature
    const numerator = Math.abs(dx * ddy - dy * ddx);
    const denominator = Math.pow(dx * dx + dy * dy, 1.5);

    return denominator === 0 ? 0 : numerator / denominator;
}

//三次贝塞尔曲线
export const cubicBezierCurveInterpolate=(p0,cp1,cp2,p3,t)=>{
    let ret=Vector2.create(0,0)
    let inv_t=1-t,inv_tt=inv_t*inv_t,inv_ttt=inv_tt*inv_t;
    let tt=t*t,ttt=tt*t;
    let t0=inv_ttt,t1=3*inv_tt*t,t2=3*inv_t*tt,t3=ttt
    ret.x=p0.x*t0+cp1.x*t1+cp2.x*t2+p3.x*t3
    ret.y=p0.y*t0+cp1.y*t1+cp2.y*t2+p3.y*t3
  ///  ret.x=p0.x*Math.pow(1-t,3)+3*cp1.x*Math.pow(1-t,2)*t+3*cp2.x*(1-t)*Math.pow(t,2)+p3.x*Math.pow(t,3)
  //  ret.y=p0.y*Math.pow(1-t,3)+3*cp1.y*Math.pow(1-t,2)*t+3*cp2.y*(1-t)*Math.pow(t,2)+p3.y*Math.pow(t,3)
    return ret
}
// 二次贝塞尔曲线
export const quadraticBezierCurveInterpolate=(p0,p1,p2,t)=>{
    let ret=Vector2.create(0,0)
    let inv_t=1-t,inv_tt=inv_t*inv_t;
    let tt=t*t;
    let t0=inv_tt,t1=2*inv_t*t,t2=tt
    ret.x=p0.x*t0+p1.x*t1+p2.x*t2
    ret.y=p0.y*t0+p1.y*t1+p2.y*t2
   // ret.x=p0.x*Math.pow(1-t,2)+2*cp1.x*(1-t)*t+p2.x*Math.pow(t,2) 
  //  ret.y=p0.y*Math.pow(1-t,2)+2*cp1.y*(1-t)*t+p2.y*Math.pow(t,2) 
    return ret

}

export function subdivideQuadraticBezierByCurvature(p0, p1, p2, points:Vector2[] = []) {
    function recursiveSubdivide(t0, t1, insertionIndex, depth) {
        if (depth > 999) {
            return 0;
        }
        const left = quadraticBezierCurveInterpolate(p0, p1, p2, t0)
        const right = quadraticBezierCurveInterpolate(p0, p1, p2, t1)
        const MinimumSqrDistance = 1.75
        const DivisionThreshold = -0.99995
        if (left.distanceToSquared(right) < MinimumSqrDistance) {
            return 0;
        }
        const midT = (t0 + t1) / 2;
        const mid = quadraticBezierCurveInterpolate(p0, p1, p2, midT);

        var leftDirection = left.clone().sub(mid).normalize()
        var rightDirection = right.clone().sub(mid).normalize()

        if (leftDirection.dot(rightDirection) > DivisionThreshold || Math.abs(midT - 0.5) < 0.0001) {
            let pointsAddedCount = 0;
            pointsAddedCount += recursiveSubdivide(t0, midT, insertionIndex, depth + 1)
            //  pointsAddedCount += FindDrawingPoints(curveIndex, t0, midT, pointList, insertionIndex, controlPoints, depth + 1);
            points.splice(insertionIndex + pointsAddedCount, 0, mid);
            pointsAddedCount++;
            pointsAddedCount += recursiveSubdivide(midT, t1, insertionIndex + pointsAddedCount, depth + 1)
            //   FindDrawingPoints(curveIndex, midT, t1, pointList, insertionIndex + pointsAddedCount, controlPoints, depth + 1);
            return pointsAddedCount;
        }

        return 0;
    }

    const left = quadraticBezierCurveInterpolate(p0, p1, p2, 0)
    const right = quadraticBezierCurveInterpolate(p0, p1, p2, 1)
    points.push(left);
    points.push(right);
    recursiveSubdivide(0, 1, 1,1);
    return points;
}

export function subdivideCubicBezierByCurvature(p0, p1, p2, p3, points:Vector2[] = []) {
    function recursiveSubdivide(t0, t1, insertionIndex, depth) {
        if (depth > 999) {
            return 0;
        }
        const left = cubicBezierCurveInterpolate(p0, p1, p2, p3, t0)
        const right = cubicBezierCurveInterpolate(p0, p1, p2, p3, t1)
        const MinimumSqrDistance = 1.75
        const DivisionThreshold = -0.9995

        if (left.distanceToSquared(right) < MinimumSqrDistance) {
            return 0;
        }
        const midT = (t0 + t1) / 2;
        const mid = cubicBezierCurveInterpolate(p0, p1, p2, p3, midT);

        var leftDirection = left.clone().sub(mid).normalize()
        var rightDirection = right.clone().sub(mid).normalize()

        if (leftDirection.dot(rightDirection) > DivisionThreshold || Math.abs(midT - 0.5) < 0.0001) {
            let pointsAddedCount = 0;
            pointsAddedCount += recursiveSubdivide(t0, midT, insertionIndex, depth + 1)
            //  pointsAddedCount += FindDrawingPoints(curveIndex, t0, midT, pointList, insertionIndex, controlPoints, depth + 1);
            points.splice(insertionIndex + pointsAddedCount, 0, mid);
            pointsAddedCount++;
            pointsAddedCount += recursiveSubdivide(midT, t1, insertionIndex + pointsAddedCount, depth + 1)
            //   FindDrawingPoints(curveIndex, midT, t1, pointList, insertionIndex + pointsAddedCount, controlPoints, depth + 1);
            return pointsAddedCount;
        }

        return 0;
    }

    const left = cubicBezierCurveInterpolate(p0, p1, p2, p3, 0)
    const right = cubicBezierCurveInterpolate(p0, p1, p2, p3, 1)
    points.push(left);
    points.push(right);
    recursiveSubdivide(0, 1, 1, 0);
    return points;
}


function subdivide_cubic(c, left, right) {
    const p1x = (c[0] + c[2]) / 2;
    const p1y = (c[1] + c[3]) / 2;
    const p2x = (c[2] + c[4]) / 2;
    const p2y = (c[3] + c[5]) / 2;
    const p3x = (c[4] + c[6]) / 2;
    const p3y = (c[5] + c[7]) / 2;
    const p4x = (p1x + p2x) / 2;
    const p4y = (p1y + p2y) / 2;
    const p5x = (p2x + p3x) / 2;
    const p5y = (p2y + p3y) / 2;
    const p6x = (p4x + p5x) / 2;
    const p6y = (p4y + p5y) / 2;

    const p0x = c[0];
    const p0y = c[1];
    const p7x = c[6];
    const p7y = c[7];

    left[0] = p0x;
    left[1] = p0y;
    left[2] = p1x;
    left[3] = p1y;
    left[4] = p4x;
    left[5] = p4y;
    left[6] = p6x;
    left[7] = p6y;

    right[0] = p6x;
    right[1] = p6y;
    right[2] = p5x;
    right[3] = p5y;
    right[4] = p3x;
    right[5] = p3y;
    right[6] = p7x;
    right[7] = p7y;
}

function st_arr(arr, offset) {
    return new Float32Array(arr.buffer, (arr.buffer.byteLength / arr.BYTES_PER_ELEMENT - arr.length + offset) * Float32Array.BYTES_PER_ELEMENT)
}
/**
 * @param {Float32Array} cin 
 * @param {Float32Array} cout //16
 */
function subdivide_cubic2(cin, cout) {
    subdivide_cubic(cin, cout, st_arr(cout, 8));

}
/**
 * @param {Float32Array} cin 
 * @param {Float32Array} cout //32
 */
function subdivide_cubic4(cin, cout) {
    subdivide_cubic(cin, cout, st_arr(cout, 16));
    subdivide_cubic2(cout, cout);
    subdivide_cubic2(st_arr(cout, 16), st_arr(cout, 16));
}
/**
 * @param {Float32Array} cin 
 * @param {Float32Array} cout //64
 */
function subdivide_cubic8(cin, cout) {
    subdivide_cubic(cin, cout, st_arr(cout, 32));
    subdivide_cubic4(cout, cout);
    subdivide_cubic4(st_arr(cout, 32), st_arr(cout, 32));
}
/**
 * 
 * @param {Float32Array} c 8
 * @param {Float32Array} q 6 
 */
function cubic_to_quadratic(c, q) {
    q[0] = c[0];
    q[1] = c[1];
    q[2] = (3 * (c[2] + c[4]) - (c[0] + c[6])) / 4;
    q[3] = (3 * (c[3] + c[5]) - (c[1] + c[7])) / 4;
    q[4] = c[6];
    q[5] = c[7];
}


function evaluate_quadratic(x0, y0, x1, y1, x2, y2, t, out) {
    const Ax = x0 - 2 * x1 + x2;
    const Ay = y0 - 2 * y1 + y2;
    const Bx = 2 * (x1 - x0);
    const By = 2 * (y1 - y0);
    const Cx = x0;
    const Cy = y0;

    out[0] = Ax * t * t + Bx * t + Cx;
    out[1] = Ay * t * t + By * t + Cy;
}


function get_quadratic_bounds(x0, y0, x1, y1, x2, y2,
    stroke_width, outMin, outMax) {
    // TODO：如果控制点恰好位于开始和结束之间，则除以零

    const tx = (x0 - x1) / (x0 - 2 * x1 + x2);
    const ty = (y0 - y1) / (y0 - 2 * y1 + y2);

    outMin[0] = Math.min(x0, x2);
    outMin[1] = Math.min(y0, y2);
    outMax[0] = Math.max(x0, x2);
    outMax[1] = Math.max(y0, y2);

    let out = new Float32Array(2)
    if (0 < tx && tx < 1) {
        let x, y;
        evaluate_quadratic(x0, y0, x1, y1, x2, y2, tx, out);
        x = out[0]
        y = out[1]
        outMin[0] = Math.min(outMin[0], x);
        outMin[1] = Math.min(outMin[1], y);
        outMax[0] = Math.max(outMax[0], x);
        outMax[1] = Math.max(outMax[1], y);
    }

    if (0 < ty && ty < 1) {
        let x, y;
        evaluate_quadratic(x0, y0, x1, y1, x2, y2, ty, out);
        x = out[0]
        y = out[1]
        outMin[0] = Math.min(outMin[0], x);
        outMin[1] = Math.min(outMin[1], y);
        outMax[0] = Math.max(outMax[0], x);
        outMax[1] = Math.max(outMax[1], y);
    }

    outMin[0] -= stroke_width * 0.5;
    outMin[1] -= stroke_width * 0.5;
    outMax[0] += stroke_width * 0.5;
    outMax[1] += stroke_width * 0.5;
}

function evaluate_cubic(x0, y0, x1, y1, x2, y2, x3, y3, t, out) {
    const Ax = -x0 + 3 * x1 - 3 * x2 + x3;
    const Ay = -y0 + 3 * y1 - 3 * y2 + y3;
    const Bx = 3 * (x0 - 2 * x1 + x2);
    const By = 3 * (y0 - 2 * y1 + y2);
    const Cx = 3 * (x1 - x0);
    const Cy = 3 * (y1 - y0);
    const Dx = x0;
    const Dy = y0;

    out[0] = Ax * t * t * t + Bx * t * t + Cx * t + Dx;
    out[1] = Ay * t * t * t + By * t * t + Cy * t + Dy;
}
//计算三次贝塞尔曲线的边界框。
//通过求解曲线的一阶导数找到可能的极值点。
function get_cubic_bounds(x0, y0, x1, y1, x2, y2, x3, y3, stroke_width, outMin, outMax) {
    // 使用起点和终点初始化边界
    outMin[0] = Math.min(x0, x3);
    outMin[1] = Math.min(y0, y3);
    outMax[0] = Math.max(x0, x3);
    outMax[1] = Math.max(y0, y3);

    // 计算导数为零的 t 值

    const txRoots = [];
    const tyRoots = [];

    //求解 x 和 y 的导数方程
    const Ax = -x0 + 3 * x1 - 3 * x2 + x3;
    const Ay = -y0 + 3 * y1 - 3 * y2 + y3;
    const Bx = 2 * (x0 - 2 * x1 + x2);
    const By = 2 * (y0 - 2 * y1 + y2);
    const Cx = x1 - x0;
    const Cy = y1 - y0;

    // 求解 x 的二次方程：At^2 + Bt + C = 0
    solveQuadratic(Ax, Bx, Cx, txRoots);
    solveQuadratic(Ay, By, Cy, tyRoots);

    // 检查 x 的根
    const out = new Float32Array(2);
    for (const t of txRoots) {
        if (t > 0 && t < 1) {
            evaluate_cubic(x0, y0, x1, y1, x2, y2, x3, y3, t, out);
            outMin[0] = Math.min(outMin[0], out[0]);
            outMax[0] = Math.max(outMax[0], out[0]);
        }
    }

    // 检查 y 的根
    for (const t of tyRoots) {
        if (t > 0 && t < 1) {
            evaluate_cubic(x0, y0, x1, y1, x2, y2, x3, y3, t, out);
            outMin[1] = Math.min(outMin[1], out[1]);
            outMax[1] = Math.max(outMax[1], out[1]);
        }
    }

    // 将描边宽度添加到边界
    outMin[0] -= stroke_width * 0.5;
    outMin[1] -= stroke_width * 0.5;
    outMax[0] += stroke_width * 0.5;
    outMax[1] += stroke_width * 0.5;
}
// 求解二次方程 
// 返回所有实数解
function solveQuadratic(a, b, c, roots) {
    // 求解一元二次方程: ax^2 + bx + c = 0
    // a不能等于0
    if (Math.abs(a) < 1e-6) {
        if (Math.abs(b) > 1e-6) {
            roots.push(-c / b);
        }
        return;
    }

    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return;

    const sqrtDiscriminant = Math.sqrt(discriminant);
    roots.push((-b - sqrtDiscriminant) / (2 * a));
    roots.push((-b + sqrtDiscriminant) / (2 * a));
}



enum PATH_VERBS  {
    MOVE,
    LINE,
    QUAD,
    CUBIC,
    CLOSE
}
class PathBuilder {
    pointsLen = 0
    verbsLen = 0
    points:number[] = []
    verbs:PATH_VERBS[] = []
    lastMoveIndex = -1
    moveToRequired = true
    _lastPoint = Vector2.zero()
    _lastMovePoint = Vector2.zero()
    get isEmpty() {
        return this.verbsLen <= 0
    }
    get lastVerb() {
        return this.isEmpty ? null : this.verbs[this.verbsLen - 1]
    }
    get lastMovePoint() {
        if (this.isEmpty) {
            return null
        }
        this._lastMovePoint.set(this.points[this.lastMoveIndex], this.points[this.lastMoveIndex + 1])
        return this._lastMovePoint
    }
    get lastPoint() {
        if (this.isEmpty) {
            return null
        }
        this._lastPoint.set(this.points[this.pointsLen - 2], this.points[this.pointsLen - 1])
        return this._lastPoint
    }
    clear() {
        this.points.length = 0
        this.verbs.length = 0
        this.pointsLen = 0
        this.verbsLen = 0
        this.moveToRequired = true
        this.lastMoveIndex = -1
    }
    injectMoveToIfNeeded() {
        if (!this.moveToRequired) {
            return this
        }
        let lastPoint = this.lastPoint
        if (lastPoint !== null) {
            this.moveTo(lastPoint.x, lastPoint.y)
        } else {
            this.moveTo(0, 0)
        }
        return this
    }
    addPoint(x, y) {
        this.points[this.pointsLen++] = x;
        this.points[this.pointsLen++] = y;
        return this;
    }
    addVerb(v) {
        this.verbs[this.verbsLen++] = v;
        return this
    }
    moveTo(x, y) {
        if (this.lastVerb === PATH_VERBS.MOVE) {
            this.points[this.lastMoveIndex] = x
            this.points[this.lastMoveIndex + 1] = y
        } else {
            this.lastMoveIndex = this.pointsLen
            this.moveToRequired = false
            this.addPoint(x, y).addVerb(PATH_VERBS.MOVE)
        }
        return this;
    }
    lineTo(x, y) {
        this.injectMoveToIfNeeded()
        return this.addPoint(x, y).addVerb(PATH_VERBS.LINE)
    }
    quadraticCurveTo(cpx, cpy, x, y) {
        this.injectMoveToIfNeeded()
        return this.addPoint(cpx, cpy).addPoint(x, y).addVerb(PATH_VERBS.QUAD)
    }
    quadraticCurveToCubicBezier(cpx, cpy, x, y) {
        this.injectMoveToIfNeeded()
        const lastPoint = this.lastPoint!
        return this.quadraticCurveToCubic(lastPoint.x, lastPoint.y, cpx, cpy, x, y)
    }
    quadraticCurveToCubic(x0, y0, cpx, cpy, x, y) {
        const r13 = 1 / 3;
        const r23 = 2 / 3;
        const cp1x = r13 * x0 + r23 * cpx
        const cp1y = r13 * y0 + r23 * cpy

        const cp2x = r13 * x + r23 * cpx
        const cp2y = r13 * y + r23 * cpy
        return this.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
    }
    // x0=10,qx=20,x1=30
    // 30*1/3+20*2/3=23.333333333333336
    // (20-30)*2/3+30=23.333333333333336
    // 30*1/3+20*2/3==(20-30)*2/3+30) 
    // 30-30*2/3=30*1/3
    // (20-30)*2/3+30)=20*2/3+30-30*2/3=20*2/3+30*1/3
    quadraticCurveToCubic2(x0, y0, cpx, cpy, x, y) {
        const r23 = 2 / 3;
        const cp1x = (cpx - x0) * r23 + x0
        const cp1y = (cpy - y0) * r23 + y0

        const cp2x = (cpx - x) * r23 + x
        const cp2y = (cpy - y) * r23 + y
        return this.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
    }
    quadraticCurveToCubic3(x0, y0, cpx, cpy, x, y) {
        let cp1x=interpolate(x0,cpx,2/3)
        let cp1y=interpolate(y0,cpy,2/3)
        let cp2x=interpolate(x,cpx,2/3)
        let cp2y=interpolate(y,cpy,2/3)
        return this.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
    }
    // 10*1/3+20*2/3==(20-10)*2/3+10==(10-20)*1/3+20
    quadraticCurveToCubic4(x0, y0, cpx, cpy, x, y) {
        const r13 = 1 / 3;
        const cp1x = (x0 - cpx) * r13 + cpx
        const cp1y = (y0 - cpy) * r13 + cpy

        const cp2x = (x - cpx) * r13 + cpx
        const cp2y = (y - cpy) * r13 + cpy
        return this.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
    }
    bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
        this.injectMoveToIfNeeded()
        return this.addPoint(cp1x, cp1y).addPoint(cp2x, cp2y).addPoint(x, y).addVerb(PATH_VERBS.CUBIC)
    }
    cubicToQuadratic(x2, y2, x3, y3, x4, y4) {
        this.injectMoveToIfNeeded()
        let x1 = this.lastPoint!.x, y1 = this.lastPoint!.y
        let i;

        let cin = new Float32Array([x1, y1, x2, y2, x3, y3, x4, y4]);
        let cout = new Float32Array(64);
        subdivide_cubic8(cin, cout);

        for (i = 0; i < 8; ++i) {
            let q = new Float32Array(6);
            cubic_to_quadratic(st_arr(cout, i * 8), q);
            this.quadraticCurveTo(q[2], q[3], q[4], q[5])
        }

    }

    conicTo(x1, y1, x, y, weight) {

        if(!(weight > 0.0)) {
            this.lineTo(x, y);
        } else if (!Number.isFinite(weight)) {
            this.lineTo(x1, y1);
            this.lineTo(x, y);
        } else if(weight == 1.0 ){
            this.quadraticCurveTo(x1, y1, x, y);
        } else {
            this.injectMoveToIfNeeded()

            let last = this.lastPoint
            let quadder = AutoConicToQuads.compute(
                last,
                Vector2.create(x1, y1),
                Vector2.create(x, y),
                weight,
            );
            if(quadder){
                // Points are ordered as: 0 - 1 2 - 3 4 - 5 6 - ..
                // `count` is a number of pairs +1
                let  offset = 1;
                for(let i=0;i<quadder.len;i++) {
                    let pt1 = quadder.points[offset + 0];
                    let pt2 = quadder.points[offset + 1];
                    this.quadraticCurveTo(pt1.x, pt1.y, pt2.x, pt2.y);
                    offset += 2;
                }
            }
        }
    }
    arcTo(x1, y1, x2, y2, radius) {
        if (radius < 0) {
            throw new DOMException("radii cannot be negative", "IndexSizeError");
        }
        this.injectMoveToIfNeeded()
        const x0 = this.lastPoint!.x;
        const y0 = this.lastPoint!.y;

        const x21 = x2 - x1;
        const y21 = y2 - y1;
        const x01 = x0 - x1;
        const y01 = y0 - y1;
        const l01_2 = x01 * x01 + y01 * y01;

        const epsilon = 1e-6
        if (this.isEmpty) {
            this.moveTo(x1, y1);
        }
        // Or, is (x1,y1) coincident with (x0,y0)? Do nothing.
        else if (l01_2 <= epsilon) {
            return;
        }
        // Or, are (x0,y0), (x1,y1) and (x2,y2) collinear?
        // Equivalently, is (x1,y1) coincident with (x2,y2)?
        // Or, is the radius zero? Line to (x1,y1).
        else if (almostEqual(y01 * x21, y21 * x01) || !radius) {
            this.lineTo(x1, y1);
        }
        // Otherwise, draw an arc
        else {
            const x20 = x2 - x0;
            const y20 = y2 - y0;
            const l21_2 = x21 * x21 + y21 * y21;
            const l20_2 = x20 * x20 + y20 * y20;
            const l21 = Math.sqrt(l21_2);
            const l01 = Math.sqrt(l01_2);
            const adjacent = l21_2 + l01_2 - l20_2;
            const hypot = 2 * l21 * l01;
            const arccosine = Math.acos(adjacent / hypot);
            const l = radius * Math.tan((Math.PI - arccosine) / 2);
            const t01 = l / l01;
            const t21 = l / l21;

            // If the start tangent is not coincident with (x0,y0), line to.
            if (!almostEqual(t01, 1)) {
                this.lineTo((x1 + t01 * x01), (y1 + t01 * y01));
            }

            const sweep = y01 * x20 > x01 * y20 ? 1 : 0;
            const endX = x1 + t21 * x21;
            const endY = y1 + t21 * y21;

            this.ellipticalArc(this.lastPoint!.x, this.lastPoint!.y, radius, radius, 0, 0, sweep, endX, endY)
        }
    }
    arc(x, y, radius, startAngle, endAngle, counterclockwise) {
        this.ellipse(x, y, radius, radius, 0, startAngle, endAngle, counterclockwise)
    }
    arcToOval(x, y, rx, ry, rotation, startAngle, deltaAngle, shouldLineTo:boolean=false) {
        const { x1, y1, x2, y2, fa, fs } = center_to_endpoint(
            x,
            y,
            rx,
            ry,
            rotation,
            startAngle,
            deltaAngle
        )
        if (shouldLineTo) {
            this.moveTo(x1, y1)
        }
        this.ellipticalArc(x1, y1, rx, ry, deg(rotation), fa, fs, x2, y2)
    }
    // 自:2d-2DRasterize/path-rendering
    ellipticalArc(x1, y1, radiusX, radiusY, axisAngle, largeArc, sweepClockwise, x2, y2) {
        const M_PI = Math.PI, cos = Math.cos, sin = Math.sin
      
        let i, nquads;
        let phi = axisAngle * M_PI / 180;
        const {cx,cy,rx:rh,ry:rv,theta1,dtheta}=endpoint_to_center(x1,y1,x2,y2,largeArc,sweepClockwise,radiusX,radiusY,phi)
    
        nquads = Math.ceil(Math.abs(dtheta) * 4 / M_PI);
        for (i = 0; i < nquads; ++i) {
            let t1 = theta1 + (i / nquads) * dtheta;
            let t2 = theta1 + ((i + 1) / nquads) * dtheta;
            let tm = (t1 + t2) / 2;

            x1 = cos(phi) * rh * cos(t1) - sin(phi) * rv * sin(t1) + cx;
            y1 = sin(phi) * rh * cos(t1) + cos(phi) * rv * sin(t1) + cy;

            x2 = cos(phi) * rh * cos(t2) - sin(phi) * rv * sin(t2) + cx;
            y2 = sin(phi) * rh * cos(t2) + cos(phi) * rv * sin(t2) + cy;

            let xm = cos(phi) * rh * cos(tm) - sin(phi) * rv * sin(tm) + cx;
            let ym = sin(phi) * rh * cos(tm) + cos(phi) * rv * sin(tm) + cy;

            let xc = (xm * 4 - (x1 + x2)) / 2;
            let yc = (ym * 4 - (y1 + y2)) / 2;

            this.quadraticCurveTo(xc, yc, x2, y2)
        }
    }
    ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, ccw) {
        if (radiusX < 0 || radiusY < 0) {
            throw new DOMException("radii cannot be negative", "IndexSizeError");
        }
        const tau = Math.PI * 2
        let newStartAngle = startAngle % tau;
        if (newStartAngle <= 0) {
            newStartAngle += tau;
        }

        let delta = newStartAngle - startAngle;
        startAngle = newStartAngle;
        endAngle += delta;

        if (!ccw && (endAngle - startAngle) >= tau) {
            // Draw complete ellipse
            endAngle = startAngle + tau;
        }
        else if (ccw && (startAngle - endAngle) >= tau) {
            // Draw complete ellipse
            endAngle = startAngle - tau;
        }
        else if (!ccw && startAngle > endAngle) {
            endAngle = startAngle + (tau - (startAngle - endAngle) % tau);
        }
        else if (ccw && startAngle < endAngle) {
            endAngle = startAngle - (tau - (endAngle - startAngle) % tau);
        }

        let sweepDegrees = deg(endAngle - startAngle);
        let startDegrees = deg(startAngle);

        //绘制 2 180 度线段，因为尝试一次绘制所有 360 度
        //不绘制任何内容。
        if (almostEqual(Math.abs(sweepDegrees), 360)) {
            const halfSweep = sweepDegrees / 2;
            this.moveTo(this.lastPoint!.x,this.lastPoint!.y)
            this.arcToOval(
                x,
                y,
                radiusX,
                radiusY,
                rotation,
                rad(startDegrees),
                rad(halfSweep),
                true
            );
            this.arcToOval(
                x,
                y,
                radiusX,
                radiusY,
                rotation,
                rad(startDegrees + halfSweep),
                rad(halfSweep)
            );
        }
        else {
            this.arcToOval(
                x,
                y,
                radiusX,
                radiusY,
                rotation,
                rad(startDegrees),
                rad(sweepDegrees),
                true
            );
        }
    }
    pushRect(rect){
        this.moveTo(rect.left, rect.top);
        this.lineTo(rect.right, rect.top);
        this.lineTo(rect.right, rect.bottom);
        this.lineTo(rect.left, rect.bottom);
        this.close();
    }
    /**
     * 
     * @param {BoundingRect} oval 
     */
    pushOval(oval){
        const self=this;
        let cx = oval.cx;
        let cy = oval.cy

        let oval_points = [
            Vector2.create(cx, oval.bottom),
            Vector2.create(oval.left, cy),
            Vector2.create(cx, oval.top),
            Vector2.create(oval.right, cy),
        ];

        let rect_points = [
            Vector2.create(oval.right, oval.bottom),
            Vector2.create(oval.left, oval.bottom),
            Vector2.create(oval.left, oval.top),
            Vector2.create(oval.right, oval.top),
        ];
        let weight = 0.707106781;
        self.moveTo(oval_points[3].x, oval_points[3].y);
        for(let i=0;i<4;i++) {
            let p1=rect_points[i]
            let p2=oval_points[i]
            self.conicTo(p1.x,p1.y, p2.x,p2.y, weight);
        }
        self.close();
    }
    pushCircle(x, y, r) {
        this.pushOval(BoundingRect.fromXYWH(x - r, y - r, r + r, r + r));
        
    }
    ellipse2(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise) {

        let { x1, y1, x2, y2, fa, fs } = center_to_endpoint(x, y, radiusX, radiusY, rotation, startAngle, endAngle - startAngle)
        // 根据 counterclockwise 调整扫描标志
        fs = counterclockwise ? 0 : 1;
        let { cx, cy, theta1, dtheta } = endpoint_to_center(x1, y1, x2, y2, fa, fs, radiusX, radiusY, rotation)


        // let rhrv = [radiusX, radiusY], cxcy = [], theta_dtaheta = []
        // endpoint_to_center(x1, y1, x2, y2, fa, counterclockwise, rhrv, rotation, cxcy, theta_dtaheta);
        // radiusX = rhrv[0]
        // radiusY = rhrv[1]
        //  cx = cxcy[0]
        //  cy = cxcy[1]
        //  theta1 = theta_dtaheta[0]
        //  dtheta = theta_dtaheta[1]

        const M_PI = Math.PI, cos = Math.cos, sin = Math.sin
        let nquads = Math.ceil(Math.abs(dtheta) * 4 / Math.PI);

        this.moveTo(x1, y1)

        for (let i = 0; i < nquads; ++i) {
            let t1 = theta1 + (i / nquads) * dtheta;
            let t2 = theta1 + ((i + 1) / nquads) * dtheta;
            let tm = (t1 + t2) / 2;

            x1 = cos(rotation) * radiusX * cos(t1) - sin(rotation) * radiusY * sin(t1) + cx;
            y1 = sin(rotation) * radiusX * cos(t1) + cos(rotation) * radiusY * sin(t1) + cy;

            x2 = cos(rotation) * radiusX * cos(t2) - sin(rotation) * radiusY * sin(t2) + cx;
            y2 = sin(rotation) * radiusX * cos(t2) + cos(rotation) * radiusY * sin(t2) + cy;

            let xm = cos(rotation) * radiusX * cos(tm) - sin(rotation) * radiusY * sin(tm) + cx;
            let ym = sin(rotation) * radiusX * cos(tm) + cos(rotation) * radiusY * sin(tm) + cy;

            let xc = (xm * 4 - (x1 + x2)) / 2;
            let yc = (ym * 4 - (y1 + y2)) / 2;

            this.quadraticCurveTo(xc, yc, x2, y2)
        }
    }
    rect(x, y, w, h) {
        this.moveTo(x, y)
        this.lineTo(x + w, y)
        this.lineTo(x + w, y + h)
        this.lineTo(x, y + h)
        this.close()
    }
    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {number} width 
     * @param {number} height 
     * @param {number||number[]} radius [all-corners]
        [top-left-and-bottom-right, top-right-and-bottom-left]
        [top-left, top-right-and-bottom-left, bottom-right]
        [top-left, top-right, bottom-right, bottom-left]
     */
    roundRect(x, y, width, height, radius) {
        let ctx = this;
        // 如果 radius 是数字，统一处理为四个角的半径
        if (typeof radius === 'number') {
            radius = { tl: radius, tr: radius, br: radius, bl: radius };
        } else if (Array.isArray(radius)) {
            if (radius.length === 2) {
                radius = { tl: radius[0], tr: radius[1], br: radius[0], bl: radius[1] };
            } else if (radius.length === 3) {
                radius = { tl: radius[0], tr: radius[1], br: radius[2], bl: radius[1] };
            } else if (radius.length === 4) {
                radius = { tl: radius[0], tr: radius[1], br: radius[2], bl: radius[3] };
            }
        } else {
            radius = Object.assign({ tl: 0, tr: 0, br: 0, bl: 0 }, radius);
        }

        // 起点为左上角，移动到起始位置
        ctx.moveTo(x + radius.tl, y);

        // 上边
        ctx.lineTo(x + width - radius.tr, y);
        ctx.arcTo(x + width, y, x + width, y + radius.tr, radius.tr);

        // 右边
        ctx.lineTo(x + width, y + height - radius.br);
        ctx.arcTo(x + width, y + height, x + width - radius.br, y + height, radius.br);

        // 下边
        ctx.lineTo(x + radius.bl, y + height);
        ctx.arcTo(x, y + height, x, y + height - radius.bl, radius.bl);

        // 左边
        ctx.lineTo(x, y + radius.tl);
        ctx.arcTo(x, y, x + radius.tl, y, radius.tl);

        ctx.close(); // 闭合路径
    }

    close() {
        if (!this.isEmpty) {
            if (this.lastVerb !== PATH_VERBS.CLOSE) {
                this.addVerb(PATH_VERBS.CLOSE)
            }
        }
        this.moveToRequired = true
    }
    [Symbol.iterator]():Iterator<[number,{type:PATH_VERBS,p0:Vector2,p1:Vector2,p2:Vector2}]> {
        const that=this;
       return (function*(){
        let i = 0, len = that.verbsLen, pointsIndex = 0, points = that.points
        for (; i < len; i++) {
            let type = that.verbs[i]
            let ret:any = {}
            switch (type) {
                case PATH_VERBS.MOVE:
                    pointsIndex += 2
                    ret.p0 = Vector2.create(points[pointsIndex - 2], points[pointsIndex - 1])
                    break
                case PATH_VERBS.LINE:
                    pointsIndex += 2
                    ret.p0 = Vector2.create(points[pointsIndex - 2], points[pointsIndex - 1])
                    break
                case PATH_VERBS.QUAD:
                    pointsIndex += 4
                    ret.p0 = Vector2.create(points[pointsIndex - 4], points[pointsIndex - 3])
                    ret.p1 = Vector2.create(points[pointsIndex - 2], points[pointsIndex - 1])
                    break
                case PATH_VERBS.CUBIC:
                    pointsIndex += 6
                    ret.p0 = Vector2.create(points[pointsIndex - 6], points[pointsIndex - 5])
                    ret.p1 = Vector2.create(points[pointsIndex - 4], points[pointsIndex - 3])
                    ret.p2 = Vector2.create(points[pointsIndex - 2], points[pointsIndex - 1])
                    break
                case PATH_VERBS.CLOSE:
                    break
            }
            yield [i, { type: type, ...ret }]
        }
       })();
    }
    interpolate(start, end, t) {
        return start + (end - start) * t
    }
    quadraticBezierInterpolate(p0, p1, p2, t) {
        return this.interpolate(this.interpolate(p0, p1, t), this.interpolate(p1, p2, t), t)
    }
    cubicBezierInterpolate(p0, p1, p2, p3, t) {
        const v0 = this.interpolate(p0, p1, t)
        const v1 = this.interpolate(p1, p2, t)
        const v2 = this.interpolate(p2, p3, t)
        return this.interpolate(this.interpolate(v0, v1, t), this.interpolate(v1, v2, t),t)
    }
    // N阶
    bezierInterpolate(p, t) {
        const len = p.length
        if (len <= 1) {
            return len > 0 ? p[0] : 0
        }
        const n = len - 1;
        const sub:number[] = []
        for (let i = 0; i < n; i++) {
            sub.push(this.interpolate(p[i], p[i + 1], t))
        }
        return this.bezierInterpolate(sub, t)
    }

    /**
     * 
     * @param {Vector2[]} positions 
     * @param {*} lineWidth 
     * @param {*} lineJoin 
     * @param {*} lineCap 
     * @param {*} miterLimit 
     * @returns 
     */
    generateLineVertices(positions, lineWidth, lineJoin = 'miter', lineCap = 'butt', miterLimit = 10) {
        const vertices = [];
        const halfWidth = lineWidth / 2;
        positions = positions.reduce((a, b) => {
            if (a.length > 0) {
                let last = a[a.length - 1]
                if (last[0] !== b[0] || last[1] !== b[1]) {
                    a.push(b)
                }
            } else {
                a.push(b)
            }
            return a;
        }, [])
        for (let i = 0; i < positions.length - 1; i++) {
            const p1 = positions[i];
            const p2 = positions[i + 1];

            // 计算线段法线
            const dx = p2[0] - p1[0];
            const dy = p2[1] - p1[1];
            const len = Math.sqrt(dx * dx + dy * dy);
            const nx = -dy / len;
            const ny = dx / len;

            // 计算顶点偏移
            const offsetX = nx * halfWidth;
            const offsetY = ny * halfWidth;

            // 两条边
            const left1 = [p1[0] - offsetX, p1[1] - offsetY];
            const right1 = [p1[0] + offsetX, p1[1] + offsetY];
            const left2 = [p2[0] - offsetX, p2[1] - offsetY];
            const right2 = [p2[0] + offsetX, p2[1] + offsetY];

            // 将带状三角形的顶点加入数组
            vertices.push(...left1, ...right1, ...left2, ...right2);

            // 处理线端样式
            if (i === 0) {
                this.handleLineCap(p1, p2, halfWidth, vertices, true, lineCap); // 起点圆头
            }
            if (i === positions.length - 2) {
                this.handleLineCap(p2, p1, halfWidth, vertices, false, lineCap); // 终点圆头
            }

            // 处理线段连接样式
            if (i < positions.length - 2) {
                const p3 = positions[i + 2];
                this.handleLineJoin(p2, p1, p3, lineWidth, lineJoin, miterLimit, vertices);
            }
        }
        return new Float32Array(vertices);
    }
    handleLineCap(current, prev, halfWidth, vertices, isStart, capType = 'round') {
        const dx = current[0] - prev[0]
        const dy = current[1] - prev[1]
        const len = Math.sqrt(dx * dx + dy * dy)
        const dir = [dx / len, dy / len]
        const normal = [-dy / len, dx / len]

        if (capType === 'butt') {
            // butt 类型不需要额外处理
            return;
        } else if (capType === 'square') {
            // square 端帽在终点延伸半个线宽的距离
            const origin = [current[0] + dir[0] * halfWidth, current[1] + dir[1] * halfWidth]

            const offsetX = normal[0] * halfWidth;
            const offsetY = normal[1] * halfWidth;

            const left2 = [origin[0] - offsetX, origin[1] - offsetY];
            const right2 = [origin[0] + offsetX, origin[1] + offsetY];

            if (isStart) {
                vertices.unshift(...right2, ...left2);
            } else {
                vertices.push(...left2, ...right2);
            }
        } else if (capType === 'round') {
            // round 端帽生成半圆

            const steps = 20; // 细分段数
            const angleStep = Math.PI / steps; // 每个小段的角度范围
            const startAngle = Math.atan2(dy, dx) - (Math.PI * 0.5); // 起点从180度开始，终点从0度开始

            const capVertices = []
            for (let i = 0; i <= steps; i++) {
                const angle = startAngle + i * angleStep;
                const x = current[0] + Math.cos(angle) * halfWidth;
                const y = current[1] + Math.sin(angle) * halfWidth;

                if (i > 0) {
                    // 生成三角形扇形，中心点是position
                    if (isStart) {
                        vertices.unshift(current[0], current[1], prevX, prevY, x, y);
                    } else {
                        vertices.push(current[0], current[1], prevX, prevY, x, y);
                    }
                }

                var prevX = x;
                var prevY = y;
            }

        }
    }
    // 处理线段连接
    handleLineJoin(current, prev, next, lineWidth, lineJoin, miterLimit, vertices) {
        // 根据 lineJoin 类型处理拐角连接
        if (lineJoin === 'miter') {
            // // 实现斜角限制，确保拐角不会过尖
            // // 根据计算生成顶点
            // const miterLength = calculateMiterLength(prev, current, next);
            // if (miterLength > miterLimit) {
            //     // 斜角过尖时，改用bevel连接
            //     handleBevelJoin(current, prev, next, lineWidth, vertices);
            // }
            this.handleMiterJoin(current, prev, next, lineWidth, miterLimit, vertices)
        } else if (lineJoin === 'bevel') {
            this.handleBevelJoin(current, prev, next, lineWidth, vertices);
        } else if (lineJoin === 'round') {
            this.handleRoundJoin(current, prev, next, lineWidth, vertices);
        }
    }
    calculateMiterLength(p0, p1, p2, maxMiterLength) {

        // 辅助函数：归一化向量
        function normalize(v) {
            const length = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
            return [v[0] / length, v[1] / length];
        }
        // 计算方向向量
        const d1 = normalize([p1[0] - p0[0], p1[1] - p0[1]]);
        const d2 = normalize([p2[0] - p1[0], p2[1] - p1[1]]);

        // 计算法线向量
        const n1 = [-d1[1], d1[0]]; // 顺时针法线
        const n2 = [-d2[1], d2[0]];

        // 计算 Miter 向量
        const miter = normalize([n1[0] + n2[0], n1[1] + n2[1]]);

        // 计算 Miter 长度
        const dotProduct = miter[0] * n1[0] + miter[1] * n1[1];
        const miterLength = Math.abs(1 / dotProduct);

        // 判断是否超过给定的 miterLength
        return miterLength > maxMiterLength;
    }


    handleMiterJoin(current, prev, next, lineWidth, miterLimit, vertices) {
        const halfWidth = lineWidth / 2;
        const l1 = subtract(prev, current)
        const l2 = subtract(next, current)

        const l1_n = normalize(l1)
        const l2_n = normalize(l2)


        //const sign=
        const bisector = normalize(add(l1_n, l2_n))
        const ab_n = computeNormal(prev, current)
        const cos = computeDot(bisector, ab_n)
        if (cos === 1) {
            return
        }
        // 两个线段的夹角
        //
        const bate = computeDot(l1_n, l2_n)
        // CanvasRenderingContext2D.prototype.miterLimit
        const miterLength = Math.abs(halfWidth / cos);
        // miterLimit 是用来限制斜接长度不能超过一定倍数的线宽。如果 L 超过了 miterLimit * lineWidth
        const miterLength2 = 1 / Math.sin(Math.acos(bate / 2)) // L= 1/sin(θ/2)

        if (miterLength2 > halfWidth * miterLimit) {
            this.handleBevelJoin(current, prev, next, lineWidth, vertices)
            return
        }
        const b1 = add(current, multiplyScalar(bisector, -miterLength))
        vertices.push(...b1)
        // vertices.push(b2)
    }
    // 处理圆角连接
    handleRoundJoin(current, prev, next, lineWidth, vertices) {
        // 计算前后两段的法线
        const normal1 = computeDirection(prev, current);
        const normal2 = computeDirection(next, current);

        const cos = computeDot(normal1, normal2)
        if (cos == 1) {
            return
        }
        const normal1_perpendicular = [-normal1[1], normal1[0]]
        const normal2_perpendicular = [-normal2[1], normal2[0]]

        let angle_1 = Math.atan2(normal1_perpendicular[1], normal1_perpendicular[0])
        let angle_2 = Math.atan2(normal2_perpendicular[1], normal2_perpendicular[0])

        const angle = angle_2 - angle_1


        // 计算两个法线的中线
        // const normal=normalize([normal1[0]+normal2[0],normal1[1]+normal2[1]])


        const halfWidth = lineWidth / 2;
        const steps = 10; // 圆弧的细分次数
        const angleStep = Math.PI / steps; // 每个小段的角度

        // 计算起始角度和终止角度
        let startAngle = angle_1//-(Math.PI*0.5);
        let prevX, prevY;
        // 圆弧生成点
        for (let i = 0; i <= steps; i++) {
            const angle = startAngle + i * angleStep;
            const x = current[0] + Math.cos(angle) * halfWidth;
            const y = current[1] + Math.sin(angle) * halfWidth;

            if (i > 0) {
                // 生成圆弧的三角形（每个小段）
                vertices.push(current[0], current[1], prevX, prevY, x, y);
            }

            prevX = x;
            prevY = y;
        }
    }
    // 实现bevel连接
    handleBevelJoin(current, prev, next, lineWidth, vertices) {
        const halfWidth = lineWidth / 2;

        // 计算法线
        const normal1 = computeNormal(current, prev);
        const normal2 = computeNormal(next, current);

        // 扩展点
        const left1 = [current[0] - normal1[0] * halfWidth, current[1] - normal1[1] * halfWidth];
        const right1 = [current[0] + normal1[0] * halfWidth, current[1] + normal1[1] * halfWidth];
        const left2 = [current[0] - normal2[0] * halfWidth, current[1] - normal2[1] * halfWidth];
        const right2 = [current[0] + normal2[0] * halfWidth, current[1] + normal2[1] * halfWidth];

        // 生成 bevel 三角形（用左点）
        vertices.push(...left1, ...right1, ...left2);

        // 如果需要，你也可以选择生成右侧的三角形（可选）
        vertices.push(...right1, ...right2, ...left2);
    }
    getLines() {
        let lines = [], lastPoint = Vector2.zero(), firstMovePoint = null;
        for (let [i, d] of this) {
            switch (d.type) {
                case PATH_VERBS.MOVE:
                    if (firstMovePoint === null) {
                        firstMovePoint = d.point.clone()
                    }
                    lines.push(d.point)
                    lastPoint.copy(d.point)
                    break
                case PATH_VERBS.LINE:
                    lines.push(d.point)
                    lastPoint.copy(d.point)
                    break
                case PATH_VERBS.QUAD:
                    lines = lines.concat(subdivideQuadraticBezierByCurvature(lastPoint, d.p0, d.p1))
                    lastPoint.copy(d.p1)
                    break
                case PATH_VERBS.CUBIC:
                    lines = lines.concat(subdivideCubicBezierByCurvature(lastPoint, d.p0, d.p1, d.p2))
                    lastPoint.copy(d.p2)
                    break
                case PATH_VERBS.CLOSE:
                    if (firstMovePoint !== null) {
                        lines.push(firstMovePoint)
                        firstMovePoint = null
                    }
                    break
            }
        }
        return lines
    }
    getBounds() {
        let lines = [], lastPoint = Vector2.zero(), firstMovePoint = null;
        let min = new Float32Array([Infinity, Infinity]), max = new Float32Array([-Infinity, -Infinity])
        let min2 = new Float32Array(2), max2 = new Float32Array(2)
        for (let [i, d] of this) {
            switch (d.type) {
                case PATH_VERBS.MOVE:
                    if (firstMovePoint === null) {
                        firstMovePoint = d.point.clone()
                    }
                    lastPoint.copy(d.point)
                    min[0] = Math.min(min[0], d.point.x)
                    min[1] = Math.min(min[1], d.point.y)
                    max[0] = Math.max(max[0], d.point.x)
                    max[1] = Math.max(max[1], d.point.y)
                    break
                case PATH_VERBS.LINE:
                    lines.push(d.point)
                    lastPoint.copy(d.point)
                    min[0] = Math.min(min[0], d.point.x)
                    min[1] = Math.min(min[1], d.point.y)
                    max[0] = Math.max(max[0], d.point.x)
                    max[1] = Math.max(max[1], d.point.y)
                    break
                case PATH_VERBS.QUAD:
                    get_quadratic_bounds(lastPoint.x, lastPoint.y, d.p0.x, d.p0.y, d.p1.x, d.p1.y, 1, min2, max2)
                    min[0] = Math.min(min[0], min2[0])
                    min[1] = Math.min(min[1], min2[1])
                    max[0] = Math.max(max[0], max2[0])
                    max[1] = Math.max(max[1], max2[1])
                    lastPoint.copy(d.p1)
                    break
                case PATH_VERBS.CUBIC:
                    get_cubic_bounds(lastPoint.x, lastPoint.y, d.p0.x, d.p0.y, d.p1.x, d.p1.y, d.p2.x, d.p2.y, 1, min2, max2)
                    min[0] = Math.min(min[0], min2[0])
                    min[1] = Math.min(min[1], min2[1])
                    max[0] = Math.max(max[0], max2[0])
                    max[1] = Math.max(max[1], max2[1])
                    lines = lines.concat(subdivideCubicBezierByCurvature(lastPoint, d.p0, d.p1, d.p2))
                    lastPoint.copy(d.p2)
                    break
                case PATH_VERBS.CLOSE:
                    if (firstMovePoint !== null) {
                        lines.push(firstMovePoint)
                        firstMovePoint = null
                    }
                    break
            }
        }
        return { min, max }
    }
    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    toCanvasDraw(ctx) {
        
        for (let [i, d] of this) {
            switch (d.type) {
                case PATH_VERBS.MOVE:
                    ctx.moveTo(d.p0.x, d.p0.y)
                    break
                case PATH_VERBS.LINE:
                    ctx.lineTo(d.p0.x, d.p0.y)
                    break
                case PATH_VERBS.QUAD:
                    ctx.quadraticCurveTo(d.p0.x, d.p0.y, d.p1.x, d.p1.y)
                    break
                case PATH_VERBS.CUBIC:
                    ctx.bezierCurveTo(d.p0.x, d.p0.y, d.p1.x, d.p1.y, d.p2.x, d.p2.y)
                    break
                case PATH_VERBS.CLOSE:
                    ctx.closePath()
                    break
            }
        }
    }
    toPath2D() {
        const ctx=new Path2D()
        for (let [i, d] of this) {
            switch (d.type) {
                case PATH_VERBS.MOVE:
                    ctx.moveTo(d.p0.x, d.p0.y)
                    break
                case PATH_VERBS.LINE:
                    ctx.lineTo(d.p0.x, d.p0.y)
                    break
                case PATH_VERBS.QUAD:
                    ctx.quadraticCurveTo(d.p0.x, d.p0.y, d.p1.x, d.p1.y)
                    break
                case PATH_VERBS.CUBIC:
                    ctx.bezierCurveTo(d.p0.x, d.p0.y, d.p1.x, d.p1.y, d.p2.x, d.p2.y)
                    break
                case PATH_VERBS.CLOSE:
                    ctx.closePath()
                    break
            }
        }
        return ctx
    }
}