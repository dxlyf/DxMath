import {BoundingRect} from '../bounding_rect'
const boundingBox=BoundingRect.default()
export class Circle{
    constructor(public cx:number,public cy:number,public radius:number) {

    }
    clone() {
        return new Circle(this.cx,this.cy, this.radius);
    }
    copy(circle:Circle) {
        this.cx=circle.cx;
        this.cy=circle.cy;
        this.radius = circle.radius;
        return this
    }
    setRadius(radius:number) {
        this.radius = radius;
        return this
    }
    setCenter(x:number,y:number) {
        this.cx=x;
        this.cy=y;
        return this;
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
        return Math.sqrt((x - this.cx) ** 2 + (y - this.cy) ** 2);
    }
    contains(x:number,y:number) {
        return this.distanceTo(x,y) <= this.radius;
    }
    containsStroke(x:number,y:number,width:number,alignment:number=0.5) {
        const dist=this.distanceTo(x,y);
        const halfWidth=width*0.5
        const offset=(alignment-0.5)*2*halfWidth
        const radius=this.radius+offset
        return Math.abs(dist-radius)<=halfWidth;
    }
    containsBoundingRect(x:number,y:number) {
        boundingBox.fromCircle(this.cx,this.cy, this.radius);
        return boundingBox.containsXY(x,y)
    }
    getBoundingBox(boundingBox:BoundingRect) {
        boundingBox.fromCircle(this.cx,this.cy, this.radius);
        return boundingBox;
    }
}