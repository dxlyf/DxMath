import { Vector2 } from "./vec2";

export const BEZIER_CIRCLE_K=(4/3*(Math.sqrt(2)-1)) // 黄金分割率
export const BEZIER_CIRCLE_K2=(delta:number)=>4 / 3 * Math.tan(delta / 4)
// 可以用于绘制四分之一圆 conicTo()
export const CONIC_CIRCLE_K=Math.SQRT1_2//Math.sqrt(2)/2 // cos(pi/4) 0.707106781187

export const PI = Math.PI
export const PI2 = PI * 2;
export const DEGREES_RADIAN = PI / 180
export const INVERT_DEGREES_RADIAN = 1 / DEGREES_RADIAN
export const EPSILON = 1e-6
export const ScalarNearlyZero = 1e-6;
const Scalar1 = 1;
const ScalarSinCosNearlyZero = (Scalar1 / (1 << 16))

/*** 
 * 三角函数
 * x^2+y^2=r^2
 * 
 * cos=x/r sin=y/r tan=y/x  cot=x/y sec=r/x csc=r/y
   函数关系
   倒数关系: tan*cot=1 sin*csc=1 cos*sec=1
   商的关系: tan=sin/cos=sec/csc     cot=cos/sin=csc/sec
            sin/cos=tan cot=cos/sin sec=1/cos csc=1/sin
            sin=tan*cos 

   平方关系 cos^2+sin^2=1 sin=sqrt(1-cos^2)
            tan^2+1=sec^2 tan=sqrt(1-cos^2)/cos
            1+cot^2=csc^2



    恒等式
    cos(a+b)=cos(a)*cos(b)-sin(a)*sin(b)
    cos(a-b)=cos(a)*cos(b)+sin(a)*sin(b)
    sin(a+b)=sin(a)*cos(b)+cos(a)*sin(b)
    sin(a-b)=sin(a)*cos(b)-cos(a)*sin(b)
    tan(a+b)=(tan(a)+tan(b))/(1-tan(a)*tan(b))
    tan(a-b)=(tan(a)-tan(b))/(1+tan(a)*tan(b))

    半角公式
    cos(a/2)=sqrt((1+cos(a))/2)
    sin(a/2)=sqrt((1-cos(a))/2)
    tan(a/2)=sin(a/2)/cos(a/2)=(1-cos(a))/sin(a)=sqrt((1-cos(a))/(1+cos(a)))
    cot(a/2)=csc(0)+cot(a)=(1+cos(a))/sin(a)=sin(a)/(1-cos(a))=sqrt((1+cos(a))/(1-cos(a)))

    降次公式
    sin^2a=(1-cos(2a))/2  cos^a=(1+cos(2a))/2
    tan^2a=(1-cos(2a))/(1+cos(2a)) cot^2a=(1+cos(2a))/(1-cos(2a))


 * 
*/


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

export function getBetweenAngleClockwise(startAngle:number,endAngle:number,clockwise:boolean=false){
    
    let tao = 2 * Math.PI;
    let newStartAngle = startAngle % tao;
    if (newStartAngle < 0) {
        newStartAngle += tao;
    }
    let delta = newStartAngle - startAngle;
    startAngle = newStartAngle;
    endAngle += delta;

    let ccw = !clockwise
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
    return {
        startAngle: startAngle,
        endAngle: endAngle
    }
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
/**
 * 
 * @param value 映射值
 * @param inMin 定义域domain 输入
 * @param inMax 
 * @param outMin 值域range 输出
 * @param outMax 
 * @returns 
 */
export function map(value:number,inMin:number,inMax:number,outMin:number,outMax:number){
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
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
export const divmod = (dividend: number, divisor: number) => {
    let quotient=Math.trunc(dividend/divisor)
    let remainder=dividend%divisor
    if(remainder<0){
        quotient--
        remainder+=divisor
    }
    return [quotient,remainder]
}
export const divmod2 = (dividend: number, divisor: number) => {
    let quotient=Math.floor(dividend/divisor)
    let remainder=dividend-quotient*divisor
    return [quotient,remainder]
}
// mod(a,b)=a%b
export const mod = (v: number, m: number) => {
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
function bSplineCurve(controlPoints:number[][], degree:number, knots:number[], t:number) {
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
    // 默认以列主序形式存储，所以要转置成行主序，假始是行主序形式存储，则不需要转置
    let tm = transposeFromNthMatrix(m) // 转置矩阵，
    for (let i = 0; i < l; i++) {
        let r = i % n
        let c = i / n >> 0;
       // let value = tm[i]
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

export const getIntersectionGridCell=(options:{start:Vector2,dir:Vector2,rows:number,cols:number, cellWidth:number, cellHeight:number,onCollisionDetection?:(x:number,y:number)=>boolean})=>{
    const {start,dir,rows,cols,cellWidth,cellHeight,onCollisionDetection}=options
    const cellSize=Vector2.create(cellWidth,cellHeight)
    const coord=start.clone().div(cellSize) // 屏幕坐标转换为网格坐标
    const mapCoord=coord.clone().floor() // 地图坐标 
    const offset=coord.clone().sub(mapCoord) // 在格子的偏移量
    const sign=dir.clone().sign() // 方向符号
    // 判断正割
    const deltaX=dir.x===0?1e30:Math.abs(1/dir.x); // 正割,dist和x的比 计算x轴相对dir方向的距离
    const deltaY=dir.y===0?1e30:Math.abs(1/dir.y); // 余割 计算y轴相对dir方向的距离
  
    // 计算x轴和y轴的距离
    let sideDistX=sign.x===1?(1-offset.x)*deltaX:offset.x*deltaX // 计算start相对右侧或左侧的距离

    let sideDistY=sign.y===1?(1-offset.y)*deltaY:offset.y*deltaY;// 计算start相对上方和下方距离 
   
    const intersections=[] // 与线段方向相交的格子坐标

    let side=false; // 是否侧面
    let count=rows*cols
    while(count--){
        
        // 如果x轴距离更小，应该向x轴移动，反之向y轴移动
        if(sideDistX<sideDistY){
            side=true
            mapCoord.x+=sign.x;
        }else{
            side=false
            mapCoord.y+=sign.y;
           
        }
        let col=mapCoord.x
        let row=mapCoord.y
    
   
        if(side){
            let x=start.x+sideDistX*cellWidth*dir.x;
            let y=start.y+sideDistX*cellWidth*dir.y
            intersections.push(Vector2.create(x,y))
            sideDistX+=deltaX
        }else{
            let x=start.x+sideDistY*cellHeight*dir.x;
            let y=start.y+sideDistY*cellHeight*dir.y
            intersections.push(Vector2.create(x,y))
            sideDistY+=deltaY
        }
        if(col<0||col>=cols||row<0||row>=rows||onCollisionDetection?.(mapCoord.x,mapCoord.y)){
            break
        }
    }
  
    return intersections;
  }
export const getRays3D = (player:{rotate:number,x:number,y:number},map:number[][], fovAngle:number, width:number, height:number, cellSize:number, fish = true) => {
    const rays = []
    const fovRad=fovAngle / 180 * Math.PI
    const fov = Math.tan(fovRad*0.5)// 视野（0-1）之间
    const origin = Vector2.create(player.x, player.y)
    for (let i = 0; i <= width; i++) {
        // 每个x像素相对光线方向的角度
        const theta = fov * (i / width * 2 - 1) + player.rotate;
        //   const theta=i/width*fov2+player.rotate-fov2/2
        const dir = Vector2.fromRadian(theta)
        // 计算射线与最近相交的格子
        const deltaX = dir.x === 0 ? 1e30 : Math.abs(1 / dir.x)
        const deltaY = dir.y === 0 ? 1e30 : Math.abs(1 / dir.y)

        let col = origin.x / cellSize >> 0
        let row = origin.y / cellSize >> 0
        let x = origin.x / cellSize - col;
        let y = origin.y / cellSize - row;

        let sideDistX = dir.x > 0 ? (1 - x) * deltaX : x * deltaX
        let sideDistY = dir.y > 0 ? (1 - y) * deltaY : y * deltaY
        let side = false
        while (true) {
            if (sideDistX < sideDistY) {
                side = true;
                sideDistX += deltaX
                col += Math.sign(dir.x)
            } else {
                side = false;
                sideDistY += deltaY
                row += Math.sign(dir.y)
            }
            if (map[row][col] > 0) {
                break
            }
        }
        let distance = side ? sideDistX - deltaX : sideDistY - deltaY
        // const target = dir.multiplyScalar(distance * cellSize).add(origin)
        // 移除鱼眼
        let noFishDistance = distance * Math.cos(theta - player.rotate);
        // 计算光线强度
        let lightDiffuse = Math.max(0, Math.cos(fov * (i / width * 2 - 1)))

        rays.push({
            diffuse: Math.pow(lightDiffuse, 64),
            x: i,
            row,
            col,
            value: map[row][col],
            side,
            dir,
            origin,
            distance,// 格子距离
            noFishDistance: noFishDistance
            //  target
        })
    }
    return rays
}

export const drawRays3d=(options:{getStrokeColor:(ray:any)=>string,ctx:CanvasRenderingContext2D,rays:any[],map:number[][]})=>{
    const {ctx,rays,map,getStrokeColor}=options
    const height = ctx.canvas.height;
    const width=ctx.canvas.width
    const halfHeight = height * 0.5;
    const cellSize = width / map[0].length >> 0
    let x1, y1, x2, y2;
    rays.forEach((ray) => {
        let strokeColor = getStrokeColor(ray)
        let lineHeight = height / ray.noFishDistance

        x1 = ray.x;
        y1 = halfHeight - lineHeight * 0.5
        x2 = ray.x;
        y2 = halfHeight + lineHeight * 0.5

        y1 = Math.max(0, Math.min(y1, height))
        y2 = Math.max(0, Math.min(y2, height))

        ctx.beginPath()
        ctx.strokeStyle=strokeColor
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
    })
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
export function multiplyMatrices(result: Float32Array | number[]|null, a: Float32Array | number[], b: Float32Array | number[]) {

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


export function trapezoidalIntegralArea(f:(x:number)=>number, a:number, b:number, n:number) {
    const h = (b - a) / n;
    let sum = (f(a) + f(b)) / 2;
    for (let i = 1; i < n; i++) {
        const x = a + i * h;
        sum += f(x);
    }
    return h * sum;
}

// 完全避免使用位运算符的实现
export function getBit(num:number, bit:number) {
    return Math.floor(Math.abs(num) / Math.pow(2, bit)) % 2;
}

export function setBit(num:number, bit:number, value:number) {
    const mask = Math.pow(2, bit);
    const currentBit = getBit(num, bit);
    if (currentBit === value) return num;
    return value ? num + mask : num - mask;
}

export function bitwiseAnd(a:number, b:number) {
    let result = 0;
    for (let i = 0; i < 32; i++) {
        if (getBit(a, i) && getBit(b, i)) {
            result = setBit(result, i, 1);
        }
    }
    return result;
}

export function bitwiseOr(a:number, b:number) {
    let result = 0;
    for (let i = 0; i < 32; i++) {
        if (getBit(a, i) || getBit(b, i)) {
            result = setBit(result, i, 1);
        }
    }
    return result;
}

function bitwiseXor(a:number, b:number) {
    let result = 0;
    for (let i = 0; i < 32; i++) {
        if (getBit(a, i) !== getBit(b, i)) {
            result = setBit(result, i, 1);
        }
    }
    return result;
}

function bitwiseNot(num:number) {
    // 对于32位整数
    return bitwiseXor(num, -1) >>> 0; // 这里为了演示，实际不能使用>>>
    // 替代方案：
    // return (num ^ 0xFFFFFFFF) + 1; // 但使用了^
    // 完全不用位运算符的方案：
    // let result = 0;
    // for (let i = 0; i < 32; i++) {
    //     if (!getBit(num, i)) {
    //         result = setBit(result, i, 1);
    //     }
    // }
    // return result;
}

function leftShift(num:number, shift:number) {
    return num * Math.pow(2, shift);
}

function rightShift(num:number, shift:number) {
    return Math.floor(num / Math.pow(2, shift));
}

function unsignedRightShift(num:number, shift:number) {
    // 将数字转换为32位无符号整数
    if (num < 0) {
        num = (num + Math.pow(2, 32)) % Math.pow(2, 32);
    }
    return Math.floor(num / Math.pow(2, shift));
}