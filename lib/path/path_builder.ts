import { Point } from "../point";
import { Path, PathVerb } from "./path";
import { AutoConicToQuads } from "./path_geometry";
import { Rect } from "./rect";
import { SCALAR_ROOT_2_OVER_2 } from "./scalar";

export enum PathDirection{
       /// Clockwise direction for adding closed contours.
       CW,
       /// Counter-clockwise direction for adding closed contours.
       CCW,
}
export class PathBuilder{
    static new(){
        const pb=new PathBuilder();
        
        return pb;
    }
    static from_rect(rect:Rect):Path{
        let verbs=[
            PathVerb.Move,
            PathVerb.Line,
            PathVerb.Line,
            PathVerb.Line,
            PathVerb.Close,
        ]
        let points=[
            Point.from_xy(rect.left,rect.top),
            Point.from_xy(rect.right,rect.top),
            Point.from_xy(rect.right,rect.bottom),
            Point.from_xy(rect.left,rect.bottom),
        ]
        let path=new Path()
        path.bounds=rect
        path.verbs=verbs
        path.points=points
        return path
    }
    static from_circle(cx:number,cy:number,radius:number):Path|undefined{
        let  b = PathBuilder.new();
        b.push_circle(cx, cy, radius);
        return b.finish()
    }
    static from_oval(oval: Rect):Path|undefined {
        let  b = PathBuilder.new();
        b.push_oval(oval);
        return b.finish()
    }
    verbs:PathVerb[]=[]
    points:Point[]=[]
    last_move_to_index:number=0;
    move_to_required:boolean=true;  

    reserve(additional_verbs:number,additional_points:number){
      //  this.verbs.length+=additional_verbs
      //  this.points.length+=additional_points
    }
    get len(){
        return this.verbs.length
    }
    get is_empty(){
        return this.verbs.length<=0
    }
    get lastVerb(){
        return this.is_empty?null:this.verbs[this.len-1]
    }
    get lastMovePoint(){
        return this.is_empty?null:this.points[this.last_move_to_index]
    }
    get lastPoint(){
        return this.points.length<=0?null:this.points[this.points.length-1]
    }
    move_to(x:f32,y:f32){
        const lastVerb=this.lastVerb
        if(this.lastVerb===PathVerb.Move){
             let last_idx=this.points.length-1
             this.points[last_idx]=Point.from_xy(x,y)
        }else{
            this.last_move_to_index=this.points.length
            this.move_to_required=false
            this.verbs.push(PathVerb.Move)
            this.points.push(Point.from_xy(x,y))
        }
    }
    inject_move_to_if_needed(){
        if(this.move_to_required){
            if(this.lastMovePoint){
                this.move_to(this.lastMovePoint.x,this.lastMovePoint.y)
            }else{
                this.move_to(0,0)
            }
        }
    }
    line_to(x:f32,y:f32){
        this.inject_move_to_if_needed()
        this.verbs.push(PathVerb.Line)
        this.points.push(Point.from_xy(x,y))
    }
    quad_to(x1:f32,y1:f32,x2:f32,y2:f32){
        this.inject_move_to_if_needed()
        this.verbs.push(PathVerb.Quad)
        this.points.push(Point.from_xy(x1,y1))
        this.points.push(Point.from_xy(x2,y2))
    }
    quad_to_pt(p1:Point,p2:Point){
        this.quad_to(p1.x,p1.y,p2.x,p2.y)
    }
    conic_to(x1:f32,y1:f32,x:f32,y:f32,weight:f32){
        if(!(weight>0)){
            this.line_to(x,y)
        }else if(!Number.isFinite(weight)){
            this.line_to(x1,y1)
            this.line_to(x,y)
        }else if(weight===1){
            this.quad_to(x1,y1,x,y)
        }else{
            this.inject_move_to_if_needed()
            let last=this.lastPoint
            let quader=AutoConicToQuads.compute(last!,Point.from_xy(x1,y1),Point.from_xy(x,y),weight)
            if(quader){
                let offset=1;
                for(let i=0;i<quader.len;i++){
                    let pt1=quader.points[offset+0]
                    let pt2=quader.points[offset+1]
                    this.quad_to(pt1.x,pt1.y,pt2.x,pt2.y)
                    offset+=2

                }
            }
        }
    }
    conic_points_to(pt1:Point,pt2:Point,weight:f32){
        return this.conic_to(pt1.x,pt1.y,pt2.x,pt2.y,weight)
    }
    cubic_to(x1:f32,y1:f32,x2:f32,y2:f32,x:f32,y:f32){
        this.inject_move_to_if_needed()
        this.verbs.push(PathVerb.Cubic)
        this.points.push(Point.from_xy(x1,y1))
        this.points.push(Point.from_xy(x2,y2))
        this.points.push(Point.from_xy(x,y))
    }
    cubic_to_pt(p1:Point,p2:Point,p3:Point){
        this.cubic_to(p1.x,p1.y,p2.x,p2.y,p3.x,p3.y)
    }
    close(){
        if(!this.is_empty){
            if(this.lastVerb!==PathVerb.Close){
                this.verbs.push(PathVerb.Close)
            }
        }
        this.move_to_required=true
    }
    set_last_point(pt:Point){
        if(this.lastPoint){
            this.lastPoint.copy(pt)
        }else{
            this.move_to(pt.x,pt.y)
        }

    }
    is_zero_length_since_point(start_pt_index: usize): bool {
        const self=this;
        let count = self.points.length - start_pt_index;
        if(count < 2) {
            return true;
        }

        let first = self.points[start_pt_index];
        for(let i=1;i<count;i++){
            if (first != self.points[start_pt_index + i]) {
                return false;
            }
        }

       return true
    }
    push_rect(rect: Rect) {
        const self=this;
        self.move_to(rect.left, rect.top);
        self.line_to(rect.right, rect.top);
        self.line_to(rect.right, rect.bottom);
        self.line_to(rect.left, rect.bottom);
        self.close();
    }
  
    push_oval(oval:Rect){
        const self=this
        let cx = oval.left*0.5 + oval.right*0.5;
        let cy = oval.top*0.5 + oval.bottom*0.5;

        let oval_points = [
            Point.from_xy(cx, oval.bottom),
            Point.from_xy(oval.left, cy),
            Point.from_xy(cx, oval.top),
            Point.from_xy(oval.right, cy),
        ];

        let rect_points = [
            Point.from_xy(oval.right, oval.bottom),
            Point.from_xy(oval.left, oval.bottom),
            Point.from_xy(oval.left, oval.top),
            Point.from_xy(oval.right, oval.top),
        ];

        let weight = SCALAR_ROOT_2_OVER_2;
        self.move_to(oval_points[3].x, oval_points[3].y);
        let newPoints=rect_points.map((p,i)=>[p,oval_points[i]])
        for (let [p1,p2] of newPoints) {
            self.conic_points_to(p1,p2, weight);
        }
        self.close();
    }
    push_circle(x:f32,y:f32,r:f32){
        const rect=Rect.from_xywh(x-r,y-r,r+r,r+r)
        if(rect){
            this.push_oval(rect)
        }

    }
     push_path(other: Path) {
        const self=this
        self.last_move_to_index = self.points.length;

        self.verbs.push(...other.verbs);
        self.points.push(...other.points);
    }
    push_path_builder(other: PathBuilder) {
        const self=this;
        if(other.is_empty) {
            return;
        }

        if(self.last_move_to_index != 0) {
            self.last_move_to_index = self.points.length + other.last_move_to_index;
        }

        self.verbs.push(...other.verbs);
        self.points.push(...other.points);
    }
    reverse_path_to(other: PathBuilder) {
        const self=this;
        if(other.is_empty){
            return;
        }

       // debug_assert_eq!(other.verbs[0], PathVerb::Move);

        let  points_offset = other.points.length - 1;
        for(let verb of other.verbs) {
            switch(verb) {
                case PathVerb.Move:{
                    // if the path has multiple contours, stop after reversing the last
                    break;
                }
                case PathVerb.Line: {
                    // We're moving one point back manually, to prevent points_offset overflow.
                    let pt = other.points[points_offset - 1];
                    points_offset -= 1;
                    self.line_to(pt.x, pt.y);
                    break
                }
                case PathVerb.Quad: {
                    let pt1 = other.points[points_offset - 1];
                    let pt2 = other.points[points_offset - 2];
                    points_offset -= 2;
                    self.quad_to(pt1.x, pt1.y, pt2.x, pt2.y);
                    break
                }
                case PathVerb.Cubic:{
                    let pt1 = other.points[points_offset - 1];
                    let pt2 = other.points[points_offset - 2];
                    let pt3 = other.points[points_offset - 3];
                    points_offset -= 3;
                    self.cubic_to(pt1.x, pt1.y, pt2.x, pt2.y, pt3.x, pt3.y);
                    break
                }
                case PathVerb.Close:
                break;
            }
        }
    }

    /// Reset the builder.
    ///
    /// Memory is not deallocated.
    clear() {
        const self=this;
        self.verbs.length=0;
        self.points.length=0;
        self.last_move_to_index = 0;
        self.move_to_required = true;
    }
    finish():Path|undefined{
        if(this.is_empty){
            return
        }
        if(this.verbs.length===1){
            return
        }
        let bounds=Rect.from_points(this.points)
        let path=new Path()
        path._bounds=bounds
        path.verbs=this.verbs
        path.points=this.points
        return path
    }
}