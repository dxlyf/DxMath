
import { PathBuilder, PathVerb } from "./PathBuilder";
import { SkChopQuadAtYExtrema, SkEvalCubicAt, SkEvalQuadTangentAt, SkFindUnitQuadRoots, SkChopCubicAtYExtrema } from '../../../math/sk/geometry'
import { PointerArray } from '../../../math/sk/util'
import { SkScalarNearlyEqual,SkScalarNearlyZero,SkScalarSignAsInt} from '../../../math/sk/scalar'
import { ChopMonoAtY } from '../../../math/sk/cubicClipper'
import { Point } from '../../../math/sk/point'
enum FillRule {
    NonZero,
    EvenOdd,
    InverseNonZero,
    InverseEvenOdd,
}

type PathStyle = {
    fillRule: FillRule
}
function isInverseFillType(type: number) {
    return (type & 2) !== 0
}
export function pointInPolygon(x: number, y: number, polygon: number[], fileRule: FillRule = FillRule.NonZero) {
    let winding = 0
    for (let j = polygon.length - 2, i = 0; i < polygon.length; j = i, i += 2) {
        const x0 = polygon[j]
        const y0 = polygon[j + 1]
        const x1 = polygon[i]
        const y1 = polygon[i + 1]
        if (y > y0 !== y > y1 && x >= x0 + (x1 - x0) * (y - y0) / (y1 - y0)) {
            if (fileRule === FillRule.EvenOdd) {
                winding++
            } else {
                winding += y0 < y1 ? 1 : -1
            }
        }
    }
    return winding % 2 !== 0
}
enum PathIterVerb {
    MoveTo = PathVerb.MoveTo,
    LineTo = PathVerb.LineTo,
    QuadCurveTo = PathVerb.QuadCurveTo,
    ConicTo = PathVerb.ConicTo,
    CubicCurveTo = PathVerb.CubicCurveTo,
    Close = PathVerb.Close,
    Done = PathVerb.Close + 1
}
class PathIter {
    path!: PathBuilder;
    forceClose = false;
    needClose = false;
    closeLine = false
    verbIndex = 0
    verbEnd = 0
    lastPoint = Point.default()
    movePoint = Point.default()
    pointIndex=0
    constructor(path: PathBuilder, forceClose = false) {
        this.setPath(path, forceClose)
    }
    get verbs() {
        return this.path.verbs as any
    }
    setPath(path: PathBuilder, forceClose = false) {
        this.path = path      
        this.verbEnd = path.verbs.length
        this.forceClose = forceClose
        this.lastPoint.set(0, 0)
        this.movePoint.set(0, 0)
        this.forceClose = forceClose
        this.needClose = false
        this.closeLine = false
        this.pointIndex=0

    }
    isClosedContour() {
        if (this.path.isEmpty || this.verbIndex === this.verbEnd) {
            return false;
        }
        if (this.forceClose) {
            return true;
        }

        if (PathIterVerb.MoveTo === this.verbs[this.verbIndex]) {
            this.verbIndex += 1; // skip the initial moveto
        }
        while (this.verbIndex < this.verbEnd) {
            // verbs points one beyond the current verb, decrement first.
            let v = this.verbs[this.verbIndex++]
            if (PathIterVerb.MoveTo == v) {
                break;
            }
            if (PathIterVerb.Close == v) {
                return true;
            }
        }
        return false;
    }
    autoClose(pts: Point[]) {
        if (!this.lastPoint.equals(this.movePoint)) {
            // A special case: if both points are NaN, SkPoint::operation== returns
            // false, but the iterator expects that they are treated as the same.
            // (consider SkPoint is a 2-dimension float point).
            if (!Number.isFinite(this.lastPoint.x) || !Number.isFinite(this.lastPoint.y) ||
                !Number.isFinite(this.movePoint.x) || !Number.isFinite(this.movePoint.y)) {
                return PathIterVerb.Close;
            }

            pts[0] = this.lastPoint.clone();
            pts[1] = this.movePoint.clone();
            this.lastPoint.copy(this.movePoint);
            this.closeLine = true;
            return PathIterVerb.LineTo;
        } else {
            pts[0] = this.movePoint.clone();
            return PathIterVerb.Close;
        }
    }
    next(pts: Point[]) {
        if (this.verbIndex >= this.verbEnd) {
            if (this.needClose) {
                if (PathIterVerb.LineTo == this.autoClose(pts)) {
                    return PathIterVerb.LineTo
                }
                this.needClose = false
                return PathIterVerb.Close
            }
            return PathIterVerb.Done
        }
        let points = this.path.points, pointIndex=this.pointIndex
        let verb = this.verbs[this.verbIndex++]
        switch (verb) {
            case PathVerb.MoveTo:
                if (this.needClose) {
                    this.verbIndex--
                    verb = this.autoClose(pts)
                    if (verb == PathIterVerb.Close) {
                        this.needClose = false
                    }
                    return verb
                }
                if (this.verbIndex === this.verbEnd) {
                    return PathIterVerb.Done
                }
                this.movePoint.set(points[pointIndex], points[pointIndex + 1])
                pts[0] = Point.create(points[pointIndex], points[pointIndex + 1])
                pointIndex += 2
                this.lastPoint.copy(this.movePoint)
                this.needClose = this.forceClose
                break
            case PathVerb.LineTo:
                pts[0] = this.lastPoint.clone()
                pts[1] = Point.create(points[pointIndex], points[pointIndex + 1])
                this.lastPoint.set(points[pointIndex], points[pointIndex + 1])
                this.closeLine = false
                pointIndex += 2
                break
            case PathVerb.QuadCurveTo:
                pts[0] = this.lastPoint.clone()
                pts[1] = Point.create(points[pointIndex], points[pointIndex + 1])
                pts[2] = Point.create(points[pointIndex + 2], points[pointIndex + 3])
                this.lastPoint.set(points[pointIndex + 2], points[pointIndex + 3])
                pointIndex += 4
                break
            case PathVerb.CubicCurveTo:
                pts[0] = this.lastPoint.clone()
                pts[1] = Point.create(points[pointIndex], points[pointIndex + 1])
                pts[2] = Point.create(points[pointIndex + 2], points[pointIndex + 3])
                pts[3] = Point.create(points[pointIndex + 4], points[pointIndex + 5])
                this.lastPoint.set(points[pointIndex + 4], points[pointIndex + 5])
                pointIndex += 6
                break
            case PathVerb.Close:
                verb = this.autoClose(pts)
                if (verb == PathIterVerb.LineTo) {
                    this.verbIndex--
                } else {
                    this.needClose = false
                }
                this.lastPoint.copy(this.movePoint)
                break
        }
        this.pointIndex=pointIndex
        return verb
    }

}
class Ref<T = any> {
    static from<T = any>(value: T) {
        return new Ref<T>(value)
    }
    constructor(public value: T) { }
}
export function pointInPath(x: number, y: number, path: PathBuilder, pathStyle: PathStyle) {
    let isInverse = isInverseFillType(pathStyle.fillRule)
    if (path.isEmpty) {
        return isInverse;
    }
    const bounds = path.getBounds()

    if (!bounds.contains(x, y)) {
        return isInverse;
    }
    let iter = new PathIter(path, true)
    let done = false
    let w = 0
    let onCurveCount = Ref.from(0);
    let pts = [Point.default(), Point.default(), Point.default(), Point.default()]
    do {
        switch (iter.next(pts)) {
            case PathVerb.MoveTo:
            case PathVerb.Close:
                break;
            case PathVerb.LineTo:
                w += winding_line(pts, x, y, onCurveCount);
                break;
            case PathVerb.QuadCurveTo:
                w += winding_quad(pts, x, y, onCurveCount);
                break;
            case PathVerb.ConicTo:
                //  w += winding_conic(pts, x, y, iter.conicWeight(), & onCurveCount);
                break;
            case PathVerb.CubicCurveTo:
                w += winding_cubic(pts, x, y, onCurveCount);
                break;
            case PathIterVerb.Done:
                done = true
                break;
        }
    } while (!done);

    let evenOddFill = FillRule.EvenOdd == pathStyle.fillRule || FillRule.InverseEvenOdd == pathStyle.fillRule;
    if (evenOddFill) {
        w &= 1;
    }
    if (w) {
        return !isInverse;
    }
    if (onCurveCount.value <= 1) {
        return Boolean(Number(onCurveCount.value) ^ Number(isInverse));
    }
    if ((onCurveCount.value & 1) || evenOddFill) {
        return Boolean(Number(onCurveCount.value & 1) ^ Number(isInverse))
    }
    iter.setPath(path, true)
    done = false;
    let tangents: Point[] = []
    do {
        let oldCount = tangents.length
        switch (iter.next(pts)) {
            case PathVerb.MoveTo:
            case PathVerb.Close:
                break;
            case PathVerb.LineTo:
                tangent_line(pts, x, y, tangents);
                break;
            case PathVerb.QuadCurveTo:
                tangent_quad(pts, x, y, tangents);
                break;
            case PathVerb.ConicTo:
                //  w += winding_conic(pts, x, y, iter.conicWeight(), & onCurveCount);
                break;
            case PathVerb.CubicCurveTo:
                tangent_cubic(pts, x, y, tangents);
                break;
            case PathIterVerb.Done:
                done = true
                break;
        }
        if (tangents.length > oldCount) {
            let last = tangents.length - 1;
            const  tangent:Point = tangents[last];
            if (SkScalarNearlyZero(tangent.dot(tangent))) {
                tangents.splice(last,1)
            } else {
                for (let index = 0; index < last; ++index) {
                    const  test = tangents[index];
                    if (SkScalarNearlyZero(test.cross(tangent))
                            && SkScalarSignAsInt(tangent.x * test.x) <= 0
                            && SkScalarSignAsInt(tangent.y * test.y) <= 0) {
                        tangents.splice(last,1);
                        tangents.splice(index,1,tangents[tangents.length]);
                        break;
                    }
                }
            }
        }
    } while (!done);
    return Number(tangents.length ^ Number(isInverse));
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
    let n = SkChopCubicAtYExtrema(pts,dst);
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