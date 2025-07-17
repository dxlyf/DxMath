/**
 * 部分计算方法来自skia
 */
import { Vector2 } from '../math/vec2'
import { quadraticBezierBounds, cubicBezierBounds, quadraticCurveToLines, cubicCurveToLines, cubicBezierToLinesByCurvature, conicToQuadratic, subdivideRationalBezier } from '../curve/bezier'
import { BoundingRect } from '../math/bounding_rect'
import { Matrix2D } from '../math/mat2d'
import { degreesToRadian, radianToDegrees, nearly_equal, scalarNearlyZero, scalarSinSnapToZero, scalarCosSnapToZero, scalarNearlyEqual, mod, almostEqual, interpolate } from '../math/math'
import { PathDirection, PathFillType, PathSegmentMask, PathVerb, IsA, RotationDirection, ArcSize, AddPathMode } from './type'
import { SkConic } from './geometry'
import { AutoConicToQuads, conicToQuadratic2 } from '../curve/conic'
import { arcToCubicCurves, centerToEndPoint, endPointToCenter } from '../curve/arc_to_bezier'

type PathVisitor = {
    moveTo: (record: { type: PathVerb, p0: Vector2 }) => void
    lineTo: (record: { type: PathVerb, p0: Vector2 }) => void
    quadraticCurveTo: (record: { type: PathVerb, p0: Vector2, p1: Vector2, p2: Vector2 }) => void
    bezierCurveTo: (record: { type: PathVerb, p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2 }) => void
    closePath: (record: { type: PathVerb, lastMovePoint: Vector2 }) => void
}
export type PathVerbData = {
    type: PathVerb
    p0?: Vector2,
    p1?: Vector2,
    p2?: Vector2
    p3?: Vector2
}
const PtsInVerb = (v: PathVerb) => {
    switch (v) {
        case PathVerb.MoveTo: return 1
        case PathVerb.LineTo: return 1
        case PathVerb.QuadTo: return 2
        case PathVerb.CubicTo: return 3
        default: return 0
    }
}
class PointIterator {
    fPts: Vector2[] = []
    size: number = 0
    fCurrent: number;
    fAdvance: number;
    constructor(size: number, dir: PathDirection, startIndex: number) {
        this.size = size
        this.fPts = new Array(size)
        this.fCurrent = startIndex % size
        this.fAdvance = (dir == PathDirection.kCW ? 1 : size - 1)
    }
    get current() {
        return this.fPts[this.fCurrent];
    }

    get next() {
        this.fCurrent = mod((this.fCurrent + this.fAdvance), this.size);
        return this.current;
    }
}
class OvalPointIterator extends PointIterator {
    constructor(oval: BoundingRect, dir: PathDirection, startIndex: number) {
        super(4, dir, startIndex)
        const cx = oval.cx;
        const cy = oval.cy;

        this.fPts[0] = Vector2.create(cx, oval.top);
        this.fPts[1] = Vector2.create(oval.right, cy);
        this.fPts[2] = Vector2.create(cx, oval.bottom);
        this.fPts[3] = Vector2.create(oval.left, cy);
    }
}
class RectPointIterator extends PointIterator {
    constructor(rect: BoundingRect, dir: PathDirection, startIndex: number) {
        super(4, dir, startIndex)
        this.fPts[0] = Vector2.create(rect.left, rect.top);
        this.fPts[1] = Vector2.create(rect.right, rect.top);
        this.fPts[2] = Vector2.create(rect.right, rect.bottom);
        this.fPts[3] = Vector2.create(rect.left, rect.bottom);
    }
}
class RRectPointIterator extends PointIterator {
    constructor(rect: BoundingRect, radii: Vector2[], dir: PathDirection, startIndex: number) {
        super(8, dir, startIndex)

        const L = rect.left;
        const T = rect.top;
        const R = rect.right;
        const B = rect.bottom;

        this.fPts[0] = Vector2.create(L + radii[0].x, T);
        this.fPts[1] = Vector2.create(R - radii[1].x, T);
        this.fPts[2] = Vector2.create(R, T + radii[1].y);
        this.fPts[3] = Vector2.create(R, B - radii[2].y);
        this.fPts[4] = Vector2.create(R - radii[2].x, B);
        this.fPts[5] = Vector2.create(L + radii[3].x, B);
        this.fPts[6] = Vector2.create(L, B - radii[3].y);
        this.fPts[7] = Vector2.create(L, T + radii[0].y);
    }
}
class Ref<T = number> {
    static make<T = number>(value: T) {
        return new this(value)
    }
    constructor(public value: T) {

    }
}
function arc_is_lone_point(oval: BoundingRect, startAngle: number, sweepAngle: number, pt: Vector2) {
    if (0 == sweepAngle && (0 == startAngle || 360 == startAngle)) {
        //Chrome使用此路径进入椭圆形。如果不
        //被视为特殊情况，移动会使椭圆形变形
        //边界框（并打破圆形特殊情况）。
        pt.set(oval.right, oval.cx);
        return true;
    } else if (0 == oval.width && 0 == oval.height) {
        //Chrome有时会创建0个半径圆形矩形。退化
        //路径中的四段段可防止路径被识别为
        //一个矩形。
        //todo：优化宽度或高度之一的情况
        //也应考虑。但是，这种情况似乎并不是
        //与单点案例一样常见。
        pt.set(oval.right, oval.top);
        return true;
    }
    return false;
}

function angles_to_unit_vectors(startAngle: number, sweepAngle: number,
    startV: Vector2, stopV: Vector2, dir: Ref<RotationDirection>) {
    let startRad = degreesToRadian(startAngle),
        stopRad = degreesToRadian(startAngle + sweepAngle);

    const SkScalarSinSnapToZero = (v: number) => {
        v = Math.sin(v)
        return Math.abs(v) <= 1e-5 ? 0 : v;
    }
    const SkScalarCosSnapToZero = (v: number) => {
        v = Math.cos(v)
        return Math.abs(v) <= 1e-5 ? 0 : v;
    }
    /**
     * 返回具有 x 的绝对值但 y 符号的数值
     * 等价于 C++ 的 std::copysign(x, y)
     *
     * @param {number} x - 数值，其绝对值将被保留
     * @param {number} y - 数值，其符号将赋值给 x 的绝对值
     * @returns {number} 拥有 x 的绝对值及 y 符号的数值
     */
    function copysign(x: number, y: number) {
        // 当 y 为 0 时，需要区分正 0 与负 0
        if (y === 0) {
            return 1 / y === -Infinity ? -Math.abs(x) : Math.abs(x);
        }
        return y < 0 ? -Math.abs(x) : Math.abs(x);
    }
    startV.y = SkScalarSinSnapToZero(startRad);
    startV.x = SkScalarCosSnapToZero(startRad);
    stopV.y = SkScalarSinSnapToZero(stopRad);
    stopV.x = SkScalarCosSnapToZero(stopRad);

    /*如果扫角接近（但小于）360，则由于精度
        弧度转换和/或罪恶/cos的损失，我们可能会偶然
        向量，这会愚弄skbuildquadarc无所事事（不好）
        绘制一个几乎完整的圆圈（好）。
        例如canvas.drawarc（0，359.99，...）
        -vs-canvas.drawarc（0，359.9，...）
        我们尝试检测到边缘情况，然后调整停止矢量
        */
    if (startV.equalsEpsilon(stopV)) {
        let sw = Math.abs(sweepAngle);
        if (sw < 360 && sw > 359) {
            // make a guess at a tiny angle (in radians) to tweak by
            let deltaRad = copysign(1 / 512, sweepAngle);
            // not sure how much will be enough, so we use a loop
            do {
                stopRad -= deltaRad;
                stopV.y = SkScalarSinSnapToZero(stopRad);
                stopV.x = SkScalarCosSnapToZero(stopRad);
            } while (startV.equalsEpsilon(stopV));
        }
    }
    dir.value = sweepAngle > 0 ? RotationDirection.kCW_SkRotationDirection : RotationDirection.kCCW_SkRotationDirection

}
function build_arc_conics(oval: BoundingRect, start: Vector2, stop: Vector2,
    dir: RotationDirection, conics: SkConic[], singlePt: Vector2) {
    let matrix: Matrix2D = Matrix2D.identity();

    matrix.setScale(oval.width * 0.5, oval.height * 0.5);
    matrix.postTranslate(oval.cx, oval.cy);

    let count = SkConic.BuildUnitArc(start, stop, dir, matrix, conics);
    if (0 == count) {
        matrix.mapXY(stop.x, stop.y, singlePt);
    }
    return count;
}


function _ellipseHelper(path: Path, x: number, y: number, radiusX: number, radiusY: number, startAngle: number, endAngle: number) {
    var sweepDegrees = radianToDegrees(endAngle - startAngle);
    var startDegrees = radianToDegrees(startAngle);

    var oval = BoundingRect.fromLTRB(x - radiusX, y - radiusY, x + radiusX, y + radiusY);

    // draw in 2 180 degree segments because trying to draw all 360 degrees at once
    // draws nothing.
    if (almostEqual(Math.abs(sweepDegrees), 360)) {
        var halfSweep = sweepDegrees / 2;
        path.arcToOval(oval, startDegrees, halfSweep, false);
        path.arcToOval(oval, startDegrees + halfSweep, halfSweep, false);
        return;
    }
    path.arcToOval(oval, startDegrees, sweepDegrees, false);
}

function ellipse(skpath: Path, x: number, y: number, radiusX: number, radiusY: number, rotation: number,
    startAngle: number, endAngle: number, ccw: number | boolean) {
    // if (!allAreFinite([x, y, radiusX, radiusY, rotation, startAngle, endAngle])) {
    //   return;
    // }
    if (radiusX < 0 || radiusY < 0) {
        throw 'radii cannot be negative';
    }

    // based off of CanonicalizeAngle in Chrome
    var tao = 2 * Math.PI;
    var newStartAngle = startAngle % tao;
    if (newStartAngle < 0) {
        newStartAngle += tao;
    }
    var delta = newStartAngle - startAngle;
    startAngle = newStartAngle;
    endAngle += delta;

    // Based off of AdjustEndAngle in Chrome.
    if (!ccw && (endAngle - startAngle) >= tao) {
        // Draw complete ellipse
        endAngle = startAngle + tao;
    } else if (ccw && (startAngle - endAngle) >= tao) {
        // Draw complete ellipse
        endAngle = startAngle - tao;
    } else if (!ccw && startAngle > endAngle) {
        endAngle = startAngle + (tao - (startAngle - endAngle) % tao);
    } else if (ccw && startAngle < endAngle) {
        endAngle = startAngle - (tao - (endAngle - startAngle) % tao);
    }

    // Based off of Chrome's implementation in
    // https://cs.chromium.org/chromium/src/third_party/blink/renderer/platform/graphics/path.cc
    // of note, can't use addArc or addOval because they close the arc, which
    // the spec says not to do (unless the user explicitly calls closePath).
    // This throws off points being in/out of the arc.
    if (!rotation) {
        _ellipseHelper(skpath, x, y, radiusX, radiusY, startAngle, endAngle);
        return;
    }
    var rotated = Matrix2D.fromRotateOrigin(rotation, x, y);
    var rotatedInvert = Matrix2D.fromRotateOrigin(-rotation, x, y);
    skpath.transform(rotatedInvert);
    _ellipseHelper(skpath, x, y, radiusX, radiusY, startAngle, endAngle);
    skpath.transform(rotated);
}
export const PathEncoding = {
    Absolute: 0,
    Relative: 1
}

export function fromSVGString(data: string, path: Path) {
    let m, lastCmd;
    let x = 0, y = 0, x1 = 0, y1 = 0, x2 = 0, y2 = 0
    const REG_SVG_PATH_DATA = /([mlhvcsqtaz])([^mlhvcsqtaz]*)/gi
    while ((m = REG_SVG_PATH_DATA.exec(data))) {
        const cmd = m[1].trim()
        const upperCmd = cmd.toUpperCase()
        const _args = m[2].trim().match(/(-?[\d.]+(?:e[-+]?\d+)?)/g)
        const args = _args ? _args.map(parseFloat) : []
        const isRelative = cmd !== upperCmd

        switch (cmd) {
            case "M": //M x y
            case "m":
                x = isRelative ? x + args[0] : args[0]
                y = isRelative ? y + args[1] : args[1]
                path.moveTo(x, y)
                break
            case "L": // L x y
            case "l":
                x = isRelative ? x + args[0] : args[0]
                y = isRelative ? y + args[1] : args[1]
                path.lineTo(x, y)
                break
            case "H": // H x
            case "h":
                x = isRelative ? x + args[0] : args[0]
                path.lineTo(x, y)
                break
            case "V":// V y
            case "v":
                y = isRelative ? y + args[0] : args[0]
                path.lineTo(x, y)
                break
            case "C": // C x1 y1, x2 y2, x y
            case "c":
                x1 = isRelative ? x + args[0] : args[0]
                y1 = isRelative ? y + args[1] : args[1]
                x2 = isRelative ? x + args[2] : args[2]
                y2 = isRelative ? y + args[3] : args[3]
                x = isRelative ? x + args[4] : args[4]
                y = isRelative ? y + args[5] : args[5]
                path.bezierCurveTo(x1, y1, x2, y2, x, y)
                break
            case "S":// S x2 y2, x y
            case "s":
                if (lastCmd === 'S' || lastCmd == 'C') {
                    x1 = -(x2 - x) + x
                    y1 = -(y2 - y) + y
                } else {
                    x1 = x
                    y1 = y
                }
                x2 = isRelative ? x + args[0] : args[0]
                y2 = isRelative ? y + args[1] : args[1]
                x = isRelative ? x + args[2] : args[2]
                y = isRelative ? y + args[3] : args[3]
                path.bezierCurveTo(x1, y1, x2, y2, x, y)
                break
            case "Q": // Q x1 y1, x y
            case "q":

                x1 = isRelative ? x + args[0] : args[0]
                y1 = isRelative ? y + args[1] : args[1]
                x = isRelative ? x + args[2] : args[2]
                y = isRelative ? y + args[3] : args[3]
                path.quadraticCurveTo(x1, y1, x, y)
                break
            case "T":// T x y
            case "t":
                if (lastCmd === 'Q' || lastCmd == 'T') {
                    x1 = -(x1 - x) + x
                    y1 = -(y1 - y) + y
                } else {
                    x1 = x
                    y1 = y
                }
                x = isRelative ? x + args[0] : args[1]
                y = isRelative ? y + args[1] : args[2]
                path.quadraticCurveTo(x1, y1, x, y)
                break
            case "A":
            case "a":
                let rx = args[0],
                    ry = args[1],
                    xAxisRotation = args[2] * Math.PI / 180,
                    largeArcFlag = args[3], sweepFlag = args[4], _x = args[5], _y = args[6];
                if (isRelative) {
                    _x += x
                    _y += y
                }
                // path.ellipse(_x,_y,rx,ry,xAxisRotation, largeArcFlag, sweepFlag)
                path.arcTo(Vector2.create(rx, ry), xAxisRotation, largeArcFlag, Number(!sweepFlag), Vector2.create(_x, _y));
                x = path.lastPoint.x
                y = path.lastPoint.y

                break
            case "Z":// Z
            case "z":
                path.closePath()
                break
        }
        lastCmd = upperCmd
    }
    return path
}

export class Path {
    static fromSvgPath(pathData: string) {

        return fromSVGString(pathData, this.default())
    }

    static default() {
        return new this()
    }
    points: Vector2[] = []
    verbs: PathVerb[] = []

    fFillType: PathFillType = PathFillType.kWinding
    fIsVolatile: boolean = false



    fIsA: IsA = IsA.kIsA_JustMoves;
    fIsAStart = -1;     // tracks direction iff fIsA is not unknown
    fIsACCW = false;  // tracks direction iff fIsA is not unknown

    fSegmentMask: number = 0
    lastMovePoint: Vector2 = Vector2.zero()
    lastMoveIndex: number = -1
    needsMoveVerb: boolean = true;
    constructor() {

    }
    get lastPoint() {
        return this.points[this.points.length - 1]
    }
    get lastVerb() {
        return this.verbs[this.verbs.length - 1]
    }
    addPath(src: Path, mode: AddPathMode): this
    addPath(src: Path, matrix: Matrix2D, mode: AddPathMode): this
    addPath(...args: any[]) {
        let srcPath!: Path, mode!: AddPathMode, matrix!: Matrix2D
        if (args.length === 2) {
            srcPath = args[0]
            mode = args[1]
            matrix = Matrix2D.identity()
        } else if (args.length === 3) {
            srcPath = args[0]
            matrix = args[1]
            mode = args[2]
        }

        if (srcPath.isEmpty()) {
            return this;
        }
        if (AddPathMode.kAppend_AddPathMode == mode) {
            this.lastMoveIndex = this.points.length + srcPath.lastMoveIndex;

            const newPts = Vector2.makeZeroArray(srcPath.points.length)
            matrix.mapPoints(newPts, srcPath.points);
            this.points.push(...newPts)
            this.verbs.push(...srcPath.verbs)
            return this
        }
        let firstVerb = true;
        for (let { type, p0, p1, p2, p3 } of srcPath) {
            const mappedPts = [p0, p1, p2, p3].filter(Boolean).map(p => p!.clone());

            matrix.mapPoints(mappedPts, mappedPts)
            switch (type) {
                case PathVerb.MoveTo:


                    if (firstVerb && mode == AddPathMode.kExtend_AddPathMode && !this.isEmpty()) {
                        this.injectMoveToIfNeeded(); // In case last contour is closed
                        let lastPt = this.lastPoint
                        // don't add lineTo if it is degenerate
                        if (this.lastMoveIndex < 0 || !lastPt || !lastPt.equalsEpsilon(mappedPts[0])) {
                            this.lineTo(mappedPts[0]);
                        }
                    } else {
                        this.moveTo(mappedPts[0]);
                    }
                    break;
                case PathVerb.LineTo:
                    this.lineTo(mappedPts[0]);
                    break;
                case PathVerb.QuadTo:
                    this.quadraticCurveTo(mappedPts[1], mappedPts[2]);
                    break;
                case PathVerb.CubicTo:
                    this.bezierCurveTo(mappedPts[1], mappedPts[2], mappedPts[3]);
                    break;
                case PathVerb.Close:
                    this.closePath();
                    break;
            }
            firstVerb = false;
        }

        return this
    }
    addReversePath(path: Path) {

        let needMove = true;
        let needClose = false;
        let points = path.points
        let verbs = path.verbs, i = verbs.length;
        let k = points.length;

        while (i-- > 0) {
            let type = verbs[i]
            let n = PtsInVerb(type);

            if (needMove) {
                --k;
                this.moveTo(points[k].x, points[k].y);
                needMove = false;
            }
            k -= n;
            switch (type) {
                case PathVerb.MoveTo:
                    if (needClose) {
                        this.closePath();
                        needClose = false;
                    }
                    needMove = true;
                    k += 1;   // so we see the point in "if (needMove)" above
                    break;
                case PathVerb.LineTo:
                    this.lineTo(points[k].x, points[k].y);
                    break;
                case PathVerb.QuadTo:
                    this.quadraticCurveTo(points[k + 1].x, points[k + 1].y, points[k].x, points[k].y);
                    break;
                case PathVerb.CubicTo:
                    this.bezierCurveTo(points[k + 2].x, points[k + 2].y, points[k + 1].x, points[k + 1].y, points[k].x, points[k].y);
                    break;
                case PathVerb.Close:
                    needClose = true;
                    break;
                default:
                    console.error("unexpected verb");
            }
        }

    }
    countVerbs() {


    }
    _copy(path:Path){
        path.visit({
            moveTo: (record) => {
                this.moveTo(record.p0.x, record.p0.y)
            },
            lineTo: (record) => {
                this.lineTo(record.p0.x, record.p0.y)
            },
            quadraticCurveTo: (record) => {
                this.quadraticCurveTo(record.p1.x, record.p1.y, record.p2.x, record.p2.y)
            },
            bezierCurveTo: (record) => {
                this.bezierCurveTo(record.p1.x, record.p1.y, record.p2.x, record.p2.y, record.p3.x, record.p3.y)
            },
            closePath: (record) => {
                this.closePath()
            }
        })
        return this
    }
    copy(path:Path) {
        this.reset()
        this._copy(path)
        
        return this
    }
    copy2(source: Path) {
        this.points = source.points.slice().map(p => p.clone())
        this.verbs = source.verbs.slice()
        this.lastMoveIndex = source.lastMoveIndex
        this.needsMoveVerb = source.needsMoveVerb
        return this
    }
    clone() {
        return new Path().copy(this)
    }
    isEmpty() {
        return this.verbs.length === 0
    }
    addPoint(point: Vector2) {
        this.points.push(point)
        return this;
    }
    addVerb(verb: PathVerb) {
        this.verbs.push(verb)
        return this;
    }
    addXY(x: number, y: number) {
        this.points.push(Vector2.create(x, y))
        return this;
    }

    injectMoveToIfNeeded() {
        this.fIsA = IsA.kIsA_MoreThanMoves
        if (this.needsMoveVerb) {
            if(this.isEmpty()){
                this.moveTo(0,0)
            }else{
                this.moveTo(this.lastMovePoint)
            }
        }
        return this;
    }
    moveTo(pt: Vector2): this
    moveTo(x: number, y: number): this
    moveTo(...args: any[]) {
        let x: number, y: number
        if (args.length === 1) {
            x = args[0].x
            y = args[0].y
        } else {
            x = args[0]
            y = args[1]
        }
        if (this.lastVerb === PathVerb.MoveTo) {
            this.lastPoint.set(x, y)
        } else {
            this.lastMoveIndex = this.points.length
            this.addVerb(PathVerb.MoveTo).addXY(x, y);
        }
        this.needsMoveVerb = false
        this.lastMovePoint.set(x, y)
        return this
    }
    lineTo(pt: Vector2): this
    lineTo(x: number, y: number): this
    lineTo(...args: any[]) {
        let x: number, y: number
        if (args.length === 1) {
            x = args[0].x
            y = args[0].y
        } else {
            x = args[0]
            y = args[1]
        }
        this.injectMoveToIfNeeded()
        this.addVerb(PathVerb.LineTo).addXY(x, y);
        this.fSegmentMask |= PathSegmentMask.kLine_SkPathSegmentMask
        return this;
    }
    quadraticCurveTo(cp0: Vector2, pt: Vector2): this
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): this
    quadraticCurveTo(...args: any[]) {
        let cpx: number, cpy: number, x: number, y: number
        if (args.length === 2) {
            let cp0 = args[0]
            let pt = args[1]
            cpx = cp0.x
            cpy = cp0.y
            x = pt.x
            y = pt.y
        } else {
            cpx = args[0]
            cpy = args[1]
            x = args[2]
            y = args[3]
        }

        this.injectMoveToIfNeeded()
        this.addVerb(PathVerb.QuadTo).addXY(cpx, cpy).addXY(x, y);
        this.fSegmentMask |= PathSegmentMask.kQuad_SkPathSegmentMask
        return this;
    }
    bezierCurveTo(cp1: Vector2, cp2: Vector2, pt: Vector2): this
    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): this
    bezierCurveTo(...args: any[]) {
        let cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number
        if (args.length === 3) {
            let cp1 = args[0]
            let cp2 = args[1]
            let pt = args[2]
            cp1x = cp1.x
            cp1y = cp1.y
            cp2x = cp2.x
            cp2y = cp2.y
            x = pt.x
            y = pt.y
        } else {
            cp1x = args[0]
            cp1y = args[1]
            cp2x = args[2]
            cp2y = args[3]
            x = args[4]
            y = args[5]
        }
        this.injectMoveToIfNeeded()
        this.addVerb(PathVerb.CubicTo).addXY(cp1x, cp1y).addXY(cp2x, cp2y).addXY(x, y)
        this.fSegmentMask |= PathSegmentMask.kCubic_SkPathSegmentMask
        return this;
    }
    quadraticCurveToCubic(x0: number, y0: number, cpx: number, cpy: number, x: number, y: number) {
        const r13 = 1 / 3;
        const r23 = 2 / 3;
        const cp1x = r13 * x0 + r23 * cpx
        const cp1y = r13 * y0 + r23 * cpy

        const cp2x = r13 * x + r23 * cpx
        const cp2y = r13 * y + r23 * cpy
        return this.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
    }
    quadraticCurveToCubic2(x0: number, y0: number, cpx: number, cpy: number, x: number, y: number) {
        let cp1x = interpolate(x0, cpx, 2 / 3)
        let cp1y = interpolate(y0, cpy, 2 / 3)
        let cp2x = interpolate(x, cpx, 2 / 3)
        let cp2y = interpolate(y, cpy, 2 / 3)
        return this.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
    }
    conicTo(cp0: Vector2, pt: Vector2, weight: number): this;
    conicTo(x1: number, y1: number, x: number, y: number, weight: number): this;
    conicTo(...args: any[]) {
        let x1: number, y1: number, x: number, y: number, weight: number
        if (args.length === 3) {
            let cp0 = args[0]
            let pt = args[1]
            weight = args[2]
            x1 = cp0.x
            y1 = cp0.y
            x = pt.x
            y = pt.y

        } else {
            x1 = args[0]
            y1 = args[1]
            x = args[2]
            y = args[3]
            weight = args[4]

        }
        if (!(weight > 0.0)) {
            this.lineTo(x, y);
        } else if (!Number.isFinite(weight)) {
            this.lineTo(x1, y1);
            this.lineTo(x, y);
        } else if (weight == 1.0) {
            this.quadraticCurveTo(x1, y1, x, y);
        } else {
            this.injectMoveToIfNeeded()
            let last = this.lastPoint!
            let quadder = conicToQuadratic(last.x, last.y, x1, y1, x, y, weight)
            if (quadder) {

                for (let i = 0; i < quadder.length; i++) {
                    let pt2 = quadder[i][1];
                    let pt3 = quadder[i][2];
                    this.quadraticCurveTo(pt2[0], pt2[1], pt3[0], pt3[1]);
                }
            }
        }
        return this
    }
    conicTo2(...args: any[]) {
        let x1: number, y1: number, x: number, y: number, weight: number
        if (args.length === 3) {
            let cp0 = args[0]
            let pt = args[1]
            weight = args[2]
            x1 = cp0.x
            y1 = cp0.y
            x = pt.x
            y = pt.y

        } else {
            x1 = args[0]
            y1 = args[1]
            x = args[2]
            y = args[3]
            weight = args[4]

        }
        if (!(weight > 0.0)) {
            this.lineTo(x, y);
        } else if (!Number.isFinite(weight)) {
            this.lineTo(x1, y1);
            this.lineTo(x, y);
        } else if (weight == 1.0) {
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
            if (quadder) {
                // Points are ordered as: 0 - 1 2 - 3 4 - 5 6 - ..
                // `count` is a number of pairs +1
                let offset = 1;
                for (let i = 0; i < quadder.len; i++) {
                    let pt1 = quadder.points[offset + 0];
                    let pt2 = quadder.points[offset + 1];
                    this.quadraticCurveTo(pt1.x, pt1.y, pt2.x, pt2.y);
                    offset += 2;
                }
            }

        }
    }

    conicTo3(...args: any[]) {

        let x1: number, y1: number, x: number, y: number, weight: number
        if (args.length === 3) {
            let cp0 = args[0]
            let pt = args[1]
            weight = args[2]
            x1 = cp0.x
            y1 = cp0.y
            x = pt.x
            y = pt.y

        } else {
            x1 = args[0]
            y1 = args[1]
            x = args[2]
            y = args[3]
            weight = args[4]

        }
        if (!(weight > 0.0)) {
            this.lineTo(x, y);
        } else if (!Number.isFinite(weight)) {
            this.lineTo(x1, y1);
            this.lineTo(x, y);
        } else if (weight == 1.0) {
            this.quadraticCurveTo(x1, y1, x, y);
        } else {
            this.injectMoveToIfNeeded()


            let last = this.lastPoint
            let { leftCurve, rightCurve } = subdivideRationalBezier([last, Vector2.create(x1, y1), Vector2.create(x, y)], [1, weight, 1], 0.5);

            if (leftCurve && rightCurve) {
                let quadder = [leftCurve, rightCurve]
                let offset = 1;
                for (let i = 0; i < quadder.length; i++) {
                    let pt1 = quadder[i][1].point;
                    let pt2 = quadder[i][2].point;
                    this.quadraticCurveTo(pt1.x, pt1.y, pt2.x, pt2.y);
                    offset += 2;
                }
            }

        }
    }
    conicTo4(...args: any[]) {

        let x1: number, y1: number, x: number, y: number, weight: number
        if (args.length === 3) {
            let cp0 = args[0]
            let pt = args[1]
            weight = args[2]
            x1 = cp0.x
            y1 = cp0.y
            x = pt.x
            y = pt.y

        } else {
            x1 = args[0]
            y1 = args[1]
            x = args[2]
            y = args[3]
            weight = args[4]

        }
        if (!(weight > 0.0)) {
            this.lineTo(x, y);
        } else if (!Number.isFinite(weight)) {
            this.lineTo(x1, y1);
            this.lineTo(x, y);
        } else if (weight == 1.0) {
            this.quadraticCurveTo(x1, y1, x, y);
        } else {
            this.injectMoveToIfNeeded()


            let last = this.lastPoint
            let quadder = conicToQuadratic2([last, Vector2.create(x1, y1), Vector2.create(x, y)], weight);

            if (quadder) {
                let offset = 1;
                for (let i = 0; i < quadder.length; i++) {
                    let pt1 = quadder[i][1];
                    let pt2 = quadder[i][2];
                    this.quadraticCurveTo(pt1.x, pt1.y, pt2.x, pt2.y);
                    offset += 2;
                }
            }

        }
    }
    closePath() {
        if (!this.isEmpty()) {
            if (this.lastVerb !== PathVerb.Close) {
                this.lastMoveIndex = -1
                this.needsMoveVerb = true
                this.addVerb(PathVerb.Close)
            }
        }
        return this;
    }
    reset() {

        this.points.length = 0
        this.verbs.length = 0
        this.lastMoveIndex = -1
        this.fFillType = PathFillType.kWinding
        this.fIsVolatile = false

        this.fSegmentMask = 0
        this.lastMovePoint.set(0, 0)
        this.lastMoveIndex = -1
        this.needsMoveVerb = true

        return this
    }


    arcTo(oval: BoundingRect, startAngleDeg: number, sweepAngleDeg: number, forceMoveTo: boolean): this;
    arcTo(p1: Vector2, p2: Vector2, radius: number): this;
    arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): this;
    arcTo(r: Vector2, xAxisRotate: number, largeArc: ArcSize, sweep: PathDirection, xy: Vector2): this;
    arcTo(...args: any[]): this {
        if (args.length === 4) {
            const oval = args[0] as BoundingRect
            const startAngle = args[1] as number
            const sweepAngle = args[2] as number
            let forceMoveTo = args[3] as boolean

            if (oval.width < 0 || oval.height < 0) {
                return this;
            }
            if (this.isEmpty()) {
                forceMoveTo = true;
            }

            let lonePt = Vector2.default();
            if (arc_is_lone_point(oval, startAngle, sweepAngle, lonePt)) {
                return forceMoveTo ? this.moveTo(lonePt) : this.lineTo(lonePt);
            }

            let startV = Vector2.default(), stopV = Vector2.default();
            let dir = Ref.make<RotationDirection>(RotationDirection.kCW_SkRotationDirection);
            angles_to_unit_vectors(startAngle, sweepAngle, startV, stopV, dir);

            let singlePt = Vector2.default();

            //如果ForceMoveto为真，则将添加到“ PT”。否则否则我们足够
            //目前接近“ PT”。当添加一系列连续时，这会防止虚假的固定杆
            //来自同一椭圆形的弧。
            let addPt = (pt: Vector2) => {
                if (forceMoveTo) {
                    this.moveTo(pt);
                } else if (!nearly_equal(this.lastPoint, pt)) {
                    this.lineTo(pt);
                }
            };

            //在这一点上，我们知道弧不是孤单的点，而是startv == stopv
            //指示扫描式太小，以至于angles_to_unit_vectors
            //无法处理。
            if (startV.equalsEpsilon(stopV)) {
                let endAngle = degreesToRadian(startAngle + sweepAngle);
                let radiusX = oval.width / 2;
                let radiusY = oval.height / 2;
                //我们在这里不使用skscalar [sin | cos] snaptozero。当罪（startangle）为0时
                //非常小，半径很大，这里的预期行为是绘制一条线。但
                //呼叫skscalarsinsnaptozero将使罪（traingle）为0，然后绘制一个点。
                singlePt.set(oval.cx + radiusX * Math.cos(endAngle),
                    oval.cx + radiusY * Math.sin(endAngle));
                addPt(singlePt);

            }
            let conics = SkConic.make(SkConic.kMaxConicsForArc)
            let count = build_arc_conics(oval, startV, stopV, dir.value, conics, singlePt);

            if (count) {
                const pt = conics[0].fPts[0];
                addPt(pt);
                for (let i = 0; i < count; ++i) {
                    this.conicTo(conics[i].fPts[1], conics[i].fPts[2], conics[i].fW);
                }
            } else {
                addPt(singlePt);
            }
        } else if (typeof args[0] !== 'number' && args.length === 5) {

            let rad = args[0] as Vector2
            let angle = args[1] as number
            let arcLarge = args[2] as ArcSize
            let arcSweep = args[3] as PathDirection
            let endPt = args[4] as Vector2

            this.injectMoveToIfNeeded();

            let srcPts: Vector2[] = Vector2.makeZeroArray(2)
            srcPts[0].copy(this.lastPoint)
            // If rx = 0 or ry = 0 then this arc is treated as a straight line segment (a "lineto")
            // joining the endpoints.
            // http://www.w3.org/TR/SVG/implnote.html#ArcOutOfRangeParameters
            if (!rad.x || !rad.y) {
                return this.lineTo(endPt);
            }
            srcPts[1].copy(endPt)
            // If the current point and target point for the arc are identical, it should be treated as a
            // zero length path. This ensures continuity in animations.
            if (srcPts[0].equalsEpsilon(srcPts[1])) {
                return this.lineTo(endPt);
            }
            let rx = Math.abs(rad.x);
            let ry = Math.abs(rad.y);
            let midPointDistance = srcPts[0].clone().subtract(srcPts[1]);
            midPointDistance.multiplyScalar(0.5)

            // 将轴旋转为水平
            let pointTransform: Matrix2D = Matrix2D.identity()
            pointTransform.setRotateDegrees(-angle);


            let transformedMidPoint = Vector2.default();
            pointTransform.mapPoint(transformedMidPoint, midPointDistance);

            let squareRx = rx * rx;
            let squareRy = ry * ry;
            let squareX = transformedMidPoint.x * transformedMidPoint.x;
            let squareY = transformedMidPoint.y * transformedMidPoint.y;

            // Check if the radii are big enough to draw the arc, scale radii if not.
            // http://www.w3.org/TR/SVG/implnote.html#ArcCorrectionOutOfRangeRadii
            let radiiScale = squareX / squareRx + squareY / squareRy;
            if (radiiScale > 1) {
                radiiScale = Math.sqrt(radiiScale);
                rx *= radiiScale;
                ry *= radiiScale;
            }

            pointTransform.setScale(1 / rx, 1 / ry);
            pointTransform.preRotate(-angle);

            let unitPts: Vector2[] = [Vector2.zero(), Vector2.zero()];
            pointTransform.mapPoints(unitPts, srcPts);
            let delta = unitPts[1].clone().sub(unitPts[0]);

            let d = delta.x * delta.x + delta.y * delta.y;
            let scaleFactorSquared = Math.max(1 / d - 0.25, 0);

            let scaleFactor = Math.sqrt(scaleFactorSquared);
            if ((arcSweep == PathDirection.kCCW) != Boolean(arcLarge)) {  // flipped from the original implementation
                scaleFactor = -scaleFactor;
            }
            delta.multiplyScalar(scaleFactor);
            let centerPoint = unitPts[0].clone().add(unitPts[1]);
            centerPoint.multiplyScalar(0.5);
            centerPoint.translate(-delta.y, delta.x);
            unitPts[0].sub(centerPoint);
            unitPts[1].sub(centerPoint);
            let theta1 = Math.atan2(unitPts[0].y, unitPts[0].x);
            let theta2 = Math.atan2(unitPts[1].y, unitPts[1].x);
            let thetaArc = theta2 - theta1;
            if (thetaArc < 0 && Number(arcSweep) == PathDirection.kCW) {  // arcSweep flipped from the original implementation
                thetaArc += Math.PI * 2;
            } else if (thetaArc > 0 && Number(arcSweep) == PathDirection.kCCW) {  // arcSweep flipped from the original implementation
                thetaArc -= Math.PI * 2;
            }

            // Very tiny angles cause our subsequent math to go wonky (skbug.com/9272)
            // so we do a quick check here. The precise tolerance amount is just made up.
            // PI/million happens to fix the bug in 9272, but a larger value is probably
            // ok too.
            if (Math.abs(thetaArc) < (Math.PI / (1000 * 1000))) {
                return this.lineTo(endPt);
            }

            pointTransform.setRotate(angle);
            pointTransform.preScale(rx, ry);

            // the arc may be slightly bigger than 1/4 circle, so allow up to 1/3rd
            let segments = Math.ceil(Math.abs(thetaArc / (2 * Math.PI / 3)));
            let thetaWidth = thetaArc / segments;
            let t = Math.tan(0.5 * thetaWidth);
            if (!Number.isFinite(t)) {
                return this;
            }

            const ScalarHalf = 0.5
            let startTheta = theta1;
            let w = Math.sqrt(ScalarHalf + Math.cos(thetaWidth) * ScalarHalf);
            let scalar_is_integer = (scalar: number) => {
                return scalar == Math.floor(scalar);
            };
            let expectIntegers = scalarNearlyZero(Math.PI / 2 - Math.abs(thetaWidth)) &&
                scalar_is_integer(rx) && scalar_is_integer(ry) &&
                scalar_is_integer(endPt.x) && scalar_is_integer(endPt.y);

            for (let i = 0; i < segments; ++i) {
                let endTheta = startTheta + thetaWidth,
                    sinEndTheta = scalarSinSnapToZero(endTheta),
                    cosEndTheta = scalarCosSnapToZero(endTheta);

                unitPts[1].set(cosEndTheta, sinEndTheta);
                unitPts[1].add(centerPoint);
                unitPts[0].copy(unitPts[1]);
                unitPts[0].translate(t * sinEndTheta, -t * cosEndTheta);
                let mapped: Vector2[] = [Vector2.zero(), Vector2.zero()];
                pointTransform.mapPoints(mapped, unitPts);
                /*
                计算电弧宽度引入导致弧线启动的舍入错误
                在他们的痕迹之外。结果可能会失去凸面。如果输入
                值在整数上，也将圆锥体放在整数上。
                 */
                if (expectIntegers) {
                    for (let point of mapped) {
                        point.x = Math.round(point.x);
                        point.y = Math.round(point.y);
                    }
                }
                this.conicTo(mapped[0], mapped[1], w);
                startTheta = endTheta;
            }

            // The final point should match the input point (by definition); replace it to
            // ensure that rounding errors in the above math don't cause any problems.
            this.lastPoint.copy(endPt)
            return this;
        } else if (args.length == 3 || typeof args[0] === 'number' && args.length === 5) {
            let p1 = args[0] as Vector2, p2 = args[1] as Vector2, radius = args[2] as number;
            if (typeof args[0] === 'number' && args.length === 5) {

                p1 = Vector2.create(args[0], args[1])
                p2 = Vector2.create(args[2], args[3])
                radius = args[4]
            }

            this.injectMoveToIfNeeded();

            if (radius == 0) {
                return this.lineTo(p1);
            }

            // need to know our prev pt so we can construct tangent vectors
            let start = this.lastPoint.clone();

            // need double precision for these calcs.
            let befored = Vector2.create(p1.x - start.x, p1.y - start.y).normalize()
            let afterd = Vector2.create(p2.x - p1.x, p2.y - p1.y).normalize()
            let cosh = befored.dot(afterd)
            let sinh = befored.cross(afterd)
            //如果上点等于第一个点，则将其拟合化。
            //如果两个点相等，则将其置于拟态度。
            //如果第二点等于第一个点，则SINH为零。
            //在所有这些情况下，我们都无法构建一个弧线，因此我们构造了一条线到第一点。
            if (!befored.isFinite() || !afterd.isFinite() || scalarNearlyZero(sinh)) {
                return this.lineTo(p1);
            }

            // safe to convert back to floats now
            let dist = Math.abs(radius * (1 - cosh) / sinh);
            let xx = p1.x - dist * befored.x;
            let yy = p1.y - dist * befored.y;

            const ScalarHalf = 0.5
            let after = afterd.clone()
            after.setLength(dist);
            this.lineTo(xx, yy);
            let weight = Math.sqrt(ScalarHalf + cosh * 0.5);
            return this.conicTo(p1, p1.clone().add(after), weight);
        }
        return this
    }
    arcToOval(oval: BoundingRect, startAngleDeg: number, sweepAngleDeg: number, forceMoveTo = false) {
        return this.arcTo(oval, startAngleDeg, sweepAngleDeg, forceMoveTo);
    }
    arcToOval2(x: number, y: number, rx: number, ry: number, rotation: number, startAngle: number, deltaAngle: number, shouldLineTo: boolean = false) {
        const { x1, y1, x2, y2, fa, fs } = centerToEndPoint(
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
        this.ellipseArc(x1, y1,x2, y2, rx, ry, rotation, fa, fs)
    }
    // 椭圆弧
    ellipseArc(x1: number, y1: number, x2: number, y2: number,
        _rx: number, _ry: number, xAxisRotation: number,
        largeArcFlag: number, sweepFlag: number) {

        // 转换 A 命令为若干个 cubic 贝塞尔曲线段
        let curves = arcToCubicCurves(x1, y1, x2, y2, _rx, _ry, xAxisRotation, largeArcFlag, sweepFlag);
        for (const curve of curves) {
            this.bezierCurveTo(curve[2], curve[3], curve[4], curve[5], curve[6], curve[7])
        }
    }
    ellipseArc2(x1: number, y1: number, x2: number, y2: number,
        _rx: number, _ry: number, xAxisRotation: number,
        largeArcFlag: number, sweepFlag: number) {
        const { cx, cy, rx, ry, theta1, deltaTheta } = endPointToCenter(x1, y1, x2, y2, _rx, _ry, xAxisRotation, largeArcFlag, sweepFlag)


        const segments = Math.ceil(Math.abs(deltaTheta) / (Math.PI / 2))
        const delta = deltaTheta / segments
        let startTheta = theta1

        const pointTransform = Matrix2D.fromRotate(xAxisRotation)
        pointTransform.preScale(rx, ry)

        // const beiers=ellipseArcToCubicBezier(x1,y1,x2,y2,_rx,_ry,xAxisRotation,largeArcFlag,sweepFlag)
        // for(let b of beiers){
        //    this.bezierCurveTo(b[2],b[3],b[4],b[5],b[6],b[7])
        // }
        const k = 4 / 3 * Math.tan(delta / 4) // 控制点的延伸长度
        // 计算弧
        for (let i = 0; i < segments; i++) {
            let endTheta = startTheta + delta

            // 椭圆标准参数方程
            const p0 = Vector2.create(Math.cos(startTheta), Math.sin(startTheta))
            const p3 = Vector2.create(Math.cos(endTheta), Math.sin(endTheta))

            // const p1=p0.clone().add(p0.clone().rotateCCW().multiplyScalar(k))
            // const p2=p3.clone().add(p3.clone().rotateCW().multiplyScalar(k))
            const p1 = p0.clone().add(p0.clone().rotate(Math.PI / 2).multiplyScalar(k))
            const p2 = p3.clone().add(p3.clone().rotate(-Math.PI / 2).multiplyScalar(k))


            // p0.scale(rx,ry).rotate(xAxisRotation).translate(cx,cy)                   
            // p1.scale(rx,ry).rotate(xAxisRotation).translate(cx,cy)                   
            // p2.scale(rx,ry).rotate(xAxisRotation).translate(cx,cy)                   
            // p3.scale(rx,ry).rotate(xAxisRotation).translate(cx,cy)                   

            p0.applyMatrix2D(pointTransform).translate(cx, cy)
            p1.applyMatrix2D(pointTransform).translate(cx, cy)
            p2.applyMatrix2D(pointTransform).translate(cx, cy)
            p3.applyMatrix2D(pointTransform).translate(cx, cy)
            this.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y)
            startTheta = endTheta
        }

        return this
    }
    addArc(oval: BoundingRect, startAngleDeg: number, sweepAngleDeg: number) {
        if (oval.isEmpty() || 0 == sweepAngleDeg) {
            return this;
        }

        const kFullCircleAngle = 360;

        if (sweepAngleDeg >= kFullCircleAngle || sweepAngleDeg <= -kFullCircleAngle) {
            // We can treat the arc as an oval if it begins at one of our legal starting positions.
            // See SkPath::addOval() docs.
            let startOver90 = startAngleDeg / 90.;
            let startOver90I = Math.round(startOver90);
            let error = startOver90 - startOver90I;

            if (scalarNearlyEqual(error, 0)) {
                // Index 1 is at startAngle == 0.
                let startIndex = mod(startOver90I + 1, 4);
                startIndex = startIndex < 0 ? startIndex + 4 : startIndex;
                return this.addOval(oval, sweepAngleDeg > 0 ? PathDirection.kCW : PathDirection.kCCW, startIndex);
            }
        }
        return this.arcTo(oval, startAngleDeg, sweepAngleDeg, true);
    }
    addCircle(x: number, y: number, r: number, dir: PathDirection = PathDirection.kCCW) {
        if (r >= 0) {
            this.addOval(BoundingRect.fromLTRB(x - r, y - r, x + r, y + r), dir);
        }
        return this;
    }
    addRect(rect: BoundingRect, dir: PathDirection): this;
    addRect(rect: BoundingRect, dir: PathDirection, index: number): this;
    addRect(...args: any[]): this {
        let rect = args[0] as BoundingRect, dir = args[1] as PathDirection, index = args.length == 3 ? args[2] as number : 0;
        let iter = new RectPointIterator(rect, dir, index);
        this.moveTo(iter.current);
        this.lineTo(iter.next);
        this.lineTo(iter.next);
        this.lineTo(iter.next);
        this.closePath();
        return this
    }
    addOval(oval: BoundingRect): this;
    addOval(oval: BoundingRect, dir: PathDirection): this;
    addOval(oval: BoundingRect, dir: PathDirection, index: number): this;

    addOval(...args: any[]) {
        let oval: BoundingRect, dir: PathDirection, index: number;
        oval = args[0] as BoundingRect
        dir = args[1] ?? PathDirection.kCW as PathDirection
        index = args[2] ?? 1

        const prevIsA = this.fIsA;

        const ovalIter = new OvalPointIterator(oval, dir, index);
        const rectIter = new RectPointIterator(oval, dir, index + (dir == PathDirection.kCW ? 0 : 1));

        //角迭代器PTS正在跟踪椭圆形/半径PT的“后面”。
        const scalarRoot2Over2 = 0.707106781
        this.moveTo(ovalIter.current);
        for (let i = 0; i < 4; ++i) {
            this.conicTo(rectIter.next, ovalIter.next, scalarRoot2Over2);
            //  console.log('rectIter-x', rectIter.current.x, 'rectIter-y', rectIter.current.y, 'ovalIter-x', ovalIter.current.x, 'ovalIter-y', ovalIter.current.y)
        }
        this.closePath();
        //console.log('ovalIter', ovalIter.fPts.map(p => `x:${p.x},y:${p.y}`))
        // console.log('rectIter', rectIter.fPts.map(p => `x:${p.x},y:${p.y}`))
        if (prevIsA == IsA.kIsA_JustMoves) {
            this.fIsA = IsA.kIsA_Oval;
            this.fIsACCW = (dir == PathDirection.kCCW);
            this.fIsAStart = index % 4;
        }
        return this;
    }
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, ccw: boolean) {
        let bounds = BoundingRect.fromLTRB(x - radius, y - radius, x + radius, y + radius);
        const sweep = radianToDegrees(endAngle - startAngle) - 360 * (ccw ? 1 : 0);
        const temp = new Path();
        temp.addArc(bounds, radianToDegrees(startAngle), sweep);
        return this.addPath(temp, AddPathMode.kExtend_AddPathMode)
    }

    // 对标PathKit的ellipse方法

    ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, ccw: boolean = false) {
        // This is easiest to do by making a new path and then extending the current path
        // (this properly catches the cases of if there's a moveTo before this call or not).
        let bounds = BoundingRect.fromLTRB(x - radiusX, y - radiusY, x + radiusX, y + radiusY);

        const sweep = radianToDegrees(endAngle - startAngle) - (360 * (ccw ? 1 : 0));

        const temp = new Path();
        temp.addArc(bounds, radianToDegrees(startAngle), sweep);

        let m = Matrix2D.identity();
        m.setRotate(rotation, x, y);
        this.addPath(temp, m, AddPathMode.kExtend_AddPathMode);
    }
    // 对标canvas path2d的ellipse
    ellipse2(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, ccw: boolean = false) {
        ellipse(this, x, y, radiusX, radiusY, rotation, startAngle, endAngle, ccw)
    }
        // 对标canvas path2d的ellipse
    ellipse3(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, ccw: boolean = false) {
        if (radiusX < 0 || radiusY < 0) {
            throw new DOMException("radii cannot be negative", "IndexSizeError");
        }
       
        const tau = Math.PI*2
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

        let sweepDegrees = (endAngle - startAngle);
        let startDegrees = (startAngle);

        //绘制 2 180 度线段，因为尝试一次绘制所有 360 度
        //不绘制任何内容。
        if (almostEqual(Math.abs(radianToDegrees(sweepDegrees)), 360)) {
            const halfSweep = sweepDegrees / 2;
            // this.moveTo(x,y)
            this.arcToOval2(
                x,
                y,
                radiusX,
                radiusY,
                rotation,
                startDegrees,
                (halfSweep),
                true
            );
            this.arcToOval2(
                x,
                y,
                radiusX,
                radiusY,
                rotation,
                (startDegrees + halfSweep),
                (halfSweep),
                false
            );
        }
        else {
            this.arcToOval2(
                x,
                y,
                radiusX,
                radiusY,
                rotation,
                (startDegrees),
                (sweepDegrees),
                true
            );
        }
    }
    rect(x: number, y: number, w: number, h: number) {
        return this.addRect(BoundingRect.fromXYWH(x, y, w, h), PathDirection.kCCW, 0)
    }
    roundRect(x: number, y: number, width: number, height: number, radius: number | number | { tl: number, tr: number, br: number, bl: number }) {
        let ctx = this;
        // 如果 radius 是数字，统一处理为四个角的半径
        if (typeof radius === 'number') {
            radius = { tl: radius, tr: radius, br: radius, bl: radius };
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

        ctx.closePath(); // 闭合路径
    }

    getBounds() {
        return BoundingRect.default().setFromPoints(this.points)
    }
    computeTightBounds() {
        const bounds = BoundingRect.default()
        for (let d of this) {
            switch (d.type) {
                case PathVerb.MoveTo:
                    bounds.expandByPoint(d.p0!)

                    break;
                case PathVerb.LineTo:
                    bounds.expandByPoint(d.p0!)
                    break;
                case PathVerb.QuadTo:
                    {
                        const { min, max } = quadraticBezierBounds(d.p0!, d.p1!, d.p2!)
                        bounds.expandByPoint(min!)
                        bounds.expandByPoint(max!)
                    }
                    break
                case PathVerb.CubicTo:
                    {
                        const { min, max } = cubicBezierBounds(d.p0!, d.p1!, d.p2!, d.p3!)
                        bounds.expandByPoint(min!)
                        bounds.expandByPoint(max!)
                    }
                    break
            }
        }
        return bounds

    }
    transform(matrix: Matrix2D) {
        matrix.mapPoints(this.points, this.points)
    }
    translate(x: number, y: number) {
        this.transform(Matrix2D.fromTranslate(x, y))
    }
    rotate(angle: number) {
        this.transform(Matrix2D.fromRotate(angle))
    }
    scale(x: number, y: number) {
        this.transform(Matrix2D.fromScale(x, y))
    }
    visit(_visitor: Partial<PathVisitor>) {
        const visitor:PathVisitor = Object.assign({
            moveTo: () => { },
            lineTo: () => { },
            quadraticCurveTo: () => { },
            bezierCurveTo: () => { },
            closePath: () => { }
        }, _visitor)
        for (let d of this) {
            switch (d.type) {
                case PathVerb.MoveTo:
                    visitor.moveTo({type:d.type,p0:d.p0!});
                    break
                case PathVerb.LineTo:
                    visitor.lineTo({type:d.type,p0:d.p0!});
                    break
                case PathVerb.QuadTo:
                    visitor.quadraticCurveTo({type:d.type,p0:d.p0!,p1:d.p1!,p2:d.p2!});
                    break
                case PathVerb.CubicTo:
                    visitor.bezierCurveTo({type:d.type,p0:d.p0!,p1:d.p1!,p2:d.p2!,p3:d.p3!});
                    break
                case PathVerb.Close:
                    visitor.closePath({ type:d.type, lastMovePoint: d.p0! })
                    break
            }

        }
    }
    [Symbol.iterator](): Iterator<PathVerbData> {
        const self = this;
        return (function* () {
            const verbs = self.verbs, points = self.points.map(p => p.clone())
            let index = 0, p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2, lastMove: Vector2 | null = null;
            for (let i = 0; i < verbs.length; i++) {
                const type = verbs[i]
                switch (type) {
                    case PathVerb.MoveTo:
                        index += 1;
                        p0 = points[index - 1]
                        lastMove = p0
                        yield { type, p0 }
                        break;
                    case PathVerb.LineTo:
                        index += 1;
                        p0 = points[index - 1]
                        yield { type, p0 }
                        break;
                    case PathVerb.QuadTo:
                        index += 2;
                        p0 = points[index - 3]
                        p1 = points[index - 2]
                        p2 = points[index - 1]
                        yield { type, p0, p1, p2 }
                        break;
                    case PathVerb.CubicTo:
                        index += 3;
                        p0 = points[index - 4]
                        p1 = points[index - 3]
                        p2 = points[index - 2]
                        p3 = points[index - 1]
                        yield { type, p0, p1, p2, p3 }
                        break;
                    case PathVerb.Close:
                        yield { type, p0: lastMove?.clone() }
                        break;
                }
            }
        })();
    }
    fatten() {
        const newPath = new Path()

        for (let { type, p0, p1, p2, p3 } of this) {
            switch (type) {
                case PathVerb.MoveTo:
                    newPath.moveTo(p0!.x, p0!.y)
                    break;
                case PathVerb.LineTo:
                    newPath.lineTo(p0!.x, p0!.y)
                    break;
                case PathVerb.QuadTo:
                    quadraticCurveToLines(p0!, p1!, p2!).forEach(p => {
                        newPath.lineTo(p.x, p.y)
                    })
                    break;
                case PathVerb.CubicTo:
                    cubicCurveToLines(p0!, p1!, p2!, p3!).forEach(p => {
                        newPath.lineTo(p.x, p.y)
                    })
                    break;
                case PathVerb.Close:
                    newPath.closePath()
                    break;
            }
        }
        return newPath
    }
    isZeroLengthSincePoint(start_pt_index: number):boolean {
        let count = this.points.length - start_pt_index;
        if(count < 2) {
            return true;
        }

        let first = this.points[start_pt_index];
        for(let i=1;i<count;i++) {
            if(!first.equalsEpsilon(this.points[start_pt_index + i])) {
                return false;
            }
        }

       return true
    }
    toPolygons(closed:boolean=false): Vector2[][] {
     
        const newPath = this.fatten()
        const polygons: Vector2[][] = []
        let polygon: Vector2[] | null = null
        let lastMovePoint: Vector2 | null = null;
        for (let { type, p0, p1, p2, p3 } of newPath) {
            switch (type) {
                case PathVerb.MoveTo:
                    if (polygon != null) {
                        polygons.push(polygon)
                    }
                    polygon = []
                    polygon.push(p0!.clone())
                    lastMovePoint = p0!.clone()
                    break;
                case PathVerb.LineTo:
                    polygon!.push(p0!.clone())
                    break;
                case PathVerb.QuadTo:
                    quadraticCurveToLines(p0!, p1!, p2!).forEach(p => {
                        polygon!.push(p.clone())
                    })
                    break;
                case PathVerb.CubicTo:
                    cubicCurveToLines(p0!, p1!, p2!, p3!).forEach(p => {
                        polygon!.push(p.clone())
                    })
                    break;
                case PathVerb.Close:
                    if (polygon) {
                        if (closed) {
                            polygon!.push(lastMovePoint!.clone())
                        } 
                        polygons.push(polygon)
                        polygon = null
                        lastMovePoint = null
                    }
                    break;
            }
        }
        if(polygon){
            polygons.push(polygon)
        }
        return polygons
    }
    toCanvas(ctx: CanvasRenderingContext2D | Path2D) {
        for (let { type, p0, p1, p2, p3 } of this) {
            switch (type) {
                case PathVerb.MoveTo:
                    ctx.moveTo(p0!.x, p0!.y)
                    break;
                case PathVerb.LineTo:
                    ctx.lineTo(p0!.x, p0!.y)
                    break;
                case PathVerb.QuadTo:
                    ctx.quadraticCurveTo(p1!.x, p1!.y, p2!.x, p2!.y)
                    break;
                case PathVerb.CubicTo:
                    ctx.bezierCurveTo(p1!.x, p1!.y, p2!.x, p2!.y, p3!.x, p3!.y)
                    break;
                case PathVerb.Close:
                    ctx.closePath()
                    break;
            }
        }
    }
    toPath2D(path: Path2D = new Path2D()) {
        this.toCanvas(path)
        return path
    }

}
