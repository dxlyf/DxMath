
import { Vector2 } from "./vec2"

 const SCALAR_NEARLY_ZERO = 1.0 / (1 << 12);

function mul_add_mul(a: number, b: number, c: number, d: number):number {
    // return (BigInt(a)*BigInt(b)+BigInt(c)*BigInt(d)).toString()
    return a*b+c*d
}
 const concat=(a:Transform,b:Transform):Transform=>{
    if(a.is_identity()){
        return b
    }else if(b.is_identity()){
        return a
    }else if(!a.has_skew()&&!b.has_skew()){
       return Transform.from_row(
            a.sx * b.sx,
            0.0,
            0.0,
            a.sy * b.sy,
            a.sx * b.tx + a.tx,
            a.sy * b.ty + a.ty,
        )
    }else{
        return Transform.from_row(
            mul_add_mul(a.sx, b.sx, a.kx, b.ky),
            mul_add_mul(a.ky, b.sx, a.sy, b.ky),
            mul_add_mul(a.sx, b.kx, a.kx, b.sy),
            mul_add_mul(a.ky, b.kx, a.sy, b.sy),
            mul_add_mul(a.sx, b.tx, a.kx, b.ty) + a.tx,
            mul_add_mul(a.ky, b.tx, a.sy, b.ty) + a.ty,
        )
    }
 }
 function compute_inv(ts: Transform, inv_det: number):Transform {
    return Transform.from_row(
        (ts.sy as number * inv_det) as number,
        (-ts.ky as number * inv_det) as number,
        (-ts.kx as number * inv_det) as number,
        (ts.sx as number * inv_det) as number,
        dcross_dscale(ts.kx, ts.ty, ts.sy, ts.tx, inv_det),
        dcross_dscale(ts.ky, ts.tx, ts.sx, ts.ty, inv_det),
    )
}
function dcross(a: number, b: number, c: number, d: number):number {
    return a * b - c * d
}
function dcross_dscale(a: number, b: number, c: number, d: number, scale: number):number {
    return (dcross(a as number, b as number, c as number, d as number) * scale) as number
}
 const inv_determinant=(ts:Transform):number|undefined=>{
    let det:number=dcross(ts.sx, ts.sy, ts.kx, ts.ky) 
    let tolerance=  SCALAR_NEARLY_ZERO * SCALAR_NEARLY_ZERO * SCALAR_NEARLY_ZERO;
    if(Math.abs(det)<=tolerance){
        return undefined
    }else{
        return 1/det
    }

 }
 const invert=(ts:Transform):Transform|undefined=>{
    if(ts.is_scale_translate()){
        if(ts.has_scale()){
            let inv_x=1/ts.sx
            let inv_y=1/ts.sy
            return Transform.from_row(inv_x,0,0,inv_y,-ts.tx*inv_x,-ts.ty*inv_y)
        }else{
            return Transform.from_translate(-ts.tx,-ts.ty)
        }
    }else{
        let inv_det=inv_determinant(ts)
        if(inv_det===undefined){
            return undefined
        }
        let inv_ts=compute_inv(ts,inv_det)
        if(inv_ts.is_finite()){
            return inv_ts
        }

    }
 }

export class Transform{
    static identity(){
        return new this([1,0,0,1,0,0])
    }
    static default(){
        return this.identity()
    }
    static from_row(a:number,b:number,c:number,d:number,tx:number,ty:number):Transform{
        return new this([a,b,c,d,tx,ty])
    }
    static from_translate(tx:number,ty:number):Transform{
        return this.from_row(1,0,0,1,tx,ty)
    }
    static from_scale(sx:number,sy:number):Transform{
        return this.from_row(sx,0,0,sy,0,0)
    }
    static from_skew(kx:number,ky:number):Transform{
        return this.from_row(1,ky,kx,1,0,0)
    }
    static from_rotate(angle:number):Transform{
        let radian=angle*Math.PI/180
        let c=Math.cos(radian)
        let s=Math.sin(radian)
        return  this.from_row(c,s,-s,c,0,0)
    }
   static from_rotate_at(angle:number,tx:number,ty:number):Transform{
        let ts=this.default()
        ts=ts.pre_translate(tx,ty)
        ts=ts.pre_concat(Transform.from_rotate(angle))
        ts=ts.pre_translate(-tx,-ty)
        return ts
    }
    static from_sin_cos(sin:number,cos:number):Transform{
        return this.from_row(cos,sin,-sin,cos,0,0)

    }
    static from_bbox(bbox:any){
        return Transform.from_row(bbox.width,0,0,bbox.height,bbox.x,bbox.y)
    }

    elements:Float32Array=new Float32Array(6)
    constructor(elements:Float32Array|number[]){
        this.elements.set(elements)
    }
    get sx(){
        return this.elements[0]
    }
    set sx(value:number){
        this.elements[0]=value
    }
    get sy(){
        return this.elements[3]
    }
    set sy(value:number){
        this.elements[3]=value
    }
    get kx(){
        return this.elements[2]
    }
    set kx(value:number){
        this.elements[2]=value
    }
    get ky(){
        return this.elements[1]
    }
    set ky(value:number){
        this.elements[1]=value
    }
    get tx(){
        return this.elements[4]
    }
    set tx(value:number){
        this.elements[4]=value
    }
    get ty(){
        return this.elements[5]
    }
    set ty(value:number){
        this.elements[5]=value
    }
    copy(source:Transform){
        this.elements.set(source.elements)
        return this

    }
    clone(){
        return new Transform(this.elements)
    }
    is_finite(){
        return this.elements.every(v=>Number.isFinite(v))
    }
    is_valid(){
        if(this.is_finite()){
            const scale=this.get_scale()
            let sx=scale.x
            let sy=scale.y
            return !(Math.abs(sx)<=1e-6||Math.abs(sy)<=1e-6)
        }else{
            return false
        }
    }
    is_identity(){
        return this.elements[0]==1&&this.elements[1]==0&&this.elements[2]==0&&this.elements[3]==1&&this.elements[4]==0&&this.elements[5]==0
    }
    is_scale(){
        return this.has_scale()&&!this.has_skew()&&!this.has_translate()
    }
    is_skew(){  
        return !this.has_scale()&&this.has_skew()&&!this.has_translate()
    }
    is_translate(){  
        return !this.has_scale()&&!this.has_skew()&&this.has_translate()
    }
    is_scale_translate(){  
        return (this.has_scale()||this.has_translate())&&!this.has_skew()
    }
    
    has_scale(){
        return this.sx!=1||this.sy!=1
    }
    has_skew(){
        return this.kx!=0||this.ky!=0
    }
    has_translate(){
        return this.tx!=0||this.ty!=0
    }
    get_scale(){
        let self=this;
        let x_scale = Math.sqrt(self.sx*self.sx + self.kx * self.kx);
        let y_scale = Math.sqrt(self.ky*self.ky + self.sy * self.sy);
        return Vector2.create(x_scale, y_scale)
    }
    pre_scale(sx:number,sy:number){
        return this.pre_concat(Transform.from_scale(sx,sy))
    }
    post_scale(sx:number,sy:number){
        return this.post_concat(Transform.from_scale(sx,sy))
    }
    pre_translate(tx:number,ty:number){
        return this.pre_concat(Transform.from_translate(tx,ty))
    }
    post_translate(tx:number,ty:number){
        return this.post_concat(Transform.from_translate(tx,ty))
    }
    pre_rotate(angle:number){
        return this.pre_concat(Transform.from_rotate(angle))
    }
    post_rotate(angle:number){
        return this.post_concat(Transform.from_rotate(angle))
    }
    pre_rotate_at(angle:number,x:number,y:number){
        return this.pre_concat(Transform.from_rotate_at(angle,x,y))
    }
    post_rotate_at(angle:number,x:number,y:number){
        return this.post_concat(Transform.from_rotate_at(angle,x,y))
    }
    
    pre_concat(other:Transform){
        return concat(this,other)
    }
    post_concat(other:Transform){
        return concat(other,this)
    }
    map_point(point:Vector2){
        if(this.is_identity()){

        }else if(this.is_translate()){
            point.translate(this.tx,this.ty)
        }else if(this.is_scale_translate()){
            point.set(point.x*this.sx+this.tx,point.y*this.sy+this.ty)
        }else{
            let x=this.sx*point.x+this.kx*point.y+this.tx
            let y=this.ky*point.x+this.sy*point.y+this.ty
            point.set(x,y)
        }
    }
    map_points(outPoints:Vector2[],srcPoints:Vector2[]){
        if(srcPoints.length<=0){
            return
        }
        if(this.is_identity()){
            return
        }else if(this.is_translate()){
            srcPoints.forEach((p,i)=>{
                outPoints[i].copy(p).translate(this.tx,this.ty)
            })
        }else if(this.is_scale_translate()){
            srcPoints.forEach((p,i)=>{
                outPoints[i].set(p.x*this.sx+this.tx,p.y*this.sy+this.ty)
            })
          
        }else{
            srcPoints.forEach((point,i)=>{
                let x=this.sx*point.x+this.kx*point.y+this.tx
                let y=this.ky*point.x+this.sy*point.y+this.ty
                outPoints[i].set(x,y)
            })
        }
    }
    invert(){
        if(this.is_identity()){
            return this
        }
        return  invert(this);
    }
}