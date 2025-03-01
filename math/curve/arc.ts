import {ellipseArcToCubic,ellipseArcToCubicBezier} from '../curve/arc_to_bezier'

const dot = (u, v) => {
    return u[0] * v[0] + u[1] * v[1]
}
const cross = (u, v) => {
    return u[0] * v[1] - u[1] * v[0]
}
const angleTo = (u, v) => {
    //  let sign = Math.sign(cross(u, v))
    // return sign * Math.acos(dot(u, v) / (length(u) * length(v)))
    return Math.atan2(cross(u, v), dot(u, v));
}
//https://www.w3.org/TR/SVG/implnote.html#ArcConversionCenterToEndpoint

// 中心点坐标转终点坐标

export function center_to_endpoint(cx: number, cy: number, rx: number, ry: number, phi: number, startAngle: number, deltaAngle: number) {

    let PI2 = Math.PI * 2
    // 避免精度误差，由于js精度不够，所以添加一个近似最小误差
    if (deltaAngle === 0) {
        deltaAngle = 1e-6
    }
    if (deltaAngle === PI2) {
        deltaAngle = PI2 - 1e-6
    }
    let cos_phi = Math.cos(phi), sin_phi = Math.sin(phi)
    let x1 = cos_phi * rx * Math.cos(startAngle) - sin_phi * ry * Math.sin(startAngle) + cx;
    let y1 = sin_phi * rx * Math.cos(startAngle) + cos_phi * ry * Math.sin(startAngle) + cy;

    let x2 = cos_phi * rx * Math.cos(startAngle + deltaAngle) - sin_phi * ry * Math.sin(startAngle + deltaAngle) + cx;
    let y2 = sin_phi * rx * Math.cos(startAngle + deltaAngle) + cos_phi * ry * Math.sin(startAngle + deltaAngle) + cy;

    let fa = Math.abs(deltaAngle) > Math.PI ? 1 : 0
    let fs = deltaAngle > 0 ? 1 : 0
    return {
        x1,
        y1,
        x2,
        y2,
        fa,//是大弧标志，如果选择跨度小于或等于 180 度的弧，则为 0，如果选择跨度大于 180 度的弧，则为 1。
        fs //是扫描标志，如果连接中心和圆弧的线扫描的角度减小，则为 0，如果扫描的角度增加，则为 1。
    }
}

// 可借鉴:scripts\graphics\3DGraphics\three.js\r171\examples\jsm\loaders\SVGLoader.js
// 
export function endpoint_to_center(x1: number, y1: number, x2: number, y2: number, fa: boolean | number, fs: boolean | number, rx: number, ry: number, phi: number) {
    let phi_cos = Math.cos(phi), phi_sin = Math.sin(phi)
    let xp1 = phi_cos * (x1 - x2) / 2 + phi_sin * (y1 - y2) / 2
    let yp1 = -phi_sin * (x1 - x2) / 2 + phi_cos * (y1 - y2) / 2

    //  修正半径
    let lambda = (xp1 * xp1) / (rx * rx) + (yp1 * yp1) / (ry * ry);
    if (lambda > 1) {
        lambda = Math.sqrt(lambda);
        rx *= lambda;
        ry *= lambda;
    }
    let fsign = fa !== fs ? 1 : -1
    let c1 = (rx * rx * ry * ry - rx * rx * yp1 * yp1 - ry * ry * xp1 * xp1) / (rx * rx * yp1 * yp1 + ry * ry * xp1 * xp1);
    if (c1 < 0) {	// because of floating point inaccuracies, c1 can be -epsilon.
        c1 = 0;
    } else {
        c1 = Math.sqrt(c1);
    }
    let cxp1 = fsign * c1 * (rx * yp1 / ry)
    let cyp1 = fsign * c1 * (-ry * xp1 / rx)

    let cx = phi_cos * cxp1 - phi_sin * cyp1 + (x1 + x2) / 2
    let cy = phi_sin * cxp1 + phi_cos * cyp1 + (y1 + y2) / 2


    let theta1 = angleTo([1, 0], [(xp1 - cxp1) / rx, (yp1 - cyp1) / ry])
    let dtheta = angleTo([(xp1 - cxp1) / rx, (yp1 - cyp1) / ry], [(-xp1 - cxp1) / rx, (-yp1 - cyp1) / ry])

    if (!fs && dtheta > 0) {
        dtheta -= Math.PI * 2
    }
    else if (fs && dtheta < 0) {
        dtheta += Math.PI * 2
    }
    let theta2 = theta1 + dtheta
    return {
        rx,
        ry,
        cx,
        cy,
        theta1,// 是拉伸和旋转操作之前椭圆弧的起始角度。
        theta2,// 是拉伸和旋转操作之前椭圆弧的终止角度。
        dtheta // 是这两个角度之间的差值。
    }
}

function angle(ux, uy, vx, vy) {
    return Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
}

export function endpoint_to_center2(x1, y1, x2, y2,
    fA, fS, outPr, phi, outCenter, outTheta) {
    const M_PI = Math.PI
    const cos = Math.cos, sin = Math.sin, sqrt = Math.sqrt
    let prx = outPr[0], pry = outPr[1], cx = outCenter[0], cy = outCenter[1], theta1 = outTheta[0], dtheta = outTheta[1]
    let x1p, y1p, rx, ry, lambda, fsgn, c1, cxp, cyp;

    x1p = cos(phi) * (x1 - x2) / 2 + sin(phi) * (y1 - y2) / 2;
    y1p = -sin(phi) * (x1 - x2) / 2 + cos(phi) * (y1 - y2) / 2;

    rx = prx;
    ry = pry;

    lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
    if (lambda > 1) {
        lambda = sqrt(lambda);
        rx *= lambda;
        ry *= lambda;
        prx = rx;
        pry = ry;
    }

    fA = !!fA;
    fS = !!fS;

    fsgn = (fA != fS) ? 1 : -1;

    c1 = (rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p) / (rx * rx * y1p * y1p + ry * ry * x1p * x1p);

    if (c1 < 0)	// because of floating point inaccuracies, c1 can be -epsilon.
        c1 = 0;
    else
        c1 = sqrt(c1);

    cxp = fsgn * c1 * (rx * y1p / ry);
    cyp = fsgn * c1 * (-ry * x1p / rx);

    cx = cos(phi) * cxp - sin(phi) * cyp + (x1 + x2) / 2;
    cy = sin(phi) * cxp + cos(phi) * cyp + (y1 + y2) / 2;

    theta1 = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);

    dtheta = angle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);

    if (!fS && dtheta > 0) {
        dtheta -= 2 * M_PI;
    }
    else if (fS && dtheta < 0) {
        dtheta += 2 * M_PI;
    }
    outPr[0] = prx;
    outPr[1] = pry
    outCenter[0] = cx;
    outCenter[1] = cy
    outTheta[0] = theta1
    outTheta[1] = dtheta
}
// 来自:three.js\examples\jsm\loaders\SVGLoader.js
export function parseArcCommand(path, rx, ry, x_axis_rotation, large_arc_flag, sweep_flag, start, end) {

    if (rx == 0 || ry == 0) {

        // draw a line if either of the radii == 0
        path.lineTo(end.x, end.y);
        return;

    }

    x_axis_rotation = x_axis_rotation * Math.PI / 180;

    // Ensure radii are positive
    rx = Math.abs(rx);
    ry = Math.abs(ry);

    // Compute (x1', y1')
    const dx2 = (start.x - end.x) / 2.0;
    const dy2 = (start.y - end.y) / 2.0;
    const x1p = Math.cos(x_axis_rotation) * dx2 + Math.sin(x_axis_rotation) * dy2;
    const y1p = - Math.sin(x_axis_rotation) * dx2 + Math.cos(x_axis_rotation) * dy2;

    // Compute (cx', cy')
    let rxs = rx * rx;
    let rys = ry * ry;
    const x1ps = x1p * x1p;
    const y1ps = y1p * y1p;

    // Ensure radii are large enough
    const cr = x1ps / rxs + y1ps / rys;

    if (cr > 1) {

        // scale up rx,ry equally so cr == 1
        const s = Math.sqrt(cr);
        rx = s * rx;
        ry = s * ry;
        rxs = rx * rx;
        rys = ry * ry;

    }

    const dq = (rxs * y1ps + rys * x1ps);
    const pq = (rxs * rys - dq) / dq;
    let q = Math.sqrt(Math.max(0, pq));
    if (large_arc_flag === sweep_flag) q = - q;
    const cxp = q * rx * y1p / ry;
    const cyp = - q * ry * x1p / rx;

    // Step 3: Compute (cx, cy) from (cx', cy')
    const cx = Math.cos(x_axis_rotation) * cxp - Math.sin(x_axis_rotation) * cyp + (start.x + end.x) / 2;
    const cy = Math.sin(x_axis_rotation) * cxp + Math.cos(x_axis_rotation) * cyp + (start.y + end.y) / 2;

    // Step 4: Compute θ1 and Δθ
    const theta = svgAngle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
    const delta = svgAngle((x1p - cxp) / rx, (y1p - cyp) / ry, (- x1p - cxp) / rx, (- y1p - cyp) / ry) % (Math.PI * 2);

    path.currentPath.absellipse(cx, cy, rx, ry, theta, theta + delta, sweep_flag === 0, x_axis_rotation);

}

function svgAngle(ux, uy, vx, vy) {

    const dot = ux * vx + uy * vy;
    const len = Math.sqrt(ux * ux + uy * uy) * Math.sqrt(vx * vx + vy * vy);
    let ang = Math.acos(Math.max(- 1, Math.min(1, dot / len))); // floating point precision, slightly over values appear
    if ((ux * vy - uy * vx) < 0) ang = - ang;
    return ang;

}


/**
 * 将椭圆弧的中心参数转换为端点参数
 *
 * @param {number} cx - 椭圆中心 x 坐标
 * @param {number} cy - 椭圆中心 y 坐标
 * @param {number} rx - 椭圆 x 轴半径
 * @param {number} ry - 椭圆 y 轴半径
 * @param {number} phi - 椭圆旋转角（单位：弧度）
 * @param {number} theta1 - 起始角（单位：弧度）
 * @param {number} theta2 - 终止角（单位：弧度）
 * @returns {Object} 包含起点 (x1, y1) 和终点 (x2, y2)
 */
export function arcCenterToEndpoint(cx, cy, rx, ry, phi, theta1, theta2) {
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);

    // 计算起点坐标
    const x1 = cx + rx * Math.cos(theta1) * cosPhi - ry * Math.sin(theta1) * sinPhi;
    const y1 = cy + rx * Math.cos(theta1) * sinPhi + ry * Math.sin(theta1) * cosPhi;

    // 计算终点坐标
    const x2 = cx + rx * Math.cos(theta2) * cosPhi - ry * Math.sin(theta2) * sinPhi;
    const y2 = cy + rx * Math.cos(theta2) * sinPhi + ry * Math.sin(theta2) * cosPhi;

    return { x1, y1, x2, y2 };
}

/**
 * 将椭圆弧的终点参数转换为中心参数
 *
 * @param {number} x1 - 起点 x 坐标
 * @param {number} y1 - 起点 y 坐标
 * @param {number} x2 - 终点 x 坐标
 * @param {number} y2 - 终点 y 坐标
 * @param {number} rx - 椭圆 x 轴半径
 * @param {number} ry - 椭圆 y 轴半径
 * @param {number} phi - 椭圆旋转角（单位：弧度）
 * @param {number|boolean} largeArcFlag - 大弧标志（true/1 表示大弧，false/0 表示小弧）
 * @param {number|boolean} sweepFlag - 顺时针标志（true/1 表示顺时针，false/0 表示逆时针）
 * @returns {Object} 包含椭圆中心 (cx, cy)、起始角 theta1（弧度）和弧度 deltaTheta（弧度）
 */
export function arcEndpointToCenter2(x1: number, y1: number, x2: number, y2: number, rx: number, ry: number, phi: number, largeArcFlag: number | boolean, sweepFlag: number | boolean) {
    // 将 largeArcFlag 和 sweepFlag 转换为布尔值
    largeArcFlag = !!largeArcFlag;
    sweepFlag = !!sweepFlag;

    // Step 1: 将起点与终点转换到旋转后的坐标系中
    const dx = (x1 - x2) / 2;
    const dy = (y1 - y2) / 2;
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);
    const x1p = cosPhi * dx + sinPhi * dy;
    const y1p = -sinPhi * dx + cosPhi * dy;

    // Step 2: 检查是否需要缩放 rx, ry
    let rxSq = rx * rx;
    let rySq = ry * ry;
    const x1pSq = x1p * x1p;
    const y1pSq = y1p * y1p;
    let lambda = x1pSq / rxSq + y1pSq / rySq;
    if (lambda > 1) {
        const factor = Math.sqrt(lambda);
        rx *= factor;
        ry *= factor;
        rxSq = rx * rx;
        rySq = ry * ry;
    }

    // Step 3: 计算变换后中心 (cx', cy')
    // 符号的选择依据：若 largeArcFlag 与 sweepFlag 相同则取负，否则取正
    const sign = (largeArcFlag === sweepFlag) ? -1 : 1;
    let numerator = rxSq * rySq - rxSq * y1pSq - rySq * x1pSq;
    // 由于浮点运算误差，确保分子非负
    numerator = numerator < 0 ? 0 : numerator;
    const coef = sign * Math.sqrt(numerator / (rxSq * y1pSq + rySq * x1pSq));

    const cxp = coef * (rx * y1p / ry);
    const cyp = coef * (-ry * x1p / rx);

    // Step 4: 将中心点反变换回原坐标系
    const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
    const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;

    // Step 5: 计算起始角 theta1 和弧度 deltaTheta
    // 单位向量：((x1p - cxp)/rx, (y1p - cyp)/ry)
    const ux = (x1p - cxp) / rx;
    const uy = (y1p - cyp) / ry;
    let theta1 = Math.atan2(uy, ux);

    // 计算第二个单位向量：((-x1p - cxp)/rx, (-y1p - cyp)/ry)
    const vx = (-x1p - cxp) / rx;
    const vy = (-y1p - cyp) / ry;
    let deltaTheta = Math.atan2(vy, vx) - theta1;

    // 将 deltaTheta 归一到 (-π, π] 区间
    while (deltaTheta > Math.PI) {
        deltaTheta -= 2 * Math.PI;
    }
    while (deltaTheta < -Math.PI) {
        deltaTheta += 2 * Math.PI;
    }

    // 根据 sweepFlag 调整 deltaTheta 的正负
    if (!sweepFlag && deltaTheta > 0) {
        deltaTheta -= 2 * Math.PI;
    } else if (sweepFlag && deltaTheta < 0) {
        deltaTheta += 2 * Math.PI;
    }

    return { cx, cy, rx, ry, theta1, deltaTheta };
}


interface Point {
    x: number;
    y: number;
}

interface ArcParams {
    rx: number;
    ry: number;
    xAxisRotation: number;
    largeArcFlag: boolean;
    sweepFlag: boolean;
    end: Point;
}

interface CenterParams {
    center: Point;
    rx: number;
    ry: number;
    startAngle: number;
    deltaAngle: number;
    xAxisRotation: number;
}

// 端点参数转中心参数
export function arcEndpointToCenter(
    start: Point,
    end: Point,
    rx: number,
    ry: number,
    xAxisRotation: number,
    largeArcFlag: boolean | number,
    sweepFlag: boolean | number
): CenterParams {
    // 确保半径有效
    rx = Math.abs(rx);
    ry = Math.abs(ry);

    const cosφ = Math.cos(xAxisRotation);
    const sinφ = Math.sin(xAxisRotation);

    // 坐标转换（旋转到非倾斜坐标系）
    const x1p = (cosφ * (start.x - end.x)) / 2 + (sinφ * (start.y - end.y)) / 2;
    const y1p = (-sinφ * (start.x - end.x)) / 2 + (cosφ * (start.y - end.y)) / 2;

    // 修正无效半径
    const lambda = (x1p ** 2) / (rx ** 2) + (y1p ** 2) / (ry ** 2);
    if (lambda > 1) {
        rx *= Math.sqrt(lambda);
        ry *= Math.sqrt(lambda);
    }

    // 计算中心点参数
    const sign = largeArcFlag === sweepFlag ? -1 : 1;
    const denominator = rx ** 2 * y1p ** 2 + ry ** 2 * x1p ** 2;
    const numerator = Math.max(0,rx ** 2 * ry ** 2 - denominator)

    const c = sign * Math.sqrt(Math.max(0, numerator / denominator));

    const cxp = (c * rx * y1p) / ry;
    const cyp = (c * -ry * x1p) / rx;

    // 转换回原始坐标系
    const center = {
        x: cosφ * cxp - sinφ * cyp + (start.x + end.x) / 2,
        y: sinφ * cxp + cosφ * cyp + (start.y + end.y) / 2
    };

    // 计算起始和结束角度
    let startAngle = angle2(
        { x: 1, y: 0 },
        { x: (x1p - cxp) / rx, y: (y1p - cyp) / ry },
    );

    let deltaAngle = angle2(
        { x: (x1p - cxp) / rx, y: (y1p - cyp) / ry },
        { x: (-x1p - cxp) / rx, y: (-y1p - cyp) / ry }
    );
    if (!largeArcFlag && deltaAngle > 0) {
        deltaAngle -= 2 * Math.PI;
    }
    else if (largeArcFlag && deltaAngle < 0) {
        deltaAngle += 2 * Math.PI;
    }

    return {
        center,
        rx,
        ry,
        startAngle,
        deltaAngle,
        xAxisRotation
    };
}

// 辅助函数：计算向量间角度
function angle2(u: Point, v: Point): number {
    const sign = u.x * v.y - u.y * v.x < 0 ? -1 : 1;
    const cos=
    (u.x * v.x + u.y * v.y) /
    (Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y))
    return sign * Math.acos(Math.min(1,Math.max(-1,cos)))
}

// 将椭圆弧转换为贝塞尔曲线段
export function arcToBezier(
    start: Point,
    arcParams: ArcParams
): Point[][] {
    const { rx, ry, xAxisRotation, largeArcFlag, sweepFlag, end } = arcParams;
    const centerParams = arcEndpointToCenter(
        start,
        end,
        rx,
        ry,
        xAxisRotation,
        largeArcFlag,
        sweepFlag
    );

    const curves: Point[][] = [];
    const count = Math.ceil(Math.abs(centerParams.deltaAngle) / (Math.PI / 2));
    const delta = centerParams.deltaAngle / count;

    let currentAngle = centerParams.startAngle;
    let currentPoint = getPointOnEllipse(
        centerParams.center,
        centerParams.rx,
        centerParams.ry,
        centerParams.xAxisRotation,
        currentAngle
    );

    for (let i = 0; i < count; i++) {
        const nextAngle = currentAngle + delta;
        const nextPoint = getPointOnEllipse(
            centerParams.center,
            centerParams.rx,
            centerParams.ry,
            centerParams.xAxisRotation,
            nextAngle
        );

        const controlPoints = getArcSegmentBezierControlPoints(
            currentAngle,
            delta,
            centerParams
        );

        curves.push(
            [currentPoint
            ,controlPoints[0],
            controlPoints[1],
            nextPoint]
        );

        currentAngle = nextAngle;
        currentPoint = nextPoint;
    }

    return curves;
}

// 获取椭圆上某点的坐标
function getPointOnEllipse(
    center: Point,
    rx: number,
    ry: number,
    φ: number,
    θ: number
): Point {
    const cosφ = Math.cos(φ);
    const sinφ = Math.sin(φ);
    const cosθ = Math.cos(θ);
    const sinθ = Math.sin(θ);

    
    return {
        x: center.x + rx * cosθ * cosφ - ry * sinθ * sinφ,
        y: center.y + rx * cosθ * sinφ + ry * sinθ * cosφ
    };
}

// 获取贝塞尔控制点参数
function getArcSegmentBezierControlPoints(
    θ: number,
    Δθ: number,
    center: CenterParams
): [Point, Point] {
    const α = Math.tan(Δθ / 2);
    const sinθ = Math.sin(θ);
    const cosθ = Math.cos(θ);
    const sinΔθ = Math.sin(θ + Δθ);
    const cosΔθ = Math.cos(θ + Δθ);

    // 计算控制点比例因子
    // k=4/3*(Math.sqrt(2)-1)=4/3*(Math.tan(PI/8))
    const k =4/3 * Math.tan(Δθ / 4);//(4 / 3) * α / (1 + Math.sqrt(1 + 3 * α ** 2));

    // 计算中间控制点
    const cp1 = {
        x: center.rx * (cosθ - k * sinθ),
        y: center.ry * (sinθ + k * cosθ)
    };

    const cp2 = {
        x: center.rx * (cosΔθ + k * sinΔθ),
        y: center.ry * (sinΔθ - k * cosΔθ)
    };

    // 应用旋转和平移
    return [
        rotateAndTranslate(cp1, center.xAxisRotation, center.center),
        rotateAndTranslate(cp2, center.xAxisRotation, center.center)
    ];
}

// 旋转和平移点
function rotateAndTranslate(
    point: Point,
    φ: number,
    center: Point
): Point {
    const cosφ = Math.cos(φ);
    const sinφ = Math.sin(φ);

    return {
        x: center.x + point.x * cosφ - point.y * sinφ,
        y: center.y + point.x * sinφ + point.y * cosφ
    };
}

// 新增中心参数转端点参数方法
export function arcCenterToEndpoint2(
    start: Point,         // 已知的起点坐标
    center: Point,        // 椭圆中心坐标
    rx: number,           // 椭圆 x 半径
    ry: number,           // 椭圆 y 半径
    xAxisRotation: number,// 旋转角度（弧度）
    startAngle: number,   // 起始角度（弧度）
    deltaAngle: number    // 角度增量（弧度）
): ArcParams {
    // 计算终点坐标
    const endAngle = startAngle + deltaAngle;
    const end = getPointOnEllipse(center, rx, ry, xAxisRotation, endAngle);

    // 计算大弧标志位（角度差绝对值是否超过 π）
    const largeArcFlag = Math.abs(deltaAngle) > Math.PI;

    // 计算方向标志位（角度增量符号）
    const sweepFlag = deltaAngle > 0;

    // 自动修正半径（确保符合规范要求）
    const [finalRx, finalRy] = adjustRadius(start, end, rx, ry, xAxisRotation);

    return {
        rx: finalRx,
        ry: finalRy,
        xAxisRotation: xAxisRotation * 180 / Math.PI, // 转换为度数
        largeArcFlag,
        sweepFlag,
        end
    };
}

// 辅助方法：调整半径至有效值
function adjustRadius(
    start: Point,
    end: Point,
    rx: number,
    ry: number,
    phi: number
): [number, number] {
    // 转换为非旋转坐标系
    const cosφ = Math.cos(phi);
    const sinφ = Math.sin(phi);

    // 计算转换后的坐标差
    const x1p = (cosφ * (start.x - end.x)) / 2 + (sinφ * (start.y - end.y)) / 2;
    const y1p = (-sinφ * (start.x - end.x)) / 2 + (cosφ * (start.y - end.y)) / 2;

    // 计算 lambda 系数
    const lambda = (x1p ** 2) / (rx ** 2) + (y1p ** 2) / (ry ** 2);

    // 自动放大半径以满足规范要求
    if (lambda > 1) {
        rx *= Math.sqrt(lambda);
        ry *= Math.sqrt(lambda);
    }

    return [rx, ry];
}

// 在现有代码中补充类型定义：
interface ArcParams {
    rx: number;
    ry: number;
    xAxisRotation: number; // 这里实际存储的是度数
    largeArcFlag: boolean;
    sweepFlag: boolean;
    end: Point;
}


export class Arc {
    private rx: number;
    private ry: number;
    private xAxisRotation: number;
    private largeArcFlag: number;
    private sweepFlag: number;
    private x1: number;
    private y1: number;
    private x2: number;
    private y2: number;

    constructor(
        rx: number,
        ry: number,
        xAxisRotation: number,
        largeArcFlag: number,
        sweepFlag: number,
        x1: number,
        y1: number,
        x2: number,
        y2: number
    ) {
        this.rx = Math.abs(rx);
        this.ry = Math.abs(ry);
        this.xAxisRotation = xAxisRotation * Math.PI / 180; // 转换为弧度
        this.largeArcFlag = largeArcFlag ? 1 : 0;
        this.sweepFlag = sweepFlag ? 1 : 0;
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }

    private getCenter(): { cx: number; cy: number;rx:number,ry:number; theta1: number; deltaTheta: number } {
        let x1 = this.x1;
        let y1 = this.y1;
        let x2 = this.x2;
        let y2 = this.y2;
        let rx = this.rx;
        let ry = this.ry;
        let phi = this.xAxisRotation;
        let fA = this.largeArcFlag;
        let fS = this.sweepFlag;

        // 确保 rx, ry 非负
        rx = Math.abs(rx);
        ry = Math.abs(ry);

        // 计算中间点和差值
        let dx = (x1 - x2) / 2;
        let dy = (y1 - y2) / 2;
        let x1p = Math.cos(phi) * dx + Math.sin(phi) * dy;
        let y1p = -Math.sin(phi) * dx + Math.cos(phi) * dy;

        // 确保 rx, ry 足够大
        let rxsq = rx * rx;
        let rysq = ry * ry;
        let x1psq = x1p * x1p;
        let y1psq = y1p * y1p;
        let lambda = (x1psq / rxsq) + (y1psq / rysq);
        if (lambda > 1) {
            let lambdaSqrt = Math.sqrt(lambda);
            rx *= lambdaSqrt;
            ry *= lambdaSqrt;
            rxsq = rx * rx;
            rysq = ry * ry;
        }

        // 计算分母
        let sign = fA === fS ? -1 : 1;
        let sq = ((rxsq * rysq) - (rxsq * y1psq) - (rysq * x1psq)) / ((rxsq * y1psq) + (rysq * x1psq));
        sq = sq < 0 ? 0 : sq;
        let coef = sign * Math.sqrt(sq);
        let cxp = coef * (rx * y1p / ry);
        let cyp = coef * -(ry * x1p / rx);

        // 转换回原坐标系
        let cx = Math.cos(phi) * cxp - Math.sin(phi) * cyp + (x1 + x2) / 2;
        let cy = Math.sin(phi) * cxp + Math.cos(phi) * cyp + (y1 + y2) / 2;

        // 计算角度
        let theta1 = Math.atan2((y1p - cyp) / ry, (x1p - cxp) / rx);
        let theta2 = Math.atan2((-y1p - cyp) / ry, (-x1p - cxp) / rx);
        let deltaTheta = theta2 - theta1;
        if (deltaTheta < 0 && fS === 1) deltaTheta += 2 * Math.PI;
        else if (deltaTheta > 0 && fS === 0) deltaTheta -= 2 * Math.PI;

        return { cx, cy,rx,ry, theta1, deltaTheta };
    }

    private getBezierSegments(){
        let { cx, cy,rx,ry, theta1, deltaTheta } = this.getCenter();
        let segments:number[][] = [];
     
        let phi = this.xAxisRotation;


        // 分段，每段不超过 90 度
        let numSegments = Math.ceil(Math.abs(deltaTheta) / (Math.PI / 2));
        let anglePerSegment = deltaTheta / numSegments;
        let k = 4 / 3 * Math.tan(anglePerSegment / 4);

        const transform = (x: number, y: number) => {
            x=x*rx // 映射到rx半径圆
            y=y*ry
            // 旋转
            return {
                x: Math.cos(phi) * x - Math.sin(phi) * y + cx,
                y: Math.sin(phi) * x + Math.cos(phi) * y + cy
            }
        }
        for (let i = 0; i < numSegments; i++) {
            let startAngle = theta1 + i * anglePerSegment;
            let endAngle = startAngle + anglePerSegment;

            const cos=Math.cos(startAngle)
            const sin=Math.sin(startAngle)
            const cos2=Math.cos(endAngle)
            const sin2=Math.sin(endAngle)
            // 转换单位圆
            let start = {
                x:cos,
                y:sin,
            }
            let c1p={
                x:cos-k*sin,
                y:sin+k*cos
            }
            let c2p={
                x:cos2+k*sin2,
                y:sin2-k*cos2
            }
            let end={
                x:cos2,
                y:sin2
            }
            // 应用变换
            start=transform(start.x, start.y)
            c1p=transform(c1p.x, c1p.y)
            c2p=transform(c2p.x, c2p.y)
            end=transform(end.x, end.y)

            segments.push([
                start.x,
                start.y,
                c1p.x,
                c1p.y,
                c2p.x,
                c2p.y,
                end.x,
                end.y
            ])
        }

        return segments;
    }

    public toBezierCurves():number[][] {
        return this.getBezierSegments();
    }
}





/**
* 将 SVG 弧命令转换为三次贝塞尔曲线段
* 返回值为一个二维数组，每个元素为 [x1, y1, x2, y2, x, y]，
* 表示一个三次贝塞尔曲线段的控制点1、控制点2及终点。
*/
export function arcToCubicCurves(
    x1: number, y1: number, x2: number, y2: number,
    rx: number, ry: number, angle: number,
    largeArcFlag: number, sweepFlag: number
): number[][] {

   // return ellipseArcToCubicBezier(x1, y1, x2, y2, rx, ry, angle, largeArcFlag, sweepFlag)
   
  // return ellipticalArcToCubic(x1, y1, x2, y2, rx, ry, angle*Math.PI/180, largeArcFlag, sweepFlag)
    // return ellipseArcToCubic(x1, y1, x2, y2, rx, ry, angle*Math.PI/180, largeArcFlag, sweepFlag).map(d=>{
    //     return d.map(d=>[d.x,d.y]).flat()
    // })
    // return arcToBezier({ x: x1, y: y1 }, {
    //     rx: rx,
    //     ry: ry,
    //     xAxisRotation: angle,
    //     largeArcFlag: !!largeArcFlag,
    //     sweepFlag: !!sweepFlag,
    //     end: { x: x2, y: y2 }
    // }).map(d => d.map(d=>[d.x,d.y]).flat())

     const arc=new Arc( rx, ry, angle, largeArcFlag, sweepFlag,x1, y1, x2, y2,);

    // const aaa=endpoint_to_center(x1, y1, x2, y2, largeArcFlag, sweepFlag,rx, ry, angle)
    // const aaa2=arcEndpointToCenter({x:x1, y:y1}, {x:x2, y:y2}, rx, ry, angle, largeArcFlag, sweepFlag)
    // const aaa3=arcEndpointToCenter2(x1, y1, x2, y2, rx, ry, angle, largeArcFlag, sweepFlag)


    // return ellipticalArcToCubic(x1, y1, x2, y2, rx, ry, angle, largeArcFlag, sweepFlag).map(d=>{
    //     return d.map(d=>d).flat()
    // })

    //return arc.toBezierCurves();
    // 如果rx或ry为0，则退化为直线
    if (rx === 0 || ry === 0) {
        return [[x1, y1, x2, y2, x2, y2]];
    }
    const sinPhi = Math.sin(angle);
    const cosPhi = Math.cos(angle);
    // Step 1: 转换到坐标变换后的中点坐标
    const dx = (x1 - x2) / 2;
    const dy = (y1 - y2) / 2;
    const x1p = cosPhi * dx + sinPhi * dy;
    const y1p = -sinPhi * dx + cosPhi * dy;
    // Ensure radii are large enough
    const rx_sq = rx * rx;
    const ry_sq = ry * ry;
    const x1p_sq = x1p * x1p;
    const y1p_sq = y1p * y1p;
    let radicant = rx_sq * ry_sq - rx_sq * y1p_sq - ry_sq * x1p_sq;
    if (radicant < 0) {
        // 如果不足够大，则比例缩放 rx, ry
        const scale = Math.sqrt(1 - radicant / (rx_sq * ry_sq));
        rx *= scale;
        ry *= scale;
        radicant = 0;
    }
    radicant /= (rx_sq * y1p_sq + ry_sq * x1p_sq);
    radicant = Math.sqrt(radicant) * (largeArcFlag === sweepFlag ? -1 : 1);
    const cxp = radicant * rx * y1p / ry;
    const cyp = radicant * -ry * x1p / rx;
    // Step 3: 转换回原坐标系，得到圆心
    const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
    const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;
    // Step 4: 计算起始角和弧度跨度
    function angleBetween(u: number[], v: number[]): number {
        const dot = u[0] * v[0] + u[1] * v[1];
        const len = Math.sqrt((u[0] * u[0] + u[1] * u[1]) * (v[0] * v[0] + v[1] * v[1]));
        let ang = Math.acos(Math.min(Math.max(dot / len, -1), 1));
        if (u[0] * v[1] - u[1] * v[0] < 0) ang = -ang;
        return ang;
    }
    const u = [(x1p - cxp) / rx, (y1p - cyp) / ry];
    const v = [(-x1p - cxp) / rx, (-y1p - cyp) / ry];
    let theta1 = angleBetween([1, 0], u);
    let deltaTheta = angleBetween(u, v);
    if (!sweepFlag && deltaTheta > 0) {
        deltaTheta -= 2 * Math.PI;
    } else if (sweepFlag && deltaTheta < 0) {
        deltaTheta += 2 * Math.PI;
    }
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


// 椭圆弧转换为二次贝塞尔曲线

export function ellipticalArc(x1: number, y1: number, x2: number, y2: number, radiusX: number, radiusY: number, axisAngle: number, largeArc: number | boolean, sweepClockwise: number | boolean) {

    const { cx, cy, rx, ry, theta1, deltaTheta } = arcEndpointToCenter2(x1, y1, x2, y2, radiusX, radiusY, axisAngle, largeArc, sweepClockwise)
    const nquads = Math.ceil(Math.abs(deltaTheta) * 4 / Math.PI);
    const anglePerSegment = deltaTheta / nquads;
    const quads: number[][] = []
    let currentX = x1
    let currentY = y1
    for (let i = 0; i < nquads; ++i) {
        let t1 = theta1 + i * anglePerSegment;
        let t2 = t1 + anglePerSegment;
        let tm = (t1 + t2) / 2;

        const { x: _x1, y: _y1 } = getPointOnEllipse({ x: cx, y: cy }, rx, ry, axisAngle, t1)
        const { x: _x2, y: _y2 } = getPointOnEllipse({ x: cx, y: cy }, rx, ry, axisAngle, t2)
        const { x: xm, y: ym } = getPointOnEllipse({ x: cx, y: cy }, rx, ry, axisAngle, tm)// 中点
        // x1 = cos(phi) * rh * cos(t1) - sin(phi) * rv * sin(t1) + cx;
        // y1 = sin(phi) * rh * cos(t1) + cos(phi) * rv * sin(t1) + cy;

        // x2 = cos(phi) * rh * cos(t2) - sin(phi) * rv * sin(t2) + cx;
        // y2 = sin(phi) * rh * cos(t2) + cos(phi) * rv * sin(t2) + cy;

        // let xm = cos(phi) * rh * cos(tm) - sin(phi) * rv * sin(tm) + cx;
        // let ym = sin(phi) * rh * cos(tm) + cos(phi) * rv * sin(tm) + cy;
        // 计算控制点
        let xc = (xm * 4 - (_x1 + _x2)) / 2; // = xm*2-x1*0.5-x2*0.5;
        let yc = (ym * 4 - (_y1 + _y2)) / 2;
        quads.push([currentX, currentY, xc, yc, _x2, _y2])
        currentX = _x2;
        currentY = _y2;

        //  this.quadraticCurveTo(xc, yc, x2, y2)
    }
    return quads
}
/// 转三次
export function  ellipticalArcToCubic(x1: number, y1: number, x2: number, y2: number, radiusX: number, radiusY: number, axisAngle: number, largeArc: number | boolean, sweepClockwise: number | boolean) {

    const { cx, cy, rx, ry, theta1, deltaTheta } = arcEndpointToCenter2(x1, y1, x2, y2, radiusX, radiusY, axisAngle, largeArc, sweepClockwise)
    const nquads = Math.ceil(Math.abs(deltaTheta) * 4 / Math.PI);
    const anglePerSegment = deltaTheta / nquads;
    const cubics: number[][] = []
    let currentX = x1
    let currentY = y1
    for (let i = 0; i < nquads; ++i) {
        let t1 = theta1 + i * anglePerSegment;
        let t2 = t1 + anglePerSegment;
        let tm = (t1 + t2) / 2;

        const { x: _x1, y: _y1 } = getPointOnEllipse({ x: cx, y: cy }, rx, ry, axisAngle, t1)
        const { x: _x2, y: _y2 } = getPointOnEllipse({ x: cx, y: cy }, rx, ry, axisAngle, t2)
        const { x: xm, y: ym } = getPointOnEllipse({ x: cx, y: cy }, rx, ry, axisAngle, tm)// 中点
        // x1 = cos(phi) * rh * cos(t1) - sin(phi) * rv * sin(t1) + cx;
        // y1 = sin(phi) * rh * cos(t1) + cos(phi) * rv * sin(t1) + cy;

        // x2 = cos(phi) * rh * cos(t2) - sin(phi) * rv * sin(t2) + cx;
        // y2 = sin(phi) * rh * cos(t2) + cos(phi) * rv * sin(t2) + cy;

        // let xm = cos(phi) * rh * cos(tm) - sin(phi) * rv * sin(tm) + cx;
        // let ym = sin(phi) * rh * cos(tm) + cos(phi) * rv * sin(tm) + cy;
        // 计算控制点
        let xc = (xm * 4 - (_x1 + _x2)) / 2; // = xm*2-x1*0.5-x2*0.5;
        let yc = (ym * 4 - (_y1 + _y2)) / 2;

        let cxp1=(currentX+xc*2)/3
        let cyp1=(currentY+yc*2)/3

        let cxp2=(_x2+xc*2)/3
        let cyp2=(_y2+yc*2)/3

        cubics.push([currentX, currentY, cxp1, cyp1,cxp2,cyp2, _x2, _y2])
        currentX = _x2;
        currentY = _y2;

        //  this.quadraticCurveTo(xc, yc, x2, y2)
    }
    return cubics
}


