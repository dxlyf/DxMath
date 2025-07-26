import { Matrix2D } from "./mat2d";
import { Vector2 } from "./vec2";



/**
 * 2d包围盒
 */
export class BoundingRect {
    static default() {
        return new this()
    }
    static fromXYWH(x:number,y:number,w:number,h:number){
        return this.fromLTRB(x,y,x+w,y+h)
    }
    static fromLTRB(l:number,t:number,r:number,b:number){
        return new this(Vector2.create(l,t),Vector2.create(r,b))
    }
    min:Vector2
    max:Vector2
    constructor(min = Vector2.create(+Infinity, +Infinity), max = Vector2.create(-Infinity, -Infinity)) {
        this.min = min;
        this.max = max;
    }
    get left() {
        return this.min.x;
    }
    get top() {
        return this.min.y;
    }
    get right() {
        return this.max.x;
    }
    get bottom() {
        return this.max.y
    }
    get x(){
        return this.min.x;
    }
    get y(){
        return this.min.y;
    }
    get width() {
        return this.max.x - this.min.x;
    }
    get height() {
        return this.max.y - this.min.y;
    }
    get cx() {
        return this.left*0.5 + this.right*0.5
    }
    get cy() {
        return this.top*0.5 + this.bottom*0.5
    }
    get center() {
        return Vector2.create(this.cx, this.cy)
    }
    isEmpty() {
        return this.min.x > this.max.x || this.min.y > this.max.y;
    }
    clone() {
        return new BoundingRect().copy(this)
    }
    copy(box:BoundingRect) {
        this.min.copy(box.min)
        this.max.copy(box.max)
        return this
    }
    makeEmpty() {
        this.min.x = this.min.y = + Infinity;
        this.max.x = this.max.y = - Infinity;
        return this;
    }
    makeZero() {
        this.min.x = this.min.y = 0;
        this.max.x = this.max.y = 0;
        return this;
    }
    setViewport(x:number, y:number, width:number, height:number) {
        this.min.set(x, y)
        this.max.set(x + width, y + height)
        return this
    }
    set(min:Vector2, max:Vector2) {
        this.min.copy(min);
        this.max.copy(max);
        return this;
    }
    fromCircle(cx:number, cy:number, radius:number) {
        this.min.set(cx-radius,cy-radius)
        this.max.set(cx+radius,cy+radius)
        return this
    }
    fromLine(x0:number, y0:number, x1:number, y1:number, strokeWidth:number) {
        // 计算线段方向向量
        const dx = x1 - x0;
        const dy = y1 - y0;

        // 计算长度和单位向量
        const length = Math.sqrt(dx * dx + dy * dy);
        if(length===0){
            this.makeZero()
            return 
        }
        const ux = dx / length;
        const uy = dy / length;
        
        // 计算法向量 (垂直于线段方向)
        const nx = -uy;
        const ny = ux;

        // 偏移量 (法向量 * 半宽度)
        const offsetX = nx * strokeWidth / 2;
        const offsetY = ny * strokeWidth / 2;

        // 计算包围盒的四个顶点
        const points = [
            { x: x0 - offsetX, y: y0 - offsetY }, // 起点左侧
            { x: x0 + offsetX, y: y0 + offsetY }, // 起点右侧
            { x: x1 - offsetX, y: y1 - offsetY }, // 终点左侧
            { x: x1 + offsetX, y: y1 + offsetY }, // 终点右侧
        ];
        this.setFromPoints(points as Vector2[])
        return this
    }
    fromRect(x:number, y:number, w:number, h:number) {
        this.min.set(x,y)
        this.max.set(x+w,y+h)
        return this
    }
    fromPolygon(points:number[]){
        this.makeEmpty();
        let temp=Vector2.pool()
        for (let i = 0, il = points.length; i < il; i+=2) {
            temp.set(points[i],points[i+1])
            this.expandByPoint(temp)
        }
        temp.release()
        return this
    }
    setFromArrayPoints(points:number[]) {
        this.makeEmpty();
        let tmp=Vector2.create(0,0)
        for (let i = 0, il = points.length; i < il; i+=2) {
            tmp.set(points[i],points[i+1])
            this.expandByPoint(tmp);
        }
        return this;
    }
    setFromPoints(points:Vector2[]) {
        this.makeEmpty();
        for (let i = 0, il = points.length; i < il; i++) {
            this.expandByPoint(points[i]);
        }
        return this;
    }
    expandByStrokeWidth(strokeWidth:number){
        let halfStrokeWidth=strokeWidth*0.5
        this.min.translate(-halfStrokeWidth,-halfStrokeWidth)
        this.max.translate(halfStrokeWidth,halfStrokeWidth)
        return this
    } 
    expandByPoint(point:Vector2) {
        this.min.min(point);
        this.max.max(point);
        return this;

    }
    // isEmpty() {
    //     return !(this.left < this.right && this.top < this.bottom);
    // }
    isValid(){
        return this.isFinite()&&this.left<=this.right&&this.top<=this.bottom
    }
    isZero() {
        return this.width === 0 || this.height === 0
    }
    isFinite() {
        return this.isEmpty()
    }
    equals(box:BoundingRect) {
        return box.min.equals(this.min) && box.max.equals(this.max);

    }
    translate(tx:number,ty:number){
        this.min.translate(tx,ty)
        this.max.translate(tx,ty)
    }
    inset(dx:number,dy:number){
        this.min.translate(dx,dy)
        this.max.translate(-dx,-dy)
    }
    outset(dx:number,dy:number){
        this.inset(-dx,-dy)
    }
    intersect(box:BoundingRect) {

        this.min.max(box.min);
        this.max.min(box.max);
        if (this.isEmpty()) this.makeEmpty();
        return this;

    }
    union(box:BoundingRect) {
        this.min.min(box.min)
        this.max.max(box.max)
        return this
    }
    containsXY(x:number, y:number) {
        return !(x < this.left || x > this.right ||
            y < this.top || y > this.bottom);
    }
    containsPoint(point:Vector2) {
        return this.containsXY(point.x,point.y)
    }

    containsBox(box:BoundingRect) {
        return !(box.min.x < this.min.x || box.max.x > this.max.x || box.min.y < this.min.y || box.max.y > this.max.y);
    }
    intersectBox3(b:BoundingRect, mtv:Vector2) {
        if (!b) {
            return false;
        }
        Vector2.beginPools()
        const a = this;
        const ax0 = a.left;
        const ax1 = a.right;
        const ay0 = a.top;
        const ay1 = a.bottom;

        const bx0 = b.left;
        const bx1 = b.right;
        const by0 = b.top;
        const by1 = b.bottom;
        const maxTv = Vector2.pool()
        const minTv = Vector2.pool()
        let overlap = !(ax1 < bx0 || bx1 < ax0 || ay1 < by0 || by1 < ay0);
        if (mtv) {
            let dMin = Infinity;
            let dMax = 0;

            const d0 = Math.abs(ax1 - bx0);
            const d1 = Math.abs(bx1 - ax0);
            const d2 = Math.abs(ay1 - by0);
            const d3 = Math.abs(by1 - ay0);
            const dx = Math.min(d0, d1);// 计算x轴相交部分的长度
            const dy = Math.min(d2, d3);// 计算y轴相交部分的长度
            // On x axis
            // 两个矩形的x轴，不在相交范围
            if (ax1 < bx0 || bx1 < ax0) {

                if (dx > dMax) {
                    dMax = dx; // 两个矩阵x轴，最小距离
                    // 如果d0<d1,证明b是在a的右边，否则在左边
                    if (d0 < d1) {
                        maxTv.set(-d0, 0); // b is on the right
                    }
                    else {
                        maxTv.set(d1, 0);  // b is on the left
                    }
                }
            }
            else {
                // 如果相交，
                if (dx < dMin) {
                    dMin = dx;  // 两个矩形x轴，最大相交长度
                    if (d0 < d1) {
                        minTv.set(d0, 0); // b is on the right
                    }
                    else {
                        minTv.set(-d1, 0);  // b is on the left
                    }
                }
            }

            // On y axis
            if (ay1 < by0 || by1 < ay0) {
                if (dy > dMax) {
                    dMax = dy;
                    if (d2 < d3) {
                        maxTv.set(0, -d2); // b is on the bottom(larger y)
                    }
                    else {
                        maxTv.set(0, d3);  // b is on the top(smaller y)
                    }
                }
            }
            else {
                if (dx < dMin) {
                    dMin = dx;
                    if (d2 < d3) {
                        minTv.set(0, d2); // b is on the bottom
                    }
                    else {
                        minTv.set(0, -d3);  // b is on the top
                    }
                }
            }
        }

        if (mtv) {
            // 
            mtv.copy(overlap ? minTv : maxTv);
        }
        Vector2.endPools()
        return overlap;
    }
    intersectionBox(box:BoundingRect) {
        return !(this.left > box.right || this.right < box.left || this.top > box.bottom || this.bottom < box.top)
    }
    intersectionBox2(box:BoundingRect) {
        return (box.min.x >= this.min.x && box.min.x <= this.max.x || box.max.x >= this.min.x && box.max.x <= this.max.x) && (box.min.y >= this.min.y && box.min.y <= this.max.y || box.max.y >= this.min.y && box.max.y <= this.max.y)
    }

    applyMatrix(matrix:Matrix2D) {
        if (matrix.isIdentity()) {
            return
        }
      
        Vector2.beginPools()
      
        const topLeft = Vector2.pool(this.left, this.top)
        const topRight = Vector2.pool(this.right, this.top)
        const bottomLeft = Vector2.pool(this.left, this.bottom)
        const bottomRight = Vector2.pool(this.right, this.bottom)
        topLeft.applyMatrix2D(matrix)
        topRight.applyMatrix2D(matrix)
        bottomLeft.applyMatrix2D(matrix)
        bottomRight.applyMatrix2D(matrix)

        this.makeEmpty()
        this.expandByPoint(topLeft)
        this.expandByPoint(topRight)
        this.expandByPoint(bottomLeft)
        this.expandByPoint(bottomRight)

        Vector2.endPools()
    }
}