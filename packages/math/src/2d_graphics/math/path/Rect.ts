import { Vector2, Vector2Like } from "../Vector2"

export class PointIterator<T = any> {
    length = 0
    private advance = 1
    private _currentIndex = 0
    data: T[] = []
    constructor(data: T[], length: number = data.length, ccw: boolean = false, startIndex = 0) {
        this.data = data
        this.length = length
        this.advance = ccw ? -1 : 1
        this._currentIndex = Math.floor(startIndex) % length
    }
    get current() {
        return this.data[this._currentIndex]
    }
    get(index = 0) {
        const curIndex = (this._currentIndex +(index*this.advance)) % this.length
        return this.data[curIndex]
    }
    next(moveIndex=0) {
        this._currentIndex = (this._currentIndex + this.advance+(moveIndex*this.advance)) % this.length
        return this.current
    }
}
export class OvalPointIterator extends PointIterator<Vector2>{
    constructor(oval:Rect,ccw: boolean = false, startIndex = 0) {
        super([
            Vector2.create(oval.cx, oval.top),
            Vector2.create(oval.right, oval.cy),
            Vector2.create(oval.cx, oval.bottom),
            Vector2.create(oval.left, oval.cy),
        ],4,ccw,startIndex)
    }
}
export class RectPointIterator extends PointIterator<Vector2>{
    constructor(rect:Rect,ccw: boolean = false, startIndex = 0) {
        super([
            Vector2.create(rect.left, rect.top),
            Vector2.create(rect.right, rect.top),
            Vector2.create(rect.right, rect.bottom),
            Vector2.create(rect.left, rect.bottom),
        ],4,ccw,startIndex)
    }
}
export class Rect{
    static default(){
        return this.fromLTRB(0,0,0,0)
    }
    static from(pt:{x:number,y:number}, size:{width:number, height:number}) {
        return this.fromXYWH(pt.x,pt.x,size.width, size.height)
    }
    static fromXYWH(x:number, y:number, width:number, height:number) {
        return new Rect(x, y, x + width, y + height)
    }
    static fromLTRB(left:number, top:number, right:number, bottom:number) {
        return new Rect(left, top, right, bottom)
    }
    left: number=0
    top: number=0
    right: number=0
    bottom: number=0
    constructor(left: number=0, top: number=0, right: number=0, bottom: number=0) {
        this.left = left
        this.top = top
        this.right = right
        this.bottom = bottom
    }
    get x(){
        return this.left
    }
    get y(){
        return this.top
    }
    get width(){
        return this.right - this.left
    }
    get height(){
        return this.bottom - this.top
    }
    get halfWidth(){
        return this.width *0.5
    }
    get halfHeight(){
        return this.height *0.5
    }
    get cx(){
        return (this.left + this.right) / 2
    }
    get cy(){
        return (this.top + this.bottom) / 2
    }
    isEmpty(){
        return !(this.left<this.right && this.top<this.bottom)
    }
    copy(source:Rect){
        this.left = source.left
        this.top = source.top
        this.right = source.right
        this.bottom = source.bottom
        return this
    }
    clone(){
        return new Rect(this.left, this.top, this.right, this.bottom)
    }
    offset(dx: number, dy: number) {
        this.left += dx
        this.right += dx
        this.top += dy
        this.bottom += dy
        return this
    }
    isSorted()  { return this.left <= this.right && this.top <= this.bottom; }
    isFinite(){
        let accum = 0;
        accum *= this.left;
        accum *= this.top;
        accum *= this.right;
        accum *= this.bottom;
        return Number.isFinite(accum);
    }
     makeSorted() {
        const fLeft=this.left,fRight=this.right,fTop=this.top,fBottom=this.bottom;
        return  Rect.fromLTRB(Math.min(fLeft, fRight), Math.min(fTop, fBottom),
                        Math.max(fLeft, fRight), Math.max(fTop, fBottom));
    }
}