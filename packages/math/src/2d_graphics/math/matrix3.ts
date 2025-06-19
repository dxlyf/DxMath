import { Vector2Like } from "./vector2";

type Matrix3Like = number[]|Float32Array;

function identity(out:Matrix3Like){
    out[0] = 1; out[3] = 0; out[6] = 0;
    out[1] = 0; out[4] = 1; out[7] = 0;
    out[2] = 0; out[5] = 0; out[8] = 1;
    return out;
}
// 行主序
function multiply(out:Matrix3Like,a:Matrix3Like,b:Matrix3Like){
    const a00 = a[0], a01 = a[3], a02 = a[6];
    const a10 = a[1], a11 = a[4], a12 = a[7];
    const a20 = a[2], a21 = a[5], a22 = a[8];
    const b00 = b[0], b01 = b[3], b02 = b[6];
    const b10 = b[1], b11 = b[4], b12 = b[7];
    const b20 = b[2], b21 = b[5], b22 = b[8];
    out[0] = a00 * b00 + a01 * b10 + a02 * b20;
    out[3] = a00 * b01 + a01 * b11 + a02 * b21;
    out[6] = a00 * b02 + a01 * b12 + a02 * b22;
    out[1] = a10 * b00 + a11 * b10 + a12 * b20;
    out[4] = a10 * b01 + a11 * b11 + a12 * b21;
    out[7] = a10 * b02 + a11 * b12 + a12 * b22;
    out[2] = a20 * b00 + a21 * b10 + a22 * b20;
    out[5] = a20 * b01 + a21 * b11 + a22 * b21;
    out[8] = a20 * b02 + a21 * b12 + a22 * b22;
    return out
}
function translate(out:Matrix3Like,a:Matrix3Like,vec:Matrix3Like){
    const x = vec[0], y = vec[1];
    out[0] = a[0]; out[3] = a[3]; out[6] = a[6];
    out[1] = a[1]; out[4] = a[4]; out[7] = a[7];
    out[2] = a[2]; out[5] = a[5]; out[8] = a[8];
    out[6] = a[0] * x + a[3] * y + a[6];
    out[7] = a[1] * x + a[4] * y + a[7];
    out[8] = a[2] * x + a[5] * y + a[8];
    return out; 
}
function rotate(out:Matrix3Like,a:Matrix3Like,rad:number){
    const s = Math.sin(rad);
    const c = Math.cos(rad);
    out[0] = a[0] * c + a[3] * s;
    out[3] = a[3] * c - a[0] * s;
    out[6] = a[6];
    out[1] = a[1] * c + a[4] * s;
    out[4] = a[4] * c - a[1] * s;
    out[7] = a[7];
    out[2] = a[2] * c + a[5] * s;
    out[5] = a[5] * c - a[2] * s;
    out[8] = a[8];
    return out 
}
function scale(out:Matrix3Like,a:Matrix3Like,vec:Matrix3Like){
    const x = vec[0], y = vec[1];
    out[0] = a[0] * x; out[3] = a[3] * x; out[6] = a[6] * x;
    out[1] = a[1] * y; out[4] = a[4] * y; out[7] = a[7] * y;
    out[2] = a[2]; out[5] = a[5]; out[8] = a[8];
    return out 
}
function makeTranslation(out:Matrix3Like,vec:Vector2Like){
    out[0] = 1; out[3] = 0; out[6] = 0;
    out[1] = 0; out[4] = 1; out[7] = 0;
    out[2] = 0; out[5] = 0; out[8] = 1;
    out[6] = vec[0]; out[7] = vec[1]; out[8] = 1;
    return out 
}
function makeRotation(out:Matrix3Like,rad:number){
    const s = Math.sin(rad);
    const c = Math.cos(rad);
    out[0] = c; out[3] = -s; out[6] = 0;
    out[1] = s; out[4] = c; out[7] = 0;
    out[2] = 0; out[5] = 0; out[8] = 1;
    return out 
}
function makeScale(out:Matrix3Like,vec:Vector2Like){
    out[0] = vec[0]; out[3] = 0; out[6] = 0;
    out[1] = 0; out[4] = vec[1]; out[7] = 0; 
    out[2] = 0; out[5] = 0; out[8] = 1;
    return out
}
function makeSkew(out:Matrix3Like,k:Vector2Like){
    out[0] = 1; out[3] = Math.tan(k[0]); out[6] = 0;
    out[1] = Math.trunc(k[1]); out[4] = 1; out[7] = 0;
    out[2] = 0; out[5] = 0; out[8] = 1;
    return out
}
function makeProjection(out:Matrix3Like,width:number,height:number){
    out[0] = 2 / width; out[3] = 0; out[6] = 0;
    out[1] = 0; out[4] = -2 / height; out[7] = 0;
    out[2] = -1; out[5] = 1; out[8] = 1;
    return out 
}
function makeTranslationRotationScale(out:Matrix3Like,translation:Vector2Like,rotation:number,scale:Vector2Like){
    const s = Math.sin(rotation);
    const c = Math.cos(rotation);
    out[0] = scale[0] * c; out[3] = scale[0] * -s; out[6] = 0;
    out[1] = scale[1] * s; out[4] = scale[1] * c; out[7] = 0;
    out[2] = translation[0]; out[5] = translation[1]; out[8] = 1;
    return out 
}
function makeTranslationRotationScaleOrigin(out:Matrix3Like,translation:Vector2Like,rotation:number,scale:Vector2Like,origin:Vector2Like){
    const s = Math.sin(rotation);
    const c = Math.cos(rotation);
    out[0] = scale[0] * c; out[3] = scale[0] * -s; out[6] = 0;
    out[1] = scale[1] * s; out[4] = scale[1] * c; out[7] = 0;
    out[2] = translation[0] - origin[0] * scale[0] * c - origin[1] * scale[1] * s;
    out[5] = translation[1] - origin[0] * scale[0] * s + origin[1] * scale[1] * c;
    out[8] = 1;
    return out 
}
function extractTranslation(out:Vector2Like,a:Matrix3Like){
    out[0] = a[6]; out[1] = a[7];
    return out;
}
function extractRotation(a:Matrix3Like){
    return Math.atan2(a[3], a[0]); 
}
function extractScale(out:Vector2Like,a:Matrix3Like){
    out[0] = Math.sqrt(a[0] * a[0] + a[3] * a[3]);
    out[1] = Math.sqrt(a[1] * a[1] + a[4] * a[4]);
    return out; 
}
/** 
 * 矩阵分解
 * @param out 输出矩阵
 * @param a 输入矩阵
 * @returns 矩阵的行列式
*/
function decompose(out:Matrix3Like,a:Matrix3Like){
    const a00 = a[0], a01 = a[3], a02 = a[6];
    const a10 = a[1], a11 = a[4], a12 = a[7];
    const a20 = a[2], a21 = a[5], a22 = a[8];
    let b00 = a00, b01 = a01, b02 = a02;
    let b10 = a10, b11 = a11, b12 = a12;
    let b20 = a20, b21 = a21, b22 = a22;
    let det = 0;
    let s = 0;
    let tmp = 0;
    if(Math.abs(b00) >= Math.abs(b10) && Math.abs(b00) >= Math.abs(b20)){
        s = 1.0 / b00;
        b00 *= s; b01 *= s; b02 *= s;
        b10 *= s; b11 *= s; b12 *= s;
        b20 *= s; b21 *= s; b22 *= s;
        det = b00;
        b00 = 1;
        b10 -= b01; b11 -= b01; b12 -= b01;
        b20 -= b02; b21 -= b02; b22 -= b02;

    } 
    else if(Math.abs(b10) >= Math.abs(b00) && Math.abs(b10) >= Math.abs(b20)){
        s = 1.0 / b10;
        b00 *= s; b01 *= s; b02 *= s;
        b10 *= s; b11 *= s; b12 *= s;
        b20 *= s; b21 *= s; b22 *= s;
        det = -b10;
        b10 = 0;
        b01 -= b11; b02 -= b12;
        b21 -= b12; b22 -= b12;

    }
    else{
        s = 1.0 / b20;
        b00 *= s; b01 *= s; b02 *= s;
        b10 *= s; b11 *= s; b12 *= s
        b20 *= s; b21 *= s; b22 *= s;
        det = b20;
        b20 = 0;
        b02 -= b21; b01 -= b21;
        b12 -= b21; b11 -= b21;

    }
    out[0] = b00; out[3] = b01; out[6] = b02;
    out[1] = b10; out[4] = b11; out[7] = b12;
    out[2] = b20; out[5] = b21; out[8] = b22

    // out.scale[0] = Math.sqrt(b00 * b00 + b01 * b01);
    // out.scale[1] = Math.sqrt(b10 * b10 + b11 * b11);
    // out.rotation = Math.atan2(b10, b00);
    // out.translate[0] = b02;
    // out.translate[1] = b12;
    return det;
}
function adjugate(out:Matrix3Like,a:Matrix3Like){
    const a00 = a[0], a01 = a[3], a02 = a[6];
    const a10 = a[1], a11 = a[4], a12 = a[7];
    const a20 = a[2], a21 = a[5], a22 = a[8];
    out[0] = a11 * a22 - a12 * a21;
    out[3] = -a10 * a22 + a12 * a20;
    out[6] = a10 * a21 - a11 * a20;
    out[1] = -a01 * a22 + a02 * a21;
    out[4] = a00 * a22 - a02 * a20;
    out[7] = -a00 * a21 + a01 * a20;
    out[2] = a01 * a12 - a02 * a11;
    out[5] = -a00 * a12 + a02 * a10;
    out[8] = a00 * a11 - a01 * a10;
    return out 
}
function determinant(a:Matrix3Like){
    const a00 = a[0], a01 = a[3], a02 = a[6];
    const a10 = a[1], a11 = a[4], a12 = a[7];
    const a20 = a[2], a21 = a[5], a22 = a[8];
    return a00 * (a11 * a22 - a21 * a12) - a01 * (a10 * a22 - a12 * a20) + a02 * (a10 * a21 - a11 * a20); 
}
function invert(out:Matrix3Like,a:Matrix3Like){
    const a00 = a[0], a01 = a[3], a02 = a[6];
    const a10 = a[1], a11 = a[4], a12 = a[7];
    const a20 = a[2], a21 = a[5], a22 = a[8];
    const b01 = a22 * a11 - a12 * a21;
    const b11 = -a22 * a10 + a12 * a20;
    const b21 = a21 * a10 - a11 * a20; 
    let det = a00 * b01 + a01 * b11 + a02 * b21;
    if(!det){
        return null;
    }
    det = 1.0 / det;
    out[0] = b01 * det; out[1] = (-a22 * a01 + a02 * a21) * det; out[2] = (a12 * a01 - a02 * a11) * det;
    out[3] = b11 * det; out[4] = (a22 * a00 - a02 * a20) * det; out[5] = (-a12 * a00 + a02 * a10) * det;
    out[6] = b21 * det; out[7] = (-a21 * a00 + a01 * a20) * det; out[8] = (a11 * a00 - a01 * a10) * det;
    return out;
}
function transpose(out:Matrix3Like,a:Matrix3Like){
    const a00 = a[0], a01 = a[3], a02 = a[6];
    const a10 = a[1], a11 = a[4], a12 = a[7];
    const a20 = a[2], a21 = a[5], a22 = a[8];
    out[0] = a00; out[1] = a10; out[2] = a20;
    out[3] = a01; out[4] = a11; out[5] = a21;
    out[6] = a02; out[7] = a12; out[8] = a22; 
}
function hasTranslation(a:Matrix3Like){
    return a[6] !== 0 || a[7] !== 0 || a[8] !== 1;
}
function hasRotation(a:Matrix3Like){
    return a[0]!== 1 || a[3]!== 0 || a[6]!== 0 || a[1]!== 0 || a[4]!== 1 || a[7]!== 0 || a[2]!== 0 || a[5]!== 0 || a[8]!== 1;    
}
function hasScale(a:Matrix3Like){
    return a[0]!== 1 || a[3]!== 0 || a[6]!== 0 || a[1]!== 0 || a[4]!== 1 || a[7]!== 0 || a[2]!== 0 || a[5]!== 0 || a[8]!== 1;    
}
function hasIdentity(a:Matrix3Like){
    return a[0]!== 1 || a[3]!== 0 || a[6]!== 0 || a[1]!== 0 || a[4]!== 1 || a[7]!== 0 || a[2]!== 0 || a[5]!== 0 || a[8]!== 1; 
}
function fromValues(out:Matrix3Like,m00:number,m01:number,m02:number,m10:number,m11:number,m12:number,m20:number,m21:number,m22:number){
    out[0] = m00; out[3] = m01; out[6] = m02;
    out[1] = m10; out[4] = m11; out[7] = m12;
    out[2] = m20; out[5] = m21; out[8] = m22;
    return out
}
function mapPoint(out: Vector2Like, a:Matrix3Like, v: Vector2Like) {
    out[0] = a[0] * v[0] + a[3] * v[1] + a[6];
    out[1] = a[1] * v[0] + a[4] * v[1] + a[7];
    return out;
}
function mapPoints(out: Vector2Like[], a: Matrix3Like, v: Vector2Like[]) {
    for (let i = 0; i < v.length; i += 2) {
        mapPoint(out[i], a, v[i]);
    }
    return out;
}

export class Matrix3 extends Float32Array{
    static identity=identity
    static multiply=multiply
    static invert=invert
    static makeTranslation=makeTranslation
    static makeRotation=makeRotation
    static makeScale=makeScale
    static makeTranslationRotationScale=makeTranslationRotationScale
    static makeTranslationRotationScaleOrigin=makeTranslationRotationScaleOrigin
    static extractTranslation=extractTranslation
    static extractRotation=extractRotation
    static extractScale=extractScale
    //static extractOrigin=extractOrigin
    static decompose=decompose
    static adjugate=adjugate
    static determinant=determinant
    static transpose=transpose
    static fromValues=fromValues
    static makeSkew=makeSkew
    static mapPoint=mapPoint
    static mapPoints=mapPoints

    constructor(){
        super(9);
        identity(this); 
    }
    identity(){
       return identity(this);
    }
    multiply(a:Matrix3Like,b:Matrix3Like){
        return multiply(this,a,b); 
    }
    translate(vec:Matrix3Like){
        return translate(this,this,vec); 
    }
    rotate(rad:number){
        return rotate(this,this,rad); 
    }
    scale(vec:Matrix3Like){
        return scale(this,this,vec);
    }
    makeTranslation(vec:Vector2Like){
        return makeTranslation(this,vec);
     }
     makeRotation(rad:number){
        return makeRotation(this,rad); 
     }
     makeScale(vec:Vector2Like){
        return makeScale(this,vec); 
     }
     makeSkew(k:Vector2Like){
        return makeSkew(this,k); 
     }
     adjugate(){
        return adjugate(this,this); 
     }
     determinant(){
        return determinant(this); 
     }
     invert(){
        return invert(this,this);
     }
     transpose(){
        return transpose(this,this);
    }
    hasTranslation(){
        return hasTranslation(this); 
    }
    hasRotation(){
        return hasRotation(this); 
    }
    hasScale(){
        return hasScale(this); 
    }
    hasIdentity(){
        return hasIdentity(this);
    }
    mapPoint(v: Vector2Like,out=v) {
        return  mapPoint(out, this, v);
    }
    mapPoints(v: Vector2Like[],out=v) {
        return  mapPoints(out, this, v);
    }
}