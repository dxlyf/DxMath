import { BoundingRect } from "../math/BoundingRect";
import { clamp } from "../math/util";
import { Vector2Like } from "../math/Vector2";

function pointOnSegmentDistance(x:number,y:number,x0:number,y0:number,x1:number,y1:number) {
    let dx = x1 - x0,
        dy = y1 - y0;
    let px=x-x0,py=y-y0;
    if (dx !== 0 || dy !== 0) {
        let t = (px * dx + py * dy) / (dx * dx + dy * dy);
        t=clamp(t,0,1)
        return Math.hypot(px-dx*t,px-dy*t)
    }
    return Number.POSITIVE_INFINITY;
}
export function pointInPolygon(x: number, y: number, polygon: number[], fileRule:'nonzero'|'evenodd'='evenodd') {
    let winding = 0
    for (let j = polygon.length - 2, i = 0; i < polygon.length; j = i, i += 2) {
        const x0 = polygon[j]
        const y0 = polygon[j + 1]
        const x1 = polygon[i]
        const y1 = polygon[i + 1]
        if (y > y0 !== y > y1 && x >= x0 + (x1 - x0) * (y - y0) / (y1 - y0)) {
            if (fileRule === 'evenodd') {
                winding++
            } else {
                winding += y0 < y1 ? 1 : -1
            }
        }
    }
    return winding % 2 !== 0
}
export class Polygon{
    vertices:number[]
    constructor(vertices:number[]) {
        this.vertices = vertices;
    }
    
    contains(x:number, y:number,fillRule:'nonzero'|'evenodd') {
       return pointInPolygon(x,y,this.vertices,fillRule)
    }

    containsStroke(x:number, y:number,width:number,alignment=0.5) {
        const halfWidth=width*0.5
        const offset=(alignment-0.5)*2*halfWidth
        for (let i = 0; i < this.vertices.length; i+=2) {
            let x0 = this.vertices[i];
            let y0 = this.vertices[i+1];
            let x1 = this.vertices[(i + 2) % this.vertices.length];
            let y1 = this.vertices[(i + 3) % this.vertices.length];
            const len=Math.hypot(x1-x0,y1-y0)
            
            const dx=(x1-x0)/len
            const dy=(y1-y0)/len
            x0=x0-dy*offset
            y0=y0+dx*offset
            x1=x1-dy*offset
            y1=y1+dx*offset
            const dist=pointOnSegmentDistance(x,y,x0,y0,x1,y1)
      
            if(Math.abs(dist)<=halfWidth){
                return true
            }
        }
        return false;
    }
   getBoundingBox(boundingBox: BoundingRect) {
        boundingBox.makeEmpty()
        boundingBox.setFromVertices(this.vertices)
        return boundingBox;
    }
}