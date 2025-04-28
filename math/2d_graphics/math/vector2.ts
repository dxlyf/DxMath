
export type Vector2Like = number[]| Float32Array| Vector2
function set(out: Vector2Like, x: number, y: number) {

    out[0] = x;
    out[1] = y;
    return out
}
function add(out: Vector2Like, a: Vector2Like, b: Vector2Like) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    return out
}
function sub(out: Vector2Like, a: Vector2Like, b: Vector2Like) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    return out
}
function mul(out: Vector2Like, a: Vector2Like, b: Vector2Like) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    return out
}
function multiply(out: Vector2Like, a: Vector2Like, b: Vector2Like) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    return out
}
function multiplyScalar(out: Vector2Like, a: Vector2Like, b: number) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    return out
}
function mulScalar(out: Vector2Like, a: Vector2Like, b: number) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    return out
}
function div(out: Vector2Like, a: Vector2Like, b: Vector2Like) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    return out
}
function dot(a: Vector2Like, b: Vector2Like) {
    return a[0] * b[0] + a[1] * b[1]
}
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
function length(a: Vector2Like) {
    return Math.sqrt(a[0] * a[0] + a[1] * a[1])
}
function normalize(out: Vector2Like, a: Vector2Like) {
    const len = length(a);
    out[0] = a[0] / len;
    out[1] = a[1] / len;
    return out
}
function lerp(out: Vector2Like, a: Vector2Like, b: Vector2Like, t: number) {
    out[0] = a[0] + (b[0] - a[0]) * t;
    out[1] = a[1] + (b[1] - a[1]) * t;
    return out
}
function angle(a: Vector2Like) {
    return Math.atan2(a[1], a[0])
}
function angleBetween(a: Vector2Like, b: Vector2Like) {
    return Math.acos(dot(a, b) / (length(a) * length(b)))
}
function angleTo(a: Vector2Like, b: Vector2Like) {
    return Math.atan2(b[1] - a[1], b[0] - a[0])
}
function angleBetweenPI2(a: Vector2Like, b: Vector2Like) {
    return Math.atan2(cross(b,a),dot(a, b))
}
function perpendicular(out: Vector2Like, a: Vector2Like) {
    out[0] = -a[1];
    out[1] = a[0];
    return out
}
function reflect(out: Vector2Like, a: Vector2Like, n: Vector2Like) {
    const dot = 2 * (a[0] * n[0] + a[1] * n[1]);
    out[0] = a[0] - dot * n[0];
    out[1] = a[1] - dot * n[1];
    return out
}
function negate(out: Vector2Like, a: Vector2Like) {
    out[0] = -a[0];
    out[1] = -a[1];
    return out
}
function abs(out: Vector2Like, a: Vector2Like) {
    out[0] = Math.abs(a[0]);
    out[1] = Math.abs(a[1]);
    return out
}
function round(out: Vector2Like, a: Vector2Like) {
    out[0] = Math.round(a[0]);
    out[1] = Math.round(a[1]);
    return out
}
function floor(out: Vector2Like, a: Vector2Like) {
    out[0] = Math.floor(a[0]);
    out[1] = Math.floor(a[1]);
    return out
}
function ceil(out: Vector2Like, a: Vector2Like) {
    out[0] = Math.ceil(a[0]);
    out[1] = Math.ceil(a[1]);
    return out
}
function min(out: Vector2Like, a: Vector2Like, b: Vector2Like) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    return out
}
function max(out: Vector2Like, a: Vector2Like, b: Vector2Like) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    return out
}
function clamp(out: Vector2Like, a: Vector2Like, min: Vector2Like, max: Vector2Like) {
    out[0] = Math.max(min[0], Math.min(max[0], a[0]));
    out[1] = Math.max(min[1], Math.min(max[1], a[1]));
    return out
}
function fractal(out: Vector2Like, a: Vector2Like) {
    out[0] = a[0] - Math.floor(a[0]);
    out[1] = a[1] - Math.floor(a[1]);
    return out
}
function floorMod(out: Vector2Like, a: Vector2Like, b: Vector2Like) {
    out[0] = a[0] - b[0] * Math.floor(a[0] / b[0]);
    out[1] = a[1] - b[1] * Math.floor(a[1] / b[1]);
    return out
}
function rotate(out: Vector2Like, a: Vector2Like, rad: number) {
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    out[0] = a[0] * cos - a[1] * sin;
    out[1] = a[0] * sin + a[1] * cos;
    return out
}
/**
 * 绕着center旋转
 * @param out 输出
 * @param a 输入
 * @param center  中心点
 */
function rotateAround(out: Vector2Like, a: Vector2Like, center: Vector2Like, rad: number) {
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    out[0] = (a[0] - center[0]) * cos - (a[1] - center[1]) * sin + center[0];
    out[1] = (a[0] - center[0]) * sin + (a[1] - center[1]) * cos + center[1];
    return out
}
function scale(out: Vector2Like, a: Vector2Like, scale: Vector2Like) {
    out[0] = a[0] * scale[0];
    out[1] = a[1] * scale[1];
    return out
}
function scaleAround(out: Vector2Like, a: Vector2Like, center: Vector2Like, scale: Vector2Like) {
    out[0] = (a[0] - center[0]) * scale[0] + center[0];
    out[1] = (a[1] - center[1]) * scale[1] + center[1];
    return out
}
function translate(out: Vector2Like, a: Vector2Like, translate: Vector2Like) {
    out[0] = a[0] + translate[0];
    out[1] = a[1] + translate[1];
    return out
}
function transformMat2d(out: Vector2Like, a: Vector2Like, m: Vector2Like) {
    out[0] = a[0] * m[0] + a[1] * m[2] + m[4];
    out[1] = a[0] * m[1] + a[1] * m[3] + m[5];
    return out
}
function transformMat3d(out: Vector2Like, a: Vector2Like, m: Vector2Like) {
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
function equalsEpsilon(a: Vector2Like, b: Vector2Like, epsilon: number=1e-6) {
    return Math.abs(a[0] - b[0]) < epsilon && Math.abs(a[1] - b[1]) < epsilon
}


export class Vector2 extends Float32Array {
    static readonly BYTE_LENGTH = 2 * Float32Array.BYTES_PER_ELEMENT;
    static default() {
        return new this(0, 0);
    }
    static from(values: Vector2Like) {
        return new this(values[0], values[1]);
    }
    static create(x: number, y: number) { // 静态方法，创建一个新的向量
        return new this(x, y); // 返回新的向量
    }
    static set=set
    static add=add
    static sub=sub
    static mul=mul
    static mulScalar=mulScalar
    static multiply=mul
    static div=div
    static dot=dot
    static cross=cross 
    static distance=distance
    static distanceSquared=distanceSquared
    static lengthSquared=lengthSquared
    static length=length
    static normalize=normalize
    static lerp=lerp
    static angle=angle
    static angleBetween=angleBetween
    static angleTo=angleTo
    static angleBetweenPI2=angleBetweenPI2
    static perpendicular=perpendicular
    static reflect=reflect
    static negate=negate
    static abs=abs
    static round=round
    static floor=floor
    static ceil=ceil
    static min=min
    static max=max
    static clamp=clamp
    static fractal=fractal
    static floorMod=floorMod
    static rotate=rotate
    static rotateAround=rotateAround
    static scale=scale
    static scaleAround=scaleAround
    static translate=translate
    static transformMat2d=transformMat2d
    static transformMat3d=transformMat3d
    static equals=equals
    static isZero=isZero
    static equalsEpsilon=equalsEpsilon
    constructor(...values: number[]) { // 构造函数，传入 x 和 y 坐标
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
        this[0]=source[0]; // 设置 x 坐标
        this[1]=source[1]; // 设置 y 坐标
        return this; // 返回 this，用于链式调用
    }
    clone() { // 复制向量，返回新的向量
        return (this.constructor as unknown as typeof Vector2).create(this[0], this[1]); // 返回新的向量
    }
    add(other: Vector2Like) { // 向量加法，传入另一个向量，返回新的向量
        return add(this, this, other); // 返回新的向量
    }
    sub(other: Vector2Like) { // 向量减法，传入另一个向量，返回新的向量
        return sub(this, this, other); // 返回新的向量
    }
    mul(other: Vector2Like) { // 向量乘法，传入另一个向量，返回新的向量
        return mul(this, this, other); // 返回新的向量
    }
    mulScalar(scalar: number) { // 向量乘法，传入一个标量，返回新的向量
        return multiplyScalar(this, this, scalar); // 返回新的向量
    }
    div(other: Vector2Like) { // 向量除法，传入另一个向量，返回新的向量
        return div(this, this, other); // 返回新的向量
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
        return normalize(this, this); // 返回新的向量
    }
    lerp(other: Vector2Like, t: number) { // 向量插值，传入另一个向量和一个标量，返回新的向量
        return lerp(this, this, other, t); // 返回新的向量
    }
    angle() { // 向量角度，返回一个标量
        return angle(this); // 返回标量
    }
    angleBetween(other: Vector2Like) { // 向量夹角，传入另一个向量，返回一个标量
        return angleBetween(this, other); // 返回标量
    }
    angleTo(other: Vector2Like) { // 向量夹角，传入另一个向量，返回一个标量
        return angleTo(this, other); // 返回标量
    }
    perpendicular() { // 向量垂直向量，返回新的向量
        return perpendicular(this, this); // 返回新的向量
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
    scale(s: Vector2Like) { // 向量缩放，传入一个向量，返回新的向量
        return scale(this, this, s); // 返回新的向量
    }
    scaleAround(center: Vector2Like, scale: Vector2Like) { // 向量绕着center缩放，传入一个向量，返回新的向量
        return scaleAround(this, this, center, scale); // 返回新的向量
    }
    translate(t: Vector2Like) { // 向量平移，传入一个向量，返回新的向量
        return translate(this, this, t); // 返回新的向量
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
    equalsEpsilon(other: Vector2Like, epsilon: number=1e-6) { // 向量相等，传入另一个向量和一个标量，返回一个布尔值
        return Math.abs(this[0] - other[0]) < epsilon && Math.abs(this[1] - other[1]) < epsilon; // 返回布尔    
    }
    toArray() { // 向量转数组，返回一个数组
        return [this[0], this[1]]; // 返回数组
    }
}