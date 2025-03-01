import { Vector2 } from "../math/vec2";


/**
 * 判断点 (x,y) 是否在多边形内部。
 * 对于 fillRule=="evenodd"，采用奇偶规则；
 * 对于 fillRule=="nonzero"，采用绕数（winding number）判断法。
 */
function pointInPolygon(
    x: number,
    y: number,
    polygon: number[][],
    fillRule: "evenodd" | "nonzero"
): boolean {
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
export class Polygon {
    points: Vector2[]
    constructor(points: Vector2[]) {
        this.points = points
    }
    get size() {
        return this.points.length
    }
    getEdges() {

    }
    contains(p: Vector2): boolean {
        const len = this.size
        let wind = 0
        for (let i = 1, j = 0; i < len; j = i++) {
            const p0 = this.points[j]
            const p1 = this.points[i]
            if (p.y > p0.y !== p.y > p1.y && p.x < (p1.x - p0.x) * (p.y - p0.y) / (p1.y - p0.y) + p0.x) {
                wind++
            }
        }
        return (wind % 2) !== 0;
    }
}