import { Point } from "./point";
import { Rect } from "./rect";

export class Ref<T=number>{
    static from<T=number>(value:T):Ref<T>{
        return new Ref(value)
    }
    value:T
    constructor(value:T){
        this.value=value;
    }
}

export class VectorIterator<T>{
    data:T[]
    size:number=0
    currentIndex=0
    increase:number=1
    constructor(size:number,startIndex:number=0,reverse:boolean=false){
        this.size=size
        this.currentIndex=startIndex%size
        this.increase=reverse?size-1:1
        this.data=new Array(size)

    }
    get current(){
        return this.data[this.currentIndex]
    }
    get next(){
        this.currentIndex=(this.currentIndex+this.increase)%this.size
        return this.current[this.currentIndex]
    }
}

export const swap=(a:Ref,b:Ref)=>{
    let temp=a.value
    a.value=b.value
    b.value=temp
}

export class FloatPoint{
    static make(size:number=4){
        return new FloatPoint(size)
    }
    static fromPoint(point:Point){
        let result=new FloatPoint(2)
        result.elements[0]=point.x
        result.elements[1]=point.y

        return result
    }
    static fromPoints(points:Point[],count:number){
        let result=new FloatPoint(count*2)
        for(let i=0;i<count;i++){
            result.elements[i*2]=points[i].x
            result.elements[i*2+1]=points[i].y
        }
        return result
    }
    static fromArray(points:number[]|Float32Array,count:number){
        let result=new FloatPoint(count)
        for(let i=0;i<count;i++){
            result.elements[i]=points[i]
        }
        return result
    }
    elements:Float32Array
    constructor(size:number){
        this.elements=new Float32Array(size)
    }

    get x(){
        return this.elements[0]
    }
    set x(value:number){
        this.elements[0]=value
    }
    get y(){
        return this.elements[1]
    }
    set y(value:number){
        this.elements[1]=value
    }
    get z(){
        return this.elements[2]
    }
    set z(value:number){
        this.elements[2]=value
    }
    get w(){
        return this.elements[2]
    }
    set w(value:number){
        this.elements[2]=value
    }
    get h(){
        return this.elements[3]
    }
    set h(value:number){
        this.elements[3]=value
    }
    setElements(elements:number[]|Float32Array){
        for(let i=0;i<elements.length;i++){
            this.elements[i]=elements[i]
        }
        return this
    }
    storePoint(target:Point){
        target.set(this.x,this.y)

    }
    store(target:number[]|Float32Array){
        for(let i=0;i<this.elements.length;i+=1){
         target[i]=this.elements[i]
        }
    }
    storePoints(target:Point[]){
        for(let i=0;i<this.elements.length;i+=2){
            target[i].set(this.elements[i],this.elements[i+1])
        }
    }

    add(other:FloatPoint){
        return this.setElements(this.elements.map((e,i)=>e+other.elements[i]))
    }
    sub(other:FloatPoint){
        return this.setElements(this.elements.map((e,i)=>e-other.elements[i]))
    }
    mulScalar(scalar:number){
        return this.setElements(this.elements.map(e=>e*scalar))
    }
    min(other:FloatPoint){
        return this.setElements(this.elements.map((e,i)=>Math.min(e,other.elements[i])))
    }
    max(other:FloatPoint){
        return this.setElements(this.elements.map((e,i)=>Math.max(e,other.elements[i])))
    }

    mul(other:FloatPoint){
        return this.setElements(this.elements.map((e,i)=>e*other.elements[i]))
    }
    div(other:FloatPoint){
        return this.setElements(this.elements.map((e,i)=>e/other.elements[i]))
    }
    sqrt(){
        return this.setElements(this.elements.map(e=>Math.sqrt(e)))
    }
    inverse(){
        return this.setElements(this.elements.map(e=>1/e))
    }
    clone(){
        return new FloatPoint(this.elements.length).setElements(this.elements)
    }
    copy(other:FloatPoint){
        this.elements.set(other.elements)
        return this
    }
    xy(){
        return new FloatPoint(2).setElements([this.x,this.y])
    }
    xyxy(){
        return new FloatPoint(4).setElements([this.x,this.y,this.x,this.y])
    }
    xyz(){
        return new FloatPoint(3).setElements([this.x,this.y,this.z])
    }
    equals(other:FloatPoint){
        return this.elements.every((e,i)=>e==other.elements[i])
    }
    equalsWithTolerance(other:FloatPoint,tolerance=0.0001){
        return this.elements.every((e,i)=>Math.abs(e-other.elements[i])<tolerance)
    }
    lerp(a:FloatPoint,b:FloatPoint,t:FloatPoint){
        return this.setElements(this.elements.map((e,i)=>a.elements[i]+t.elements[i]*(b.elements[i]-a.elements[i])))
    }

}