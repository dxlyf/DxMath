
export type Vector2Like = number[] | Float32Array | Vector2
export type Vector2Point={x:number, y:number}

/**
 * 设置向量的x和y坐标
 *
 * @param out 输出向量
 * @param x x坐标
 * @param y y坐标
 * @returns 返回更新后的向量
 */
function setXY<T extends Vector2Like=Vector2Like>(out: T, x: number, y: number) {
    out[0] = x;
    out[1] = y;
    return out
}

function splat<T extends Vector2Like=Vector2Like>(out: T, x: number) {
    out[0] = x;
    out[1] = x;
    return out
}
function add<T extends Vector2Like=Vector2Like>(out: T, a: Vector2Like, b: Vector2Like) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    return out
}
function subtract<T extends Vector2Like=Vector2Like>(out: T, a: Vector2Like, b: Vector2Like) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    return out
}
function multiply<T extends Vector2Like=Vector2Like>(out: T, a: Vector2Like, b: Vector2Like) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    return out
}
function multiplyScalar<T extends Vector2Like=Vector2Like>(out: T, a: Vector2Like, b: number) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    return out
}

function divide<T extends Vector2Like=Vector2Like>(out: T, a: Vector2Like, b: Vector2Like) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    return out
}
/**
 * 计算两个二维向量的点积
 *
 * @param a 第一个二维向量，支持数组或包含x和y属性的对象
 * @param b 第二个二维向量，支持数组或包含x和y属性的对象
 * @returns 返回两个二维向量的点积
 */
function dot(a: Vector2Like, b: Vector2Like) {
    return a[0] * b[0] + a[1] * b[1]
}
/**
 * 计算两个二维向量的叉积。
 *
 * @param a 第一个二维向量或类似对象，包含两个数值属性 [0] 和 [1]。
 * @param b 第二个二维向量或类似对象，包含两个数值属性 [0] 和 [1]。
 * @returns 返回一个数值，表示两个向量的叉积。
 */
function cross(a: Vector2Like, b: Vector2Like) {
    return a[0] * b[1] - a[1] * b[0]
}
function distance(a: Vector2Like, b: Vector2Like) {
    return Math.sqrt((a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]))
}
function distanceSquared(a: Vector2Like, b: Vector2Like) {
    return (a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1])
}

function lengthSquared(a: Vector2Like) {
    return a[0] * a[0] + a[1] * a[1]
}
// 欧几里得距离
function length(a: Vector2Like) {
    return Math.sqrt(a[0] * a[0] + a[1] * a[1])
}
// 曼哈顿距离
function manhattanDistance(a: Vector2Like, b: Vector2Like) {
    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1])
}
// 切比雪夫距离
function chebyshevDistance(a: Vector2Like, b: Vector2Like) {
    return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]))
}

/**
 * 将一个二维向量归一化
 *
 * @param out 归一化后的向量
 * @param a 待归一化的向量
 * @returns 归一化后的向量
 */
function normalize<T extends Vector2Like=Vector2Like>(out: T, a: Vector2Like) {
    const len = length(a);
    out[0] = a[0] / len;
    out[1] = a[1] / len;
    return out
}
/**
 * 对两个二维向量进行线性插值
 *
 * @param out 存储结果的二维向量
 * @param a 第一个二维向量
 * @param b 第二个二维向量
 * @param t 插值参数，取值范围为[0, 1]
 * @returns 插值后的二维向量
 */
function lerp<T extends Vector2Like=Vector2Like>(out: T, a: Vector2Like, b: Vector2Like, t: number) {
    out[0] = a[0] + (b[0] - a[0]) * t;
    out[1] = a[1] + (b[1] - a[1]) * t;
    return out
}
/**
 * 平滑插值函数，用于在两个二维向量之间进行平滑过渡
 *
 * @param out 输出向量，存储插值结果
 * @param a 起始向量
 * @param b 目标向量
 * @param t 插值参数，范围在0到1之间
 * @returns 输出向量，存储插值结果
 */
function smoonthStep<T extends Vector2Like=Vector2Like>(out: T, a: Vector2Like, b: Vector2Like, t: number) {
    t = (t < 0) ? 0 : ((t > 1) ? 1 : t);
    const h = t * t * (3 - 2 * t);
    return lerp(out, a, b, h)
}
/**
 * 计算向量的角度
 *
 * @param a 一个二维向量对象或数组，包含两个元素，分别代表向量的x和y坐标
 * @returns 返回向量的角度（以弧度为单位）
 */
function angle(a: Vector2Like) {
    return Math.atan2(a[1], a[0])
}
function angle2(a: Vector2Like) {
    return angleToPI2(a, [1, 0])
}
/**
 * 计算两个二维向量之间的夹角（以弧度为单位）。
 *
 * @param a 第一个二维向量。
 * @param b 第二个二维向量。
 * @returns 返回两个向量之间的夹角，以弧度为单位。
 */
function angleTo(a: Vector2Like, b: Vector2Like) {
    return Math.acos(dot(a, b) / (length(a) * length(b)))
}
function angleToPI2(a: Vector2Like, b: Vector2Like) {
    const sign = cross(b, a) >= 0 ? 1 : -1;
    return sign * Math.acos(dot(a, b) / (length(a) * length(b)))
    // return Math.atan2(a[1],a[0])-Math.atan2(b[1],b[0])
}

/**
 * 计算a向量相对原点的角度
 *
 * @param a 第一个二维向量
 * @param b 第二个二维向量
 * @returns 返回a向量相对原点的角度
 */
function angleToOrigin(a: Vector2Like, origin: Vector2Like = [0, 0]) {
    return Math.atan2(a[1] - origin[1], a[0] - origin[0])
}
/**
 * 计算两个二维向量之间的夹角（以弧度为单位），范围为 -π 到 π 之间。
 *
 * @param a 第一个二维向量
 * @param b 第二个二维向量
 * @returns 返回两个向量之间的夹角（以弧度为单位）
 */
function angleBetweenPI2(a: Vector2Like, b: Vector2Like) {
    return Math.atan2(cross(b, a), dot(a, b))
}
/**
 * 计算给定向量的垂直向量
 *
 * @param out 存储结果的向量对象
 * @param a 原始向量对象
 * @returns 返回存储结果的向量对象
 */
function perpendicular<T extends Vector2Like=Vector2Like>(out: T, a: Vector2Like) {
    out[0] = -a[1];
    out[1] = a[0];
    return out
}
/**
 * 反射函数
 *
 * @param out 输出向量，用于存储反射后的结果
 * @param a 输入向量
 * @param n 法向量
 * @returns 返回输出向量 out
 */
function reflect<T extends Vector2Like=Vector2Like>(out: T, a: Vector2Like, n: Vector2Like) {
    const dot = 2 * (a[0] * n[0] + a[1] * n[1]);
    out[0] = a[0] - dot * n[0];
    out[1] = a[1] - dot * n[1];
    return out
}
function negate<T extends Vector2Like=Vector2Like>(out: T, a: Vector2Like) {
    out[0] = -a[0];
    out[1] = -a[1];
    return out
}
function abs<T extends Vector2Like=Vector2Like>(out: T, a: Vector2Like) {
    out[0] = Math.abs(a[0]);
    out[1] = Math.abs(a[1]);
    return out
}
function round<T extends Vector2Like=Vector2Like>(out: T, a: Vector2Like) {
    out[0] = Math.round(a[0]);
    out[1] = Math.round(a[1]);
    return out
}
function floor<T extends Vector2Like=Vector2Like>(out: T, a: Vector2Like) {
    out[0] = Math.floor(a[0]);
    out[1] = Math.floor(a[1]);
    return out
}
function ceil<T extends Vector2Like=Vector2Like>(out: T, a: Vector2Like) {
    out[0] = Math.ceil(a[0]);
    out[1] = Math.ceil(a[1]);
    return out
}
function min<T extends Vector2Like=Vector2Like>(out: T, a: Vector2Like, b: Vector2Like) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    return out
}
function max<T extends Vector2Like=Vector2Like>(out: T, a: Vector2Like, b: Vector2Like) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    return out
}
function clamp<T extends Vector2Like=Vector2Like>(out: T, a: Vector2Like, min: Vector2Like, max: Vector2Like) {
    out[0] = Math.max(min[0], Math.min(max[0], a[0]));
    out[1] = Math.max(min[1], Math.min(max[1], a[1]));
    return out
}
/**
 * 计算向量的分数部分
 *
 * @param out 存储结果的向量
 * @param a 输入的向量
 * @returns 存储结果的向量
 */
function fractal<T extends Vector2Like=Vector2Like>(out: T, a: Vector2Like) {
    out[0] = a[0] - Math.floor(a[0]);
    out[1] = a[1] - Math.floor(a[1]);
    return out
}
/**
 * 计算向量a对向量b的模运算结果，并将结果存储在向量out中
 *
 * @param out 存储结果的向量
 * @param a 被除数的向量
 * @param b 除数的向量
 * @returns 存储结果的向量
 */
function floorMod<T extends Vector2Like=Vector2Like>(out: T, a: Vector2Like, b: Vector2Like) {
    out[0] = a[0] - b[0] * Math.floor(a[0] / b[0]);
    out[1] = a[1] - b[1] * Math.floor(a[1] / b[1]);
    return out
}
/**
 * 将向量 a 绕原点旋转 rad 弧度并存储到 out 中
 *
 * @param out 存储旋转后向量的数组
 * @param a 待旋转的向量数组
 * @param rad 旋转角度（弧度）
 * @returns 旋转后的向量数组
 */
function rotate<T extends Vector2Like = Vector2Like>(out: T, a: Vector2Like, rad: number) {
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const x = a[0]
    const y = a[1]

    out[0] = x * cos - y * sin;
    out[1] = x * sin + y * cos;
    return out
}

/**
 * 围绕指定中心点旋转一个二维向量
 *
 * @param out 输出的二维向量
 * @param a 要旋转的二维向量
 * @param center 旋转中心点
 * @param rad 旋转角度（弧度）
 * @returns 旋转后的二维向量
 */
function rotateAround<T extends Vector2Like=Vector2Like>(out: T, a: Vector2Like, center: Vector2Like, rad: number) {
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const x = a[0] - center[0];
    const y = a[1] - center[1];

    out[0] = x * cos - y * sin + center[0];
    out[1] = x * sin + y * cos + center[1];
    return out
}
function scale<T extends Vector2Like = Vector2Like>(out: T, a: Vector2Like, sx: number, sy: number) {
    out[0] = a[0] * sx;
    out[1] = a[1] * sy;
    return out
}
function scaleAround<T extends Vector2Like = Vector2Like>(out: T, a: Vector2Like, center: Vector2Like, scale: Vector2Like) {
    out[0] = (a[0] - center[0]) * scale[0] + center[0];
    out[1] = (a[1] - center[1]) * scale[1] + center[1];
    return out
}
function translate<T extends Vector2Like = Vector2Like>(out: T, a: Vector2Like, x: number, y: number) {
    out[0] = a[0] + x;
    out[1] = a[1] + y;
    return out
}
function transformMat2d<T extends Vector2Like=Vector2Like>(out: T, a: Vector2Like, m: Vector2Like) {
    out[0] = a[0] * m[0] + a[1] * m[2] + m[4];
    out[1] = a[0] * m[1] + a[1] * m[3] + m[5];
    return out
}
function transformMat3d<T extends Vector2Like=Vector2Like>(out: T, a: Vector2Like, m: Vector2Like) {
    out[0] = a[0] * m[0] + a[1] * m[4] + m[8];
    out[1] = a[0] * m[1] + a[1] * m[5] + m[9];
    return out
}
function equals(a: Vector2Like, b: Vector2Like) {
    return a[0] === b[0] && a[1] === b[1]
}
function isZero(a: Vector2Like) {
    return a[0] === 0 && a[1] === 0
}
function equalsEpsilon(a: Vector2Like, b: Vector2Like, epsilon: number = 1e-6) {
    return Math.abs(a[0] - b[0]) < epsilon && Math.abs(a[1] - b[1]) < epsilon
}


export class Vector2 extends Float32Array {
    static readonly BYTE_LENGTH = 2 * Float32Array.BYTES_PER_ELEMENT;
    static create(x: number, y: number) {
        return new this(x, y)
    }
    static from(values: Vector2Like) {
        return this.create(values[0],values[1])
    }
    static fromPoint(values: {x:number, y:number}) {
        return this.create(values.x,values.y)
    }
    static fromRotation(rad: number) {
        const cos = Math.cos(rad)
        const sin = Math.sin(rad)
        return this.create(cos, sin)
    }
    static default() {
        return this.create(0, 0)
    }
    static zero() {
        return this.create(0, 0)
    }
    static splat(x: number) {
        return this.create(x, x)
    }
    static set = setXY
    static setXY = setXY
    static add = add
    static sub = subtract
    static mul = multiply
    static mulScalar = multiplyScalar
    static multiply = multiply
    static div = divide
    static divide = divide
    static dot = dot
    static cross = cross
    static distance = distance
    static distanceSquared = distanceSquared
    static lengthSquared = lengthSquared
    static length = length
    static normalize = normalize
    static lerp = lerp
    static angle = angle
    static angleTo = angleTo
    static angleBetweenPI2 = angleBetweenPI2
    static perpendicular = perpendicular
    static perp = perpendicular
    static reflect = reflect
    static negate = negate
    static abs = abs
    static round = round
    static floor = floor
    static ceil = ceil
    static min = min
    static max = max
    static clamp = clamp
    static fractal = fractal
    static floorMod = floorMod
    static rotate = rotate
    static rotateAround = rotateAround
    static scale = scale
    static scaleAround = scaleAround
    static translate = translate
    static transformMat2d = transformMat2d
    static transformMat3d = transformMat3d
    static equals = equals
    static isZero = isZero
    static equalsEpsilon = equalsEpsilon
    constructor(x: number, y: number)
    constructor(values: Vector2Like)
    constructor(...values: any[]) { // 构造函数，传入 x 和 y 坐标
        if (values.length === 0) {
            super(2);
        } else if (Array.isArray(values[0])) {
            super(values[0]);
        } else {
            super(values); // 调用父类构造函数，传入数组长度为 2，初始值为 0
        }
    }
    get x() { // 获取 x 坐标
        return this[0]; // 返回 x 坐标
    }
    set x(x: number) { // 设置 x 坐标
        this[0] = x; // 设置 x 坐标
    }
    get y() { // 获取 y 坐标
        return this[1]; // 返回 y 坐标
    }
    set y(y: number) { // 设置 y 坐标
        this[1] = y; // 设置 y 坐标
    }
    copy(source: Vector2Like) { // 复制向量，返回新的向量
        this[0] = source[0]; // 设置 x 坐标
        this[1] = source[1]; // 设置 y 坐标
        return this; // 返回 this，用于链式调用
    }
    clone() { // 复制向量，返回新的向量
        return (this.constructor as unknown as typeof Vector2).create(this[0], this[1]); // 返回新的向量
    }
    set(array: ArrayLike<number>, offset?: number):this
    set(x:number, y: number):this
    set(x:number|ArrayLike<number>,y?:number){
        if(Array.isArray(x)){
            super.set(x, y)
            return this
        }
        return setXY(this, x as number, y as number); 
    }
    setXY(x: number, y: number) { // 向量加法，传入另一个向量，返回新的向量
        return setXY(this, x, y); // 返回新的向量
    }
    setRotation(rad: number) {
        return this.setXY(Math.cos(rad), Math.sin(rad))
    }
    splat(x: number) { // 向量加法，传入一个标量，返回新的向量
        return splat(this, x)
    }
    add(other: Vector2Like) { // 向量加法，传入另一个向量，返回新的向量
        return add(this, this, other) as Vector2; // 返回新的向量
    }
    addVectors(a: Vector2Like, b: Vector2Like) { // 向量减法，传入两个向量，返回新的向量
        return add(this, a, b) as Vector2; // 返回新的向量
    }
    sub(other: Vector2Like) { // 向量减法，传入另一个向量，返回新的向量
        return subtract(this, this, other) as Vector2; // 返回新的向量
    }
    subtractVectors(a: Vector2Like, b: Vector2Like) { // 向量减法，传入两个向量，返回新的向量
        return subtract(this, a, b) as Vector2; // 返回新的向量
    }
    mul(other: Vector2Like) { // 向量乘法，传入另一个向量，返回新的向量
        return multiply(this, this, other); // 返回新的向量
    }
    mulScalar(scalar: number) { // 向量乘法，传入一个标量，返回新的向量
        return multiplyScalar(this, this, scalar); // 返回新的向量
    }
    multiplyScalar(scalar: number) { // 向量乘法，传入一个标量，返回新的向量
        return multiplyScalar(this, this, scalar) as Vector2; // 返回新的向量
    }
    div(other: Vector2Like) { // 向量除法，传入另一个向量，返回新的向量
        return divide(this, this, other); // 返回新的向量
    }
    dot(other: Vector2Like) { // 向量点积，传入另一个向量，返回一个标量
        return dot(this, other); // 返回标量
    }
    cross(other: Vector2Like) { // 向量叉积，传入另一个向量，返回一个标量
        return cross(this, other); // 返回标量
    }
    distance(other: Vector2Like) { // 向量距离，传入另一个向量，返回一个标量
        return distance(this, other); // 返回标量
    }
    distanceSquared(other: Vector2Like) { // 向量距离的平方，传入另一个向量，返回一个标量
        return distanceSquared(this, other); // 返回标量
    }
    magnitudeSquared() { // 向量长度的平方，返回一个标量
        return lengthSquared(this); // 返回标量
    }
    magnitude() { // 向量长度，返回一个标量
        return length(this); // 返回标量
    }
    normalize() { // 向量归一化，返回新的向量
        return normalize(this, this) as Vector2; // 返回新的向量
    }
    lerp(other: Vector2Like, t: number) { // 向量插值，传入另一个向量和一个标量，返回新的向量
        return lerp(this, this, other, t); // 返回新的向量
    }
    angle() { // 向量角度，返回一个标量
        return angle(this); // 返回标量
    }
    angleTo(other: Vector2Like) { // 向量夹角，传入另一个向量，返回一个标量
        return angleTo(this, other); // 返回标量
    }
    perp() { // 向量垂直向量，返回新的向量
        return perpendicular(this, this) as Vector2; // 返回新的向量
    }
    ccw() {
        return this.setXY(this.y, -this.x)
    }
    cw() {
        return this.setXY(-this.y, this.x)
    }
    reflect(other: Vector2Like) { // 向量反射，传入另一个向量，返回新的向量
        return reflect(this, this, other); // 返回新的向量
    }
    negate() { // 向量取反，返回新的向量
        return negate(this, this); // 返回新的向量
    }
    abs() { // 向量取绝对值，返回新的向量
        return abs(this, this); // 返回新的向量
    }
    round() { // 向量取整，返回新的向量
        return round(this, this); // 返回新的向量
    }
    floor() { // 向量向下取整，返回新的向量
        return floor(this, this); // 返回新的向量
    }
    ceil() { // 向量向上取整，返回新的向量
        return ceil(this, this); // 返回新的向量
    }
    min(other: Vector2Like) { // 向量取最小值，传入另一个向量，返回新的向量
        return min(this, this, other); // 返回新的向量
    }
    max(other: Vector2Like) { // 向量取最大值，传入另一个向量，返回新的向量
        return max(this, this, other); // 返回新的向量
    }
    clamp(min: Vector2Like, max: Vector2Like) { // 向量取限定值，传入两个向量，返回新的向量
        return clamp(this, this, min, max); // 返回新的向量
    }
    fractal() { // 向量取小数部分，返回新的向量
        return fractal(this, this); // 返回新的向量
    }
    floorMod(other: Vector2Like) { // 向量取模，传入另一个向量，返回新的向量
        return floorMod(this, this, other); // 返回新的向量
    }
    rotate(rad: number) { // 向量旋转，传入一个标量，返回新的向量
        return rotate(this, this, rad); // 返回新的向量
    }
    rotateAround(center: Vector2Like, rad: number) { // 向量绕着center旋转，传入一个标量，返回新的向量
        return rotateAround(this, this, center, rad); // 返回新的向量
    }
    scale(sx: number, sy: number) { // 向量缩放，传入一个向量，返回新的向量
        return scale(this, this, sx, sy); // 返回新的向量
    }
    scaleAround(center: Vector2Like, scale: Vector2Like) { // 向量绕着center缩放，传入一个向量，返回新的向量
        return scaleAround(this, this, center, scale); // 返回新的向量
    }
    translate(x: number, y: number) { // 向量平移，传入一个向量，返回新的向量
        return translate(this, this, x, y); // 返回新的向量
    }
    transformMat2d(m: Vector2Like) { // 向量变换，传入一个矩阵，返回新的向量
        return transformMat2d(this, this, m); // 返回新的向量
    }
    transformMat3d(m: Vector2Like) { // 向量变换，传入一个矩阵，返回新的向量
        return transformMat3d(this, this, m); // 返回新的向量
    }
    equals(other: Vector2Like) { // 向量相等，传入另一个向量，返回一个布尔值
        return this[0] === other[0] && this[1] === other[1]; // 返回布尔值
    }
    equalsEpsilon(other: Vector2Like, epsilon: number = 1e-6) { // 向量相等，传入另一个向量和一个标量，返回一个布尔值
        return Math.abs(this[0] - other[0]) < epsilon && Math.abs(this[1] - other[1]) < epsilon; // 返回布尔    
    }
    toZero( b:Vector2Like){
        let a=this;
        if (a[0] + b[0] == a[0]) {
            b[0] = 0;
        } else if (a[0] + b[0] == b[0]) {
            a[0] = 0;
        }
        if (a[1] + b[1] == a[1]) {
            b[1] = 0;
        } else if (a[1] + b[1] == b[1]) {
            a[1] = 0;
        }
        return this
    }
    toArray() { // 向量转数组，返回一个数组
        return [this[0], this[1]]; // 返回数组
    }
}