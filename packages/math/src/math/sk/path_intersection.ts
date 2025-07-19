
import { SkConic, SkChopQuadAtYExtrema, SkEvalCubicAt, SkEvalQuadTangentAt, SkFindUnitQuadRoots, SkChopCubicAtYExtrema } from './geometry'
import { PointerArray,Ref } from './util'
import { SkScalarNearlyEqual, SkScalarNearlyZero, SkScalarSignAsInt } from './scalar'
import { ChopMonoAtY } from './cubicClipper'
import { Point } from './point'
import {PathFillType} from './path_types'


function isInverseFillType(type: number) {
    return (type & 2) !== 0
}
export function pointInPolygon(x: number, y: number, polygon: number[], fileRule: PathFillType = PathFillType.kEvenOdd) {
    let winding = 0
    for (let j = polygon.length - 2, i = 0; i < polygon.length; j = i, i += 2) {
        const x0 = polygon[j]
        const y0 = polygon[j + 1]
        const x1 = polygon[i]
        const y1 = polygon[i + 1]
        if (y > y0 !== y > y1 && x >= x0 + (x1 - x0) * (y - y0) / (y1 - y0)) {
            if (fileRule === PathFillType.kEvenOdd) {
                winding++
            } else {
                winding += y0 < y1 ? 1 : -1
            }
        }
    }
    return winding % 2 !== 0
}

// a<b<c or a>b>c
function between(a: number, b: number, c: number) {
    return (a - b) * (c - b) <= 0;
}
function checkOnCurve(x: number, y: number, start: Point, end: Point) {
    if (start.y == end.y) {
        return between(start.x, x, end.x) && x != end.x;
    } else {
        return x == start.x && y == start.y;
    }
}
/**
 *  Returns -1 || 0 || 1 depending on the sign of value:
 *  -1 if x < 0
 *   0 if x == 0
 *   1 if x > 0
 */
function signAsInt(x: number) {
    return x < 0 ? -1 : Number(x > 0);
}
function winding_line(pts: Point[], x: number, y: number, onCurveCount: Ref<number>) {
    let x0 = pts[0].x;
    let y0 = pts[0].y;
    let x1 = pts[1].x;
    let y1 = pts[1].y;

    let dy = y1 - y0;

    let dir = 1;
    if (y0 > y1) {
        let _tmp = y0;
        y0 = y1;
        y1 = _tmp
        dir = -1;
    }
    if (y < y0 || y > y1) {
        return 0;
    }
    if (checkOnCurve(x, y, pts[0], pts[1])) {
        onCurveCount.value += 1;
        return 0;
    }
    if (y == y1) {
        return 0;
    }
    let cross = (x1 - x0) * (y - pts[0].y) - dy * (x - x0);

    if (!cross) {
        // zero cross means the point is on the line, and since the case where
        // y of the query point is at the end point is handled above, we can be
        // sure that we're on the line (excluding the end point) here
        if (x != x1 || y != pts[1].y) {
            onCurveCount.value += 1;
        }
        dir = 0;
    } else if (signAsInt(cross) == dir) {
        dir = 0;
    }
    return dir;
}

function is_mono_quad(y0: number, y1: number, y2: number) {
    //    return SkScalarSignAsInt(y0 - y1) + SkScalarSignAsInt(y1 - y2) != 0;
    if (y0 == y1) {
        return true;
    }
    if (y0 < y1) {
        return y1 <= y2;
    } else {
        return y1 >= y2;
    }
}

function poly_eval(A: number, B: number, C: number, t: number) {
    return (A * t + B) * t + C;
}

function poly_eval_5(A: number, B: number, C: number, D: number, t: number) {
    return ((A * t + B) * t + C) * t + D;
}
function winding_mono_quad(pts: Point[], x: number, y: number, onCurveCount: Ref<number>) {
    let y0 = pts[0].y;
    let y2 = pts[2].y;

    let dir = 1;
    if (y0 > y2) {
        let _tmp = y0;
        y0 = y2;
        y2 = _tmp;
        dir = -1;
    }
    if (y < y0 || y > y2) {
        return 0;
    }
    if (checkOnCurve(x, y, pts[0], pts[2])) {
        onCurveCount.value += 1;
        return 0;
    }
    if (y == y2) {
        return 0;
    }


    let roots = PointerArray.from([0, 0]);
    let n = SkFindUnitQuadRoots(pts[0].y - 2 * pts[1].y + pts[2].y,
        2 * (pts[1].y - pts[0].y),
        pts[0].y - y,
        roots);

    let xt;
    if (0 == n) {
        // zero roots are returned only when y0 == y
        // Need [0] if dir == 1
        // and  [2] if dir == -1
        xt = pts[1 - dir].x;
    } else {
        let t = roots.get(0);
        let C = pts[0].x;
        let A = pts[2].x - 2 * pts[1].x + C;
        let B = 2 * (pts[1].x - C);
        xt = poly_eval(A, B, C, t);
    }
    if (SkScalarNearlyEqual(xt, x)) {
        if (x != pts[2].x || y != pts[2].y) {  // don't test end points; they're start points
            onCurveCount.value += 1;
            return 0;
        }
    }
    return xt < x ? dir : 0;
}
function find_minmax(N: number, pts: Point[], minPtr: Ref<number>, maxPtr: Ref<number>) {
    let min, max;
    min = max = pts[0].x;
    for (let i = 1; i < N; ++i) {
        min = Math.min(min, pts[i].x);
        max = Math.max(max, pts[i].x);
    }
    minPtr.value = min;
    maxPtr.value = max;
}
function eval_cubic_pts(c0: number, c1: number, c2: number, c3: number, t: number) {
    let A = c3 + 3 * (c1 - c2) - c0;
    let B = 3 * (c2 - c1 - c1 + c0);
    let C = 3 * (c1 - c0);
    let D = c0;
    return poly_eval_5(A, B, C, D, t);
}
function winding_mono_cubic(pts: Point[], x: number, y: number, onCurveCount: Ref<number>) {
    let y0 = pts[0].y;
    let y3 = pts[3].y;

    let dir = 1;
    if (y0 > y3) {
        let _tmp = y0;
        y0 = y3;
        y3 = _tmp;
        dir = -1;
    }
    if (y < y0 || y > y3) {
        return 0;
    }
    if (checkOnCurve(x, y, pts[0], pts[3])) {
        onCurveCount.value += 1;
        return 0;
    }
    if (y == y3) {
        return 0;
    }

    // quickreject or quickaccept
    let min = Ref.from(0), max = Ref.from(0);
    find_minmax(4, pts, min, max);
    if (x < min.value) {
        return 0;
    }
    if (x > max.value) {
        return dir;
    }

    // compute the actual x(t) value
    let t = Ref.from(0);
    if (!ChopMonoAtY(pts as any, y, t as any)) {
        return 0;
    }
    let xt = eval_cubic_pts(pts[0].x, pts[1].x, pts[2].x, pts[3].x, t.value);
    if (SkScalarNearlyEqual(xt, x)) {
        if (x != pts[3].x || y != pts[3].y) {  // don't test end points; they're start points
            onCurveCount.value += 1;
            return 0;
        }
    }
    return xt < x ? dir : 0;
}
function winding_quad(pts: Point[], x: number, y: number, onCurveCount: Ref<number>) {
    let dst: Point[] = Array.from({ length: 5 }, () => Point.default());
    let n = 0;

    if (!is_mono_quad(pts[0].y, pts[1].y, pts[2].y)) {
        n = SkChopQuadAtYExtrema(pts as any, dst as any);
        pts = dst;
    }
    let w = winding_mono_quad(pts, x, y, onCurveCount);
    if (n > 0) {
        w += winding_mono_quad(pts.slice(2), x, y, onCurveCount);
    }
    return w;
}

function winding_cubic(pts: Point[], x: number, y: number, onCurveCount: Ref<number>) {
    let dst: Point[] = Array.from({ length: 10 }, () => Point.default());
    let n = SkChopCubicAtYExtrema(pts as any, dst as any);
    let w = 0;
    for (let i = 0; i <= n; ++i) {
        w += winding_mono_cubic(dst.slice(i * 3), x, y, onCurveCount);
    }
    return w;
}
function conic_eval_numerator(src: number[], w: number, t: number) {

    let src2w = src[2] * w;
    let C = src[0];
    let A = src[4] - 2 * src2w + C;
    let B = 2 * (src2w - C);
    return poly_eval(A, B, C, t);
}
function conic_eval_denominator(w: number, t: number) {
    let B = 2 * (w - 1);
    let C = 1;
    let A = -B;
    return poly_eval(A, B, C, t);
}
function winding_mono_conic(conic: SkConic, x: number, y: number, onCurveCount: Ref<number>) {
    const pts = conic.fPts;
    let y0 = pts[0].y;
    let y2 = pts[2].y;

    let dir = 1;
    if (y0 > y2) {
        let _tmp = y0;
        y0 = y2;
        y2 = _tmp;
        dir = -1;
    }
    if (y < y0 || y > y2) {
        return 0;
    }
    if (checkOnCurve(x, y, pts[0], pts[2])) {
        onCurveCount.value += 1;
        return 0;
    }
    if (y == y2) {
        return 0;
    }

    let roots = PointerArray.from([0, 0]);
    let A = pts[2].y;
    let B = pts[1].y * conic.fW - y * conic.fW + y;
    let C = pts[0].y;
    A += C - 2 * B;  // A = a + c - 2*(b*w - yCept*w + yCept)
    B -= C;  // B = b*w - w * yCept + yCept - a
    C -= y;
    let n = SkFindUnitQuadRoots(A, 2 * B, C, roots);

    let xt = 0;
    if (0 == n) {
        // zero roots are returned only when y0 == y
        // Need [0] if dir == 1
        // and  [2] if dir == -1
        xt = pts[1 - dir].x;
    } else {
        let t = roots.get(0);
        xt = conic_eval_numerator(pts.map(d => d.x), conic.fW, t) / conic_eval_denominator(conic.fW, t);
    }
    if (SkScalarNearlyEqual(xt, x)) {
        if (x != pts[2].x || y != pts[2].y) {  // don't test end points; they're start points
            onCurveCount.value += 1;
            return 0;
        }
    }
    return xt < x ? dir : 0;
}
function winding_conic(pts: Point[], x: number, y: number, weight: number, onCurveCount: Ref<number>) {
    let conic = new SkConic(pts, weight);
    let chopped = [SkConic.default(), SkConic.default()];
    // If the data points are very large, the conic may not be monotonic but may also
    // fail to chop. Then, the chopper does not split the original conic in two.
    let isMono = is_mono_quad(pts[0].y, pts[1].y, pts[2].y) || !conic.chopAtYExtrema(chopped);
    let w = winding_mono_conic(isMono ? conic : chopped[0], x, y, onCurveCount);
    if (!isMono) {
        w += winding_mono_conic(chopped[1], x, y, onCurveCount);
    }
    return w;
}

function tangent_line(pts: Point[], x: number, y: number, tangents: Point[]) {
    let y0 = pts[0].y;
    let y1 = pts[1].y;
    if (!between(y0, y, y1)) {
        return;
    }
    let x0 = pts[0].x;
    let x1 = pts[1].x;
    if (!between(x0, x, x1)) {
        return;
    }
    let dx = x1 - x0;
    let dy = y1 - y0;
    if (!SkScalarNearlyEqual((x - x0) * dy, dx * (y - y0))) {
        return;
    }
    let v = Point.default();
    v.set(dx, dy);
    tangents.push(v)
}


function tangent_quad(pts: Point[], x: number, y: number, tangents: Point[]) {
    if (!between(pts[0].y, y, pts[1].y) && !between(pts[1].y, y, pts[2].y)) {
        return;
    }
    if (!between(pts[0].x, x, pts[1].x) && !between(pts[1].x, x, pts[2].x)) {
        return;
    }
    let roots = PointerArray.from([0, 0]);
    let n = SkFindUnitQuadRoots(pts[0].y - 2 * pts[1].y + pts[2].y,
        2 * (pts[1].y - pts[0].y),
        pts[0].y - y,
        roots);
    for (let index = 0; index < n; ++index) {
        let t = roots.get(index);
        let C = pts[0].x;
        let A = pts[2].x - 2 * pts[1].x + C;
        let B = 2 * (pts[1].x - C);
        let xt = poly_eval(A, B, C, t);
        if (!SkScalarNearlyEqual(x, xt)) {
            continue;
        }
        tangents.push(SkEvalQuadTangentAt(pts as any, t));
    }
}


function tangent_cubic(pts: Point[], x: number, y: number, tangents: Point[]) {
    if (!between(pts[0].y, y, pts[1].y) && !between(pts[1].y, y, pts[2].y)
        && !between(pts[2].y, y, pts[3].y)) {
        return;
    }
    if (!between(pts[0].x, x, pts[1].x) && !between(pts[1].x, x, pts[2].x)
        && !between(pts[2].x, x, pts[3].x)) {
        return;
    }
    let dst = Array.from({ length: 10 }, () => Point.default());
    let n = SkChopCubicAtYExtrema(pts, dst);
    for (let i = 0; i <= n; ++i) {
        let c = dst.slice(i * 3)
        let t = Ref.from(0);
        if (!ChopMonoAtY(c, y, t as any)) {
            continue;
        }
        let xt = eval_cubic_pts(c[0].x, c[1].x, c[2].x, c[3].x, t.value);
        if (!SkScalarNearlyEqual(x, xt)) {
            continue;
        }
        let tangent = Point.default();
        SkEvalCubicAt(c, t.value, null, tangent, null);
        tangents.push(tangent);
    }
}


function tangent_conic(pts: Point[], x: number, y: number, w: number, tangents: Point[]) {
    if (!between(pts[0].y, y, pts[1].y) && !between(pts[1].y, y, pts[2].y)) {
        return;
    }
    if (!between(pts[0].y, x, pts[1].y) && !between(pts[1].y, x, pts[2].y)) {
        return;
    }
    let roots=PointerArray.from([0,0]);
    let A = pts[2].y;
    let B = pts[1].y * w - y * w + y;
    let C = pts[0].y;
        A += C - 2 * B;  // A = a + c - 2*(b*w - yCept*w + yCept)
        B -= C;  // B = b*w - w * yCept + yCept - a
        C -= y;
        let n = SkFindUnitQuadRoots(A, 2 * B, C, roots);
        for (let index = 0; index < n; ++index) {
            let t = roots.get(index);
            let xt = conic_eval_numerator(pts.map(d=>d.y), w, t) / conic_eval_denominator(w, t);
        if (!SkScalarNearlyEqual(x, xt)) {
            continue;
        }
        let conic=new SkConic(pts, w);
        tangents.push(conic.evalTangentAt(t));
    }
}


export {
    winding_line,
    winding_conic,
    winding_cubic,
    winding_quad,
    tangent_conic,
    tangent_cubic,
    tangent_line,
    tangent_quad
}