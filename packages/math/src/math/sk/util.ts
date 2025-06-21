import { Point } from "./point";

const FLT_EPSILON = 1.192092896e-07
const DBL_MIN = 2.2250738585072014e-308
export class Ref<T = number> {
    static from<T = number>(value: T): Ref<T> {
        return new Ref(value)
    }
    value: T
    constructor(value: T) {
        this.value = value;
    }
    swap(other: Ref<T>) {
        let tmp = this.value
        this.value = other.value
        other.value = tmp
    }
}
export class PointerArray<T> {
    static from<T = any>(data: T[]): PointerArray<T> {
        const arr = new this(data)
        return arr as PointerArray<T>
    }
    data: T[] = []
    curIndex: number = 0
    constructor(data: T[]) {
        this.data = data
    }
    get length(): number {
        return this.data.length
    }
    copy(source: PointerArray<T>) {
        this.data = source.data
        this.curIndex = source.curIndex
        return this
    }
    clone() {
        return new PointerArray(this.data).copy(this)
    }
    slice(start: number) {
        const p = new PointerArray(this.data)
        p.curIndex = start
        return p
    }
    get(index: number) {
        return this.data[index + this.curIndex]
    }
    set(index: number, value: T) {
        this.data[index + this.curIndex] = value
        return this
    }

    set value(v: T) {
        this.data[this.curIndex] = v
    }
    get value() {
        return this.data[this.curIndex]
    }
    move(index: number) {
        this.curIndex = index
        return this
    }
    next(index: number = 1) {
        this.move(this.curIndex + index)
        return this
    }
    prev(index: number = 1) {
        this.move(this.curIndex - index)
        return this
    }
}

export class VectorIterator<T> {
    data: T[]
    size: number = 0
    currentIndex = 0
    increase: number = 1
    constructor(size: number, startIndex: number = 0, reverse: boolean = false) {
        this.size = size
        this.currentIndex = startIndex % size
        this.increase = reverse ? size - 1 : 1
        this.data = new Array(size)

    }
    get current() {
        return this.data[this.currentIndex]
    }
    get next() {
        this.currentIndex = (this.currentIndex + this.increase) % this.size
        return this.data[this.currentIndex]
    }
}

export const swap = (a: Ref, b: Ref) => {
    let temp = a.value
    a.value = b.value
    b.value = temp
}


export class FloatPoint extends Float32Array {
    static make(size: number = 4) {
        return new FloatPoint(size)
    }
    static fromXY(x: number, y: number): FloatPoint {
        return new FloatPoint(2).setElements([x, y])
    }
    static splat(x: number, count: number = 2): FloatPoint {
        return new FloatPoint(count).setElements(new Array(count).fill(x))
    }
    static fromPoint(point: Point) {
        let result = new FloatPoint(2)
        result.set([point.x, point.y])
        return result
    }
    static fromPoints(points: Point[], count: number) {
        let result = new FloatPoint(count * 2)
        for (let i = 0; i < count; i++) {
            result.elements[i * 2] = points[i].x
            result.elements[i * 2 + 1] = points[i].y
        }
        return result
    }
    static fromArray(points: number[] | Float32Array, count: number = points.length) {
        let result = new FloatPoint(count)
        for (let i = 0; i < count; i++) {
            result.elements[i] = points[i]
        }
        return result
    }

    constructor(size: number) {
        super(size)

    }

    get x() {
        return this.elements[0]
    }
    set x(value: number) {
        this.elements[0] = value
    }
    get y() {
        return this.elements[1]
    }
    set y(value: number) {
        this.elements[1] = value
    }
    get z() {
        return this.elements[2]
    }
    set z(value: number) {
        this.elements[2] = value
    }
    get w() {
        return this.elements[2]
    }
    set w(value: number) {
        this.elements[2] = value
    }
    get h() {
        return this.elements[3]
    }
    set h(value: number) {
        this.elements[3] = value
    }
    get elements() {
        return this
    }
    setElements(elements: ArrayLike<number>) {
        // for(let i=0;i<this.elements.length;i++){
        //     this.elements[i]=elements[i]
        // }
        this.set(elements)
        return this
    }

    storePoint(target: Point) {
        target.set(this.x, this.y)

    }
    store(target: number[] | Float32Array) {
        for (let i = 0; i < this.elements.length; i += 1) {
            target[i] = this.elements[i]
        }
    }
    storePoints(target: Point[]) {
        for (let i = 0; i < this.elements.length; i += 2) {
            target[i / 2].set(this.elements[i], this.elements[i + 1])
        }
    }

    add(other: FloatPoint) {
        return this.setElements(this.elements.map((e, i) => e + other.elements[i]))
    }
    sub(other: FloatPoint) {
        return this.setElements(this.elements.map((e, i) => e - other.elements[i]))
    }
    mulScalar(scalar: number) {
        return this.setElements(this.elements.map(e => e * scalar))
    }
    min(other: FloatPoint) {
        return this.setElements(this.elements.map((e, i) => Math.min(e, other.elements[i])))
    }
    max(other: FloatPoint) {
        return this.setElements(this.elements.map((e, i) => Math.max(e, other.elements[i])))
    }

    mul(other: FloatPoint) {
        return this.setElements(this.elements.map((e, i) => e * other.elements[i]))
    }
    div(other: FloatPoint) {
        return this.setElements(this.elements.map((e, i) => e / other.elements[i]))
    }
    sqrt() {
        return this.setElements(this.elements.map(e => Math.sqrt(e)))
    }
    inverse() {
        return this.setElements(this.elements.map(e => 1 / e))
    }
    clone() {
        return new FloatPoint(this.elements.length).setElements(this.elements)
    }
    copy(other: FloatPoint) {
        this.elements.set(other.elements)
        return this
    }
    xy() {
        return new FloatPoint(2).setElements([this.x, this.y])
    }
    xyxy() {
        return new FloatPoint(4).setElements([this.x, this.y, this.x, this.y])
    }
    xyz() {
        return new FloatPoint(3).setElements([this.x, this.y, this.z])
    }
    equals(other: FloatPoint) {
        return this.elements.every((e, i) => e == other.elements[i])
    }
    equalsWithTolerance(other: FloatPoint, tolerance = 0.0001) {
        return this.elements.every((e, i) => Math.abs(e - other.elements[i]) < tolerance)
    }
    lerp(a: FloatPoint, b: FloatPoint, t: FloatPoint) {
        return this.setElements(this.elements.map((e, i) => a.elements[i] + t.elements[i] * (b.elements[i] - a.elements[i])))
    }
    clmap(min: FloatPoint, max: FloatPoint) {
        return this.setElements(this.elements.map((e, i) => Math.max(min.elements[i], Math.min(max.elements[i], this.elements[i]))))
    }
}


export function sqrt(value: number) {
    return Math.sqrt(value)
}
export function sk_ieee_float_divide(numer: number, denom: number) {
    return numer / denom;
}
export function min(a: number, b: number) {
    return Math.min(a, b)
}
export function max(a: number, b: number) {
    return Math.max(a, b)
}
export function fabs(value: number) {
    return Math.abs(value)
}

export function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}
export function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}
export function sk_double_nearly_zero(a: number) {
    return a == 0 || fabs(a) < FLT_EPSILON;
}
export function sk_ieee_double_divide( numer: number, denom: number) {
    return numer / denom;
}
export function sk_double_to_float( x:number) {
    return x;
}
export function isFinite(value: number) {
    return Number.isFinite(value)
}
 /**
     * 返回具有 x 的绝对值但 y 符号的数值
     * 等价于 C++ 的 std::copysign(x, y)
     *
     * @param {number} x - 数值，其绝对值将被保留
     * @param {number} y - 数值，其符号将赋值给 x 的绝对值
     * @returns {number} 拥有 x 的绝对值及 y 符号的数值
     */
 export function copysign(x: number, y: number) {
    // 当 y 为 0 时，需要区分正 0 与负 0
    if (y === 0) {
        return 1 / y === -Infinity ? -Math.abs(x) : Math.abs(x);
    }
    return y < 0 ? -Math.abs(x) : Math.abs(x);
}
function magnitude(a: number) {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);

    // 写入 double → 得到其 bit 结构
    view.setFloat64(0, a, true); // little-endian
    const lo = view.getUint32(0, true);
    const hi = view.getUint32(4, true);

    // 合并为 BigInt 位串
    let bits = (BigInt(hi) << 32n) | BigInt(lo);

    // 掩码（只保留 exponent 和 sign）
    const extractMagnitude =
        0b0111111111110000000000000000000000000000000000000000000000000000n;

    bits &= extractMagnitude;

    // 拆成高低写回
    const hi2 = Number((bits >> 32n) & 0xffffffffn);
    const lo2 = Number(bits & 0xffffffffn);
    view.setUint32(0, lo2, true);
    view.setUint32(4, hi2, true);

    return view.getFloat64(0, true);
}

function magnitudeAlt(x: number) {
    return Math.sign(x) * Math.pow(2, Math.floor(Math.log2(Math.abs(x))));
}

export function sk_doubles_nearly_equal_ulps(a: number, b: number, maxUlpsDiff: number=0) {

    // // The maximum magnitude to construct the ulp tolerance. The proper magnitude for
    // // subnormal numbers is minMagnitude, which is 2^-1021, so if a and b are subnormal (having a
    // // magnitude of 0) use minMagnitude. If a or b are infinity or nan, then maxMagnitude will be
    // // +infinity. This means the tolerance will also be infinity, but the expression b - a below
    // // will either be NaN or infinity, so a tolerance of infinity doesn't matter.
    // let   minMagnitude = DBL_MIN;
    // const  maxMagnitude = max(max(magnitude(a), minMagnitude), magnitude(b));

    // // Given a magnitude, this is the factor that generates the ulp for that magnitude.
    // // In numbers, 2 ^ (-precision + 1) = 2 ^ -52.
    // const   ulpFactor =FLT_EPSILON;

    // // The tolerance in ULPs given the maxMagnitude. Because the return statement must use <
    // // for comparison instead of <= to correctly handle infinities, bump maxUlpsDiff up to get
    // // the full maxUlpsDiff range.
    // const  tolerance = maxMagnitude * (ulpFactor * (maxUlpsDiff + 1));

    // // The expression a == b is mainly for handling infinities, but it also catches the exact
    // // equals.
    // return a == b || Math.abs(b - a) < tolerance;

    // 最小非零正数 double（subnormal 的最小正常值）
    const minMagnitude = Number.MIN_VALUE; // ≈ 2^-1022（约 2.2e-308）

    // magnitude()：提取 exponent，清除 mantissa
    const maxMagnitude = Math.max(
        Math.max(magnitude(a), minMagnitude),
        magnitude(b)
    );

    const ulpFactor = Number.EPSILON; // ≈ 2^-52 ≈ 2.220446049250313e-16

    // 乘以 (maxUlpsDiff + 1)，保证 tolerance ≥ n 个 ULPs
    const tolerance = maxMagnitude * (ulpFactor * (maxUlpsDiff + 1));

    return a === b || Math.abs(b - a) < tolerance;
}