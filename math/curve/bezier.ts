import { Vector2 } from '../math/vec2'

type Point = Vector2



// 阶乘
export const factorial = (n: number): number => {
    if (n <= 1) {
        return 1
    }
    return n * factorial(n - 1);
}
// 排列
export const nPr = (n: number, r: number) => {
    return factorial(n) / factorial(r)
}
// 组合
export const nCr = (n: number, r: number) => {
    return factorial(n) / (factorial(n - r) * factorial(r))
}
// 组合
export const combination = (n: number, r: number) => {
    let ret = 1
    for (let i = 1; i < r; i++) {
        ret *= (n - i + 1) / i
    }
    return ret;
}
// 伯恩斯坦多项式
const bernstein = (i: number, n: number, t: number) => {
    return combination(n, i) * Math.pow((1 - t), n - i) * Math.pow(t, i)
}
// 线性插值
export const linearInterpolation = (s: number, e: number, t: number) => {
    return s + (e - s) * t
}
export const lerp = linearInterpolation

export const mix = (s: number, e: number, t: number) => {
    return s * (1 - t) + e * t
}



// 有理贝塞尔曲线算法
export const rationBezier = (pts: Point[], weights: number[], t: number) => {
    const n = pts.length - 1;
    const point = { x: 0, y: 0 }
    let weight = 0

    for (let i = 0; i <= n; i++) {
        let b = bernstein(i, n, t)
        point.x += b * weights[i] * pts[i].x
        point.y += b * weights[i] * pts[i].y
        weight += b * weights[i]
    }
    point.x /= weight
    point.y /= weight
    return point
}
// 贝塞尔曲线算法
export const bezier = (pts: Point[], t: number) => {
    const n = pts.length - 1;
    const point = { x: 0, y: 0 }
    for (let i = 0; i <= n; i++) {
        let b = bernstein(i, n, t)
        point.x += b * pts[i].x
        point.y += b * pts[i].y
    }
    return point
}

// 二次曲线转三次曲线
export const quadraticToCubic = (p0: Point, p1: Point, p2: Point) => {
    const p01 = { x: lerp(p0.x, p1.x, 2 / 3), y: lerp(p0.y, p1.y, 2 / 3) }
    const p12 = { x: lerp(p2.x, p1.x, 2 / 3), y: lerp(p2.y, p1.y, 2 / 3) }
    return [p0, p01, p12, p2]
}
// 根据t点细分二次贝塞尔曲线
/**
 * 在二次贝塞尔曲线上进行细分
 *
 * @param p0 起点坐标（Vector2类型）
 * @param p1 控制点坐标（Vector2类型）
 * @param p2 终点坐标（Vector2类型）
 * @param t 细分参数，取值范围在0到1之间
 * @returns 返回细分后的点数组，包含起点、两个细分点和终点
 */
export const quadraticBezierSubdivideAt = (p0: Vector2, p1: Vector2, p2: Vector2, t: number) => {
    const p01 = Vector2.lerp(p0, p1, t)
    const p02 = Vector2.lerp(p1, p2, t)
    const p0102 = Vector2.lerp(p01, p02, t)
    return [p0, p01, p0102, p02, p2];
}

export const quadraticRationBezierSubdivideAt = (pts: Vector2[], weights: number[], t: number) => {
    const w0 = weights[0], w1 = weights[1], w2 = weights[2]
    const p0 = pts[0], p1 = pts[1], p2 = pts[2]

    const w01 = lerp(w0, w1, t)
    const w02 = lerp(w1, w2, t)
    const w03 = lerp(w01, w02, t)

    const p01 = Vector2.create(lerp(p0.x * w0, p1.x * w1, t), lerp(p0.y * w0, p1.y * w1, t)).multiplyScalar(1 / w01)
    const p02 = Vector2.create(lerp(p1.x * w1, p2.x * w2, t), lerp(p1.y * w1, p2.y * w2, t)).multiplyScalar(1 / w02)
    const p03 = Vector2.create(lerp(p01.x * w1, p02.x, t), lerp(p01.y, p02.y, t)).multiplyScalar(1 / w03)


    return [p0, p01, p03, p02, p2];
}


// 根据t点细分三次贝塞尔曲线
export const cubicBezierSubdivideAt = (p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2, t: number) => {
    const q0 = Vector2.lerp(p0,p1,t)
    const q1 = Vector2.lerp(p1,p2,t)
    const q2 = Vector2.lerp(p2,p3,t)

    const s0=Vector2.lerp(q0,q1,t)
    const s1=Vector2.lerp(q1,q2,t)

    const c0=Vector2.lerp(s0,s1,t)

    return [p0,q0,s0,c0,s1,q2,p3];
}
// 二次贝塞尔曲线细分
export const quadraticBezierSubdivide = (p0: Vector2, p1: Vector2, p2: Vector2) => {
    return quadraticBezierSubdivideAt(p0, p1, p2, 0.5)
}
// 三次贝塞尔曲线细分
export const cubicBezierSubdivide = (p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2) => {
    return cubicBezierSubdivideAt(p0, p1, p2, p3, 0.5)
}

// 二次贝塞尔曲线包围盒
export const quadraticBezierBounds = (p0: Point, p1: Point, p2: Point) => {
    const roots = quadraticBezierExtrema(p0, p1, p2)
    roots.push(0, 1)
    const min = Vector2.create(Infinity, Infinity)
    const max = Vector2.create(-Infinity, -Infinity)
    roots.forEach(t => {
        let v = quadraticBezier(p0, p1, p2, t)
        min.min(v)
        max.max(v)
    })
    return {
        min,
        max
    }
}
// 三次贝塞尔曲线包围盒
export const cubicBezierBounds = (p0: Point, p1: Point, p2: Point, p3: Point) => {
    const roots = cubicBezierExtrema(p0, p1, p2, p3)
    roots.push(0, 1)
    const min = Vector2.create(Infinity, Infinity)
    const max = Vector2.create(-Infinity, -Infinity)
    roots.forEach(t => {
        let v = cubicBezier(p0, p1, p2, p3, t)
        min.min(v)
        max.max(v)
    })
    return {
        min,
        max
    }
}
// 根据点求在二次贝塞尔曲线上的t值
export const quadraticBezierT = (p0: Point, p1: Point, p2: Point, pt: Vector2) => {
    const a = {
        x: p0.x - 2 * p1.x + p2.x,
        y: p0.y - 2 * p1.y + p2.y
    }
    const b = {
        x: 2 * (p1.x - p0.x),
        y: 2 * (p1.y - p0.y)
    }
    const c = {
        x: p0.x - pt.x,
        y: p0.y - pt.y
    }
    const det_x = Math.pow(b.x, 2) - 4 * a.x * c.x
    const det_y = Math.pow(b.y, 2) - 4 * a.y * c.y
    let t_x = Infinity, t_y = Infinity
    if (det_x !== 0) {
        t_x = (-b.x + Math.sqrt(det_x)) / (2 * a.x)
        if (t_x >= 0 && t_x <= 1) {
            return t_x
        }
        t_x = (-b.x + Math.sqrt(det_x)) / (2 * a.x)
    }
    if (det_y !== 0) {
        t_y = (-b.y + Math.sqrt(det_y)) / (2 * a.y)
        if (t_y >= 0 && t_y <= 1) {
            return t_y
        }
    }
}

// 二次贝塞尔曲线极值
export const quadraticBezierExtrema = (p0: Point, p1: Point, p2: Point) => {
    // 导数:(-2+2t)*p0+(2-4t)*p1+2tp2=0
    //  -2*p0+2*p1+2t(p2-2*p1+p0)=0
    // 2t(p2-2*p1+p0)=2(p0-p1)
    // t=(p0-p1)/(p2-2*p1+p0)

    const extremes: number[] = [];
    // X分量极值
    const denominatorX = p0.x - 2 * p1.x + p2.x;
    if (denominatorX !== 0) {
        const t = (p0.x - p1.x) / denominatorX;
        if (t >= 0 && t <= 1) {
            extremes.push(t);
        }
    }
    // Y分量极值
    const denominatorY = p0.y - 2 * p1.y + p2.y;
    if (denominatorY !== 0) {
        const t = (p0.y - p1.y) / denominatorY;
        if (t >= 0 && t <= 1) {
            extremes.push(t);
        }
    }
    return extremes;
}
// 三次贝塞尔曲线极值
export const cubicBezierExtrema = (p0: Point, p1: Point, p2: Point, p3: Point) => {
    // 公式:(1-t)^3p0+3t(1-t)^2p1+3t^2(1-t)p2+t^3p3=0
    // 导数-1：(1-3t+3t^2-t^3)p0+3t(1-2t+t^2)p1+(3t^2-3t^3)p2+t^3p3=0
    // 导数-2: (-3+6t-3t^2)p0+(3-12t+9t^2)p1+(6t-9t^2)p2+3t^2p3=0
    //  (-3p0+6tp0-3t^2p0)+(3p1-12tp1+9t^2p1)+(6tp2-9t^2p2)+3t^3p3=0
    // 合并同类:()
    // 
    // (p3-p0+3p1-3p2)t^2+(p0-2p1+p2)2t+(p1-p0)=0
    // (p3-p0+3p1-3p2)t^2+(p0-2p1+p2)2t+(p1-p0)=0

    // p1:3t(1-2t+t^2)=3-12t+9t^2
    // p2:(3t^2-3t^3)=6t-9t^2
    // p2:3t^2(1-t)=6t(1-t)+3t^2(-1)=6t-9t^2

    const extremes: number[] = [];
    // X分量二次方程系数
    const aX = -p0.x + 3 * p1.x - 3 * p2.x + p3.x;
    const bX = 2 * p0.x - 4 * p1.x + 2 * p2.x;
    const cX = -p0.x + p1.x;
    const rootsX = solveQuadratic(aX, bX, cX);
    rootsX.forEach(t => {
        if (t >= 0 && t <= 1) {
            extremes.push(t)
        }
    });
    // Y分量二次方程系数
    const aY = -p0.y + 3 * p1.y - 3 * p2.y + p3.y;
    const bY = 2 * p0.y - 4 * p1.y + 2 * p2.y;
    const cY = -p0.y + p1.y;
    const rootsY = solveQuadratic(aY, bY, cY);
    rootsY.forEach(t => {
        if (t >= 0 && t <= 1) {
            extremes.push(t)
        }
    });
    return extremes;
}


// 求解二次方程：a*t^2 + b*t + c = 0
export function solveQuadratic2(a: number, b: number, c: number) {
    const epsilon = 1e-8;
    let roots: number[] = [];
    if (Math.abs(a) < epsilon) {
        if (Math.abs(b) < epsilon) return []; // 无解
        roots.push(-c / b);
        return roots;
    }
    const disc = b * b - 4 * a * c;
    if (disc < 0) return []; // 无实根
    if (Math.abs(disc) < epsilon) {
        roots.push(-b / (2 * a));
    } else {
        roots.push((-b + Math.sqrt(disc)) / (2 * a));
        roots.push((-b - Math.sqrt(disc)) / (2 * a));
    }
    return roots;
}

// 给定控制点 P0, P1, P2 和目标点 target，求二次贝塞曲线上使得 P[coord] = target[coord] 的 t 值
export function getTQuadratic(P0, P1, P2, target, coord = 'x') {
    // 二次曲线在该坐标上的表达式展开后：
    // x(t) = P0[coord] + 2*(P1[coord] - P0[coord])*t + (P0[coord] - 2*P1[coord] + P2[coord])*t^2
    // 令 x(t) = target[coord]，则：
    // (P0 - 2P1 + P2)*t^2 + 2*(P1 - P0)*t + (P0 - target) = 0
    const a = P0[coord] - 2 * P1[coord] + P2[coord];
    const b = 2 * (P1[coord] - P0[coord]);
    const c = P0[coord] - target[coord];

    // 求解二次方程
    let ts = solveQuadratic2(a, b, c);
    // 过滤只取 t ∈ [0, 1] 的解
    return ts.filter(t => t >= 0 && t <= 1);
}
// 求解三次方程：a*t^3 + b*t^2 + c*t + d = 0
export function solveCubic(a: number, b: number, c: number, d: number) {
    const epsilon = 1e-8;
    let roots: number[] = [];
    // 如果 a 接近 0，则退化为二次方程
    if (Math.abs(a) < epsilon) return solveQuadratic(b, c, d);

    // 归一化系数
    b /= a;
    c /= a;
    d /= a;

    // 将方程化为标准形式 t^3 + p*t + q = 0, 令 t = x - b/3
    const p = c - (b * b) / 3;
    const q = (2 * Math.pow(b, 3)) / 27 - (b * c) / 3 + d;
    const discriminant = Math.pow(q / 2, 2) + Math.pow(p / 3, 3);

    if (discriminant > epsilon) {
        // 一个实根
        const sqrtDisc = Math.sqrt(discriminant);
        const u = Math.cbrt(-q / 2 + sqrtDisc);
        const v = Math.cbrt(-q / 2 - sqrtDisc);
        roots.push(u + v - b / 3);
    } else if (Math.abs(discriminant) < epsilon) {
        // 重根情况
        const u = Math.cbrt(-q / 2);
        roots.push(2 * u - b / 3);
        roots.push(-u - b / 3);
    } else {
        // 三个实根
        const r = 2 * Math.sqrt(-p / 3);
        const theta = Math.acos(-q / (2 * Math.sqrt(-Math.pow(p, 3) / 27)));
        roots.push(r * Math.cos(theta / 3) - b / 3);
        roots.push(r * Math.cos((theta + 2 * Math.PI) / 3) - b / 3);
        roots.push(r * Math.cos((theta + 4 * Math.PI) / 3) - b / 3);
    }
    return roots;
}

// 给定控制点 P0, P1, P2, P3 和目标点 target，求三次贝塞曲线上使得 P[coord] = target[coord] 的 t 值
export function getTCubic(P0, P1, P2, P3, target, coord = 'x') {
    // 三次曲线的系数
    const A = -P0[coord] + 3 * P1[coord] - 3 * P2[coord] + P3[coord];
    const B = 3 * P0[coord] - 6 * P1[coord] + 3 * P2[coord];
    const C = -3 * P0[coord] + 3 * P1[coord];
    const D = P0[coord] - target[coord]; // 移项后得到：A*t^3 + B*t^2 + C*t + (D)=0

    // (1-t)^3p0+3t(1-t)^2p1+3t^2(1-t)p2+t^3p3
    // (1-t)^3=(1-t)(1-t)(1-t)=(1-2t+t^2)(1-t)=1-1t-2t+2t^2+t^2-t^3=1-3t+3t^2-t^3
    // (a-b)^3=(a-b)(a-b)(a-b)=(a^2-2ab+b^2)(a-b)=a^3-a^2b-2a^2b+2ab^2+ab^2-b^3=a^3-3a^2b+3ab^2-b^3

    //
    let ts = solveCubic(A, B, C, D);
    // 过滤只取 t ∈ [0, 1] 的解
    return ts.filter(t => t >= 0 && t <= 1);
}

export function solveQuadratic3(a: number, b: number, c: number): number[] {
    if (a === 0) return b === 0 ? [] : [-c / b];
    const delta = b * b - 4 * a * c;
    if (delta < 0) return [];
    const sqrtD = Math.sqrt(delta);
    return [(-b + sqrtD) / (2 * a), (-b - sqrtD) / (2 * a)].filter(t => isFinite(t));
}
// 解二次方程 ax² + bx + c = 0，返回 [0,1] 区间内的实根
export function solveQuadratic(a, b, c, epsilon = 1e-5) {
    const roots: number[] = [];

    // 处理退化情况：a = 0 (一次方程)
    if (Math.abs(a) < epsilon) {
        if (Math.abs(b) < epsilon) {
            return roots; // 无解
        }
        const t = -c / b;
        if (t >= 0 && t <= 1) {
            roots.push(t);
        }
        return roots;
    }

    // 计算判别式
    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) {
        return roots; // 无实根
    }

    // 计算两个根
    const sqrtD = Math.sqrt(discriminant);
    const t1 = (-b + sqrtD) / (2 * a);
    const t2 = (-b - sqrtD) / (2 * a);

    // 检查根是否在 [0,1] 范围内
    const checkRoot = (t) => t >= -epsilon && t <= 1 + epsilon;
    if (checkRoot(t1)) {
        roots.push(Math.min(1, Math.max(0, t1)));
    }
    if (Math.abs(t1 - t2) > epsilon && checkRoot(t2)) {
        roots.push(Math.min(1, Math.max(0, t2)));
    }

    return roots;
}
// 主函数：求三次贝塞尔曲线极值点
export function findCubicBezierExtremes(P0, P1, P2, P3) {
    // ==================== X 方向极值 ====================
    const x0 = P0.x, x1 = P1.x, x2 = P2.x, x3 = P3.x;
    const ax = 3 * x1 - x0 - 3 * x2 + x3;
    const bx = 2 * (x0 - 2 * x1 + x2);
    const cx = x1 - x0;
    const tValuesX = solveQuadratic(ax, bx, cx);

    // ==================== Y 方向极值 ====================
    const y0 = P0.y, y1 = P1.y, y2 = P2.y, y3 = P3.y;
    const ay = 3 * y1 - y0 - 3 * y2 + y3;
    const by = 2 * (y0 - 2 * y1 + y2);
    const cy = y1 - y0;
    const tValuesY = solveQuadratic(ay, by, cy);

    // 合并去重并排序
    const allT = [...tValuesX, ...tValuesY]
        .map(t => Math.round(t * 1e8) / 1e8) // 消除浮点误差
        .filter(t => t >= 0 && t <= 1);
    const uniqueT = [...new Set(allT)].sort((a, b) => a - b);

    // 计算极值点
    return uniqueT.map(t => {
        const point = evaluateBezier([P0, P1, P2, P3], t);
        return { x: point.x, y: point.y, t: t };
    });
}






export const quadraticBezier = (p0: Point, p1: Point, p2: Point, t: number) => {
    const ivt = 1 - t;
    const tt = t * t;
    return Vector2.create(
        p0.x * ivt * ivt + 2 * t * ivt * p1.x + tt * p2.x,
        p0.y * ivt * ivt + 2 * t * ivt * p1.y + tt * p2.y
    )
}
export const cubicBezier = (p0: Point, p1: Point, p2: Point, p3: Point, t: number) => {
    const ivt = 1 - t;
    const tt = t * t;
    const ttt = tt * t;
    return Vector2.create(
        p0.x * ivt * ivt * ivt + 3 * t * ivt * ivt * p1.x + 3 * tt * ivt * p2.x + ttt * p3.x,
        p0.y * ivt * ivt * ivt + 3 * t * ivt * ivt * p1.y + 3 * tt * ivt * p2.y + ttt * p3.y
    )
}


// 贝塞尔曲线一阶导数
// 如二次贝塞尔曲线一阶导数：lerp(2*(p1-p0),2*(p2-p1),t)=2(p1-p0)+2t(p2-p1-(p1-p0))=2(p1-p0)+2t(p2-2p1+p0)

export const bezierDerivative = (pts: Point[], t: number) => {
    const n = pts.length - 1;
    let ret = { x: 0, y: 0 }
    for (let i = 0; i < n; i++) {
        ret.x += n * bernstein(i,n-1,t)* (pts[i + 1].x - pts[i].x)
        ret.y += n * bernstein(i,n-1,t) * (pts[i + 1].y - pts[i].y)
    }
    return ret
}
// 贝塞尔曲线二阶导数
export const bezierSecondDerivative = (pts: Point[], t: number) => {
    const n = pts.length - 1;
    let ret = { x: 0, y: 0 }
    for (let i = 0; i < n - 1; i++) {
        ret.x += n * (n - 1) * bernstein(i,n-2,t) * (pts[i + 2].x - 2 * pts[i + 1].x + pts[i].x)
        ret.y += n * (n - 1) * bernstein(i,n-2,t) * (pts[i + 2].y - 2 * pts[i + 1].y + pts[i].y)
    }
    return ret
}
//计算一阶导数控制点
/**
 * // 或通过链式调用
const firstDeriv = computeFirstDerivativeControlPoints(controlPoints);
const secondDeriv = computeFirstDerivativeControlPoints(firstDeriv);

// 在t=0.5处的二阶导数值
const t = 0.5;
const secondDerivValue = evaluateBezier(secondDeriv, t);
console.log(secondDerivValue);
*/
export function computeFirstDerivativeControlPoints(points: Point[]) {
    const n = points.length - 1;
    if (n < 1) throw new Error("需要至少2个控制点");
    const dPoints: Point[] = [];
    for (let i = 0; i < n; i++) {
        const dx = n * (points[i + 1].x - points[i].x);
        const dy = n * (points[i + 1].y - points[i].y);
        dPoints.push(Vector2.create(dx, dy));
    }
    return dPoints;
}
//计算二阶导数控制点
export function computeSecondDerivativeControlPoints(points: Point[]) {
    const n = points.length - 1;
    if (n < 2) throw new Error("需要至少3个控制点");
    const ddPoints: Point[] = [];
    const factor = n * (n - 1);
    for (let i = 0; i <= n - 2; i++) {
        const dx = factor * (points[i + 2].x - 2 * points[i + 1].x + points[i].x);
        const dy = factor * (points[i + 2].y - 2 * points[i + 1].y + points[i].y);
        ddPoints.push(Vector2.create(dx, dy));
    }
    return ddPoints;
}
/**
 * 计算贝塞尔曲线的k阶导数控制点
 * @param {Array} points 原控制点，格式为[[x0,y0], [x1,y1], ...]
 * @param {number} k 导数阶数（k ≥ 0）
 * @returns {Array} k阶导数对应的控制点数组
 * @examples 
 * // 使用示例
const controlPoints = [[0, 0], [1, 2], [3, 3], [4, 0]]; // 3阶曲线
const k = 2; // 计算二阶导数

// 获取k阶导数控制点
const derivativePoints = bezierKthDerivative(controlPoints, k);
 */
export function bezierKthDerivative(points:Vector2[], k:number) {
    const n = points.length - 1;
    if (k > n) return []; // 超出阶数时返回空数组
    if (k === 0) return points.slice(); // 0阶导数返回原曲线副本

    // 计算k次前向差分
    let diffPoints = points.slice();
    for (let d = 0; d < k; d++) {
        const newDiff = [];
        for (let i = 0; i < diffPoints.length - 1; i++) {
            const p0 = diffPoints[i];
            const p1 = diffPoints[i + 1];
            const delta = p1.clone().subtract(p0)
            newDiff.push(delta);
        }
        diffPoints = newDiff;
    }

    // 计算系数 n*(n-1)*...*(n-k+1)
    let factor = 1;
    for (let i = 0; i < k; i++) {
        factor *= (n - i);
    }

    // 乘以系数得到最终导数控制点
    const derivativePoints = diffPoints.map(p => p.multiplyScalar(factor));
    return derivativePoints;
}


//通用贝塞尔曲线求值函数（De Casteljau算法）
export function evaluateBezier(points: Point[], t: number) {
    let currentPoints = [...points];
    while (currentPoints.length > 1) {
        const newPoints: Point[] = [];
        for (let i = 0; i < currentPoints.length - 1; i++) {
            const x = (1 - t) * currentPoints[i].x + t * currentPoints[i + 1].x;
            const y = (1 - t) * currentPoints[i].y + t * currentPoints[i + 1].y;
            newPoints.push(Vector2.create(x, y));
        }
        currentPoints = newPoints;
    }
    return currentPoints[0];
}
//计算在t处的一阶和二阶导数
export function getFirstDerivative(points: Point[], t: number) {
    const dPoints = computeFirstDerivativeControlPoints(points);
    return evaluateBezier(dPoints, t);
}

export function getSecondDerivative(points: Point[], t: number) {
    const ddPoints = computeSecondDerivativeControlPoints(points);
    return evaluateBezier(ddPoints, t);
}
// 德卡斯特里奥算法
export const deCasteljau = (pts: Point[], t: number) => {
    const n = pts.length - 1;
    let ret: Point[] = pts.map(p => (Vector2.create(p.x, p.y)))
    for (let i = 1; i <= n; i++) {
        for (let j = 0; j <= n - i; j++) {
            ret[j].x = lerp(ret[j].x, ret[j + 1].x, t)
            ret[j].y = lerp(ret[j].y, ret[j + 1].y, t)
        }
    }
    return ret[0];
}
// 有理贝塞尔曲线求值函数（De Casteljau算法）
export const rationBezierDeCasteljau = (pts: Vector2[], wiehgts: number[], t: number) => {
    let len = pts.length
    let n = pts.length - 1;

    let newPts = Array.from({ length: len }, (v, i) => Vector2.zero().copy(pts[i]))
    let newWeights = Array.from({ length: len }, (v, i) => {
        return wiehgts[i]
    })
    for (let i = 1; i <= n; i++) {
        for (let j = 0; j <= n - i; i++) {
            newPts[j].x = lerp(newPts[j].x * wiehgts[j], newPts[j + 1].x * wiehgts[j + 1], t)
            newPts[j].y = lerp(newPts[j].y * wiehgts[j], newPts[j + 1].y * wiehgts[j + 1], t)
            newWeights[j] = lerp(newWeights[j], newWeights[j + 1], t)
        }
    }
    newPts[0].x = newPts[0].x / newWeights[0]
    newPts[0].y = newPts[0].y / newWeights[0]
    return newPts[0]
}
export const deCasteljau2 = (pts: Point[], t: number): Vector2 => {
    const n = pts.length;
    if (n === 1) {
        return pts[0]
    }
    let newPts: Point[] = [];

    for (let i = 0; i < n - 1; i++) {
        newPts.push(Vector2.create(
            lerp(pts[i].x, pts[i + 1].x, t),
            lerp(pts[i].y, pts[i + 1].y, t)
        ))
    }
    return deCasteljau2(newPts, t);
}

/**
 * 计算牛顿插值多项式的值
 * @param {Array} xValues - 自变量数组
 * @param {Array} yValues - 因变量数组
 * @param {number} x - 需要插值的点
 * @returns {number} 插值多项式在 x 处的值
 */
export function newtonInterpolation(xValues, yValues, x) {
    const n = xValues.length;
    const dividedDifferences = [...yValues];

    // 计算差商表
    for (let i = 1; i < n; i++) {
        for (let j = n - 1; j >= i; j--) {
            dividedDifferences[j] = (dividedDifferences[j] - dividedDifferences[j - 1]) / (xValues[j] - xValues[j - i]);
        }
    }

    // 计算插值多项式的值
    let result = dividedDifferences[n - 1];
    for (let i = n - 2; i >= 0; i--) {
        result = result * (x - xValues[i]) + dividedDifferences[i];
    }

    return result;
}

// 二次贝塞尔曲线的t点曲率计算函数
export function curvatureQuadratic(t: number, P0: Point, P1: Point, P2: Point) {
    // 一阶导数
    const d1x = 2 * ((1 - t) * (P1.x - P0.x) + t * (P2.x - P1.x));
    const d1y = 2 * ((1 - t) * (P1.y - P0.y) + t * (P2.y - P1.y));

    // 二阶导数（常数）
    const d2x = 2 * (P0.x - 2 * P1.x + P2.x);
    const d2y = 2 * (P0.y - 2 * P1.y + P2.y);

    // 叉积和模长
    const cross = d1x * d2y - d1y * d2x;
    const d1Mag = Math.hypot(d1x, d1y);

    return d1Mag === 0 ? Infinity : Math.abs(cross) / Math.pow(d1Mag, 3);
}
// 三次贝塞尔曲线的t点曲率计算函数
export function curvatureCubic(t: number, P0: Point, P1: Point, P2: Point, P3: Point) {
    const u = 1 - t;

    // 一阶导数
    const d1x = 3 * (u * u * (P1.x - P0.x) + 2 * u * t * (P2.x - P1.x) + t * t * (P3.x - P2.x));
    const d1y = 3 * (u * u * (P1.y - P0.y) + 2 * u * t * (P2.y - P1.y) + t * t * (P3.y - P2.y));

    // 二阶导数
    const term1x = P0.x - 2 * P1.x + P2.x;
    const term1y = P0.y - 2 * P1.y + P2.y;
    const term2x = P1.x - 2 * P2.x + P3.x;
    const term2y = P1.y - 2 * P2.y + P3.y;
    const d2x = 6 * (term1x * u + term2x * t);
    const d2y = 6 * (term1y * u + term2y * t);

    // 叉积和模长
    const cross = d1x * d2y - d1y * d2x;
    const d1Mag = Math.hypot(d1x, d1y);

    return d1Mag === 0 ? Infinity : Math.abs(cross) / Math.pow(d1Mag, 3);
}

// 计算N阶贝塞尔曲线t点的曲率
export function curvatureNBezier(t: number, pts: Point[]) {
    const n = pts.length;
    //if (order < 1 || order > n - 1) return Infinity; // 不合法的阶数

    // 一阶导数
    let d1x = 0, d1y = 0;

    for (let i = 0; i < n; i++) {
        d1x += n * combination(n - 1, i) * Math.pow((1 - t), n - i - 1) * Math.pow(t, i) * (pts[i + 1].x - pts[i].x)
        d1y += n * combination(n - 1, i) * Math.pow((1 - t), n - i - 1) * Math.pow(t, i) * (pts[i + 1].y - pts[i].y)
    }
    // 二阶导数
    let d2x = 0, d2y = 0;
    for (let i = 0; i <= n - 1; i++) {
        d2x += n * (n - 1) * combination(n - 2, i) * Math.pow((1 - t), n - i - 2) * Math.pow(t, i) * (pts[i + 2].x - 2 * pts[i + 1].x + pts[i].x)
        d2y += n * (n - 1) * combination(n - 2, i) * Math.pow((1 - t), n - i - 2) * Math.pow(t, i) * (pts[i + 2].y - 2 * pts[i + 1].y + pts[i].y)
    }

    // 叉积和模长
    const cross = d1x * d2y - d1y * d2x;
    const d1Mag = Math.hypot(d1x, d1y);

    return d1Mag === 0 ? Infinity : Math.abs(cross) / Math.pow(d1Mag, 3);
}
// 曲率计算函数，适用于任意阶贝塞尔曲线t点的曲率

export function curvatureAt(points: Point[], t: number) {
    const n = points.length - 1;
    if (n < 1) return 0; // 直线，曲率为0

    // 计算一阶导数控制点和值
    const d1Points = computeFirstDerivativeControlPoints(points);
    const B_prime = evaluateBezier(d1Points, t);

    // 计算二阶导数（如果可能）
    let B_double_prime;
    if (n >= 2) {
        const d2Points = computeSecondDerivativeControlPoints(points);
        B_double_prime = evaluateBezier(d2Points, t);
    } else {
        // 二阶导数为零（直线或一阶曲线）
        return 0;
    }

    // 计算叉积和模长
    const cross = B_prime.x * B_double_prime.y - B_prime.y * B_double_prime.x;
    const d1Mag = Math.sqrt(B_prime.x ** 2 + B_prime.y ** 2);

    // 处理分母为零的情况
    return d1Mag === 0 ? Infinity : Math.abs(cross) / (d1Mag ** 3);
}
// 最大曲率
export function findMaxCurvature(points: Point[], samples = 100, iterations = 5) {
    let maxCurvature = -Infinity;
    let maxT = 0;

    // 初始粗采样
    for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const k = curvatureAt(points, t);
        if (k > maxCurvature) {
            maxCurvature = k;
            maxT = t;
        }
    }

    // 局部精细化（黄金分割法）
    const goldenRatio = (Math.sqrt(5) - 1) / 2;
    let a = Math.max(0, maxT - 1 / samples);
    let b = Math.min(1, maxT + 1 / samples);

    for (let i = 0; i < iterations; i++) {
        const t1 = b - goldenRatio * (b - a);
        const t2 = a + goldenRatio * (b - a);
        const k1 = curvatureAt(points, t1);
        const k2 = curvatureAt(points, t2);

        if (k1 > k2) {
            b = t2;
            if (k1 > maxCurvature) {
                maxCurvature = k1;
                maxT = t1;
            }
        } else {
            a = t1;
            if (k2 > maxCurvature) {
                maxCurvature = k2;
                maxT = t2;
            }
        }
    }

    return {
        maxCurvature: maxCurvature,
        t: maxT,
        point: evaluateBezier(points, maxT) // 可选：最大曲率处的坐标
    };
}
/**
 * 求解一元三次方程 ax^3 + bx^2 + cx + d = 0 的实数解
 * @param {number} a - 三次项系数
 * @param {number} b - 二次项系数
 * @param {number} c - 一次项系数
 * @param {number} d - 常数项
 * @returns {number[]} 实数解数组
 */
export function solveCubicEquation(a, b, c, d) {
    if (a === 0) {
        throw new Error('这不是一元三次方程。');
    }

    // 将方程化为 x^3 + px + q = 0 的形式
    const p = (3 * a * c - b * b) / (3 * a * a);
    const q = (2 * b * b * b - 9 * a * b * c + 27 * a * a * d) / (27 * a * a * a);

    // 判别式
    const discriminant = (q / 2) * (q / 2) + (p / 3) * (p / 3) * (p / 3);

    let roots: number[] = [];

    if (discriminant > 0) {
        // 一个实根和一对共轭复根
        const u = Math.cbrt(-q / 2 + Math.sqrt(discriminant));
        const v = Math.cbrt(-q / 2 - Math.sqrt(discriminant));
        const realRoot = u + v - b / (3 * a);
        roots.push(realRoot);
    } else if (discriminant === 0) {
        // 所有根都是实数，且至少有两个相等
        const u = Math.cbrt(-q / 2);
        const realRoot1 = 2 * u - b / (3 * a);
        const realRoot2 = -u - b / (3 * a);
        roots.push(realRoot1, realRoot2);
    } else {
        // 三个不等的实数根
        const r = Math.sqrt(-(p / 3));
        const phi = Math.acos(-q / (2 * r * r * r));
        const realRoot1 = 2 * r * Math.cos(phi / 3) - b / (3 * a);
        const realRoot2 = 2 * r * Math.cos((phi + 2 * Math.PI) / 3) - b / (3 * a);
        const realRoot3 = 2 * r * Math.cos((phi + 4 * Math.PI) / 3) - b / (3 * a);
        roots.push(realRoot1, realRoot2, realRoot3);
    }

    // 过滤重复的根，并按从小到大排序
    roots = Array.from(new Set(roots)).sort((x, y) => x - y);

    return roots;
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

// 点与线段距离
function pointOnSegmentDistance(pt: Vector2, a: Vector2, b: Vector2) {
    const ab = b.clone().sub(a)
    const ap = pt.clone().sub(a)
    const t = Math.max(0, Math.min(ap.dot(ab) / ab.lengthSq(), 1))
    return ap.distanceToSquared(ab.multiplyScalar(t))
}
// 点到直线的距离（带符号）
function distancePointToLine(p: Point, a: Point, b: Point): number {
    // Ax+By+C=0
    // x0+t(x1-x0)=x y0+t(y1-y0)=y
    // t=(x-x0)/(x1-x0) t=(y-y0)/(y1-y0)
    // (x-x0)/(x1-x0)=(y-y0)/(y1-y0)
    // (x-x0)*(y1-y0)=(y-y0)*(x1-x0)  dx=(x1-x0) dy=(y1-y0)
    // A=dy B=-dx C=x0*dy-y0*dx=x0(y1-y0)-y0(x1-x0)=x0*y1-y0*x1
    const numerator = (b.y - a.y) * p.x + (a.x - b.x) * p.y + b.x * a.y - b.y * a.x;
    const denominator = Math.sqrt((b.y - a.y) ** 2 + (a.x - b.x) ** 2);
    return Math.abs(numerator)/denominator;
}
// 计算最大弦高（更精确的平直度判断）
function maxChordHeight(
    p0: Point,
    p3: Point,
    p1: Point,
    p2: Point,
    mid: Point
): number {
    // 计算三次曲线与连接线段的偏差
    const d1 = distancePointToLine(p1, p0, p3);
    const d2 = distancePointToLine(p2, p0, p3);
    const dMid = distancePointToLine(mid, p0, p3);
    return Math.max(d1, d2, dMid);
}
// 二次贝塞尔曲线扁平化转成线段
export function quadraticCurveToLines(p0: Vector2, p1: Vector2, p2: Vector2, tessellationTolerance: number = 0.5) {
    const points: Vector2[] = []
    const subdivide = (p0: Vector2, p1: Vector2, p2: Vector2,maxDeep:number=100) => {
        const dist = pointOnSegmentDistance(p1, p0, p2)
        if (dist < tessellationTolerance||maxDeep<=0) {
            points.push(p2)
        } else {
            const [q0, q1, q2, q3, q4] = quadraticBezierSubdivide(p0, p1, p2)
            subdivide(q0, q1, q2,maxDeep-1)
            subdivide(q2, q3, q4,maxDeep-1)
        }
    }
    subdivide(p0, p1, p2)
    return points
}

// 三次贝塞尔曲线扁平化转成线段
export function cubicCurveToLines(p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2, tessellationTolerance: number = 0.5) {
    const points: Vector2[] = []
    const subdivide = (p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2,maxDeep:number=100) => {
        // const mid=cubicBezier(p0,p1,p2,p3,0.5)
        // const dist0=pointOnSegmentDistance(mid,p0,p3)  
        const dist1 = distancePointToLine(p1, p0, p3)
        const dist2 = distancePointToLine(p2, p0, p3)
        const dist = Math.max(dist1, dist2)
        // 计算平直度误差（使用最大弦高）
        //  const chordHeight = maxChordHeight(p0, p3, p1, p2, mid);
        if (dist < tessellationTolerance||maxDeep<=0) {
            points.push(p3)
        } else {
            const [q0, q1, q2, q3, q4, q5, q6] = cubicBezierSubdivide(p0, p1, p2, p3)
            subdivide(q0, q1, q2, q3,maxDeep-1)
            subdivide(q3, q4, q5, q6,maxDeep-1)
        }
    }
    subdivide(p0, p1, p2, p3)
    return points
}


export function subdivideQuadraticBezierByCurvature(p0: Vector2, p1: Vector2, p2: Vector2) {
    const points: Vector2[] = []
    function recursiveSubdivide(t0: number, t1: number, insertionIndex: number, depth: number) {
        if (depth > 999) {
            return 0;
        }
        const left = quadraticBezier(p0, p1, p2, t0)
        const right = quadraticBezier(p0, p1, p2, t1)
        const MinimumSqrDistance = 1.75
        const DivisionThreshold = -0.99995
        if (left.distanceToSquared(right) < MinimumSqrDistance) {
            return 0;
        }
        const midT = (t0 + t1) / 2;
        const mid = quadraticBezier(p0, p1, p2, midT);

        var leftDirection = left.clone().sub(mid).normalize()
        var rightDirection = right.clone().sub(mid).normalize()

        if (leftDirection.dot(rightDirection) > DivisionThreshold || Math.abs(midT - 0.5) < 0.0001) {
            let pointsAddedCount = 0;
            pointsAddedCount += recursiveSubdivide(t0, midT, insertionIndex, depth + 1)
            //  pointsAddedCount += FindDrawingPoints(curveIndex, t0, midT, pointList, insertionIndex, controlPoints, depth + 1);
            points.splice(insertionIndex + pointsAddedCount, 0, mid);
            pointsAddedCount++;
            pointsAddedCount += recursiveSubdivide(midT, t1, insertionIndex + pointsAddedCount, depth + 1)
            //   FindDrawingPoints(curveIndex, midT, t1, pointList, insertionIndex + pointsAddedCount, controlPoints, depth + 1);
            return pointsAddedCount;
        }

        return 0;
    }

    const left = quadraticBezier(p0, p1, p2, 0)
    const right = quadraticBezier(p0, p1, p2, 1)
    points.push(left);
    points.push(right);
    recursiveSubdivide(0, 1, 1, 0);
    return points;
}

export function cubicBezierToLinesByCurvature(p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2) {
    const points: Vector2[] = []
    function recursiveSubdivide(t0: number, t1: number, insertionIndex: number, depth: number) {
        if (depth > 999) {
            return 0;
        }
        const left = cubicBezier(p0, p1, p2, p3, t0)
        const right = cubicBezier(p0, p1, p2, p3, t1)
        const MinimumSqrDistance = 1.75
        const DivisionThreshold = -0.9995

        if (left.distanceToSquared(right) < MinimumSqrDistance) {
            return 0;
        }
        const midT = (t0 + t1) / 2;
        const mid = cubicBezier(p0, p1, p2, p3, midT);

        var leftDirection = left.clone().sub(mid).normalize()
        var rightDirection = right.clone().sub(mid).normalize()

        if (leftDirection.dot(rightDirection) > DivisionThreshold || Math.abs(midT - 0.5) < 0.0001) {
            let pointsAddedCount = 0;
            pointsAddedCount += recursiveSubdivide(t0, midT, insertionIndex, depth + 1)
            //  pointsAddedCount += FindDrawingPoints(curveIndex, t0, midT, pointList, insertionIndex, controlPoints, depth + 1);
            points.splice(insertionIndex + pointsAddedCount, 0, mid);
            pointsAddedCount++;
            pointsAddedCount += recursiveSubdivide(midT, t1, insertionIndex + pointsAddedCount, depth + 1)
            //   FindDrawingPoints(curveIndex, midT, t1, pointList, insertionIndex + pointsAddedCount, controlPoints, depth + 1);
            return pointsAddedCount;
        }

        return 0;
    }

    const left = cubicBezier(p0, p1, p2, p3, 0)
    const right = cubicBezier(p0, p1, p2, p3, 1)
    points.push(left);
    points.push(right);
    recursiveSubdivide(0, 1, 1, 0);
    return points;
}

export function subdivideRationalBezier(points: Vector2[], weights: number[], t: number) {
    // 转换为齐次坐标
    const homogeneous = points.map((p, i) => ({
        x: p.x * weights[i],
        y: p.y * weights[i],
        w: weights[i]
    }));

    // 德卡斯特里奥插值生成细分后的齐次控制点
    const leftHomogeneous = [];
    const rightHomogeneous = [];
    const n = homogeneous.length;
    const temp = [...homogeneous];

    leftHomogeneous.push({ ...temp[0] }); // 左子曲线第一个控制点
    rightHomogeneous.unshift({ ...temp[n - 1] }); // 右子曲线最后一个控制点

    for (let k = 1; k < n; k++) {
        for (let i = 0; i < n - k; i++) {
            temp[i] = {
                x: (1 - t) * temp[i].x + t * temp[i + 1].x,
                y: (1 - t) * temp[i].y + t * temp[i + 1].y,
                w: (1 - t) * temp[i].w + t * temp[i + 1].w
            };
        }
        leftHomogeneous.push({ ...temp[0] }); // 左子曲线后续控制点
        rightHomogeneous.unshift({ ...temp[n - k - 1] }); // 右子曲线前置控制点
    }

    // 投影回原空间
    const leftCurve = leftHomogeneous.map(q => ({
        point: { x: q.x / q.w, y: q.y / q.w },
        weight: q.w
    }));

    const rightCurve = rightHomogeneous.map(q => ({
        point: { x: q.x / q.w, y: q.y / q.w },
        weight: q.w
    }));

    return { leftCurve, rightCurve };
}

/**
 * 将二次有理贝塞尔曲线细分为普通二次贝塞尔曲线
 * @param {Object} P0 起点坐标，格式 { x: number, y: number }
 * @param {Object} P1 控制点坐标，格式 { x: number, y: number }
 * @param {Object} P2 终点坐标，格式 { x: number, y: number }
 * @param {number} w0 起点权重
 * @param {number} w1 控制点权重
 * @param {number} w2 终点权重
 * @param {number} [tolerance=1e-6] 权重差异容差
 * @param {number} [maxDepth=8] 最大递归深度
 * @returns {Array} 普通二次贝塞尔曲线数组，每条曲线表示为 [Q0, Q1, Q2]
 */
export function rationalQuadraticToBeziers(P0, P1, P2, w0, w1, w2, tolerance = 1e-6, maxDepth = 8) {
    // 判断权重是否足够接近普通曲线条件（例如，权重相等或满足特定关系）
    if (maxDepth <= 0 || areWeightsConvertible(w0, w1, w2, tolerance)) {
        // 转换为普通贝塞尔曲线（此处假设权重差异可忽略，直接使用当前控制点）
        return [[P0, P1, P2]];
    }

    // 在t=0.5处细分曲线
    const [left, right] = subdivideRationalCurve(P0, P1, P2, w0, w1, w2, 0.5);

    // 递归处理左右子曲线
    const leftCurves = rationalQuadraticToBeziers(...left, tolerance, maxDepth - 1);
    const rightCurves = rationalQuadraticToBeziers(...right, tolerance, maxDepth - 1);

    return [...leftCurves, ...rightCurves];
}

/**
 * 在参数t处细分二次有理贝塞尔曲线
 * @returns {Array} 左右子曲线的参数数组 [leftParams, rightParams]
 */
function subdivideRationalCurve(P0: Vector2, P1: Vector2, P2: Vector2, w0: number, w1: number, w2: number, t: number) {
    // 转换为齐次坐标
    const Q0 = { x: P0.x * w0, y: P0.y * w0, w: w0 };
    const Q1 = { x: P1.x * w1, y: P1.y * w1, w: w1 };
    const Q2 = { x: P2.x * w2, y: P2.y * w2, w: w2 };

    // 德卡斯特里奥算法分割
    const A0 = lerpVec3(Q0, Q1, t);
    const A1 = lerpVec3(Q1, Q2, t);
    const B0 = lerpVec3(A0, A1, t);

    // 左子曲线参数
    const leftP0 = { x: Q0.x / Q0.w, y: Q0.y / Q0.w };
    const leftP1 = { x: A0.x / A0.w, y: A0.y / A0.w };
    const leftP2 = { x: B0.x / B0.w, y: B0.y / B0.w };
    const leftW0 = Q0.w;
    const leftW1 = A0.w;
    const leftW2 = B0.w;

    // 右子曲线参数
    const rightP0 = { x: B0.x / B0.w, y: B0.y / B0.w };
    const rightP1 = { x: A1.x / A1.w, y: A1.y / A1.w };
    const rightP2 = { x: Q2.x / Q2.w, y: Q2.y / Q2.w };
    const rightW0 = B0.w;
    const rightW1 = A1.w;
    const rightW2 = Q2.w;

    return [
        [leftP0, leftP1, leftP2, leftW0, leftW1, leftW2],
        [rightP0, rightP1, rightP2, rightW0, rightW1, rightW2]
    ];
}

/** 线性插值 */
function lerpVec3(a:any, b:any, t:number) {
    return {
        x: (1 - t) * a.x + t * b.x,
        y: (1 - t) * a.y + t * b.y,
        w: (1 - t) * a.w + t * b.w
    };
}

/** 检查权重是否可转换为普通曲线 */
function areWeightsConvertible(w0, w1, w2, tolerance) {
    // 检查权重是否近似相等
    const avg = (w0 + w1 + w2) / 3;
    const variance = (Math.pow(w0 - avg, 2) + Math.pow(w1 - avg, 2) + Math.pow(w2 - avg, 2)) / 3;
    return variance <= tolerance;
}