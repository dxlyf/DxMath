import { Color } from "./color"
import { Euler } from "./euler"
import { Matrix3 } from "./mat3"
import { Matrix4 } from "./mat4"

export class Vector3 {
    static makeZeroArray(n:number){
        return Array.from({length:n},()=>this.zero())
    }
    static splat(x:number){
        return this.create(x,x,x)
    }
    static zero(){
        return this.create(0,0,0)
    }
    static default(){
        return this.create(0,0,0)
    }
    static create(x:number=0,y:number=0,z:number=0){
        return new this([x,y,z])
    }
    static fromArray(elements:number[]|Float32Array){
        return new this(elements)
    }
    static fromXYZ(x:number,y:number,z:number){
        return this.create(x,y,z)
    }
    static pools:Vector3[]=[]
    static maxPoolSize:number=100
    static batchPools:Vector3[]=[]
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
    static pool(x:number=0,y:number=0,z:number=0):Vector3{
        if(this.pools.length>0){
            let p = this.pools.pop()!
            p.elements[0]=x;
            p.elements[1]=y;
            p.elements[2]=z;
            if(this.startPoolCreated){
                this.batchPools.push(p)
            }
            return p
        }
        return new this([x,y])
    }
    static release(p:Vector3){
        if(this.pools.length<this.maxPoolSize){
            this.pools.push(p)
        }
    }
    isVector3:boolean=true
    mutable:boolean=true
    elements:Float32Array=new Float32Array(3)
    changeCallback?:(self:Vector3)=>void=()=>{}
    changeCallbackPadding:boolean=false
    constructor(elements:number[]|Float32Array=[0,0,0]){
        this.elements.set(elements)
    }
    onChange(callback:(self:Vector3)=>void){
        this.changeCallback=callback
    }
    change(){
        if(this.changeCallbackPadding){
            return
        }
        this.changeCallbackPadding=true;
        this.changeCallback?.(this)
        this.changeCallbackPadding=false
    }
    get x(){ 
        return this.elements[0]
    }
    set x(v:number){ 
        if(this.elements[0]!==v){
            this.elements[0]=v;
            this.change()
        }
    }
    get y(){ 
        return this.elements[1]
    }
    set y(v:number){ 
        if(this.elements[1]!==v){
            this.elements[1]=v;
            this.change()
        }
    }
    
    get z(){ 
        return this.elements[2]
    }
    set z(v:number){ 
        if(this.elements[2]!==v){
            this.elements[2]=v;
            this.change()
        }
    }
    set(x:number,y:number,z:number,silent:boolean=false){
        if(this.mutable&&this.x!==x||this.y!==y||this.z!==z){
            this.x = x
            this.y = y
            this.z = z
            !silent&&this.change()
            return this
        }else if(!this.mutable){
            return (this.constructor as typeof Vector3).create(x,y,z)
        }
        return this
    }
    setElements(values:number[]|Float32Array,silent:boolean=false){
        if(this.mutable&&this.elements.some((v,i)=>v!==values[i])){
            this.elements.set(values)
            !silent&&this.change()
            return this
        }else if(!this.mutable){
            return Vector3.fromArray(values)
        }
        return this
    }
    isFinite(){
        return !this.elements.some(v=>!Number.isFinite(v))
    }
    isZero(){
        return !this.elements.some(v=>v!==0)
    }
    isNormalize(){
        return !this.elements.some(v=>v<0||v>1)
    }
    isSafeInteger(){
        return !this.elements.some(v=>!Number.isSafeInteger(v))
    }
    copy(source:Vector3){
        return this.setElements(source.elements)
    }
    clone(){
        return Vector3.fromArray(this.elements)
    }
    addScaledVector(v:Vector3,s:number){
		return this.set(this.x+v.x*s,this.y+v.y*s,this.z+v.z*s);
    }
    addVectors(a:Vector3,b:Vector3){
        return this.set(a.x+b.x,a.y+b.y,a.z+b.z)
    }
    add(v:Vector3){
        return this.addVectors(this,v)
    }
    subVectors(a:Vector3,b:Vector3){
        return this.set(a.x-b.x,a.y-b.y,a.z-b.z)
    }
    sub(v:Vector3){
        return this.subVectors(this,v)
    }
    multiplyScalarVector(a:Vector3,s:number){
        return this.set(a.x*s,a.y*s,a.z*s)
    }
    multiplyScalar(s:number){
        return this.multiplyScalarVector(this,s)
    }
    multiplyVectors(a:Vector3,b:Vector3){
        return this.set(a.x*b.x,a.y*b.y,a.z*b.z)
    }
    mul(v:Vector3){
        return this.multiply(v)
    }
    multiply(v:Vector3){
        return this.multiplyVectors(this,v)
    }
    divideVectors(a:Vector3,b:Vector3){
        return this.set(a.x/b.x,a.y/b.y,a.z/b.z)
    }
    divide(v:Vector3){
        return this.divideVectors(this,v)
    }
    div(v:Vector3){
        return this.divide(v)
    }
    dotVector(a:Vector3,b:Vector3){
        return a.x*b.x+a.y*b.y+a.z*b.z
    }
    dot(v:Vector3){
        return this.dotVector(this,v)
    }
    crossVectors(a:Vector3,b:Vector3){
        return this.set(
            a.y*b.z-a.z*b.y,
            a.z*b.x-a.x*b.z,
            a.x*b.y-a.y*b.x
        )
    }
    cross(v:Vector3){
        return this.crossVectors(this,v)
    }
    squaredLength(){
        return this.x*this.x+this.y*this.y+this.z*this.z
    }
    // 欧几里得距离 平方和开方

    length(){
        return Math.sqrt(this.squaredLength())
    }
    lengthSq(){
        return this.squaredLength()
    }
    manhattanLength() {
		return Math.abs( this.x) + Math.abs( this.y)+ Math.abs( this.z );
	}
    // 曼哈顿距离 绝对值之和

    manhattanDistanceTo( v:Vector3 ) {
		return Math.abs( this.x - v.x ) + Math.abs( this.y - v.y )+ Math.abs( this.z - v.z );

	}
    // 切比雪夫
    chebyshevLength() {
        return Math.max(Math.abs(this.x), Math.abs(this.y), Math.abs(this.z))
    }
    chebyshevDistanceTo(v:Vector3) {
        return Math.max(Math.abs(this.x - v.x), Math.abs(this.y - v.y), Math.abs(this.z - v.z))
    }
    distanceTo(v:Vector3){
        return Math.sqrt(this.distanceToSquared(v))
    }
    distanceToSquared(v:Vector3){
        const dx = this.x-v.x
        const dy = this.y-v.y
        const dz = this.z-v.z
        return dx*dx+dy*dy+dz*dz
    }
    angleTo(v:Vector3){
      //  return Math.atan2(this.cross(v),this.dot(v))
    }
    cos(v:Vector3){
        //this.normalize().dot(v.normalize())
        return this.dot(v)/(this.length()*v.length())
    }
    acos(v:Vector3){
        return Math.acos(this.cos(v))
    }
    midPoint(v:Vector3){
        return this.set((this.x+v.x)/2,(this.y+v.y)/2,(this.z+v.z)/2)
    }
    angle(){
        return Math.atan2(this.y, this.x)
    }

    projectLengthDir(dir:Vector3){
        return this.dot(dir)
    }
    projectLength(v:Vector3){
        // cos=this.normalize().dot(v.normalize())
        // k=cos*this.length()
        return this.dot(v)/v.length()
    }
    projectRatio(v:Vector3){
        return this.dot(v)/v.dot(v)
    }
    projectDir(v:Vector3){
        const k=this.projectLengthDir(v)
        return this.multiplyScalarVector(v,k)
    }
    project(v:Vector3){
        const k=this.projectLength(v)
        return this.multiplyScalarVector(this.copy(v).normalize(),k)
    }
    reflectVectors(a:Vector3,dir:Vector3){
        let k=a.dot(dir)
        let r=this.subVectors(a,Vector3.pool().copy(dir).multiplyScalar(k*2).release())
        return r;
    }
    reflect(dir:Vector3){
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
    refractVectors(incident: Vector3, normal: Vector3, eta1: number, eta2: number): Vector3 | null {
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
    fresnel(incident: Vector3, normal: Vector3, eta1: number, eta2: number): number {
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
    interpolateVectors(start:Vector3,end:Vector3,t:number){
        return this.set(start.x*(end.x-start.x)*t,start.y*(end.y-start.y)*t,start.z*(end.z-start.z)*t)
    }
    smoothStep(start:Vector3,end:Vector3,t:number){
        return this.interpolateVectors(start,end,t*t*(3-2*t))
    }
    interpolate(to:Vector3,t:number){
        return this.interpolateVectors(this,to,t)
    }
    mix(a:Vector3,b:Vector3,t:number){
        return this.set(a.x*(1-t)+b.x*t,a.y*(1-t)+b.y*t,a.z*(1-t)+b.z*t)
    }

    splat(x:number){
        return this.set(x,x,x)
    }
    inverse(){
        return this.set(1/this.x,1/this.y,1/this.z)
    }
    negate(){
        return this.set(-this.x,-this.y,-this.z)
    }
    sign(){
        return this.set(Math.sign(this.x),Math.sign(this.y),Math.sign(this.z))
    }
    pow(s:Vector3){
        return this.set(Math.pow(this.x,s.x),Math.pow(this.y,s.y),Math.pow(this.z,s.z))
    }
    sqrt(){
        return this.set(Math.sqrt(this.x),Math.sqrt(this.y),Math.sqrt(this.z))
    }
    abs(){
        return this.set(Math.abs(this.x), Math.abs(this.y), Math.abs(this.z))
    }
    floor(){
        return this.set(Math.floor(this.x), Math.floor(this.y), Math.floor(this.z))
    }
    round(){
        return this.set(Math.round(this.x), Math.round(this.y), Math.round(this.z))
    }
    fract(){
        return this.set(this.x-Math.floor(this.x),this.y-Math.floor(this.y),this.z-Math.floor(this.z))
    }
    ceil(){
        return this.set(Math.ceil(this.x), Math.ceil(this.y), Math.ceil(this.z))
    }
    randomVectors(min:Vector3,max:Vector3){
        return this.set(Math.random()*(max.x-min.x)+min.x,
                       Math.random()*(max.y-min.y)+min.y,Math.random()*(max.z-min.y)+min.z)
    }
    random(min:number,max:number){
        return this.set(Math.random()*(max-min)+min,
                       Math.random()*(max-min)+min,Math.random()*(max-min)+min)
    }
    bounds(min:Vector3,max:Vector3){
        return this.set(Math.max(min.x, Math.min(this.x, max.x)),
                       Math.max(min.y, Math.min(this.y, max.y)),Math.max(min.z, Math.min(this.z, max.z)))
    }
    min(v:Vector3){
        return this.set(Math.min(this.x, v.x), Math.min(this.y, v.y), Math.min(this.z, v.z))
    }
    max(v:Vector3){
        return this.set(Math.max(this.x, v.x), Math.max(this.y, v.y), Math.max(this.z, v.z))
    }
    trunc(){
        return this.set(Math.trunc(this.x), Math.trunc(this.y), Math.trunc(this.z))
    }
    clamp(min:Vector3,max:Vector3){
        return this.set(Math.max(min.x, Math.min(this.x, max.x)),
                       Math.max(min.y, Math.min(this.y, max.y)),Math.max(min.z, Math.min(this.z, max.z)))
    }
    normalize(){
        const len=this.length()
        if(len<=0){
            return this.set(0,0,0)
        }
        return this.multiplyScalar(1/this.length())
    }
    translate(x:number,y:number,z:number){
        return this.set(this.x+x,this.y+y,this.z+z)

    }
    rotateAxis(axis:Vector3,angle:number){
        
    }
    rotateX(origin:Vector3,angle:number){
        
        let cos=Math.cos(angle),sin=Math.sin(angle)
        let delta=Vector3.pool().subVectors(this,origin)
        let x=delta.x+origin.x
        let y=delta.y*cos-delta.z*sin+origin.y
        let z=delta.y*sin+delta.z*cos+origin.z
        delta.release()
        return this.set(x,y,z)
    }
    rotateY(origin:Vector3,angle:number){
        let cos=Math.cos(angle),sin=Math.sin(angle)
        let delta=Vector3.pool().subVectors(this,origin)
        let x=cos*delta.x+sin*delta.z+origin.x
        let y=delta.y+origin.y
        let z=cos*delta.z-sin*delta.x+origin.z
        delta.release()
        return this.set(x,y,z)
    }
    rotateZ(origin:Vector3,angle:number){
        let cos=Math.cos(angle),sin=Math.sin(angle)
        let delta=Vector3.pool().subVectors(this,origin)
        let x=cos*delta.x-sin*delta.y+origin.x
        let y=cos*delta.y+sin*delta.x+origin.y
        let z=delta.z+origin.z
        delta.release()
        return this.set(x,y,z)
    }
    scale(x:number,y:number,z:number){
        return this.set(this.x*x,this.y*y,this.z*z)
    }

    setLength(length:number):boolean{
       return this.setLengthFrom(this.x,this.y,this.z,length)
    }
    setLengthFrom(x:number,y:number,z:number,length:number):boolean{
        return this.setPointLength(this,x,y,z,length)
    }
    setPointLength(pt:Vector3,x:number,y:number,z:number,length:number,orig_length?:{value:any}):boolean{
        let xx = x;
        let yy = y;
        let zz=z
        let dmag = Math.sqrt(xx * xx + yy * yy+zz*zz);
        let dscale = length / dmag;
        x *= dscale;
        y *= dscale;
        z *= dscale;
        // check if we're not finite, or we're zero-length
        if (!Number.isFinite(x) || !Number.isFinite(y)|| !Number.isFinite(z) || (x == 0 && y == 0&&z==0)) {
            pt.set(0,0,0)
            return false;
        }
    
        let  mag = 0.0;
        if(orig_length!==undefined) {
            mag = dmag;
        }
    
        //*pt = Point::from_xy(x, y);
        pt.set(x,y,z)
        if(orig_length!==undefined) {
            orig_length!.value=mag
        }
    
        return true
    }
    applyMatrix3(matrix:Matrix3){
        const m=matrix.elements
        const x=m[0]*this.x+m[3]*this.y+m[6]*this.z
        const y=m[1]*this.x+m[4]*this.y+m[7]*this.z
        const z=m[2]*this.x+m[5]*this.y+m[8]*this.z
        return this.set(x,y,z)
    }
    applyMatrix4(matrix:Matrix4){
        const m=matrix.elements
        const x=m[0]*this.x+m[4]*this.y+m[8]*this.z+m[12]
        const y=m[1]*this.x+m[5]*this.y+m[9]*this.z+m[13]
        const z=m[2]*this.x+m[6]*this.y+m[10]*this.z+m[14]
        const w=m[3]*this.x+m[7]*this.y+m[11]*this.z+m[15]
        return this.set(x,y,z)
    }
    // applyTransform(m:Transform){
    //     return this.set(m.sx*this.x+m.kx*this.y+m.tx,
    //                    m.ky*this.x+m.sy*this.y+m.ty)
    // }
    setNormalize(x:number,y:number,z:number){
        return this.setLengthFrom(x,y,z,1.0)
    }
    canNormalize(){
        return this.isFinite()&&(this.x!==0||this.y!==0||this.z!==0)
    }

    bezier(points:Vector3[],t:number):Vector3{
        const n=points.length-1;
        let x=0,y=0,z=0
        
        const factorial=(n:number)=>{
            if(n<=1){
                return 1
            }
            let sum=1;
            for(let i=2;i<=n;i++){
                sum*=i
            }
            return sum;
        }
        // 组合，不考虑顺序
        const nCr=(n:number,r:number)=>{
            return factorial(n)/(factorial(r)*factorial(n-r))
        }
        // 伯恩斯坦多项式
        const bernstein=(n:number,i:number,t:number)=>{
            return nCr(n,i)*Math.pow(t,i)*Math.pow(1-t,n-i)
        }   
        for(let i=0;i<=n;i++){
            let v=bernstein(n,i,t)
            x+=points[i].x*v
            y+=points[i].y*v
            z+=points[i].z*v
        }
        return this.set(x,y,z)
    }
    // 贝塞曲线递归法
    bezierDeCasteljau(points:Vector3[], t:number):Vector3{
        if(points.length===1){
            return this.set(points[0].x, points[0].y,points[0].z)
        }
        const n=points.length-1;
        let newPoints:Vector3[]=[];
        for(let i=0;i<n;i++){
            newPoints.push(Vector3.default().interpolateVectors(points[i],points[i+1],t))
        }
        return this.bezierDeCasteljau(newPoints, t);
       
    }
    quadraticBezier(p0:Vector3,p1:Vector3,p2:Vector3,t:number):Vector3{
        return this.bezier([p0,p1,p2],t)
    }
    curveBezier(p0:Vector3,p1:Vector3,p2:Vector3,p3:Vector3,t:number):Vector3{
        return this.bezier([p0,p1,p2,p3],t)
    }
    
	setFromMatrixPosition( m:Matrix4 ) {
		const e = m.elements;
		this.x = e[ 12 ];
		this.y = e[ 13 ];
		this.z = e[ 14 ];
		return this;

	}
    setFromMatrixScale( m:Matrix4) {

		const sx = this.setFromMatrixColumn( m, 0 ).length();
		const sy = this.setFromMatrixColumn( m, 1 ).length();
		const sz = this.setFromMatrixColumn( m, 2 ).length();

		this.x = sx;
		this.y = sy;
		this.z = sz;

		return this;

	}

	setFromMatrixColumn( m:Matrix4, index:number ) {

		return this.fromArray( m.elements, index * 4 );

	}

	setFromMatrix3Column( m:Matrix3, index:number ) {

		return this.fromArray( m.elements, index * 3 );

	}
    setFromEuler( e:Euler ) {

		this.x = e._x;
		this.y = e._y;
		this.z = e._z;

		return this;

	}

	setFromColor( c:Color) {
		return this.set(c.r,c.g,c.b);

	}

	fromArray( array:number[]|Float32Array, offset = 0 ) {
		const x = array[ offset ];
		const y = array[ offset + 1 ];
		const z = array[ offset + 2 ];
		return this.set(x,y,z);

	}
    toArray( array:number[]|Float32Array = [], offset = 0 ) {
		array[ offset ] = this.x;
		array[ offset + 1 ] = this.y;
		array[ offset + 2 ] = this.z;
		return array;
	}
    almostEqual(other:Vector3){
        return !(this.clone().sub(other).canNormalize())
    }
    equals(v:Vector3){
        return this.x===v.x&&this.y===v.y
    }
    equalsEpsilon(v:Vector3,epsilon=1e-6){
        return Math.abs(this.x-v.x)<epsilon&&Math.abs(this.y-v.y)<epsilon
    }
    release(){
        (this.constructor as typeof Vector3).release(this)
        return this
    }
}