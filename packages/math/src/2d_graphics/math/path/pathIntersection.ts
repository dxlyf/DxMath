
import { PathBuilder, PathVerb } from "./PathBuilder";
import { SkScalarNearlyZero, SkScalarSignAsInt } from '../../../math/sk/scalar'
import { Point } from '../../../math/sk/point'
import { tangent_cubic, tangent_line, tangent_quad, winding_cubic, winding_line, winding_quad } from "math/math/sk/path_intersection";
import { Ref} from "math/math/sk/util";
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
    pointIndex = 0
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
        this.pointIndex = 0

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
        let points = this.path.points, pointIndex = this.pointIndex
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
        this.pointIndex = pointIndex
        return verb
    }

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
                //tangent_conic(pts, x, y, iter.conicWeight(), & tangents);
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
            const tangent: Point = tangents[last];
            if (SkScalarNearlyZero(tangent.dot(tangent))) {
                tangents.splice(last, 1)
            } else {
                for (let index = 0; index < last; ++index) {
                    const test = tangents[index];
                    if (SkScalarNearlyZero(test.cross(tangent))
                        && SkScalarSignAsInt(tangent.x * test.x) <= 0
                        && SkScalarSignAsInt(tangent.y * test.y) <= 0) {
                        tangents.splice(last, 1);
                        tangents.splice(index, 1, tangents[tangents.length]);
                        break;
                    }
                }
            }
        }
    } while (!done);
    return Number(tangents.length ^ Number(isInverse));
}
