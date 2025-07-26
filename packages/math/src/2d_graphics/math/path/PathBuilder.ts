import { Vector2Like, Vector2 } from '../Vector2'
import { Matrix2dLike } from '../Matrix2d'
import { pointOnEllipse, ellipseArcToCubicBezier, center_to_endpoint, quarterArcToCubicBezier } from '../curve/arc'
import { Rect, OvalPointIterator, RectPointIterator } from './Rect'
import { RRect, RRectPointIterator } from './RRrect'
import { BoundingRect } from '../BoundingRect'
import { QuadBezier, CubicBezier } from '../curve/bezier'

const PI_2 = Math.PI * 2
type Point = {
    x: number
    y: number
}
type PathBuilderVisitor = {
    moveTo: (x: number, y: number) => void,
    lineTo: (lastX: number, lastY: number, x: number, y: number) => void,
    quadraticCurveTo: (lastX: number, lastY: number, cpX: number, cpY: number, x: number, y: number) => void,
    cubicCurveTo: (lastX: number, lastY: number, cp1X: number, cp1Y: number, cp2X: number, cp2Y: number, x: number, y: number) => void,
    close: (firstMoveX: number, firstMoveY: number, lastX: number, lastY: number) => void
}

function normalizeRectRadii(radii?: number | DOMPointInit | Iterable<number | DOMPointInit>) {
    let radius: { tl: number, tr: number, br: number, bl: number } = { tl: 0, tr: 0, br: 0, bl: 0 }
    // 如果 radius 是数字，统一处理为四个角的半径
    if (typeof radii === 'number') {
        radius = { tl: radii, tr: radii, br: radii, bl: radii };
    } else if (Array.isArray(radii)) {
        if (radii.length === 1) {
            radius = { tl: radii[0], tr: radii[0], br: radii[0], bl: radii[0] };
        } else if (radii.length === 2) {
            radius = { tl: radii[0], tr: radii[1], br: radii[0], bl: radii[1] };
        } else if (radii.length === 3) {
            radius = { tl: radii[0], tr: radii[1], br: radii[2], bl: radii[1] };
        } else if (radii.length === 4) {
            radius = { tl: radii[0], tr: radii[1], br: radii[2], bl: radii[3] };
        }
    } else if (radii) {
        radius.tl = (radii as DOMPointInit).x ?? 0
        radius.tr = (radii as DOMPointInit).y ?? 0
        radius.bl = (radii as DOMPointInit).z ?? 0
        radius.br = (radii as DOMPointInit).w ?? 0
    }
    return radius
}
function normalizeAngles(startAngle: number, endAngle: number, ccw: boolean = false) {
    const tau = Math.PI * 2
    let newStartAngle = startAngle % tau;
    if (newStartAngle <= 0) {
        newStartAngle += tau;
    }
    let delta = newStartAngle - startAngle;
    startAngle = newStartAngle;
    endAngle += delta;

    if (!ccw && (endAngle - startAngle) >= tau) {
        endAngle = startAngle + tau;
    }
    else if (ccw && (startAngle - endAngle) >= tau) {
        endAngle = startAngle - tau;
    }
    else if (!ccw && startAngle > endAngle) {
        endAngle = startAngle + (tau - (startAngle - endAngle) % tau);
    }
    else if (ccw && startAngle < endAngle) {
        endAngle = startAngle - (tau - (endAngle - startAngle) % tau);
    }
    return { startAngle, endAngle }
}

export enum PathDirection {
    CW,
    CCW,
    Unknown = 0x7FFFFFFF,
}

export enum PathVerb {
    MoveTo,
    LineTo,
    QuadCurveTo,
    CubicCurveTo,
    ConicTo,
    Close
}
export enum SegmentMask {
    Line_SegmentMask = 1,
    Quad_SegmentMask = 2,
    Conic_SegmentMask = 4,
    Cubic_SegmentMask = 8,
};
export class PathBuilder {
    static default() {
        return new this()
    }
    points: number[] = []
    verbs: PathVerb[] = []
    _segmentMask = SegmentMask.Line_SegmentMask
    _lastMovePointIndex = 0
    _needMoveTo = true
    _bounds: BoundingRect | null = null
    reset() {
        this._needMoveTo = true
        this.points.length = 0
        this.verbs.length = 0
        this._lastMovePointIndex = 0
        this._bounds = null
        this._segmentMask = SegmentMask.Line_SegmentMask;
        return this
    }
    clear(){
        return this.reset()
    }
    get isEmpty() {
        return this.verbs.length === 0;
    }
    get lastVerb() {
        return this.verbs[this.verbs.length - 1];
    }
    get lastPoint() {
        const x = this.points[this.points.length - 2] || 0
        const y = this.points[this.points.length - 1] || 0
        return { x, y } as Point
    }
    get length() {
        return this.points.length
    }
    setLastPoint(x: number, y: number) {
        if (this.isEmpty) {
            this.moveTo(x, y)
        } else {
            this.points[this.length - 2] = x
            this.points[this.length - 1] = y
        }
        return this
    }
    private addPoint(x: number, y: number) {
        this.points.push(x, y)
        this._bounds = null
        return this
    }
    private addVerb(verb: PathVerb) {
        this.verbs.push(verb)
        return this
    }
    private injectMoveToIfNeeded() {
        if (this._needMoveTo) {
            if (this.length <= 0) {
                this.moveTo(0, 0)
            } else {
                this.moveTo(this.points[this.length - 2], this.points[this.length - 1]);
            }
        }
    }
    moveTo(x: number, y: number) {
        this._needMoveTo = false;
        if (this.lastVerb === PathVerb.MoveTo) {
            this.points[this._lastMovePointIndex] = x
            this.points[this._lastMovePointIndex + 1] = y
        } else {
            this._lastMovePointIndex = this.points.length
            this.addVerb(PathVerb.MoveTo)
            this.addPoint(x, y)
        }
        return this;
    }
    lineTo(x: number, y: number) {
        this.injectMoveToIfNeeded()
        this.addVerb(PathVerb.LineTo)
        this._segmentMask |= SegmentMask.Line_SegmentMask;
        return this.addPoint(x, y)
    }
    quadraticCurveTo(cpX: number, cpY: number, x: number, y: number) {
        this.injectMoveToIfNeeded()
        this.addVerb(PathVerb.QuadCurveTo)
        this.addPoint(cpX, cpY)
        this._segmentMask |= SegmentMask.Quad_SegmentMask;
        return this.addPoint(x, y)
    }
    bezierCurveTo(cp1X: number, cp1Y: number, cp2X: number, cp2Y: number, x: number, y: number) {
        return this.cubicCurveTo(cp1X, cp1Y, cp2X, cp2Y, x, y)
    }
    cubicCurveTo(cp1X: number, cp1Y: number, cp2X: number, cp2Y: number, x: number, y: number) {
        this.injectMoveToIfNeeded()
        this.addVerb(PathVerb.CubicCurveTo)
        this.addPoint(cp1X, cp1Y)
        this.addPoint(cp2X, cp2Y)
        this._segmentMask |= SegmentMask.Cubic_SegmentMask;
        return this.addPoint(x, y)
    }
    conicTo(cpX: number, cpY: number, x: number, y: number, weight: number) {
        const k = (4 * weight) / (3 * (weight + 1))
        const lastPoint = this.lastPoint
        const cp1X = lastPoint.x + (cpX - lastPoint.x) * k
        const cp1Y = lastPoint.y + (cpY - lastPoint.y) * k
        const cp2X = x + (cpX - x) * k
        const cp2Y = y + (cpY - y) * k
        return this.cubicCurveTo(cp1X, cp1Y, cp2X, cp2Y, x, y);
    }
    closePath() {
        if (!this.isEmpty) {
            if (this.lastVerb !== PathVerb.Close) {
                this.addVerb(PathVerb.Close);
            }
            this._needMoveTo = true; // 重置移动点状态
        }
        return this;
    }
    rect(x: number, y: number, w: number, h: number) {
        this.moveTo(x, y)
        this.lineTo(x + w, y)
        this.lineTo(x + w, y + h)
        this.lineTo(x, y + h)
        return this.closePath()
    }
   
    roundRect(x: number, y: number, width: number, height: number, radii?: number | DOMPointInit | Iterable<number | DOMPointInit>) {

        let radius = normalizeRectRadii(radii)
        // 分别为四个角设置半径：[左上, 右上, 右下, 左下]
        const rradii: [Vector2, Vector2, Vector2, Vector2] = [
            Vector2.create(radius.tl, radius.tl), // 左上角 (x半径, y半径)
            Vector2.create(radius.tr, radius.tr), // 右上角
            Vector2.create(radius.br, radius.br), // 右下角
            Vector2.create(radius.bl, radius.bl) // 左下角
        ];
        let rrect = RRect.default()
        rrect.setRectRadii(Rect.fromXYWH(x, y, width, height), rradii)
        this.addRRect(rrect)

    }
    /**
     * 
     * @param x 
     * @param y 
     * @param width 
     * @param height 
     * @param radius all-corners
        [all-corners]
        [top-left-and-bottom-right, top-right-and-bottom-left]
        [top-left, top-right-and-bottom-left, bottom-right]
        [top-left, top-right, bottom-right, bottom-left]
     */
    roundRect2(x: number, y: number, width: number, height: number, radii?: number | DOMPointInit | Iterable<number | DOMPointInit>) {

        let radius = normalizeRectRadii(radii)
        // 起点为左上角，移动到起始位置
        this.moveTo(x + radius.tl, y);

        // 上边
        this.lineTo(x + width - radius.tr, y);
        this.arcTo(x + width, y, x + width, y + radius.tr, radius.tr);

        // 右边
        this.lineTo(x + width, y + height - radius.br);
        this.arcTo(x + width, y + height, x + width - radius.br, y + height, radius.br);

        // 下边
        this.lineTo(x + radius.bl, y + height);
        this.arcTo(x, y + height, x, y + height - radius.bl, radius.bl);

        // 左边
        this.lineTo(x, y + radius.tl);
        this.arcTo(x, y, x + radius.tl, y, radius.tl);

        this.closePath(); // 闭合路径
    }
    ellipse2(cx: number, cy: number, rx: number, ry: number, rotation = 0, startAngle = 0, endAngle = PI_2, ccw = false) {

        ({ startAngle, endAngle } = normalizeAngles(startAngle, endAngle, ccw));
        let sweepDegrees = (endAngle - startAngle);
        let startDegrees = (startAngle);
        if (Math.abs(sweepDegrees - Math.PI * 2) <= 1e-6) {
            const halfSweep = sweepDegrees / 2
            this.arcToOval(cx, cy, rx, ry, rotation, startDegrees, halfSweep, true)
            this.arcToOval(cx, cy, rx, ry, rotation, startDegrees + halfSweep, halfSweep, false)
        } else {
            this.arcToOval(cx, cy, rx, ry, rotation, startDegrees, sweepDegrees, true)
        }

    }
    ellipse(cx: number, cy: number, rx: number, ry: number, rotation = 0, startAngle = 0, endAngle = PI_2, ccw = false) {

        ({ startAngle, endAngle } = normalizeAngles(startAngle, endAngle, ccw));
        const deltaAngle = endAngle - startAngle
        // 计算起始点
        const startPt = pointOnEllipse(cx, cy, rx, ry, rotation, startAngle);

        if (this.isEmpty) {
            this.moveTo(startPt.x, startPt.y);
        } else {
            this.lineTo(startPt.x, startPt.y);
        }
        // 分段，每段角度不超过 π/2
        const segments = Math.ceil(Math.abs(deltaAngle) / (Math.PI / 2));
        let segAngle = deltaAngle / segments;
        let theta1 = startAngle
        for (let i = 0; i < segments; i++) {
            const theta2 = theta1 + segAngle;
            const bezier = quarterArcToCubicBezier(cx, cy, rx, ry, rotation, theta1, theta2);
            this.bezierCurveTo(bezier[2], bezier[3], bezier[4], bezier[5], bezier[6], bezier[7]);
            theta1 = theta2
        }
        if(Math.abs(deltaAngle)>=Math.PI*2){
            this.closePath()
        }
        return this;
    }
    ellipseArc(x1: number, y1: number, x2: number, y2: number,
        rx: number, ry: number, xAxisRotation: number,
        largeArcFlag: boolean, sweepFlag: boolean) {
        ellipseArcToCubicBezier(x1, y1, x2, y2, rx, ry, xAxisRotation, largeArcFlag, sweepFlag, (x0: number, y0: number, cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number, i: number) => {
            if (i === 0) {
                if (this.isEmpty) {
                    this.moveTo(x0, y0)
                } else {
                    this.lineTo(x0, y0)
                }
            }
            this.cubicCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
        })
    }
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise: boolean = false) {
        this.ellipse(x, y, radius, radius, 0, startAngle, endAngle, counterclockwise)
    }
    arcTo(x1: number, y1: number, x2: number, y2: number, radius: number) {
        this.injectMoveToIfNeeded()

        if (radius === 0) {
            this.lineTo(x1, y1)
            return
        }
        const lastPoint = this.lastPoint
        const p0 = Vector2.fromPoint(lastPoint)
        const p1 = Vector2.create(x1, y1)
        const p2 = Vector2.create(x2, y2)

        let d0 = p1.clone().sub(p0).normalize()
        let d1 = p2.clone().sub(p1).normalize()
        let cosh = d0.dot(d1)
        let sinh = d0.cross(d1)

        // 如果是水平
        if (Math.abs(sinh) <= 1e-6) {
            this.lineTo(x1, y1)
            return
        }
        // 计算一半正切 (1-cos)/sin)=tan(angle/2)
        // 半径*正切=等夹角高度
        let dist = Math.abs(radius * (1 - cosh) / sinh)
        let start = p1.clone().sub(d0.mulScalar(dist))
        let end = p1.clone().add(d1.mulScalar(dist))
        let weight = Math.sqrt(0.5 + cosh * 0.5);
        this.lineTo(start.x, start.y)
        this.conicTo(x1, y1, end.x, end.y, weight)
    }
    arcTo2(x1: number, y1: number, x2: number, y2: number, radius: number) {
        this.injectMoveToIfNeeded()

        if (radius === 0) {
            this.lineTo(x1, y1)
            return
        }
        const lastPoint = this.lastPoint
        const p0 = Vector2.fromPoint(lastPoint)
        const p1 = Vector2.create(x1, y1)
        const p2 = Vector2.create(x2, y2)

        let d0 = p1.clone().sub(p0).normalize()
        let d1 = p2.clone().sub(p1).normalize()
        let cosh = d0.dot(d1)
        let sinh = d0.cross(d1)

        // 如果是水平
        if (Math.abs(sinh) <= 1e-6) {
            this.lineTo(x1, y1)
            return
        }
        // 计算切线长度 (1-cos)/sin)=tan(angle/2)
        let dist = Math.abs(radius * (1 - cosh) / sinh)
        let start = p1.clone().sub(d0.mulScalar(dist))
        let end = p1.clone().add(d1.mulScalar(dist))
        let sweepFag = sinh > 0 ? true : false
        this.lineTo(start.x, start.y)
        this.ellipseArc(start.x, start.y, end.x, end.y, radius, radius, 0, false, sweepFag)
    }
    arcToOval(x: number, y: number, rx: number, ry: number, rotation: number, startAngle: number, deltaAngle: number, forceMoveTo: boolean = false) {
        const { x1, y1, x2, y2, fa, fs } = center_to_endpoint(
            x,
            y,
            rx,
            ry,
            rotation,
            startAngle,
            deltaAngle
        )

        if (forceMoveTo) {
            this.moveTo(x1, y1)
        }
        this.ellipseArc(x1, y1, x2, y2, rx, ry, rotation, Boolean(fa), Boolean(fs))

    }
    addCircle(x: number, y: number, r: number, ccw = false) {
        if (r >= 0) {
            this.addOval(Rect.fromLTRB(x - r, y - r, x + r, y + r), ccw);
        }
        return this
    }
    addPolygon(points: number[], isClosed: boolean = true) {
        if (points.length <= 0) {
            return this;
        }
        this.moveTo(points[0], points[1]);
        for (let i = 2; i < points.length; i += 2) {
            let x = points[i]
            let y = points[i + 1]
            this.lineTo(x, y)
        }
        if (isClosed) {
            this.closePath();
        }
        return this;
    }

    addOval(oval: Rect, ccw: boolean = false, index = 1) {
        let oval_points = new OvalPointIterator(oval, ccw, index)
        let rect_points = new RectPointIterator(oval, ccw, index + (ccw ? 1 : 0));
        let weight = Math.SQRT1_2//Math.sqrt(2);
        this.moveTo(oval_points.current.x, oval_points.current.y);
        rect_points.next()
        oval_points.next()
        for (let i = 0; i < 4; ++i) {
            this.conicTo(rect_points.get(i).x, rect_points.get(i).y, oval_points.get(i).x, oval_points.get(i).y, weight);
        }
        this.closePath();
    }
    addRect(rect: Rect, ccw = false, index = 0) {
        let iter = new RectPointIterator(rect, ccw, index);
        this.moveTo(iter.get(0).x, iter.get(0).y);
        this.lineTo(iter.get(1).x, iter.get(1).y);
        this.lineTo(iter.get(2).x, iter.get(2).y);
        this.lineTo(iter.get(3).x, iter.get(3).y);
        return this.closePath();
    }
    addRRect(rrect: RRect, ccw = false, index = ccw ? 7 : 6) {

        let bounds = rrect.getBounds();
        if (rrect.isRect() || rrect.isEmpty()) {
            // degenerate(rect) => radii points are collapsing
            this.addRect(bounds, ccw, (index + 1) / 2);
        } else if (rrect.isOval()) {
            // degenerate(oval) => line points are collapsing
            this.addOval(bounds, ccw, index / 2);
        } else {
            const startsWithConic = ((index & 1) == Number(ccw == false));
            let weight = Math.SQRT1_2
            let rrectIter = new RRectPointIterator(rrect, ccw, index);
            const rectStartIndex = index / 2 + (!ccw ? 0 : 1);
            let rectIter = new RectPointIterator(bounds, ccw, rectStartIndex);
            this.moveTo(rrectIter.current.x, rrectIter.current.y);
            if (startsWithConic) {
                for (let i = 0; i < 3; ++i) {
                    rectIter.next()
                    rrectIter.next()
                    this.conicTo(rectIter.current.x, rectIter.current.y, rrectIter.current.x, rrectIter.current.y, weight);
                    rrectIter.next()
                    this.lineTo(rrectIter.current.x, rrectIter.current.y);

                }
                rectIter.next()
                rrectIter.next()
                this.conicTo(rectIter.current.x, rectIter.current.y, rrectIter.current.x, rrectIter.current.y, weight);
                // final lineTo handled by close().
            } else {
                for (let i = 0; i < 4; ++i) {
                    rrectIter.next()
                    this.lineTo(rrectIter.current.x, rrectIter.current.y);
                    rectIter.next()
                    rrectIter.next()
                    this.conicTo(rectIter.current.x, rectIter.current.y, rrectIter.current.x, rrectIter.current.y, weight);
                }
            }
            this.closePath();
        }
    }
    copy(source: PathBuilder) {

        this.points = source.points.slice()
        this.verbs = source.verbs.slice()
        this._lastMovePointIndex = source._lastMovePointIndex
        this._needMoveTo = source._needMoveTo

        return this
    }
    clone() {
        return PathBuilder.default().copy(this)
    }
    transform(m: Matrix2dLike) {
        for (let i = 0; i < this.points.length; i += 2) {
            const x = this.points[i]
            const y = this.points[i + 1]
            this.points[i] = m[0] * x + m[2] * y + m[4]
            this.points[i + 1] = m[1] * x + m[3] * y + m[5]
        }
    }
    scaleRoound(sx: number, sy: number) {
        for (let i = 0; i < this.points.length; i += 2) {
            const x = this.points[i]
            const y = this.points[i + 1]
            this.points[i] = Math.round(x * sx)
            this.points[i + 1] = Math.round(y * sx)
        }
    }
    computeTightBounds() {
        if (this.isEmpty) {
            return BoundingRect.empty()
        }
        if (this._segmentMask === SegmentMask.Line_SegmentMask) {
            return this.getBounds()
        }
        const bounds = BoundingRect.default()
        this.visit({
            moveTo: (x, y) => {
                bounds.expandByXY(x, y)
            },
            lineTo: (lastX: number, lastY: number, x, y) => {
                bounds.expandByXY(x, y)
            },
            quadraticCurveTo: (lastX: number, lastY: number, cp1x, cp1y, x, y) => {
                let b = QuadBezier.fromXY(lastX, lastY, cp1x, cp1y, x, y).getBoundingBox()
                bounds.expandByPoint(b.min)
                bounds.expandByPoint(b.max)
            },
            cubicCurveTo(lastX: number, lastY: number, cp1x, cp1y, cp2x, cp2y, x, y) {
                let b = CubicBezier.fromXY(lastX, lastY, cp1x, cp1y, cp2x, cp2y, x, y).getBoundingBox()
                bounds.expandByPoint(b.min)
                bounds.expandByPoint(b.max)
            }
        });
        return bounds
    }
    fatten(tessellationTolerance = 1) {
        const newPath = PathBuilder.default()
        if (this.isEmpty) {
            return newPath
        }
        this.visit({
            moveTo: (x, y) => {
                newPath.moveTo(x, y)
            },
            lineTo: (lastX: number, lastY: number, x, y) => {
                newPath.lineTo(x, y)
            },
            quadraticCurveTo: (lastX: number, lastY: number, cp1x, cp1y, x, y) => {
                let lines = QuadBezier.fromXY(lastX, lastY, cp1x, cp1y, x, y).fatten(tessellationTolerance)
                lines.forEach(p => {
                    newPath.lineTo(p.x, p.y)
                })
            },
            cubicCurveTo: (lastX: number, lastY: number, cp1x, cp1y, cp2x, cp2y, x, y) => {
                let lines = CubicBezier.fromXY(lastX, lastY, cp1x, cp1y, cp2x, cp2y, x, y).fatten(tessellationTolerance)
                lines.forEach(p => {
                    newPath.lineTo(p.x, p.y)
                })
            },
            close: () => {
                newPath.closePath()
            }
        })
        return newPath
    }
    getPolygons(autoClose = true, tessellationTolerance = 1) {
        const polygons: number[][] = []
        let polygon: number[] | null = null
        const path = this.fatten(tessellationTolerance)
        path.visit({
            moveTo: (x, y) => {
                if (polygon !== null) {
                    polygons.push(polygon)
                }
                polygon = [x, y]
            },
            lineTo: (lastX: number, lastY: number, x, y) => {
                polygon!.push(x, y)
            },
            close: (x, y) => {
                if (autoClose) {
                    polygon!.push(x, y)
                    polygons.push(polygon!)
                    polygon = null
                }
            }
        })
        if (polygon !== null) {
            polygons.push(polygon)
        }
        return polygons
    }
    getBounds() {
        if (!this._bounds) {
            this._bounds = BoundingRect.default().setFromVertices(this.points)
        }
        return this._bounds
    }
    visit(visitor: Partial<PathBuilderVisitor>) {
        const points = this.points, verbs = this.verbs
        let lastMoveIndex = 0
        let lastPont: { x: number, y: number } = { x: 0, y: 0 }
        for (let i = 0, k = 0, verbCount = verbs.length; i < verbCount; i++) {
            const verb = verbs[i]
            switch (verb) {
                case PathVerb.MoveTo:
                    visitor.moveTo?.(points[k], points[k + 1])
                    lastPont.x = points[k]
                    lastPont.y = points[k + 1]
                    lastMoveIndex = k
                    k += 2
                    break;
                case PathVerb.LineTo:
                    visitor.lineTo?.(lastPont.x, lastPont.y, points[k], points[k + 1])
                    lastPont.x = points[k]
                    lastPont.y = points[k + 1]
                    k += 2
                    break;
                case PathVerb.QuadCurveTo:
                    visitor.quadraticCurveTo?.(lastPont.x, lastPont.y, points[k], points[k + 1], points[k + 2], points[k + 3])
                    lastPont.x = points[k + 2]
                    lastPont.y = points[k + 3]
                    k += 4
                    break;
                case PathVerb.CubicCurveTo:
                    visitor.cubicCurveTo?.(lastPont.x, lastPont.y, points[k], points[k + 1], points[k + 2], points[k + 3], points[k + 4], points[k + 5])
                    lastPont.x = points[k + 4]
                    lastPont.y = points[k + 5]
                    k += 6
                    break;
                case PathVerb.Close:
                    visitor.close?.(points[lastMoveIndex], points[lastMoveIndex + 1], lastPont.x, lastPont.y)
                    break;
            }
        }

    }
    invertVisit(visitor: Partial<PathBuilderVisitor>) {
        const points = this.points, verbs = this.verbs
        let lastMoveIndex = 0, needMove = true, needClose = false;
        let lastPont: { x: number, y: number } = { x: 0, y: 0 }
        for (let i = verbs.length - 1, k = points.length; i >= 0; i--) {
            let verb = verbs[i]
            if (needMove) {
                k -= 2
                needMove = false
                visitor.moveTo?.(points[k], points[k + 1])
                lastPont.x = points[k]
                lastPont.y = points[k + 1]
                lastMoveIndex = k
            }
            switch (verb) {
                case PathVerb.MoveTo:
                    if (needClose) {
                        visitor.close?.(points[lastMoveIndex], points[lastMoveIndex + 1], lastPont.x, lastPont.y)
                        needClose = false
                    }
                    needMove = true
                    break;
                case PathVerb.LineTo:
                    k -= 2
                    visitor.lineTo?.(lastPont.x, lastPont.y, points[k], points[k + 1])
                    lastPont.x = points[k]
                    lastPont.y = points[k + 1]
                    break;
                case PathVerb.QuadCurveTo:
                    k -= 4
                    visitor.quadraticCurveTo?.(lastPont.x, lastPont.y, points[k + 2], points[k + 3], points[k], points[k + 1])
                    lastPont.x = points[k]
                    lastPont.y = points[k + 1]
                    break;
                case PathVerb.CubicCurveTo:
                    k -= 6
                    visitor.cubicCurveTo?.(lastPont.x, lastPont.y, points[k + 4], points[k + 5], points[k + 2], points[k + 3], points[k], points[k + 1])
                    lastPont.x = points[k]
                    lastPont.y = points[k + 1]
                    break;
                case PathVerb.Close:
                    needClose = true
                    break;
            }
        }

    }
    addPath(path: PathBuilder, matrix?: Matrix2dLike) {
        if (matrix) {
            path = path.clone()
            path.transform(matrix)
        }
        this._segmentMask |= path._segmentMask
        this._needMoveTo = path._needMoveTo
        this._lastMovePointIndex = this.points.length + path._lastMovePointIndex
        this.points = this.points.concat(path.points)
        this.verbs = this.verbs.concat(path.verbs)
        return this
    }
    addReversePath(path: PathBuilder) {
        path.invertVisit({
            moveTo: (x: number, y: number) => {
                this.moveTo(x, y)
            },
            lineTo: (lastX: number, lastY: number, x: number, y: number) => {
                this.lineTo(x, y)
            },
            quadraticCurveTo: (lastX: number, lastY: number, cpX: number, cpY: number, x: number, y: number) => {
                this.quadraticCurveTo(cpX, cpY, x, y)
            },
            cubicCurveTo: (lastX: number, lastY: number, cp1X: number, cp1Y: number, cp2X: number, cp2Y: number, x: number, y: number) => {
                this.cubicCurveTo(cp1X, cp1Y, cp2X, cp2Y, x, y)
            },
            close: () => {
                this.closePath()
            }
        })
    }
    // 忽略move
    reversePathTo(other: PathBuilder) {
        if (other.isEmpty) {
            return;
        }
        other.invertVisit({
            moveTo: (x: number, y: number) => {
               
            },
            lineTo: (lastX: number, lastY: number, x: number, y: number) => {
                this.lineTo(x, y)
            },
            quadraticCurveTo: (lastX: number, lastY: number, cpX: number, cpY: number, x: number, y: number) => {
                this.quadraticCurveTo(cpX, cpY, x, y)
            },
            cubicCurveTo: (lastX: number, lastY: number, cp1X: number, cp1Y: number, cp2X: number, cp2Y: number, x: number, y: number) => {
                this.cubicCurveTo(cp1X, cp1Y, cp2X, cp2Y, x, y)
            },
            close: () => {
                this.closePath()
            }
        })
    }
    offset(x: number, y: number) {
        for (let i = 0; i < this.points.length; i+=2) {
            this.points[i]=x
            this.points[i+1]=y

        }
    }
    isZeroLengthSincePoint(start_pt_index: number) {
        let count = (this.points.length/2)- start_pt_index;
        if (count < 2) {
            return true;
        }

        let first_x = this.points[start_pt_index*2];
        let first_y = this.points[start_pt_index*2+1];
        for (let i = 1; i < count; i++) {
            if (first_x===this.points[start_pt_index + i*2]&&first_y===this.points[start_pt_index + i*2+1]) {
                return false;
            }
        }
        return true
    }
    finish() {
        if (this.isEmpty) {
            return null;
        }

        // Just a move to? Bail.
        if (this.verbs.length == 1) {
            return null;
        }

        return this

    }
    toCanvas(ctx: CanvasRenderingContext2D | Path2D) {
        this.visit({
            moveTo: (x: number, y: number) => {
                ctx.moveTo(x, y)
            },
            lineTo: (lastX: number, lastY: number, x: number, y: number) => {
                ctx.lineTo(x, y)
            },
            quadraticCurveTo: (lastX: number, lastY: number, cpX: number, cpY: number, x: number, y: number) => {
                ctx.quadraticCurveTo(cpX, cpY, x, y)
            },
            cubicCurveTo: (lastX: number, lastY: number, cp1X: number, cp1Y: number, cp2X: number, cp2Y: number, x: number, y: number) => {
                ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, x, y)
            },
            close: () => {
                ctx.closePath()
            }
        })
    }
    toPath2D() {
        const path = new Path2D()
        this.toCanvas(path)
        return path
    }
}   
