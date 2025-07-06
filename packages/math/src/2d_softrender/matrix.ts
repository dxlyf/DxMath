
export class Point{
    static default(){
        return new Point(0, 0)
    }
    static create(x:float64, y:float64){
        return new Point(x, y)
    }
    x: float64 = 0
    y: float64 = 0
    constructor(x: float64=0, y: float64=0) {
        this.x = x
        this.y = y
    }
    set(x: float64, y: float64) {
        this.x = x
        this.y = y
        return this
    }
    clone() {
        return new Point(this.x, this.y)
    }
    copy(source:Point){
        this.x = source.x
        this.y = source.y
        return this
    }
}

export class Rect{
    static fromXYWH(x:float64, y:float64, w:float64, h:float64){
        const  rect= new Rect()
        rect.x = x
        rect.y = y
        rect.w = w
        rect.h = h
        return rect
    }
    x:float64=0
    y:float64=0
    w:float64=0
    h:float64=0
}

export class Matrix {
    static identity(){
        return new Matrix().identity()
    }
    a: float64 = 1
    b: float64 = 0
    c: float64 = 0
    d: float64 = 1
    tx: float64 = 0
    ty: float64 = 0
    set(a: float64, b: float64, c: float64, d: float64, tx: float64, ty: float64) {
        this.a = a
        this.b = b
        this.c = c
        this.d = d
        this.tx = tx
        this.ty = ty
        return this
    }
    hasIdentity(){
        return this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.tx === 0 && this.ty === 0
    }
    clone() {
        return new Matrix().copy(this)
    }
    copy(m: Matrix) {
        this.a = m.a
        this.b = m.b
        this.c = m.c
        this.d = m.d
        this.tx = m.tx
        this.ty = m.ty
        return this
    }
    identity() {
        return this.set(1, 0, 0, 1, 0, 0)
    }
    fromTranslate(x: float64, y: float64) {
        return this.set(1, 0, 0, 1, x, y)
    }
    fromScale(x: float64, y: float64) {
        return this.set(x, 0, 0, y, 0, 0)
    }
    fromRotate(angle: float64) {
        let cos = Math.cos(angle)
        let sin = Math.sin(angle)
        return this.set(cos, sin, -sin, cos, 0, 0)
    }
    translate(x: float64, y: float64) {
        this.tx = this.a * x + this.c * y + this.tx
        this.ty = this.b * x + this.d * y + this.ty
        return this
    }
    scale(x: float64, y: float64) {
        this.a *= x
        this.b *= x
        this.c *= y
        this.d *= y
        return this
    }
    rotate(r: float64) {
        let cos = Math.cos(r)
        let sin = Math.sin(r)
        let a = this.a
        let b = this.b
        let c = this.c
        let d = this.d

        this.a = a * cos + c * sin
        this.b = b * cos + d * sin
        this.c = a * -sin + c * cos
        this.d = b * -sin + d * cos
        return this
    }
    preMultiply(m: Matrix) {
        return this.multiply(m, this)
    }
    postMultiply(m: Matrix) {
        return this.multiply(this, m)
    }
    multiply(m1: Matrix, m2: Matrix) {
        let a = m1.a * m2.a + m1.c * m2.b
        let b = m1.b * m2.a + m1.d * m2.b
        let c = m1.a * m2.c + m1.c * m2.d
        let d = m1.b * m2.c + m1.d * m2.d
        let tx = m1.a * m2.tx + m1.c * m2.ty + m1.tx
        let ty = m1.b * m2.tx + m1.d * m2.ty + m1.ty

        this.a = a
        this.b = b
        this.c = c
        this.d = d
        this.tx = tx
        this.ty = ty
        return this

    }
    invert() {
        const det = this.a * this.d - this.c * this.b
        if (det === 0) return this.identity()
        let a = this.a
        let b = this.b
        let c = this.c
        let d = this.d
        let tx = this.tx
        let ty = this.ty
        this.a = d / det
        this.b = -b / det
        this.c = -c / det
        this.d = a / det
        this.tx = (c * ty - d * tx) / det
        this.ty = -(a * ty - b * tx) / det
        return this


    }
    mapPoint(p:Point,out:Point){
        out.x = p.x * this.a + p.y * this.c + this.tx
        out.y = p.x * this.b + p.y * this.d + this.ty
        return out
    }
}