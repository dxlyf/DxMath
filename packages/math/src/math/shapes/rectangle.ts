import {Vector2} from '../vec2'
export class Rectangle {
    constructor(
        public x: number,
        public y: number,
        public width: number,
        public height: number
    ) { }

    getCenter(){
        return Vector2.create(this.x + this.width / 2, this.y + this.height / 2)
    }
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
    distanceTo(point: Vector2) {
        const center=this.getCenter()
        const width=this.width/2,height=this.height/2
        const dx=Math.abs(point.x-center.x)-width
        const dy=Math.abs(point.y-center.y)-height
        const max_x=Math.max(0,dx)
        const max_y=Math.max(0,dy)
        if(max_x>0||max_y>0){
            return Math.sqrt(max_x*max_x+max_y*max_y)
        }
        return 0 //Math.min(0,Math.max(dx,dy))
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