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

export class Polygon{
    vertices:Vector2Like[]
    constructor(vertices:Vector2Like[]) {
        this.vertices = vertices;
    }
    
    contains(x:number, y:number,fillRule:'nonzero'|'evenodd') {
        const polygon=this.vertices
        if (fillRule === "evenodd") {
            let inside = false;
            for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
                const xi = polygon[i][0],
                    yi = polygon[i][1];
                const xj = polygon[j][0],
                    yj = polygon[j][1];
                // 条件：当前扫描线与边相交
                const intersect =
                    (yi > y) !== (yj > y) &&
                    x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
                if (intersect) {
                    inside = !inside;
                }
            }
            return inside;
        } else {
            // nonzero 使用绕数算法
            let windingNumber = 0;
            for (let i = 0; i < polygon.length; i++) {
                const [x0, y0] = polygon[i];
                const [x1, y1] = polygon[(i + 1) % polygon.length];
                if (y0 <= y) {
                    if (y1 > y && (x1 - x0) * (y - y0) - (x - x0) * (y1 - y0) > 0) {
                        windingNumber++;
                    }
                } else {
                    if (y1 <= y && (x1 - x0) * (y - y0) - (x - x0) * (y1 - y0) < 0) {
                        windingNumber--;
                    }
                }
            }
            return windingNumber !== 0;
        }
    }

    containsStroke(x:number, y:number,width:number,alignment=0.5) {
        const halfWidth=width*0.5
        const offset=(alignment-0.5)*2*halfWidth
        for (let i = 0; i < this.vertices.length; i++) {
            let [x0, y0] = this.vertices[i];
            let [x1, y1] = this.vertices[(i + 1) % this.vertices.length];
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

}