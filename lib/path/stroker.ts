import {Point} from '../point'
import { StrokeDash } from './dash';
import { Path } from './path';
import { PathBuilder } from './path_builder';
import { Transform } from './transform';
export enum LineCap {
    /// No stroke extension.
    Butt,
    /// Adds circle.
    Round,
    /// Adds square.
    Square,
}
export enum LineJoin {
    /// Extends to miter limit, then switches to bevel.
    Miter,
    /// Extends to miter limit, then clips the corner.
    MiterClip,
    /// Adds circle.
    Round,
    /// Connects outside edges.
    Bevel,
}
export enum StrokeType {
    Outer = 1, // use sign-opposite values later to flip perpendicular axis
    Inner = -1,
}
enum ResultType {
    Split,      // the caller should split the quad stroke in two
    Degenerate, // the caller should add a line
    Quad,       // the caller should (continue to try to) add a quad stroke
}

export class Stroke{
    width:number=1
    miter_limit:number=4
    line_cap:LineCap=LineCap.Butt
    line_join:LineJoin=LineJoin.Miter
    dash?:StrokeDash

}

class SwappableBuilders{

}
type CapProc=(pivot:Point,normal:Point,stop:Point,other_path?:PathBuilder,path:PathBuilder)=>void

type JoinProc = (
    before_unit_normal: Point,
    pivot: Point,
    after_unit_normal: Point,
    radius: f32,
    inv_miter_limit: f32,
    prev_is_line: bool,
    curr_is_line: bool,
    builders: SwappableBuilders,
)=>void;

export class PathStroker{
    static default(){
        return new this()
    }
    static new(){
        const instance=new PathStroker()
        Object.assign(instance,{

        })
        return 
    }

    static compute_resolution_scale(ts:Transform):number{
        let sx=Point.from_xy(ts.sx,ts.kx).length()
        let sy=Point.from_xy(ts.ky,ts.sy).length()
        if(Number.isFinite(sx)&&Number.isFinite(sy)){
            let scale=Math.max(sx,sy)
            if(scale>0){
                return scale
            }
        }
        return 1;
    }
    radius:f32=0
    inv_miter_limit:f32=0
    res_scale:f32=1
    inv_res_scale:f32=1
    inv_res_scale_squared:f32=1
    
    first_normal:Point=Point.zero()
    prev_normal:Point=Point.zero()
    first_unit_normal:Point=Point.zero()
    prev_unit_normal:Point=Point.zero()

    first_pt:Point=Point.zero()
    prev_pt:Point=Point.zero()

    first_outer_pt:Point=Point.zero()
    first_outer_pt_index_in_contour:number=0
    segment_count:i32=0
    prev_is_line:bool=false

    capper?:CapProc
    joiner?:JoinProc

    inner?:PathBuilder
    outer?:PathBuilder
    cusper?:PathBuilder

    stroke_type:StrokeType=StrokeType.Outer

    recursion_depth:i32=0
    found_tangents:bool=false
    join_completed:bool=false

    stroke(path:Path,stroke:Stroke,resolution_scale:f32){
        let width=stroke.width
        this.stroke_inner(path,width,stroke.miter_limit,stroke.line_cap,stroke.line_join,resolution_scale)
    }
    stroke_inner(path:Path,width:f32,miter_limit:f32,line_cap:LineCap,line_join:LineJoin,resolution_scale:f32){
        let inv_miter_limit=0;
        
    }
}