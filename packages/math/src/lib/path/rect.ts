import { Point } from "../point"
import { IntSize } from "./size"
import { Transform } from "./transform"


export class Rect{
    static default(){
        return this.from_xywh(0,0,0,0)
    }
    static from_points(points:Point[]){
        return new Rect().setPoints(points)
    }
    static from_ltrb(left:number,top:number,right:number,bottom:number){
        const rect=new this()
        rect.min.set(left,top)
        rect.max.set(right,bottom)
        return rect
    }
    static from_xywh(x:number,y:number,w:number,h:number){
        const rect=new this()
        rect.min.set(x,y)
        rect.max.set(x+w,y+h)
        return rect
    }
    min=Point.create(Infinity,Infinity)
    max=Point.create(-Infinity,-Infinity)

    constructor(){

    }
    get x(){
        return this.min.x
    }
    get y(){
        return this.max.y
    }
    get left(){
        return this.min.x
    }
    get top(){
        return this.min.y
    }
    get right(){
        return this.max.x;
    }
    get bottom(){
        return this.max.y;
    }
    get width(){
        return this.right-this.left
    }
    get height(){
        return this.bottom-this.top
    }
    copy(source:Rect){
        this.min.copy(source.min)
        this.max.copy(source.max)
        return this;
    }
    clone(){
        return new Rect().copy(this);
    }
    is_empty(){
        return this.left===this.right||this.top===this.bottom;
    }
    contains(x:number,y:number){
        return x>=this.left&&x<=this.right&&y>=this.top&&y<=this.bottom;
    }
    size(){
        return IntSize.from_wh_safe(this.width,this.height)
    }
    to_int_rect(){
        return Rect.from_xywh(this.x>>0,this.y>>0,this.width>>0,this.height>>0)
    }
    round(){
        this.min.round()
        this.max.round()
        return this;
    }
    floor(){
        this.min.floor()
        this.max.floor()
        return this;
    }
    ceil(){
        this.min.ceil()
        this.max.ceil()
        return this;
    }
    intersect(other:Rect){
        this.min.max(other.min)
        this.max.min(other.max)
        return this
    }
    join(other:Rect){
        this.min.min(other.min)
        this.max.max(other.max)
        return this;
    }
    setPoints(points:Point[]){
         points.forEach(p=>{
             this.min.min(p)
             this.max.max(p)
         })
         return this;
    }
    inset(dx:f32,dy:f32){
        this.min.translate(dx,dy)
        this.max.translate(-dx,-dy)
    }
    outset(dx:f32,dy:f32){
        this.inset(-dx,-dy)
    }
    transform(ts:Transform){
        const self=this;
        if(ts.is_identity()){
            return this
        }else if(ts.has_skew()){
            let lt = Point.from_xy(self.left, self.top);
            let rt = Point.from_xy(self.right, self.top);
            let lb = Point.from_xy(self.left, self.bottom);
            let rb = Point.from_xy(self.right, self.bottom);
            let  pts = [lt, rt, lb, rb];
            ts.map_points(pts);
            return Rect.from_points(pts)
        }
        return this;
    }

}