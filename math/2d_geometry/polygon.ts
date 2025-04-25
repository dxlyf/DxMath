import { squaredDistanceToLineSegment } from "../math/math";
import { Vector2 } from "../math/vec2";
import { BoundingRect } from "../math/bounding_rect";


/**
 * 判断点 (x,y) 是否在多边形内部。
 * 对于 fillRule=="evenodd"，采用奇偶规则；
 * 对于 fillRule=="nonzero"，采用绕数（winding number）判断法。
 */
export function pointInPolygon(
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
    closePath:boolean=true
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
    /**
     * Checks whether the x and y coordinates given are contained within this polygon including the stroke.
     * @param x - The X coordinate of the point to test
     * @param y - The Y coordinate of the point to test
     * @param strokeWidth - The width of the line to check
     * @param alignment - The alignment of the stroke, 0.5 by default
     * @returns Whether the x/y coordinates are within this polygon
     */
    public strokeContains(x: number, y: number, strokeWidth: number, alignment = 0.5): boolean
    {
        const strokeWidthSquared = strokeWidth * strokeWidth;
        const rightWidthSquared = strokeWidthSquared * (1 - alignment);
        const leftWidthSquared = strokeWidthSquared - rightWidthSquared;

        const { points } = this;
        const iterationLength = points.length - (this.closePath ? 0 : 2);

        for (let i = 0; i < iterationLength; i += 2)
        {
            const x1 = points[i].x;
            const y1 = points[i].y;

            const x2 = points[(i + 1) % points.length].x;
            const y2 = points[(i + 1) % points.length].y;

            const distanceSquared = squaredDistanceToLineSegment(x, y, x1, y1, x2, y2);

            const sign = Math.sign(((x2 - x1) * (y - y1)) - ((y2 - y1) * (x - x1)));

            if (distanceSquared <= (sign < 0 ? leftWidthSquared : rightWidthSquared))
            {
                return true;
            }
        }

        return false;
    }
    public isClockwise(): boolean
    {
        let area = 0;
        const points = this.points;
        const length = points.length;

        for (let i = 0; i < length; i += 2)
        {
            const x1 = points[i].x;
            const y1 = points[i].y;
            const x2 = points[(i + 1) % length].x;
            const y2 = points[(i + 1) % length].y;

            area += (x2 - x1) * (y2 + y1);
        }

        return area < 0;
    }
    public getBounds(out?: BoundingRect): BoundingRect
    {
        out ||= new BoundingRect();
        out.setFromPoints(this.points)

        return out;
    }
}