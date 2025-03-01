import {Vector2} from './vec2'
enum RRect_Type {
    kEmpty_Type,                     //!< zero width or height
    kRect_Type,                      //!< non-zero width and height, and zeroed radii
    kOval_Type,                      //!< non-zero width and height filled with radii
    kSimple_Type,                    //!< non-zero width and height with equal radii
    kNinePatch_Type,                 //!< non-zero width and height with axis-aligned radii
    kComplex_Type,                   //!< non-zero width and height with arbitrary radii
    kLastType       = kComplex_Type, //!< largest Type value
};

export class Rect{
    static default(){
        return new this(0,0,0,0)
    }
    static fromWH(width:number,height:number):Rect{
        return this.fromXYWH(0,0,width,height)
    }
    static fromLTRB(left:number,top:number,right:number,bottom:number):Rect{
        return new Rect(left,top,right,bottom)
    }
     static fromXYWH(x:number,y:number,width:number,height:number):Rect{
        return  this.fromLTRB(x,y,x+width,y+height)
     }
     constructor(public left:number,public top:number,public right:number,public bottom:number){

     }
     get width():number{
        return this.right-this.left
     }
     get height():number{
        return this.bottom-this.top
     }
     get x(){
        return this.left
     }
     get y(){
        return this.top
     }
     get cx(){
        return (this.left+this.right)/2
     }
     get cy(){
        return (this.top+this.bottom)/2
     }
     sort(){
        if(this.left>this.right){
            let temp=this.left;
            this.left=this.right;
            this.right=temp;
        }
        if(this.top>this.bottom){
            let temp=this.top;
            this.top=this.bottom;
            this.bottom=temp;
        }
     }
     clone(){
        return new Rect(this.left,this.top,this.right,this.bottom)
     }
     contains(x:number,y:number):boolean{
        return x>=this.left&&x<=this.right&&y>=this.top&&y<=this.bottom
     }
     containsRect(r:Rect):boolean{
        return this.left<=r.left&&this.top<=r.top&&this.right>=r.right&&this.bottom>=r.bottom
     }
     intersection(r:Rect):Rect{
        return new Rect(Math.max(this.left,r.left),Math.max(this.top,r.top),Math.min(this.right,r.right),Math.min(this.bottom,r.bottom))
     }
     union(r:Rect):Rect{
        return new Rect(Math.min(this.left,r.left),Math.min(this.top,r.top),Math.max(this.right,r.right),Math.max(this.bottom,r.bottom))
     }
     inset(dx:number,dy:number):Rect{
        return new Rect(this.left+dx,this.top+dy,this.right-dx,this.bottom-dy)
     }
     reset(){
        this.left=0;
        this.top=0;
        this.right=0;
        this.bottom=0;
     }
     setPoints(points:{x:number,y:number}[]){
        this.left=Infinity;
        this.top=Infinity;
        this.right=-Infinity;
        this.bottom=-Infinity;
        for(let point of points){
            this.left=Math.min(this.left,point.x);
            this.top=Math.min(this.top,point.y);
            this.right=Math.max(this.right,point.x);
            this.bottom=Math.max(this.bottom,point.y);
        }
     }
     isEmpty():boolean{
        return !(this.left < this.right && this.top < this.bottom);
     }
     
     inflate(dx:number,dy:number){
        this.left-=dx;
        this.top-=dy;
        this.right+=dx;
        this.bottom+=dy;
     }
     isFinite(){
        return isFinite(this.left) && isFinite(this.top) && isFinite(this.right) && isFinite(this.bottom);
     }
     makeSorted(){
        return Rect.fromLTRB(Math.min(this.left,this.right),Math.min(this.top, this.bottom),
        Math.max(this.left,this.right),Math.max(this.top,this.bottom));
    }
}

export class RRect{
    rect=Rect.default()
    radii=[Vector2.default(),Vector2.default(),Vector2.default(),Vector2.default()]
    type:RRect_Type=RRect_Type.kEmpty_Type;
    getType(){
        return this.type
    }
    isEmpty()  { return RRect_Type.kEmpty_Type == this.type; }
    isRect()  { return RRect_Type.kRect_Type == this.type; }
    isOval()  { return RRect_Type.kOval_Type == this.type; }
    isSimple()  { return RRect_Type.kSimple_Type == this.type; }
    isNinePatch()  { return RRect_Type.kNinePatch_Type == this.type; }
    isComplex()  { return RRect_Type.kComplex_Type == this.type; }
    width()  { return this.rect.width; }
    height()  { return this.rect.height; }

    initializeRect(rect:Rect) {
        // Check this before sorting because sorting can hide nans.
        if (!rect.isFinite()) {
            return false;
        }
        this.rect = rect.makeSorted();
        if (this.rect.isEmpty()) {
            this.radii.forEach(d=>{
                d.set(0,0)
            })
            this.type = RRect_Type.kEmpty_Type;
            return false;
        }
        return true;
    }
}