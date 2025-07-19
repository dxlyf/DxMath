import {PathBuilder} from './path_builder'
import {Point} from './point'
import {PathVerb,PathIterVerb} from './path_types'
export class PathIter {
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
        return this.path.fVerbs as any
    }
    setPath(path: PathBuilder, forceClose = false) {
        this.path = path
        this.verbEnd = path.fVerbs.length
        this.forceClose = forceClose
        this.lastPoint.set(0, 0)
        this.movePoint.set(0, 0)
        this.forceClose = forceClose
        this.needClose = false
        this.closeLine = false
        this.pointIndex = 0

    }
    isClosedContour() {
        if (this.path.countVerbs()<=0|| this.verbIndex === this.verbEnd) {
            return false;
        }
        if (this.forceClose) {
            return true;
        }

        if (PathIterVerb.kMoveTo === this.verbs[this.verbIndex]) {
            this.verbIndex += 1; // skip the initial moveto
        }
        while (this.verbIndex < this.verbEnd) {
            // verbs points one beyond the current verb, decrement first.
            let v = this.verbs[this.verbIndex++]
            if (PathIterVerb.kMoveTo == v) {
                break;
            }
            if (PathIterVerb.kClose == v) {
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
                return PathIterVerb.kClose;
            }

            pts[0] = this.lastPoint.clone();
            pts[1] = this.movePoint.clone();
            this.lastPoint.copy(this.movePoint);
            this.closeLine = true;
            return PathIterVerb.kLineTo;
        } else {
            pts[0] = this.movePoint.clone();
            return PathIterVerb.kClose;
        }
    }
    next(pts: Point[]) {
        if (this.verbIndex >= this.verbEnd) {
            if (this.needClose) {
                if (PathIterVerb.kLineTo == this.autoClose(pts)) {
                    return PathIterVerb.kLineTo
                }
                this.needClose = false
                return PathIterVerb.kClose
            }
            return PathIterVerb.kDone
        }
        let points = this.path.fPts, pointIndex = this.pointIndex
        let verb = this.verbs[this.verbIndex++]
        switch (verb) {
            case PathVerb.kMove:
                if (this.needClose) {
                    this.verbIndex--
                    verb = this.autoClose(pts)
                    if (verb == PathIterVerb.kClose) {
                        this.needClose = false
                    }
                    return verb
                }
                if (this.verbIndex === this.verbEnd) {
                    return PathIterVerb.kDone
                }
                this.movePoint.copy(points[pointIndex])
                pts[0] = Point.fromPoint(points[pointIndex])
                pointIndex += 1
                this.lastPoint.copy(this.movePoint)
                this.needClose = this.forceClose
                break
            case PathVerb.kLine:
                pts[0] = this.lastPoint.clone()
                pts[1] = Point.fromPoint(points[pointIndex])
                this.lastPoint.copy(points[pointIndex])
                this.closeLine = false
                pointIndex += 1
                break
            case PathVerb.kQuad:
                pts[0] = this.lastPoint.clone()
                pts[1] = Point.fromPoint(points[pointIndex])
                pts[2] = Point.fromPoint(points[pointIndex + 1])
                this.lastPoint.copy(points[pointIndex + 1])
                pointIndex += 2
                break
            case PathVerb.kCubic:
                pts[0] = this.lastPoint.clone()
                pts[1] = Point.fromPoint(points[pointIndex])
                pts[2] = Point.fromPoint(points[pointIndex + 1])
                pts[3] = Point.fromPoint(points[pointIndex + 2])
                this.lastPoint.copy(points[pointIndex + 3])
                pointIndex += 3
                break
            case PathVerb.kClose:
                verb = this.autoClose(pts)
                if (verb == PathIterVerb.kLineTo) {
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