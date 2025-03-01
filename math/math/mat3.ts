import { Matrix2D } from "./mat2d"
import { Matrix4 } from "./mat4"
import { Vector2 } from "./vec2"

export class Matrix3{
    static EPSILON = 0.000001
    static IDENTITY_MATRIX=this.default()
    static identity() {
        /**
         * row-major 行主序，行主序是先行后列，即先填充第一行，再填充第二行，以此类推。而行主序则是先列后行，即先
         * column-major 列主序，列主序是先列后行，即先填充第一列，再填充第二列，以此类推。而行主序则是先填充第一行，再填充第二行，以此类推
         * 列主序的值是按照列的顺序存储在内存中的，即先填充第一列的值，然后是第二列的值，以此类推。而行主序则是先将行的值按顺序存入内存中
        */
        return this.fromRows(
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
        )
    }
    static default(){
        return this.identity()
    }
     // for 2D Transforms

     static fromTranslation(x:number, y:number) {
        return this.fromRows(1, 0, x,
                            0, 1, y,
                            0, 0, 1)
    }

    static fromRotation(theta:number) {
        // counterclockwise
        const c = Math.cos(theta);
        const s = Math.sin(theta);
        return this.fromRows(
            c, - s, 0,
            s, c, 0,
            0, 0, 1
        );
    }

    static fromScale(sx:number, sy:number) {
        return this.fromRows(
            sx, 0, 0,
            0, sy, 0,
            0, 0, 1
        );

    }
    static fromSkew(kx:number, ky:number) {
        return this.fromRows(
            1, Math.tan(kx), 0,
            Math.tan(ky), 1, 0,
            0, 0, 1

        );
    }
    static fromAxisScale(n:Vector2,k:number){
        return this.fromRows(
            1-(k-1)*Math.pow(n.x,2),(k-1)*n.x*n.y,0,
            (k-1)*n.x*n.y,1+(k-1)*Math.pow(n.y,2),0,
            0,0,1
        )
    }
    static fromArray(elements:Float32Array|number[], mutable: boolean = true) {
        return new this(elements, mutable)
    }
    static fromMat2d(matrix:Matrix2D){
        return this.fromRows(matrix.a, matrix.c, matrix.e,
                            matrix.b, matrix.d, matrix.f,
                            0,0, 1)
    }
    static fromTranslateRotationScale(translate:Vector2,rotation:number, scale:Vector2){
        const cos=Math.cos(rotation)
        const sin=Math.sin(rotation)
        const a=cos*scale.x
        const b=sin*scale.x
        const c=-sin*scale.y
        const d=cos*scale.y
        const tx=translate.x
        const ty=translate.y

        return this.fromRows(a,c,tx,
                            b,d,ty,
                            0,0,1);
    }
    static fromTranslateRotationSkewScaleOriginPivot(translate:Vector2,skew:Vector2,rotation:number, scale:Vector2,origin:Vector2,pivot:Vector2){
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
        return   this.fromRows(
            a,c,e,
            b,d,f,
            0,0,1
        )
    }
    static fromRows(n11: number, n12: number, n13: number, n21: number, n22: number, n23: number, n31: number, n32: number, n33: number) {
        return this.fromArray([n11,n21,n31, n12,n22,n32, n13,n23,n33])
    }
    static pools: Matrix3[] = []
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
    static release(instance: Matrix3) {
        if (this.pools.length < this.poolSize) {
            instance.mutable = true
            this.pools.push(instance)
        }
    }
    isMatrix3:boolean=true
    elements: Float32Array=new Float32Array(9)
    mutable: boolean = true
    constructor(elements:Float32Array|number[], mutable: boolean = true) {
        this.elements.set(elements)
        this.mutable = mutable
    }
    pool() {
        return (this.constructor as typeof Matrix3).pool()
    }
    release() {
        return (this.constructor as typeof Matrix3).release(this)
    }

    setMutable(mutable: boolean) {
        this.mutable = mutable
        return this;
    }

    identity() {
        return this.set(
            1,0,0,
            0,1,0,
            0,0,1
        );
    }
    set(n11: number, n12: number, n13: number, n21: number, n22: number, n23: number, n31: number, n32: number, n33: number) {
        if (this.mutable) {
            this.elements[0] = n11; this.elements[3] = n12; this.elements[6] = n13;
            this.elements[1] = n21; this.elements[4] = n22; this.elements[7] = n23;
            this.elements[2] = n31; this.elements[5] = n32; this.elements[8] = n33;
            return this;
        } else {
            return (this.constructor as typeof Matrix3).fromRows(n11, n12, n13, n21, n22, n23, n31, n32, n33).setMutable(this.mutable)
        }
    }
    setElements(elements: Float32Array | number[]): Matrix3 {
        if (this.mutable) {
            this.elements.set(elements)
            return this;
        } else {
            return (this.constructor as typeof Matrix3).fromArray(elements).setMutable(this.mutable)
        }
    }
    clone() {
        return (this.constructor as typeof Matrix3).fromArray(this.elements,this.mutable)
    }
    copy(other: Matrix3) {
        this.elements.set(other.elements)
        return this
    }
    isIdentity(){
        return this.elements.every((v,i)=>v===Matrix3.IDENTITY_MATRIX.elements[i])
    }
    isZero() {
        return this.elements.every(v => v === 0)
    }
    isFinite() {
        return this.elements.every(v => Number.isFinite(v))
    }
    floor() {
        return this.setElements(this.elements.map(v => Math.floor(v)))
    }
    ceil() {
        return this.setElements(this.elements.map(v => Math.ceil(v)))
    }
    multiply(m: Matrix3) {
        return this.multiplyMatrices(this, m);
    }
    premultiply(m: Matrix3) {
        return this.multiplyMatrices(m, this);
    }
    multiplyMatrices(a: Matrix3, b: Matrix3) {

        const ae = a.elements;
        const be = b.elements;

        const a11 = ae[0], a12 = ae[3], a13 = ae[6];
        const a21 = ae[1], a22 = ae[4], a23 = ae[7];
        const a31 = ae[2], a32 = ae[5], a33 = ae[8];

        const b11 = be[0], b12 = be[3], b13 = be[6];
        const b21 = be[1], b22 = be[4], b23 = be[7];
        const b31 = be[2], b32 = be[5], b33 = be[8];

        const n11 = a11 * b11 + a12 * b21 + a13 * b31;
        const n12 = a11 * b12 + a12 * b22 + a13 * b32;
        const n13 = a11 * b13 + a12 * b23 + a13 * b33;

        const n21 = a21 * b11 + a22 * b21 + a23 * b31;
        const n22 = a21 * b12 + a22 * b22 + a23 * b32;
        const n23 = a21 * b13 + a22 * b23 + a23 * b33;

        const n31 = a31 * b11 + a32 * b21 + a33 * b31;
        const n32 = a31 * b12 + a32 * b22 + a33 * b32;
        const n33 = a31 * b13 + a32 * b23 + a33 * b33;

        return this.set(n11, n12, n13, n21, n22, n23, n31, n32, n33);

    }

    multiplyScalar(s: number) {
        const te = this.elements;
        return this.set(
            te[0] * s, te[3] * s, te[6] * s,
            te[1] * s, te[4] * s, te[7] * s,
            te[2] * s, te[5] * s, te[8] * s
        );

    }
	setFromMatrix4( m ) {
		const me = m.elements;
		return this.set(
			me[ 0 ], me[ 4 ], me[ 8 ],
			me[ 1 ], me[ 5 ], me[ 9 ],
			me[ 2 ], me[ 6 ], me[ 10 ]
		);
	}
    determinant() {

        const te = this.elements;

        const a = te[0], b = te[1], c = te[2],
            d = te[3], e = te[4], f = te[5],
            g = te[6], h = te[7], i = te[8];

        return a * e * i - a * f * h - b * d * i + b * f * g + c * d * h - c * e * g;

    }

    invert() {

        const te = this.elements,

            n11 = te[0], n21 = te[1], n31 = te[2],
            n12 = te[3], n22 = te[4], n32 = te[5],
            n13 = te[6], n23 = te[7], n33 = te[8],

            t11 = n33 * n22 - n32 * n23,
            t12 = n32 * n13 - n33 * n12,
            t13 = n23 * n12 - n22 * n13,

            det = n11 * t11 + n21 * t12 + n31 * t13;

        if (det === 0) return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0);

        const detInv = 1 / det;

        const o11 = t11 * detInv;
        const o21 = (n31 * n23 - n33 * n21) * detInv;
        const o31 = (n32 * n21 - n31 * n22) * detInv;

        const o12 = t12 * detInv;
        const o22 = (n33 * n11 - n31 * n13) * detInv;
        const o32 = (n31 * n12 - n32 * n11) * detInv;

        const o13 = t13 * detInv;
        const o23 = (n21 * n13 - n23 * n11) * detInv;
        const o33 = (n22 * n11 - n21 * n12) * detInv;

        return this.set(
            o11, o12, o13,
            o21, o22, o23,
            o31, o32, o33
        );

    }

    transpose() {

        let tmp;
        const m = this.elements;

        tmp = m[1]; m[1] = m[3]; m[3] = tmp;
        tmp = m[2]; m[2] = m[6]; m[6] = tmp;
        tmp = m[5]; m[5] = m[7]; m[7] = tmp;

        return this.set(
            m[0], m[1], m[2],
            m[3], m[4], m[5],
            m[6], m[7], m[8]
        );

    }
    getNormalMatrix( matrix4:Matrix4 ) {
		return this.setFromMatrix4( matrix4 ).invert().transpose();

	}
    scale( sx:number, sy:number ) {

		this.premultiply(Matrix3.fromScale( sx, sy ) );

		return this;

	}

	rotate( theta:number ) {

		this.premultiply( Matrix3.fromRotation( - theta ) );

		return this;

	}

	translate( tx:number, ty:number ) {

		this.premultiply( Matrix3.fromTranslation( tx, ty ) );

		return this;

	}
    mapPoints(points:Vector2[]){
        points.forEach(p=>{
            p.applyMatrix3(this)
        })
    }
    adjoint(){
        const a=this.elements
        let a00 = a[0],
            a01 = a[1],
            a02 = a[2];
        let a10 = a[3],
            a11 = a[4],
            a12 = a[5];
        let a20 = a[6],
            a21 = a[7],
            a22 = a[8];

        const n11 = a11 * a22 - a12 * a21;
        const n21 = a02 * a21 - a01 * a22;
        const n31 = a01 * a12 - a02 * a11;
        const n12 = a12 * a20 - a10 * a22;
        const n22 = a00 * a22 - a02 * a20;
        const n32 = a02 * a10 - a00 * a12;
        const n13 = a10 * a21 - a11 * a20;
        const n23 = a01 * a20 - a00 * a21;
        const n33 = a00 * a11 - a01 * a10;
        return this.set(n11, n21, n31,
            n12, n22, n32,
            n13, n23, n33);
    }
    projection(width:number,height:number){
        return this.set(
            2 / width,0,-1,
            0,-2/height,1,
            0,0,1
        )
    }
    equals( matrix:Matrix3 ) {	
		return !this.elements.some((v,i)=>matrix.elements[i]!==v);
	}
    
    equalsEpsilon(matrix:Matrix3,epsilon=1e-6){
		return !this.elements.some((v,i)=>Math.abs(matrix.elements[i]-v)>epsilon);
	}

	fromArray( array:number[]|Float32Array, offset = 0 ) {
		for ( let i = 0; i < 9; i ++ ) {
			this.elements[ i ] = array[ i + offset ];
		}
		return this;

	}

	toArray( array:number[]|Float32Array = [], offset = 0 ) {

		const te = this.elements;
		array[ offset ] = te[ 0 ];
		array[ offset + 1 ] = te[ 1 ];
		array[ offset + 2 ] = te[ 2 ];

		array[ offset + 3 ] = te[ 3 ];
		array[ offset + 4 ] = te[ 4 ];
		array[ offset + 5 ] = te[ 5 ];

		array[ offset + 6 ] = te[ 6 ];
		array[ offset + 7 ] = te[ 7 ];
		array[ offset + 8 ] = te[ 8 ];

		return array;

	}
}