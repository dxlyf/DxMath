import { Matrix2D } from "../math/mat2d"
import { Conic } from '../curve/conic'
import { find_cubic_inflections, chop_cubic_at2, eval_cubic_tangent_at, find_cubic_cusp, find_unit_quad_roots, eval_quad_tangent_at, find_cubic_max_curvature, find_quad_max_curvature, eval_quad_at, eval_cubic_pos_at } from '../curve/path_geomtry'
import { Vector2, Vector2 as Point } from "../math/vec2"
import { radianToDegrees, scalarNearlyZero } from '../math/math'
import {BoundingRect} from '../math/bounding_rect'
const PI_2 = Math.PI * 2
const twoPi = PI_2
export {
    Point
}
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
    Miter = 'miter',
    Round = 'round',
    Bevel = 'bevel',
    MiterClip = 'miter-clip',
}
export enum LineCap {
    Butt = 'butt',
    Round = 'round',
    Square = 'square',
}
export enum FillRule {
    NonZero = 'nonzero',
    EvenOdd = 'evenodd',
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
    CW,
    CCW,
}
export enum FillStyle {
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
function fmod(a: number, b: number) {
    return a - Math.floor(a / b) * b;
}
function canonicalizeAngle(startAngle: number, endAngle: number) {
    // Make 0 <= startAngle < 2*PI
    let newStartAngle = fmod(startAngle, twoPi);
    if (newStartAngle < 0) {
        newStartAngle += twoPi;
        // Check for possible catastrophic cancellation in cases where
        // newStartAngle was a tiny negative number (c.f. crbug.com/503422)
        if (newStartAngle >= twoPi) {
            newStartAngle -= twoPi;
        }
    }
    let delta = newStartAngle - startAngle;
    startAngle = newStartAngle;
    endAngle = endAngle + delta;
    return [startAngle, endAngle]
}
// Adapted from https://chromium.googlesource.com/chromium/blink/+/refs/heads/main/Source/modules/canvas2d/CanvasPathMethods.cpp
function adjustEndAngle(startAngle: number, endAngle: number, counterclockwise: boolean) {
    let newEndAngle = endAngle;
    /* http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#dom-context-2d-arc
    * If the counterclockwise argument is false and endAngle-startAngle is equal to or greater than 2pi, or,
    * if the counterclockwise argument is true and startAngle-endAngle is equal to or greater than 2pi,
    * then the arc is the whole circumference of this ellipse, and the point at startAngle along this circle's circumference,
    * measured in radians clockwise from the ellipse's semi-major axis, acts as both the start point and the end point.
    */
    if (!counterclockwise && endAngle - startAngle >= twoPi) {
        newEndAngle = startAngle + twoPi;
    }
    else if (counterclockwise && startAngle - endAngle >= twoPi) {
        newEndAngle = startAngle - twoPi;
    }
    /*
    * Otherwise, the arc is the path along the circumference of this ellipse from the start point to the end point,
    * going anti-clockwise if the counterclockwise argument is true, and clockwise otherwise.
    * Since the points are on the ellipse, as opposed to being simply angles from zero,
    * the arc can never cover an angle greater than 2pi radians.
    */
    /* NOTE: When startAngle = 0, endAngle = 2Pi and counterclockwise = true, the spec does not indicate clearly.
    * We draw the entire circle, because some web sites use arc(x, y, r, 0, 2*Math.PI, true) to draw circle.
    * We preserve backward-compatibility.
    */
    else if (!counterclockwise && startAngle > endAngle) {
        newEndAngle = startAngle + (twoPi - fmod(startAngle - endAngle, twoPi));
    }
    else if (counterclockwise && startAngle < endAngle) {
        newEndAngle = startAngle - (twoPi - fmod(endAngle - startAngle, twoPi));
    }
    return newEndAngle;
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
    fillStyle: FillStyle = FillStyle.Color
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
export function pointInPolygon(point: Point, polygon: Point[], fillRule: FillRule): boolean {
    let winding = 0;
    for (let i = 0; i < polygon.length; i++) {
        const p1 = polygon[i];
        const p2 = polygon[(i + 1) % polygon.length];
        if ((p1.y > point.y && p2.y <= point.y || p2.y > point.y && p1.y <= point.y) &&
            point.x >= (p2.x - p1.x) * (point.y - p1.y) / (p2.y - p1.y) + p1.x) {
            if (fillRule === FillRule.EvenOdd) {
                winding++
            } else {
                winding += p1.y < p2.y ? 1 : -1

            }
        }
    }
    return winding % 2 !== 0;
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
    return Point.create(x, y);
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
    const kappa = (4 / 3) * Math.tan(delta / 4); // 控制点距离比例
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

    return { min: Point.create(minX, minY), max: Point.create(maxX, maxY) }

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

    return { min: Point.create(minX, minY), max: Point.create(maxX, maxY) }
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
        const dist = pointOnLineDistance(p1, p0, p2)
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
        const dist1 = pointOnLineDistance(p1, p0, p3)
        const dist2 = pointOnLineDistance(p2, p0, p3)
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
                        lastControlPoint = Point.create(x2, y2);
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
                        lastControlPoint = Point.create(x2, y2);
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
                        lastControlPoint = Point.create(x1, y1);
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
                        lastControlPoint = Point.create(x1, y1);
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
    closePath: (record: { type: PathVerb, p0: Point, lastMovePoint: Point, index: number }) => void
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
        const path = new this()
        buildPathFromSvgPath(svgPath, path)
        return path

    }
    static default() {
        return new this()
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
    clear() {
        this.reset()
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
    toReversePath() {
        return PathBuilder.default().addReversePath(this)
    }
    setLastPoint(point: Point) {
        if (this.lastPoint) {
            this.lastPoint.copy(point)
        } else {
            this.moveTo(point.x, point.y)
        }
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
    reversePathTo(other: PathBuilder) {
        if (other.isEmpty) {
            return;
        }

        console.assert(other.verbs[0] == PathVerb.MoveTo);

        let points_offset = other.points.length - 1;
        let reverse_verbs = other.verbs.slice().reverse()

        for (let verb of reverse_verbs) {
            switch (verb) {
                case PathVerb.MoveTo: {
                    // if the path has multiple contours, stop after reversing the last
                    break;
                }
                case PathVerb.LineTo: {
                    // We're moving one point back manually, to prevent points_offset overflow.
                    let pt = other.points[points_offset - 1];
                    points_offset -= 1;
                    this.lineTo(pt.x, pt.y);
                    break
                }
                case PathVerb.QuadTo: {
                    let pt1 = other.points[points_offset - 1];
                    let pt2 = other.points[points_offset - 2];
                    points_offset -= 2;
                    this.quadraticCurveTo(pt1.x, pt1.y, pt2.x, pt2.y);
                    break
                }
                case PathVerb.CubicTo: {
                    let pt1 = other.points[points_offset - 1];
                    let pt2 = other.points[points_offset - 2];
                    let pt3 = other.points[points_offset - 3];
                    points_offset -= 3;
                    this.bezierCurveTo(pt1.x, pt1.y, pt2.x, pt2.y, pt3.x, pt3.y);
                    break
                }
                case PathVerb.Close:
                    break
            }
        }
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
            this.points.push(Point.create(x, y))
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
        this.points.push(Point.create(x, y))
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
        this.points.push(Point.create(x1, y1), Point.create(x2, y2))
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
        this.points.push(Point.create(x1, y1), Point.create(x2, y2), Point.create(x3, y3))
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
            const p0 = Point.create(Math.cos(startTheta), Math.sin(startTheta))
            const p3 = Point.create(Math.cos(endTheta), Math.sin(endTheta))

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
        for (const [i,curve] of curves.entries()) {
            if (i === 0) {
                if (this.isEmpty) {
                    this.moveTo(curve[0], curve[1])
                } else {
                    this.lineTo(curve[0], curve[1])
                }
            }
            this.bezierCurveTo(curve[2], curve[3], curve[4], curve[5], curve[6], curve[7])
        }
    }
    ellipseArc3(x1: number, y1: number, x2: number, y2: number,
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
            const p0 = Point.create(Math.cos(startTheta), Math.sin(startTheta))
            const p3 = Point.create(Math.cos(endTheta), Math.sin(endTheta))

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
        ccw: boolean = false
    ): this {

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
        const deltaAngle=endAngle-startAngle
        // 如果当前路径为空，先 moveTo 起始点
        const startPt = pointOnEllipse(cx, cy, rx, ry, rotation, startAngle);
        if (this.isEmpty) {
            this.moveTo(startPt);
        } else {
            this.lineTo(startPt);
        }

        // 分段，每段角度不超过 π/2
        const segments = Math.ceil(Math.abs(deltaAngle) / (Math.PI / 2));
        let segAngle = deltaAngle / segments;
        let theta1 = startAngle
        for (let i = 0; i < segments; i++) {
            const theta2 = theta1 + segAngle;
            const bezier = ellipticalArcSegmentToCubic(cx, cy, rx, ry, rotation, theta1, theta2);
            this.bezierCurveTo(bezier[0], bezier[1], bezier[2], bezier[3], bezier[4], bezier[5]);
            theta1 = theta2
        }
        return this;
    }
    ellipse2(
        cx: number, cy: number, rx: number, ry: number,
        rotation: number, startAngle: number, endAngle: number,
        ccw: boolean = false
    ) {

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
        if (Math.abs(radianToDegrees(sweepDegrees)-360)<=1e-6) {
            const halfSweep = sweepDegrees / 2
            this.arcToOval(cx, cy, rx, ry, rotation, startDegrees, halfSweep, true)
            this.arcToOval(cx, cy, rx, ry, rotation, startDegrees + halfSweep, halfSweep, false)
        } else {
            this.arcToOval(cx, cy, rx, ry, rotation, startDegrees, sweepDegrees, true)
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
    addCircle(x: number, y: number, r: number) {
        this.addOval(x - r, y - r, r + r, r + r);
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
        let p1 = Point.create(x1, y1)
        let p2 = Point.create(x2, y2)

        // need double precision for these calcs.

        // 计算上个点与x1,y1,x2,y2 之间的方向
        // start>p1的方向
        let befored = Point.create(p1.x - start.x, p1.y - start.y).normalize()
        // p1>p2的方向
        let afterd = Point.create(p2.x - p1.x, p2.y - p1.y).normalize()
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
        // (1-cos)/sin=tan(angle/2)
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
        let p1 = Point.create(x1, y1)
        let p2 = Point.create(x2, y2)

        if ((p1.x == p0.x && p1.y == p0.y)
            || (p1.x == p2.x && p1.y == p2.y)
            || radius == 0) {
            this.lineTo(p1.x, p1.y);
            return this;
        }

        let p1p0 = Point.create((p0.x - p1.x), (p0.y - p1.y));
        let p1p2 = Point.create((p2.x - p1.x), (p2.y - p1.y));
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
            let ep = Point.create((p0.x + factor_max * p1p0.x), (p0.y + factor_max * p1p0.y));
            this.lineTo(ep.x, ep.y);
            return this
        }

        let tangent = radius / Math.tan(Math.acos(cos_phi) / 2);
        let factor_p1p0 = tangent / p1p0_length;
        let t_p1p0 = Point.create((p1.x + factor_p1p0 * p1p0.x), (p1.y + factor_p1p0 * p1p0.y));

        let orth_p1p0 = Point.create(p1p0.y, -p1p0.x);
        let orth_p1p0_length = Math.sqrt(orth_p1p0.x * orth_p1p0.x + orth_p1p0.y * orth_p1p0.y);
        let factor_ra = radius / orth_p1p0_length;

        let cos_alpha = (orth_p1p0.x * p1p2.x + orth_p1p0.y * p1p2.y) / (orth_p1p0_length * p1p2_length);
        if (cos_alpha < 0)
            orth_p1p0.set(-orth_p1p0.x, -orth_p1p0.y);

        let p = Point.create((t_p1p0.x + factor_ra * orth_p1p0.x), (t_p1p0.y + factor_ra * orth_p1p0.y));

        orth_p1p0.set(-orth_p1p0.x, -orth_p1p0.y);
        let sa = Math.acos(orth_p1p0.x / orth_p1p0_length);
        if (orth_p1p0.y < 0)
            sa = 2 * Math.PI - sa;

        let anticlockwise = false;

        let factor_p1p2 = tangent / p1p2_length;
        let t_p1p2 = Point.create((p1.x + factor_p1p2 * p1p2.x), (p1.y + factor_p1p2 * p1p2.y));
        let orth_p1p2 = Point.create((t_p1p2.x - p.x), (t_p1p2.y - p.y));
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
        let vertex = Point.create(vertex_x, vertex_y);
        let point_2 = Point.create(x, y);
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
        let p1 = Point.create(x1, y1)
        let p2 = Point.create(x2, y2)
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


    conicTo2(x1: number, y1: number, x: number, y: number, weight: number): this {
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
            let k = 4.0 * weight / (3.0 * (1.0 + weight));

            let cp1x = last.x + (x1 - last.x) * k;
            let cp1y = last.y + (y1 - last.y) * k;
            let cp2x = x + (x1 - x) * k;
            let cp2y = y + (y1 - y) * k;

            this.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);

        }
        return this
    }
    getBounds() {
        const min = Point.create(Infinity, Infinity), max = Point.create(-Infinity, -Infinity)
        this.points.forEach(p => {
            min.min(p)
            max.max(p)
        })
        return { min, max }
    }
    computeTightBounds() {
        const min = Point.create(Infinity, Infinity), max = Point.create(-Infinity, -Infinity)

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
        return BoundingRect.fromLTRB(min.x,min.y,max.x,max.y)

    }
    isPointInPath(x: number, y: number, fillRule: FillRule) {
        const bounds = this.getBounds();
        if (x < bounds.min.x || x > bounds.max.x || y < bounds.min.y || y > bounds.max.y) {
            return false;
        }

        let windingNumber = 0; // 非零环绕数规则使用
        let intersectionCount = 0; // 奇偶规则使用
        let lastPoint = Point.default();

        this.visit({
            moveTo: (d) => {
                lastPoint.copy(d.p0!);
            },
            lineTo: (d) => {
                const currentPoint = d.p0!;
                // 射线法判断点与线段的相交情况
                if ((lastPoint.y > y) !== (currentPoint.y > y)) {
                    const xIntersect = (currentPoint.x - lastPoint.x) * (y - lastPoint.y) / (currentPoint.y - lastPoint.y) + lastPoint.x;
                    if (x < xIntersect) {
                        if (lastPoint.y < currentPoint.y) {
                            windingNumber++;
                        } else {
                            windingNumber--;
                        }
                        intersectionCount++;
                    }
                }
                lastPoint.copy(currentPoint);
            },
            quadraticCurveTo: (d) => {
                // 二次贝塞尔曲线细分处理
                const segments = quadraticCurveToLines(d.p0!, d.p1!, d.p2!);
                for (let i = 0; i < segments.length - 1; i++) {
                    const start = segments[i];
                    const end = segments[i + 1];
                    if ((start.y > y) !== (end.y > y)) {
                        const xIntersect = (end.x - start.x) * (y - start.y) / (end.y - start.y) + start.x;
                        if (x < xIntersect) {
                            if (start.y < end.y) {
                                windingNumber++;
                            } else {
                                windingNumber--;
                            }
                            intersectionCount++;
                        }
                    }
                }
                lastPoint.copy(d.p2!);
            },
            bezierCurveTo: (d) => {
                // 三次贝塞尔曲线细分处理
                const segments = cubicCurveToLines(d.p0!, d.p1!, d.p2!, d.p3!);
                for (let i = 0; i < segments.length - 1; i++) {
                    const start = segments[i];
                    const end = segments[i + 1];
                    if ((start.y > y) !== (end.y > y)) {
                        const xIntersect = (end.x - start.x) * (y - start.y) / (end.y - start.y) + start.x;
                        if (x < xIntersect) {
                            if (start.y < end.y) {
                                windingNumber++;
                            } else {
                                windingNumber--;
                            }
                            intersectionCount++;
                        }
                    }
                }
                lastPoint.copy(d.p3!);
            },
            closePath: (d) => {
                // 闭合路径时，连接最后一个点和起始点
                const currentPoint = d.lastMovePoint;
                if ((lastPoint.y > y) !== (currentPoint.y > y)) {
                    const xIntersect = (currentPoint.x - lastPoint.x) * (y - lastPoint.y) / (currentPoint.y - lastPoint.y) + lastPoint.x;
                    if (x < xIntersect) {
                        if (lastPoint.y < currentPoint.y) {
                            windingNumber++;
                        } else {
                            windingNumber--;
                        }
                        intersectionCount++;
                    }
                }
                lastPoint.copy(currentPoint);
            }
        });

        if (fillRule === FillRule.NonZero) {
            return windingNumber !== 0;
        } else {
            return (intersectionCount % 2) === 1;
        }
    }
    fatten(tessellationTolerance=1) {
        let path = PathBuilder.default()

        this.visit({
            moveTo: (d) => {
                path.moveTo(d.p0!.x, d.p0!.y)
            },
            lineTo: (d) => {
                path.lineTo(d.p0!.x, d.p0!.y)
            },
            quadraticCurveTo: (d) => {
                const points = quadraticCurveToLines(d.p0!, d.p1!, d.p2!, tessellationTolerance)
                points.forEach(p => path.lineTo(p.x, p.y))
            },
            bezierCurveTo: (d) => {
                const points = cubicCurveToLines(d.p0!, d.p1!, d.p2!, d.p3!, tessellationTolerance)
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
                    visitor.closePath({ type: d.type, p0: d.p0!, lastMovePoint: d.p1!, index })
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
                    yield { type: verb, p0: points[k - 1], p1: lastMovePoint?.clone() }
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
    toPolygons(autoClosed = true) {
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
                    if (autoClosed && !d.p0.equals(d.lastMovePoint)) {
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
    segments() {
        return new PathSegmentsIter({
            path: this,
            verbIndex: 0,
            pointsIndex: 0,
            isAutoClose: false
        })
    }
    isZeroLengthSincePoint(start_pt_index: number) {
        let count = this.points.length - start_pt_index;
        if (count < 2) {
            return true;
        }

        let first = this.points[start_pt_index];
        for (let i = 1; i < count; i++) {
            if (first.equals(this.points[start_pt_index + i])) {
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
}

export class PathSegmentsIter {
    isAutoClose = false;
    path!: PathBuilder
    verbIndex!: number
    pointsIndex!: number
    lastMoveTo: Point = Point.default()
    lastPoint: Point = Point.default()
    constructor(options: {
        isAutoClose?: boolean
        path: PathBuilder
        verbIndex: number
        pointsIndex: number
        lastMoveTo?: Point
        lastPoint?: Point
    }) {
        this.isAutoClose = options.isAutoClose ?? false
        this.verbIndex = options.verbIndex
        this.pointsIndex = options.pointsIndex
        this.path = options.path
        if (options.lastMoveTo) {
            this.lastMoveTo.copy(options.lastMoveTo)
        }
        if (options.lastPoint) {
            this.lastPoint.copy(options.lastPoint)
        }
    }
    get curVerb() {
        return this.path.verbs[this.verbIndex - 1]
    }
    get nextVerb() {
        return this.path.verbs[this.verbIndex]
    }
    *[Symbol.iterator](): Iterator<PathVerbData> {
        const points = this.path.points.map(p => p.clone())
        const verbs = this.path.verbs
        let lastMovePoint: Point | null = null
        while (this.verbIndex < verbs.length) {
            const verb = verbs[this.verbIndex++]
            switch (verb) {
                case PathVerb.MoveTo:
                    this.pointsIndex += 1
                    lastMovePoint = points[this.pointsIndex - 1]
                    this.lastMoveTo.copy(lastMovePoint)
                    this.lastPoint.copy(this.lastMoveTo)
                    yield { type: verb, p0: points[this.pointsIndex - 1] }
                    break;
                case PathVerb.LineTo:
                    this.pointsIndex += 1
                    this.lastPoint.copy(points[this.pointsIndex - 1])
                    yield { type: verb, p0: points[this.pointsIndex - 1] }
                    break;
                case PathVerb.QuadTo:
                    this.pointsIndex += 2
                    this.lastPoint.copy(points[this.pointsIndex - 1])
                    yield { type: verb, p0: points[this.pointsIndex - 3], p1: points[this.pointsIndex - 2], p2: points[this.pointsIndex - 1] }
                    break;
                case PathVerb.CubicTo:
                    this.pointsIndex += 3
                    this.lastPoint.copy(points[this.pointsIndex - 1])
                    yield { type: verb, p0: points[this.pointsIndex - 4], p1: points[this.pointsIndex - 3], p2: points[this.pointsIndex - 2], p3: points[this.pointsIndex - 1] }
                    break;
                case PathVerb.Close:
                    const seg = this.autoClose()
                    this.lastPoint.copy(this.lastMoveTo)
                    yield seg
                    break;
            }
        }
    }
    copy(source: PathSegmentsIter) {
        this.isAutoClose = source.isAutoClose
        this.verbIndex = source.verbIndex
        this.pointsIndex = source.pointsIndex
        this.lastMoveTo.copy(source.lastMoveTo)
        this.lastPoint.copy(source.lastPoint)
        return this
    }
    clone() {
        return new PathSegmentsIter({
            isAutoClose: this.isAutoClose,
            path: this.path,
            verbIndex: this.verbIndex,
            pointsIndex: this.pointsIndex,
            lastMoveTo: this.lastMoveTo,
            lastPoint: this.lastPoint
        })
    }
    hasValidTangent() {
        let iter = this.clone();
        for (let d of iter) {

            switch (d.type) {
                case PathVerb.MoveTo: {
                    return false;
                }
                case PathVerb.LineTo: {
                    if (iter.lastPoint.equals(d.p0!)) {
                        continue;
                    }
                    return true;
                }
                case PathVerb.QuadTo: {
                    if (iter.lastPoint.equals(d.p1!) && iter.lastPoint.equals(d.p2!)) {
                        continue
                    }
                    return true
                }
                case PathVerb.CubicTo: {
                    if (iter.lastPoint.equals(d.p1!) && iter.lastPoint.equals(d.p2!) && iter.lastPoint.equals(d.p3!)) {
                        continue
                    }
                    return true
                }
                case PathVerb.Close: {
                    return false;
                }
            }
        }
        return false;
    }

    setAutoClose(value: boolean) {
        this.isAutoClose = value
    }
    autoClose(): PathVerbData {
        if (this.isAutoClose && !this.lastPoint.equals(this.lastMoveTo)) {
            this.verbIndex -= 1;
            return {
                type: PathVerb.LineTo,
                p0: this.lastMoveTo
            }
        } else {
            return {
                type: PathVerb.Close,
                p0: this.lastPoint,
                p1: this.lastMoveTo
            }
        }
    }
}

class SwappableBuilders {
    constructor(public inner: PathBuilder, public outer: PathBuilder) {

    }
    swap() {
        [this.inner, this.outer] = [this.outer, this.inner]
    }

}
type CapProc = (
    pivot: Point, // 上一个点
    normal: Point,
    stop: Point,
    other_path: PathBuilder | null | undefined,
    path: PathBuilder,
) => void;

type JoinProc = (
    before_unit_normal: Point, //l0->l1 线段的，旋转-90度的单位法向量
    pivot: Point,// 上一个lineTo点
    after_unit_normal: Point, // l1->l2 线段的，旋转-90度的单位法向量
    radius: number, // 线段宽的一半
    inv_miter_limit: number,// 1/miter_limit   
    prev_is_line: boolean, // 上一个绘制命令是否是lineTo
    curr_is_line: boolean, // 当前绘制命令是否是lineTo
    builders: SwappableBuilders,
) => void

const SCALAR_ROOT_2_OVER_2 = 0.707106781;// sqrt(2)/2
const lineCapButt: CapProc = (pivot, normal, stop, other_path, path) => {
    path.lineTo(stop.x, stop.y);
}
const lineCapRound: CapProc = (pivot, normal, stop, other_path, path) => {
    let parallel = normal.clone();
    parallel.cw();

    let projected_center = pivot.clone().add(parallel);
    let projected_center_normal = projected_center.clone().add(normal)
    path.conicTo(projected_center_normal.x,
        projected_center_normal.y,
        projected_center.x,
        projected_center.y,
        SCALAR_ROOT_2_OVER_2,
    );
    projected_center_normal.copy(projected_center).sub(normal)
    path.conicTo(projected_center_normal.x,
        projected_center_normal.y,
        stop.x,
        stop.y,
        SCALAR_ROOT_2_OVER_2,
    );
}

const lineCapSquare: CapProc = (pivot, normal, stop, other_path, path) => {
    let parallel = normal.clone();
    parallel.cw();

    if (other_path) {
        path.setLastPoint(Point.create(
            pivot.x + normal.x + parallel.x,
            pivot.y + normal.y + parallel.y,
        ));
        path.lineTo(
            pivot.x - normal.x + parallel.x,
            pivot.y - normal.y + parallel.y,
        );
    } else {
        path.lineTo(
            pivot.x + normal.x + parallel.x,
            pivot.y + normal.y + parallel.y,
        );
        path.lineTo(
            pivot.x - normal.x + parallel.x,
            pivot.y - normal.y + parallel.y,
        );
        path.lineTo(stop.x, stop.y);
    }
}

enum AngleType {
    Nearly180,
    Sharp,
    Shallow,
    NearlyLine,
}
function isNearlyZero(value: number) {
    return Math.abs(value) <= SCALAR_NEARLY_ZERO
}
function dotToAngleType(dot: number): AngleType {
    if (dot >= 0.0) {
        // shallow or line
        if (isNearlyZero(1.0 - dot)) {
            return AngleType.NearlyLine
        } else {
            return AngleType.Shallow
        }
    } else {
        // sharp or 180
        if (isNearlyZero(1.0 + dot)) {
            return AngleType.Nearly180
        } else {
            return AngleType.Sharp
        }
    }
}
function isClockwise(before: Point, after: Point): boolean {
    return before.x * after.y > before.y * after.x
}
function handleInnerJoin(pivot: Point, after: Point, inner: PathBuilder) {
    // In the degenerate case that the stroke radius is larger than our segments
    // just connecting the two inner segments may "show through" as a funny
    // diagonal. To pseudo-fix this, we go through the pivot point. This adds
    // an extra point/edge, but I can't see a cheap way to know when this is
    // not needed :(
    inner.lineTo(pivot.x, pivot.y);

    inner.lineTo(pivot.x - after.x, pivot.y - after.y);
}
const lineJoinMiterInner = (
    before_unit_normal: Point, //l0->l1 线段的，旋转-90度的单位法向量
    pivot: Point,// 上一个lineTo点
    after_unit_normal: Point, // l1->l2 线段的，旋转-90度的单位法向量
    radius: number, // 线段宽的一半
    inv_miter_limit: number,// 1/miter_limit
    miter_clip: boolean,
    prev_is_line: boolean, // 上一个绘制命令是否是lineTo
    curr_is_line: boolean, // 当前绘制命令是否是lineTo
    builders: SwappableBuilders) => {
    function do_blunt_or_clipped(
        builders: SwappableBuilders,
        pivot: Point,
        radius: number,
        prev_is_line: boolean,
        curr_is_line: boolean,
        before: Point,
        mid: Point,
        after: Point,
        inv_miter_limit: number,
        miter_clip: boolean,
    ) {
        after = after.clone()
        after.multiplyScalar(radius);

        mid = mid.clone()
        before = before.clone()

        if (miter_clip) {
            mid.normalize();

            let cos_beta = before.dot(mid);
            let sin_beta = before.cross(mid);
            let x = 0
            if (Math.abs(sin_beta) <= SCALAR_NEARLY_ZERO) {
                x = 1.0 / inv_miter_limit
            } else {
                x = ((1.0 / inv_miter_limit) - cos_beta) / sin_beta
            };

            before.multiplyScalar(radius);

            let before_tangent = before.clone();
            before_tangent.cw();

            let after_tangent = after.clone();
            after_tangent.ccw();

            let c1 = Point.default()
            c1.addVectors(pivot, before).add(before_tangent.clone().multiplyScalar(x))
            let c2 = Point.default()
            c1.addVectors(pivot, after).add(after_tangent.clone().multiplyScalar(x))


            if (prev_is_line) {
                builders.outer.setLastPoint(c1);
            } else {
                builders.outer.lineTo(c1.x, c1.y);
            }

            builders.outer.lineTo(c2.x, c2.y);
        }

        if (!curr_is_line) {
            builders.outer.lineTo(pivot.x + after.x, pivot.y + after.y);
        }

        handleInnerJoin(pivot, after, builders.inner);
    }

    function do_miter(
        builders: SwappableBuilders,
        pivot: Point,
        radius: number,
        prev_is_line: boolean,
        curr_is_line: boolean,
        mid: Point,
        after: Point,
    ) {
        after = after.clone();
        after.multiplyScalar(radius);

        if (prev_is_line) {
            builders
                .outer
                .setLastPoint(Point.create(pivot.x + mid.x, pivot.y + mid.y));
        } else {
            builders.outer.lineTo(pivot.x + mid.x, pivot.y + mid.y);
        }

        if (!curr_is_line) {
            builders.outer.lineTo(pivot.x + after.x, pivot.y + after.y);
        }

        handleInnerJoin(pivot, after, builders.inner);
    }

    // negate the dot since we're using normals instead of tangents
    let dot_prod = before_unit_normal.dot(after_unit_normal);
    let angle_type = dotToAngleType(dot_prod);
    let before = before_unit_normal.clone();
    let after = after_unit_normal.clone();
    let mid = Point.default();

    if (angle_type == AngleType.NearlyLine) {
        return;
    }

    if (angle_type == AngleType.Nearly180) {
        curr_is_line = false;
        mid.subVectors(after, before).multiplyScalar(radius / 2.0);
        do_blunt_or_clipped(
            builders,
            pivot,
            radius,
            prev_is_line,
            curr_is_line,
            before,
            mid,
            after,
            inv_miter_limit,
            miter_clip,
        );
        return;
    }

    let ccw = !isClockwise(before, after);
    if (ccw) {
        builders.swap();
        before.negate();
        after.negate()
    }

    // Before we enter the world of square-roots and divides,
    // check if we're trying to join an upright right angle
    // (common case for stroking rectangles). If so, special case
    // that (for speed an accuracy).
    // Note: we only need to check one normal if dot==0
    if (dot_prod == 0.0 && inv_miter_limit <= SCALAR_ROOT_2_OVER_2) {
        mid.addVectors(before, after).multiplyScalar(radius)
        do_miter(
            builders,
            pivot,
            radius,
            prev_is_line,
            curr_is_line,
            mid,
            after,
        );
        return;
    }

    // choose the most accurate way to form the initial mid-vector
    if (angle_type == AngleType.Sharp) {
        mid = Point.create(after.y - before.y, before.x - after.x);
        if (ccw) {
            mid.negate();
        }
    } else {
        mid = Point.create(before.x + after.x, before.y + after.y);
    }

    // midLength = radius / sinHalfAngle
    // if (midLength > miterLimit * radius) abort
    // if (radius / sinHalf > miterLimit * radius) abort
    // if (1 / sinHalf > miterLimit) abort
    // if (1 / miterLimit > sinHalf) abort
    // My dotProd is opposite sign, since it is built from normals and not tangents
    // hence 1 + dot instead of 1 - dot in the formula
    let sin_half_angle = Math.sqrt((1.0 + dot_prod) / 2);
    if (sin_half_angle < inv_miter_limit) {
        curr_is_line = false;
        do_blunt_or_clipped(
            builders,
            pivot,
            radius,
            prev_is_line,
            curr_is_line,
            before,
            mid,
            after,
            inv_miter_limit,
            miter_clip,
        );
        return;
    }

    mid.setLength(radius / sin_half_angle);
    do_miter(
        builders,
        pivot,
        radius,
        prev_is_line,
        curr_is_line,
        mid,
        after,
    );
}

const lineJoinBevel: JoinProc = (before_unit_normal, pivot, after_unit_normal, radius, inv_miter_limit, prev_is_line, curr_is_line, builders) => {
    let after = after_unit_normal.clone().multiplyScalar(radius);

    if (!isClockwise(before_unit_normal, after_unit_normal)) {
        builders.swap();
        after.negate();
    }

    builders.outer.lineTo(pivot.x + after.x, pivot.y + after.y);
    handleInnerJoin(pivot, after, builders.inner);
}
const lineJoinMiter: JoinProc = (before_unit_normal, pivot, after_unit_normal, radius, inv_miter_limit, prev_is_line, curr_is_line, builders) => {
    return lineJoinMiterInner(before_unit_normal, pivot, after_unit_normal, radius, inv_miter_limit, false, prev_is_line, curr_is_line, builders)
}
const lineJoinMiterClip: JoinProc = (before_unit_normal, pivot, after_unit_normal, radius, inv_miter_limit, prev_is_line, curr_is_line, builders) => {
    lineJoinMiterInner(
        before_unit_normal,
        pivot,
        after_unit_normal,
        radius,
        inv_miter_limit,
        true,
        prev_is_line,
        curr_is_line,
        builders,
    );
}
const lineJoinRound: JoinProc = (before_unit_normal, pivot, after_unit_normal, radius, inv_miter_limit, prev_is_line, curr_is_line, builders) => {
    let dot_prod = before_unit_normal.dot(after_unit_normal);
    let angle_type = dotToAngleType(dot_prod);

    if (angle_type == AngleType.NearlyLine) {
        return;
    }

    let before = before_unit_normal.clone();
    let after = after_unit_normal.clone();
    let dir = PathDirection.CW;

    if (!isClockwise(before, after)) {
        builders.swap();
        before.negate();
        after.negate();
        dir = PathDirection.CCW;
    }

    let ts = Matrix2D.fromRows(radius, 0.0, 0.0, radius, pivot.x, pivot.y);

    let _conics = new Array(5).fill(0).map(() => new Conic())
    let conics = Conic.build_unit_arc(before as any, after as any, dir, ts, _conics);
    if (conics) {
        for (let conic of conics) {
            builders
                .outer
                .conicTo(conic.points[1].x, conic.points[1].y,
                    conic.points[2].x, conic.points[2].y, conic.weight);
        }

        after.multiplyScalar(radius);
        handleInnerJoin(pivot, after, builders.inner);
    }
}



function setNormalUnitNormal(
    before: Point,
    after: Point,
    scale: number,
    radius: number,
    normal: Point,
    unit_normal: Point,
): boolean {
    if (!unit_normal.setLengthFrom((after.x - before.x) * scale, (after.y - before.y) * scale, 1)) {
        return false;
    }

    unit_normal.ccw();
    normal.copy(unit_normal).multiplyScalar(radius);
    return true
}

function setNormalUnitNormal2(
    vec: Point,
    radius: number,
    normal: Point,
    unit_normal: Point,
): boolean {
    if (!unit_normal.setLengthFrom(vec.x, vec.y, 1)) {
        return false;
    }
    unit_normal.ccw();
    normal.copy(unit_normal).multiplyScalar(radius);
    return true
}

class QuadConstruct {
    static default() {
        return new this()
    }
    // The state of the quad stroke under construction.
    quad = [Point.default(), Point.default(), Point.default()]       // the stroked quad parallel to the original curve
    tangent_start = Point.default()   // a point tangent to quad[0]
    tangent_end = Point.default()     // a point tangent to quad[2]
    start_t: number = 0 // a segment of the original curve
    mid_t: number = 0
    end_t: number = 0
    start_set: boolean = false // state to share common points across structs
    end_set: boolean = false
    opposite_tangents: boolean = false // set if coincident tangents have opposite directions

    init(start: number, end: number): boolean {
        this.start_t = start;
        this.mid_t = Math.min(1, Math.max(0, (start + end) / 2));
        this.end_t = end;
        this.start_set = false; // state to share common points across structs
        this.end_set = false;
        return this.start_t < this.mid_t && this.mid_t < this.end_t;
    }
    initWithStart(parent: QuadConstruct): boolean {
        const self = this
        if (!self.init(parent.start_t, parent.mid_t)) {
            return false;
        }

        self.quad[0].copy(parent.quad[0]);
        self.tangent_start.copy(parent.tangent_start);
        self.start_set = true;
        return true

    }
    initWithEnd(parent: QuadConstruct): boolean {
        const self = this
        if (!self.init(parent.mid_t, parent.end_t)) {
            return false;
        }
        self.quad[2].copy(parent.quad[2]);
        self.tangent_end.copy(parent.tangent_end);
        self.end_set = true;
        return true
    }
}



function check_quad_linear(quad: Point[]): [Point, ReductionType] {
    let degenerate_ab = degenerateVector(quad[1].clone().sub(quad[0]));
    let degenerate_bc = degenerateVector(quad[2].clone().sub(quad[1]));
    if (degenerate_ab & degenerate_bc) {
        return [Point.default(), ReductionType.Point]
    }

    if (degenerate_ab | degenerate_bc) {
        return [Point.default(), ReductionType.Line];
    }

    if (!quadInLine(quad)) {
        return [Point.default(), ReductionType.Quad];
    }

    let t = find_quad_max_curvature(quad);
    if (t == 0 || t == 1) {
        return [Point.default(), ReductionType.Line];
    }

    let v = eval_quad_at(quad, t)
    return [Point.create(v.x, v.y), ReductionType.Degenerate]
}

function degenerateVector(v: Point) {
    return Number(!v.canNormalize())
}

/// Given quad, see if all there points are in a line.
/// Return true if the inside point is close to a line connecting the outermost points.
///
/// Find the outermost point by looking for the largest difference in X or Y.
/// Since the XOR of the indices is 3  (0 ^ 1 ^ 2)
/// the missing index equals: outer_1 ^ outer_2 ^ 3.
function quadInLine(quad: Point[]): boolean {
    let pt_max = -1.0;
    let outer1 = 0;
    let outer2 = 0;
    for (let index = 0; index < 2; index++) {
        for (let inner = index + 1; inner < 3; inner++) {
            let test_diff = quad[inner].clone().sub(quad[index]);
            let test_max = Math.max(Math.abs(test_diff.x), Math.abs(test_diff.y))
            if (pt_max < test_max) {
                outer1 = index;
                outer2 = inner;
                pt_max = test_max;
            }
        }
    }

    console.assert(outer1 <= 1);
    console.assert(outer2 >= 1 && outer2 <= 2);
    console.assert(outer1 < outer2);

    let mid = outer1 ^ outer2 ^ 3;
    const CURVATURE_SLOP: number = 0.000005; // this multiplier is pulled out of the air
    let line_slop = pt_max * pt_max * CURVATURE_SLOP;
    return ptToLine(quad[mid], quad[outer1], quad[outer2]) <= line_slop
}

// returns the distance squared from the point to the line
function ptToLine(pt: Point, line_start: Point, line_end: Point): number {
    let dxy = line_end.clone().sub(line_start);
    let ab0 = pt.clone().sub(line_start);
    let numer = dxy.dot(ab0);
    let denom = dxy.dot(dxy);
    let t = numer / denom;
    if (t >= 0.0 && t <= 1.0) {
        let hit = Point.create(
            line_start.x * (1.0 - t) + line_end.x * t,
            line_start.y * (1.0 - t) + line_end.y * t,
        );
        return hit.distanceToSquared(pt)
    } else {
        return pt.distanceToSquared(line_start)
    }
}

// Intersect the line with the quad and return the t values on the quad where the line crosses.
function intersect_quad_ray(
    line: Point[],
    quad: Point[],
    roots: number[]
): number[] {
    let vec = line[1].clone().sub(line[0]);
    let r = [0, 0, 0];
    for (let n = 0; n < 3; n++) {
        r[n] = (quad[n].y - line[0].y) * vec.x - (quad[n].x - line[0].x) * vec.y;
    }
    let a = r[2];
    let b = r[1];
    let c = r[0];
    a += c - 2.0 * b; // A = a - 2*b + c
    b -= c; // B = -(b - c)

    let len = find_unit_quad_roots(a, 2.0 * b, c, roots);
    return roots.slice(0, len)
}

function pointsWithinDist(near_pt: Point, far_pt: Point, limit: number): boolean {
    return near_pt.distanceToSquared(far_pt) <= limit * limit
}

function sharp_angle(quad: Point[]): boolean {
    let smaller = quad[1].clone().sub(quad[0]);
    let larger = quad[1].clone().sub(quad[2]);
    let smaller_len = smaller.lengthSquared();
    let larger_len = larger.lengthSquared();
    if (smaller_len > larger_len) {
        [smaller, larger] = [larger, smaller]
        larger_len = smaller_len;
    }

    if (!smaller.setLength(larger_len)) {
        return false;
    }

    let dot = smaller.dot(larger);
    return dot > 0.0
}

// Return true if the point is close to the bounds of the quad. This is used as a quick reject.
function ptInQuadBounds(quad: Point[], pt: Point, inv_res_scale: number): boolean {
    let x_min = Math.min(quad[0].x, quad[1].x, quad[2].x);
    if (pt.x + inv_res_scale < x_min) {
        return false;
    }

    let x_max = Math.max(quad[0].x, quad[1].x, quad[2].x);
    if (pt.x - inv_res_scale > x_max) {
        return false;
    }

    let y_min = Math.min(quad[0].y, quad[1].y, quad[2].y);
    if (pt.y + inv_res_scale < y_min) {
        return false;
    }

    let y_max = Math.max(quad[0].y, quad[1].y, quad[2].y);
    if (pt.y - inv_res_scale > y_max) {
        return false;
    }
    return true
}

function checkCubicLinear(
    cubic: Point[],
    reduction: Point[],
    tangent_pt?: Point,
): ReductionType | -1 {
    let degenerate_ab = degenerateVector(cubic[1].clone().sub(cubic[0]));
    let degenerate_bc = degenerateVector(cubic[2].clone().sub(cubic[1]));
    let degenerate_cd = degenerateVector(cubic[3].clone().sub(cubic[2]));
    if (degenerate_ab & degenerate_bc & degenerate_cd) {
        return ReductionType.Point;
    }

    if (degenerate_ab + degenerate_bc + degenerate_cd == 2) {
        return ReductionType.Line;
    }

    if (!cubic_in_line(cubic)) {
        if (tangent_pt) {
            if (degenerate_ab) {
                tangent_pt.copy(cubic[2])
            } else {
                tangent_pt.copy(cubic[1])
            }
        }

        return ReductionType.Quad;
    }

    let t_values = [0, 0, 0];
    t_values = find_cubic_max_curvature(cubic as any[], t_values);
    let r_count = 0;
    // Now loop over the t-values, and reject any that evaluate to either end-point
    for (let t of t_values) {
        if (0.0 >= t || t >= 1.0) {
            continue;
        }
        let v = eval_cubic_pos_at(cubic, t)
        reduction[r_count] = Point.create(v.x, v.y);
        if (!reduction[r_count].equals(cubic[0]) && !reduction[r_count].equals(cubic[3])) {
            r_count += 1;
        }
    }

    switch (r_count) {
        case 0: return ReductionType.Line
        case 1: return ReductionType.Line
        case 2: return ReductionType.Degenerate2
        case 3: return ReductionType.Degenerate3
        default: return -1
    }
}

/// Given a cubic, determine if all four points are in a line.
///
/// Return true if the inner points is close to a line connecting the outermost points.
///
/// Find the outermost point by looking for the largest difference in X or Y.
/// Given the indices of the outermost points, and that outer_1 is greater than outer_2,
/// this table shows the index of the smaller of the remaining points:
///
/// ```text
///                   outer_2
///               0    1    2    3
///   outer_1     ----------------
///      0     |  -    2    1    1
///      1     |  -    -    0    0
///      2     |  -    -    -    0
///      3     |  -    -    -    -
/// ```
///
/// If outer_1 == 0 and outer_2 == 1, the smaller of the remaining indices (2 and 3) is 2.
///
/// This table can be collapsed to: (1 + (2 >> outer_2)) >> outer_1
///
/// Given three indices (outer_1 outer_2 mid_1) from 0..3, the remaining index is:
///
/// ```text
/// mid_2 == (outer_1 ^ outer_2 ^ mid_1)
/// ```
function cubic_in_line(cubic: Point[]): boolean {
    let pt_max = -1.0;
    let outer1 = 0;
    let outer2 = 0;
    for (let index = 0; index < 3; index++) {
        for (let inner = index + 1; inner < 4; inner++) {
            let test_diff = cubic[inner].clone().sub(cubic[index]);
            let test_max = Math.max(Math.abs(test_diff.x), Math.abs(test_diff.y));
            if (pt_max < test_max) {
                outer1 = index;
                outer2 = inner;
                pt_max = test_max;
            }
        }
    }

    let mid1 = (1 + (2 >> outer2)) >> outer1;

    let mid2 = outer1 ^ outer2 ^ mid1;

    let line_slop = pt_max * pt_max * 0.00001; // this multiplier is pulled out of the air

    return ptToLine(cubic[mid1], cubic[outer1], cubic[outer2]) <= line_slop
        && ptToLine(cubic[mid2], cubic[outer1], cubic[outer2]) <= line_slop
}

const joinFactory: {
    [K in LineJoin]: JoinProc
} = {
    [LineJoin.Bevel]: lineJoinBevel,
    [LineJoin.Miter]: lineJoinMiter,
    [LineJoin.MiterClip]: lineJoinMiterClip,
    [LineJoin.Round]: lineJoinRound
}
const capFactory: {
    [K in LineCap]: CapProc
} = {
    [LineCap.Butt]: lineCapButt,
    [LineCap.Round]: lineCapRound,
    [LineCap.Square]: lineCapSquare
}

enum StrokeType {
    Outer = 1, // use sign-opposite values later to flip perpendicular axis
    Inner = -1,
}
enum ReductionType {
    Point,       // all curve points are practically identical
    Line,        // the control point is on the line between the ends
    Quad,        // the control point is outside the line between the ends
    Degenerate,  // the control point is on the line but outside the ends
    Degenerate2, // two control points are on the line but outside ends (cubic)
    Degenerate3, // three areas of max curvature found (for cubic)
}
const QUAD_RECURSIVE_LIMIT: number = 3;

// quads with extreme widths (e.g. (0,1) (1,6) (0,3) width=5e7) recurse to point of failure
// largest seen for normal cubics: 5, 26
// largest seen for normal quads: 11
const RECURSIVE_LIMITS: number[] = [5 * 3, 26 * 3, 11 * 3, 11 * 3]; // 3x limits seen in practice
const SCALAR_NEARLY_ZERO = 1 / (1 << 12)

enum ResultType {
    Split,      // the caller should split the quad stroke in two
    Degenerate, // the caller should add a line
    Quad,       // the caller should (continue to try to) add a quad stroke
}
enum IntersectRayType {
    CtrlPt,
    ResultType,
}
export class PathStroker {
    static computeResolutionScale(ts: Matrix2D) {
        let sx = Point.create(ts.a, ts.b).length();
        let sy = Point.create(ts.c, ts.d).length();
        if (Number.isFinite(sx) && Number.isFinite(sy)) {
            let scale = Math.max(sx, sy);
            if (scale > 0) {
                return scale;
            }
        }
        return 1
    }
    radius = 0 // 线段宽的一半
    inv_miter_limit = 0 // 1/miter_limit
    res_scale = 1 // 分辨率缩放因子
    inv_res_scale = 1 // 分辨率缩放因子的倒数
    inv_res_scale_squared = 1 // 分辨率缩放因子的倒数平方

    first_normal = Point.default() // Move->LineTo 旋转-90法向量剩以radius
    prev_normal = Point.default() // 上一个LineTo->lineTo点旋转-90法向量剩以radius
    first_unit_normal = Point.default() // Move->LineTo 线段的，旋转-90度的单位法向量
    prev_unit_normal = Point.default() // 上一个lineTo->LineTo点旋转-90度的单位法向量

    first_pt = Point.default() // moveTo点
    prev_pt = Point.default()// 上一个lineTo点

    first_outer_pt = Point.default()  // 第一个线段的外侧点

    first_outer_pt_index_in_contour = 0 // 第一个线段的外侧点在轮廓中的索引

    segment_count = -1 // 从MoveTo线段计数

    prev_is_line = false // 上一个绘制命令是否是lineTo


    capper!: CapProc
    joiner!: JoinProc

    inner = PathBuilder.default()
    outer = PathBuilder.default()
    cusper = PathBuilder.default()
    stroke_type = StrokeType.Outer // 线段类型
    recursion_depth = 0 // 递归深度
    found_tangents = false // 是否找到切线
    join_completed = false // 是否完成连接
    get moveToPt() {
        return this.first_pt
    }
    builders() {
        return new SwappableBuilders(this.inner, this.outer)
    }
    close(is_line: boolean) {
        this.finishContour(true, is_line);
    }
    moveTo(p: Point) {
        if (this.segment_count > 0) {
            this.finishContour(false, false);
        }

        this.segment_count = 0;
        this.first_pt.copy(p);
        this.prev_pt.copy(p);
        this.join_completed = false;
    }
    finishContour(close: boolean, curr_is_line: boolean) {
        const self = this
        if (self.segment_count > 0) {
            if (close) {
                (self.joiner)(
                    self.prev_unit_normal,
                    self.prev_pt,
                    self.first_unit_normal,
                    self.radius,
                    self.inv_miter_limit,
                    self.prev_is_line,
                    curr_is_line,
                    self.builders(),
                );
                self.outer.closePath();

                // now add inner as its own contour
                let pt = self.inner.lastPoint ?? Point.create(0, 0);
                self.outer.moveTo(pt.x, pt.y);
                self.outer.reversePathTo(self.inner);
                self.outer.closePath();
            } else {
                // add caps to start and end

                // cap the end
                let pt = self.inner.lastPoint ?? Point.create(0, 0);
                let other_path = curr_is_line ? self.inner : null;
                (self.capper)(
                    self.prev_pt,
                    self.prev_normal,
                    pt,
                    other_path,
                    self.outer,
                );
                self.outer.reversePathTo(self.inner);

                // cap the start
                other_path = self.prev_is_line ? self.inner : null;
                (self.capper)(
                    self.first_pt,
                    self.first_normal.clone().negate(),
                    self.first_outer_pt,
                    other_path,
                    self.outer,
                );
                self.outer.closePath();
            }

            if (!self.cusper.isEmpty) {
                self.outer.addPath(self.cusper);
                self.cusper.clear();
            }
        }

        // since we may re-use `inner`, we rewind instead of reset, to save on
        // reallocating its internal storage.
        self.inner.clear();
        self.segment_count = -1;
        self.first_outer_pt_index_in_contour = self.outer.points.length;
    }

    preJoinTo(p: Point, curr_is_line: boolean, normal: Point, unit_normal: Point) {
        const self = this
        let prev_x = self.prev_pt.x;
        let prev_y = self.prev_pt.y;

        let normal_set = setNormalUnitNormal(
            self.prev_pt,
            p,
            self.res_scale,
            self.radius,
            normal,
            unit_normal,
        );
        if (!normal_set) {
            if (self.capper === lineCapButt) {
                return false;
            }
            // Square caps and round caps draw even if the segment length is zero.
            // Since the zero length segment has no direction, set the orientation
            // to upright as the default orientation.
            normal.set(self.radius, 0.0)
            unit_normal.set(1, 0)
        }

        if (self.segment_count == 0) {
            self.first_normal.copy(normal);
            self.first_unit_normal.copy(unit_normal);
            self.first_outer_pt = Point.create(prev_x + normal.x, prev_y + normal.y);

            self.outer.moveTo(self.first_outer_pt.x, self.first_outer_pt.y);
            self.inner.moveTo(prev_x - normal.x, prev_y - normal.y);
        } else {
            // we have a previous segment
            (self.joiner)(
                self.prev_unit_normal,
                self.prev_pt,
                unit_normal,
                self.radius,
                self.inv_miter_limit,
                self.prev_is_line,
                curr_is_line,
                self.builders(),
            );
        }
        self.prev_is_line = curr_is_line;
        return true
    }
    postJoinTo(p: Point, normal: Point, unit_normal: Point) {
        this.join_completed = true;
        this.prev_pt.copy(p);
        this.prev_unit_normal.copy(unit_normal);
        this.prev_normal.copy(normal);
        this.segment_count += 1;
    }
    initQuad(
        stroke_type: StrokeType,
        start: number,
        end: number,
        quad_points: QuadConstruct,
    ) {
        this.stroke_type = stroke_type;
        this.found_tangents = false;
        quad_points.init(start, end);
    }
    quadStroke(quad: Point[], quad_points: QuadConstruct): boolean {
        let self = this
        let result_type = self.compareQuadQuad(quad, quad_points);
        if (result_type == ResultType.Quad) {
            let path = self.stroke_type == StrokeType.Outer ? self.outer : self.inner

            path.quadraticCurveTo(
                quad_points.quad[1].x,
                quad_points.quad[1].y,
                quad_points.quad[2].x,
                quad_points.quad[2].y,
            );

            return true;
        }

        if (result_type == ResultType.Degenerate) {
            self.addDegenerateLine(quad_points);
            return true;
        }

        self.recursion_depth += 1;
        if (self.recursion_depth > RECURSIVE_LIMITS[QUAD_RECURSIVE_LIMIT]) {
            return false; // just abort if projected quad isn't representable
        }

        let half = QuadConstruct.default();
        half.initWithStart(quad_points);
        if (!self.quadStroke(quad, half)) {
            return false;
        }

        half.initWithEnd(quad_points);
        if (!self.quadStroke(quad, half)) {
            return false;
        }

        self.recursion_depth -= 1;
        return true
    }

    compareQuadQuad(
        quad: Point[],
        quad_points: QuadConstruct,
    ): ResultType {
        const self = this
        // get the quadratic approximation of the stroke
        if (!quad_points.start_set) {
            let quad_start_pt = Point.zero();
            self.quadPerpRay(
                quad,
                quad_points.start_t,
                quad_start_pt,
                quad_points.quad[0],
                quad_points.tangent_start,
            );
            quad_points.start_set = true;
        }

        if (!quad_points.end_set) {
            let quad_end_pt = Point.zero();
            self.quadPerpRay(
                quad,
                quad_points.end_t,
                quad_end_pt,
                quad_points.quad[2],
                quad_points.tangent_end,
            );
            quad_points.end_set = true;
        }

        let result_type = self.intersectRay(IntersectRayType.CtrlPt, quad_points);
        if (result_type != ResultType.Quad) {
            return result_type;
        }

        // project a ray from the curve to the stroke
        let ray0 = Point.zero();
        let ray1 = Point.zero();
        self.quadPerpRay(quad, quad_points.mid_t, ray1, ray0);
        return self.strokeCloseEnough(quad_points.quad.slice(), [ray0, ray1], quad_points)
    }
    // Given a point on the curve and its derivative, scale the derivative by the radius, and
    // compute the perpendicular point and its tangent.
    setRayPoints(
        tp: Point,
        dxy: Point,
        on_p: Point,
        tangent?: Point,
    ) {
        const self = this
        if (!dxy.setLength(self.radius)) {
            //*dxy = Point.create_xy(self.radius, 0.0);
            dxy.copy(Point.create(self.radius, 0.0))
        }

        let axis_flip = self.stroke_type as number; // go opposite ways for outer, inner
        on_p.x = tp.x + axis_flip * dxy.y;
        on_p.y = tp.y - axis_flip * dxy.x;

        if (tangent) {
            tangent.x = on_p.x + dxy.x;
            tangent.y = on_p.y + dxy.y;
        }
    }
    // Given a quad and t, return the point on curve,
    // its perpendicular, and the perpendicular tangent.
    quadPerpRay(
        quad: Point[],
        t: number,
        tp: Point,
        on_p: Point,
        tangent?: Point
    ) {
        let self = this
        let v1 = eval_quad_at(quad, t)
        // *tp = path_geometry.eval_quad_at(quad, t);
        tp.set(v1.x, v1.y)
        v1 = eval_quad_tangent_at(quad, t)
        let dxy = Point.create(v1.x, v1.y);

        if (dxy.isZero()) {
            dxy = quad[2].sub(quad[0]);
        }

        self.setRayPoints(tp, dxy, on_p, tangent);
    }
    strokeCloseEnough(
        stroke: Point[],
        ray: Point[],
        quad_points: QuadConstruct,
    ): ResultType {
        const self = this
        let half = 0.5;
        let stroke_mid = eval_quad_at(stroke, half);
        // measure the distance from the curve to the quad-stroke midpoint, compare to radius
        if (pointsWithinDist(ray[0], Point.create(stroke_mid.x, stroke_mid.y), self.inv_res_scale)) {
            // if the difference is small
            if (sharp_angle(quad_points.quad)) {
                return ResultType.Split;
            }

            return ResultType.Quad;
        }

        // measure the distance to quad's bounds (quick reject)
        // an alternative : look for point in triangle
        if (!ptInQuadBounds(stroke, ray[0], self.inv_res_scale)) {
            // if far, subdivide
            return ResultType.Split;
        }

        // measure the curve ray distance to the quad-stroke
        let roots = new Array(3).fill(0.5)
        roots = intersect_quad_ray(ray, stroke, roots);
        if (roots.length != 1) {
            return ResultType.Split;
        }

        let quad_pt = eval_quad_at(stroke, roots[0]);
        let error = self.inv_res_scale * (1.0 - Math.abs((roots[0] - 0.5)) * 2.0);
        if (pointsWithinDist(ray[0], Point.create(quad_pt.x, quad_pt.y), error)) {
            // if the difference is small, we're done
            if (sharp_angle(quad_points.quad)) {
                return ResultType.Split;
            }

            return ResultType.Quad;
        }

        // otherwise, subdivide
        return ResultType.Split
    }
    // Find the intersection of the stroke tangents to construct a stroke quad.
    // Return whether the stroke is a degenerate (a line), a quad, or must be split.
    // Optionally compute the quad's control point.
    intersectRay(
        intersect_ray_type: IntersectRayType,
        quad_points: QuadConstruct,
    ): ResultType {
        const self = this;
        let start = quad_points.quad[0];
        let end = quad_points.quad[2];
        let a_len = quad_points.tangent_start.clone().sub(start);
        let b_len = quad_points.tangent_end.clone().sub(end);

        // Slopes match when denom goes to zero:
        //                   axLen / ayLen ==                   bxLen / byLen
        // (ayLen * byLen) * axLen / ayLen == (ayLen * byLen) * bxLen / byLen
        //          byLen  * axLen         ==  ayLen          * bxLen
        //          byLen  * axLen         -   ayLen          * bxLen         ( == denom )
        let denom = a_len.cross(b_len);
        if (denom == 0.0 || !Number.isFinite(denom)) {
            quad_points.opposite_tangents = a_len.dot(b_len) < 0.0;
            return ResultType.Degenerate;
        }

        quad_points.opposite_tangents = false;
        let ab0 = start.clone().sub(end);
        let numer_a = b_len.cross(ab0);
        let numer_b = a_len.cross(ab0);
        if ((numer_a >= 0.0) == (numer_b >= 0.0)) {
            // if the control point is outside the quad ends

            // if the perpendicular distances from the quad points to the opposite tangent line
            // are small, a straight line is good enough
            let dist1 = ptToLine(start, end, quad_points.tangent_end);
            let dist2 = ptToLine(end, start, quad_points.tangent_start);
            if (Math.max(dist1, dist2) <= self.inv_res_scale_squared) {
                return ResultType.Degenerate;
            }

            return ResultType.Split;
        }

        // check to see if the denominator is teeny relative to the numerator
        // if the offset by one will be lost, the ratio is too large
        numer_a /= denom;
        let valid_divide = numer_a > numer_a - 1.0;
        if (valid_divide) {
            if (intersect_ray_type == IntersectRayType.CtrlPt) {
                // the intersection of the tangents need not be on the tangent segment
                // so 0 <= numerA <= 1 is not necessarily true
                quad_points.quad[1].x =
                    start.x * (1.0 - numer_a) + quad_points.tangent_start.x * numer_a;
                quad_points.quad[1].y =
                    start.y * (1.0 - numer_a) + quad_points.tangent_start.y * numer_a;
            }

            return ResultType.Quad;
        }

        quad_points.opposite_tangents = a_len.dot(b_len) < 0.0;

        // if the lines are parallel, straight line is good enough
        return ResultType.Degenerate
    }
    addDegenerateLine(quad_points: & QuadConstruct) {
        const self = this
        if (self.stroke_type == StrokeType.Outer) {
            self.outer
                .lineTo(quad_points.quad[2].x, quad_points.quad[2].y);
        } else {
            self.inner
                .lineTo(quad_points.quad[2].x, quad_points.quad[2].y);
        }
    }

    setCubicEndNormal(
        cubic: Point[],
        normal_ab: Point,
        unit_normal_ab: Point,
        normal_cd: Point,
        unit_normal_cd: Point,
    ) {
        let self = this
        let ab = cubic[1].clone().sub(cubic[0]);
        let cd = cubic[3].clone().sub(cubic[2]);

        let degenerate_ab = degenerateVector(ab);
        let degenerate_cb = degenerateVector(cd);

        if (degenerate_ab && degenerate_cb) {
            normal_cd.copy(normal_ab)
            unit_normal_cd.copy(unit_normal_ab)
            return;
        }

        if (degenerate_ab) {
            ab = cubic[2].clone().sub(cubic[0]);
            degenerate_ab = degenerateVector(ab);
        }

        if (degenerate_cb) {
            cd = cubic[3].clone().sub(cubic[1])
            degenerate_cb = degenerateVector(cd);
        }

        if (degenerate_ab || degenerate_cb) {
            // *normal_cd = normal_ab;
            //*unit_normal_cd = unit_normal_ab;
            normal_cd.copy(normal_ab)
            unit_normal_cd.copy(unit_normal_ab)
            return;
        }

        let res = setNormalUnitNormal2(cd, self.radius, normal_cd, unit_normal_cd);
        //debug_assert!(res);
        return res
    }

    lineTo(p: Point, iter?: PathSegmentsIter) {
        const self = this
        let teeny_line = self
            .prev_pt
            .equalsEpsilon(p, SCALAR_NEARLY_ZERO * self.inv_res_scale);
        if ((self.capper, lineCapButt) && teeny_line) {
            return;
        }

        if (teeny_line && (self.join_completed || iter && iter.hasValidTangent())) {
            return;
        }

        let normal = Point.default();
        let unit_normal = Point.default();
        if (!self.preJoinTo(p, true, normal, unit_normal)) {
            return;
        }

        self.outer.lineTo(p.x + normal.x, p.y + normal.y);
        self.inner.lineTo(p.x - normal.x, p.y - normal.y);

        self.postJoinTo(p, normal, unit_normal);
    }
    quadraticCurveTo(p1: Point, p2: Point) {
        const self = this
        let quad = [self.prev_pt, p1, p2];
        let [reduction, reduction_type] = check_quad_linear(quad);
        if (reduction_type == ReductionType.Point) {
            // If the stroke consists of a moveTo followed by a degenerate curve, treat it
            // as if it were followed by a zero-length line. Lines without length
            // can have square and round end caps.
            self.lineTo(p2);
            return;
        }

        if (reduction_type == ReductionType.Line) {
            self.lineTo(p2);
            return;
        }

        if (reduction_type == ReductionType.Degenerate) {
            self.lineTo(reduction);
            let save_joiner = self.joiner;
            self.joiner = lineJoinRound;
            self.lineTo(p2);
            self.joiner = save_joiner;
            return;
        }
        let normal_ab = Point.default();
        let unit_ab = Point.default()
        let normal_bc = Point.default()
        let unit_bc = Point.default()
        if (!self.preJoinTo(p1, false, normal_ab, unit_ab)) {
            self.lineTo(p2);
            return;
        }

        let quad_points = QuadConstruct.default();
        self.initQuad(
            StrokeType.Outer,
            0,
            1,
            quad_points,
        );
        self.quadStroke(quad, quad_points);
        self.initQuad(
            StrokeType.Inner,
            0,
            1,
            quad_points,
        );
        self.quadStroke(quad, quad_points);

        let ok = setNormalUnitNormal(
            quad[1],
            quad[2],
            self.res_scale,
            self.radius,
            normal_bc,
            unit_bc,
        );
        if (!ok) {
            normal_bc = normal_ab;
            unit_bc = unit_ab;
        }

        self.postJoinTo(p2, normal_bc, unit_bc);

    }
    bezierCurveTo(pt1: Point, pt2: Point, pt3: Point) {
        const self = this;
        let cubic = [self.prev_pt, pt1, pt2, pt3];
        let reduction = Array.from({ length: 3 }, () => Point.zero())
        let tangent_pt = Point.zero();

        let reduction_type = checkCubicLinear(cubic, reduction, tangent_pt);
        if ((reduction_type == ReductionType.Point)) {
            // If the stroke consists of a moveTo followed by a degenerate curve, treat it
            // as if it were followed by a zero-length line. Lines without length
            // can have square and round end caps.
            self.lineTo(pt3);
            return;
        }

        if ((reduction_type == ReductionType.Line)) {
            self.lineTo(pt3);
            return;
        }

        if (ReductionType.Degenerate <= reduction_type
            && ReductionType.Degenerate3 >= reduction_type) {
            self.lineTo(reduction[0]);
            let save_joiner = self.joiner;
            self.joiner = lineJoinRound;
            if ((ReductionType.Degenerate2 <= reduction_type)) {
                self.lineTo(reduction[1]);
            }

            if ((ReductionType.Degenerate3 == reduction_type)) {
                self.lineTo(reduction[2]);
            }

            self.lineTo(pt3);
            self.joiner = save_joiner;
            return;
        }

        //  debug_assert_eq!(reduction_type, ReductionType.Quad);
        let normal_ab = Point.zero();
        let unit_ab = Point.zero();
        let normal_cd = Point.zero();
        let unit_cd = Point.zero();
        if ((!self.preJoinTo(tangent_pt, false, normal_ab, unit_ab))) {
            self.lineTo(pt3);
            return;
        }

        let t_values = new Array(3).fill(0.5);
        t_values = find_cubic_inflections(cubic, t_values);
        let last_t = 0;
        for (let index = 0, len = t_values.length; index <= len; index++) {
            let next_t = Number.isFinite(t_values[index]) ? t_values[index] : 1


            let quad_points = QuadConstruct.default();
            self.initQuad(StrokeType.Outer, last_t, next_t, quad_points);
            self.cubicStroke(cubic, quad_points);
            self.initQuad(StrokeType.Inner, last_t, next_t, quad_points);
            self.cubicStroke(cubic, quad_points);
            last_t = next_t;
        }
        let cusp = find_cubic_cusp(cubic)
        if ((cusp)) {
            let cusp_loc = eval_cubic_pos_at(cubic, cusp);
            self.cusper.addCircle(cusp_loc.x, cusp_loc.y, self.radius);
        }

        // emit the join even if one stroke succeeded but the last one failed
        // this avoids reversing an inner stroke with a partial path followed by another moveto
        self.setCubicEndNormal(cubic, normal_ab, unit_ab, normal_cd, unit_cd);

        self.postJoinTo(pt3, normal_cd, unit_cd);
    }

    cubicStroke(cubic: Point[], quad_points: QuadConstruct): boolean {
        const self = this;
        if ((!self.found_tangents)) {
            let result_type = self.tangentsMeet(cubic, quad_points);
            if ((result_type != ResultType.Quad)) {
                let ok = pointsWithinDist(
                    quad_points.quad[0],
                    quad_points.quad[2],
                    self.inv_res_scale,
                );
                if ((result_type == ResultType.Degenerate || ok)
                    && self.cubicMidOnLine(cubic, quad_points)) {
                    self.addDegenerateLine(quad_points);
                    return true;
                }
            } else {
                self.found_tangents = true;
            }
        }

        if ((self.found_tangents)) {
            let result_type = self.compareQuadCubic(cubic, quad_points);
            if ((result_type == ResultType.Quad)) {
                let stroke = quad_points.quad;
                if ((self.stroke_type == StrokeType.Outer)) {
                    self.outer
                        .quadraticCurveTo(stroke[1].x, stroke[1].y, stroke[2].x, stroke[2].y);
                } else {
                    self.inner
                        .quadraticCurveTo(stroke[1].x, stroke[1].y, stroke[2].x, stroke[2].y);
                }

                return true;
            }

            if ((result_type == ResultType.Degenerate)) {
                if ((!quad_points.opposite_tangents)) {
                    self.addDegenerateLine(quad_points);
                    return true;
                }
            }
        }

        if ((!Number.isFinite(quad_points.quad[2].x) || !Number.isFinite(quad_points.quad[2].x))) {
            return false; // just abort if projected quad isn't representable
        }

        self.recursion_depth += 1;

        if ((self.recursion_depth > RECURSIVE_LIMITS[Number(self.found_tangents)])) {
            return false; // just abort if projected quad isn't representable
        }

        let half = QuadConstruct.default();
        if ((!half.initWithStart(quad_points))) {
            self.addDegenerateLine(quad_points);
            self.recursion_depth -= 1;
            return true;
        }

        if ((!self.cubicStroke(cubic, half))) {
            return false;
        }

        if ((!half.initWithEnd(quad_points))) {
            self.addDegenerateLine(quad_points);
            self.recursion_depth -= 1;
            return true;
        }

        if ((!self.cubicStroke(cubic, half))) {
            return false;
        }

        self.recursion_depth -= 1;
        return true
    }
    cubicMidOnLine(cubic: Point[], quad_points: QuadConstruct): boolean {
        let self = this
        let stroke_mid = Point.zero();
        self.cubicQuadMid(cubic, quad_points, stroke_mid);
        let dist = ptToLine(stroke_mid, quad_points.quad[0], quad_points.quad[2]);
        return dist < self.inv_res_scale_squared
    }

    cubicQuadMid(cubic: Point[], quad_points: QuadConstruct, mid: Point) {
        let cubic_mid_pt = Point.zero();
        this.cubicPerpRay(cubic, quad_points.mid_t, cubic_mid_pt, mid);
    }

    compareQuadCubic(
        cubic: Point[],
        quad_points: QuadConstruct,
    ): ResultType {
        let self = this
        // get the quadratic approximation of the stroke
        self.cubicQuadEnds(cubic, quad_points);
        let result_type = self.intersectRay(IntersectRayType.CtrlPt, quad_points);
        if (result_type != ResultType.Quad) {
            return result_type;
        }

        // project a ray from the curve to the stroke
        // points near midpoint on quad, midpoint on cubic
        let ray0 = Point.zero();
        let ray1 = Point.zero();
        self.cubicPerpRay(cubic, quad_points.mid_t, ray1, ray0);
        return self.strokeCloseEnough(quad_points.quad.slice(), [ray0, ray1], quad_points)
    }

    // Given a cubic and a t range, find the start and end if they haven't been found already.
    cubicQuadEnds(cubic: Point[], quad_points: QuadConstruct) {
        const self = this;
        if (!quad_points.start_set) {
            let cubic_start_pt = Point.zero();
            self.cubicPerpRay(
                cubic,
                quad_points.start_t,
                cubic_start_pt,
                quad_points.quad[0],
                quad_points.tangent_start,
            );
            quad_points.start_set = true;
        }

        if (!quad_points.end_set) {
            let cubic_end_pt = Point.zero();
            self.cubicPerpRay(
                cubic,
                quad_points.end_t,
                cubic_end_pt,
                quad_points.quad[2],
                quad_points.tangent_end,
            );
            quad_points.end_set = true;
        }
    }
    tangentsMeet(cubic: Point[], quad_points: QuadConstruct): ResultType {
        this.cubicQuadEnds(cubic, quad_points);
        return this.intersectRay(IntersectRayType.ResultType, quad_points)
    }
    // Given a cubic and t, return the point on curve,
    // its perpendicular, and the perpendicular tangent.
    cubicPerpRay(
        cubic: Point[],
        t: number,
        t_pt: Point,
        on_pt: Point,
        tangent?: Point
    ) {
        let self = this

        //*t_pt = path_geometry.eval_cubic_pos_at(cubic, t);
        t_pt.copy(eval_cubic_pos_at(cubic, t))
        let dxy = eval_cubic_tangent_at(cubic, t);

        let chopped = Array.from({ length: 7 }, () => Point.zero());
        if (dxy.x == 0.0 && dxy.y == 0.0) {
            let c_points: Point[] = cubic;
            if (scalarNearlyZero(t)) {
                dxy = cubic[2].clone().sub(cubic[0]);
            } else if (scalarNearlyZero(1.0 - t)) {
                dxy = cubic[3].clone().sub(cubic[1]);
            } else {
                // If the cubic inflection falls on the cusp, subdivide the cubic
                // to find the tangent at that point.
                //
                // Unwrap never fails, because we already checked that `t` is not 0/1,;

                chop_cubic_at2(cubic, t, chopped);
                dxy = chopped[3].clone().sub(chopped[2]);
                if (dxy.x == 0.0 && dxy.y == 0.0) {
                    dxy = chopped[3].clone().sub(chopped[1]);
                    c_points = chopped;
                }
            }

            if (dxy.x == 0.0 && dxy.y == 0.0) {
                dxy = c_points[3].clone().sub(c_points[0]);
            }
        }

        self.setRayPoints(t_pt, dxy, on_pt, tangent);
    }



    stroke(path: PathBuilder, paint: Paint) {
        return this.strokeInner(path, paint.strokeWidth, paint.miterLimit, paint.lineCap, paint.lineJoin, this.res_scale)
    }
    strokeInner(path: PathBuilder,
        width: number,
        miterLimit: number,
        lineCap: LineCap,
        lineJoin: LineJoin,
        resScale: number) {
        const self = this;
        let inv_miter_limit = 0.0;
        if (lineJoin == LineJoin.Miter) {
            if (miterLimit <= 1) {
                lineJoin = LineJoin.Bevel;
            } else {
                inv_miter_limit = 1 / miterLimit;
            }
        }

        if (lineJoin == LineJoin.MiterClip) {
            inv_miter_limit = 1 / miterLimit
        }

        self.res_scale = resScale;
        // The '4' below matches the fill scan converter's error term.
        self.inv_res_scale = 1 / (resScale * 4.0);
        self.inv_res_scale_squared = (self.inv_res_scale ** 2);

        self.radius = width * 0.5;
        self.inv_miter_limit = inv_miter_limit;

        self.first_normal = Point.default();
        self.prev_normal = Point.default();
        self.first_unit_normal = Point.default();
        self.prev_unit_normal = Point.default();

        self.first_pt = Point.default();
        self.prev_pt = Point.default();

        self.first_outer_pt = Point.default();
        self.first_outer_pt_index_in_contour = 0;
        self.segment_count = -1;
        self.prev_is_line = false;

        self.capper = capFactory[lineCap];
        self.joiner = joinFactory[lineJoin];

        // Need some estimate of how large our final result (fOuter)
        // and our per-contour temp (fInner) will be, so we don't spend
        // extra time repeatedly growing these arrays.
        //
        // 1x for inner == 'wag' (worst contour length would be better guess)
        self.inner.clear();
        // self.inner.reserve(path.verbs.len(), path.points.len());

        // 3x for result == inner + outer + join (swag)
        self.outer.clear();
        // self.outer
        //     .reserve(path.verbs.len() * 3, path.points.len() * 3);

        self.cusper.clear();

        self.stroke_type = StrokeType.Outer;

        self.recursion_depth = 0;
        self.found_tangents = false;
        self.join_completed = false;

        let last_segment_is_line = false;
        let iter = path.segments();
        iter.setAutoClose(true);
        for (let d of iter) {
            switch (d.type) {
                case PathVerb.MoveTo:
                    self.moveTo(d.p0!);
                    break;
                case PathVerb.LineTo:
                    self.lineTo(d.p0!, iter);
                    last_segment_is_line = true;
                    break;
                case PathVerb.QuadTo:
                    self.quadraticCurveTo(d.p1!, d.p2!);
                    last_segment_is_line = false;
                    break;
                case PathVerb.CubicTo:
                    self.bezierCurveTo(d.p1!, d.p2!, d.p3!);
                    last_segment_is_line = false;
                    break;
                case PathVerb.Close:
                    if (lineCap != LineCap.Butt) {
                        // If the stroke consists of a moveTo followed by a close, treat it
                        // as if it were followed by a zero-length line. Lines without length
                        // can have square and round end caps.
                        if (self.hasOnlyMoveTo()) {
                            self.lineTo(self.moveToPt);
                            last_segment_is_line = true;
                            continue;
                        }

                        // If the stroke consists of a moveTo followed by one or more zero-length
                        // verbs, then followed by a close, treat is as if it were followed by a
                        // zero-length line. Lines without length can have square & round end caps.
                        if (self.isCurrentContourEmpty()) {
                            last_segment_is_line = true;
                            continue;
                        }
                    }

                    self.close(last_segment_is_line);
                    break;

            }
        }

        return self.finish(last_segment_is_line)
    }
    finish(is_line: boolean) {
        this.finishContour(false, is_line);

        // Swap out the outer builder.
        let buf = this.outer.clone()
        return buf.finish()
    }

    hasOnlyMoveTo() {
        return this.segment_count == 0
    }

    isCurrentContourEmpty() {
        return this.inner.isZeroLengthSincePoint(0)
            && this
                .outer
                .isZeroLengthSincePoint(this.first_outer_pt_index_in_contour)
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