
// @ts-nocheck
import type { Euler } from './euler';
import { Quaternion } from './quad';
import { Vector3 } from './vec3';

export class Matrix4 {
    static DEFAULT_MUTABLE = true
    static WebGLCoordinateSystem = 2000
    static WebGPUCoordinateSystem = 2001
    static EPSILON = 0.000001
    static IDENTITY_MATRIX = this.default()
    static identity() {
        return this.fromRows(
            1, 0, 0,0,
            0, 1, 0,0,
            0, 0, 1,0,
            0,0,0,1
        )
    }
    static default() {
        return this.identity()
    }
    // for 2D Transforms

    static fromTranslation(x: number, y: number, z: number) {
        return this.fromRows(
            1, 0, 0, x,
            0, 1, 0, y,
            0, 0, 1, z,
            0, 0, 0, 1)
    }
    static fromRotationAxis(axis:Vector3, angle:number) {

        // Based on http://www.gamedev.net/reference/articles/article1199.asp

        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const t = 1 - c;
        const x = axis.x, y = axis.y, z = axis.z;
        const tx = t * x, ty = t * y;
        return Matrix4.fromRows(
            tx * x + c, tx * y - s * z, tx * z + s * y, 0,
            tx * y + s * z, ty * y + c, ty * z - s * x, 0,
            tx * z - s * y, ty * z + s * x, t * z * z + c, 0,
            0, 0, 0, 1

        );

    }
    static fromScaleAxis(axis:Vector3, k:number) {

        const s=k-1,x=axis.x,y=axis.y,z=axis.z;
        const tx = s * x, ty = s * y, tz = s * z;
        return Matrix4.fromRows(
            tx*x+1,tx*y,tx*z,0,
            ty*x,ty*y+1,ty*z,0,
            tz*x,tz*y,tz*z+1,0,
            0, 0, 0, 1
        );

    }
    // 投影平面
    static fromProjectPlane(axis:Vector3) {
        const x=axis.x,y=axis.y,z=axis.z;
        return this.fromRows(
            1-x*x, -x*y, -x*z, 0,
            -y*x, 1-y*y, -y*z, 0,
            -z*x, -z*y, 1-z*z, 0,
            0, 0, 0, 1
        )
    }
    // 镜像
    static fromMirrorImage(axis:Vector3) {
        const x=axis.x,y=axis.y,z=axis.z;
        return this.fromRows(
            1-2*x*x, -2*x*y, -2*x*z, 0,
            -2*y*x, 1-2*y*y, -2*y*z, 0,
            -2*z*x, -2*z*y, 1-2*z*z, 0,
            0, 0, 0, 1
        )
    }
    static makeRotationFromQuaternion(q:Quaternion) {

        return this.default().compose(_zero, q, _one);

    }
    static makePerspective(left, right, top, bottom, near, far, coordinateSystem = Matrix4.WebGLCoordinateSystem) {

        const x = 2 * near / (right - left);
        const y = 2 * near / (top - bottom);

        const a = (right + left) / (right - left);
        const b = (top + bottom) / (top - bottom);

        let c, d;

        if (coordinateSystem === Matrix4.WebGLCoordinateSystem) {

            c = - (far + near) / (far - near);
            d = (- 2 * far * near) / (far - near);

        } else if (coordinateSystem === Matrix4.WebGPUCoordinateSystem) {

            c = - far / (far - near);
            d = (- far * near) / (far - near);

        } else {

            throw new Error('THREE.Matrix4.makePerspective(): Invalid coordinate system: ' + coordinateSystem);

        }
        return this.fromRows(
            x,0,a,0,
            0,y,b,0,
            0,0,c,d,
            0,0,-1,0
        );
    }
	static makeOrthographic( left:number, right:number, top:number, bottom:number, near:number, far:number, coordinateSystem = Matrix4.WebGLCoordinateSystem ) {

		const w = 1.0 / ( right - left );
		const h = 1.0 / ( top - bottom );
		const p = 1.0 / ( far - near );

		const x = ( right + left ) * w;
		const y = ( top + bottom ) * h;

		let z, zInv;

		if ( coordinateSystem === Matrix4.WebGLCoordinateSystem ) {

			z = ( far + near ) * p;
			zInv = - 2 * p;

		} else if ( coordinateSystem === Matrix4.WebGPUCoordinateSystem ) {

			z = near * p;
			zInv = - 1 * p;

		} else {

			throw new Error( 'THREE.Matrix4.makeOrthographic(): Invalid coordinate system: ' + coordinateSystem );

		}
        const m=Matrix4.default()
        const te=m.elements
		te[ 0 ] = 2 * w;	te[ 4 ] = 0;		te[ 8 ] = 0; 		te[ 12 ] = - x;
		te[ 1 ] = 0; 		te[ 5 ] = 2 * h;	te[ 9 ] = 0; 		te[ 13 ] = - y;
		te[ 2 ] = 0; 		te[ 6 ] = 0;		te[ 10 ] = zInv;	te[ 14 ] = - z;
		te[ 3 ] = 0; 		te[ 7 ] = 0;		te[ 11 ] = 0;		te[ 15 ] = 1;

		return m

	}
    static fromScale(sx: number, sy: number,sz:number) {
        return this.fromRows(
            sx, 0, 0,0,
            0, sy, 0,0,
            0, 0, sz,0,
            0,0,0,1
        );

    }
    static fromArray(elements: Float32Array | number[], mutable: boolean = true) {
        return new this(elements, mutable)
    }
    static fromRows(
        n11: number, n12: number, n13: number, n14: number,
        n21: number, n22: number, n23: number, n24: number,
        n31: number, n32: number, n33: number, n34: number,
        n41: number, n42: number, n43: number, n44: number
    ) {
        return this.fromArray([n11, n21, n31, n41, n12, n22, n32, n42, n13, n23, n33, n43, n14, n24, n34, n44])
    }
    static pools: Matrix4[] = []
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
    static release(instance: Matrix4) {
        if (this.pools.length < this.poolSize) {
            instance.mutable = true
            this.pools.push(instance)
        }
    }
    isMatrix4:boolean=true
    elements: Float32Array = new Float32Array(16)
    mutable: boolean = Matrix4.DEFAULT_MUTABLE
    isMatrix3: boolean = true
    constructor(elements: Float32Array | number[], mutable: boolean = true) {
        this.elements.set(elements)
        this.mutable = mutable
    }
    pool() {
        return (this.constructor as typeof Matrix4).pool()
    }
    release() {
        return (this.constructor as typeof Matrix4).release(this)
    }

    setMutable(mutable: boolean) {
        this.mutable = mutable
        return this;
    }
    self(){
        return this.mutable?this:this.clone()
    }

    identity() {
        this.set(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        );
        return this;
    }
    set(
        n11: number, n12: number, n13: number, n14: number,
        n21: number, n22: number, n23: number, n24: number,
        n31: number, n32: number, n33: number, n34: number,
        n41: number, n42: number, n43: number, n44: number
    ) {
        if (this.mutable) {
            this.elements[0] = n11; this.elements[4] = n12; this.elements[8] = n13; this.elements[12] = n14;
            this.elements[1] = n21; this.elements[5] = n22; this.elements[9] = n23; this.elements[13] = n24;
            this.elements[2] = n31; this.elements[6] = n32; this.elements[10] = n33; this.elements[14] = n34;
            this.elements[3] = n41; this.elements[7] = n42; this.elements[11] = n43; this.elements[15] = n44;
            return this;
        } else {
            return (this.constructor as typeof Matrix4).fromRows(n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44).setMutable(this.mutable)
        }
    }
    setColumnXYZW(index: number,x:number,y:number,z:number,w?:number): Matrix4 {
        if (this.mutable) {
            const te = this.elements;
            const cIndex=index * 4
            te[cIndex] = x;
            te[cIndex + 1] =y;
            te[cIndex + 2] = z;
            if(w!==undefined){
                te[cIndex + 3] = w;
            }


            return this;
        } else {
            return (this.constructor as typeof Matrix4).fromArray(this.elements).setColumnXYZW(index, x,y,z,w).setMutable(true)
        }
    }
    setColumnVector3(index: number, v: Vector3): Matrix4 {
        return this.setColumnXYZW(index, v.x,v.y,v.z)
    }
    setRowXYZW(index: number,x:number,y:number,z:number,w:number): Matrix4 {
        if (this.mutable) {
            const te = this.elements;
            const rIndex=index
            te[rIndex] = x;
            te[rIndex+4] = y;
            te[rIndex+8] = z;
            te[rIndex+12] = w;
            return this;
        } else {
            return (this.constructor as typeof Matrix4).fromArray(this.elements).setRowXYZW(index, x,y,z,w).setMutable(true)
        }
    }
    setElements(elements: Float32Array | number[]): Matrix4 {
        if (this.mutable) {
            this.elements.set(elements)
            return this;
        } else {
            return (this.constructor as typeof Matrix4).fromArray(elements).setMutable(this.mutable)
        }
    }
    clone() {
        return Matrix4.fromArray(this.elements);
    }

    copy(m: Matrix4) {
        return this.setElements(m.elements);
    }

    copyPosition(m) {
        const  me = m.elements;
        return this.setColumnXYZW(3,me[12],me[13],me[14]);

    }

    setFromMatrix3(m) {

        const me = m.elements;

        this.set(

            me[0], me[3], me[6], 0,
            me[1], me[4], me[7], 0,
            me[2], me[5], me[8], 0,
            0, 0, 0, 1

        );

        return this;

    }

    extractBasis(xAxis, yAxis, zAxis) {

        xAxis.setFromMatrixColumn(this, 0);
        yAxis.setFromMatrixColumn(this, 1);
        zAxis.setFromMatrixColumn(this, 2);

        return this;

    }

    makeBasis(xAxis, yAxis, zAxis) {

        this.set(
            xAxis.x, yAxis.x, zAxis.x, 0,
            xAxis.y, yAxis.y, zAxis.y, 0,
            xAxis.z, yAxis.z, zAxis.z, 0,
            0, 0, 0, 1
        );

        return this;

    }

    extractRotation(m:Matrix4) {

        // this method does not support reflection matrices
        const self=this.self()
        const te = self.elements;
        const me = m.elements;

        const scaleX = 1 / _v1.setFromMatrixColumn(m, 0).length();
        const scaleY = 1 / _v1.setFromMatrixColumn(m, 1).length();
        const scaleZ = 1 / _v1.setFromMatrixColumn(m, 2).length();

        te[0] = me[0] * scaleX;
        te[1] = me[1] * scaleX;
        te[2] = me[2] * scaleX;
        te[3] = 0;

        te[4] = me[4] * scaleY;
        te[5] = me[5] * scaleY;
        te[6] = me[6] * scaleY;
        te[7] = 0;

        te[8] = me[8] * scaleZ;
        te[9] = me[9] * scaleZ;
        te[10] = me[10] * scaleZ;
        te[11] = 0;

        te[12] = 0;
        te[13] = 0;
        te[14] = 0;
        te[15] = 1;

        return self
    }

    makeRotationFromEuler(euler:Euler) {
        const self=this.self()
        const te = self.elements;

        const x = euler.x, y = euler.y, z = euler.z;
        const a = Math.cos(x), b = Math.sin(x);
        const c = Math.cos(y), d = Math.sin(y);
        const e = Math.cos(z), f = Math.sin(z);

        if (euler.order === 'XYZ') {

            const ae = a * e, af = a * f, be = b * e, bf = b * f;

            te[0] = c * e;
            te[4] = - c * f;
            te[8] = d;

            te[1] = af + be * d;
            te[5] = ae - bf * d;
            te[9] = - b * c;

            te[2] = bf - ae * d;
            te[6] = be + af * d;
            te[10] = a * c;

        } else if (euler.order === 'YXZ') {

            const ce = c * e, cf = c * f, de = d * e, df = d * f;

            te[0] = ce + df * b;
            te[4] = de * b - cf;
            te[8] = a * d;

            te[1] = a * f;
            te[5] = a * e;
            te[9] = - b;

            te[2] = cf * b - de;
            te[6] = df + ce * b;
            te[10] = a * c;

        } else if (euler.order === 'ZXY') {

            const ce = c * e, cf = c * f, de = d * e, df = d * f;

            te[0] = ce - df * b;
            te[4] = - a * f;
            te[8] = de + cf * b;

            te[1] = cf + de * b;
            te[5] = a * e;
            te[9] = df - ce * b;

            te[2] = - a * d;
            te[6] = b;
            te[10] = a * c;

        } else if (euler.order === 'ZYX') {

            const ae = a * e, af = a * f, be = b * e, bf = b * f;

            te[0] = c * e;
            te[4] = be * d - af;
            te[8] = ae * d + bf;

            te[1] = c * f;
            te[5] = bf * d + ae;
            te[9] = af * d - be;

            te[2] = - d;
            te[6] = b * c;
            te[10] = a * c;

        } else if (euler.order === 'YZX') {

            const ac = a * c, ad = a * d, bc = b * c, bd = b * d;

            te[0] = c * e;
            te[4] = bd - ac * f;
            te[8] = bc * f + ad;

            te[1] = f;
            te[5] = a * e;
            te[9] = - b * e;

            te[2] = - d * e;
            te[6] = ad * f + bc;
            te[10] = ac - bd * f;

        } else if (euler.order === 'XZY') {

            const ac = a * c, ad = a * d, bc = b * c, bd = b * d;

            te[0] = c * e;
            te[4] = - f;
            te[8] = d * e;

            te[1] = ac * f + bd;
            te[5] = a * e;
            te[9] = ad * f - bc;

            te[2] = bc * f - ad;
            te[6] = b * e;
            te[10] = bd * f + ac;

        }

        // bottom row
        te[3] = 0;
        te[7] = 0;
        te[11] = 0;

        // last column
        te[12] = 0;
        te[13] = 0;
        te[14] = 0;
        te[15] = 1;

        return self;

    }

    makeRotationFromQuaternion(q:Quaternion) {

        return this.compose(_zero, q, _one);

    }

    lookAt(eye:Vector3, target:Vector3, up:Vector3) {

        const te = this.elements;

        _z.subVectors(eye, target);

        if (_z.squaredLength() === 0) {

            // eye and target are in the same position

            _z.z = 1;

        }

        _z.normalize();
        _x.crossVectors(up, _z);

        if (_x.squaredLength() === 0) {

            // up and z are parallel

            if (Math.abs(up.z) === 1) {

                _z.x += 0.0001;

            } else {

                _z.z += 0.0001;

            }

            _z.normalize();
            _x.crossVectors(up, _z);

        }

        _x.normalize();
        _y.crossVectors(_z, _x);

        te[0] = _x.x; te[4] = _y.x; te[8] = _z.x;
        te[1] = _x.y; te[5] = _y.y; te[9] = _z.y;
        te[2] = _x.z; te[6] = _y.z; te[10] = _z.z;

        return this;

    }

    multiply(m) {

        return this.multiplyMatrices(this, m);

    }

    premultiply(m) {

        return this.multiplyMatrices(m, this);

    }

    multiplyMatrices(a, b) {

        const ae = a.elements;
        const be = b.elements;
        const te = this.elements;

        const a11 = ae[0], a12 = ae[4], a13 = ae[8], a14 = ae[12];
        const a21 = ae[1], a22 = ae[5], a23 = ae[9], a24 = ae[13];
        const a31 = ae[2], a32 = ae[6], a33 = ae[10], a34 = ae[14];
        const a41 = ae[3], a42 = ae[7], a43 = ae[11], a44 = ae[15];

        const b11 = be[0], b12 = be[4], b13 = be[8], b14 = be[12];
        const b21 = be[1], b22 = be[5], b23 = be[9], b24 = be[13];
        const b31 = be[2], b32 = be[6], b33 = be[10], b34 = be[14];
        const b41 = be[3], b42 = be[7], b43 = be[11], b44 = be[15];

        const m11 = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
        const m12 = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
        const m13 = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
        const m14 = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

        const m21= a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
        const m22= a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
        const m23= a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
        const m24 = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

        const m31= a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
        const m32= a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
        const m33 = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
        const m34 = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

        const m41= a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
        const m42= a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
        const m43 = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
        const m44 = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

        return this.set(
            m11,m12,m13,m14,
            m21,m22,m23,m24,
            m31,m32,m33,m34,
            m41,m42,m43,m44
        );

    }

    multiplyScalar(s) {
        const te = this.elements;
        return this.set(     
            te[0] * s, te[4] *s,te[8] *s, te[12] * s,
            te[1] * s, te[5] *s,te[9] *s, te[13] * s,
            te[2] * s, te[6] *s,te[10] * s, te[14] * s,
            te[3] * s, te[7] *s,te[11] * s, te[15] * s);

    }

    determinant() {

        const te = this.elements;

        const n11 = te[0], n12 = te[4], n13 = te[8], n14 = te[12];
        const n21 = te[1], n22 = te[5], n23 = te[9], n24 = te[13];
        const n31 = te[2], n32 = te[6], n33 = te[10], n34 = te[14];
        const n41 = te[3], n42 = te[7], n43 = te[11], n44 = te[15];

        //TODO: make this more efficient
        //( based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm )

        return (
            n41 * (
                + n14 * n23 * n32
                - n13 * n24 * n32
                - n14 * n22 * n33
                + n12 * n24 * n33
                + n13 * n22 * n34
                - n12 * n23 * n34
            ) +
            n42 * (
                + n11 * n23 * n34
                - n11 * n24 * n33
                + n14 * n21 * n33
                - n13 * n21 * n34
                + n13 * n24 * n31
                - n14 * n23 * n31
            ) +
            n43 * (
                + n11 * n24 * n32
                - n11 * n22 * n34
                - n14 * n21 * n32
                + n12 * n21 * n34
                + n14 * n22 * n31
                - n12 * n24 * n31
            ) +
            n44 * (
                - n13 * n22 * n31
                - n11 * n23 * n32
                + n11 * n22 * n33
                + n13 * n21 * n32
                - n12 * n21 * n33
                + n12 * n23 * n31
            )

        );

    }

    transpose() {
        const te = this.elements;
        return this.set(
            te[0], te[1], te[2], te[3],
            te[4], te[5], te[6], te[7],
            te[8], te[9], te[10], te[11],
            te[12], te[13], te[14], te[15]
        );

    }

    setPosition(x:number, y:number, z:number) {
        if (x.isVector3) {
            return this.setColumnVector3(4,x as any);
        } else {
            return this.setColumnVector3(4,Vector3.create(x,y,z));
        }
    }

    invert() {

        // based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm
        const te = this.elements,

            n11 = te[0], n21 = te[1], n31 = te[2], n41 = te[3],
            n12 = te[4], n22 = te[5], n32 = te[6], n42 = te[7],
            n13 = te[8], n23 = te[9], n33 = te[10], n43 = te[11],
            n14 = te[12], n24 = te[13], n34 = te[14], n44 = te[15],

            t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44,
            t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44,
            t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44,
            t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;

        const det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;

        if (det === 0) return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

        const detInv = 1 / det;

        te[0] = t11 * detInv;
        te[1] = (n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44) * detInv;
        te[2] = (n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44) * detInv;
        te[3] = (n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43) * detInv;

        te[4] = t12 * detInv;
        te[5] = (n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44) * detInv;
        te[6] = (n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44) * detInv;
        te[7] = (n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43) * detInv;

        te[8] = t13 * detInv;
        te[9] = (n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44) * detInv;
        te[10] = (n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44) * detInv;
        te[11] = (n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43) * detInv;

        te[12] = t14 * detInv;
        te[13] = (n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34) * detInv;
        te[14] = (n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34) * detInv;
        te[15] = (n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33) * detInv;

        return this;

    }

    scale(v) {

        const te = this.elements;
        const x = v.x, y = v.y, z = v.z;

        te[0] *= x; te[4] *= y; te[8] *= z;
        te[1] *= x; te[5] *= y; te[9] *= z;
        te[2] *= x; te[6] *= y; te[10] *= z;
        te[3] *= x; te[7] *= y; te[11] *= z;

        return this;

    }

    getMaxScaleOnAxis() {

        const te = this.elements;

        const scaleXSq = te[0] * te[0] + te[1] * te[1] + te[2] * te[2];
        const scaleYSq = te[4] * te[4] + te[5] * te[5] + te[6] * te[6];
        const scaleZSq = te[8] * te[8] + te[9] * te[9] + te[10] * te[10];

        return Math.sqrt(Math.max(scaleXSq, scaleYSq, scaleZSq));

    }

    makeTranslation(x, y, z) {

        if (x.isVector3) {

            this.set(

                1, 0, 0, x.x,
                0, 1, 0, x.y,
                0, 0, 1, x.z,
                0, 0, 0, 1

            );

        } else {

            this.set(

                1, 0, 0, x,
                0, 1, 0, y,
                0, 0, 1, z,
                0, 0, 0, 1

            );

        }

        return this;

    }

    makeRotationX(theta) {

        const c = Math.cos(theta), s = Math.sin(theta);

        this.set(

            1, 0, 0, 0,
            0, c, - s, 0,
            0, s, c, 0,
            0, 0, 0, 1

        );

        return this;

    }

    makeRotationY(theta) {

        const c = Math.cos(theta), s = Math.sin(theta);

        this.set(

            c, 0, s, 0,
            0, 1, 0, 0,
            - s, 0, c, 0,
            0, 0, 0, 1

        );

        return this;

    }

    makeRotationZ(theta) {

        const c = Math.cos(theta), s = Math.sin(theta);

        this.set(

            c, - s, 0, 0,
            s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1

        );

        return this;

    }

    makeRotationAxis(axis:Vector3, angle:number) {

        // Based on http://www.gamedev.net/reference/articles/article1199.asp

        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const t = 1 - c;
        const x = axis.x, y = axis.y, z = axis.z;
        const tx = t * x, ty = t * y;

        this.set(

            tx * x + c, tx * y - s * z, tx * z + s * y, 0,
            tx * y + s * z, ty * y + c, ty * z - s * x, 0,
            tx * z - s * y, ty * z + s * x, t * z * z + c, 0,
            0, 0, 0, 1

        );

        return this;

    }
    static makeRotationAxis2(axis:Vector3,angle:number){
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const t=1-c
        const tx=t*axis.x,ty=t*axis.y,tz=t*axis.z

        const xAxis=Matrix4.fromRows(
            tx,0,0,c,
            0,tx,-s,0,
            0,s,tx,0,
            0,0,0,1
        )
      
    }

    makeScale(x, y, z) {

        // 设置变换矩阵的元素
        this.set(

            // 设置x轴缩放
            x, 0, 0, 0,
            // 设置y轴缩放
            0, y, 0, 0,
            // 设置z轴缩放
            0, 0, z, 0,
            // 保持齐次坐标的最后一个元素为1
            0, 0, 0, 1

        );

        // 返回当前对象
        return this;

    }

    makeShear(xy, xz, yx, yz, zx, zy) {

        this.set(

            1, yx, zx, 0,
            xy, 1, zy, 0,
            xz, yz, 1, 0,
            0, 0, 0, 1

        );

        return this;

    }

    compose(position:Vector3, quaternion:Quaternion, scale:Vector3) {
        const self=this.self()
        const te = self.elements;

        const x = quaternion._x, y = quaternion._y, z = quaternion._z, w = quaternion._w;
        const x2 = x + x, y2 = y + y, z2 = z + z;
        const xx = x * x2, xy = x * y2, xz = x * z2;
        const yy = y * y2, yz = y * z2, zz = z * z2;
        const wx = w * x2, wy = w * y2, wz = w * z2;

        const sx = scale.x, sy = scale.y, sz = scale.z;

        te[0] = (1 - (yy + zz)) * sx;
        te[1] = (xy + wz) * sx;
        te[2] = (xz - wy) * sx;
        te[3] = 0;

        te[4] = (xy - wz) * sy;
        te[5] = (1 - (xx + zz)) * sy;
        te[6] = (yz + wx) * sy;
        te[7] = 0;

        te[8] = (xz + wy) * sz;
        te[9] = (yz - wx) * sz;
        te[10] = (1 - (xx + yy)) * sz;
        te[11] = 0;

        te[12] = position.x;
        te[13] = position.y;
        te[14] = position.z;
        te[15] = 1;

        return self;

    }

    decompose(position:Vector3, quaternion:Quaternion, scale:Vector3) {
        const self=this.self()
        const te = self.elements;

        let sx = _v1.set(te[0], te[1], te[2]).length();
        const sy = _v1.set(te[4], te[5], te[6]).length();
        const sz = _v1.set(te[8], te[9], te[10]).length();

        // if determine is negative, we need to invert one scale
        const det = this.determinant();
        if (det < 0) sx = - sx;

        position.x = te[12];
        position.y = te[13];
        position.z = te[14];

        // scale the rotation part
        _m1.copy(this);

        const invSX = 1 / sx;
        const invSY = 1 / sy;
        const invSZ = 1 / sz;

        _m1.elements[0] *= invSX;
        _m1.elements[1] *= invSX;
        _m1.elements[2] *= invSX;

        _m1.elements[4] *= invSY;
        _m1.elements[5] *= invSY;
        _m1.elements[6] *= invSY;

        _m1.elements[8] *= invSZ;
        _m1.elements[9] *= invSZ;
        _m1.elements[10] *= invSZ;

        quaternion.setFromRotationMatrix(_m1);

        scale.x = sx;
        scale.y = sy;
        scale.z = sz;

        return self;

    }

    makePerspective(left:number, right:number, top:number, bottom:number, near:number, far:number, coordinateSystem = Matrix4.WebGLCoordinateSystem) {

        const te = this.elements;
        const x = 2 * near / (right - left);
        const y = 2 * near / (top - bottom);

        const a = (right + left) / (right - left);
        const b = (top + bottom) / (top - bottom);

        let c, d;

        if (coordinateSystem === Matrix4.WebGLCoordinateSystem) {

            c = - (far + near) / (far - near);
            d = (- 2 * far * near) / (far - near);

        } else if (coordinateSystem === Matrix4.WebGPUCoordinateSystem) {

            c = - far / (far - near);
            d = (- far * near) / (far - near);

        } else {

            throw new Error('THREE.Matrix4.makePerspective(): Invalid coordinate system: ' + coordinateSystem);

        }

        te[0] = x; te[4] = 0; te[8] = a; te[12] = 0;
        te[1] = 0; te[5] = y; te[9] = b; te[13] = 0;
        te[2] = 0; te[6] = 0; te[10] = c; te[14] = d;
        te[3] = 0; te[7] = 0; te[11] = - 1; te[15] = 0;

        return this.set(
            x,0,a,0,
            0,y,b,0,
            0,0,c,d,
            0,0,-1,0
        );
    }

    makeOrthographic(left:number, right:number, top:number, bottom:number, near:number, far:number, coordinateSystem = Matrix4.WebGLCoordinateSystem ) {
        const te = this.elements;
		const w = 1.0 / ( right - left );
		const h = 1.0 / ( top - bottom );
		const p = 1.0 / ( far - near );

		const x = ( right + left ) * w;
		const y = ( top + bottom ) * h;

		let z, zInv;

		if ( coordinateSystem === Matrix4.WebGLCoordinateSystem ) {

			z = ( far + near ) * p;
			zInv = - 2 * p;

		} else if ( coordinateSystem === Matrix4.WebGPUCoordinateSystem ) {

			z = near * p;
			zInv = - 1 * p;

		} else {

			throw new Error( 'THREE.Matrix4.makeOrthographic(): Invalid coordinate system: ' + coordinateSystem );

		}

		te[ 0 ] = 2 * w;	te[ 4 ] = 0;		te[ 8 ] = 0; 		te[ 12 ] = - x;
		te[ 1 ] = 0; 		te[ 5 ] = 2 * h;	te[ 9 ] = 0; 		te[ 13 ] = - y;
		te[ 2 ] = 0; 		te[ 6 ] = 0;		te[ 10 ] = zInv;	te[ 14 ] = - z;
		te[ 3 ] = 0; 		te[ 7 ] = 0;		te[ 11 ] = 0;		te[ 15 ] = 1;

		return this.set(
            2 * w,0,0,-x,
            0,2 * h,0,-y,
            0,0,zInv,-z,
            0,0,0,1
        );
       
    }

    mapPoints(points:Vector3[]){
        points.forEach(p=>{
            p.applyMatrix4(this)
        })
    }
    equals( matrix:Matrix4 ) {	
		return !this.elements.some((v,i)=>matrix.elements[i]!==v);
	}
    
    equalsEpsilon(matrix:Matrix4,epsilon=1e-6){
		return !this.elements.some((v,i)=>Math.abs(matrix.elements[i]-v)>epsilon);
	}

    fromArray(array: number[] | Float32Array, offset = 0) {
        const elements=new Float32Array(16)
        for (let i = 0; i < 16; i++) {
            elements[i] = array[i + offset];
        }
        return this.setElements(elements);

    }

    toArray(array: number[] | Float32Array = [], offset = 0) {

        const te = this.elements;

        array[offset] = te[0];
        array[offset + 1] = te[1];
        array[offset + 2] = te[2];
        array[offset + 3] = te[3];

        array[offset + 4] = te[4];
        array[offset + 5] = te[5];
        array[offset + 6] = te[6];
        array[offset + 7] = te[7];

        array[offset + 8] = te[8];
        array[offset + 9] = te[9];
        array[offset + 10] = te[10];
        array[offset + 11] = te[11];

        array[offset + 12] = te[12];
        array[offset + 13] = te[13];
        array[offset + 14] = te[14];
        array[offset + 15] = te[15];

        return array;

    }

}



const _v1 = /*@__PURE__*/  Vector3.default();
const _m1 = /*@__PURE__*/  Matrix4.default();
const _zero = /*@__PURE__*/  Vector3.create( 0, 0, 0 );
const _one = /*@__PURE__*/  Vector3.create( 1, 1, 1 );
const _x = /*@__PURE__*/  Vector3.default();
const _y = /*@__PURE__*/  Vector3.default();
const _z = /*@__PURE__*/  Vector3.default();

declare global{
    interface Number{
        isVector3: boolean;
    }
}