export class Triangle {
    constructor(
        public x1: number,
        public y1: number,
        public x2: number,
        public y2: number,
        public x3: number,
        public y3: number
    ) {}

    /**
     * 计算三角形的面积（使用向量叉积法）
     * @returns 三角形的面积
     */
    getArea(): number {
        return Math.abs(
            0.5 * (this.x1 * (this.y2 - this.y3) + this.x2 * (this.y3 - this.y1) + this.x3 * (this.y1 - this.y2))
        );
    }

    /**
     * 判断一个点是否在三角形内（使用面积法）
     * @param px 点的 x 坐标
     * @param py 点的 y 坐标
     * @returns 如果点在三角形内返回 true，否则返回 false
     */
    containsPoint(px: number, py: number): boolean {
        const areaABC = this.getArea();
        const areaPAB = new Triangle(px, py, this.x1, this.y1, this.x2, this.y2).getArea();
        const areaPBC = new Triangle(px, py, this.x2, this.y2, this.x3, this.y3).getArea();
        const areaPCA = new Triangle(px, py, this.x3, this.y3, this.x1, this.y1).getArea();

        return Math.abs(areaABC - (areaPAB + areaPBC + areaPCA)) < 1e-9;
    }

    /**
     * 计算给定点相对于当前三角形的重心坐标
     * @param px 点的 x 坐标
     * @param py 点的 y 坐标
     * @returns 包含重心坐标 (u, v, w) 的对象，如果点不在三角形内，返回 null
     */
    getBarycentricCoordinates(px: number, py: number): { u: number; v: number; w: number } | null {
        if (!this.containsPoint(px, py)) {
            return null;
        }

        const areaABC = this.getArea();
        const areaPBC = new Triangle(px, py, this.x2, this.y2, this.x3, this.y3).getArea();
        const areaPCA = new Triangle(px, py, this.x3, this.y3, this.x1, this.y1).getArea();
        const areaPAB = new Triangle(px, py, this.x1, this.y1, this.x2, this.y2).getArea();

        const u = areaPBC / areaABC;
        const v = areaPCA / areaABC;
        const w = areaPAB / areaABC;

        return { u, v, w };
    }
}