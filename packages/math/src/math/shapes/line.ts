import { Vector2 } from "../vec2";
import { clamp } from '../math'
import { BoundingRect } from "../bounding_rect";


export class Line {
    start = Vector2.default()
    end = Vector2.default()

    constructor(start = Vector2.default(), end = Vector2.default()) {
        this.start.copy(start)
        this.end.copy(end)
    }

    get length(): number {
        return this.end.distanceTo(this.start)
    }
    get lengthSquared(): number {
        return this.end.distanceToSquared(this.start)
    }
    clone(){
        return new Line(this.start, this.end)
    }
    copy(other: Line) {
        this.start.copy(other.start)
        this.end.copy(other.end)
    }
    offset(width:number){
        const delta=this.end.clone().sub(this.start).normalize().perp()
        this.start.add(delta.clone().multiplyScalar(width))
        this.end.add(delta.clone().multiplyScalar(width))
        return this
    }
    getDelta(out = Vector2.default()) {
        return out.subVectors(this.end, this.start)
    }
    getCenter(out = Vector2.default()) {
        return out.interpolateVectors(this.start, this.end, 0.5)
    }
    distanceTo(x: number, y: number): number {
        const p=Vector2.create(x,y)
        const delta=this.end.clone().sub(this.start)
        const pStart=p.clone().sub(this.start)
        let t = pStart.dot(delta) / delta.dot(delta)
        t = clamp(t, 0, 1)
        return pStart.distanceTo(delta.multiplyScalar(t))
    }
    /** 
     * 直线参数方程(x,y)=(x0+at, y0+bt) (a,b)是单位向量
     * 线段上的点参数方程:(x,y)=(x0+(x1-x0)t, y0+(y1-y0)t)
     * 直线一般式 Ax+By+C=0
      参数方程转一般式：
      x=x0+(x1-x0)t  t=(x-x0)/(x1-x0)
      y=y0+(y1-y0)t  t=(y-y0)/(y1-y0)
      (x-x0)/(x1-x0)=(y-y0)/(y1-y0)=(x-x0)(y1-y0)=(y-y0)(x1-x0)=(x-x0)dy=(y-y0)dx
      dx=bx-ax dy=by-ay
      (x-x0)dy-(y-y0)dx=0 =dx*x-x0dy-dx*y+y0dx=0

      Ax=dy,By=-dx,C=y0dx-x0dy


     * 线段与线段相交点
     * 法向式:
     * (x-x0)dy=(y-y0)dx
     * Ax+By+C=0
     * Cx+Dy+E=0
     * 克莱姆法则求解：
     * Ax+By=-C
     * Cx+Dy=-E
       d=AD-BC
       u=(BE-DC)/d
       v=(AE-CD)/d
    */
    intersectionFromLine(line: Line,out=Vector2.default()) {
            const ab=this.getDelta()
            const cd=line.getDelta()
            const det=ab.cross(cd)
            if(det===0){
                return null
            }
            const ac=line.start.clone().sub(this.start)
            const u=ac.cross(cd)/det
            const v=ac.cross(ab)/det
            if(u<0||u>1||v<0||v>1){
                return null
            }
            out.copy(ab).multiplyScalar(u).add(this.start)
            return out
    }
    /**
     * y=xk+b b=y-xk
     * 适用所有直线
     * 计算截距:Ax+By+C=0
     * (x-x0)dy-(y-y0)dx=
     * 横截距 a=-C/A 
     * 纵截距 b=-C/B 
    */
    intercept(){
        const ab=this.getDelta()
        const A=ab.y,B=-ab.x,C=ab.cross(this.start);
        return {
            x: -C/A,
            y: -C/B
        }
    }
    
    contains(x: number, y: number): boolean {
        return this.distanceTo(x, y) < 1e-6
    }

    containsStroke(x: number, y: number, width: number,alignment=0.5) {
        const halfWidth = width * 0.5
        const offset=(alignment-0.5)*2*halfWidth
        const line=this.clone()
        const dist=line.offset(offset).distanceTo(x,y)
        return dist <= halfWidth;
    }
    getBoundingBox(boundingBox: BoundingRect) {
        let x=Math.min(this.start.x,this.end.x)
        let y=Math.min(this.start.y,this.end.y)
        let w=Math.abs(this.start.x-this.end.x)
        let h=Math.abs(this.start.y-this.end.y)
        boundingBox.fromRect(x,y,w,h);
        return boundingBox;
    }

}