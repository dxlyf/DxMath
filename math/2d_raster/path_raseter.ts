


export type Color = [number, number, number, number]
export class Point {
    static splat(x: number) {
        return this.create(x, x)
    }
    static create(x: number = 0, y: number = 0) { return new Point(x, y) }
    constructor(public x: number, public y: number) { }
    set(x: number, y: number) { this.x = x; this.y = y }
    clone() {
        return Point.create(this.x, this.y)
    }
    copy(source: Point) {
        this.x = source.x
        this.y = source.y
        return this
    }

    add(point: Point) {
        this.x += point.x
        this.y += point.y
        return this
    }
    sub(point: Point) {
        this.x -= point.x
        this.y -= point.y
        return this
    }
    mul(point: Point) {
        this.x *= point.x
        this.y *= point.y
        return this
    }

    mulScalar(scalar: number) { this.x *= scalar; this.y *= scalar; return this }

    div(point: Point) {
        this.x /= point.x
        this.y /= point.y
        return this
    }
    distance(point: Point) {
        return Math.sqrt(Math.pow(this.x - point.x, 2) + Math.pow(this.y - point.y, 2))
    }
    distanceSquared(point: Point) {
        return (this.x - point.x) * (this.x - point.x) + (this.y - point.y) * (this.y - point.y)
    }
    dot(point: Point) { return this.x * point.x + this.y * point.y }
    cross(point: Point) { return this.x * point.y - this.y * point.x }
    length() { return Math.sqrt(this.x * this.x + this.y * this.y) }
    lengthSquared() { return this.x * this.x + this.y * this.y }
    normalize() { return this.mul(Point.create(1 / this.length(), 1 / this.length())) }
    perp() { return Point.create(-this.y, this.x) }
    rperp() { return Point.create(this.y, -this.x) }
    project(point: Point) {
        const t = this.dot(point) / point.lengthSquared()
        return Point.create(point.x * t, point.y * t)
    }
    rotate(angle: number, origin: Point = Point.create(0, 0)) {
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        const x = this.x - origin.x
        const y = this.y - origin.y
        this.x = origin.x + cos * x - sin * y
        this.y = origin.y + sin * x + cos * y
        return this
    }
    translate(x: number, y: number) { this.x += x; this.y += y; return this }
    reflect(normal: Point) {
        const dp = this.dot(normal) * 2
        return Point.create(this.x - dp * normal.x, this.y - dp * normal.y)
    }
    lerp(point: Point, t: number) {
        this.x = this.x + (point.x - this.x) * t
        this.y = this.y + (point.y - this.y) * t
        return this
    }
    min(point: Point) {
        this.x = Math.min(this.x, point.x)
        this.y = Math.min(this.y, point.y)
        return this
    }
    max(point: Point) {
        this.x = Math.max(this.x, point.x)
        this.y = Math.max(this.y, point.y)
        return this
    }
    floor() { this.x = Math.floor(this.x); this.y = Math.floor(this.y); return this }
    ceil() { this.x = Math.ceil(this.x); this.y = Math.ceil(this.y); return this }
    round() { this.x = Math.round(this.x); this.y = Math.round(this.y); return this }
    abs() { this.x = Math.abs(this.x); this.y = Math.abs(this.y); return this }
    negate() { this.x = -this.x; this.y = -this.y; return this }

    setLength(len: number) {
        const len2 = this.lengthSquared()
        if (len2 === 0) return
        this.mulScalar(len / Math.sqrt(len2))
        return this
    }
    toArray() { return [this.x, this.y] }
    toString() { return `Point(${this.x}, ${this.y})` }

    equals(point: Point) { return this.x === point.x && this.y === point.y }
    equalsEpsilon(point: Point, epsilon = 0.0001) {
        return Math.abs(this.x - point.x) < epsilon && Math.abs(this.y - point.y) < epsilon
    }
}

class Matrix2D {
    static fromScale(sx: number, sy: number) {
        return new Matrix2D().setScale(sx, sy)
    }
    static fromRotate(angle: number) {
        return new Matrix2D().setRotate(angle)
    }
    static fromTranslate(tx: number, ty: number) {
        return new Matrix2D().setTranslate(tx, ty)
    }
    static fromRows(a: number, b: number, c: number, d: number, tx: number, ty: number) {
        return new Matrix2D().set(a, b, c, d, tx, ty)
    }
    static default() {
        return new this()
    }
    elements: Float32Array = new Float32Array(6)
    constructor() {
        this.setIdentity()
    }
    clone() {
        const m = new Matrix2D()
        m.elements.set(this.elements)
        return m
    }
    copy(source: Matrix2D) {
        this.elements.set(source.elements)
        return this
    }

    set(a: number, b: number, c: number, d: number, tx: number, ty: number) {
        this.elements[0] = a
        this.elements[1] = b
        this.elements[2] = c
        this.elements[3] = d
        this.elements[4] = tx
        this.elements[5] = ty
        return this
    }
    setIdentity() {

        return this.set(1, 0, 0, 1, 0, 0)
    }
    setRotate(angle: number) {
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        return this.set(cos, sin, -sin, cos, 0, 0)
    }
    setSinCos(sin: number, cos: number) {
        return this.set(cos, sin, -sin, cos, 0, 0)
    }
    setScale(sx: number, sy: number) {
        return this.set(sx, 0, 0, sy, 0, 0)
    }
    setTranslate(tx: number, ty: number) {
        return this.set(1, 0, 0, 1, tx, ty)
    }
    setSkew(sx: number, sy: number) {
        return this.set(1, sy, sx, 1, 0, 0)
    }
    transformPoint(point: Point) {
        const x = point.x
        const y = point.y
        point.x = this.elements[0] * x + this.elements[2] * y + this.elements[4]
        point.y = this.elements[1] * x + this.elements[3] * y + this.elements[5]
    }
    transformPoints(points: Point[]) {
        for (let i = 0; i < points.length; i++) {
            this.transformPoint(points[i])
        }
    }
    mapPoints(outPoints: Point[], inPoints: Point[]) {
        for (let i = 0; i < inPoints.length; i++) {
            outPoints[i].x = this.elements[0] * inPoints[i].x + this.elements[2] * inPoints[i].y + this.elements[4]
            outPoints[i].y = this.elements[1] * inPoints[i].x + this.elements[3] * inPoints[i].y + this.elements[5]
        }
    }
    mapXY(x: number, y: number, out: Point) {
        out.x = this.elements[0] * x + this.elements[2] * y + this.elements[4]
        out.y = this.elements[1] * x + this.elements[3] * y + this.elements[5]
    }
    invert() {
        const a = this.elements[0]
        const b = this.elements[1]
        const c = this.elements[2]
        const d = this.elements[3]
        const tx = this.elements[4]
        const ty = this.elements[5]
        const n = (a * d - b * c)
        if (n === 0) {
            return false
        }
        this.elements[0] = d / n
        this.elements[1] = -b / n
        this.elements[2] = -c / n
        this.elements[3] = a / n
        this.elements[4] = (c * ty - d * tx) / n
        this.elements[5] = -(a * ty - b * tx) / n
    }
    multiply(m: Matrix2D) {
        return this.multiplyMatrices(this, m);
    }
    premultiply(m: Matrix2D) {
        return this.multiplyMatrices(m, this);
    }
    multiplyMatrices(left: Matrix2D, right: Matrix2D) {
        const ae = left.elements;
        const be = right.elements;

        const a = ae[0] * be[0] + ae[2] * be[1]
        const b = ae[1] * be[0] + ae[3] * be[1]
        const c = ae[0] * be[2] + ae[2] * be[3]
        const d = ae[1] * be[2] + ae[3] * be[3]
        const e = ae[0] * be[4] + ae[2] * be[5] + ae[4]
        const f = ae[1] * be[5] + ae[3] * be[5] + ae[5]
        return this.set(a, b, c, d, e, f);

    }
    preScale(sx: number, sy: number) {
        return this.multiplyMatrices(this, Matrix2D.fromScale(sx, sy))
    }
    postScale(sx: number, sy: number) {
        return this.multiplyMatrices(Matrix2D.fromScale(sx, sy), this)
    }
    preRotate(angle: number) {
        return this.multiplyMatrices(this, Matrix2D.fromRotate(angle))
    }
    postRotate(angle: number) {
        return this.multiplyMatrices(Matrix2D.fromRotate(angle), this)
    }
    preTranslate(tx: number, ty: number) {
        return this.multiplyMatrices(this, Matrix2D.fromTranslate(tx, ty))
    }
    postTranslate(tx: number, ty: number) {
        return this.multiplyMatrices(Matrix2D.fromTranslate(tx, ty), this)
    }
}
export class Rect {
    static fromPoints(points: Point[]) {
        let minX = Number.MAX_SAFE_INTEGER
        let maxX = 0
        let minY = Number.MAX_SAFE_INTEGER
        let maxY = 0
        for (const point of points) {
            if (point.x < minX) {
                minX = point.x
            }
            if (point.x > maxX) {
                maxX = point.x
            }
            if (point.y < minY) {
                minY = point.y
            }
            if (point.y > maxY) {
                maxY = point.y
            }
        }
        return Rect.fromLTRB(minX, minY, maxX, maxY)
    }
    static fromXYWH(x: number, y: number, width: number, height: number) {
        return this.fromLTRB(x, y, x + width, y + height)
    }
    static fromLTRB(left: number, top: number, right: number, bottom: number) {
        return new Rect(left, top, right, bottom)
    }
    constructor(public left: number, public top: number, public right: number, public bottom: number) { }
    get width() { return this.right - this.left }
    get height() { return this.bottom - this.top }
    get cx() { return (this.left + this.right) / 2 }
    get cy() { return (this.top + this.bottom) / 2 }

    sort() {
        if (this.left > this.right) {
            let temp = this.left
            this.left = this.right
            this.right = temp
        }
        if (this.top > this.bottom) {
            let temp = this.top
            this.top = this.bottom
            this.bottom = temp
        }
    }
    clone() {
        return Rect.fromLTRB(this.left, this.top, this.right, this.bottom)
    }
    contains(point: Point) {
        if (point.x < this.left || point.x > this.right) return false
        if (point.y < this.top || point.y > this.bottom) return false
        return true
    }
    isEmpty(){
         return !(this.left < this.right && this.top < this.bottom);
    }

}
class PointIterator{
    points:Point[]=[]
    _current:number=0
    _advance:number=1
    constructor(public n:number,ccw:boolean,  startIndex: number){
        this.points=new Array(this.n)
        this._current=startIndex%this.n
        this._advance=ccw?this.n-1:1
    }
    get current() {
        return this.points[this._current]
    }
    get next() {
        this._current=(this._current+this._advance)%this.n
        return this.current
    }
}
class Path_OvalPointIterator extends PointIterator{
  
    constructor(public oval:Rect,ccw:boolean,  startIndex: number) {
        super(4,ccw,startIndex)
        const  cx = oval.cx;
        const  cy = oval.cy;
       
        this.points[0] = Point.create(cx, oval.top);
        this.points[1] = Point.create(oval.right, cy);
        this.points[2] = Point.create(cx, oval.bottom);
        this.points[3] = Point.create(oval.left, cy);
    }
}
class Path_RectPointIterator extends PointIterator{
  
    constructor(public rect:Rect,ccw:boolean,  startIndex: number) {
        super(4,ccw,startIndex)
   
        this.points[0] = Point.create(rect.left, rect.top);
        this.points[1] = Point.create(rect.right, rect.top);
        this.points[2] = Point.create(rect.right, rect.bottom);
        this.points[3] = Point.create(rect.left, rect.bottom)
    }
}
class Path_RRectPointIterator extends PointIterator{
  
    constructor(public rrect:Rect,ccw:boolean,  startIndex: number) {
        super(8,ccw,startIndex)
   
        const  bounds = rrect.getBounds();
        const  L = bounds.least;
        const  T = bounds.fTop;
        const  R = bounds.fRight;
        const  B = bounds.fBottom;
      
        fPts[0] = SkPoint::Make(L + rrect.radii(SkRRect::kUpperLeft_Corner).fX, T);
        fPts[1] = SkPoint::Make(R - rrect.radii(SkRRect::kUpperRight_Corner).fX, T);
        fPts[2] = SkPoint::Make(R, T + rrect.radii(SkRRect::kUpperRight_Corner).fY);
        fPts[3] = SkPoint::Make(R, B - rrect.radii(SkRRect::kLowerRight_Corner).fY);
        fPts[4] = SkPoint::Make(R - rrect.radii(SkRRect::kLowerRight_Corner).fX, B);
        fPts[5] = SkPoint::Make(L + rrect.radii(SkRRect::kLowerLeft_Corner).fX, B);
        fPts[6] = SkPoint::Make(L, B - rrect.radii(SkRRect::kLowerLeft_Corner).fY);
        fPts[7] = SkPoint::Make(L, T + rrect.radii(SkRRect::kUpperLeft_Corner).fY);
    }
}
export class RRect {

}
enum PathDirection {
    /** clockwise direction for adding closed contours */
    CW,
    /** counter-clockwise direction for adding closed contours */
    CCW,
    kUnknown
};
export enum PATH_VERBS {
    MOVE,
    LINE,
    QUAD,
    CUBIC,
    CONIC,
    CLOSE
}
export enum PaintStyle {
    fill,
    stroke,
    fillAndStroke
}
export enum FillRule {
    nonZero,
    evenOdd
}
export enum LineJoin {
    bevel,
    round,
    miter
}
export enum LineCap {
    butt,
    round,
    square
}
export class Paint {
    style: PaintStyle = PaintStyle.stroke
    color: Color = [0, 0, 0, 1]
    lineWidth: number = 1
    lineJoin: LineJoin = LineJoin.miter
    lineCap: LineCap = LineCap.butt
    miterLimit: number = 10
    fillRule: FillRule = FillRule.nonZero
}

export class Path {

  /**
   * 将 C++ 中 SkConic::BuildUnitArc 转换成 TypeScript 版本
   *
   * @param uStart 起始单位向量
   * @param uStop 终止单位向量
   * @param dir 旋转方向（SkRotationDirection.CW 或 SkRotationDirection.CCW）
   * @param userMatrix 可选的用户矩阵
   * @param dst 用于存储结果的 SkConic 数组（长度至少 kMaxConicsForArc）
   * @returns 返回构造的 conic 数量
   */
  static buildUnitArc(
    uStart: Point,
    uStop: Point,
    dir: boolean,
    userMatrix: Matrix2D | null,
    dst:[Point,Point,Point,number][]
  ): number {
    // 计算点积和叉积
    let x = uStart.dot(uStop);
    let y = uStart.cross(uStop);
    const absY = Math.abs(y);
    const SK_Scalar1=1
    const SK_ScalarNearlyZero=SK_Scalar1 / (1 << 12)
    // 检查向量是否几乎重合（角度接近 0 或 180 度，y == 0）
    if (
      absY <= SK_ScalarNearlyZero &&
      x > 0 &&
      ((y >= 0 && !dir) ||
        (y <= 0 && dir))
    ) {
      return 0;
    }
  
    if (dir) {
      y = -y;
    }

    // 计算落在第几个象限
    let quadrant = 0;
    if (y === 0) {
      quadrant = 2; // 180度
      console.assert(
        Math.abs(x + SK_Scalar1) <= SK_ScalarNearlyZero,
        "Assertion failed: |x + 1| <= nearlyZero"
      );
    } else if (x === 0) {
      console.assert(
        Math.abs(absY - SK_Scalar1) <= SK_ScalarNearlyZero,
        "Assertion failed: |absY - 1| <= nearlyZero"
      );
      quadrant = y > 0 ? 1 : 3; // 90度 或 270度
    } else {
      if (y < 0) {
        quadrant += 2;
      }
      if ((x < 0) !== (y < 0)) {
        quadrant += 1;
      }
    }
  
    // 定义象限点数组（用于构造单位圆弧的 conic 分段）
    const quadrantPts: Point[] = [
      Point.create(1,0 ),
      Point.create(1,1 ),
      Point.create(0,1 ),
      Point.create(-1, 1),
      Point.create(-1, 0),
      Point.create(-1,-1),
      Point.create(0,-1),
      Point.create(1,-1),
    ];
    const quadrantWeight = 0.707106781;
  
    let conicCount = quadrant;
    // 使用每个完整象限（90度）构造 conic
    for (let i = 0; i < conicCount; i++) {
      // 取出连续 3 个点（注意数组循环取模）
      const pts: Point[] = [
        quadrantPts[(i * 2) % quadrantPts.length].clone(),
        quadrantPts[(i * 2 + 1) % quadrantPts.length].clone(),
        quadrantPts[(i * 2 + 2) % quadrantPts.length].clone(),
      ];
      dst[i]=[pts[0],pts[1],pts[2],quadrantWeight];
    }
  
    // 计算剩余部分（小于 90 度）的弧段
    const finalP: Point = Point.create(x,y);
    const lastQ = quadrantPts[(quadrant * 2) % quadrantPts.length]; // 已是单位向量
    const dotVal = lastQ.dot(finalP)
    console.assert(
      dotVal >= 0 && dotVal <= SK_Scalar1 + SK_ScalarNearlyZero,
      "Assertion failed: dot in [0,1]"
    );
  
    if (dotVal < 1) {
      const offCurve: Point = Point.create(lastQ.x + x,lastQ.y + y );
      // 计算半角余弦
      const cosThetaOver2 = Math.sqrt((1 + dotVal) / 2);
      // 调整 offCurve 的长度，使其为 1/cosThetaOver2
      
      offCurve.setLength(1/cosThetaOver2)
      if (!lastQ.equalsEpsilon(offCurve)) {
        dst[conicCount]=[lastQ, offCurve, finalP, cosThetaOver2];
        conicCount++;
      }
    }
  
    // 处理初始单位向量旋转和逆时针情况
    const matrix = new Matrix2D();
    // C++ 中调用 matrix.setSinCos(uStart.fY, uStart.fX)，这里用 uStart.y 和 uStart.x
    matrix.setSinCos(uStart.y, uStart.x);
    if (dir) {
      matrix.preScale(SK_Scalar1, -SK_Scalar1);
    }
    if (userMatrix) {
      matrix.premultiply(userMatrix);
    }
    // 对每个 conic 的控制点进行矩阵变换（假设每个 conic 有 3 个控制点）
    for (let i = 0; i < conicCount; i++) {
      matrix.transformPoint(dst[i][0]);
      matrix.transformPoint(dst[i][1]);
      matrix.transformPoint(dst[i][2]);

    }
  
    return conicCount;
  }
  

/**
     *如果返回0，则呼叫者应该只排队到单位，否则应该
     *忽略单个圆锥形数量并附加指定数量的圆锥体。
     */
    static build_arc_conics(oval: Rect, start: Point, stop: Point,
        dir: boolean, conics: [Point, Point,Point, number][], singlePt: Point) {
        let matrix = Matrix2D.default();

        matrix.setScale(oval.width * 0.5, oval.height * 0.5);
        matrix.postTranslate(oval.cx, oval.cy);

        let count = Path.buildUnitArc(start, stop, dir,matrix, conics);
        if (0 == count) {
            matrix.mapXY(stop.x, stop.y, singlePt);
        }
        return count;
    }

    // Return the unit vectors pointing at the start/stop points for the given start/sweep angles
    //
    static angles_to_unit_vectors(startAngle: number, sweepAngle: number,
        startV: Point, stopV: Point) {
        let startRad = startAngle * Math.PI / 180,
            stopRad = (startAngle + sweepAngle) * Math.PI / 180;

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

        /*  If the sweep angle is nearly (but less than) 360, then due to precision
        loss in radians-conversion and/or sin/cos, we may end up with coincident
        vectors, which will fool SkBuildQuadArc into doing nothing (bad) instead
        of drawing a nearly complete circle (good).
        e.g. canvas.drawArc(0, 359.99, ...)
        -vs- canvas.drawArc(0, 359.9, ...)
        We try to detect this edge case, and tweak the stop vector
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
        const dir = sweepAngle > 0 ? 0 : 1
        return {
            dir
        }
    }
    static arc_is_lone_point(oval: Rect, startAngle: number, sweepAngle: number, pt: Point) {
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
    points: Point[] = []
    verbs: PATH_VERBS[] = []
    lastMoveIndex: number = -1
    get verbLength() { return this.verbs.length }
    get pointLength() { return this.points.length }
    get isEmpty() { return this.verbLength == 0 }
    get lastPoint() { return this.points[this.pointLength - 1] }
    get lastVerb() { return this.verbs[this.verbLength - 1] }
    injectNeedMove() {
        if (this.lastMoveIndex < 0) {
            if (this.isEmpty) {
                this.moveTo(0, 0)
            } else {
                this.moveTo(this.lastPoint.x, this.lastPoint.y)
            }
        }
    }
    addRect(rect: Rect) {
        this.moveTo(rect.left, rect.top);
        this.lineTo(rect.right, rect.top);
        this.lineTo(rect.right, rect.bottom);
        this.lineTo(rect.left, rect.bottom);
        this.close();
    }
    addRoundRect(rect: Rect, radii: number[]) {
        // ul ur  lr ll  upper lower
        const radii_points = [Point.splat(radii[0]), Point.splat(radii[1]), Point.splat(radii[2]), Point.splat(radii[3])]
        const T = rect.top, B = rect.bottom, R = rect.right, L = rect.left;
        const rrectIter: Point[] = new Array(8);
        rrectIter[0] = Point.create(L + radii_points[0].x, T);
        rrectIter[1] = Point.create(R - radii_points[1].x, T);
        rrectIter[2] = Point.create(R, T + radii_points[1].y);
        rrectIter[3] = Point.create(R, B - radii_points[2].y);
        rrectIter[4] = Point.create(R - radii_points[2].x, B);
        rrectIter[5] = Point.create(L + radii_points[3].x, B);
        rrectIter[6] = Point.create(L, B - radii_points[3].y);
        rrectIter[7] = Point.create(L, T + radii_points[0].y);


        const rectIter: Point[] = new Array(4)
        rectIter[0] = Point.create(rect.left, rect.top);
        rectIter[1] = Point.create(rect.right, rect.top);
        rectIter[2] = Point.create(rect.right, rect.bottom);
        rectIter[3] = Point.create(rect.left, rect.bottom);


        this.moveTo(rrectIter[7].x, rrectIter[7].y);
        const weight = 0.707106781
        for (let i = 0, k = 7; i < 4; ++i) {
            k = k % rrectIter.length
            this.lineTo(rrectIter[k].x, rrectIter[k].y);
            k++
            k = k % rrectIter.length
            this.conicTo(rectIter[i].x, rectIter[i].y, rrectIter[k].x, rrectIter[k].y, weight);
            k++;
        }

        this.close()
    }

    addCircle(x: number, y: number, r: number) {
        this.addOval(Rect.fromXYWH(x - r, y - r, r + r, r + r));
    }
    addOval(oval: Rect) {
        let cx = oval.cx
        let cy = oval.cy
        let oval_points = [
            Point.create(cx, oval.bottom),
            Point.create(oval.left, cy),
            Point.create(cx, oval.top),
            Point.create(oval.right, cy),
        ];

        let rect_points = [
            Point.create(oval.right, oval.bottom),
            Point.create(oval.left, oval.bottom),
            Point.create(oval.left, oval.top),
            Point.create(oval.right, oval.top),
        ];

        let weight = 0.707106781;
        this.moveTo(oval_points[3].x, oval_points[3].y);
        for (let i = 0; i < 4; ++i) {
            let p1 = rect_points[i]
            let p2 = oval_points[i]
            this.conicTo(p1.x, p1.y, p2.x, p2.y, weight);
        }
        this.close();
    }
    addArc(oval:Rect,startAngle:number, sweepAngle:number){
        if (oval.isEmpty() || 0 == sweepAngle) {
            return this;
        }
      
        const  kFullCircleAngle = 360;
      
        if (sweepAngle >= kFullCircleAngle || sweepAngle <= -kFullCircleAngle) {
            // We can treat the arc as an oval if it begins at one of our legal starting positions.
            // See SkPath::addOval() docs.
            let startOver90 = startAngle / 90;
            let startOver90I = Math.round(startOver90);
            let error = startOver90 - startOver90I;
            if (Math.abs(error-0)<=1e-5) {
                // Index 1 is at startAngle == 0.
                let startIndex = (startOver90I + 1)%4;
                startIndex = startIndex < 0 ? startIndex + 4 : startIndex;
                return this.addOval(oval, sweepAngle > 0 ? false:true,startIndex);
            }
        }
        return this.arcTo(oval, startAngle, sweepAngle, true);
    }
    arcToOval(oval: Rect, startAngle: number, sweepAngle: number, forceMoveTo: boolean) {
        if (oval.width < 0 || oval.height < 0) {
            return this;
        }

        startAngle = startAngle % 360;

        if (this.isEmpty) {
            forceMoveTo = true;
        }

        let lonePt = Point.create();
        if (Path.arc_is_lone_point(oval, startAngle, sweepAngle, lonePt)) {
            return forceMoveTo ? this.moveTo(lonePt.x, lonePt.y) : this.lineTo(lonePt.x, lonePt.y);
        }

        let startV = Point.create(), stopV = Point.create();
        let { dir } = Path.angles_to_unit_vectors(startAngle, sweepAngle, startV, stopV);

        let singlePt = Point.create();

        // Adds a move-to to 'pt' if forceMoveTo is true. Otherwise a lineTo unless we're sufficiently
        // close to 'pt' currently. This prevents spurious lineTos when adding a series of contiguous
        // arcs from the same oval.
        let addPt = (pt: Point) => {
            let lastPt;
            if (forceMoveTo) {
                this.moveTo(pt.x, pt.y);
            } else if (!(lastPt = this.lastPoint) ||
                !(Math.abs(lastPt.x - pt.x) <= 1e-5) ||
                !(Math.abs(lastPt.y - pt.y) <= 1e-5)) {
                this.lineTo(pt.x, pt.y);
            }
        };

        // At this point, we know that the arc is not a lone point, but startV == stopV
        // indicates that the sweepAngle is too small such that angles_to_unit_vectors
        // cannot handle it.
        if (startV.equalsEpsilon(stopV)) {
            let endAngle = (startAngle + sweepAngle) * Math.PI / 180;
            let radiusX = oval.width / 2;
            let radiusY = oval.height / 2;
            // We do not use SkScalar[Sin|Cos]SnapToZero here. When sin(startAngle) is 0 and sweepAngle
            // is very small and radius is huge, the expected behavior here is to draw a line. But
            // calling SkScalarSinSnapToZero will make sin(endAngle) be 0 which will then draw a dot.
            singlePt.set(oval.cx + radiusX * Math.cos(endAngle),
                oval.cy + radiusY * Math.sin(endAngle));
            addPt(singlePt);
            return this;
        }

        let conics:[Point,Point,Point,number][]=new Array(5);
        let count = Path.build_arc_conics(oval, startV, stopV, !!dir, conics,singlePt);
        if (count) {
            const  pt = conics[0][0];
            addPt(pt);
            for (let i = 0; i < count; ++i) {
                this.conicTo(conics[i][1].x,conics[i][1].y, conics[i][2].x,conics[i][2].y, conics[i][3]);
            }
        } else {
            addPt(singlePt);
        }
        return this;
    }
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise: boolean = false) {

    }
    arcTo(x1: number, y1: number, x2: number, y2: number, radius: number) {
        this.injectNeedMove();

        if (radius == 0) {
            return this.lineTo(x1, y1);
        }

        // need to know our prev pt so we can construct tangent vectors
        let start = this.lastPoint

        // need double precision for these calcs.
        let befored = Point.create(x1 - start.x, y1 - start.y).normalize()

        let afterd = Point.create(x2 - x1, y2 - y1).normalize()
        let cosh = befored.dot(afterd)
        let sinh = befored.cross(afterd)

        //如果上点等于第一个点，则将其拟合化。
        //如果两个点相等，则将其置于拟态度。
        //如果第二点等于第一个点，则SINH为零。
        //在所有这些情况下，我们都无法构建一个弧线，因此我们构造了一条线到第一点。
        if (!Number.isFinite(befored) || !Number.isFinite(afterd) || Math.abs(sinh) < 1e-5) {
            return this.lineTo(x1, y1);
        }

        // safe to convert back to floats now
        let dist = Math.abs(radius * (1 - cosh) / sinh);
        let xx = x1 - dist * befored.x;
        let yy = y1 - dist * befored.y;

        let after = Point.create(afterd.x, afterd.y);
        after.setLength(dist);
        this.lineTo(xx, yy);
        let weight = Math.sqrt(0.5 + cosh * 0.5);
        return this.conicTo(x1, y1, x1 + after.x, y1 + after.y, weight);
    }
    //这将SVG弧转换为锥体。
    //部分根据kdelibs/kdecore/svgicons中的Niko代码进行了改编。
    //然后从webkit/chrome的svgpathnormalizer :: demposearctocubic（）转录
    //另请参见SVG实施注释：
    //http://www.w3.org/tr/svg/implnote.html#arcconversionendpointtocenter
    //请注意，Arcsweep Bool值是从原始实现中翻转的。
    svgArcTo(rx: number, ry: number, angle: number, arcLarge: boolean | number, arcSweep: boolean | number, x: number, y: number) {

        this.injectNeedMove();
        let srcPts = [this.lastPoint, Point.create(0, 0)]
        // If rx = 0 or ry = 0 then this arc is treated as a straight line segment (a "lineto")
        // joining the endpoints.
        // http://www.w3.org/TR/SVG/implnote.html#ArcOutOfRangeParameters
        if (!rx || !ry) {
            return this.lineTo(x, y);
        }
        // If the current point and target point for the arc are identical, it should be treated as a
        // zero length path. This ensures continuity in animations.
        srcPts[1].set(x, y);
        if (srcPts[0].equalsEpsilon(srcPts[1])) {
            return this.lineTo(x, y);
        }
        rx = Math.abs(rx);
        ry = Math.abs(ry);
        let midPointDistance = srcPts[0].clone().sub(srcPts[1]);
        midPointDistance.mulScalar(0.5);

        const angle_radian = angle * Math.PI / 180
        let pointTransform = Matrix2D.default()
        pointTransform.setRotate(-angle_radian)

        let transformedMidPoint = Point.create().copy(midPointDistance)
        pointTransform.transformPoint(transformedMidPoint)

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
        pointTransform.preRotate(-angle_radian);

        let unitPts: Point[] = [Point.create(0, 0), Point.create(0, 0)];
        pointTransform.mapPoints(unitPts, srcPts)

        let delta = unitPts[1].clone().sub(unitPts[0]);

        let d = delta.x * delta.x + delta.y * delta.y;
        let scaleFactorSquared = Math.max(1 / d - 0.25, 0);

        let scaleFactor = Math.sqrt(scaleFactorSquared);
        if ((arcSweep) != !!(arcLarge)) {  // flipped from the original implementation
            scaleFactor = -scaleFactor;
        }
        delta.mulScalar(scaleFactor);
        let centerPoint = unitPts[0].clone().add(unitPts[1]);
        centerPoint.mulScalar(0.5);
        centerPoint.translate(-delta.y, delta.y);
        unitPts[0].sub(centerPoint);
        unitPts[1].sub(centerPoint);
        let theta1 = Math.atan2(unitPts[0].y, unitPts[0].x);
        let theta2 = Math.atan2(unitPts[1].y, unitPts[1].x);
        let thetaArc = theta2 - theta1;
        if (thetaArc < 0 && !arcSweep) {  // arcSweep flipped from the original implementation
            thetaArc += Math.PI * 2;
        } else if (thetaArc > 0 && arcSweep) {  // arcSweep flipped from the original implementation
            thetaArc -= Math.PI * 2;
        }

        //非常小的角度导致我们随后的数学变得奇怪（skbug.com/9272）
        //因此，我们在这里快速检查。精确的公差金额刚刚构成。
        //pi/百万碰巧在9272中修复了该错误，但更大的价值可能是
        //还好。
        if (Math.abs(thetaArc) < (Math.PI / (1000 * 1000))) {
            return this.lineTo(x, y);
        }


        pointTransform.setRotate(angle_radian);
        pointTransform.preScale(rx, ry);

        // the arc may be slightly bigger than 1/4 circle, so allow up to 1/3rd
        let segments = Math.ceil(Math.abs(thetaArc / (2 * Math.PI / 3)));
        let thetaWidth = thetaArc / segments;
        let t = Math.tan(0.5 * thetaWidth);
        if (!Number.isFinite(t)) {
            return this;
        }
        const SK_ScalarHalf = 0.5
        let startTheta = theta1;
        let w = Math.sqrt(SK_ScalarHalf + Math.cos(thetaWidth) * SK_ScalarHalf);
        let scalar_is_integer = (scalar: number): boolean => {
            return scalar == Math.floor(scalar);
        };
        let expectIntegers = Math.abs((Math.PI / 2 - Math.abs(thetaWidth))) <= 1e-5 &&
            scalar_is_integer(rx) && scalar_is_integer(ry) &&
            scalar_is_integer(x) && scalar_is_integer(y);


        for (let i = 0; i < segments; ++i) {
            let endTheta = startTheta + thetaWidth,
                sinEndTheta = Math.abs(Math.sin(endTheta)) <= 1e-5 ? 0 : Math.sin(endTheta),
                cosEndTheta = Math.abs(Math.cos(endTheta)) <= 1e-5 ? 0 : Math.cos(endTheta);

            unitPts[1].set(cosEndTheta, sinEndTheta);
            unitPts[1].add(centerPoint);
            unitPts[0].copy(unitPts[1]);
            unitPts[0].translate(t * sinEndTheta, -t * cosEndTheta);
            let mapped: Point[] = [Point.create(), Point.create()];
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
            this.conicTo(mapped[0].x, mapped[0].y, mapped[1].x, mapped[1].y, w);
            startTheta = endTheta;
        }

        //最后一点应匹配输入点（按定义）；将其更换为
        //确保上述数学中的四舍五入错误不会引起任何问题。
        this.lastPoint.set(x, y)
        return this;
    }

    ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean) {

    }
    rect(x: number, y: number, w: number, h: number) {

    }
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/roundRect) */
    roundRect(x: number, y: number, w: number, h: number, radii?: number | DOMPointInit | (number | DOMPointInit)[]) {

    }
    moveTo(x: number, y: number) {
        if (this.lastVerb === PATH_VERBS.MOVE) {
            this.points[this.lastMoveIndex].set(x, y)
        } else {
            this.lastMoveIndex = this.pointLength
            this.points.push(Point.create(x, y))
            this.verbs.push(PATH_VERBS.MOVE)
        }
        return this;
    }
    lineTo(x: number, y: number) {
        this.injectNeedMove()
        this.points.push(Point.create(x, y))
        this.verbs.push(PATH_VERBS.LINE)
        return this;
    }
    quadTo(x1: number, y1: number, x2: number, y2: number) {
        this.injectNeedMove()
        this.points.push(Point.create(x1, y1))
        this.points.push(Point.create(x2, y2))
        this.verbs.push(PATH_VERBS.QUAD)
        return this;
    }
    cubicTo(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
        this.injectNeedMove()
        this.points.push(Point.create(x1, y1))
        this.points.push(Point.create(x2, y2))
        this.points.push(Point.create(x3, y3))
        this.verbs.push(PATH_VERBS.CUBIC)
        return this;
    }
    /**
     * 将二次有理 Bézier（conic）曲线转换为两段标准二次 Bézier 曲线
     * @param x0 控制点 P0 的 x 坐标
     * @param y0 控制点 P0 的 y 坐标
     * @param x1 控制点 P1 的 x 坐标
     * @param y1 控制点 P1 的 y 坐标
     * @param x2 控制点 P2 的 x 坐标
     * @param y2 控制点 P2 的 y 坐标
     * @param w  权重，要求在 (0,1) 内
     * @returns 返回一个数组，包含两个二次 Bézier 曲线，每个曲线由三个控制点构成
     */
    conicToQuadratic(
        x0: number, y0: number,
        x1: number, y1: number,
        x2: number, y2: number,
        w: number
    ): [Point, Point, Point][] {
        // 定义原有理曲线的三个控制点
        const P0: Point = Point.create(x0, y0);
        const P1: Point = Point.create(x1, y1);
        const P2: Point = Point.create(x2, y2);

        // 计算左侧中间控制点 Q = (P0 + w*P1) / (1+w)
        const Q: Point = Point.create(
            (x0 + w * x1) / (1 + w),
            (y0 + w * y1) / (1 + w)
        );

        // 计算右侧中间控制点 R = (P2 + w*P1) / (1+w)
        const R: Point = Point.create(
            (x2 + w * x1) / (1 + w),
            (y2 + w * y1) / (1 + w)
        );

        // 计算在 t = 0.5 处的分割点 M = (P0 + 2w*P1 + P2) / (2*(1+w))
        const M: Point = Point.create(
            (x0 + 2 * w * x1 + x2) / (2 * (1 + w)),
            (y0 + 2 * w * y1 + y2) / (2 * (1 + w))
        );

        // 返回两段标准二次 Bézier 曲线
        // 第一段：P0, Q, M
        // 第二段：M, R, P2
        return [
            [P0, Q, M],
            [M, R, P2]
        ];
    }

    conicTo(x1: number, y1: number, x2: number, y2: number, w: number) {
        if (!(w > 0)) {
            this.lineTo(x2, y2);
        } else if (!Number.isFinite(w)) {
            this.lineTo(x1, y1);
            this.lineTo(x2, y2);
        } else if (1 == w) {
            this.quadTo(x1, y1, x2, y2);
        } else {
            this.injectNeedMove()
            const lastPoint = this.lastPoint
            const quads = this.conicToQuadratic(lastPoint.x, lastPoint.y, x1, y1, x2, y2, w)
            for (let i = 0; i < quads.length; ++i) {
                this.quadTo(quads[i][1].x, quads[i][1].y, quads[i][2].x, quads[i][2].y)
            }
        }
        return this;
    }
    close() {
        if (!this.isEmpty && this.lastVerb !== PATH_VERBS.CLOSE) {
            this.verbs.push(PATH_VERBS.CLOSE)
        }
        this.lastMoveIndex = -1
        return this;
    }

    *[Symbol.iterator](): Iterator<{ type: PATH_VERBS, points: Point[], weight?: number }> {
        const points = this.points.map(p => p.clone()), verbs = this.verbs;
        let pointIndex = 0;
        for (let i = 0; i < verbs.length; ++i) {
            switch (verbs[i]) {
                case PATH_VERBS.MOVE:
                    yield { type: PATH_VERBS.MOVE, points: points.slice(pointIndex, pointIndex + 1) }
                    ++pointIndex
                    break;
                case PATH_VERBS.LINE:
                    yield { type: PATH_VERBS.LINE, points: points.slice(pointIndex, pointIndex + 1) }
                    ++pointIndex
                    break;
                case PATH_VERBS.QUAD:
                    yield { type: PATH_VERBS.QUAD, points: points.slice(pointIndex, pointIndex + 2) }
                    pointIndex += 2
                    break;
                case PATH_VERBS.CUBIC:
                    yield { type: PATH_VERBS.CUBIC, points: points.slice(pointIndex, pointIndex + 3) }
                    pointIndex += 3
                    break;
                case PATH_VERBS.CLOSE:
                    yield { type: PATH_VERBS.CLOSE, points: [] }
                    break;
            }
        }
    }
    stroke(paint: Paint): Uint8ClampedArray {

    }
    fill(paint: Paint): Uint8ClampedArray {

    }

    toPath2D() {
        const path2d: Path2D = new Path2D()
        for (let { type, points } of this) {
            switch (type) {
                case PATH_VERBS.MOVE:
                    path2d.moveTo(points[0].x, points[0].y)
                    break;
                case PATH_VERBS.LINE:
                    path2d.lineTo(points[0].x, points[0].y)
                    break;
                case PATH_VERBS.QUAD:
                    path2d.quadraticCurveTo(points[0].x, points[0].y, points[1].x, points[1].y)
                    break;
                case PATH_VERBS.CUBIC:
                    path2d.bezierCurveTo(points[0].x, points[0].y, points[1].x, points[1].y, points[2].x, points[2].y)
                    break;
                case PATH_VERBS.CLOSE:
                    path2d.closePath()
                    break;
            }
        }
        return path2d
    }
}
