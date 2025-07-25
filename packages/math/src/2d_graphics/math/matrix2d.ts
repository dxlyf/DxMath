import { Vector2Like } from "./Vector2"
export type Matrix2dLike = number[] | Float32Array;



function set<T extends Matrix2dLike = Matrix2dLike>(out: T, a: number, b: number, c: number, d: number, e: number, f: number) {
    out[0] = a;
    out[1] = b;
    out[2] = c
    out[3] = d;
    out[4] = e;
    out[5] = f;
    return out;
}
function identity<T extends Matrix2dLike = Matrix2dLike>(out: T) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0
    out[3] = 1;
    out[4] = 0;
    out[5] = 0;
    return out;
}
function translate<T extends Matrix2dLike = Matrix2dLike>(out: T, a: Matrix2dLike, v: Vector2Like) {
    const a00 = a[0], a02 = a[2], a04 = a[4];
    const a01 = a[1], a03 = a[3], a05 = a[5];
    out[0] = a00;
    out[1] = a01;
    out[2] = a02;
    out[3] = a03;
    out[4] = a04 + a00 * v[0] + a02 * v[1];
    out[5] = a05 + a01 * v[0] + a03 * v[1];
    return out;
}
function rotation<T extends Matrix2dLike = Matrix2dLike>(out: T, a: Matrix2dLike, radian: number) {
    const a00 = a[0], a01 = a[2], a02 = a[4];
    const a10 = a[1], a11 = a[3], a12 = a[5];
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    out[0] = a00 * cos + a01 * sin;
    out[1] = a10 * cos + a11 * sin;
    out[2] = a00 * -sin + a01 * cos;
    out[3] = a10 * sin + a11 * cos;
    out[4] = a02;
    out[5] = a12;
    return out;
}
function scale<T extends Matrix2dLike = Matrix2dLike>(out: T, a: Matrix2dLike, v: Vector2Like) {
    const a00 = a[0], a01 = a[2], a02 = a[4];
    const a10 = a[1], a11 = a[3], a12 = a[5];
    const sx = v[0], sy = v[1]
    out[0] = a00 * sx;
    out[1] = a10 * sx;
    out[2] = a01 * sy;
    out[3] = a01 * sy;
    out[4] = a02;
    out[5] = a12;
    return out;
}
// 主行序
function makeTranslation<T extends Matrix2dLike = Matrix2dLike>(out: T, v: Vector2Like) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    out[4] = v[0];
    out[5] = v[1];
    return out;
}
function makeRotation<T extends Matrix2dLike = Matrix2dLike>(out: T, radian: number) {
    const c = Math.cos(radian);
    const s = Math.sin(radian);
    out[0] = c;
    out[1] = s;
    out[2] = -s;
    out[3] = c;
    out[4] = 0;
    out[5] = 0;
    return out;
}
function makeScale<T extends Matrix2dLike = Matrix2dLike>(out: T, v: Vector2Like) {
    const sx = v[0];
    const sy = v[1];
    out[0] = sx;
    out[1] = 0;
    out[2] = 0;
    out[3] = sy;
    out[4] = 0;
    out[5] = 0;
    return out;
}
function makeSkew<T extends Matrix2dLike = Matrix2dLike>(out: T, v: Vector2Like) {
    const kx = Math.tan(v[0]);
    const ky = Math.tan(v[1]);
    out[0] = 1;
    out[1] = ky;
    out[2] = kx;
    out[3] = 1;
    out[4] = 0;
    out[5] = 0;
    return out;
}
function makeTranslationRotationScale<T extends Matrix2dLike = Matrix2dLike>(out: T, v: Vector2Like, radian: number, scale: Vector2Like) {
    const c = Math.cos(radian);
    const s = Math.sin(radian);
    out[0] = c * scale[0];
    out[1] = s * scale[0];
    out[2] = -s * scale[1];
    out[3] = c * scale[1];
    out[4] = v[0];
    out[5] = v[1];
    return out;
}
function makeTranslationRotationScaleOrigin<T extends Matrix2dLike = Matrix2dLike>(out: T, v: Vector2Like, radian: number, scale: Vector2Like, origin: Vector2Like) {
    const c = Math.cos(radian);
    const s = Math.sin(radian);
    const dx=v[0]+origin[0],dy=v[1]+origin[1];
    out[0] = c * scale[0];
    out[1] = s * scale[0];
    out[2] = -s * scale[1];
    out[3] = c * scale[1];
    out[4] = dx - (origin[0] * out[0] + origin[1] * out[2]);
    out[5] = dy - (origin[0] * out[1] + origin[1] * out[3]);
    return out;
}
function makeTranslationSkewRotationScaleOrigin<T extends Matrix2dLike = Matrix2dLike>(out: T, v: Vector2Like,skew:Vector2Like, radian: number, scale: Vector2Like, origin: Vector2Like) {
    const c = Math.cos(radian);
    const s = Math.sin(radian);
    const kx=Math.tan(skew[0]),ky=Math.tan(skew[1]);
    const dx=v[0]+origin[0],dy=v[1]+origin[1];
    out[0] = (c+kx*s) * scale[0];
    out[1] = (ky*s+c) * scale[0];
    out[2] = (-s+kx*c) * scale[1];
    out[3] = (ky*-s+c) * scale[1];
    out[4] = dx - (origin[0] * out[0] + origin[1] * out[2]);
    out[5] = dy - (origin[0] * out[1] + origin[1] * out[3]);
    return out;
}
function makeTranslationRotationScaleOriginPivot<T extends Matrix2dLike = Matrix2dLike>(out: T, v: Vector2Like, radian: number, scale: Vector2Like, origin: Vector2Like,pivot:Vector2Like) {
    const c = Math.cos(radian);
    const s = Math.sin(radian);
    const dx=v[0]+origin[0],dy=v[1]+origin[1];
    const px=pivot[0]+origin[0],py=pivot[1]+origin[1];
    out[0] = c * scale[0];
    out[1] = s * scale[0];
    out[2] = -s * scale[1];
    out[3] = c * scale[1];
    out[4] = dx - (px * out[0] + py * out[2]);
    out[5] = dy - (px * out[1] + py * out[3]);
    return out;
}
function makeTranslationSkewRotationScaleOriginPivot<T extends Matrix2dLike = Matrix2dLike>(out: T, v: Vector2Like,skew:Vector2Like, radian: number, scale: Vector2Like, origin: Vector2Like,pivot:Vector2Like) {
    const c = Math.cos(radian);
    const s = Math.sin(radian);
    const kx=Math.tan(skew[0]),ky=Math.tan(skew[1]);
    const dx=v[0]+origin[0],dy=v[1]+origin[1];
    const px=pivot[0]+origin[0],py=pivot[1]+origin[1];
    out[0] = (c+kx*s) * scale[0];
    out[1] = (ky*c+s) * scale[0];
    out[2] = (-s+kx*c) * scale[1];
    out[3] = (ky*-s+c) * scale[1];
    out[4] = dx - (px * out[0] + py * out[2]);
    out[5] = dy - (px * out[1] + py * out[3]);
    return out;
}

function extractTranslation(out: Vector2Like, a: Matrix2dLike) {
    out[0] = a[4];
    out[1] = a[5];
    return out;
}
function extractRotation(a: Matrix2dLike) {
    return Math.atan2(a[1], a[0]);
}
function extractScale(out: Vector2Like, a: Matrix2dLike) {
    out[0] = Math.sqrt(a[0] * a[0] + a[1] * a[1]);
    out[1] = Math.sqrt(a[2] * a[2] + a[3] * a[3]);
    return out;
}
function extractOrigin(out: Vector2Like, a: Matrix2dLike) {
    const c = Math.cos(extractRotation(a));
    const s = Math.sin(extractRotation(a));
    out[0] = a[4] + c * a[2] * -a[4] - s * a[3] * -a[5];
    out[1] = a[5] + s * a[2] * -a[4] + c * a[3] * -a[5];
    return out;
}

/**
 * 分解 2D 变换矩阵，还原为平移、旋转和缩放值
 * @param out 输出数组，按顺序存储 [tx, ty, rotation, scaleX, scaleY]
 * @param a 输入的 2D 变换矩阵
 * @returns 输出数组
 */
function decompose<T extends Matrix2dLike = Matrix2dLike>(out: T, a: Matrix2dLike) {
    const a00 = a[0];
    const a01 = a[1];
    const a02 = a[2];
    const a03 = a[3];
    const a04 = a[4];
    const a05 = a[5];

    // 提取平移值
    const tx = a04;
    const ty = a05;

    // 提取缩放值
    let scaleX = Math.sqrt(a00 * a00 + a01 * a01);
    let scaleY = Math.sqrt(a02 * a02 + a03 * a03);

    // 提取旋转值
    let rotation = Math.atan2(a01, a00);

    // 处理反射情况
    if (a00 * a03 - a01 * a02 < 0) {
        if (scaleX > scaleY) {
            scaleY = -scaleY;
        } else {
            scaleX = -scaleX;
        }
    }

    // 将结果存入输出数组
    out[0] = tx;
    out[1] = ty;
    out[2] = rotation;
    out[3] = scaleX;
    out[4] = scaleY;

    return out;
}
function multiply<T extends Matrix2dLike = Matrix2dLike>(out: T, a: Matrix2dLike, b: Matrix2dLike) {
    const a00 = a[0];
    const a01 = a[1];
    const a02 = a[2];
    const a03 = a[3];
    const a04 = a[4];
    const a05 = a[5];
    const b00 = b[0];
    const b01 = b[1];
    const b02 = b[2];
    const b03 = b[3];
    const b04 = b[4];
    const b05 = b[5];
    out[0] = a00 * b00 + a02 * b01;
    out[1] = a01 * b00 + a03 * b01;
    out[2] = a00 * b02 + a02 * b03;
    out[3] = a01 * b02 + a03 * b03;
    out[4] = a00 * b04 + a02 * b05 + a04;
    out[5] = a01 * b04 + a03 * b05 + a05;
    return out;
}
function invert<T extends Matrix2dLike = Matrix2dLike>(out: T, a: Matrix2dLike) {
    const a00 = a[0];
    const a01 = a[1];
    const a02 = a[2];
    const a03 = a[3];
    const a04 = a[4];
    const a05 = a[5];
    const det = a00 * a03 - a01 * a02;
    if (!det) {
        return null;
    }
    const invDet = 1 / det;
    out[0] = a03 * invDet;
    out[1] = -a01 * invDet;
    out[2] = -a02 * invDet;
    out[3] = a00 * invDet;
    out[4] = (a02 * a05 - a03 * a04) * invDet;
    out[5] = (a01 * a04 - a00 * a05) * invDet;
    return out;
}
function mapPoint(out: Vector2Like, a: Matrix2dLike, v: Vector2Like) {
    const x = v[0];
    const y = v[1];
    out[0] = a[0] * x + a[2] * y + a[4];
    out[1] = a[1] * x + a[3] * y + a[5];
    return out;
}
function mapPoints(out: Vector2Like[], a: Matrix2dLike, v: Vector2Like[]) {
    for (let i = 0; i < v.length; i += 2) {
        mapPoint(out[i], a, v[i]);
    }
    return out;
}

function hasIdentity(a: Matrix2dLike) {
    return a[0] === 1 && a[1] === 0 && a[2] === 0 && a[3] === 1 && a[4] === 0 && a[5] === 0;
}
function hasTranslation(a: Matrix2dLike) {
    return a[4] !== 0 || a[5] !== 0;
}
function hasRotation(a: Matrix2dLike) {
    return a[0] !== 1 || a[1] !== 0 || a[2] !== 0 || a[3] !== 1;
}
function hasScale(a: Matrix2dLike) {
    return a[0] !== 1 || a[3] !== 1
}
/**
 * 列主序存储
 */
export class Matrix2D extends Float32Array {
    static default() {
        return new this()
    }
    // 列主序
    static fromColumns(a: number, b: number, c: number, d: number, e: number, f: number) {
        return set(new this(), a, b, c, d, e, f)
    }
    static fromMatrix2D(a: Matrix2dLike) {
        const m = this.default()
        m.set(a)
        return m
    }
    static identity = identity
    static multiply = multiply
    static invert = invert
    static makeTranslation = makeTranslation
    static makeRotation = makeRotation
    static makeScale = makeScale
    static makeTranslationRotationScale = makeTranslationRotationScale
    static makeTranslationRotationScaleOrigin = makeTranslationRotationScaleOrigin
    static makeTranslationSkewRotationScaleOrigin=makeTranslationSkewRotationScaleOrigin
    static makeTranslationRotationScaleOriginPivot=makeTranslationRotationScaleOriginPivot
    static makeTranslationSkewRotationScaleOriginPivot=makeTranslationSkewRotationScaleOriginPivot
    static extractTranslation = extractTranslation
    static extractRotation = extractRotation
    static extractScale = extractScale
    static extractOrigin = extractOrigin
    static decompose = decompose
    static mapPoint = mapPoint
    static mapPoints = mapPoints
    static hasTranslation = hasTranslation
    static hasRotation = hasRotation
    static hasScale = hasScale
    static hasIdentity = hasIdentity

    constructor() {
        super(6);
        identity(this);
    }
    get a() {
        return this[0]
    }
    get b() {
        return this[1]
    }
    get c() {
        return this[2]
    }
    get d() {
        return this[3]
    }
    get e() {
        return this[4]
    }
    get f() {
        return this[5]
    }
    identity() {
        return identity(this);
    }
    multiply(a: Matrix2dLike, b: Matrix2dLike) {
        return multiply(this, a, b);
    }
    premultiply(a: Matrix2dLike) {
        return multiply(this, a, this);
    }
    postmultiply(a: Matrix2dLike) {
        return multiply(this, this, a);
    }
    invert() {
        return invert(this, this);
    }
    translate(v: Vector2Like) {
        return translate(this, this, v)
    }

    rotate(radian: number) {
        return rotation(this, this, radian)
    }

    scale(v: Vector2Like) {
        return scale(this, this, v)
    }
    makeTranslation(v: Vector2Like) {
        return makeTranslation(this, v);
    }
    makeRotation(radian: number) {
        return makeRotation(this, radian);
    }
    makeScale(v: Vector2Like) {
        return makeScale(this, v);
    }
    makeSkew(v: Vector2Like) {
        return makeSkew(this, v)
    }
    makeTranslationRotationScale(v: Vector2Like, radian: number, scale: Vector2Like) {
        return makeTranslationRotationScale(this, v, radian, scale);
    }
    makeTranslationRotationScaleOrigin(v: Vector2Like, radian: number, scale: Vector2Like, origin: Vector2Like) {
        return makeTranslationRotationScaleOrigin(this, v, radian, scale, origin);
    }
    makeTranslationSkewRotationScaleOrigin(translate: Vector2Like,skew:Vector2Like, radian: number, scale: Vector2Like, origin: Vector2Like) {
        return makeTranslationSkewRotationScaleOrigin(this, translate,skew, radian, scale, origin);
    }
    makeTranslationRotationScaleOriginPivot(translate: Vector2Like, radian: number, scale: Vector2Like, origin: Vector2Like,pivot:Vector2Like){
        return makeTranslationRotationScaleOriginPivot(this, translate, radian, scale, origin,pivot);
    }
    makeTranslationSkewRotationScaleOriginPivot(translate: Vector2Like,skew:Vector2Like, radian: number, scale: Vector2Like, origin: Vector2Like,pivot:Vector2Like){
        return makeTranslationSkewRotationScaleOriginPivot(this, translate,skew, radian, scale, origin,pivot);
    }
    extractTranslation(out: Vector2Like) {
        return extractTranslation(out, this);
    }
    extractRotation() {
        return extractRotation(this);
    }
    extractScale(out: Vector2Like) {
        return extractScale(out, this);
    }
    extractOrigin(out: Vector2Like) {
        return extractOrigin(out, this);
    }
    mapPoint(v: Vector2Like, out = v) {
        return mapPoint(out, this, v);
    }
    mapPoints(v: Vector2Like[], out = v) {
        return mapPoints(out, this, v);
    }
    hasIdentity() {
        return hasIdentity(this)
    }
    hasRotation() {
        return hasRotation(this)
    }
    hasScale() {
        return hasScale(this)
    }
}