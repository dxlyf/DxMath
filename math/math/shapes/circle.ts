
export class Circle {
    constructor(public cx: number, public cy: number, public radius: number) {}

    /**
     * 计算圆的面积
     * @returns 圆的面积
     */
    getArea(): number {
        return Math.PI * this.radius * this.radius;
    }

    /**
     * 计算圆的周长
     * @returns 圆的周长
     */
    getCircumference(): number {
        return 2 * Math.PI * this.radius;
    }

    /**
     * 判断一个点是否在圆内
     * @param x 点的 x 坐标
     * @param y 点的 y 坐标
     * @returns 如果点在圆内返回 true，否则返回 false
     */
    containsPoint(x: number, y: number): boolean {
        const dx = x - this.cx;
        const dy = y - this.cy;
        return dx * dx + dy * dy <= this.radius * this.radius;
    }
}