import { Point } from "../point"
import { PathBuilder } from "./path_builder"
import * as path_geometry from "./path_geometry"
import { Rect } from "./rect"
import { Transform } from "./transform"

export enum PathVerb {
    Move,
    Line,
    Quad,
    Cubic,
    Close,
}

export class Path {
    verbs: PathVerb[] = []
    points: Point[] = []
    _bounds: Rect = Rect.default()

    get len() {
        return this.verbs.length
    }
    get is_empty() {
        return this.verbs.length <= 0
    }
    get bounds() {
        return this._bounds
    }
    set bounds(value: Rect) {
        this._bounds = value
    }

    compute_tight_bounds() {
        let extremas = Array.from({ length: 5 }, () => Point.zero())
        let min = this.points[0]
        let max = this.points[0]
        let iter = this.segments()
        let last_point=Point.zero()
        for(let segment of iter) {
            let count=0
            switch(segment.type) {
                case PathSegment.MoveTo:{
                    extremas[0].copy(segment.p0!)
                    count=1;
                    break;
                    
                }
                case PathSegment.LineTo:{
                    extremas[0].copy(segment.p0!)
                    count=1;
                    break;
                }
                case PathSegment.QuadTo:{
                    count=compute_quad_extremas(last_point,segment.p0!,segment.p1!,extremas)
                    break;
                }
                case PathSegment.MoveTo:{
                    count=compute_cubic_extremas(last_point,segment.p0!,segment.p1!,segment.p2!,extremas)
                    break;
                }
                case PathSegment.Close:
                    break
            }
            last_point.copy(iter.last_point)
            extremas.forEach(p=>{
                 min.min(p)
                 max.max(p)
            })
        }
        return Rect.from_ltrb(min.x,min.y,max.x,max.y)

    }
    transform(ts: Transform) {
        if (ts.is_identity()) {
            return this
        }
        ts.map_points(this.points)
        this._bounds = Rect.from_points(this.points)
        return this;
    }
    segments(): PathSegmentsIter {
        const p=new PathSegmentsIter()
        p.path=this
        p.verb_index=0
        p.points_index=0
        p.is_auto_close=false
        p.last_move_to=Point.zero()
        p.last_point=Point.zero()
        return p;
    }
    clear():PathBuilder{
        this.verbs.length=0
        this.points.length=0
        let p=new PathBuilder()
        p.verbs=[]
        p.points=[]
        p.last_move_to_index=0
        p.move_to_required=true
        return p;
    }
    clone() {
        return new Path()
    }
}
class PathSegment {
    static MoveTo = 1
    static LineTo = 2
    static QuadTo = 3
    static CubicTo = 4
    static Close = 5
    static createMoveTo(p: Point) {
        return new PathSegment(PathSegment.MoveTo, p)
    }
    static createLineTO(p: Point) {
        return new PathSegment(PathSegment.LineTo, p)
    }
    static createQuadTo(p0: Point, p1: Point) {
        return new PathSegment(PathSegment.QuadTo, p0, p1)
    }
    static createCubicTo(p0: Point, p1: Point, p2: Point) {
        return new PathSegment(PathSegment.CubicTo, p0, p1, p2)
    }
    static createClose() {
        return new PathSegment(PathSegment.Close)
    }
    constructor(public type: number, public p0?: Point, public p1?: Point, public p2?: Point) {
    }
}
export class PathSegmentsIter {
    path!: Path
    verb_index: number = 0
    points_index: number = 0
    is_auto_close: bool = false
    last_move_to: Point = Point.default()
    last_point: Point = Point.default()

    copy(source: PathSegmentsIter) {
        this.path = source.path
        this.verb_index = source.verb_index
        this.points_index = source.points_index
        this.is_auto_close = source.is_auto_close
        this.last_move_to = source.last_move_to
        this.last_point = source.last_point
        return this;
    }
    clone() {
        return new PathSegmentsIter().copy(this)
    }
    set_uato_close(flag: bool) {
        this.is_auto_close = flag
    }
    auto_close(): PathSegment {
        if (this.is_auto_close && this.last_point !== this.last_move_to) {
            this.verb_index -= 1;
            return PathSegment.createLineTO(this.last_move_to)
        } else {
            return PathSegment.createClose()
        }
    }
    has_valid_tangent() {
        let iter = this.clone()
        for(let segment of iter){
            switch(segment.type){
                case PathSegment.MoveTo:
                    return false
                case PathSegment.LineTo:
                    if(iter.last_point==segment.p0){
                        continue
                    }
                    return true
                case PathSegment.QuadTo:
                    if(iter.last_point==segment.p0&&iter.last_point==segment.p1){
                        continue
                    }
                    return true;
                case PathSegment.CubicTo:
                    if(iter.last_point==segment.p0&&iter.last_point==segment.p1&&iter.last_point==segment.p2){
                        continue
                    }
                    return true;
                case PathSegment.Close:
                return false
            }
        }
    };
    get curr_verb(){
        return this.path.verbs[this.verb_index-1]
    }
    get next_verb(){
        return this.path.verbs[this.verb_index]
    }
    *[Symbol.iterator]() {
        while (this.verb_index < this.path.verbs.length) {
            let verb = this.path.verbs[this.verb_index]
            this.verb_index += 1
            switch (verb) {
                case PathVerb.Move:
                    this.points_index += 1
                    this.last_move_to = this.path.points[this.points_index - 1]
                    this.last_point = this.last_move_to
                    yield PathSegment.createMoveTo(this.last_move_to)
                    break;
                case PathVerb.Line:
                    this.points_index += 1
                    this.last_point = this.path.points[this.points_index - 1]

                    yield PathSegment.createLineTO(this.last_point)
                    break;
                case PathVerb.Quad:
                    this.points_index += 2
                    this.last_point = this.path.points[this.points_index - 1]
                    yield PathSegment.createQuadTo(this.path.points[this.points_index - 2], this.last_point)
                    break;
                case PathVerb.Cubic:
                    this.points_index += 3
                    this.last_point = this.path.points[this.points_index - 1]
                    yield PathSegment.createCubicTo(this.path.points[this.points_index - 3], this.path.points[this.points_index - 2], this.last_point)
                    break;
                case PathVerb.Close:
                    let seg=this.auto_close()
                    this.last_point=this.last_move_to
                    yield seg
                    break;
            }
        }
    }
}

function compute_quad_extremas(p0:Point,p1:Point,p2:Point,extremas:Point[]){

    let src = [p0, p1, p2];
    let  extrema_idx = 0;
    let t= path_geometry.find_quad_extrema(p0.x, p1.x, p2.x)
    if(t!==undefined) {
        extremas[extrema_idx] = path_geometry.eval_quad_at(src, t);
        extrema_idx += 1;
    }
    t=path_geometry.find_quad_extrema(p0.y, p1.y, p2.y) 
    if(t!==undefined){
        extremas[extrema_idx] = path_geometry.eval_quad_at(src, t);
        extrema_idx += 1;
    }
    extremas[extrema_idx] = p2;
    return extrema_idx + 1
}

function compute_cubic_extremas(
    p0: Point,
    p1: Point,
    p2: Point,
    p3: Point,
    extremas:Point[]
):usize {
  
    let  ts0 = path_geometry.new_t_values();
    let  ts1 = path_geometry.new_t_values();
    let n0 = path_geometry.find_cubic_extrema(p0.x, p1.x, p2.x, p3.x, ts0);
    let n1 = path_geometry.find_cubic_extrema(p0.y, p1.y, p2.y, p3.y,  ts1);
    let total_len = n0 + n1;
  //  debug_assert!(total_len <= 4);

    let src = [p0, p1, p2, p3];
    let  extrema_idx = 0;
    let _arr=ts0.slice(0,n0)
    for(let t of _arr) {
        extremas[extrema_idx] = path_geometry.eval_cubic_pos_at(src, t);
        extrema_idx += 1;
    }
     _arr=ts0.slice(0,n1)
    for(let t of _arr) {
        extremas[extrema_idx] = path_geometry.eval_cubic_pos_at(src, t);
        extrema_idx += 1;
    }
    extremas[total_len] = p3;
    return total_len + 1
}
