import { Matrix3 } from "./mat3"
import { Matrix4 } from "./mat4"
import { Transform } from "./transform"
import { Vector2 } from "./vec2"
const PI_2=Math.PI*2;
export class Matrix2D {
    static EPSILON = 0.000001
    static IDENTITY_MATRIX = this.default()
    static identity() {
        return this.fromRows(1, 0, 0, 1, 0, 0)
    }
    static default() {
        return this.identity()
    }
    // for 2D Transforms
    static fromSinCos(sin:number,cos:number){
        return this.fromRows(cos,sin,-sin,cos,0,0)
    }
    static fromTranslation(x: number, y: number) {
        return this.fromRows(1, 0, 0, 1, x, y)
    }
    static fromTranslate(x: number, y: number) {
        return this.fromRows(1, 0, 0, 1, x, y)
    }

        // 调用 fromRows 方法，创建一个平移矩阵
    static fromRotation(theta: number) {
        // 注释：fromRows 方法创建并返回一个平移矩阵
        // counterclockwise
        const c = Math.cos(theta);
        const s = Math.sin(theta);
        return this.fromRows(c, s, -s, c, 0, 0)

    }
    static fromRotate(radian:number){
        const c = Math.cos(radian);
        const s = Math.sin(radian);
        return this.fromRows(c, s, -s, c, 0, 0)
    }
    static fromRotateDegrees(degrees:number){
        return this.fromRotate(degrees*Math.PI/180)
    }

    static fromScale(sx: number, sy: number) {
        return this.fromRows(sx, 0, 0, sy, 0, 0)

    }
    static fromSkew(kx: number, ky: number) {
        // return this.fromRows(1,ky,-kx,1,0,0)
        return this.fromRows(1, Math.tan(ky), Math.tan(kx), 1, 0, 0)
    }
    static fromArray(elements: Float32Array | number[], mutable: boolean = true) {
        return new this(elements, mutable)
    }
    static fromRows(a: number, b: number, c: number, d: number, e: number, f: number) {
        return this.fromArray([a, b, c, d, e, f])
    }
    static pools: Matrix2D[] = []
    static poolSize = 100
    static pool() {
        if (this.pools.length > 0) {
            const instance = this.pools.shift()!
            instance.identity()
            return instance
        } else {
            return this.default()
        }
    }
    static release(instance: Matrix2D) {
        if (this.pools.length < this.poolSize) {
            instance.mutable = true
            this.pools.push(instance)
        }
    }
    isMatrix2D: boolean = true
    elements: Float32Array = new Float32Array(6)
    mutable: boolean = true
    constructor(elements: Float32Array | number[], mutable: boolean = true) {
        this.elements.set(elements)
        this.mutable = mutable
    }
    get a() {
        return this.elements[0]
    }
    get b() {
        return this.elements[1]
    }
    get c() {
        return this.elements[2]
    }
    get d() {
        return this.elements[3]
    }
    get e() {
        return this.elements[4]
    }
    get f() {
        return this.elements[5]
    }
    pool() {
        return (this.constructor as typeof Matrix2D).pool()
    }
    release() {
        return (this.constructor as typeof Matrix2D).release(this)
    }

    setMutable(mutable: boolean) {
        this.mutable = mutable
        return this;
    }

    identity() {
        return this.set(1, 0, 0, 1, 0, 0);
    }
    set(a: number, b: number, c: number, d: number, e: number, f: number) {
        if (this.mutable) {
            this.elements[0] = a; this.elements[2] = c; this.elements[4] = e;
            this.elements[1] = b; this.elements[3] = d; this.elements[5] = f;
            return this;
        } else {
            return (this.constructor as typeof Matrix2D).fromRows(a, b, c, d, e, f).setMutable(this.mutable)
        }
    }
    setElements(elements: Float32Array | number[]): Matrix2D {
        if (this.mutable) {
            this.elements.set(elements)
            return this;
        } else {
            return (this.constructor as typeof Matrix2D).fromArray(elements).setMutable(this.mutable)
        }
    }
    clone() {
        return (this.constructor as typeof Matrix2D).fromArray(this.elements, this.mutable)
    }
    copy(other: Matrix2D) {
        this.elements.set(other.elements)
        return this
    }
    isIdentity() {
        return this.elements.every((v, i) => v === Matrix2D.IDENTITY_MATRIX.elements[i])
    }
    isZero() {
        return this.elements.every(v => v === 0)
    }
    isFinite() {
        return this.elements.every(v => Number.isFinite(v))
    }
    isTranslate() {
        return this.hasTranslate() && !this.hasScale() && !this.hasRotation()
    }
    isScale() {
        return this.hasScale() && !this.hasTranslate() && !this.hasRotation()
    }
    isRotation() {
        return this.hasRotation() && !this.hasScale() && !this.hasTranslate()
    }
    isScaleTranslate() {
        return (this.hasScale() || this.hasTranslate()) && !this.hasRotation()
    }
    isScaleRotate() {
        return this.hasRotation() && this.hasScale()
    }
    hasScale() {
        return this.a !== 1 || this.d !== 1

    }
    hasTranslate() {
        return this.e !== 0 || this.f !== 0
    }
    hasRotation() {
        return this.b !== 0 || this.c !== 0
    }
    floor() {
        return this.setElements(this.elements.map(v => Math.floor(v)))
    }
    ceil() {
        return this.setElements(this.elements.map(v => Math.ceil(v)))
    }
    multiply(m: Matrix2D) {
        return this.multiplyMatrices(this, m);
    }
    premultiply(m: Matrix2D) {
        return this.multiplyMatrices(m, this);
    }
    multiplyMatrices(left: Matrix2D, right: Matrix2D) {
        const ae = left.elements;
        const be = right.elements;

        const a = ae[0] * be[0] + ae[2] * be[1]
        const b = ae[1] * be[0] + ae[3] * be[1]
        const c = ae[0] * be[2] + ae[2] * be[3]
        const d = ae[1] * be[2] + ae[3] * be[3]
        const e = ae[0] * be[4] + ae[2] * be[5] + ae[4]
        const f = ae[1] * be[5] + ae[3] * be[5] + ae[5]
        return this.set(a, b, c, d, e, f);

    }

    multiplyScalar(s: number) {
        return this.set(this.a * s, this.b * s, this.c * s, this.d * s, this.e * s, this.f * s);

    }
    setScale(sx:number,sy:number) {
        return this.set(sx,0,0,sy,0,0)
    }

    setSinCos( sinV:number,cosV:number):this
    setSinCos( sinV:number,  cosV:number,  px:number,  py:number):this
    setSinCos(...args:any[]) {
        const cosV=args[1],sinV=args[0]

        if(args.length===4) {
            const px=args[2],py=args[3]
            const  oneMinusCosV = 1 - cosV;
            return this.set(cosV,sinV,-sinV,cosV,sinV*py+oneMinusCosV*px,-sinV*px+oneMinusCosV*py)
        }else{
            return this.set(cosV,sinV,-sinV,cosV,0,0)
        }

    }
    setRotate(radian:number):this
    setRotate(radian:number,x:number,y:number):this
    setRotate(...args:any[]){
        const radian=args[0]
        const cos=Math.cos(radian),sin=Math.sin(radian)
        if(args.length===1){
            return this.setSinCos(sin,cos)
        }else{
            return this.setSinCos(sin,cos,args[1],args[2])
        }
    }
    setRotateDegrees(radian:number) {
        return this.setRotate(radian * Math.PI / 180)
    }
    setTranslate(tx:number,ty:number) {
        return this.set(1,0,0,1,tx,ty)
    }
    preScale(sx: number, sy: number) {
        return this.multiplyMatrices(this, Matrix2D.fromScale(sx, sy))
    }
    postScale(sx: number, sy: number) {
        return this.multiplyMatrices(Matrix2D.fromScale(sx, sy), this)
    }
    preRotate(angle: number) {
        return this.multiplyMatrices(this, Matrix2D.fromRotate(angle))
    }
    preRotateDegrees(angle: number) {
        return this.preRotate(angle * Math.PI / 180)
    }
    postRotate(angle: number) {
        return this.multiplyMatrices(Matrix2D.fromRotate(angle), this)
    }
    postRotateDegrees(angle: number) {
        return this.postRotate(angle * Math.PI / 180)
    }
    preTranslate(tx: number, ty: number) {
        return this.multiplyMatrices(this, Matrix2D.fromTranslate(tx, ty))
    }
    postTranslate(tx: number, ty: number) {
        return this.multiplyMatrices(Matrix2D.fromTranslate(tx, ty), this)
    }
    fromTranslateRotationScale(translate:Vector2, rotation:number, scale:Vector2) {
        const cos = Math.cos(rotation), sin = Math.sin(rotation)
        const x = translate.x, y = translate.y, sx = scale.x, sy = scale.y
        const a = cos * sx;
        const b = sin * sx
        const c = -sin * sy;
        const d = cos * sy;
        const e = x;
        const f = y;
        return this.set(a, b, c, d, e, f)
    }
    fromTranslateRotationScaleOrigin(translate:Vector2, rotation:number, scale:Vector2, origin:Vector2) {
        const cos = Math.cos(rotation), sin = Math.sin(rotation)
        const x = translate.x, y = translate.y, sx = scale.x, sy = scale.y
        const a = cos * sx;
        const b = sin * sx
        const c = -sin * sy;
        const d = cos * sy;
        const e = x - (a * origin.x + c * origin.y) + origin.x;
        const f = y - (b * origin.x + d * origin.y) + origin.y;
        return this.set(a, b, c, d, e, f)
    }
    fromTranslateRotationScalePivot(translate:Vector2, rotation:number, scale:Vector2, pivot:Vector2) {
        const cos = Math.cos(rotation), sin = Math.sin(rotation)
        const x = translate.x, y = translate.y, sx = scale.x, sy = scale.y
        const a = cos * sx;
        const b = sin * sx
        const c = -sin * sy;
        const d = cos * sy;
        const e = x - (a * pivot.x + c * pivot.y);
        const f = y - (b * pivot.x + d * pivot.y);
        return this.set(a, b, c, d, e, f)
    }
    fromTranslateRotationSkewScaleOriginPivot(translate:Vector2, rotation:number, skew:Vector2, scale:Vector2, origin:Vector2, pivot:Vector2) {
        const cos = Math.cos(rotation), sin = Math.sin(rotation)
        const skewX = Math.tan(skew.x), skewY = Math.tan(skew.y)
        const dx = origin.x + pivot.x, dy = origin.y + pivot.y
        const x = translate.x, y = translate.y, sx = scale.x, sy = scale.y
        const a = (cos + skewX * sin) * sx;
        const b = (sin + skewY * cos) * sx
        const c = (-sin + skewX * cos) * sy;
        const d = (cos + skewY * -sin) * sy;
        const e = x - (a * dx + c * dy) + origin.x;
        const f = y - (b * dx + d * dy) + origin.y;
        return this.set(a, b, c, d, e, f)
    }
    fromTranslateRotationSkewScalePivot(translate:Vector2, rotation:number, skew:Vector2, scale:Vector2, pivot:Vector2) {
        const cos = Math.cos(rotation), sin = Math.sin(rotation)
        const skewX = Math.tan(skew.x), skewY = Math.tan(skew.y)
        const x = translate.x, y = translate.y, sx = scale.x, sy = scale.y
        const a = (cos + skewX * sin) * sx;
        const b = (sin + skewY * cos) * sx
        const c = (-sin + skewX * cos) * sy;
        const d = (cos + skewY * -sin) * sy;
        const e = x - (a * pivot.x + c * pivot.y);
        const f = y - (b * pivot.x + d * pivot.y);
        return this.set(a, b, c, d, e, f)
    }
    fromTranslateRotationScaleOriginPivot(translate:Vector2, rotation:number, scale:Vector2, origin:Vector2, pivot:Vector2) {
        const cos = Math.cos(rotation), sin = Math.sin(rotation)
        const dx = origin.x + pivot.x, dy = origin.y + pivot.y
        const x = translate.x, y = translate.y, sx = scale.x, sy = scale.y
        const a = cos * sx;
        const b = sin * sx
        const c = -sin * sy;
        const d = cos * sy;
        const e = x - (a * dx + c * dy) + origin.x;
        const f = y - (b * dx + d * dy) + origin.y;
        return this.set(a, b, c, d, e, f)
    }
    setFromMatrix3(m: Matrix3) {
        const me = m.elements;
        return this.set(me[0], me[1], me[3], me[4], me[6], me[7])
    }
    setFromMatrix4(m: Matrix4) {
        const me = m.elements;
        return this.set(me[0], me[1], me[4], me[5], me[12], me[13])
    }
    determinant() {
        return this.a * this.d - this.b * this.c;
    }
    invertMatrix(matrix:Matrix2D){
        const l = matrix.elements;
        const l11 = l[0], l12 = l[1], l13 = 0;
        const l21 = l[2], l22 = l[3], l23 = 0;
        const l31 = l[4], l32 = l[5], l33 = 1;
        // 行列式
        let determinant = matrix.determinant()
        if (determinant === 0) {
            return this
        }
        const invertDeterminant = 1 / determinant;
        const a = (l22 * l33 - l23 * l32) * invertDeterminant
        const b = -(l12 * l33 - l32 * l13) * invertDeterminant
        const c = -(l21 * l33 - l31 * l23) * invertDeterminant
        const d = (l11 * l33 - l13 * l13) * invertDeterminant
        const tx = (l21 * l32 - l31 * l22) * invertDeterminant
        const ty = -(l11 * l32 - l31 * l12) * invertDeterminant
        return this.set(a, b, c, d, tx, ty);
    }
    invert() {

        const te = this.elements
        const det = this.determinant()
        if (det === 0) {
            return null
        }
        const invdet = 1 / det;
        const a = this.d * invdet
        const b = -this.b * invdet
        const c = -this.c * invdet
        const d = this.a * invdet
        const e = (this.c * this.f - this.d * this.e) * invdet
        const f = (this.b * this.e - this.a * this.f) * invdet

        return this.set(a, b, c, d, e, f);
    }

    scale(sx: number, sy: number) {
        return this.set(
            this.a * sx,
            this.b * sy,
            this.c * sx,
            this.d * sy,
            this.e,
            this.f,
        )

    }

    rotate(theta: number) {
        const c = Math.cos(theta), s = Math.sin(theta);
        return this.set(
            this.a * c + this.c * s,
            this.b * c + this.d * s,
            this.a * -s + this.c * c,
            this.b * -s + this.d * c,
            this.e,
            this.f,
        )

    }
    translate(tx: number, ty: number) {

        return this.set(
            this.a,
            this.b,
            this.c,
            this.d,
            this.e + tx * this.a + ty * this.c,
            this.f + tx * this.b + ty * this.d,
        )
    }
        /***
     * 伴随矩阵，先转置，再求余子式
     */
    adjoint() {
        const l = this.elements;
        const l11 = l[0], l12 = l[1], l13 = 0;
        const l21 = l[2], l22 = l[3], l23 = 0;
        const l31 = l[4], l32 = l[5], l33 = 1;

        const a = (l22 * l33 - l23 * l32)
        const b = -(l12 * l33 - l32 * l13)
        const c = -(l21 * l33 - l31 * l23)
        const d = (l11 * l33 - l13 * l13)
        const tx = (l21 * l32 - l31 * l22)
        const ty = -(l11 * l32 - l31 * l12)
        return this.set(a, b, c, d, tx, ty);
    }
    decompose(transform:Transform) {

        // sort out rotation / skew..
        const a = this.a;
        const b = this.b;
        const c = this.c;
        const d = this.d;
        const pivot = transform.pivot;

        const skewX = -Math.atan2(-c, d);
        const skewY = Math.atan2(b, a);

        const delta = Math.abs(skewX + skewY);

        if (delta < 0.00001 || Math.abs(PI_2 - delta) < 0.00001) {
            transform.rotation = skewY;
            transform.skew.x = transform.skew.y = 0;
        }
        else {
            transform.rotation = 0;
            transform.skew.x = skewX;
            transform.skew.y = skewY;
        }

        // next set scale
        transform.scale.x = Math.sqrt((a * a) + (b * b));
        transform.scale.y = Math.sqrt((c * c) + (d * d));

        // next set position
        transform.position.x = this.e + ((pivot.x * a) + (pivot.y * c));
        transform.position.y = this.f + ((pivot.x * b) + (pivot.y * d));

        return transform;
    }
    decomposeTRSOP(transform:Transform) {

        // sort out rotation / skew..
        const a = this.a;
        const b = this.b;
        const c = this.c;
        const d = this.d;
        const origin = transform.origin;
        const pivot = transform.pivot;

        const skewX = -Math.atan2(-c, d);
        const skewY = Math.atan2(b, a);

        const delta = Math.abs(skewX + skewY);

        if (delta < 0.00001 || Math.abs(PI_2 - delta) < 0.00001) {
            transform.rotation = skewY;
            transform.skew.x = transform.skew.y = 0;
        }
        else {
            transform.rotation = 0;
            transform.skew.x = skewX;
            transform.skew.y = skewY;
        }

        // next set scale
        transform.scale.x = Math.sqrt((a * a) + (b * b));
        transform.scale.y = Math.sqrt((c * c) + (d * d));

        // next set position
        let dx = origin.x + pivot.x, dy = origin.y + pivot.y
        transform.position.x = this.e + ((dx * a) + (dy * c)) - origin.x;
        transform.position.y = this.f + ((dx * b) + (dy * d)) - origin.y;

        return transform;


    }
    mapPoints(outPoints:Vector2[],srcPoints: Vector2[]) {
         srcPoints.map((p,i) => {
            outPoints[i].copy(p).applyMatrix2D(this)
        })
        return this
    }
    mapPoint(outPoint:Vector2,srcPoint: Vector2) {
        outPoint.copy(srcPoint).applyMatrix2D(this)
        return this
    }
    mapXY(x:number,y:number,out:Vector2) {
        out.set(x,y).applyMatrix2D(this)
    }
    projection(width: number, height: number) {
        return this.set(2 / width, 0, 0, -2 / height, -1, 1)
    }
    equals(matrix: Matrix2D) {
        return !this.elements.some((v, i) => matrix.elements[i] !== v);
    }

    equalsEpsilon(matrix: Matrix2D, epsilon = 1e-6) {
        return !this.elements.some((v, i) => Math.abs(matrix.elements[i] - v) > epsilon);
    }


    fromArray(array: number[] | Float32Array, offset = 0) {
        for (let i = 0; i < 6; i++) {
            this.elements[i] = array[i + offset];
        }
        return this

    }

    toArray(array: number[] | Float32Array = [], offset = 0) {
        const te = this.elements;
        array[offset] = te[0];
        array[offset + 1] = te[1];
        array[offset + 2] = te[2];

        array[offset + 3] = te[3];
        array[offset + 4] = te[4];
        array[offset + 5] = te[5];
        return array;

    }
}