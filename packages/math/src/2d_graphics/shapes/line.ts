import { Vector2 } from "../math/Vector2";
import { clamp } from '../math/util'
import { BoundingRect } from "../math/BoundingRect";


export class Line {
    start = Vector2.default()
    end = Vector2.default()

    constructor(start = Vector2.default(), end = Vector2.default()) {
        this.start.copy(start)
        this.end.copy(end)
    }

    get length(): number {
        return Vector2.distance(this.start, this.end)
    }
    get lengthSquared(): number {
        return Vector2.distanceSquared(this.start, this.end)
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
        return Vector2.sub(out, this.end, this.start)
    }
    getCenter(out = Vector2.default()) {
        return Vector2.lerp(out, this.start, this.end, 0.5)
    }
    distanceTo(x: number, y: number): number {
   
        const p=Vector2.create(x,y)
        const delta=this.end.clone().sub(this.start)
        const pStart=p.clone().sub(this.start)

        let t = pStart.dot(delta) / delta.dot(delta)
        t = clamp(t, 0, 1)
        return pStart.distance(delta.multiplyScalar(t))
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