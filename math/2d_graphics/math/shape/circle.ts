import {Vector2}  from '../vector2'
import {BoundingRect} from '../bounding_rect'
const boundingBox=BoundingRect.default()
export class Circle{
    center=Vector2.default()
    constructor(center:Vector2,public radius:number) {
        this.radius = radius;
        this.center.copy(center)
    }
    clone() {
        return new Circle(this.center, this.radius);
    }
    copy(circle:Circle) {
        this.center.copy(circle.center);
        this.radius = circle.radius;
        return this
    }
    set(center:Vector2,radius:number) {
        this.center.copy(center);
        this.radius = radius;
        return this
    }
    /**
     * 计算圆的面积
     *
     * @returns 返回圆的面积
     */
    getArea() {
        return Math.PI * this.radius ** 2;
    }
    /**
     * 计算圆的周长
     *
     * @returns 返回圆的周长
     */
    getCircumference() {
        return 2 * Math.PI * this.radius;
    }
    distanceTo(x:number,y:number) {
        return Vector2.distance(Vector2.create(x, y),this.center);
    }
    contains(x:number,y:number) {
        return Vector2.distanceSquared(Vector2.create(x, y),this.center) <= this.radius ** 2;
    }
    containsStroke(x:number,y:number,width:number,alignment:number=0.5) {
        const dist=this.distanceTo(x, y);
        const halfWidth=width*0.5
        const offset=(alignment-0.5)*2*halfWidth
        const radius=this.radius+offset
        return Math.abs(dist-radius)<=halfWidth;
    }
    containsBoundingRect(x:number,y:number) {
        boundingBox.fromCircle(this.center, this.radius);
        return boundingBox.contains(x,y)
    }
    getBoundingBox(boundingBox:BoundingRect) {
        boundingBox.fromCircle(this.center, this.radius);
        return boundingBox;
    }
}