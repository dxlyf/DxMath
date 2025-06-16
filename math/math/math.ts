import { Vector2 } from "./vec2";

export const K=(4*(Math.sqrt(2)-1))/3 // 黄金分割率

export const PI = Math.PI
export const PI2 = PI * 2;
export const DEGREES_RADIAN = PI / 180
export const INVERT_DEGREES_RADIAN = 1 / DEGREES_RADIAN
export const EPSILON = 1e-6
export const ScalarNearlyZero = 1e-6;
const Scalar1 = 1;
const ScalarSinCosNearlyZero = (Scalar1 / (1 << 16))

// 两个向量间的夹角0-pi
export function angleTo(a: Vector2, b: Vector2) {
    return Math.acos(a.dot(b) / (a.length() * b.length()))
}
// 两个向量间的夹角-pi到pi
export function atan2To(a: Vector2, b: Vector2) {
    return Math.atan2(b.y, b.x) - Math.atan2(a.y, a.x)
}
// 两个向量间的夹角-pi到pi
export function atan2To2(a: Vector2, b: Vector2) {
    return Math.atan2(b.cross(a), a.dot(b))
}
export function atan2To3(a: Vector2, b: Vector2) {
    const sign = b.cross(a)>=0?1:-1// 如果大于0，顺时针，否则逆时针
    return sign*Math.acos(a.dot(b)/(a.length()*b.length()))
}


export function atan(x:number):number{
    if(x===Infinity){
        return Math.PI/2
    }else if(x===-Infinity){
        return -Math.PI/2
    }
    if(x===0){
        return 0
    }
    if(x>1){
        return Math.PI/2-atan(1/x)
    }
    if(x<0){
        return -atan(-x)
    }
    let term=x
    let sum=x
    for(let i=1;i<=50;i++){
        term*=-x*x
        sum+=term/(2*i+1)
    }
    return sum
}
export function atan2(y: number, x: number) {
    return Math.atan2(y,x)
}
export function atan2_2(y: number, x: number) {
    if(x>=0){
        return Math.atan(y/x)
    }else if(x*y<=0){
        return Math.atan(y/x)+PI
    }else{
        return Math.atan(y/x)-PI
    }
}
export function atan_3(y: number, x: number) {
    const start = Vector2.create(1, 0)
    const normalize = Vector2.create(x, y).normalize()
    const sign = start.cross(normalize)>=0?1:-1// 如果大于0，顺时针，否则逆时针
    return sign*Math.acos(start.dot(normalize))
}

// 点到线段的最短距离平方

export function squaredDistanceToLineSegment(
    x: number, y: number,
    x1: number, y1: number,
    x2: number, y2: number
): number {
    const a = x - x1;
    const b = y - y1;
    const c = x2 - x1;
    const d = y2 - y1;

    const dot = (a * c) + (b * d);
    const lenSq = (c * c) + (d * d);
    let param = -1;

    if (lenSq !== 0) {
        param = dot / lenSq;
    }

    let xx; let
        yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    }
    else if (param > 1) {
        xx = x2;
        yy = y2;
    }

    else {
        xx = x1 + (param * c);
        yy = y1 + (param * d);
    }

    const dx = x - xx;
    const dy = y - yy;

    return (dx * dx) + (dy * dy);
}

export function alignSize(n: number) {
    return (n + 7) & ~7; // 对齐到8字节边界
}
export function paddingRound(x: number, y: number) {
    return x & (~(y - 1))
}
// 计算以最小percision单位，增加值.保证都是precision的倍数
// 和alignSize差不多

export function ceiling(num: number, precision: number): number {
    return (((num / precision) | 0) + 1) * precision;
}

export function scalarNearlyEqual(x: number, y: number, tolerance = ScalarNearlyZero) {
    return Math.abs(x - y) <= tolerance;
}

export function nearly_equal(a: Vector2, b: Vector2) {
    return scalarNearlyEqual(a.x, b.x)
        && scalarNearlyEqual(a.y, b.y);
}
export function scalarNearlyZero(x: number, tolerance = ScalarNearlyZero) {
    return Math.abs(x) <= tolerance;
}
export function scalarSinSnapToZero(radians: number) {
    let v = Math.sin(radians);
    return scalarNearlyZero(v, ScalarSinCosNearlyZero) ? 0 : v;
}
export function scalarCosSnapToZero(radians: number) {
    let v = Math.cos(radians);
    return scalarNearlyZero(v, ScalarSinCosNearlyZero) ? 0 : v;
}
export function almostEqual(a: number, b: number, tolerance = ScalarNearlyZero) {
    return Math.abs(a - b) <= tolerance
}
export const equals = (a: number, b: number, tolerance = ScalarNearlyZero) => {
    return Math.abs(a - b) <= tolerance
}
// 三态函数，判断两个double在eps精度下的大小关系
export function dcmp(x: number) {
    if (Math.abs(x) < ScalarNearlyZero) {
        return 0;
    }
    return x < 0 ? -1 : 1;
}
// 德卡斯特劳贝塞尔曲线
export const deCasteljauBezier = (controls: Vector2[], t: number) => {
    const n = controls.length - 1
    const c = controls.slice().map(d => d.clone())
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n - i; j++) {
            c[j].x = (1 - t) * c[j].x + t * c[j + 1].x
            c[j].y = (1 - t) * c[j].y + t * c[j + 1].y
        }
    }
    return c[0]
}
// 伯恩斯坦多项求贝塞尔曲线

export const bezier = (controls: Vector2[], t: number) => {
    const n = controls.length - 1
    let x = 0, y = 0
    for (let i = 0; i <= n; i++) {
        let b = bernstein(n, i, t)
        x += b * controls[i].x
        y += b * controls[i].y

    }
    return Vector2.create(x, y)
}
// 有理贝塞尔曲线

export const rationalBezier = (controls: Vector2[], weight: number[], t: number) => {
    const n = controls.length - 1
    let x = 0, y = 0
    for (let i = 0; i <= n; i++) {
        let b = bernstein(n, i, t) * weight[i]
        x += b * controls[i].x / b
        y += b * controls[i].y / b

    }
    return Vector2.create(x, y)
}
// 求一个函数的导数
// 数值微分，求近似导数
// 中心差分= ∫'(x)=dy/dx
// dy=dx*∫'(x)
export const centralDifference = (fn: any, h: number, ...args: any[]) => {
    return (fn(...args.map(d => d + h)) - fn(...args.map(d => d - h))) / (2 * h)
}
// 求导
// 计算 d/dx f(x)
export function derivative(f: (x: number) => number, x: number, h: number = 1e-5) {
    return (f(x + h) - f(x - h)) / (2 * h);
}
// 多变量偏导 d/dx, d/dy, d/dt
// 示例
// const g = (x, y) => x ** 2 + y ** 3;
// console.log(partialDerivative(g, 0, [2, 3])); // ∂g/∂x ≈4
export function partialDerivative(f: (...args: number[]) => number, varIndex: number, point: number[], h = 1e-5) {
    const shifted = [...point];
    shifted[varIndex] += h;
    const fPlus = f(...shifted);
    shifted[varIndex] -= 2 * h;
    const fMinus = f(...shifted);
    return (fPlus - fMinus) / (2 * h);
}


/**
 * 计算梯形面积
 * @param {number} x0 - 边起点的 x 坐标
 * @param {number} y0 - 边起点的 y 坐标
 * @param {number} x1 - 边终点的 x 坐标
 * @param {number} y1 - 边终点的 y 坐标
 * @returns {number} - 返回有符号面积
 */
export function computeEdgeContribution(x0:number, y0:number, x1:number, y1:number) {
    // 忽略水平边
    if (y0 === y1) return 0;
  
    // 确保 y0 < y1
    if (y0 > y1) {
      [x0, x1] = [x1, x0];
      [y0, y1] = [y1, y0];
    }
  
    // 计算交点的 x 坐标
    const dx = x1 - x0;
    const dy = y1 - y0;
  
    // 计算梯形的面积
    const area = (x0 + x1) * dy / 2;
  
    // 根据边的方向确定符号
    return dx > 0 ? area : -area;
  }
// 前向差分
export const forwardDifferential = (fn: any, h: number, ...args: any[]) => {
    return (fn(...args.map(d => d + h)) - fn(...args)) / h
}
// 后向差分
export const backwardDifferential = (fn: any, h: number, ...args: any[]) => {
    return (fn(...args) - fn(...args.map(d => d - h))) / h
}
export const degreesToRadian = (degrees: number) => {
    return degrees * DEGREES_RADIAN
}
export const radianToDegrees = (radian: number) => {
    return radian * INVERT_DEGREES_RADIAN
}

export const sign = (x: number) => {
    return x > 0 ? 1 : x === 0 ? 0 : -1
}
export const absSign = (x: number) => {
    return x > 0 ? 1 : x === 0 ? Object.is(x, 0) ? 1 : -1 : -1
}
export const random = (min: number, max: number) => {
    return min + (max - min) * Math.random()
}
export const randomFloor = (min: number, max: number) => {
    return Math.floor(min + (max - min) * Math.random())
}
export const randomCeil = (min: number, max: number) => {
    return Math.ceil(min + (max - min) * Math.random())
}
export const randomRound = (min: number, max: number) => {
    return Math.round(min + (max - min) * Math.random())
}
export const fract = (v: number) => {
    return v - Math.trunc(v)
}
// 向上取模 10%100=-90  -10%100=-10 
// 返回的永远是负数
export const ceilMod = (v: number, m: number) => {
    return v - Math.ceil(v / m) * m
}

// 向下取模 10%100=10 -10%100=90
// 返回的永远是正数
export const floorMod = (v: number, m: number) => {
    return v - Math.floor(v / m) * m
}
// 给定偏移和缩放和单位，计算起始坐标值
// 用于标尺或网格的计算起点坐标值
export const calcStartCoordinateValue = (unit: number, offset: number, scalar: number) => {
    //  const scalarUnit=unit*scalar
    // return offset>0?offset-scalarUnit:offset
    //return offset-Math.ceil(offset/scalarUnit)*scalarUnit
    return ceilMod(offset, unit * scalar)
}
// 计算起始刻度值
export const calcStartGraduationValue = (unit: number, offset: number, scalar: number) => {
    // return Math.floor(-offset/(unit*scalar))*unit
    return -Math.ceil(offset / (unit * scalar)) * unit
}
// -2%10 -2 2%10=2
export const mod = (v: number, m: number) => {
    //return v % modulo
    return v - Math.trunc(v / m) * m
}

// 正数向上取整，负数向下取整
// 2%10=-8 -2%10=-2
export const  modUp=(a:number,b:number)=>{
    return a-Math.ceil(a/b)*b
}
// 正数向下取整，负数向向取整
// -2%10 8 2%10=2 remainder
export const  modDown=(a:number,b:number)=>{
    return a-Math.floor(a/b)*b
}
export const clamp = (v: number, min: number, max: number) => {
    return Math.max(Math.min(v, max), min)
}
export const clamp01 = (v: number) => {
    return Math.max(Math.min(v, 1), 0)
}
export const interpolate = (start: number, end: number, t: number) => {
    return start + (end - start) * t
}
export const mix = (edge0: number, edge1: number, t: number) => {
    return edge0 * (1 - t) + edge1 * t
}
export const smoonthstep = (edge1: number, edge2: number, value: number) => {
    const t = clamp((value - edge1) / (edge2 - edge1), 0, 1);
    return t * t * (3 - 2 * t);
}
export const step = (edge: number, value: number) => {
    return value < edge ? 0 : 1;
}
export const swap = (arr: any[], from: any, to: any) => {
    let t = arr[from]
    arr[from] = arr[to]
    arr[to] = t
}

export const isFinite = (x: any) => {
    return Number.isFinite(x)
}
// 阶乘
export const factorial = (x: number):number => {
    const sign = Math.sign(1 / x)
    const absValue = Math.abs(x)
    if (absValue <= 1) {
        return sign;
    }
    return x * factorial(absValue - 1)
}
export const fastFactorial = (x: number):number => {
    if (x <= 1) {
        return 1;
    }
    return x * fastFactorial(x - 1)
}
// 求和
export const sum = (i: number, n: number, add: (sum: number, index: number, len: number) => number) => {
    let sum = 0
    for (; i <= n; i++) {
        sum += add(sum, i, n)
    }
    return sum;
}
// 伯恩斯坦基函数
export const bernstein = (n: number, i: number, t: number) => {
    return nCr(n, i) * Math.pow(t, i) * Math.pow(1 - t, n - i)
}

// 置换考虑排序 abc 有几种置换: 3!=6
export const substitution = (n: number) => {
    // n!
    return factorial(n)
}
// 排列
/**
 * n!/(n-r)! 或 (r~n)!
 * 排队问题。
    排班问题。
    生成所有可能的顺序。
 * @param {*} n 
 * @param {*} r 
 * @returns 
 */
export const nPr = (n: number, r: number) => {
    // n!/(n-r)! =((n-r)~n)!
    return factorial(n) / factorial(n - r)
}
// 组合，不考虑顺序
/**
 * 选择团队成员。
计算彩票中奖概率。
从菜单中选择固定数量的菜品。

 * @param {*} n 
 * @param {*} r 
 * @returns 
 */
export const nCr = (n: number, r: number) => {
    //n!/(n-r)!*r!
    // return nPr(n,r)/factorial(r)
    return factorial(n) / (factorial(n - r) * factorial(r))
}

// Helper: Compute combination C(n, k) 
// 组合等同nCr
export function combination(n: number, k: number) {
    if (k > n) return 0;
    let result = 1;
    for (let i = 1; i <= k; i++) {
        result *= (n - i + 1) / i; // ((n-k)~n)!/k！// 排列数/置换数
    }
    return result;
}
export function roundPrecision(value: number, p: number) {
    return Math.round(value * Math.pow(10, p)) * 1 / Math.pow(10, p)
}
// 计算B样条基函数
function bSplineBasis(i: number, k: number, t: number, knots: number[]) {
    if (k === 1) {
        return (t >= knots[i] && t < knots[i + 1]) ? 1 : 0;
    } else {
        const denom1 = knots[i + k - 1] - knots[i];
        const denom2 = knots[i + k] - knots[i + 1];
        let term1 = 0;
        let term2 = 0;

        if (denom1 !== 0) {
            term1 = ((t - knots[i]) / denom1) * bSplineBasis(i, k - 1, t, knots);
        }

        if (denom2 !== 0) {
            term2 = ((knots[i + k] - t) / denom2) * bSplineBasis(i + 1, k - 1, t, knots);
        }

        return term1 + term2;
    }
}

// 计算B样条曲线上的点
function bSplineCurve(controlPoints, degree, knots, t) {
    const n = controlPoints.length - 1;
    let point = [0, 0];

    for (let i = 0; i <= n; i++) {
        const basis = bSplineBasis(i, degree + 1, t, knots);
        point[0] += controlPoints[i][0] * basis;
        point[1] += controlPoints[i][1] * basis;
    }

    return point;
}

// 生成B样条曲线
// @ts-ignore
function generateBSpline(controlPoints, degree, numPoints = 100) {
    const n = controlPoints.length;
    const knots = [];

    // 生成均匀节点向量
    for (let i = 0; i < n + degree + 1; i++) {
        knots.push(i);
    }

    const curvePoints = [];
    const tMin = knots[degree];
    const tMax = knots[n];

    for (let i = 0; i <= numPoints; i++) {
        const t = tMin + (i / numPoints) * (tMax - tMin);
        const point = bSplineCurve(controlPoints, degree, knots, t);
        curvePoints.push(point);
    }

    return curvePoints;
}


export const Hath = {
    // 常数
    E: 2.718281828459045,
    PI: 3.141592653589793,
    LN10: 2.302585092994046,
    LN2: 0.6931471805599453,
    LOG10E: 0.4342944819032518,
    LOG2E: 1.4426950408889634,
    SQRT1_2: 0.7071067811865476,
    SQRT2: 1.4142135623730951,
    myAtan2(y, x) {
        if (x > 0) {
            return Math.atan(y / x);
        } else if (x < 0 && y >= 0) {
            return Math.atan(y / x) + Math.PI;
        } else if (x < 0 && y < 0) {
            return Math.atan(y / x) - Math.PI;
        } else if (x === 0 && y > 0) {
            return Math.PI / 2;
        } else if (x === 0 && y < 0) {
            return -Math.PI / 2;
        } else { // x === 0 && y === 0
            return 0; // 或者 NaN
        }
    },
    atan3(y: number, x: number) {
        const sign = y >= 0 ? 1 : -1
        const len = Math.sqrt(x * x + y * y);
        const cos = Math.max(-1, Math.min(1, x / len))
        const angle = Math.acos(cos)
        return sign * angle

    },
    // 绝对值
    abs(x) {
        return x < 0 ? -x : x; // 返回x的绝对值
    },

    // 反余弦
    acos(x) {
        if (x < -1 || x > 1) return NaN; // 超出范围返回 NaN
        if (x === 1) return 0; // acos(1) = 0
        if (x === -1) return this.PI; // acos(-1) = π
        return this.PI / 2 - this.asin(x); // acos(x) = π/2 - asin(x)
    },

    // 反双曲余弦
    acosh(x) {
        if (x < 1) return NaN; // 反双曲余弦仅在 x >= 1 时定义
        return this.log(x + this.sqrt(x * x - 1)); // 使用 log 和 sqrt 计算
    },

    // 反正弦
    asin(x) {
        if (x < -1 || x > 1) return NaN; // 超出范围返回 NaN
        // cos^2+sin^2=1 
        // 1-sin^2=cos^2 
        // sqrt(cos^2)=cos
        // sin/cos=tan   atan(tan)=radian
        return this.atan(x / this.sqrt(1 - x * x)); // asin(x) = atan(x / sqrt(1 - x^2))
    },

    // 反双曲正弦
    asinh(x) {
        return this.log(x + this.sqrt(x * x + 1)); // 使用 log 和 sqrt 计算
    },

    // 反正切
    atan(x) {
        // 处理特殊情况
        if (x === Infinity) return this.PI / 2; // 正无穷大
        if (x === -Infinity) return -this.PI / 2; // 负无穷大
        if (x === 0) return 0; // 0

        // 使用分段方法
        if (x < 0) {
            return -this.atan(-x); // 利用奇偶性
        }

        if (x > 1) {
            // 使用 atan(x) = PI/2 - atan(1/x)
            // 1/tan=cos/sin=cot
            return this.PI / 2 - this.atan(1 / x);
        }

        // 使用泰勒级数近似
        let sum = 0;
        let term = x; // 第一个项是 x
        const nTerms = 20; // 增加近似的项数
        for (let n = 0; n < nTerms; n++) {
            sum += term / (2 * n + 1); // 计算每一项
            term *= -x * x; // 生成下一个项
        }

        return sum; // 返回反正切的近似值
    },

    // 反双曲正切
    atanh(x) {
        if (x <= -1 || x >= 1) return NaN; // 反双曲正切仅在 -1 < x < 1 时定义
        return 0.5 * this.log((1 + x) / (1 - x)); // 使用 log 计算
    },

    // 反正切，接受两个参数
    atan2(y, x) {
        if (x > 0) return this.atan(y / x); // 第一象限 和 第四象限
        if (x < 0 && y >= 0) return this.atan(y / x) + this.PI; // 第二象限
        if (x < 0 && y < 0) return this.atan(y / x) - this.PI; // 第三象限
        if (x === 0 && y > 0) return this.PI / 2; // y 轴正方向
        if (x === 0 && y < 0) return -this.PI / 2; // y 轴负方向
        return 0; // 当 x 和 y 都为 0
    },

    // 向上取整
    ceil(x) {
        return x % 1 === 0 ? x : (x < 0 ? this.floor(x) : this.floor(x) + 1); // 向上取整
    },

    // 立方根
    cbrt(x) {
        return x < 0 ? -this.pow(-x, 1 / 3) : this.pow(x, 1 / 3); // 处理负数
    },

    // e^x - 1
    expm1(x) {
        return this.exp(x) - 1; // 使用指数函数计算
    },

    // 计数前导零
    clz32(x) {
        return (x >>> 0).toString(2).length > 0 ? 32 - (x >>> 0).toString(2).length : 32; // 计算前导零
    },

    // 余弦
    cos(x) {
        return this.sin(x + this.PI / 2); // cos(x) = sin(x + π/2)
    },

    // 双曲余弦
    cosh(x) {
        return (this.exp(x) + this.exp(-x)) / 2; // 使用指数计算
    },

    // 指数
    exp(x) {
        let sum = 1; // e^0 = 1
        let term = 1; // 0! = 1
        for (let n = 1; n <= 10; n++) {
            term *= x / n; // term = x^n / n!
            sum += term; // 累加每一项
        }
        return sum; // 返回指数的近似值
    },

    // 向下取整
    floor(x) {
        return x % 1 === 0 ? x : (x < 0 ? (x | 0) : this.ceil(x) - 1); // 向下取整
    },

    // 浮点数近似
    fround(x) {
        return x; // 简单实现，实际应用中可以更复杂
    },

    // 欧几里得距离
    hypot(...args) {
        return this.sqrt(args.reduce((sum, val) => sum + this.pow(val, 2), 0)); // 计算距离
    },

    // 整数相乘
    imul(a, b) {
        return (a * b) | 0; // 使用位运算确保返回32位整数
    },

    // 对数
    log(x) {
        if (x <= 0) return NaN; // 不处理非正数
        let result = 0;
        let term = (x - 1) / (x + 1); // 使用（x-1）/(x+1)转换
        let termSquared = term * term; // 计算平方项
        for (let n = 0; n < 10; n++) {
            result += (1 / (2 * n + 1)) * this.pow(term, 2 * n + 1); // 计算对数的每一项
        }
        return 2 * result; // log(x) = 2 * Σ
    },

    // 自然对数 (1 + x)
    log1p(x) {
        return this.log(1 + x); // 使用 log 计算
    },

    // 以2为底的对数
    log2(x) {
        return this.log(x) / this.LN2; // 使用自然对数计算
    },

    // 以10为底的对数
    log10(x) {
        return this.log(x) / this.LN10; // 使用自然对数计算
    },

    // 最大值
    max(...args) {
        let maxValue = -Infinity;
        for (const value of args) {
            if (value > maxValue) {
                maxValue = value; // 查找最大值
            }
        }
        return maxValue; // 返回最大值
    },

    // 最小值
    min(...args) {
        let minValue = Infinity;
        for (const value of args) {
            if (value < minValue) {
                minValue = value; // 查找最小值
            }
        }
        return minValue; // 返回最小值
    },

    // 幂运算
    pow(base, exponent) {
        let result = 1;
        const positiveExponent = this.abs(exponent);
        for (let i = 0; i < positiveExponent; i++) {
            result *= base; // 计算幂
        }
        return exponent < 0 ? 1 / result : result; // 处理负指数
    },

    // 随机数
    random() {
        return Math.random(); // 可以改为自定义实现
    },

    // 四舍五入
    round(x) {
        return this.floor(x + 0.5); // 四舍五入
    },

    // 符号
    sign(x) {
        return x > 0 ? 1 : (x < 0 ? -1 : 0); // 返回符号
    },

    // 正弦
    sin(x) {
        let term = x;
        let sum = term;
        for (let i = 1; i <= 10; i++) {
            term *= -x * x / ((2 * i) * (2 * i + 1)); // 使用泰勒级数计算
            sum += term; // 累加每一项
        }
        return sum; // 返回正弦的近似值
    },

    // 双曲正弦
    sinh(x) {
        return (this.exp(x) - this.exp(-x)) / 2; // 使用指数计算
    },

    // 开平方
    sqrt(x) {
        if (x < 0) return NaN; // 不处理负数
        let result = x;
        let lastResult;
        do {
            lastResult = result;
            result = (result + x / result) / 2; // 巴比伦法
        } while (this.abs(result - lastResult) > 1e-10); // 迭代直到收敛
        return result; // 返回平方根
    },

    // 正切
    tan(x) {
        return this.sin(x) / this.cos(x); // 使用正弦和余弦计算
    },

    // 双曲正切
    tanh(x) {
        return (this.exp(x) - this.exp(-x)) / (this.exp(x) + this.exp(-x)); // 使用指数计算
    },

    // 截断
    trunc(x) {
        return x < 0 ? this.ceil(x) : this.floor(x); // 根据符号返回截断值
    },
};

// 排除r行和c列的矩阵，不包括行列的元素。

export function createLowMatrix(r: number, c: number, n: number, m: Float32Array | number[]) {
    let len = (n - 1) ** 2
    let temp = new Float32Array(len)
    let mlen = m.length
    let k = 0;
    for (let i = 0; i < mlen; i++) {
        let r2 = i % n;
        let c2 = i / n >> 0
        if (!(c2 === c || r === r2)) {
            temp[k++] = m[i]
        }
    }
    return temp
}
export function determinantFromNthMatrix(m: Float32Array | number[]) {
    let n = Math.sqrt(m.length)
    if (n === 2) {
        return m[0] * m[3] - m[1] * m[2]
    }
    let det = 0
    for (let i = 0; i < n; i++) {
        // 选择一列或者一行。
        // let c=i/n>>0 // 选择行
        // let r=i;
        // 先择列
        let r = i / n >> 0
        let c = i;
        // let sign = (i % 2 == 0 ? 1 : -1)// 计算当前是正数还是负数
        let sign = ((r + c) % 2 == 0 ? 1 : -1)// 当前行+列，偶数为正,奇数为负
        let value = m[c * n + r]
        let lowMatrix = createLowMatrix(r, c, n, m) // 复制除当前行/列，低一阶矩阵
        let lowDet = determinantFromNthMatrix(lowMatrix) // 低一阶矩阵行列式
        det += value * lowDet * sign
    }
    return det
}
// 转置矩阵
export function transposeFromNthMatrix(m: Float32Array | number[]) {
    let n = Math.sqrt(m.length)
    let l = m.length
    let out = new Float32Array(l)
    for (let i = 0; i < l; i++) {
        let r = i % n
        let c = i / n >> 0;
        let value = m[i]
        out[r * n + c] = value
    }
    return out
}
// 伴随矩阵
export function adjointFromNthMatrix(m: Float32Array | number[]) {
    let n = Math.sqrt(m.length)
    let l = m.length
    let out = new Float32Array(l)
    // 默认以行向量形式存储，所以要转置，假始是列向量形式存储，则不需要转置
    let tm = transposeFromNthMatrix(m) // 转置矩阵，
    for (let i = 0; i < l; i++) {
        let r = i % n
        let c = i / n >> 0;
        let value = tm[i]
        let sign = ((r + c) % 2 == 0 ? 1 : -1)// 当前行+列，偶数为正,奇数为负
        let cofactor = createLowMatrix(r, c, n, tm)
        let det = determinantFromNthMatrix(cofactor)
        out[i] = det * sign
    }
    return out
}
export function invertFromNMatrix(m: Float32Array | number[]) {
    let det = determinantFromNthMatrix(m) // 计算行列式值
    let adjoinM = adjointFromNthMatrix(m)// 计算伴随矩阵

    let invertDet = 1 / det
    let invertMatrix = adjoinM.map(d => d * invertDet) // 计算逆矩阵

    return invertMatrix
}

export function identityMatrix(out: Float32Array | number[], n: number) {
    for (let i = 0; i < n; i++) {
        out[i + i * n] = 1;
    }
    return out
}
// 初等行变换求逆矩阵
export function invertFromNMatrixByElementary(m: Float32Array | number[]) {
    let n = Math.sqrt(m.length)
    let l = m.length
    let out = new Float32Array(l);
    // 初始化成单位矩阵
    for (let i = 0; i < n; i++) {
        out[i + i * n] = 1;
    }

    // 将a，通过倍增，减，交换行，变成单位矩阵
    let matrix = new Float32Array(m)


    // 交换行
    const swapRow = (matrix: Float32Array | number[], n: number, from: number, to: number) => {
        for (let i = 0; i < n; i++) {
            let col = i * n
            let tmp = matrix[from + col];
            matrix[from + col] = matrix[to + col];
            matrix[to + col] = tmp;
        }
    }

    // 迭代对角线元素
    for (let j = 0; j < n; j++) {
        let main_value = matrix[j + j * n];// 主元，对角线元素
        if (main_value === 0) {// 主元为0，则寻找下个不为0的对角元素，则交换行
            let swap = false
            for (let k = j + 1; j < n; k++) {

                if (matrix[k + k * n] !== 0) {// 找到不为零的行，交换
                    swapRow(matrix, n, j, k)
                    swapRow(out, n, j, k)
                    // 更新主元
                    main_value = matrix[j + j * n]
                    swap = true;
                    break;
                }
            }
            if (!swap) {
                throw new Error("矩阵不可逆")
            }
        }
        // 当前行除以主元，使当前主元归一化
        for (let i = 0; i < n; i++) {
            matrix[j + i * n] /= main_value
            out[j + i * n] /= main_value;
        }
        // 其他行减当前行乘以主元倍数，使其他行的对角线所在列的元素为0

        for (let i = 0; i < n; i++) {
            if (i !== j) {
                let value = matrix[i + j * n]
                for (let k = 0; k < n; k++) {
                    matrix[i + k * n] -= value * matrix[j + k * n];
                    out[i + k * n] -= value * out[j + k * n];
                }
            }
        }
    }

    return out
}
export function multiplyMatrices(result: Float32Array | number[], a: Float32Array | number[], b: Float32Array | number[]) {

    let aRow = Math.sqrt(a.length)
    let bCol = Math.sqrt(b.length)

    if (aRow !== bCol) {
        throw new Error("矩阵维度不匹配，无法相乘");
    }
    result = result || new Float32Array(aRow * bCol);

    for (let i = 0; i < aRow; i++) {
        for (let j = 0; j < bCol; j++) {
            let sum = 0
            for (let k = 0; k < aRow; k++) {
                sum += a[i + k * aRow] * b[k + j * bCol]
            }
            result[i + j * aRow] = sum;
        }
    }
    return result
}

// LU求逆
export function invertFromNMatrixByLU(matrix: Float32Array | number[]) {
    let n = Math.sqrt(matrix.length)
    let l = matrix.length
    let out = new Float32Array(l);
    let L = new Float32Array(l) // 设成单位矩阵下三角矩阵
    let U = new Float32Array(l) // 设成为0的上三角矩阵


    // 初始化成单位矩阵
    for (let i = 0; i < n; i++) {
        L[i + i * n] = 1;
    }

    /***
     * Doolittle算法的步骤如下：

    初始化：设矩阵A的大小为n×n，创建n×n的单位下三角矩阵L和零上三角矩阵U。
    迭代计算：对于每一列k（从1到n）：

    计算U的第k行元素：对于列索引j从k到n，计算U[k, j] = A[k, j] - ∑(L[k, m] * U[m, j])，其中m从1到k-1。
    计算L的第k列元素：对于行索引i从k+1到n，计算L[i, k] = (A[i, k] - ∑(L[i, m] * U[m, k])) / U[k, k]，其中m从1到k-1。
    完成分解：经过上述步骤，矩阵A被分解为L和U的乘积，即A = LU。
     */
    for (let k = 0; k < n; k++) {
        for (let j = k; j < n; j++) {
            let sum = 0
            for (let m = 0; m < k; m++) {
                sum += L[k + m * n] * U[m + j * n]
            }
            U[k + j * n] = matrix[k + j * n] - sum;
        }
        for (let i = k + 1; i < n; i++) {
            let sum = 0
            for (let m = 0; m < k; m++) {
                sum += L[i + m * n] * U[m + k * n]
            }
            L[i + k * n] = (matrix[i + k * n] - sum) / U[k + k * n];
        }

    }
    // 利用前向替换法求解下三角矩阵系统 L * x = b
    // L 为下三角矩阵（对角线非0，通常为1），b 为列向量
    function forwardSubstitution(L: Float32Array | number[], b: number[]) {
        const n = Math.sqrt(L.length);
        const x = new Float32Array(n)
        for (let i = 0; i < n; i++) {
            let sum = 0;
            for (let j = 0; j < i; j++) {
                sum += L[i + j * n] * x[j];
            }
            x[i] = (b[i] - sum) / L[i + i * n];
        }
        return x;
    }

    // 利用后向替换法求解上三角矩阵系统 U * x = b
    function backwardSubstitution(U: Float32Array | number[], b: number[]) {
        const n = Math.sqrt(U.length);
        const x = new Float32Array(n);
        for (let i = n - 1; i >= 0; i--) {
            let sum = 0;
            for (let j = i + 1; j < n; j++) {
                sum += U[i + j * n] * x[j];
            }
            if (U[i + i * n] === 0) {
                throw new Error("零主元，无法进行后向替换");
            }
            x[i] = (b[i] - sum) / U[i + i * n];
        }
        return x;
    }
    // 生成 n 阶单位矩阵
    function identityMatrix(n: number) {
        const I = new Float32Array(n * n);
        for (let i = 0; i < n; i++) {
            I[i + i * n] = 1; // 对角线元素为1，其余为0

        }
        return I;
    }
    function extractColumn(matrix: Float32Array | number[], colIndex: number) {
        const n = Math.sqrt(matrix.length);
        const column: number[] = new Array(n);
        for (let i = 0; i < n; i++) {
            column[i] = matrix[i + colIndex * n]
        }
        return column;
    }
    // 求下三角矩阵 L 的逆：逐列求解 L * x = e_i
    function invertLowerTriangular(L: Float32Array | number[]) {
        const n = Math.sqrt(L.length);
        const L_inv = new Float32Array(n * n);

        const I = identityMatrix(n);
        for (let i = 0; i < n; i++) {
            // 求解 L * x = e_i
            const x = forwardSubstitution(L, extractColumn(I, i)); // 取第 i 列的单位向量
            for (let j = 0; j < n; j++) {
                L_inv[j + i * n] = x[j];
            }
        }
        return L_inv;
    }

    // 求上三角矩阵 U 的逆：逐列求解 U * x = e_i
    function invertUpperTriangular(U: Float32Array | number[]) {
        const n = Math.sqrt(U.length);
        const U_inv = new Float32Array(n * n)

        const I = identityMatrix(n);
        for (let i = 0; i < n; i++) {
            // 求解 U * x = e_i，利用后向替换
            const x = backwardSubstitution(U, extractColumn(I, i));
            for (let j = 0; j < n; j++) {
                U_inv[j + i * n] = x[j];
            }
        }
        return U_inv;
    }
    // let a=multiplyMatrices(null,L,U)

    return multiplyMatrices(null, invertUpperTriangular(U), invertLowerTriangular(L))
}
export const MyMath = (function () {
    // 常量
    const PI = 3.141592653589793;
    const HALF_PI = PI / 2;
    const TWO_PI = PI * 2;
    const E = 2.718281828459045;


    // 绝对值
    function abs(x) {
        const num = Number(x);
        return num < 0 ? -num : num;
    }

    // 最大值
    function max(...args) {
        if (!args.length) return -Infinity;
        let maxVal = -Infinity;
        for (const arg of args) {
            const num = Number(arg);
            if (num !== num) return NaN; // NaN 判断
            if (num > maxVal || maxVal === -Infinity) maxVal = num;
        }
        return maxVal;
    }

    // 最小值
    function min(...args) {
        if (!args.length) return Infinity;
        let minVal = Infinity;
        for (const arg of args) {
            const num = Number(arg);
            if (num !== num) return NaN;
            if (num < minVal || minVal === Infinity) minVal = num;
        }
        return minVal;
    }

    // 向下取整
    function floor(x) {
        const num = Number(x);
        if (num !== num) return NaN;
        if (num === Infinity || num === -Infinity) return num;
        const remainder = num % 1;
        return remainder === 0 ? num : num > 0 ? num - remainder : num - (1 + remainder);
    }

    // 向上取整
    function ceil(x) {
        const num = Number(x);
        if (num !== num) return NaN;
        if (num === Infinity || num === -Infinity) return num;
        const remainder = num % 1;
        return remainder === 0 ? num : num > 0 ? num + (1 - remainder) : num - remainder;
    }

    // 四舍五入
    function round(x) {
        const num = Number(x);
        if (num !== num) return NaN;
        return num >= 0 ? floor(num + 0.5) : ceil(num - 0.5);
    }

    // 平方根（牛顿迭代法）
    function sqrt(x) {
        let guess = x / 2;
        let lastGuess;
        do {
            lastGuess = guess;
            guess = (guess + x / guess) / 2;
        } while (abs(lastGuess - guess) > 1e-15);
        return guess;
    }

    // 幂运算（仅处理整数指数）
    function pow(base, exponent) {
        let result = 1;
        for (let i = 0; i < abs(exponent); i++) result *= base;
        return exponent >= 0 ? result : 1 / result;
    }


    // --- 基础函数复用之前实现 ---
    // [abs(), max(), min(), floor(), ceil(), round(), sqrt(), pow() 等已存在]
    // ...（之前的基础函数实现）...

    // --------------------------
    //       三角函数
    // --------------------------

    // 正弦函数（泰勒展开）
    function sin(x) {
        let num = Number(x);
        if (isNaN(num)) return NaN;
        if (!isFinite(num)) return NaN;

        // 将角度归一化到 [-PI, PI]
        num = num % TWO_PI;
        if (num > PI) num -= TWO_PI;
        else if (num < -PI) num += TWO_PI;

        let term = num;
        let sum = term;
        const xSquared = num * num;
        let n = 1;

        do {
            term *= -xSquared / ((2 * n) * (2 * n + 1));
            sum += term;
            n++;
        } while (abs(term) > 1e-15);

        return sum;
    }

    // 余弦函数（泰勒展开）
    function cos(x) {
        let num = Number(x);
        if (isNaN(num)) return NaN;
        if (!isFinite(num)) return NaN;

        // 将角度归一化到 [-PI, PI]
        num = num % TWO_PI;
        if (num > PI) num -= TWO_PI;
        else if (num < -PI) num += TWO_PI;

        let term = 1;
        let sum = term;
        const xSquared = num * num;
        let n = 1;

        do {
            term *= -xSquared / ((2 * n - 1) * (2 * n));
            sum += term;
            n++;
        } while (abs(term) > 1e-15);

        return sum;
    }

    // 正切函数
    function tan(x) {
        const c = cos(x);
        if (c === 0) return x > 0 ? Infinity : -Infinity;
        return sin(x) / c;
    }

    // --------------------------
    //       反三角函数
    // --------------------------

    // 反正弦（基于反正切实现）
    function asin(x) {
        const num = Number(x);
        if (num < -1 || num > 1) return NaN;
        if (num === -1) return -HALF_PI;
        if (num === 1) return HALF_PI;
        return atan(num / sqrt(1 - num * num));
    }

    // 反余弦（基于反正弦实现）
    function acos(x) {
        const num = Number(x);
        if (num < -1 || num > 1) return NaN;
        return HALF_PI - asin(num);
    }

    // 反正切（泰勒展开 + 范围扩展）
    function atan(x) {
        const num = Number(x);
        if (isNaN(num)) return NaN;
        if (num === 0) return 0;
        if (num === Infinity) return HALF_PI;
        if (num === -Infinity) return -HALF_PI;

        let inverted = false;
        let value = num;
        if (abs(value) > 1) {
            inverted = true;
            value = 1 / value;
        }

        let term = value;
        let sum = term;
        const xSquared = value * value;
        let n = 1;

        do {
            term *= -xSquared;
            sum += term / (2 * n + 1);
            n++;
        } while (abs(term / (2 * n + 1)) > 1e-15);

        return inverted ?
            (value > 0 ? HALF_PI - sum : -HALF_PI - sum) :
            sum;
    }

    // 象限敏感的反正切
    function atan2(y, x) {
        const numY = Number(y);
        const numX = Number(x);
        if (isNaN(numY) || isNaN(numX)) return NaN;

        if (numX > 0) return atan(numY / numX);
        if (numX < 0) {
            return numY >= 0 ?
                atan(numY / numX) + PI :
                atan(numY / numX) - PI;
        }
        // x === 0 的情况
        return numY > 0 ? HALF_PI : numY < 0 ? -HALF_PI : 0;
    }


    return {
        PI,
        E,
        abs,
        max,
        min,
        floor,
        ceil,
        round,
        sqrt,
        pow,
        // ...（之前的常量和函数）...
        sin,
        cos,
        tan,
        asin,
        acos,
        atan,
        atan2
    };
})();
