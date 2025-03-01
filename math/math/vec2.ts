import { Matrix2D } from "./mat2d"
import { Matrix3 } from "./mat3"

export class Vector2 {
    static AreFinite(v: Vector2[]) {
        return !v.some(d => !d.isFinite())
    }
    static CanNormalize(dx: number, dy: number) {
        return Number.isFinite(dx) && Number.isFinite(dy) && (dx || dy);
    }
    static EqualsWithinTolerance(p1: Vector2, p2: Vector2) {
        return !this.CanNormalize(p1.x - p2.x, p1.y - p2.y);
    }

    static makeZeroArray(n: number) {
        return Array.from({ length: n }, () => this.zero())
    }
    static one() {
        return this.create(1, 1)
    }
    static zero() {
        return this.create(0, 0)
    }
    static default() {
        return this.create(0, 0)
    }
    static create(x: number = 0, y: number = 0) {
        return new this([x, y])
    }
    static fromArray(elements: number[] | Float32Array) {
        return new this(elements)
    }
    static fromXY(x: number, y: number) {
        return this.create(x, y)
    }
    static splat(x: number) {
        return this.create(x, x)
    }
    static pools: Vector2[] = []
    static maxPoolSize: number = 100
    static batchPools: Vector2[] = []
    static startPoolCreated: boolean = false;
    static beginPools() {
        this.startPoolCreated = true
    }
    static endPools() {
        if (this.startPoolCreated) {
            this.startPoolCreated = false
            this.batchPools.forEach(p => {
                this.release(p)
            })
            this.batchPools.length = 0

        }
    }
    static pool(x: number = 0, y: number = 0): Vector2 {
        if (this.pools.length > 0) {
            let p = this.pools.pop()!
            p.elements[0] = x;
            p.elements[1] = y;
            if (this.startPoolCreated) {
                this.batchPools.push(p)
            }
            return p
        }
        return new this([x, y])
    }
    static release(p: Vector2) {
        if (this.pools.length < this.maxPoolSize) {
            this.pools.push(p)
        }
    }
    isVector2: boolean = true
    mutable: boolean = true
    elements: Float32Array = new Float32Array(2)
    changeCallback?: (self: Vector2) => void = () => { }
    changeCallbackPadding: boolean = false
    constructor(elements: number[] | Float32Array = []) {
        this.elements.set(elements)
    }
    onChange(callback: (self: Vector2) => void) {
        this.changeCallback = callback
        return this
    }
    change() {
        if (this.changeCallbackPadding) {
            return
        }
        this.changeCallbackPadding = true;
        this.changeCallback?.(this)
        this.changeCallbackPadding = false
    }
    get x() {
        return this.elements[0]
    }
    set x(v: number) {
        if (this.elements[0] !== v) {
            this.elements[0] = v;
            this.change()
        }
    }
    get y() {
        return this.elements[1]
    }
    set y(v: number) {
        if (this.elements[1] !== v) {
            this.elements[1] = v;
            this.change()
        }
    }
    set(x: number, y: number, silent: boolean = false) {
        if (this.mutable && this.x !== x || this.y !== y) {
            this.elements[0] = x
            this.elements[1] = y

            !silent && this.change()
            return this
        } else if (!this.mutable) {
            return (this.constructor as typeof Vector2).create(x, y)
        }
        return this
    }
    setElements(values: number[] | Float32Array, silent: boolean = false) {
        if (this.mutable && this.elements.some((v, i) => v !== values[i])) {
            this.elements.set(values)
            !silent && this.change()
            return this
        } else if (!this.mutable) {
            return Vector2.fromArray(values)
        }
        return this
    }
    isFinite() {
        return !this.elements.some(v => !Number.isFinite(v))
    }
    isZero() {
        return !this.elements.some(v => v !== 0)
    }
    isNormalize() {
        return !this.elements.some(v => v < 0 || v > 1)
    }
    isSafeInteger() {
        return !this.elements.some(v => !Number.isSafeInteger(v))
    }
    isOne() {
        return !this.elements.some(v => v !== 1)
    }
    copy(source: Vector2) {
        return this.setElements(source.elements)
    }
    clone() {
        return Vector2.fromArray(this.elements)
    }
    // 是否正交
    /**
     * 判断当前向量与给定的目标向量是否垂直
     *
     * @param target 目标向量
     * @returns 如果当前向量与目标向量垂直，则返回 true；否则返回 false
     */
    isOrthogonal(target: Vector2) {
        return this.dot(target) == 0
    }
    // 是否同方向
    isSameDirection(target: Vector2) {
        return this.dot(target) > 0
    }
    addScalar(s: number) {
        return this.set(this.x + s, this.y + s)
    }
    addVectors(a: Vector2, b: Vector2) {
        return this.set(a.x + b.x, a.y + b.y)
    }
    add(v: Vector2) {
        return this.addVectors(this, v)
    }
    subVectors(a: Vector2, b: Vector2) {
        return this.set(a.x - b.x, a.y - b.y)
    }
    subtract(v: Vector2) {
        return this.subVectors(this, v)
    }
    sub(v: Vector2) {
        return this.subtract(v)
    }
    multiplyScalarVector(a: Vector2, s: number) {
        return this.set(a.x * s, a.y * s)
    }
    multiplyAddScalarVector(a: Vector2, s: number) {
        return this.set(this.x + a.x * s, this.y + a.y * s)
    }
    multiplyScalar(s: number) {
        return this.multiplyScalarVector(this, s)
    }
    multiplyVectors(a: Vector2, b: Vector2) {
        return this.set(a.x * b.x, a.y * b.y)
    }
    mul(v: Vector2) {
        return this.multiply(v)
    }
    multiply(v: Vector2) {
        return this.multiplyVectors(this, v)
    }
    divideVectors(a: Vector2, b: Vector2) {
        return this.set(a.x / b.x, a.y / b.y)
    }
    divide(v: Vector2) {
        return this.divideVectors(this, v)
    }
    div(v: Vector2) {
        return this.divide(v)
    }
    dotVectors(a: Vector2, b: Vector2) {
        return a.x * b.x + a.y * b.y
    }
    dot(v: Vector2) {
        return this.dotVectors(this, v)
    }
    crossVectors(a: Vector2, b: Vector2) {
        return a.x * b.y - a.y * b.x
    }
    cross(v: Vector2) {
        return this.crossVectors(this, v)
    }
    squaredLength() {
        return this.dot(this)
    }
    lengthSq() {
        return this.squaredLength()
    }
    // 欧几里得距离 平方和开方

    length() {
        return Math.sqrt(this.squaredLength())
    }
    manhattanLength() {
        return Math.abs(this.x) + Math.abs(this.y);
    }
    // 曼哈顿距离 绝对值之和

    manhattanDistanceTo(v: Vector2) {
        return Math.abs(this.x - v.x) + Math.abs(this.y - v.y);

    }
    // 切比雪夫
    chebyshevLength() {
        return Math.max(Math.abs(this.x), Math.abs(this.y))
    }
    chebyshevDistanceTo(v: Vector2) {
        return Math.max(Math.abs(this.x - v.x), Math.abs(this.y - v.y))
    }
    distanceTo(v: Vector2) {
        return Math.sqrt(this.distanceToSquared(v))
    }
    distanceToSquared(v: Vector2) {
        const dx = this.x - v.x
        const dy = this.y - v.y
        return dx * dx + dy * dy
    }
    angleToAtan2() {
        // 模拟atan2
        // const sign=Vector2.create(1,0).cross(this)>=0?1:-1
        // const cos=Math.max(-1,Math.min(1,Vector2.create(1,0).dot(this)))
        // const angle=Math.acos(cos)
        // return sign*angle
        const sign = this.y >= 0 ? 1 : -1
        const cos = Math.max(-1, Math.min(1, this.x / this.length()))
        const angle = Math.acos(cos)
        return sign * angle
    }
    angleToVectors(a: Vector2, b: Vector2) {
        return Math.atan2(b.cross(a), a.dot(b))
    }
    angleToVectors2(a: Vector2, b: Vector2) {
        const sign = b.cross(a) >= 0 ? 1 : -1
        const cos = Math.max(-1, Math.min(1, a.dot(this) / (a.length() * b.length())))
        const angle = Math.acos(cos)
        return sign * angle
    }
    angleTo(v: Vector2) {
        // cross=AxB=|A||B|sin(θ)=平行四边的面积=宽乘高
        // dot=A•B =|A||B|cos(θ)
        return this.angleToVectors(this, v)
    }
    cos(v: Vector2) {
        //this.normalize().dot(v.normalize())
        return this.dot(v) / (this.length() * v.length())
    }
    acos(v: Vector2) {
        return Math.acos(this.cos(v))
    }
    midPoint(v: Vector2) {
        return this.set((this.x + v.x) / 2, (this.y + v.y) / 2)
    }
    angle() {
        return Math.atan2(this.y, this.x)
    }
    perp() {
        return this.perpendicular()
    }
    perpendicular() {
        return this.set(-this.y, this.x)
    }
    inversePerp() {
        return this.set(this.y, -this.x)
    }
    projectLengthDir(dir: Vector2) {
        return this.dot(dir)
    }
    projectLength(v: Vector2) {
        // cos=this.normalize().dot(v.normalize())
        // k=cos*this.length()
        return this.dot(v) / v.length()
    }
    projectRatio(v: Vector2) {
        return this.dot(v) / v.dot(v)
    }
    projectDir(v: Vector2) {
        const k = this.projectLengthDir(v)
        return this.multiplyScalarVector(v, k)
    }
    project(v: Vector2) {
        const k = this.projectLength(v)
        return this.multiplyScalarVector(this.copy(v).normalize(), k)
    }
    reflectVectors(a: Vector2, dir: Vector2) {
        let k = a.dot(dir)
        let r = this.subVectors(a, Vector2.pool().copy(dir).multiplyScalar(k * 2).release())
        return r;
    }
    reflect(dir: Vector2) {
        return this.reflectVectors(this, dir)
    }
    /**
     * 折射（Refraction）是光线从一种介质进入另一种介质时发生的方向改变现象。折射的方向可以通过 斯涅尔定律（Snell's Law） 来计算
     * @param incident 入射向量  
     * @param normal 法向量
     * @param eta1 入射介质的折射率
     * @param eta2 折射介质的折射率
     * @returns 
     */
    refractVectors(incident: Vector2, normal: Vector2, eta1: number, eta2: number): Vector2 | null {
        const n = normal.clone().normalize();
        const i = incident.clone().normalize();
        const eta = eta1 / eta2;

        const cosTheta1 = -i.dot(n);
        const sinTheta1 = Math.sqrt(1 - cosTheta1 * cosTheta1);
        const sinTheta2 = eta * sinTheta1;
        // 检查是否发生全反射
        if (sinTheta2 > 1) {
            return null; // 全反射，无折射
        }
        const cosTheta2 = Math.sqrt(1 - sinTheta2 * sinTheta2);
        return i.multiplyScalar(eta).add(n.multiplyScalar(eta * cosTheta1 - cosTheta2));
    }
    /**
     * 光线的能量衰减（菲涅尔方程）菲涅尔方程描述了光线在反射和折射之间的能量分配
     * @param incident 
     * @param normal 
     * @param eta1 
     * @param eta2 
     * @returns 
     */
    fresnel(incident: Vector2, normal: Vector2, eta1: number, eta2: number): number {
        const cosTheta1 = -incident.clone().normalize().dot(normal.clone().normalize());
        const sinTheta1 = Math.sqrt(1 - cosTheta1 * cosTheta1);
        const sinTheta2 = (eta1 / eta2) * sinTheta1;

        if (sinTheta2 > 1) {
            return 1; // 全反射，所有能量反射
        }

        const cosTheta2 = Math.sqrt(1 - sinTheta2 * sinTheta2);
        const rParallel = ((eta2 * cosTheta1) - (eta1 * cosTheta2)) / ((eta2 * cosTheta1) + (eta1 * cosTheta2));
        const rPerpendicular = ((eta1 * cosTheta1) - (eta2 * cosTheta2)) / ((eta1 * cosTheta1) + (eta2 * cosTheta2));
        return (rParallel * rParallel + rPerpendicular * rPerpendicular) / 2;
    }
    interpolateVectors(start: Vector2, end: Vector2, t: number) {
        return this.set(start.x + (end.x - start.x) * t, start.y + (end.y - start.y) * t)
    }
    smoothStep(start: Vector2, end: Vector2, t: number) {
        return this.interpolateVectors(start, end, t * t * (3 - 2 * t))
    }
    interpolate(to: Vector2, t: number) {
        return this.interpolateVectors(this, to, t)
    }
    mix(a: Vector2, b: Vector2, t: number) {
        return this.set(a.x * (1 - t) + b.x * t, a.y * (1 - t) + b.y * t)
    }
    swap() {
        return this.set(this.y, this.x)
    }
    splat(x: number) {
        return this.set(x, x)
    }
    inverse() {
        return this.set(1 / this.x, 1 / this.y)
    }
    negate() {
        return this.set(-this.x, -this.y)
    }
    sign() {
        return this.set(Math.sign(this.x), Math.sign(this.y))
    }
    pow(s: Vector2) {
        return this.set(Math.pow(this.x, s.x), Math.pow(this.y, s.y))
    }
    sqrt() {
        return this.set(Math.sqrt(this.x), Math.sqrt(this.y))
    }
    abs() {
        return this.set(Math.abs(this.x), Math.abs(this.y))
    }
    floor() {
        return this.set(Math.floor(this.x), Math.floor(this.y))
    }
    round() {
        return this.set(Math.round(this.x), Math.round(this.y))
    }
    fract() {
        return this.set(this.x - Math.floor(this.x), this.y - Math.floor(this.y))
    }
    ceil() {
        return this.set(Math.ceil(this.x), Math.ceil(this.y))
    }
    randomVectors(min: Vector2, max: Vector2) {
        return this.set(Math.random() * (max.x - min.x) + min.x,
            Math.random() * (max.y - min.y) + min.y)
    }
    random(min: number, max: number) {
        return this.set(Math.random() * (max - min) + min,
            Math.random() * (max - min) + min)
    }
    bounds(min: Vector2, max: Vector2) {
        return this.set(Math.max(min.x, Math.min(this.x, max.x)),
            Math.max(min.y, Math.min(this.y, max.y)))
    }
    min(v: Vector2) {
        return this.set(Math.min(this.x, v.x), Math.min(this.y, v.y))
    }
    max(v: Vector2) {
        return this.set(Math.max(this.x, v.x), Math.max(this.y, v.y))
    }
    trunc() {
        return this.set(Math.trunc(this.x), Math.trunc(this.y))
    }
    clamp(min: Vector2, max: Vector2) {
        return this.set(Math.max(min.x, Math.min(this.x, max.x)),
            Math.max(min.y, Math.min(this.y, max.y)))
    }
    normalize() {
        const len = this.length()
        if (len <= 0) {
            return this.set(0, 0)
        }
        return this.multiplyScalar(1 / this.length())
    }
    translate(x: number, y: number) {
        return this.set(this.x + x, this.y + y)
    }
    scale(x: number, y: number) {
        return this.set(this.x * x, this.y * y)
    }
    rotate(angle: number, origin: Vector2 = Vector2.create(0, 0)) {
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        const dx = this.x - origin.x
        const dy = this.y - origin.y
        const x = dx * cos - dy * sin + origin.x
        const y = dx * sin + dy * cos + origin.y
        return this.set(x, y)
    }
    setLength(length: number): boolean {
        return this.setLengthFrom(this.x, this.y, length)
    }
    setLengthFrom(x: number, y: number, length: number): boolean {
        return this.setPointLength(this, x, y, length)
    }
    setPointLength(pt: Vector2, x: number, y: number, length: number, orig_length?: { value: any }): boolean {
        let xx = x;
        let yy = y;
        let dmag = Math.sqrt(xx * xx + yy * yy);
        let dscale = length / dmag;
        x *= dscale;
        y *= dscale;

        // check if we're not finite, or we're zero-length
        if (!Number.isFinite(x) || !Number.isFinite(y) || (x == 0.0 && y == 0.0)) {
            pt.set(0, 0)
            return false;
        }

        let mag = 0.0;
        if (orig_length !== undefined) {
            mag = dmag;
        }

        //*pt = Point::from_xy(x, y);
        pt.set(x, y)
        if (orig_length !== undefined) {
            orig_length!.value = mag
        }

        return true
    }
    applyMatrix2D(matrix: Matrix2D) {
        return this.set(matrix.a * this.x + matrix.c * this.y + matrix.e,
            matrix.b * this.x + matrix.d * this.y + matrix.f)
    }
    applyMatrix3(matrix: Matrix3) {
        const m = matrix.elements
        return this.set(
            m[0] * this.x + m[3] * this.y + m[6],
            m[1] * this.x + m[4] * this.y + m[7]
        )
    }
    // applyTransform(m:Transform){
    //     return this.set(m.sx*this.x+m.kx*this.y+m.tx,
    //                    m.ky*this.x+m.sy*this.y+m.ty)
    // }
    setNormalize(x: number, y: number) {
        return this.setLengthFrom(x, y, 1.0)
    }
    canNormalize() {
        return this.isFinite() && (this.x !== 0 || this.y !== 0)
    }
    swapCoords() {
        return this.set(this.y, this.x)
    }
    rotateCW() {
        // this.swapCoords()
        // this.x=-this.x
        return this.set(this.y, -this.x);
    }
    rotateCCW() {
        // this.swapCoords()
        // this.y=-this.y;
        // return this;
        return this.set(-this.y, this.x);
    }

    bezier(points: Vector2[], t: number): Vector2 {
        const n = points.length - 1;
        let x = 0, y = 0

        const factorial = (n: number) => {
            if (n <= 1) {
                return 1
            }
            let sum = 1;
            for (let i = 2; i <= n; i++) {
                sum *= i
            }
            return sum;
        }
        // 组合，不考虑顺序
        const nCr = (n: number, r: number) => {
            return factorial(n) / (factorial(r) * factorial(n - r))
        }
        // 伯恩斯坦多项式
        const bernstein = (n: number, i: number, t: number) => {
            return nCr(n, i) * Math.pow(t, i) * Math.pow(1 - t, n - i)
        }
        for (let i = 0; i <= n; i++) {
            let v = bernstein(n, i, t)
            x += points[i].x * v
            y += points[i].y * v
        }
        return this.set(x, y)
    }
    rationalBezier(points: Vector2[], weights: number[], t: number): Vector2 {
        const n = points.length - 1;
        let x = 0, y = 0, w = 0

        const factorial = (n: number) => {
            if (n <= 1) {
                return 1
            }
            let sum = 1;
            for (let i = 2; i <= n; i++) {
                sum *= i
            }
            return sum;
        }
        // 组合，不考虑顺序
        const nCr = (n: number, r: number) => {
            return factorial(n) / (factorial(r) * factorial(n - r))
        }
        // 伯恩斯坦多项式
        const bernstein = (n: number, i: number, t: number) => {
            return nCr(n, i) * Math.pow(t, i) * Math.pow(1 - t, n - i)
        }
        const new_points = points.map((p, i) => {
            return Vector2.create(p.x * weights[i], p.y * weights[i])
        })
        const new_weights = weights.slice()
        for (let i = 0; i <= n; i++) {
            let v = bernstein(n, i, t)
            x += new_points[i].x * v
            y += new_points[i].y * v
            w += weights[i] * v
        }
        return this.set(x / w, y / w)
    }
    // 贝塞曲线递归法
    bezierDeCasteljau(points: Vector2[], t: number): Vector2 {
        if (points.length === 1) {
            return this.set(points[0].x, points[0].y)
        }
        const n = points.length - 1;
        let newPoints: Vector2[] = [];
        for (let i = 0; i < n; i++) {
            newPoints.push(Vector2.default().interpolateVectors(points[i], points[i + 1], t))
        }
        return this.bezierDeCasteljau(newPoints, t);

    }
    // 贝塞曲线递归法
    rationBezierDeCasteljau(points: Vector2[], weights: number[], t: number): Vector2 {
        if (points.length === 1) {
            return this.set(points[0].x, points[0].y)
        }
        const n = points.length - 1;
        let newPoints: Vector2[] = [];
        let newWeights: number[] = [];

        for (let i = 0; i < n; i++) {
            newPoints.push(Vector2.default().interpolateVectors(points[i], points[i + 1], t))
            newWeights.push(weights[i] + t * (weights[i + 1] - weights[i]))
        }
        return this.rationBezierDeCasteljau(newPoints, newWeights, t);

    }
    conic(p0: Vector2, p1: Vector2, p2: Vector2, w:number, t: number): Vector2 {
        return this.rationalBezier([p0, p1, p2], [1,w,1], t)
    }
    quadraticBezier(p0: Vector2, p1: Vector2, p2: Vector2, t: number): Vector2 {
        return this.bezier([p0, p1, p2], t)
    }
    curveBezier(p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2, t: number): Vector2 {
        return this.bezier([p0, p1, p2, p3], t)
    }
    almostEqual(other: Vector2) {
        return !(this.clone().sub(other).canNormalize())
    }
    equals(v: Vector2) {
        return this.x === v.x && this.y === v.y
    }
    equalsEpsilon(v: Vector2, epsilon = 1e-6) {
        return Math.abs(this.x - v.x) < epsilon && Math.abs(this.y - v.y) < epsilon
    }

    release() {
        (this.constructor as typeof Vector2).release(this)
        return this
    }
    toArray() {
        return [this.x, this.y]
    }
}