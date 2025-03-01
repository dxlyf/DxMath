import { Vector2 } from "../math/vec2"

const start=Vector2.create()
const end=Vector2.create()
const delta=Vector2.create()

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
        const k=(this.end.y-this.start.y)/(this.end.x-this.start.x)
        const b=this.start.y-k*this.start.x
        return b
    }
    // x轴截距
    getInterceptFromXAxis(){
        //斜截式 y=kx+b x=ky+b
        const k=(this.end.x-this.start.x)/(this.end.y-this.start.y)
        const b=this.start.x-k*this.start.y
        return b
    }
    intersection(line:Line,out?:Vector2):boolean{
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
        let A=ab.y;
        let B=-ab.x;
        let C=ab.x*this.start.y-ab.y*this.start.x;

        let D=cd.y;
        let E=-cd.x;
        let F=cd.x*line.start.y-cd.y*line.start.x;
          // AE-BD
          const det=ab.cross(cd)
          // 没有解
          if(det==0) return false
        const aa=line.start.clone().subtract(this.start)
        



        return false
    }

    contains(point:Vector2):boolean{
        
    }

}