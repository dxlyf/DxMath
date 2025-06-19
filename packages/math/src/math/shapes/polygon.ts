import { clamp } from "../math";
import { IVector2,Vector2} from "../vec2";
import { BoundingRect } from '../bounding_rect'
function pointOnSegmentDistance(x: number, y: number, x0: number, y0: number, x1: number, y1: number) {
    let dx = x1 - x0,
        dy = y1 - y0;
    let px = x - x0, py = y - y0;
    if (dx !== 0 || dy !== 0) {
        let t = (px * dx + py * dy) / (dx * dx + dy * dy);
        t = clamp(t, 0, 1)
        return Math.hypot(px - dx * t, px - dy * t)
    }
    return Number.POSITIVE_INFINITY;
}

export class Polygon {
    vertices: IVector2[]
    constructor(vertices: IVector2[]) {
        this.vertices = vertices;
    }
    getVectors(){
        return this.vertices.map(d => Vector2.create(d.x,d.y))
    }
    getArea() {
        let area = 0;
        for (let i = 0; i < this.vertices.length; i++) {
            const p1 = this.vertices[i];
            const p2 = this.vertices[(i + 1) % this.vertices.length];
            area += p1.x * p2.y - p1.y * p2.x;
        }
        return Math.abs(area / 2);
    }
    getBoundingBox(boundingBox: BoundingRect) {
        boundingBox.fromPolygon(this.vertices.flatMap(d => [d.x, d.y]))
        return boundingBox;
    }
    contains(x: number, y: number, fillRule: 'nonzero' | 'evenodd') {
        let count = 0;
        for (let i = 0; i < this.vertices.length; i++) {
            let p1 = this.vertices[i];
            let p2 = this.vertices[(i + 1) % this.vertices.length];
            let x0 = p1.x, y0 = p1.y, x1 = p2.x, y1 = p2.y;

            if (((y > y0) !== (y > y1)) && (x < (x1 - x0) * (y - y0) / (y1 - y0) + x0)) {
                if (fillRule === 'nonzero') {
                    count += (y0 < y1) ? 1 : -1;
                } else if (fillRule === 'evenodd') {
                    count++
                }
            }
        }
        return count % 2 !== 0;
    }

    containsStroke(x: number, y: number, width: number, alignment = 0.5) {
        const halfWidth = width * 0.5
        const offset = (alignment - 0.5) * 2 * halfWidth
        for (let i = 0; i < this.vertices.length; i++) {
            let { x: x0, y: y0 } = this.vertices[i];
            let { x: x1, y: y1 } = this.vertices[(i + 1) % this.vertices.length];
            const len = Math.hypot(x1 - x0, y1 - y0)

            const dx = (x1 - x0) / len
            const dy = (y1 - y0) / len
            x0 = x0 - dy * offset
            y0 = y0 + dx * offset
            x1 = x1 - dy * offset
            y1 = y1 + dx * offset
            const dist = pointOnSegmentDistance(x, y, x0, y0, x1, y1)

            if (Math.abs(dist) <= halfWidth) {
                return true
            }
        }
        return false;
    }

}