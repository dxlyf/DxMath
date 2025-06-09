import { Bezier, bezier_flatten } from "./bezier"
import { Point } from "./matrix"
import { min } from "./util"

export enum PathElement {
    MOVE_TO = 0,
    LINE_TO = 1,
    CURVE_TO = 2,
    CLOSE = 3,
}

export class Path {
    static create() {
        return new Path()
    }
    contours: int = 0
    start: Point = Point.default()
    elements: PathElement[] = []
    points: Point[] = []
    destroy() {
        this.elements = []
        this.points = []
    }
    get lenth() {
        return this.points.length
    }
    get isEmpty() {
        return this.elements.length <= 0
    }
    get lastElement() {
        return this.elements[this.elements.length - 1]
    }
    get lastPoint() {
        return this.points[this.points.length - 1]
    }
    getCurrentPoint(out: Point = Point.default()) {
        if (this.points.length === 0) {
            out.set(0, 0)
            return out
        } else {
            out.x = this.lastPoint.x
            out.y = this.lastPoint.y
        }
        return out
    }
    moveTo(x: float64, y: float64) {
        this.elements.push(PathElement.MOVE_TO)
        this.contours += 1
        this.points.push(Point.create(x, y))
        this.start.set(x, y)
        return this
    }
    lineTo(x: float64, y: float64) {
        this.elements.push(PathElement.LINE_TO)
        this.contours += 1
        this.points.push(Point.create(x, y))

        return this
    }
    curveTo(x1: float64, y1: float64, x2: float64, y2: float64, x3: float64, y3: float64) {
        this.elements.push(PathElement.CURVE_TO)
        this.contours += 1
        this.points.push(Point.create(x1, y1))
        this.points.push(Point.create(x2, y2))
        this.points.push(Point.create(x3, y3))
        return this
    }
    quadTo(x1: float64, y1: float64, x2: float64, y2: float64) {
        const lastPoint = this.getCurrentPoint()

        let cx = 2 / 3 * x1 + 1 / 3 * lastPoint.x
        let cy = 2 / 3 * y1 + 1 / 3 * lastPoint.y
        let cx1 = 2 / 3 * x1 + 1 / 3 * x2
        let cy1 = 2 / 3 * y1 + 1 / 3 * y2
        return this.curveTo(cx, cy, cx1, cy1, x2, y2)
    }
    close() {
        if (this.isEmpty) {
            return
        }
        if (this.lastElement === PathElement.CLOSE) {
            return
        }
        this.elements.push(PathElement.CLOSE)
        this.points.push(this.start.clone())
    }
    relMoveTo(dx: float64, dy: float64) {
        let cur = this.getCurrentPoint()
        return this.moveTo(cur.x + dx, cur.y + dy)
    }
    relLineTo(dx: float64, dy: float64) {
        let cur = this.getCurrentPoint()
        return this.lineTo(cur.x + dx, cur.y + dy)
    }
    relCurveTo(dx1: float64, dy1: float64, dx2: float64, dy2: float64, dx3: float64, dy3: float64) {
        let cur = this.getCurrentPoint()
        return this.curveTo(cur.x + dx1, cur.y + dy1, cur.x + dx2, cur.y + dy2, cur.x + dx3, cur.y + dy3)
    }
    relQuadTo(dx1: float64, dy1: float64, dx2: float64, dy2: float64) {
        let cur = this.getCurrentPoint()
        return this.quadTo(cur.x + dx1, cur.y + dy1, cur.x + dx2, cur.y + dy2)
    }
    addRectangle(x: float64, y: float64, w: float64, h: float64) {
        this.moveTo(x, y)
        this.lineTo(x + w, y)
        this.lineTo(x + w, y + h)
        this.lineTo(x, y + h)
        this.lineTo(x, y)
        this.close()
    }
    addRoundRectangle(x: float64, y: float64, w: float64, h: float64, rx: float64, ry: float64) {
        if (rx === 0 || ry === 0) {
            return this.addRectangle(x, y, w, h)
        }

        rx = min(rx, w * 0.5);
        ry = min(ry, h * 0.5);

        let right = x + w;
        let bottom = y + h;
        let cpx = rx * 0.55228474983079339840;
        let cpy = ry * 0.55228474983079339840;

        this.moveTo(x, y + ry);
        this.curveTo(x, y + ry - cpy, x + rx - cpx, y, x + rx, y);
        this.lineTo(right - rx, y);
        this.curveTo(right - rx + cpx, y, right, y + ry - cpy, right, y + ry);
        this.lineTo(right, bottom - ry);
        this.curveTo(right, bottom - ry + cpy, right - rx + cpx, bottom, right - rx, bottom);
        this.lineTo(x + rx, bottom);
        this.curveTo(x + rx - cpx, bottom, x, bottom - ry + cpy, x, bottom - ry);
        this.lineTo(x, y + ry);
        this.close();
    }
    addEllipse(cx: float64, cy: float64, rx: float64, ry: float64) {
        let left = cx - rx;
        let top = cy - ry;
        let right = cx + rx;
        let bottom = cy + ry;
        let cpx = rx * 0.55228474983079339840;
        let cpy = ry * 0.55228474983079339840;

        this.lineTo(cx, top);
        this.curveTo(cx + cpx, top, right, cy - cpy, right, cy);
        this.curveTo(right, cy + cpy, cx + cpx, bottom, cx, bottom);
        this.curveTo(cx - cpx, bottom, left, cy + cpy, left, cy);
        this.curveTo(left, cy - cpy, cx - cpx, top, cx, top);
        this.close();

    }
    arc(cx: float64, cy: float64, r: float64, a0: float64, a1: float64, ccw: boolean) {

        let da = a1 - a0;
        if (Math.abs(da) > 6.28318530717958647693) {
            da = 6.28318530717958647693;
        }
        else if (da != 0.0 && ccw != (da < 0.0)) {
            da += 6.28318530717958647693 * (ccw ? -1 : 1);
        }
        let seg_n = Math.ceil(Math.abs(da) / 1.57079632679489661923);
        let seg_a = da / seg_n;
        let d = (seg_a / 1.57079632679489661923) * 0.55228474983079339840 * r;
        let a = a0;
        let ax = cx + Math.cos(a) * r;
        let ay = cy + Math.sin(a) * r;
        let dx = -Math.sin(a) * d;
        let dy = Math.cos(a) * d;
        if (this.points.length == 0)
            this.moveTo(ax, ay);
        else {
            this.lineTo(ax, ay);
        }
        for (let i = 0; i < seg_n; i++) {
            let cp1x = ax + dx;
            let cp1y = ay + dy;
            a += seg_a;
            ax = cx + Math.cos(a) * r;
            ay = cy + Math.sin(a) * r;
            dx = -Math.sin(a) * d;
            dy = Math.cos(a) * d;
            let cp2x = ax - dx;
            let cp2y = ay - dy;
            this.curveTo(cp1x, cp1y, cp2x, cp2y, ax, ay);
        }
    }
    clear() {
        this.elements = []
        this.points = []
        this.contours = 0
        this.start.set(0, 0)

    }
    clone() {
        const result = Path.create()
        result.elements = this.elements.slice()
        result.points = this.points.map(p => p.clone())
        result.contours = this.contours
        result.start = this.start.clone()
        return result
    }
    cloneFlat() {
        const points = this.points
        const result = Path.create()
        let p0 = Point.create(0, 0)
        let k = 0
        for (let i = 0; i < this.elements.length; i++) {
            switch (this.elements[i]) {
                case PathElement.MOVE_TO:
                    result.moveTo(points[k].x, points[k].y)
                    k += 1
                    break
                case PathElement.LINE_TO:
                    result.moveTo(points[k].x, points[k].y)
                    k += 1
                    break
                case PathElement.CURVE_TO:
                    this.getCurrentPoint(p0)
                    bezier_flatten(result,p0,points[k], points[k + 1], points[k + 2])
                   // result.curveTo(points[k].x, points[k].y, points[k + 1].x, points[k + 1].y, points[k + 2].x, points[k + 2].y)
                    k += 3
                    break
                case PathElement.CLOSE:
                    result.lineTo(points[k].x, points[k].y)
                    k += 1
                    break
                default:
                    break
            }

        }
        return result

    }
}
