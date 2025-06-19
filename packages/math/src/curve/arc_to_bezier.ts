
// 椭圆弧转贝塞尔曲线
//https://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes

import { Matrix2D } from "../math/mat2d";
import { Vector2 } from "../math/vec2";

// https://pomax.github.io/bezierinfo/index.html#splitting
interface Point {
    x: number;
    y: number;
}
//椭圆弧上的任意一点 ( x ,  y ) 都可以用二维矩阵方程描述：
function pointOnEllipse(cx: number, cy: number, rx: number, ry: number, xAxisRotation: number, theta: number) {
    const thetaCos = Math.cos(xAxisRotation);
    const thetaSin = Math.sin(xAxisRotation);
    const alphaCos = Math.cos(theta);
    const alphaSin = Math.sin(theta);

    return {
        x: cx + rx * thetaCos * alphaCos - ry * thetaSin * alphaSin,
        y: cy + rx * thetaSin * alphaCos + ry * thetaCos * alphaSin,
    }
}
function rotatePoint(x: number, y: number, radian: number, cx: number = 0, cy: number = 0) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);


    return {
        x: cx + x * cos - y * sin,
        y: cy + x * sin + y * cos,
    }
}
function cross(u: number[], v: number[]) {
    return u[0] * v[1] - u[1] * v[0];
}
function dot(u: number[], v: number[]) {
    return u[0] * v[0] + u[1] * v[1];
}
// 一般来说，两个向量 ( u x ,  u y ) 和 ( v x ,  v y ) 之间的角度可以计算为
function vectorAngle(u: number[], v: number[]) {
    // 这里出现的 ± 符号是u x  v y  −  u y  v x的符号 。
    const sign = cross(u, v) < 0 ? -1 : 1
    let cos = dot(u, v) / (Math.sqrt(dot(u, u)) * Math.sqrt(dot(v, v)))
    if (cos > 1) {
        cos = 1
    }
    if (cos < -1) {
        cos = -1
    }
    return sign * Math.acos(cos)
}

function vectorAngle2(u: number[], v: number[]) {
    return Math.atan2(cross(u, v), dot(u, v))
}

function mapToEllipse(curve: number[], rx: number, ry: number, cosphi: number, sinphi: number, centrex: number, centrey: number) {
    var x = curve[0] * rx
    var y = curve[1] * ry

    var xp = cosphi * x - sinphi * y
    var yp = sinphi * x + cosphi * y

    return [xp + centrex, yp + centrey]
}
function approxUnitArc(ang1: number, ang2: number) {
    var a = 4 / 3 * Math.tan(ang2 / 4)  // 4/3*(Math.sqrt(2)-1)

    var x1 = Math.cos(ang1)
    var y1 = Math.sin(ang1)
    var x2 = Math.cos(ang1 + ang2)
    var y2 = Math.sin(ang1 + ang2)

    return [
        [x1 - y1 * a, y1 + x1 * a],
        [x2 + y2 * a, y2 - x2 * a],
        [x2, y2]
    ]
}

// https://www.w3.org/TR/SVG/implnote.html#ArcConversionCenterToEndpoint
export function centerToEndPoint(cx: number, cy: number, rx: number, ry: number, xAxisRotateAngle: number, startAngle: number, sweepAngle: number) {
    xAxisRotateAngle = xAxisRotateAngle * Math.PI / 180

    const { x: x1, y: y1 } = pointOnEllipse(cx, cy, rx, ry, xAxisRotateAngle, (startAngle * Math.PI / 180))
    const { x: x2, y: y2 } = pointOnEllipse(cx, cy, rx, ry, xAxisRotateAngle, (startAngle + sweepAngle) * Math.PI / 180)

    const fa = Math.abs(sweepAngle) > 180 ? 1 : 0
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
// /https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
export function endPointToCenter(x1: number, y1: number, x2: number, y2: number, rx: number, ry: number, xAxisRotateAngle: number, fa: boolean | number, fs: boolean | number) {

    const phi = xAxisRotateAngle * Math.PI / 180

    // 计算( x 1 ′,  y 1 ′)
    let { x: x1p, y: y1p } = rotatePoint((x1 - x2) / 2, (y1 - y2) / 2, -phi);

    //修正超出范围的半径
    // 本节描述了超出范围的r x和r y所需的数学调整，如Path 实现说明中所述。从算法上讲，这些调整包括以下步骤：
    // 步骤 1：确保半径不为零
    if (rx == 0 || ry == 0) {
        throw '半径不能为0'
    }
    rx = Math.abs(rx);
    ry = Math.abs(ry);

    let x1pSq = x1p * x1p;
    let y1pSq = y1p * y1p;

    let rxSq = rx * rx;
    let rySq = ry * ry;

    let lambda = x1pSq / rxSq + y1pSq / rySq;
    if (lambda > 1) {
        lambda = Math.sqrt(lambda);
        rx *= lambda
        ry *= lambda
        rxSq = rx * rx;
        rySq = ry * ry;
    }
    //第 2 步：计算( cx ′ ,  cy ′ )
    // 如果f A  ≠  f S则选择 + 号，如果f A  =  f S则选择 − 号。
    const sign = fa == fs ? -1 : 1;
    const denominator = rxSq * y1pSq + rySq * x1pSq;
    const numerator = Math.max(rxSq * rySq - denominator, 0)

    const sqrtTerm = Math.sqrt(numerator / denominator);
    const cx1p = sign * sqrtTerm * (rx * y1p / ry)
    const cy1p = sign * sqrtTerm * -(ry * x1p / rx)
    //步骤 3：根据( c x ′,  c  y ′ ) 计算( c x , c y )
    const { x: cx, y: cy } = rotatePoint(cx1p, cy1p, phi, (x1 + x2) / 2, (y1 + y2) / 2);
    // 步骤 4：计算θ 1 和Δ θ

    const ux = (x1p - cx1p) / rx;
    const uy = (y1p - cy1p) / ry;
    const vx = (-x1p - cx1p) / rx;
    const vy = (-y1p - cy1p) / ry;

    let theta1 = vectorAngle2([1, 0], [ux, uy]);
    let deltaTheta = vectorAngle2([ux, uy], [vx, vy]);
    deltaTheta %= Math.PI * 2;
    //其中 Δ θ固定在 −360° < Δ θ  < 360° 范围内，因此：
    // 换句话说，如果f S  = 0 且 (等式 5.6) 的右侧大于 0，则减去 360°，而如果f S  = 1 且 (等式 5.6) 的右侧小于 0，则加上 360°。所有其他情况下，保持原样。
    //如果fS  = 0，则 Δθ <  0 ，
    if (!fs) {
        while (deltaTheta > 0) {
            deltaTheta -= Math.PI * 2;
        }
    }
    //否则，如果f S  = 1，则 Δ θ  > 0。
    if (fs) {
        while (deltaTheta < 0) {
            deltaTheta += Math.PI * 2;
        }
    }
    return {
        cx,
        cy,
        rx,
        ry,
        theta1,
        deltaTheta,
    }

}

// https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter

export function ellipseArcToCubicBezier(x1: number, y1: number, x2: number, y2: number, _rx: number, _ry: number, xAxisRotateAngle: number, fa: boolean | number, fs: boolean | number) {
    const phi = xAxisRotateAngle * Math.PI / 180;
    const { cx, cy, rx, ry, theta1, deltaTheta } = endPointToCenter(x1, y1, x2, y2, _rx, _ry, xAxisRotateAngle, fa, fs);

    const segments = Math.ceil(Math.abs(deltaTheta) / (Math.PI / 2));
    const delta = deltaTheta / segments;
    let currentTheta = theta1;

    const cubicBezierPoints: number[][] = []

    const cosphi = Math.cos(phi)
    const sinphi = Math.sin(phi)
    // 计算
    for (let i = 0; i < segments; i++) {
        const endTheta = currentTheta + delta;
        const curves = approxUnitArc(currentTheta, delta).map(d => {
            return mapToEllipse(d, rx, ry, cosphi, sinphi, cx, cy)
        }).flat()

        cubicBezierPoints.push([x1, y1].concat(curves))
        currentTheta = endTheta
        x1 = curves[curves.length - 2]
        y1 = curves[curves.length - 1]
    }

    return cubicBezierPoints
}
export function convertToCenterParameterization(
    x1: number, y1: number,
    x2: number, y2: number,
    rx: number, ry: number,
    phi: number,
    largeArcFlag: boolean | number,
    sweepFlag: boolean | number
): { cx: number, cy: number, rx: number, ry: number, theta1: number, deltaTheta: number } {
    const radPhi = phi * Math.PI / 180;
    const cosPhi = Math.cos(radPhi);
    const sinPhi = Math.sin(radPhi);

    const x1p = cosPhi * (x1 - x2) / 2 + sinPhi * (y1 - y2) / 2;
    const y1p = -sinPhi * (x1 - x2) / 2 + cosPhi * (y1 - y2) / 2;

    let rxSq = rx * rx;
    let rySq = ry * ry;
    const x1pSq = x1p * x1p;
    const y1pSq = y1p * y1p;

    let lambda = x1pSq / rxSq + y1pSq / rySq;
    if (lambda > 1) {
        const sqrtLambda = Math.sqrt(lambda);
        rx *= sqrtLambda;
        ry *= sqrtLambda;
        rxSq = rx * rx;
        rySq = ry * ry;
    }

    const numerator = rxSq * rySq - rxSq * y1pSq - rySq * x1pSq;
    const denominator = rxSq * y1pSq + rySq * x1pSq;

    if (denominator === 0) {
        throw new Error("Cannot process points with denominator zero.");
    }

    const sqrtTerm = Math.sqrt(numerator / denominator);
    const sign = largeArcFlag === sweepFlag ? -1 : 1;

    const cxp = sign * (rx * y1p / ry) * sqrtTerm;
    const cyp = sign * (-ry * x1p / rx) * sqrtTerm;

    const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
    const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;

    const ux = (x1p - cxp) / rx;
    const uy = (y1p - cyp) / ry;
    const vx = (-x1p - cxp) / rx;
    const vy = (-y1p - cyp) / ry;

    const theta1 = Math.atan2(uy, ux);
    const dot = ux * vx + uy * vy;
    const cross = ux * vy - uy * vx;
    let deltaTheta = Math.atan2(cross, dot);

    if (sweepFlag) {
        if (deltaTheta < 0) deltaTheta += 2 * Math.PI;
    } else {
        if (deltaTheta > 0) deltaTheta -= 2 * Math.PI;
    }

    return { cx, cy, rx, ry, theta1, deltaTheta };
}

export function ellipseArcToCubic(
    x1: number, y1: number,
    x2: number, y2: number,
    radiusX: number, radiusY: number,
    axisAngle: number,
    largeArc: number | boolean,
    sweepClockwise: number | boolean
): Point[][] {
    const largeArcFlag = typeof largeArc === 'number' ? largeArc !== 0 : largeArc;
    const sweepFlag = typeof sweepClockwise === 'number' ? sweepClockwise !== 0 : sweepClockwise;

    // 处理轴旋转
    const phi = axisAngle * Math.PI / 180;
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);

    // 将端点转换到未旋转坐标系
    const dx = (x1 - x2) / 2;
    const dy = (y1 - y2) / 2;
    const x1_ = cosPhi * dx + sinPhi * dy;
    const y1_ = -sinPhi * dx + cosPhi * dy;

    // 修正半径（确保满足数学约束）
    const lambda = (x1_ ** 2) / (radiusX ** 2) + (y1_ ** 2) / (radiusY ** 2);
    if (lambda > 1) {
        const sqrtLambda = Math.sqrt(lambda);
        radiusX *= sqrtLambda;
        radiusY *= sqrtLambda;
    }

    // 计算中心参数化
    const sign = (largeArcFlag === sweepFlag) ? -1 : 1;

    const denominator = (radiusX ** 2 * y1_ ** 2) + (radiusY ** 2 * x1_ ** 2);
    const numerator = (radiusX ** 2 * radiusY ** 2)
        - (radiusX ** 2 * y1_ ** 2)
        - (radiusY ** 2 * x1_ ** 2);
    const sqrtTerm = Math.sqrt(Math.max(0, numerator) / denominator);

    const cx_ = sign * (radiusX * y1_ / radiusY) * sqrtTerm;
    const cy_ = sign * (-radiusY * x1_ / radiusX) * sqrtTerm;

    // 转换回旋转坐标系
    const cx = cosPhi * cx_ - sinPhi * cy_ + (x1 + x2) / 2;
    const cy = sinPhi * cx_ + cosPhi * cy_ + (y1 + y2) / 2;

    // 计算角度参数
    const vectorAngle = (ux: number, uy: number) => {
        const angle = Math.atan2(uy, ux);
        return angle < 0 ? angle + 2 * Math.PI : angle;
    };
    // 应用旋转和平移
    const transform = (p: Point): Point => ({
        x: cosPhi * p.x - sinPhi * p.y + cx,
        y: sinPhi * p.x + cosPhi * p.y + cy
    });
    const ux = (x1_ - cx_) / radiusX;
    const uy = (y1_ - cy_) / radiusY;
    const vx = (-x1_ - cx_) / radiusX;
    const vy = (-y1_ - cy_) / radiusY;

    const theta1 = vectorAngle(ux, uy);
    let deltaTheta = vectorAngle(vx, vy) - theta1;

    if (sweepFlag) {
        while (deltaTheta < 0) deltaTheta += 2 * Math.PI;
    } else {
        while (deltaTheta > 0) deltaTheta -= 2 * Math.PI;
    }

    // 分割圆弧为贝塞尔曲线段
    const segments: Point[][] = [];
    const numSegments = Math.ceil(Math.abs(deltaTheta) / (Math.PI / 2));
    const delta = deltaTheta / numSegments;

    for (let i = 0; i < numSegments; i++) {
        const start = theta1 + i * delta;
        const end = start + delta;

        // 计算贝塞尔控制点
        const alpha = 4 / 3 * Math.tan(delta / 4);

        const cosStart = Math.cos(start);
        const sinStart = Math.sin(start);
        const cosEnd = Math.cos(end);
        const sinEnd = Math.sin(end);

        // 局部控制点（未旋转）
        const p0 = { x: radiusX * cosStart, y: radiusY * sinStart };
        const p1 = {
            x: radiusX * (cosStart - alpha * sinStart),
            y: radiusY * (sinStart + alpha * cosStart)
        };
        const p2 = {
            x: radiusX * (cosEnd + alpha * sinEnd),
            y: radiusY * (sinEnd - alpha * cosEnd)
        };
        const p3 = { x: radiusX * cosEnd, y: radiusY * sinEnd };

        segments.push([
            transform(p0),
            transform(p1),
            transform(p2),
            transform(p3)
        ]);
    }

    return segments;
}



/**
 * 辅助函数：计算椭圆上给定角度 theta（弧度）处的点，
 * 参数：中心(cx, cy)，半径(rx, ry)，旋转角(rotation)（弧度）
 */
function pointOnEllipse2(cx: number, cy: number, rx: number, ry: number, rotation: number, theta: number): Point {
    const cosRot = Math.cos(rotation);
    const sinRot = Math.sin(rotation);
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);
    const x = cx + rx * cosT * cosRot - ry * sinT * sinRot;
    const y = cy + rx * cosT * sinRot + ry * sinT * cosRot;
    return Vector2.create(x, y);
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
 * 辅助函数：将椭圆弧的一段（从 theta1 到 theta2）转换为一个三次贝塞尔曲线段
 * 返回一个长度为6的数组：[cp1x, cp1y, cp2x, cp2y, endX, endY]
 */
export function ellipticalArcSegmentToCubic(
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


export function ellipseArc(x1: number, y1: number, x2: number, y2: number,
    _rx: number, _ry: number, xAxisRotation: number,
    largeArcFlag: number, sweepFlag: number) {

    // 转换 A 命令为若干个 cubic 贝塞尔曲线段
    let curves = arcToCubicCurves(x1, y1, x2, y2, _rx, _ry, xAxisRotation, largeArcFlag, sweepFlag);
    const bezierCurves: number[][] = []
    for (const curve of curves) {
        bezierCurves.push([curve[2], curve[3], curve[4], curve[5], curve[6], curve[7]])
    }
    return bezierCurves
}


export function ellipseArc2(x1: number, y1: number, x2: number, y2: number,
    _rx: number, _ry: number, xAxisRotation: number,
    largeArcFlag: number, sweepFlag: number) {
    const { cx, cy, rx, ry, theta1, deltaTheta } = endPointToCenter(x1, y1, x2, y2, _rx, _ry, xAxisRotation, largeArcFlag, sweepFlag)

    const segments = Math.ceil(Math.abs(deltaTheta) / (Math.PI / 2))
    const delta = deltaTheta / segments
    let startTheta = theta1

    const pointTransform = Matrix2D.fromRotate(xAxisRotation)
    pointTransform.preScale(rx, ry)

   // const beiers = ellipseArcToCubicBezier(x1, y1, x2, y2, _rx, _ry, xAxisRotation, largeArcFlag, sweepFlag)
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


        p0.scale(rx, ry).rotate(xAxisRotation).translate(cx, cy)
        p1.scale(rx, ry).rotate(xAxisRotation).translate(cx, cy)
        p2.scale(rx, ry).rotate(xAxisRotation).translate(cx, cy)
        p3.scale(rx, ry).rotate(xAxisRotation).translate(cx, cy)



        // p0.applyMatrix2D(pointTransform).translate(cx,cy)                   
        // p1.applyMatrix2D(pointTransform).translate(cx,cy)
        // p2.applyMatrix2D(pointTransform).translate(cx,cy)
        // p3.applyMatrix2D(pointTransform).translate(cx,cy)
        //this.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y)
        startTheta = endTheta
    }

   // return this
}