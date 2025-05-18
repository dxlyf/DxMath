import { Matrix2D } from "../math/mat2d"

const PI_2 = Math.PI * 2


export enum PathVerb {
    MoveTo,
    LineTo,
    QuadTo,
    CubicTo,
    Close,
}


export type PathVerbData = {
    type: PathVerb
    p0?: Point,
    p1?: Point,
    p2?: Point
    p3?: Point
}
export enum LineJoin {
    Miter,
    Round,
    Bevel,
}
export enum LineCap {
    Butt,
    Round,
    Square,
}
export enum FillRule {
    NonZero,
    EvenOdd,
}
export enum TextAlign {
    Left,
    Center,
    Right,
}
export enum TextBaseline {
    Top,
    Middle,
    Bottom,
}
export enum TextDirection {
    LTR,
    RTL,
}
export enum PathDirection {
    CCW,
    CW,
}
export enum PaintType {
    Color,
    LinearGradient,
    RadialGradient,
    Pattern
}
export enum PatternType {
    Repeat,
    NoRepeat,
    Reflect
}
export enum PaintStyle {
    Fill,
    Stroke
}
export enum BlendMode {
    SrcOver,
    SrcIn,
    SrcOut,
    SrcAtop,
    DstOver,
    DstIn,
    DstOut,
    DstAtop,
    Xor,
    Lighter,
    Overlay,
    Darken,
    ColorDodge,
    ColorBurn,
    HardLight,
    SoftLight,
    Difference,
    Exclusion,
    Multiply,
    Hue,
    Saturation,
    Color,
    Luminosity
}


export class Point {
    static default() {
        return new Point(0, 0)
    }
    static from(x: number, y: number) {
        return new Point(x, y)
    }
    static lerp(a: Point, b: Point, t: number) {
        return this.from(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)
    }
    x: number = 0
    y: number = 0
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    set(x: number, y: number) {
        this.x = x;
        this.y = y;
        return this;
    }
    isFinite() {
        return isFinite(this.x) && isFinite(this.y);
    }
    addVector(a: Point, b: Point): Point {
        return this.set(a.x + b.x, a.y + b.y)
    }
    add(v: Point): Point {
        return this.addVector(this, v)
    }
    subVector(a: Point, b: Point): Point {
        return this.set(a.x - b.x, a.y - b.y)
    }
    sub(v: Point): Point {
        return this.subVector(this, v)
    }
    multiplyVector(a: Point, b: Point): Point {
        return this.set(a.x * b.x, a.y * b.y)
    }
    multiplyVectorScalar(a: Point, s: number) {
        return this.set(a.x * s, a.y * s)
    }
    multiplyScalar(s: number): Point {
        return this.multiplyVectorScalar(this, s)
    }
    multiply(v: Point): Point {
        return this.multiplyVector(this, v)
    }
    divideVector(a: Point, b: Point): Point {
        return this.set(a.x / b.x, a.y / b.y)
    }
    divide(v: Point): Point {
        return this.divideVector(this, v)
    }
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y)
    }
    lengthSquared() {
        return this.x * this.x + this.y * this.y
    }
    distanceTo(v: Point) {
        return Math.sqrt((this.x - v.x) * (this.x - v.x) + (this.y - v.y) * (this.y - v.y))
    }
    round() {
        return this.set(Math.round(this.x), Math.round(this.y))
    }
    floor() {
        return this.set(Math.floor(this.x), Math.floor(this.y))
    }
    ceil() {
        return this.set(Math.ceil(this.x), Math.ceil(this.y))
    }
    trunc() {
        return this.set(Math.trunc(this.x), Math.trunc(this.y))
    }
    dot(v: Point) {
        return this.x * v.x + this.y * v.y;
    }
    cross(v: Point) {
        return this.x * v.y - this.y * v.x;
    }
    min(v: Point) {
        return this.set(Math.min(this.x, v.x), Math.min(this.y, v.y))
    }
    max(v: Point) {
        return this.set(Math.max(this.x, v.x), Math.max(this.y, v.y))
    }
    normalize() {
        let l = this.length();
        if (l > 0) {
            return this.multiplyScalar(1 / l)
        } else {
            return Point.default()
        }
    }
    angle() {
        return Math.atan2(this.y, this.x)
    }
    perp() {
        return this.set(-this.y, this.x)
    }
    // 逆时针方向向量
    ccw() {
        return this.set(-this.y, this.x)
    }
    // 顺时针方向向量
    cw() {
        return this.set(this.y, -this.x)
    }
    interpolate(a: Point, b: Point, t: number) {
        return this.set(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)
    }
    setLength(length: number): boolean {
        return this.setLengthFrom(this.x, this.y, length)
    }
    setLengthFrom(x: number, y: number, length: number): boolean {
        return this.setPointLength(this, x, y, length)
    }
    setPointLength(pt: Point, x: number, y: number, length: number, orig_length?: { value: any }): boolean {
        let xx = x;
        let yy = y;
        let dmag = Math.sqrt(xx * xx + yy * yy);
        let dscale = length / dmag;
        x *= dscale;
        y *= dscale;

        // check if we're not finite, or we're zero-length
        if (!Number.isFinite(x) || !Number.isFinite(y) || (x == 0.0 && y == 0.0)) {
            pt.set(0, 0)
            return false;
        }

        let mag = 0.0;
        if (orig_length !== undefined) {
            mag = dmag;
        }

        //*pt = Point::from_xy(x, y);
        pt.set(x, y)
        if (orig_length !== undefined) {
            orig_length!.value = mag
        }

        return true
    }
    translate(x: number, y: number) {
        return this.set(this.x + x, this.y + y)
    }
    negate() {
        return this.set(-this.x, -this.y)
    }
    scale(x: number, y: number) {
        return this.set(this.x * x, this.y * y)
    }

    rotate(angle: number) {
        let c = Math.cos(angle);
        let s = Math.sin(angle);
        return this.set(c * this.x - s * this.y, s * this.x + c * this.y)
    }
    rotateDegrees(angle: number) {
        return this.rotate(angle * Math.PI / 180)
    }
    clone() {
        return new Point(this.x, this.y)
    }
    copy(v: Point) {
        return this.set(v.x, v.y)
    }
    applyTransform(a: number, b: number, c: number, d: number, tx: number, ty: number) {
        return this.set(a * this.x + c * this.y + tx, b * this.x + d * this.y + ty)
    }

}
export class Color {
    static black() {
        return new Color(0, 0, 0, 1)
    }
    static fromRGB(r: number, g: number, b: number) {
        return this.fromRGBA(r, g, b, 1)
    }
    static fromRGBA(r: number, g: number, b: number, a: number) {
        return new Color(r, g, b, a)
    }
    r: number = 0
    g: number = 0
    b: number = 0
    a: number = 1
    constructor(r: number, g: number, b: number, a: number) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
}

export class Paint {
    static default() {
        return new this()
    }
    color: Color = Color.black()
    strokeWidth: number = 1
    lineCap: LineCap = LineCap.Butt
    lineJoin: LineJoin = LineJoin.Miter
    miterLimit: number = 10
    dashOffset: number = 0
    dashArray: number[] = []
    fillRule: FillRule = FillRule.NonZero
    blend: BlendMode = BlendMode.SrcOver
    paintType: PaintType = PaintType.Color
    paintStyle: PaintStyle = PaintStyle.Stroke

    copy(p: Paint) {
        this.color = p.color
        this.strokeWidth = p.strokeWidth
        this.lineCap = p.lineCap
        this.lineJoin = p.lineJoin
        this.miterLimit = p.miterLimit
        this.dashOffset = p.dashOffset
        this.dashArray = p.dashArray
        this.fillRule = p.fillRule
        return this
    }
    clone() {
        return Paint.default().copy(this)
    }
}
/**
 * 辅助函数：将 SVG 路径字符串分词，提取命令和数字（支持科学计数法）
 */
function tokenizePath(path: string): string[] {
    const regex = /([MmLlHhVvCcSsQqTtAaZz])|(-?[\d.]+(?:e[-+]?\d+)?)/gi;
    const tokens: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(path)) !== null) {
        if (match[1]) {
            tokens.push(match[1]);
        }
        if (match[2]) {
            tokens.push(match[2]);
        }
    }
    return tokens;
}

/**
 * 辅助函数：判断一个 token 是否为数字
 */
function isNumber(token: string): boolean {
    return !isNaN(parseFloat(token));
}
function almostEqual(a: number, b: number) {
    return equalsWithinTolerance(a, b)
}
function equalsWithinTolerance(a: number, b: number, tolerance = 1e-6) {
    return Math.abs(a - b) <= tolerance;
}
/**
 * 辅助函数：判断一个 token 是否为命令字母
 */
function isCommand(token: string): boolean {
    return /^[MmLlHhVvCcSsQqTtAaZz]$/.test(token);
}
// https://www.w3.org/TR/SVG/implnote.html#ArcConversionCenterToEndpoint
export function centerToEndPoint(cx: number, cy: number, rx: number, ry: number, xAxisRotateAngle: number, startAngle: number, sweepAngle: number) {

    const { x: x1, y: y1 } = pointOnEllipse(cx, cy, rx, ry, xAxisRotateAngle, startAngle)
    const { x: x2, y: y2 } = pointOnEllipse(cx, cy, rx, ry, xAxisRotateAngle, startAngle + sweepAngle)

    const fa = Math.abs(sweepAngle) > Math.PI ? 1 : 0
    const fs = sweepAngle > 0 ? 1 : 0
    return {
        x1,
        y1,
        x2,
        y2,
        fa,
        fs,
    }

}
export function endPointToCenter(
    x1: number, y1: number, x2: number, y2: number,
    rx: number, ry: number, angle: number,
    largeArcFlag: number, sweepFlag: number) {
    // 如果rx或ry为0，则退化为直线
    if (rx === 0 || ry === 0) {
        throw '半径不能为0'
    }
    const sinPhi = Math.sin(angle);
    const cosPhi = Math.cos(angle);
    // Step 1: 转换到坐标变换后的中点坐标
    const dx = (x1 - x2) / 2;
    const dy = (y1 - y2) / 2;
    const x1p = cosPhi * dx + sinPhi * dy;
    const y1p = -sinPhi * dx + cosPhi * dy;
    // Ensure radii are large enough
    rx = Math.abs(rx)
    ry = Math.abs(ry)


    let rx_sq = rx * rx;
    let ry_sq = ry * ry;
    let x1p_sq = x1p * x1p;
    let y1p_sq = y1p * y1p;
    let lambda = x1p_sq / rx_sq + y1p_sq / ry_sq;
    if (lambda > 1) {
        lambda = Math.sqrt(lambda);
        rx *= lambda
        ry *= lambda
        rx_sq = rx * rx;
        ry_sq = ry * ry;
    }
    const sign = largeArcFlag == sweepFlag ? -1 : 1;
    const denominator = rx_sq * y1p_sq + ry_sq * x1p_sq;
    const numerator = Math.max(rx_sq * ry_sq - denominator, 0)
    const sqrtTerm = Math.sqrt(numerator / denominator);
    const cxp = sign * sqrtTerm * (rx * y1p / ry);
    const cyp = sign * sqrtTerm * (-ry * x1p / rx);
    // Step 3: 转换回原坐标系，得到圆心
    const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
    const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;
    // Step 4: 计算起始角和弧度跨度
    function angleBetween(u: number[], v: number[]): number {
        const dot = u[0] * v[0] + u[1] * v[1];
        const len = Math.sqrt((u[0] * u[0] + u[1] * u[1]) * (v[0] * v[0] + v[1] * v[1]));
        let ang = Math.acos(Math.min(Math.max(dot / len, -1), 1));
        const sign = u[0] * v[1] - u[1] * v[0] < 0 ? -1 : 1;
        return sign * ang;
    }
    const u = [(x1p - cxp) / rx, (y1p - cyp) / ry];
    const v = [(-x1p - cxp) / rx, (-y1p - cyp) / ry];
    let theta1 = angleBetween([1, 0], u);
    let deltaTheta = angleBetween(u, v);
    if (!sweepFlag && deltaTheta > 0) {
        while (deltaTheta > 0) {
            deltaTheta -= 2 * Math.PI;
        }
    } else if (sweepFlag && deltaTheta < 0) {
        while (deltaTheta < 0) {
            deltaTheta += 2 * Math.PI;
        }
    }
    return {
        cx,
        cy,
        rx,
        ry,
        theta1,
        deltaTheta
    };
}
/**
* 将 SVG 弧命令转换为三次贝塞尔曲线段
* 返回值为一个二维数组，每个元素为 [x1, y1, x2, y2, x, y]，
* 表示一个三次贝塞尔曲线段的控制点1、控制点2及终点。
*/
export function arcToCubicCurves(
    x1: number, y1: number, x2: number, y2: number,
    _rx: number, _ry: number, angle: number,
    largeArcFlag: number, sweepFlag: number
): number[][] {
    const { cx, cy, rx, ry, deltaTheta, theta1 } = endPointToCenter(x1, y1, x2, y2, _rx, _ry, angle, largeArcFlag, sweepFlag)

    // 将弧划分为若干段，每段弧跨度不超过 PI/2
    const segments = Math.ceil(Math.abs(deltaTheta / (Math.PI / 2)));
    const delta = deltaTheta / segments;
    const curves: number[][] = [];
    for (let i = 0; i < segments; i++) {
        const thetaStart = theta1 + i * delta;
        const thetaEnd = thetaStart + delta;
        curves.push(arcSegmentToCubic(
            cx, cy, rx, ry, angle,
            thetaStart, thetaEnd
        ));
    }
    return curves;
}

/**
 * 将弧段转换为三次贝塞尔曲线段。
 * 参数：
 *   cx, cy：椭圆圆心
 *   rx, ry：椭圆半径
 *   angle：椭圆旋转角（弧度）
 *   theta1：弧段起始角
 *   theta2：弧段结束角
 * 返回 [x1, y1, x2, y2, x, y] 数组，表示三次贝塞尔控制点。
 */
export function arcSegmentToCubic(
    cx: number, cy: number, rx: number, ry: number, angle: number,
    theta1: number, theta2: number
): number[] {
    const delta = theta2 - theta1;

    const alpha = 4 / 3 * Math.tan(delta / 4);//4 / 3 * (Math.sqrt(2) - 1) //
    // 起始点
    const x1 = rx * Math.cos(theta1);
    const y1 = ry * Math.sin(theta1);
    // 结束点
    const x2 = rx * Math.cos(theta2);
    const y2 = ry * Math.sin(theta2);
    // 控制点
    const cp1x = x1 - alpha * rx * Math.sin(theta1);
    const cp1y = y1 + alpha * ry * Math.cos(theta1);
    const cp2x = x2 + alpha * rx * Math.sin(theta2);
    const cp2y = y2 - alpha * ry * Math.cos(theta2);
    // 将点转换回原坐标系：先旋转再平移
    function transformX(x: number, y: number): number {
        return Math.cos(angle) * x - Math.sin(angle) * y + cx;
    }
    function transformY(x: number, y: number): number {
        return Math.sin(angle) * x + Math.cos(angle) * y + cy;
    }
    return [
        transformX(x1, y1), transformY(x1, y1),
        transformX(cp1x, cp1y), transformY(cp1x, cp1y),
        transformX(cp2x, cp2y), transformY(cp2x, cp2y),
        transformX(x2, y2), transformY(x2, y2)
    ];
}

/**
 * 辅助函数：计算椭圆上给定角度 theta（弧度）处的点，
 * 参数：中心(cx, cy)，半径(rx, ry)，旋转角(rotation)（弧度）
 */
function pointOnEllipse(cx: number, cy: number, rx: number, ry: number, rotation: number, theta: number): Point {
    const cosRot = Math.cos(rotation);
    const sinRot = Math.sin(rotation);
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);
    // cos(α-β)=cosα·cosβ+sinα·sinβ
    // cos(α+β)=cosα·cosβ-sinα·sinβ
    //sin(α±β)=sinα·cosβ±cosα·sinβ
    // tan(α+β)=(tanα+tanβ)/(1-tanα·tanβ)
    // tan(α-β)=(tanα-tanβ)/(1+tanα·tanβ)
    const x = cx + rx * cosRot * cosT - ry * sinRot * sinT;
    const y = cy + rx * sinRot * cosT + ry * cosRot * sinT;
    return Point.from(x, y);
}

/**
 * 辅助函数：将椭圆弧的一段（从 theta1 到 theta2）转换为一个三次贝塞尔曲线段
 * 返回一个长度为6的数组：[cp1x, cp1y, cp2x, cp2y, endX, endY]
 */
function ellipticalArcSegmentToCubic(
    cx: number, cy: number, rx: number, ry: number,
    rotation: number, theta1: number, theta2: number
): number[] {
    const delta = theta2 - theta1;
    const t = Math.tan(delta / 4);
    const kappa = (4 / 3) * t; // 控制点距离比例
    // 起始点
    const p0 = pointOnEllipse(cx, cy, rx, ry, rotation, theta1);
    // 结束点
    const p3 = pointOnEllipse(cx, cy, rx, ry, rotation, theta2);
    // 求出起始角处的导数向量（未旋转的）
    const sinT1 = Math.sin(theta1), cosT1 = Math.cos(theta1);
    const dx1 = -rx * sinT1, dy1 = ry * cosT1;
    // 求出结束角处的导数向量（未旋转的）
    const sinT2 = Math.sin(theta2), cosT2 = Math.cos(theta2);
    const dx2 = -rx * sinT2, dy2 = ry * cosT2;
    // 将导数向量旋转（旋转角 rotation）
    const cosRot = Math.cos(rotation), sinRot = Math.sin(rotation);
    const d1x = dx1 * cosRot - dy1 * sinRot;
    const d1y = dx1 * sinRot + dy1 * cosRot;
    const d2x = dx2 * cosRot - dy2 * sinRot;
    const d2y = dx2 * sinRot + dy2 * cosRot;
    // 控制点
    const cp1x = p0.x + kappa * d1x;
    const cp1y = p0.y + kappa * d1y;
    const cp2x = p3.x - kappa * d2x;
    const cp2y = p3.y - kappa * d2y;
    return [cp1x, cp1y, cp2x, cp2y, p3.x, p3.y];
}

// 圆锥曲线(有理曲线)转换为二次 Bézier 曲线(有理贝塞尔曲线转换)
export function conicToQuadratic(
    x0: number, y0: number,
    x1: number, y1: number,
    x2: number, y2: number,
    w: number
) {
    // 定义原有理曲线的三个控制点
    const P0 = [x0, y0];
    const P1 = [x1, y1];
    const P2 = [x2, y2];

    // 计算左侧中间控制点 Q = (P0 + w*P1) / (1+w)
    const Q = [
        (x0 + w * x1) / (1 + w),
        (y0 + w * y1) / (1 + w)
    ];

    // 计算右侧中间控制点 R = (P2 + w*P1) / (1+w)
    const R = [
        (x2 + w * x1) / (1 + w),
        (y2 + w * y1) / (1 + w)
    ];

    // 计算在 t = 0.5 处的分割点 M = (P0 + 2w*P1 + P2) / (2*(1+w))
    const M = [
        (x0 + 2 * w * x1 + x2) / (2 * (1 + w)),
        (y0 + 2 * w * y1 + y2) / (2 * (1 + w))
    ];

    // 返回两段标准二次 Bézier 曲线
    // 第一段：P0, Q, M
    // 第二段：M, R, P2
    return [
        [P0, Q, M],
        [M, R, P2]
    ]
}


function getQuadraticBounds(p0: Point, p1: Point, p2: Point) {
    let tValues = [0, 1];

    // 计算 x 方向的极值点
    const a = p1.x - p0.x;
    const b = p2.x - 2 * p1.x + p0.x;
    if (Math.abs(b) >= 1e-12) {
        const t = -a / b;
        if (t >= 0 && t <= 1) {
            tValues.push(t);
        }
    }

    // 计算 y 方向的极值点
    const aY = p1.y - p0.y;
    const bY = p2.y - 2 * p1.y + p0.y;
    if (Math.abs(bY) >= 1e-12) {
        const tY = -aY / bY;
        if (tY >= 0 && tY <= 1) {
            tValues.push(tY);
        }
    }

    // 去重
    tValues = [...new Set(tValues)];

    // 计算所有 t 对应的点
    const points = tValues.map(function (t) {
        const oneMinusT = 1 - t;
        const x = oneMinusT * oneMinusT * p0.x + 2 * t * oneMinusT * p1.x + t * t * p2.x;
        const y = oneMinusT * oneMinusT * p0.y + 2 * t * oneMinusT * p1.y + t * t * p2.y;
        return { x: x, y: y };
    });

    // 找到最小和最大的 x 和 y
    const minX = Math.min.apply(null, points.map(function (p) { return p.x; }));
    const maxX = Math.max.apply(null, points.map(function (p) { return p.x; }));
    const minY = Math.min.apply(null, points.map(function (p) { return p.y; }));
    const maxY = Math.max.apply(null, points.map(function (p) { return p.y; }));

    return { min: Point.from(minX, minY), max: Point.from(maxX, maxY) }

}
function getCubicBounds(p0: Point, p1: Point, p2: Point, p3: Point) {
    // 二次方程求解函数 Ax^2+Bx+C=0 的解，其中 A, B 和 C 是二次方程的系数。

    function solveQuadratic(a: number, b: number, c: number) {
        if (Math.abs(a) < 1e-12) {
            if (Math.abs(b) < 1e-12) {
                return [];
            } else {
                return [-c / b];
            }
        } else {
            const discriminant = b * b - 4 * a * c;
            if (discriminant < 0) {
                return [];
            } else if (Math.abs(discriminant) < 1e-12) {
                return [-b / (2 * a)];
            } else {
                const sqrtD = Math.sqrt(discriminant);
                return [(-b - sqrtD) / (2 * a), (-b + sqrtD) / (2 * a)];
            }
        }
    }

    let tValues = [0, 1];
    // p0(1-t)^3+3t(1-t)^2p1+3t^2(1-t)p2+t^3p3
    // p0(1-3t+3t^2-t^3)


    // 计算 x 方向的极值点
    const aX = 9 * (p1.x - p2.x) + 3 * (p3.x - p0.x);
    const bX = 6 * (p2.x + p0.x - 2 * p1.x);
    const cX = 3 * (p1.x - p0.x);
    const tValuesX = solveQuadratic(aX, bX, cX);
    tValues = tValues.concat(tValuesX.filter(t => t >= 0 && t <= 1));

    // 计算 y 方向的极值点
    const aY = 9 * (p1.y - p2.y) + 3 * (p3.y - p0.y);
    const bY = 6 * (p2.y + p0.y - 2 * p1.y);
    const cY = 3 * (p1.y - p0.y);
    const tValuesY = solveQuadratic(aY, bY, cY);
    tValues = tValues.concat(tValuesY.filter(t => t >= 0 && t <= 1));

    // 去重
    tValues = [...new Set(tValues)];

    // 计算所有 t 对应的点
    const points = tValues.map(function (t) {
        const oneMinusT = 1 - t;
        const x = oneMinusT * oneMinusT * oneMinusT * p0.x
            + 3 * t * oneMinusT * oneMinusT * p1.x
            + 3 * t * t * oneMinusT * p2.x
            + t * t * t * p3.x;
        const y = oneMinusT * oneMinusT * oneMinusT * p0.y
            + 3 * t * oneMinusT * oneMinusT * p1.y
            + 3 * t * t * oneMinusT * p2.y
            + t * t * t * p3.y;
        return { x: x, y: y };
    });

    // 找到最小和最大的 x 和 y
    const minX = Math.min.apply(null, points.map(function (p) { return p.x; }));
    const maxX = Math.max.apply(null, points.map(function (p) { return p.x; }));
    const minY = Math.min.apply(null, points.map(function (p) { return p.y; }));
    const maxY = Math.max.apply(null, points.map(function (p) { return p.y; }));

    return { min: Point.from(minX, minY), max: Point.from(maxX, maxY) }
}
function quadraticBezierSubdivide(p0: Point, p1: Point, p2: Point, t: number = 0.5) {
    const q0 = Point.lerp(p0, p1, t);
    const q1 = Point.lerp(p1, p2, t);
    const q01 = Point.lerp(q0, q1, t);

    return [p0.clone(), q0, q01, q1, p2.clone()]
}
// 三次贝塞尔曲线细分
export const cubicBezierSubdivide = (p0: Point, p1: Point, p2: Point, p3: Point, t: number = 0.5) => {
    const q0 = Point.lerp(p0, p1, t);
    const q1 = Point.lerp(p1, p2, t);
    const q2 = Point.lerp(p2, p3, t);
    const q01 = Point.lerp(q0, q1, t);
    const q12 = Point.lerp(q1, q2, t);
    const q0112 = Point.lerp(q01, q12, t);

    return [p0.clone(), q0, q01, q0112, q12, q2, p3.clone()];
}

// 点与线段距离
function pointOnSegmentDistance(pt: Point, a: Point, b: Point) {
    const ab = b.clone().sub(a)
    const ap = pt.clone().sub(a)
    const t = Math.max(0, Math.min(ap.dot(ab) / ab.lengthSquared(), 1))
    return ap.distanceTo(ab.multiplyScalar(t))
}

// 点到直线的距离（不带符号）
function pointOnLineDistance(pt: Point, a: Point, b: Point) {
    const ab = b.clone().sub(a)
    //  const ap = pt.clone().sub(a)
    const A = ab.y, B = -ab.x, C = ab.cross(a) //a.y*ab.x-a.x*ab.y
    return Math.abs(A * pt.x + B * pt.y + C) / Math.sqrt(A * A + B * B)
}

function pointOnLineDistance2(px: number, py: number, x0: number, y0: number, x1: number, y1: number) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    return Math.abs((px - x0) * dy - (py - y0) * dx) / Math.sqrt(dx * dx + dy * dy);
}

// 二次贝塞尔曲线扁平化转成线段
export function quadraticCurveToLines(p0: Point, p1: Point, p2: Point, tessellationTolerance: number = 0.5) {
    const points: Point[] = []
    const subdivide = (p0: Point, p1: Point, p2: Point, maxDep: number = 100) => {
        const dist = pointOnSegmentDistance(p1, p0, p2)
        if (dist < tessellationTolerance || maxDep <= 0) {
            points.push(p2)
        } else {
            const [q0, q1, q2, q3, q4] = quadraticBezierSubdivide(p0, p1, p2)
            subdivide(q0, q1, q2, maxDep - 1)
            subdivide(q2, q3, q4, maxDep - 1)
        }
    }
    subdivide(p0, p1, p2, Math.max(1, Math.floor(p0.distanceTo(p2) / tessellationTolerance)))
    return points
}

// 三次贝塞尔曲线扁平化转成线段
export function cubicCurveToLines(p0: Point, p1: Point, p2: Point, p3: Point, tessellationTolerance: number = 0.5) {
    const points: Point[] = []
    const subdivide = (p0: Point, p1: Point, p2: Point, p3: Point, maxDeep = 100) => {
        // const mid=cubicBezier(p0,p1,p2,p3,0.5)
        // const dist0=pointOnSegmentDistance(mid,p0,p3)  
        const dist1 = pointOnSegmentDistance(p1, p0, p3)
        const dist2 = pointOnSegmentDistance(p2, p0, p3)
        const dist = Math.max(dist1, dist2)
        // 计算平直度误差（使用最大弦高）
        //  const chordHeight = maxChordHeight(p0, p3, p1, p2, mid);
        if (dist < tessellationTolerance || maxDeep <= 0) {
            points.push(p3)
        } else {
            const [q0, q1, q2, q3, q4, q5, q6] = cubicBezierSubdivide(p0, p1, p2, p3)
            subdivide(q0, q1, q2, q3, maxDeep - 1)
            subdivide(q3, q4, q5, q6, maxDeep - 1)
        }
    }
    subdivide(p0, p1, p2, p3, Math.max(1, Math.floor(p0.distanceTo(p3) / tessellationTolerance)))
    return points
}


export function subdivideQuadratic(
    x0: number, y0: number,
    cx: number, cy: number,
    x1: number, y1: number,
    tolerance: number,
    lines: number[]
) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const d = Math.abs((cx - x0) * dy - (cy - y0) * dx);
    if (d * d <= tolerance * tolerance * (dx * dx + dy * dy)) {
        lines.push(x0, y0, x1, y1);
        return;
    }

    const mx0 = (x0 + cx) / 2;
    const my0 = (y0 + cy) / 2;
    const mx1 = (cx + x1) / 2;
    const my1 = (cy + y1) / 2;
    const mx = (mx0 + mx1) / 2;
    const my = (my0 + my1) / 2;

    subdivideQuadratic(x0, y0, mx0, my0, mx, my, tolerance, lines);
    subdivideQuadratic(mx, my, mx1, my1, x1, y1, tolerance, lines);
}

export function subdivideCubic(
    x0: number, y0: number,
    cx0: number, cy0: number,
    cx1: number, cy1: number,
    x1: number, y1: number,
    tolerance: number,
    lines: number[]
) {
    const dx = x1 - x0;
    const dy = y1 - y0;

    const d1 = Math.abs((cx0 - x0) * dy - (cy0 - y0) * dx);
    const d2 = Math.abs((cx1 - x0) * dy - (cy1 - y0) * dx);
    if ((d1 + d2) * (d1 + d2) <= tolerance * tolerance * (dx * dx + dy * dy)) {
        lines.push(x0, y0, x1, y1);
        return;
    }

    const mx0 = (x0 + cx0) / 2;
    const my0 = (y0 + cy0) / 2;
    const mx1 = (cx0 + cx1) / 2;
    const my1 = (cy0 + cy1) / 2;
    const mx2 = (cx1 + x1) / 2;
    const my2 = (cy1 + y1) / 2;

    const mmx0 = (mx0 + mx1) / 2;
    const mmy0 = (my0 + my1) / 2;
    const mmx1 = (mx1 + mx2) / 2;
    const mmy1 = (my1 + my2) / 2;

    const mx = (mmx0 + mmx1) / 2;
    const my = (mmy0 + mmy1) / 2;

    subdivideCubic(x0, y0, mx0, my0, mmx0, mmy0, mx, my, tolerance, lines);
    subdivideCubic(mx, my, mmx1, mmy1, mx2, my2, x1, y1, tolerance, lines);
}

function buildPathFromSvgPath(svgPath: string, path: PathBuilder) {

    const tokens = tokenizePath(svgPath);

    let index = 0;
    let currentX = 0;
    let currentY = 0;
    let lastControlPoint: Point | null = null;
    let lastCommand = "";

    while (index < tokens.length) {
        let token = tokens[index++];
        if (isCommand(token)) {
            lastCommand = token;
            let isRelative = token === token.toLowerCase();
            switch (token.toUpperCase()) {
                case "M": {
                    // M: moveTo —— 第一个坐标对是 moveTo，其余视为 lineTo
                    let x = parseFloat(tokens[index++]);
                    let y = parseFloat(tokens[index++]);
                    if (isRelative) {
                        x += currentX;
                        y += currentY;
                    }
                    path.moveTo(x, y);
                    currentX = x;
                    currentY = y;
                    // 后续如果有多组坐标，依次用 lineTo 连接
                    while (index < tokens.length && isNumber(tokens[index])) {
                        x = parseFloat(tokens[index++]);
                        y = parseFloat(tokens[index++]);
                        if (isRelative) {
                            x += currentX;
                            y += currentY;
                        }
                        path.lineTo(x, y);
                        currentX = x;
                        currentY = y;
                    }
                    break;
                }
                case "L": {
                    // L: lineTo
                    while (index < tokens.length && isNumber(tokens[index])) {
                        let x = parseFloat(tokens[index++]);
                        let y = parseFloat(tokens[index++]);
                        if (isRelative) {
                            x += currentX;
                            y += currentY;
                        }
                        path.lineTo(x, y);
                        currentX = x;
                        currentY = y;
                    }
                    break;
                }
                case "H": {
                    // H: horizontal line
                    while (index < tokens.length && isNumber(tokens[index])) {
                        let x = parseFloat(tokens[index++]);
                        if (isRelative) {
                            x += currentX;
                        }
                        path.lineTo(x, currentY);
                        currentX = x;
                    }
                    break;
                }
                case "V": {
                    // V: vertical line
                    while (index < tokens.length && isNumber(tokens[index])) {
                        let y = parseFloat(tokens[index++]);
                        if (isRelative) {
                            y += currentY;
                        }
                        path.lineTo(currentX, y);
                        currentY = y;
                    }
                    break;
                }
                case "C": {
                    // C: cubic bezier, 格式：x1,y1 x2,y2 x,y —— 每三个坐标对
                    while (index < tokens.length && isNumber(tokens[index])) {
                        let x1 = parseFloat(tokens[index++]);
                        let y1 = parseFloat(tokens[index++]);
                        let x2 = parseFloat(tokens[index++]);
                        let y2 = parseFloat(tokens[index++]);
                        let x = parseFloat(tokens[index++]);
                        let y = parseFloat(tokens[index++]);
                        if (isRelative) {
                            x1 += currentX; y1 += currentY;
                            x2 += currentX; y2 += currentY;
                            x += currentX; y += currentY;
                        }
                        path.bezierCurveTo(x1, y1, x2, y2, x, y);
                        lastControlPoint = Point.from(x2, y2);
                        currentX = x;
                        currentY = y;
                    }
                    break;
                }
                case "S": {
                    // S: smooth cubic bezier —— 若前一个命令为 C/S，则反射上一个控制点，否则当前点作为控制点
                    while (index < tokens.length && isNumber(tokens[index])) {
                        let x2 = parseFloat(tokens[index++]);
                        let y2 = parseFloat(tokens[index++]);
                        let x = parseFloat(tokens[index++]);
                        let y = parseFloat(tokens[index++]);
                        let x1: number, y1: number;
                        if (lastCommand.toUpperCase() === "C" || lastCommand.toUpperCase() === "S") {
                            x1 = 2 * currentX - (lastControlPoint ? lastControlPoint.x : currentX);
                            y1 = 2 * currentY - (lastControlPoint ? lastControlPoint.y : currentY);
                        } else {
                            x1 = currentX;
                            y1 = currentY;
                        }
                        if (isRelative) {
                            x2 += currentX; y2 += currentY;
                            x += currentX; y += currentY;
                        }
                        path.bezierCurveTo(x1, y1, x2, y2, x, y);
                        lastControlPoint = Point.from(x2, y2);
                        currentX = x;
                        currentY = y;
                    }
                    break;
                }
                case "Q": {
                    // Q: quadratic bezier —— 格式：x1,y1 x,y
                    while (index < tokens.length && isNumber(tokens[index])) {
                        let x1 = parseFloat(tokens[index++]);
                        let y1 = parseFloat(tokens[index++]);
                        let x = parseFloat(tokens[index++]);
                        let y = parseFloat(tokens[index++]);
                        if (isRelative) {
                            x1 += currentX; y1 += currentY;
                            x += currentX; y += currentY;
                        }
                        path.quadraticCurveTo(x1, y1, x, y);
                        lastControlPoint = Point.from(x1, y1);
                        currentX = x;
                        currentY = y;
                    }
                    break;
                }
                case "T": {
                    // T: smooth quadratic bezier —— 反射上一个控制点
                    while (index < tokens.length && isNumber(tokens[index])) {
                        let x1: number, y1: number;
                        if (lastCommand.toUpperCase() === "Q" || lastCommand.toUpperCase() === "T") {
                            x1 = 2 * currentX - (lastControlPoint ? lastControlPoint.x : currentX);
                            y1 = 2 * currentY - (lastControlPoint ? lastControlPoint.y : currentY);
                        } else {
                            x1 = currentX;
                            y1 = currentY;
                        }
                        let x = parseFloat(tokens[index++]);
                        let y = parseFloat(tokens[index++]);
                        if (isRelative) {
                            x += currentX;
                            y += currentY;
                        }
                        path.quadraticCurveTo(x1, y1, x, y);
                        lastControlPoint = Point.from(x1, y1);
                        currentX = x;
                        currentY = y;
                    }
                    break;
                }

                case "A": // 或 "a"
                    {

                        // 判断是否为相对命令
                        const isRel = (token === token.toLowerCase());
                        while (index < tokens.length && isNumber(tokens[index])) {
                            const rx = parseFloat(tokens[index++]);
                            const ry = parseFloat(tokens[index++]);
                            // xAxisRotation 单位：角度，转换为弧度
                            const xAxisRotation = parseFloat(tokens[index++]) * Math.PI / 180;
                            const largeArcFlag = parseFloat(tokens[index++]);
                            const sweepFlag = parseFloat(tokens[index++]);
                            let x = parseFloat(tokens[index++]);
                            let y = parseFloat(tokens[index++]);
                            if (isRel) {
                                x += currentX;
                                y += currentY;
                            }
                            path.ellipseArc(currentX, currentY, x, y, rx, ry, xAxisRotation, largeArcFlag, 0)
                            currentX = path.lastPoint.x
                            currentY = path.lastPoint.y
                            // // 转换 A 命令为若干个 cubic 贝塞尔曲线段
                            // let curves = arcToCubicCurves(currentX, currentY, x, y, rx, ry, xAxisRotation, largeArcFlag, sweepFlag);

                            // for (const curve of curves) {

                            //     // curve 数组顺序为 [cp1x, cp1y, cp2x, cp2y, x, y]
                            //     //  path.quadraticCurveTo(curve[2],curve[3],curve[4], curve[5])
                            //     // 转三
                            //     path.bezierCurveTo(curve[2], curve[3], curve[4], curve[5], curve[6], curve[7])

                            //     // path.bezierCurveTo(curve[0],curve[1],curve[2], curve[3], curve[4], curve[5]);
                            //     currentX = curve[6];
                            //     currentY = curve[7];
                            // }
                        }
                    }
                    break;
                case "Z": {
                    path.closePath();
                    // 关闭路径后，currentX,currentY 设置为上一次 moveTo 的点
                    if (path.lastMoveIndex >= 0) {
                        currentX = path.lastMovePoint.x;
                        currentY = path.lastMovePoint.y;
                    }
                    break;
                }
            }
        }
    }
}

type PathVisitor = {
    moveTo: (record: { type: PathVerb, p0: Point, index: number }) => void
    lineTo: (record: { type: PathVerb, p0: Point, index: number }) => void
    quadraticCurveTo: (record: { type: PathVerb, p0: Point, p1: Point, p2: Point, index: number }) => void
    bezierCurveTo: (record: { type: PathVerb, p0: Point, p1: Point, p2: Point, p3: Point, index: number }) => void
    closePath: (record: { type: PathVerb, lastMovePoint: Point, index: number }) => void
}
export const PtsInVerb = (v: PathVerb) => {
    switch (v) {
        case PathVerb.MoveTo: return 1
        case PathVerb.LineTo: return 1
        case PathVerb.QuadTo: return 2
        case PathVerb.CubicTo: return 3
        default: return 0
    }
}
export class PathBuilder {
    static fromSvgPath(svgPath: string) {
        const path = new PathBuilder()
        buildPathFromSvgPath(svgPath, path)
        return path

    }
    static default() {
        return new PathBuilder()
    }
    points: Point[] = []
    verbs: PathVerb[] = []
    lastMoveIndex: number = -1
    needMoveVerb: boolean = true
    get lastPoint() {
        return this.points[this.points.length - 1]
    }
    get lastVerb() {
        return this.verbs[this.verbs.length - 1]
    }
    get isEmpty() {
        return this.verbs.length == 0
    }
    get lastMovePoint() {
        return this.points[this.lastMoveIndex]
    }
    get length() {
        return this.verbs.length
    }
    get isClosedPath() {
        return this.verbs.some(d => d == PathVerb.Close)

    }
    reset() {
        this.points.length = 0
        this.verbs.length = 0
        this.lastMoveIndex = -1
        this.needMoveVerb = true
    }
    _copy(path: PathBuilder) {
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
    copy(path: PathBuilder) {
        this.reset()
        this._copy(path)

        return this
    }
    copy2(path: PathBuilder) {
        this.points = path.points.map(d => d.clone())
        this.verbs = path.verbs.slice()
        this.lastMoveIndex = path.lastMoveIndex
        this.needMoveVerb = path.needMoveVerb
        return this
    }
    clone() {
        return PathBuilder.default().copy(this)
    }
    toReversePath(){
        return PathBuilder.default().addReversePath(this)
    }
    addPath(path: PathBuilder, matrix?: number[]) {
        path = path.clone()
        if (matrix) {
            path.transform(matrix)
        }
        this.lastMoveIndex = path.lastMoveIndex + this.points.length
        this.needMoveVerb = path.needMoveVerb
        this.points = this.points.concat(path.points.map(d => d.clone()))
        this.verbs = this.verbs.concat(path.verbs)
        return path
    }
    addReversePath(path: PathBuilder) {

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
        return this

    }
    offset(x: number, y: number) {
        for (let i = 0; i < this.points.length; i++) {
            this.points[i].translate(x, y)
        }
    }
    transform(matrix: number[]) {
        for (let i = 0; i < this.points.length; i++) {
            this.points[i].applyTransform(matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5])
        }
        return this
    }

    ensureMove() {
        if (this.needMoveVerb) {
            if (this.isEmpty) {
                this.moveTo(0, 0)
            } else {
                this.moveTo(this.lastPoint)
            }
        }
        return this
    }
    moveTo(p: Point): this
    moveTo(x: number, y: number): this
    moveTo(...args: any[]) {
        let x: number, y: number
        if (args.length == 1) {
            x = args[0].x
            y = args[0].y

        } else {
            x = args[0]
            y = args[1]
        }
        if (this.lastVerb === PathVerb.MoveTo) {
            this.lastMovePoint.set(x, y)
        } else {
            this.lastMoveIndex = this.points.length
            this.points.push(Point.from(x, y))
            this.verbs.push(PathVerb.MoveTo)
        }
        this.needMoveVerb = false
        return this
    }
    lineTo(p: Point): this
    lineTo(x: number, y: number): this
    lineTo(...args: any[]) {
        let x: number, y: number
        if (args.length == 1) {
            x = args[0].x
            y = args[0].y

        } else {
            x = args[0]
            y = args[1]
        }
        this.ensureMove()
        this.points.push(Point.from(x, y))
        this.verbs.push(PathVerb.LineTo)
        Path2D.prototype.bezierCurveTo
        return this
    }
    quadraticCurveTo(p1: Point, p2: Point): this
    quadraticCurveTo(x1: number, y1: number, x2: number, y2: number): this
    quadraticCurveTo(...args: any[]) {
        let x1: number, y1: number, x2: number, y2: number
        if (args.length == 2) {
            x1 = args[0].x
            y1 = args[0].y
            x2 = args[1].x
            y2 = args[1].y
        } else {
            x1 = args[0]
            y1 = args[1]
            x2 = args[2]
            y2 = args[3]
        }
        this.ensureMove()
        this.points.push(Point.from(x1, y1), Point.from(x2, y2))
        this.verbs.push(PathVerb.QuadTo)
        return this
    }
    bezierCurveTo(p1: Point, p2: Point, p3: Point): this
    bezierCurveTo(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): this
    bezierCurveTo(...args: any[]) {
        let x1: number, y1: number, x2: number, y2: number, x3: number, y3: number
        if (args.length == 3) {
            x1 = args[0].x
            y1 = args[0].y
            x2 = args[1].x
            y2 = args[1].y
            x3 = args[2].x
            y3 = args[2].y
        } else {
            x1 = args[0]
            y1 = args[1]
            x2 = args[2]
            y2 = args[3]
            x3 = args[4]
            y3 = args[5]
        }
        this.ensureMove()
        this.points.push(Point.from(x1, y1), Point.from(x2, y2), Point.from(x3, y3))
        this.verbs.push(PathVerb.CubicTo)
        return this
    }
    closePath() {
        if (!this.isEmpty) {
            if (this.lastVerb != PathVerb.Close) {
                this.verbs.push(PathVerb.Close)
            }
            this.needMoveVerb = true
        }
        return this
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
            const p0 = Point.from(Math.cos(startTheta), Math.sin(startTheta))
            const p3 = Point.from(Math.cos(endTheta), Math.sin(endTheta))

            // const p1=p0.clone().add(p0.clone().rotateCCW().multiplyScalar(k))
            // const p2=p3.clone().add(p3.clone().rotateCW().multiplyScalar(k))
            const p1 = p0.clone().add(p0.clone().rotate(Math.PI / 2).multiplyScalar(k))
            const p2 = p3.clone().add(p3.clone().rotate(-Math.PI / 2).multiplyScalar(k))


            p0.scale(rx, ry).rotate(xAxisRotation).translate(cx, cy)
            p1.scale(rx, ry).rotate(xAxisRotation).translate(cx, cy)
            p2.scale(rx, ry).rotate(xAxisRotation).translate(cx, cy)
            p3.scale(rx, ry).rotate(xAxisRotation).translate(cx, cy)



            // p0.applyMatrix2D(pointTransform).translate(cx,cy)                   
            // p1.applyMatrix2D(pointTransform).translate(cx,cy)
            // p2.applyMatrix2D(pointTransform).translate(cx,cy)
            // p3.applyMatrix2D(pointTransform).translate(cx,cy)
            this.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y)
            startTheta = endTheta
        }

        return this
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
    /**
    * 在当前路径中添加一段椭圆弧
    * @param cx 椭圆中心 x 坐标
    * @param cy 椭圆中心 y 坐标
    * @param rx 椭圆 x 方向半径
    * @param ry 椭圆 y 方向半径
    * @param rotation 椭圆旋转角（单位：弧度）
    * @param startAngle 起始角（弧度）
    * @param endAngle 结束角（弧度）
    * @param anticlockwise 是否逆时针（默认为 false，即顺时针绘制）
    */
    ellipse(
        cx: number, cy: number, rx: number, ry: number,
        rotation: number, startAngle: number, endAngle: number,
        anticlockwise: boolean = false
    ): this {

        // 调整角度：确保角度跨度正确
        let deltaAngle = endAngle - startAngle;
        if (!anticlockwise && deltaAngle < 0) {
            deltaAngle = (deltaAngle % PI_2) + PI_2
        } else if (anticlockwise && deltaAngle > 0) {
            deltaAngle = (deltaAngle % PI_2) - PI_2;
        }
        // 如果当前路径为空，先 moveTo 起始点
        const startPt = pointOnEllipse(cx, cy, rx, ry, rotation, startAngle);
        if (this.isEmpty) {
            this.moveTo(startPt);
        } else {
            this.lineTo(startPt);
        }

        // 分段，每段角度不超过 π/2
        const segments = Math.ceil(Math.abs(deltaAngle) / (Math.PI / 2));
        const segAngle = deltaAngle / segments;
        for (let i = 0; i < segments; i++) {
            const theta1 = startAngle + i * segAngle;
            const theta2 = theta1 + segAngle;
            const bezier = ellipticalArcSegmentToCubic(cx, cy, rx, ry, rotation, theta1, theta2);

            this.bezierCurveTo(bezier[0], bezier[1], bezier[2], bezier[3], bezier[4], bezier[5]);
        }
        if (Math.abs(deltaAngle - PI_2) <= 1e-6) {
            this.closePath()
        }
        return this;
    }
    ellipse2(
        cx: number, cy: number, rx: number, ry: number,
        rotation: number, startAngle: number, endAngle: number,
        anticlockwise: boolean = false
    ) {

        // var tao = 2 * Math.PI;
        // var newStartAngle = startAngle % tao;
        // if (newStartAngle < 0) {
        //   newStartAngle += tao;
        // }
        // var delta = newStartAngle - startAngle;
        // startAngle = newStartAngle;
        // endAngle += delta;

        // // Based off of AdjustEndAngle in Chrome.
        // if (!anticlockwise && (endAngle - startAngle) >= tao) {
        //   // Draw complete ellipse
        //   endAngle = startAngle + tao;
        // } else if (anticlockwise && (startAngle - endAngle) >= tao) {
        //   // Draw complete ellipse
        //   endAngle = startAngle - tao;
        // } else if (!anticlockwise && startAngle > endAngle) {
        //   endAngle = startAngle + (tao - (startAngle - endAngle) % tao);
        // } else if (anticlockwise && startAngle < endAngle) {
        //   endAngle = startAngle - (tao - (endAngle - startAngle) % tao);
        // }

        let deltaTheta = endAngle - startAngle;
        if (!anticlockwise && deltaTheta < 0) {
            deltaTheta = (deltaTheta % PI_2) + PI_2
        } else if (anticlockwise && deltaTheta > 0) {
            deltaTheta = (deltaTheta % PI_2) - PI_2;
        }
        if (Math.abs(deltaTheta) <= Math.PI * 2) {
            const halfSweep = deltaTheta / 2
            this.arcToOval(cx, cy, rx, ry, rotation, startAngle, halfSweep, true)
            this.arcToOval(cx, cy, rx, ry, rotation, startAngle + halfSweep, halfSweep, false)
        } else {
            this.arcToOval(cx, cy, rx, ry, rotation, startAngle, deltaTheta, true)
        }

        return this
    }
    arc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number,
        anticlockwise: boolean = false) {
        this.ellipse(cx, cy, radius, radius, 0, startAngle, endAngle, anticlockwise)
        return this;
    }

    rect(x: number, y: number, w: number, h: number) {
        this.moveTo(x, y)
        this.lineTo(x + w, y)
        this.lineTo(x + w, y + h)
        this.lineTo(x, y + h)
        this.closePath()
        return this
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
    /**
     * 添加一个完整的椭圆（闭合路径）。
     * 参数与 arcToOval 类似，但只需指定椭圆的外接矩形或中心与半径。
     * @param x 左上角 x 坐标
     * @param y 左上角 y 坐标
     * @param width 宽度
     * @param height 高度
     */
    addOval(x: number, y: number, width: number, height: number): this {
        const rx = width / 2;
        const ry = height / 2;
        const cx = x + rx;
        const cy = y + ry;
        // 绘制完整椭圆：从 0 到 2π
        this.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI, false);
        this.closePath();
        return this;
    }
    arcToOval(x: number, y: number, rx: number, ry: number, rotation: number, startAngle: number, deltaAngle: number, forceMoveTo: boolean) {

        const { x1, y1, x2, y2, fa, fs } = centerToEndPoint(
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
        this.ellipseArc(x1, y1, x2, y2, rx, ry, rotation, fa, fs)
    }
    arcTo(x1: number, y1: number, x2: number, y2: number, radius: number) {
        // need to know our prev pt so we can construct tangent vectors
        let start = this.lastPoint.clone();
        let p1 = Point.from(x1, y1)
        let p2 = Point.from(x2, y2)

        // need double precision for these calcs.
        
        // 计算上个点与x1,y1,x2,y2 之间的方向
        // start>p1的方向
        let befored = Point.from(p1.x - start.x, p1.y - start.y).normalize()
        // p1>p2的方向
        let afterd = Point.from(p2.x - p1.x, p2.y - p1.y).normalize()
        let cosh = befored.dot(afterd) // 两个的cos夹角
        let sinh = befored.cross(afterd) // 两个的sin夹角
        //如果上点等于第一个点，则将其拟合化。
        //如果两个点相等，则将其置于拟态度。
        //如果第二点等于第一个点，则SINH为零。
        //在所有这些情况下，我们都无法构建一个弧线，因此我们构造了一条线到第一点。
        if (!befored.isFinite() || !afterd.isFinite() || Math.abs(sinh) <= 1e-6) {
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
        let end = p1.clone().add(after)
        return this.conicTo(p1.x, p1.y, end.x, end.y, weight);
    }

    arcTo2(x1: number, y1: number, x2: number, y2: number, radius: number) {

        // Current path point
        let p0 = this.lastPoint.clone()
        let p1 = Point.from(x1, y1)
        let p2 = Point.from(x2, y2)

        if ((p1.x == p0.x && p1.y == p0.y)
            || (p1.x == p2.x && p1.y == p2.y)
            || radius == 0) {
            this.lineTo(p1.x, p1.y);
            return this;
        }

        let p1p0 = Point.from((p0.x - p1.x), (p0.y - p1.y));
        let p1p2 = Point.from((p2.x - p1.x), (p2.y - p1.y));
        let p1p0_length = Math.sqrt(p1p0.x * p1p0.x + p1p0.y * p1p0.y);
        let p1p2_length = Math.sqrt(p1p2.x * p1p2.x + p1p2.y * p1p2.y);

        let cos_phi = (p1p0.x * p1p2.x + p1p0.y * p1p2.y) / (p1p0_length * p1p2_length);
        // all points on a line logic
        if (-1 == cos_phi) {
            this.lineTo(p1.x, p1.y);
            return this;
        }

        if (1 == cos_phi) {
            // add infinite far away point
            let max_length = 65535;
            let factor_max = max_length / p1p0_length;
            let ep = Point.from((p0.x + factor_max * p1p0.x), (p0.y + factor_max * p1p0.y));
            this.lineTo(ep.x, ep.y);
            return this
        }

        let tangent = radius / Math.tan(Math.acos(cos_phi) / 2);
        let factor_p1p0 = tangent / p1p0_length;
        let t_p1p0 = Point.from((p1.x + factor_p1p0 * p1p0.x), (p1.y + factor_p1p0 * p1p0.y));

        let orth_p1p0 = Point.from(p1p0.y, -p1p0.x);
        let orth_p1p0_length = Math.sqrt(orth_p1p0.x * orth_p1p0.x + orth_p1p0.y * orth_p1p0.y);
        let factor_ra = radius / orth_p1p0_length;

        let cos_alpha = (orth_p1p0.x * p1p2.x + orth_p1p0.y * p1p2.y) / (orth_p1p0_length * p1p2_length);
        if (cos_alpha < 0)
            orth_p1p0.set(-orth_p1p0.x, -orth_p1p0.y);

        let p = Point.from((t_p1p0.x + factor_ra * orth_p1p0.x), (t_p1p0.y + factor_ra * orth_p1p0.y));

        orth_p1p0.set(-orth_p1p0.x, -orth_p1p0.y);
        let sa = Math.acos(orth_p1p0.x / orth_p1p0_length);
        if (orth_p1p0.y < 0)
            sa = 2 * Math.PI - sa;

        let anticlockwise = false;

        let factor_p1p2 = tangent / p1p2_length;
        let t_p1p2 = Point.from((p1.x + factor_p1p2 * p1p2.x), (p1.y + factor_p1p2 * p1p2.y));
        let orth_p1p2 = Point.from((t_p1p2.x - p.x), (t_p1p2.y - p.y));
        let orth_p1p2_length = Math.sqrt(orth_p1p2.x * orth_p1p2.x + orth_p1p2.y * orth_p1p2.y);
        let ea = Math.acos(orth_p1p2.x / orth_p1p2_length);

        if (orth_p1p2.y < 0) {
            ea = 2 * Math.PI - ea;
        }
        if ((sa > ea) && ((sa - ea) < Math.PI)) {
            anticlockwise = true;
        }
        if ((sa < ea) && ((ea - sa) > Math.PI)) {
            anticlockwise = true;
        }

        this.lineTo(t_p1p0.x, t_p1p0.y);

        if (anticlockwise && Math.PI * 2 != radius) {
            this.arc(p.x, p.y, radius, sa, ea, true);
        } else {
            this.arc(p.x, p.y, radius, sa, ea, false);
        }
    }

    arcTo3(vertex_x: number, vertex_y: number, x: number, y: number, radius: number) {
        if (radius < 0) {
            return this;
        }
        if (this.isEmpty) {
            this.moveTo(vertex_x, vertex_y);
        }
        let point_1 = this.lastPoint.clone()
        let vertex = Point.from(vertex_x, vertex_y);
        let point_2 = Point.from(x, y);
        let edge_1 = point_1.clone().sub(vertex).normalize()
        let edge_2 = point_2.clone().sub(vertex).normalize()
        let sine = Math.abs(edge_1.clone().perp().dot(edge_2));
        const epsilon = 1e-6;
        if (sine < epsilon) {
            this.lineTo(vertex_x, vertex_y);
            return this;
        }

        let offset = edge_1.clone().add(edge_2).multiplyScalar(radius / sine);
        let center = vertex.clone().add(offset);
        let angle_1 = edge_1.clone().multiplyScalar(offset.dot(edge_1)).sub(offset).angle()
        //direction( dot( offset, edge_1 ) * edge_1 - offset );
        let angle_2 = edge_2.clone().multiplyScalar(offset.dot(edge_2)).sub(offset).angle()
        // direction( dot( offset, edge_2 ) * edge_2 - offset );
        let reverse = Math.floor((angle_2 - angle_1) / Math.PI) & 1;

        this.arc(center.x, center.y, radius, angle_1, angle_2, Boolean(reverse));

    }
    arcTo4(x1: number, y1: number, x2: number, y2: number, radius: number) {
        if (radius < 0) {
            throw new DOMException("radii cannot be negative", "IndexSizeError");
        }
        this.ensureMove()
        let p0 = this.lastPoint.clone()
        let p1 = Point.from(x1, y1)
        let p2 = Point.from(x2, y2)
        const d1 = p0.clone().sub(p1).normalize()
        const d2 = p2.clone().sub(p1).normalize()
        // 如果共线就画直线
        const cos = d1.dot(d2) //
        const theta = Math.acos(cos) // 在0-Math.PI之间

        // const theta=Math.atan2(d2.cross(d1),d1.dot(d2))
        const cross = d1.clone().negate().cross(d2)
        if (Math.abs(cross) <= 1e-6) {
            this.lineTo(x1, y1)
            return this
        }

        // 计算圆心点
        //   let n0 = d1.clone().add(d2).normalize()
        //  let len = radius / Math.sin(theta / 2)

        //const center=p1.clone().add(n0.clone().multiplyScalar(len))
        // 计算起点和终点 
        let tanget_len = radius / Math.tan(theta / 2)
        let t0 = p1.clone().add(d1.clone().multiplyScalar(tanget_len))
        let t1 = p1.clone().add(d2.clone().multiplyScalar(tanget_len))
        let sweepFag = cross > 0 ? 1 : 0

        this.lineTo(t0.x, t0.y)

        this.ellipseArc(t0.x, t0.y, t1.x, t1.y, radius, radius, 0, 0, sweepFag)

    }
    arcTo5(x1: number, y1: number, x2: number, y2: number, radius: number) {

        if (radius < 0) {
            throw new DOMException("radii cannot be negative", "IndexSizeError");
        }
        this.ensureMove()
        const x0 = this.lastPoint.x;
        const y0 = this.lastPoint.y;

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

            this.ellipseArc(this.lastPoint.x, this.lastPoint.y, endX, endY, radius, radius, 0, 0, sweep)
        }
    }


    conicTo(x1: number, y1: number, x: number, y: number, weight: number): this {
        if (!(weight > 0.0)) {
            this.lineTo(x, y);
        } else if (!Number.isFinite(weight)) {
            this.lineTo(x1, y1);
            this.lineTo(x, y);
        } else if (weight == 1.0) {
            this.quadraticCurveTo(x1, y1, x, y);
        } else {
            this.ensureMove()
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
    getBounds() {
        const min = Point.from(Infinity, Infinity), max = Point.from(-Infinity, -Infinity)
        this.points.forEach(p => {
            min.min(p)
            max.max(p)
        })
        return { min, max }
    }
    computeTightBounds() {
        const min = Point.from(Infinity, Infinity), max = Point.from(-Infinity, -Infinity)

        for (let d of this) {
            switch (d.type) {
                case PathVerb.MoveTo:
                    min.min(d.p0!)
                    max.max(d.p0!)
                    break;
                case PathVerb.LineTo:
                    min.min(d.p0!)
                    max.max(d.p0!)
                    break;
                case PathVerb.QuadTo:
                    {
                        const { min: _min, max: _max } = getQuadraticBounds(d.p0!, d.p1!, d.p2!)
                        min.min(_min)
                        max.max(_max)
                    }
                    break
                case PathVerb.CubicTo:
                    {
                        const { min: _min, max: _max } = getCubicBounds(d.p0!, d.p1!, d.p2!, d.p3!)
                        min.min(_min)
                        max.max(_max)
                    }
                    break
            }
        }
        return { min, max }

    }
    isPointInPath(x: number, y: number, fillRule: FillRule) {
        const bounds = this.getBounds()
        if (x < bounds.min.x || x > bounds.max.x || y < bounds.min.y || y > bounds.max.y) {
            return false
        }
        let w = 0, lastPoint = Point.default()
        this.visit({
            moveTo: (d) => {
                lastPoint.copy(d.p0!)
            },
            lineTo: (d) => {

            },
            quadraticCurveTo: (d) => { },
            bezierCurveTo: (d) => { },
            closePath: (d) => { }
        })
    }
    fatten() {
        let path = PathBuilder.default()

        this.visit({
            moveTo: (d) => {
                path.moveTo(d.p0!.x, d.p0!.y)
            },
            lineTo: (d) => {
                path.lineTo(d.p0!.x, d.p0!.y)
            },
            quadraticCurveTo: (d) => {
                const points = quadraticCurveToLines(d.p0!, d.p1!, d.p2!, 0.1)
                points.forEach(p => path.lineTo(p.x, p.y))
            },
            bezierCurveTo: (d) => {
                const points = cubicCurveToLines(d.p0!, d.p1!, d.p2!, d.p3!, 0.1)
                points.forEach(p => path.lineTo(p.x, p.y))
            },
            closePath: () => {
                path.closePath()
            }
        })
        return path
    }
 
    visit(_visitor: Partial<PathVisitor>) {
        const visitor: PathVisitor = Object.assign({
            moveTo: () => { },
            lineTo: () => { },
            quadraticCurveTo: () => { },
            bezierCurveTo: () => { },
            closePath: () => { }
        }, _visitor)
        let index = 0
        for (let d of this) {

            switch (d.type) {
                case PathVerb.MoveTo:
                    visitor.moveTo({ type: d.type, p0: d.p0!, index });
                    break
                case PathVerb.LineTo:
                    visitor.lineTo({ type: d.type, p0: d.p0!, index });
                    break
                case PathVerb.QuadTo:
                    visitor.quadraticCurveTo({ type: d.type, p0: d.p0!, p1: d.p1!, p2: d.p2!, index });
                    break
                case PathVerb.CubicTo:
                    visitor.bezierCurveTo({ type: d.type, p0: d.p0!, p1: d.p1!, p2: d.p2!, p3: d.p3!, index });
                    break
                case PathVerb.Close:
                    visitor.closePath({ type: d.type, lastMovePoint: d.p0!, index })
                    break
            }
            index++

        }
    }
    *[Symbol.iterator](): Iterator<PathVerbData> {
        const points = this.points.map(p => p.clone())
        const verbs = this.verbs
        let k = 0, lastMovePoint: Point | null = null
        for (let i = 0; i < verbs.length; i++) {
            const verb = verbs[i]
            switch (verb) {
                case PathVerb.MoveTo:
                    k += 1
                    lastMovePoint = points[k - 1]
                    yield { type: verb, p0: points[k - 1] }
                    break;
                case PathVerb.LineTo:
                    k += 1
                    yield { type: verb, p0: points[k - 1] }
                    break;
                case PathVerb.QuadTo:
                    k += 2
                    yield { type: verb, p0: points[k - 3], p1: points[k - 2], p2: points[k - 1] }
                    break;
                case PathVerb.CubicTo:
                    k += 3
                    yield { type: verb, p0: points[k - 4], p1: points[k - 3], p2: points[k - 2], p3: points[k - 1] }
                    break;
                case PathVerb.Close:
                    yield { type: verb, p0: lastMovePoint?.clone() }
                    break;
            }
        }
    }
    toCanvas(ctx: CanvasRenderingContext2D | Path2D): void {

        for (const { type, p0, p1, p2, p3 } of this) {
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
    toPath2D(path: Path2D = new Path2D()): Path2D {
        this.toCanvas(path)
        return path
    }
    toPolygons(closed = false) {
        const polygons: Point[][] = []
        let polygon: Point[] | null = null

        this.visit({
            moveTo: (d) => {
                if (polygon) {
                    polygons.push(polygon)
                }
                polygon = []
                polygon.push(d.p0)
            },
            lineTo: (d) => {
                polygon!.push(d.p0)
            },
            quadraticCurveTo: (d) => {
                const points = quadraticCurveToLines(d.p0!, d.p1!, d.p2!)
                points.forEach(p => polygon!.push(p))
            },
            bezierCurveTo: (d) => {
                const points = cubicCurveToLines(d.p0!, d.p1!, d.p2!, d.p3!)
                points.forEach(p => polygon!.push(p))
            },
            closePath: (d) => {
                if (polygon) {
                    if (closed) {
                        polygon.push(d.lastMovePoint)
                    }
                    polygons.push(polygon)
                    polygon = null

                }
            }
        })
        if (polygon) {
            polygons.push(polygon)
        }
        return polygons
    }
}


export class Surface {
    private currentPaint: Paint = Paint.default()
    private paintStack: Paint[] = []
    private currentPath: PathBuilder = PathBuilder.default()
    constructor() {

    }
    beginPath() {
        this.currentPath = PathBuilder.default()
    }
    moveTo(x: number, y: number) {
        this.currentPath.moveTo(x, y)
    }
    lineTo(x: number, y: number) {
        this.currentPath.lineTo(x, y)
    }
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number) {
        this.currentPath.quadraticCurveTo(cpx, cpy, x, y)
    }
    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number) {
        this.currentPath.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
    }
    closePath() {
        this.currentPath.closePath()
    }
    stroke() {

    }
    fill() {

    }
}


export class PixelImage {
    static fromWH(width: number, height: number) {
        return new this(width, height)
    }
    width: number
    height: number
    colorBuffer: Uint8ClampedArray
    imageData: ImageData
    constructor(width: number, height: number) {
        this.width = width
        this.height = height
        this.colorBuffer = new Uint8ClampedArray(width * height * 4)
        this.imageData = new ImageData(this.colorBuffer, width, height)
    }
    setPixel(x: number, y: number, r: number, g: number, b: number, a: number) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) return this
        x = Math.floor(x)
        y = Math.floor(y)
        const index = ((y * this.width + x) * 4)
        this.colorBuffer[index] = r
        this.colorBuffer[index + 1] = g
        this.colorBuffer[index + 2] = b
        this.colorBuffer[index + 3] = a
        return this
    }
    setPixelColor(x: number, y: number, color: Color) {
        return this.setPixel(x, y, color.r, color.g, color.b, color.a)
    }
}