import { Vector2 } from "../math/vec2"

const start=Vector2.create()
const end=Vector2.create()
const delta=Vector2.create()

// (直线公式)直线距离
// 获取点与直线的距离

// 设直线a b点, x=ax+(bx-ax)t ,y=ay+(by-ay)t
// (x-ax)/(bx-ax)=(y-ay)/(by-ay)=t 
// (x-ax)(by-ay)-(y-ay)(bx-ax)=x(by-ay)+y(ax-bx)+ay(bx-ax)-ax(by-ay)=0
// A=(by-ay) B=(ax-bx) C=ay(bx-ax)-ax(by-ay)=aybx-axby
// Ax+By+C=0   
// 点到直线的距离=|Ax+By+C|/sqrt(A^2+B^2)

export function straightLineDistance(point:Vector2,start:Vector2,end:Vector2):number{
    let A=end.y-start.y
    let B=start.x-end.x
    let C=start.y*end.x-start.x*end.y
    return Math.abs(A*point.x+B*point.y+C)/Math.sqrt(A*A+B*B)

}
// 投影法
export function  straightLineProjDistance(point:Vector2,start:Vector2,end:Vector2):number{
    const ab=end.clone().sub(start)
    const ap=point.clone().sub(start)
    const t=ap.dot(ab)/ab.lengthSq()
    const projection=start.clone().add(ab.multiplyScalar(t))
    return projection.distanceTo(point)
}
export function  lineSegmentDistance(point:Vector2,start:Vector2,end:Vector2):number{
    const ab=end.clone().sub(start)
    const ap=point.clone().sub(start)
    const t=Math.max(0,Math.min(1,ap.dot(ab)/ab.lengthSq()))
    const projection=start.clone().add(ab.multiplyScalar(t))
    return projection.distanceTo(point)
}
export function getDistanceSquared(a:Vector2,b:Vector2,p:Vector2) {
    if (a.equals(b)) {
        return p.distanceToSquared(a)
    }
    const ap=p.clone().subtract(a)
    const ab=b.clone().subtract(a)
    const  u = ap.dot(ab)/ab.squaredLength();
    if (u <= 0) {
        return p.distanceToSquared(a)
    }
    else if (u >= 1){
        return p.distanceToSquared(b)
    }
    else{
        return ap.distanceToSquared(ab.multiplyScalar(u))
    }
}

// 转成一般式
export function generalEquation(start:Vector2,end:Vector2){
    Vector2.beginPools()
     const delta=Vector2.pool().subVectors(end,start)
    // 直线参数方程转一般式 Ax+By+C=0
    // p=start+t*delta
    // x=start.x+t*delta.x
    // y=start.y+t*delta.y
    // 去掉t
    // x-start.x=delta.x*t => t=(x-start.x)/delta.x  
    // y-start.y=delta.y*t => t=(y-start.y)/delta.y
    // (x-start.x)/delta.x=(y-start.y)/delta.y
    // delta.y*(x-start.x)=delta.x*(y-start.y)
    // delta.y*(x-start.x)-delta.x*(y-start.y)=0
    // delta.y*x-delta.y*start.x-delta.x*y+delta.x*start.y=0
    //  delta.y*x-delta.x*y+(delta.x*start.y--delta.y*start.x)=0

    const A=delta.y
    const B=-delta.x
    const C=(delta.x*start.y-delta.y*start.x)

    Vector2.endPools()
    return [A,B,C]
}
export class Line{
    start:Vector2
    end:Vector2
    constructor(start:Vector2,end:Vector2){
        this.start=start
        this.end=end
    }
    
    interpolate(t:number,out:Vector2):Vector2{
        return out.interpolateVectors(this.start,this.end,t)
    }
    // y轴截距
    getInterceptFromYAxis(){
        //斜截式 y=kx+b
        // const k=(this.end.y-this.start.y)/(this.end.x-this.start.x)
        // const b=this.start.y-k*this.start.x
        const delta=this.end.clone().subtract(this.start)

        return this.start.cross(delta)/-delta.x
    }
    // x轴截距
    getInterceptFromXAxis(){
        //斜截式 y=kx+b x=ky+b
        // const k=(this.end.x-this.start.x)/(this.end.y-this.start.y)
        // const b=this.start.x-k*this.start.y
        const delta=this.end.clone().subtract(this.start)
        return this.start.cross(delta)/delta.y
    }
    intersection(line:Line,out=Vector2.default()){
        const ab=this.end.clone().subtract(this.start)
        const cd=line.end.clone().subtract(line.start)

        // 克莱姆法则
        /**
         * 一般式 Ax+By+C=0
         * 一般式 Dx+Ey+F=0
         *运用克莱姆法则
          Ax+By=-C
          Dx+Ey=-F
          x=(CE-FB)/(AE-BD)
          y=(AF-DC)/(AE-BD)
        */
          const det=ab.cross(cd)
          if(det==0) return null
        
          const ac=this.start.clone().sub(line.start)
          const u=cd.cross(ac)/det
          const v=ab.cross(ac)/det
          if(u>=0&&u<=1&&v>=0&&v<=1){
            return out.copy(this.start).add(ab.clone().multiplyScalar(u))
          }
          return null
    }

    contains(point:Vector2){
        
    }

}