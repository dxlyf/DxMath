import { Vector2 } from "./vector2";
import {Matrix2D} from './matrix2d'
import {Matrix3} from './matrix3'

export class BoundingRect {
    static default(){
        return new this(Vector2.create(Infinity, Infinity), Vector2.create(-Infinity, -Infinity))
    }
    static fromXYWH(x: number, y: number, width: number, height: number) {
        return this.fromLTRB(x, y, x + width, y + height)
    }
    static fromLTRB(left: number, top: number, right: number, bottom: number) {
        return new BoundingRect(Vector2.create(left, top), Vector2.create(right, bottom))
    }
    min = Vector2.create(Infinity, Infinity)
    max = Vector2.create(-Infinity, -Infinity)
    constructor(min: Vector2, max: Vector2) {
        this.min.copy(min)
        this.max.copy(max)
    }
    get cx() {
        return (this.min.x + this.max.x) * 0.5
    }
    get cy() {
        return (this.min.y + this.max.y) * 0.5
    }
    get width() {
        return this.max.x - this.min.x
    }
    get height() {
        return this.max.y - this.min.y
    }
    get left() {
        return this.min.x
    }
    get top() {
        return this.min.y
    }
    get right() {
        return this.max.x
    }
    get bottom() {
        return this.max.y
    }
    get center() {
        return Vector2.create((this.min.x + this.max.x) * 0.5, (this.min.y + this.max.y) * 0.5)
    }
    get area() {
        return this.width * this.height
    }
    get isEmpty() {
        return this.min.x >= this.max.x || this.min.y >= this.max.y
    }

    clone() {
        return new BoundingRect(this.min, this.max)
    }
    copy(other: BoundingRect) {
        this.min.copy(other.min)
        this.max.copy(other.max)
        return this
    }
    set(min: Vector2, max: Vector2) {
        this.min.copy(min)
        this.max.copy(max)
        return this
    }
    setXYWH(x: number, y: number, width: number, height: number) {
        return this.setLTRB(x, y, x + width, y + height)
    }
    setLTRB(left: number, top: number, right: number, bottom: number) {
        this.min.setXY(left, top)
        this.max.setXY(right, bottom)
        return this
    }
    fromCircle(center: Vector2, radius: number) {
        this.min.setXY(center.x - radius, center.y - radius)
        this.max.setXY(center.x + radius, center.y + radius)
        return this
    }
    fromRect(x:number,y:number,width:number,height:number) {
        return this.setLTRB(x,y,x+width,y+height)
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
    containsPoint(point: Vector2) {
        return this.contains(point.x, point.y)
    }
    contains(x: number, y: number) {
        return !(x < this.left || y < this.top || x > this.right || y > this.bottom)
    }
    containsRect(other: BoundingRect) {
        return this.min.x <= other.min.x && this.max.x >= other.max.x && this.min.y <= other.min.y && this.max.y >= other.max.y
    }
    intersectRect(other: BoundingRect) {
        return !(other.min.x > this.max.x || other.max.x < this.min.x || other.min.y > this.max.y || other.max.y < this.min.y)
    }
    setFromPoints(points: Vector2[]) {
        this.makeEmpty();
        for (let i = 0, il = points.length; i < il; i++) {
            this.expandByPoint(points[i]);
        }
        return this;
    }
    expandByPoint(point: Vector2) {
        this.min.min(point);
        this.max.max(point);
        return this;

    }
    union(other: BoundingRect) {
        this.min.min(other.min)
        this.max.max(other.max)
        return this
    }
    intersect(other: BoundingRect) {
        this.min.max(other.min)
        this.max.min(other.max)
        return this
    }
    translate(tx:number,ty:number){
        this.min.translate(tx,ty)
        this.max.translate(tx,ty)
        return this
    }
    inset(dx:number,dy:number){
        this.min.translate(dx,dy)
        this.max.translate(-dx,-dy)
        return this
    }
    outset(dx:number,dy:number){
        this.inset(-dx,-dy)
        return this
    }
    transform(m: Matrix3|Matrix2D){
        let min = this.min
        let max = this.max
        m.mapPoint(min)
        m.mapPoint(max)
    }
    equals(other: BoundingRect) {
        return this.min.equalsEpsilon(other.min) && this.max.equalsEpsilon(other.max)
    }
}