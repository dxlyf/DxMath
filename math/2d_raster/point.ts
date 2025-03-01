
import type { Transform } from "./transform"

const isUnDef=(v:any)=>{
    return typeof v==='undefined'
}
export class Point{

    static zero(){
        return new this([0,0])
    }
    static default(){
        return new this([0,0])
    }
    static create(x:number=0,y:number=0):Point{
        return new this([x,y])
    }
    static from_xy(x:number,y:number):Point{
        return this.create(x,y)
    }
    static pools:Point[]=[]
    static maxPoolSize:number=100
    static batchPools:Point[]=[]
    static startPoolCreated:boolean=false;
    static beginPools(){
        this.startPoolCreated=true
    }
    static endPools(){
        if(this.startPoolCreated){
            this.startPoolCreated=false
            this.batchPools.forEach(p=>{
                this.release(p)
            })
            this.batchPools.length=0

        }
    }
    static pool(x:number=0,y:number=0):Point{
        if(this.pools.length>0){
            let p = this.pools.pop()!
            p.elements[0]=x;
            p.elements[1]=y;
            if(this.startPoolCreated){
                this.batchPools.push(p)
            }
            return p
        }
        return new this([x,y])
    }
    static release(p:Point){
        if(this.pools.length<this.maxPoolSize){
            this.pools.push(p)
        }
    }
    mutable:boolean=true
    elements:Float32Array=new Float32Array(2)
    constructor(elements:number[]=[]){
        this.elements.set(elements)
    }
    get x(){ return this.elements[0]}
    get y(){ return this.elements[1]}
    set x(x){ this.elements[0] = x}
    set y(y){ this.elements[1] = y}


    set(x:number,y:number){
        if(this.mutable&&this.x!==x||this.y!==y){
            this.x = x
            this.y = y
            return this
        }else if(!this.mutable){
            return (this.constructor as typeof Point).create(x,y)
        }
        return this
    }
    setElements(values:number[]){
        if(this.mutable&&this.elements.some((v,i)=>v!==values[i])){
            this.elements.set(values)
            return this
        }else if(!this.mutable){
            return new Point(values)
        }
        return this
    }
    isFinite(){
        return this.elements.every(v=>Number.isFinite(v))
    }
    isZero(){
        return this.elements.every(v=>v===0)
    }
    
    copy(source:Point){
        return this.set(source.x,source.y)
    }
    clone(){
        return Point.default().copy(this)
    }
    addVectors(a:Point,b:Point){
        return this.set(a.x+b.x,a.y+b.y)
    }
    add(v:Point){
        return this.addVectors(this,v)
    }
    subVectors(a:Point,b:Point){
        return this.set(a.x-b.x,a.y-b.y)
    }
    sub(v:Point){
        return this.subVectors(this,v)
    }
    multiplyScalarVector(a:Point,s:number){
        return this.set(a.x*s,a.y*s)
    }
    multiplyScalar(s:number){
        return this.multiplyScalarVector(this,s)
    }
    multiplyVectors(a:Point,b:Point){
        return this.set(a.x*b.x,a.y*b.y)
    }
    multiply(v:Point){
        return this.multiplyVectors(this,v)
    }
    divideVectors(a:Point,b:Point){
        return this.set(a.x/b.x,a.y/b.y)
    }
    divide(v:Point){
        return this.divideVectors(this,v)
    }
    dot(v:Point){
        return this.x*v.x+this.y*v.y
    }
    crossVectors(a:Point,b:Point){
        return a.x*b.y-a.y*b.x
    }
    cross(v:Point){
        return this.crossVectors(this,v)
    }
    squaredLength(){
        return this.x*this.x+this.y*this.y
    }
    length(){
        return Math.sqrt(this.squaredLength())
    }
    distanceTo(v:Point){
        return Math.sqrt(this.squaredDistanceTo(v))
    }
    distance(v:Point){
        return this.distanceTo(v)
    }
    squaredDistanceTo(v:Point){
        const dx = this.x-v.x
        const dy = this.y-v.y
        return dx*dx+dy*dy
    }
    angleTo(v:Point){
        return Math.atan2(this.cross(v),this.dot(v))
    }
    cos(v:Point){
        //this.normalize().dot(v.normalize())
        return this.dot(v)/(this.length()*v.length())
    }
    acos(v:Point){
        return Math.acos(this.cos(v))
    }
    midPoint(v:Point){
        return this.set((this.x+v.x)/2,(this.y+v.y)/2)
    }
    angle(){
        return Math.atan2(this.y, this.x)
    }
    perp(){
        return this.set(-this.y,this.x)
    }
    projectLengthDir(dir:Point){
        return this.dot(dir)
    }
    projectLength(v:Point){
        // cos=this.normalize().dot(v.normalize())
        // k=cos*this.length()
        return this.dot(v)/v.length()
    }
    projectRatio(v:Point){
        return this.dot(v)/v.dot(v)
    }
    projectDir(v:Point){
        const k=this.projectLengthDir(v)
        return this.multiplyScalarVector(v,k)
    }
    project(v:Point){
        const k=this.projectLength(v)
        return this.multiplyScalarVector(this.copy(v).normalize(),k)
    }
    reflectVectors(a:Point,dir:Point){
        let k=a.dot(dir)
        let r=this.subVectors(a,Point.pool().copy(dir).multiplyScalar(k*2).release())
        return r;
    }
    reflect(dir:Point){
        return this.reflectVectors(this,dir)
    }
    /**
     * 折射（Refraction）是光线从一种介质进入另一种介质时发生的方向改变现象。折射的方向可以通过 斯涅尔定律（Snell's Law） 来计算
     * @param incident 入射向量  
     * @param normal 法向量
     * @param eta1 入射介质的折射率
     * @param eta2 折射介质的折射率
     * @returns 
     */
    refractVectors(incident: Point, normal: Point, eta1: number, eta2: number): Vector | null {
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
    fresnel(incident: Point, normal: Point, eta1: number, eta2: number): number {
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
    inversePerp(){
        return this.set(this.y,-this.x)
    }
    interpolateVectors(start:Point,end:Point,t:number){
        return this.set(start.x*(end.x-start.x)*t,start.y*(end.y-start.y)*t)
    }
    smoothStep(start:Point,end:Point,t:number){
        return this.interpolateVectors(start,end,t*t*(3-2*t))
    }
    interpolate(to:Point,t:number){
        return this.interpolateVectors(this,to,t)
    }
    mix(a:Point,b:Point,t:number){
        return this.set(a.x*(1-t)+b.x*t,a.y*(1-t)+b.y*t)
    }
    swap(){
        return this.set(this.y,this.x)
    }
    negate(){
        return this.set(-this.x,-this.y)
    }
    sign(){
        return this.set(Math.sign(this.x),Math.sign(this.y))
    }
    abs(){
        return this.set(Math.abs(this.x), Math.abs(this.y))
    }
    floor(){
        return this.set(Math.floor(this.x), Math.floor(this.y))
    }
    round(){
        return this.set(Math.round(this.x), Math.round(this.y))
    }
    ceil(){
        return this.set(Math.ceil(this.x), Math.ceil(this.y))
    }
    random(min:Point,max:Point){
        return this.set(Math.random()*(max.x-min.x)+min.x,
                       Math.random()*(max.y-min.y)+min.y)
    }
    bounds(min:Point,max:Point){
        return this.set(Math.max(min.x, Math.min(this.x, max.x)),
                       Math.max(min.y, Math.min(this.y, max.y)))
    }
    min(v:Point){
        return this.set(Math.min(this.x, v.x), Math.min(this.y, v.y))
    }
    max(v:Point){
        return this.set(Math.max(this.x, v.x), Math.max(this.y, v.y))
    }
    trunc(){
        return this.set(Math.trunc(this.x), Math.trunc(this.y))
    }
    clamp(min:Point,max:Point){
        return this.set(Math.max(min.x, Math.min(this.x, max.x)),
                       Math.max(min.y, Math.min(this.y, max.y)))
    }
    normalize(){
        return this.multiplyScalar(1/this.length())
    }
    translate(x:number,y:number){
        return this.set(this.x+x,this.y+y)
    }
    scale(x:number,y:number){
        return this.set(this.x*x,this.y*y)
    }
    rotate(angle:number,origin:Point=Point.create(0,0)){
        const cos=Math.cos(angle)
        const sin=Math.sin(angle)
        const dx=this.x-origin.x
        const dy=this.y-origin.y
        const x=dx*cos-dy*sin+origin.x
        const y=dx*sin+dy*cos+origin.y
        return this.set(x,y)
    }
    setLength(length:number):boolean{
       return this.setLengthFrom(this.x,this.y,length)
    }
    setLengthFrom(x:number,y:number,length:number):boolean{
        return this.setPointLength(this,x,y,length)
    }
    setPointLength(pt:Point,x:number,y:number,length:number,orig_length?:Num):boolean{
        let xx = x as f64;
        let yy = y as f64;
        let dmag = Math.sqrt(xx * xx + yy * yy);
        let dscale = length as f64 / dmag;
        x *= dscale as f32;
        y *= dscale as f32;
    
        // check if we're not finite, or we're zero-length
        if (!Number.isFinite(x) || !Number.isFinite(y) || (x == 0.0 && y == 0.0)) {
            pt.set(0,0)
            return false;
        }
    
        let  mag = 0.0;
        if(!isUnDef(orig_length)) {
            mag = dmag as f32;
        }
    
        //*pt = Point::from_xy(x, y);
        pt.set(x,y)
        if(!isUnDef(orig_length)) {
            orig_length!.value=mag
        }
    
        return true
    }
    applyMatrix(m:number[]){
        return this.set(m[0]*this.x+m[2]*this.y+m[4],
                       m[1]*this.x+m[3]*this.y+m[5])
    }
    applyTransform(m:Transform){
        return this.set(m.sx*this.x+m.kx*this.y+m.tx,
                       m.ky*this.x+m.sy*this.y+m.ty)
    }
    setNormalize(x:number,y:number){
        return this.setLengthFrom(x,y,1.0)
    }
    canNormalize(){
        return this.isFinite()&&(this.x!==0||this.y!==0)
    }
    swapCoords(){
        return this.set(this.y,this.x)
    }
    rotateCW(){
        // this.swapCoords()
        // this.x=-this.x
        return this.set(this.y,-this.x);
    }
    rotateCCW(){
        // this.swapCoords()
        // this.y=-this.y;
        // return this;
        return this.set(-this.y,this.x);
    }
    almostEqual(other:Point){
        return !(this.clone().sub(other).canNormalize())
    }
    equals(v:Point){
        return this.x===v.x&&this.y===v.y
    }
    equalsEpsilon(v:Point,epsilon=1e-6){
        return Math.abs(this.x-v.x)<epsilon&&Math.abs(this.y-v.y)<epsilon
    }
    release(){
        (this.constructor as typeof Point).release(this)
        return this
    }
}