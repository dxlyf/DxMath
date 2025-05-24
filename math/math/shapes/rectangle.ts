export class Rectangle {
    constructor(
        public x: number,
        public y: number,
        public width: number,
        public height: number
    ) {}

    /**
     * 计算矩形的面积
     * @returns 矩形的面积
     */
    getArea(): number {
        return this.width * this.height;
    }

    /**
     * 计算矩形的周长
     * @returns 矩形的周长
     */
    getPerimeter(): number {
        return 2 * (this.width + this.height);
    }

    /**
     * 判断一个点是否在矩形内
     * @param px 点的 x 坐标
     * @param py 点的 y 坐标
     * @returns 如果点在矩形内返回 true，否则返回 false
     */
    containsPoint(px: number, py: number): boolean {
        return (
            px >= this.x &&
            px <= this.x + this.width &&
            py >= this.y &&
            py <= this.y + this.height
        );
    }
}