import { Ref } from "./util"


export class Point {
    static zero() {
        return this.create(0, 0)
    }
    static default() {
        return this.zero()
    }
    static create(x: number, y: number) {
        return new this([x, y])
    }
    static fromXY(x: number, y: number) {
        return this.create(x, y)
    }
    static splat(x: number) {
        return this.create(x, x)
    }
    static make(num:number){
        return Array.from({length:num},()=>this.default())
    }
    elements: Float32Array = new Float32Array([0, 0])
    constructor(elements: number[] | Float32Array) {
        this.elements.set(elements)
    }
    isVector2=true
    get x() {
        return this.elements[0]
    }
    set x(x) {
        this.elements[0] = x
    }
    get y() {
        return this.elements[1]
    }
    set y(y) {
        this.elements[1] = y
    }
    set(x: number, y: number) {
        if (this.x !== x || this.y !== y) {
            this.elements[0] = x;
            this.elements[1] = y;
        }
        return this
    }
    clone() {
        return Point.default().copy(this)
    }
    copy(p: Point) {
        return this.set(p.x, p.y)
    }
    add(p: Point) {
        return this.addVectors(this, p)
    }
    addVectors(v1: Point, v2: Point) {
        return this.set(v1.x + v2.x, v1.y + v2.y)
    }
    subtractVectors(v1: Point, v2: Point) {
        return this.set(v1.x - v2.x, v1.y - v2.y)
    }
    subtract(p: Point) {
        return this.subtractVectors(this, p)
    }
    negate() {
        return this.set(-this.x, -this.y)
    }
    inverse() {
        return this.set(1 / this.x, 1 / this.y)
    }
    multiplyScalar(s: number) {
        return this.multiplyVectorScalar(this, s)
    }
    multiplyVectorScalar(v: Point, s: number) {
        return this.set(v.x * s, v.y * s)
    }
    subtractMultiplyVectorScalar(a: Point, v: Point, s: number) {
        return this.set(a.x - v.x * s, a.y - v.y * s)
    }
    addMultiplyVectorScalar(a: Point, v: Point, s: number) {
        return this.set(a.x + v.x * s, a.y + v.y * s)
    }
    multiplySubtractVectors(v1: Point, v2: Point) {
        return this.scale(v1.x -v2.x, v1.y -v2.y)
    }
    multiplyAddVectors(v1: Point, v2: Point) {
        return this.scale(v1.x+v2.x, v1.y+v2.y)
    }
    multiplyVectors(v1: Point, v2: Point) {
        return this.set(v1.x * v2.x, v1.y * v2.y)
    }
    multiply(p: Point) {
        return this.multiplyVectors(this, p)
    }
    divideVectors(v1: Point, v2: Point) {
        return this.set(v1.x / v2.x, v1.y / v2.y)
    }
    divideScalar(s: number) {
        return this.set(this.x / s, this.y / s)
    }
    divide(p: Point) {
        return this.divideVectors(this, p)
    }
    dot(v: Point) {
        return this.x * v.x + this.y * v.y
    }
    cross(v: Point) {
        return this.x * v.y - this.y * v.x
    }
    perp() {
        return this.set(-this.y, this.x)
    }
    rperp() {
        return this.set(this.y, -this.x)
    }
    toNormalize(){
        this.normalize()
        return this;
    }
    normalize() {
        // let l = this.length()
        // if (l === 0) return this
        // else return this.multiplyScalar(1 / l)
        return this.setPointLength(this,this.x,this.y,1)
    }
    setNormalized(v: Point) {
        return this.setPointLength(this, v.x, v.y, 1)

    }
    distanceToSquared(v: Point) {
        return (this.x - v.x) ** 2 + (this.y - v.y) ** 2
    }
    distanceTo(v: Point) {
        return Math.sqrt(this.distanceToSquared(v))
    }
    manhattanDistanceTo(v: Point) {
        return Math.abs(this.x - v.x) + Math.abs(this.y - v.y)
    }

    lengthSq() {
        return this.x * this.x + this.y * this.y
    }
    length() {
        return Math.sqrt(this.lengthSq())
    }
    inverseLength() {
        return 1 / this.length()
    }
    angle() {
        return Math.atan2(this.y, this.x)
    }
    angleTanTo(v: Point) {
        return Math.atan2(this.cross(v), this.dot(v))
    }
    angleTo(v: Point) {
        return Math.acos(this.dot(v) / (this.length() * v.length()))
    }
    projectLength(v: Point) {
        return this.dot(v) / v.length()
    }
    projectLengthNormalize(normalize: Point) {
        return this.dot(normalize)
    }
    projectRatio(v: Point) {
        return this.dot(v) / v.dot(v)
    }
    project(v: Point) {
        let k = this.projectLength(v)
        let t = k / v.length()
        return this.multiplyVectorScalar(v, t)
    }
    projectNormalize(normalize: Point) {
        let k = this.projectLengthNormalize(normalize)
        return this.multiplyVectorScalar(normalize, k)
    }
    reflect(normalize: Point) {
        const k = this.projectLengthNormalize(normalize)
        return this.subtractMultiplyVectorScalar(this, normalize, 2 * k - 1)
    }
    translate(x: number, y: number) {
        return this.set(this.x + x, this.y + y)
    }
    rotate(angle: number, origin = Point.zero()) {
        let cos = Math.cos(angle)
        let sin = Math.sin(angle)
        if (origin.isZero()) {
            return this.set(this.x * cos - this.y * sin,
                this.x * sin + this.y * cos)
        } else {
            const x = this.x - origin.x
            const y = this.y - origin.y
            return this.set(x * cos - y * sin + origin.x,
                x * sin + y * cos + origin.y)
        }
    }
    scale(x: number, y: number) {
        return this.set(this.x * x, this.y * y)
    }
    round() {
        return this.set(Math.round(this.x), Math.round(this.y))
    }
    abs() {
        return this.set(Math.abs(this.x), Math.abs(this.y))
    }
    ceil() {
        return this.set(Math.ceil(this.x), Math.ceil(this.y))
    }
    floor() {
        return this.set(Math.floor(this.x), Math.floor(this.y))
    }
    trunc() {
        return this.set(Math.trunc(this.x), Math.trunc(this.y))
    }
    sign() {
        return this.set(Math.sign(this.x), Math.sign(this.y))
    }
    cosSin() {
        return this.set(Math.cos(this.x), Math.sin(this.y))
    }
    minScalar(s: number) {
        return this.set(Math.min(this.x, s), Math.min(this.y, s))
    }
    minVectors(v1: Point, v2: Point) {
        return this.set(Math.min(v1.x, v2.x), Math.min(v1.y, v2.y))
    }
    maxVectors(v1: Point, v2: Point) {
        return this.set(Math.max(v1.x, v2.x), Math.max(v1.y, v2.y))
    }
    min(p: Point) {
        return this.minVectors(this, p)
    }
    max(p: Point) {
        return this.maxVectors(this, p)
    }
    lerp(s: Point, v: Point, t: number) {
        return this.set(s.x + (v.x - s.x) * t, s.y + (v.y - s.y) * t)
    }
    smoonstep(s: Point, v: Point, t: number) {
        return this.set(s.x + (v.x - s.x) * t * t * (3 - 2 * t), s.y + (v.y - s.y) * t * t * (3 - 2 * t))
    }

    setPointLength(pt: Point, x: number, y: number, length: number, orig_length?: Ref) {
        let xx = x;
        let yy = y;
        let dmag = Math.sqrt(xx * xx + yy * yy);
        let dscale = length / dmag;
        x *= dscale;
        y *= dscale;
        // check if we're not finite, or we're zero-length
        if (!Number.isFinite(x) || !Number.isFinite(y) || (x == 0 && y == 0)) {
            pt.set(0, 0);
            return false;
        }
        let mag = 0;
        if (orig_length) {
            mag = dmag
        }
        pt.set(x, y);
        if (orig_length) {
            orig_length.value = mag;
        }
        return true;
    }
    setLength(len: number) {
        return this.setPointLength(this, this.x, this.y, len)
    }
    isFinite() {
        return isFinite(this.x) && isFinite(this.y)
    }

    isZero() {
        return this.x === 0 && this.y === 0
    }
    isOne() {
        return this.x === 1 && this.y === 1
    }
    equals(v: Point) {
        return this.x === v.x && this.y === v.y
    }
    equalsEpsilon(v: Point, epsilon = 1e-5) {
        return Math.abs(this.x - v.x) < epsilon && Math.abs(this.y - v.y) < epsilon
    }
}

export class Point3D{
    static default(){
        return new this(0,0,0)
    }
    static make(count:number){
        let arr=new Array(count)
        for (let i = 0; i < count; i++) {
            arr[i]=this.default()
        }
        return arr as Point3D[]
    }
    static create(x: number = 0, y: number = 0, z: number = 0) {
        return new this(x, y, z)
    }

    elements=new Float32Array([0,0,0])
    constructor(x: number = 0, y: number = 0, z: number = 0) {
        this.elements.set([x,y,z])
    }

    get x() { return this.elements[0]; }
    set x(v) { this.elements[0] = v; }
    get y() { return this.elements[1]; }
    set y(v) { this.elements[1] = v; }
    get z() { return this.elements[2]; }
    set z(v) { this.elements[2] = v; }
    set(x: number, y: number, z: number) {
        this.elements[0] = x;
        this.elements[1] = y;
        this.elements[2] = z;
        return this;
    }
    clone(){
        return new Point3D(this.x, this.y, this.z)
    }
    copy(v: Point3D) {
        this.elements[0] = v.x;
        this.elements[1] = v.y;
        this.elements[2] = v.z;
        return this
    }


}