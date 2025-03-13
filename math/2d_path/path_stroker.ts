import { Matrix2D } from "../math/mat2d"
import { Vector2 } from "../math/vec2"
import { Path } from './path'
import { SkConic,findCubicInflections } from './geometry'
type f32 = number
type bool = boolean
type u32 = number
type usize = number
type NormalizedF32=number
type NonZeroPositiveF32 = number // 比须大于0
type Option<T> = T | undefined
const SCALAR_NEARLY_ZERO: f32 = 1.0 / (1 << 12) as f32;


 enum PathDirection {
    /// Clockwise direction for adding closed contours.
    CW,
    /// Counter-clockwise direction for adding closed contours.
    CCW,
}
enum ReductionType {
    Point,       // all curve points are practically identical
    Line,        // the control point is on the line between the ends
    Quad,        // the control point is outside the line between the ends
    Degenerate,  // the control point is on the line but outside the ends
    Degenerate2, // two control points are on the line but outside ends (cubic)
    Degenerate3, // three areas of max curvature found (for cubic)
}
enum AngleType {
    Nearly180,
    Sharp,
    Shallow,
    NearlyLine,
}

function dot_to_angle_type(dot: f32):AngleType {
    if (dot >= 0.0) {
        // shallow or line
        if (Math.abs(1.0 - dot)<=1e-6) {
            return AngleType.NearlyLine
        } else {
            return AngleType.Shallow
        }
    } else {
        // sharp or 180
        if (Math.abs(1.0 + dot)<=1e-6) {
            return AngleType.Nearly180
        } else {
            return  AngleType.Sharp
        }
    }
}

const butt_capper: CapProc = (pivot: Vector2,
    normal: Vector2,
    stop: Vector2,
    other_path: Path|undefined,
    path: Path) => {
    path.lineTo(stop.x, stop.y);
}

const round_capper: CapProc = (pivot: Vector2,
    normal: Vector2,
    stop: Vector2,
    other_path:  Path|undefined,
    path: Path) => {
    const SCALAR_ROOT_2_OVER_2: f32 = 0.707106781;
    let parallel = normal.clone();
    parallel.rotateCW();

    let projected_center = pivot.clone().add(parallel);

    path.conicTo(
        projected_center.clone().add(normal),
        projected_center,
        SCALAR_ROOT_2_OVER_2,
    );
    path.conicTo(projected_center.clone().sub(normal), stop, SCALAR_ROOT_2_OVER_2);
}
const square_capper: CapProc = (pivot: Vector2,
    normal: Vector2,
    stop: Vector2,
    other_path: Path | null | undefined,
    path: Path) => {
    let parallel = normal.clone();
    parallel.rotateCW();

    if (other_path) {
        path.lastPoint.copy(Vector2.create(
            pivot.x + normal.x + parallel.x,
            pivot.y + normal.y + parallel.y,
        ));
        path.lineTo(
            pivot.x - normal.x + parallel.x,
            pivot.y - normal.y + parallel.y,
        );
    } else {
        path.lineTo(
            pivot.x + normal.x + parallel.x,
            pivot.y + normal.y + parallel.y,
        );
        path.lineTo(
            pivot.x - normal.x + parallel.x,
            pivot.y - normal.y + parallel.y,
        );
        path.lineTo(stop.x, stop.y);
    }
}

const miter_joiner: JoinProc = (before_unit_normal: Vector2,
    pivot: Vector2,
    after_unit_normal: Vector2,
    radius: f32,
    inv_miter_limit: f32,
    prev_is_line: bool,
    curr_is_line: bool,
    builders: SwappableBuilders) => {
        miter_joiner_inner(
            before_unit_normal,
            pivot,
            after_unit_normal,
            radius,
            inv_miter_limit,
            false,
            prev_is_line,
            curr_is_line,
            builders,
        );
}

function miter_joiner_inner(
    before_unit_normal: Vector2,
    pivot: Vector2,
    after_unit_normal: Vector2,
    radius: f32,
    inv_miter_limit: f32,
    miter_clip: bool,
    prev_is_line: bool,
    curr_is_line: bool,
    builders: SwappableBuilders,
) {
    const do_blunt_or_clipped=(
        builders: SwappableBuilders,
        pivot: Vector2,
        radius: f32,
        prev_is_line: bool,
        curr_is_line: bool,
         before: Vector2,
         mid: Vector2,
         after: Vector2,
        inv_miter_limit: f32,
        miter_clip: bool,
    )=>{
        after.multiplyScalar(radius);

        if (miter_clip) {
            mid.normalize();

            let cos_beta = before.dot(mid);
            let sin_beta = before.cross(mid);

            let x =0
            if(Math.abs(sin_beta) <= SCALAR_NEARLY_ZERO) {
                x=1.0 / inv_miter_limit
            } else {
                x=((1.0 / inv_miter_limit) - cos_beta) / sin_beta
            };

            before.multiplyScalar(radius);

            let  before_tangent = before.clone();
            before_tangent.rotateCW();

            let  after_tangent = after.clone();
            after_tangent.rotateCCW();

            let c1 = pivot.clone().add(before).add(before_tangent.clone().multiplyScalar(x))
            let c2 = pivot.clone().add(after).add(after_tangent.clone().multiplyScalar(x))

            if(prev_is_line) {
                builders.outer.lastPoint.copy(c1);
            } else {
                builders.outer.lineTo(c1.x, c1.y);
            }

            builders.outer.lineTo(c2.x, c2.y);
        }

        if (!curr_is_line) {
            builders.outer.lineTo(pivot.x + after.x, pivot.y + after.y);
        }

        handle_inner_join(pivot, after, builders.inner);
    }

    const do_miter=(
        builders: SwappableBuilders,
        pivot: Vector2,
        radius: f32,
        prev_is_line: bool,
        curr_is_line: bool,
        mid: Vector2,
         after: Vector2,
    )=>{
        after.multiplyScalar(radius);

        if(prev_is_line) {
            builders
                .outer
                .lastPoint.copy(Vector2.create(pivot.x + mid.x, pivot.y + mid.y));
        } else {
            builders.outer.lineTo(pivot.x + mid.x, pivot.y + mid.y);
        }

        if(!curr_is_line ){
            builders.outer.lineTo(pivot.x + after.x, pivot.y + after.y);
        }

        handle_inner_join(pivot, after, builders.inner);
    }

    // negate the dot since we're using normals instead of tangents
    let dot_prod = before_unit_normal.dot(after_unit_normal);
    let angle_type = dot_to_angle_type(dot_prod);
    let  before = before_unit_normal.clone();
    let  after = after_unit_normal.clone();
    let  mid:Vector2;

    if (angle_type == AngleType.NearlyLine) {
        return;
    }

    if (angle_type == AngleType.Nearly180) {
        curr_is_line = false;
        mid = (after.clone().sub(before)).multiplyScalar(radius / 2.0);
        do_blunt_or_clipped(
            builders,
            pivot,
            radius,
            prev_is_line,
            curr_is_line,
            before,
            mid,
            after,
            inv_miter_limit,
            miter_clip,
        );
        return;
    }

    let ccw = !before.isClockwise(after);
    if(ccw) {
        builders.swap();
        before.negate();
        after.negate();
    }
     const SCALAR_ROOT_2_OVER_2: f32 = 0.707106781;
    // Before we enter the world of square-roots and divides,
    // check if we're trying to join an upright right angle
    // (common case for stroking rectangles). If so, special case
    // that (for speed an accuracy).
    // Note: we only need to check one normal if dot==0
    if (dot_prod == 0.0 && inv_miter_limit <= SCALAR_ROOT_2_OVER_2) {
        mid = (before.clone().add(after)).multiplyScalar(radius);
        do_miter(
            builders,
            pivot,
            radius,
            prev_is_line,
            curr_is_line,
            mid,
            after,
        );
        return;
    }

    // choose the most accurate way to form the initial mid-vector
    if (angle_type == AngleType.Sharp) {
        mid = Vector2.create(after.y - before.y, before.x - after.x);
        if(ccw) {
            mid.negate();
        }
    } else {
        mid = Vector2.create(before.x + after.x, before.y + after.y);
    }

    // midLength = radius / sinHalfAngle
    // if (midLength > miterLimit * radius) abort
    // if (radius / sinHalf > miterLimit * radius) abort
    // if (1 / sinHalf > miterLimit) abort
    // if (1 / miterLimit > sinHalf) abort
    // My dotProd is opposite sign, since it is built from normals and not tangents
    // hence 1 + dot instead of 1 - dot in the formula
    let sin_half_angle = Math.sqrt((1.0 + dot_prod)*0.5);
    if (sin_half_angle < inv_miter_limit) {
        curr_is_line = false;
        do_blunt_or_clipped(
            builders,
            pivot,
            radius,
            prev_is_line,
            curr_is_line,
            before,
            mid,
            after,
            inv_miter_limit,
            miter_clip,
        );
        return;
    }

    mid.setLength(radius / sin_half_angle);
    do_miter(
        builders,
        pivot,
        radius,
        prev_is_line,
        curr_is_line,
        mid,
        after,
    );
}

function set_normal_unit_normal(
    before: Vector2,
    after: Vector2,
    scale: f32,
    radius: f32,
    normal: Vector2,
    unit_normal:Vector2,
):bool {
    if (!unit_normal.setNormalize((after.x - before.x) * scale, (after.y - before.y) * scale) ){
        return false;
    }

    unit_normal.rotateCCW();
    normal.copy(unit_normal.multiplyScalar(radius))
   return true
}

function set_normal_unit_normal2(
    vec: Vector2,
    radius: f32,
    normal: Vector2,
    unit_normal:Vector2,
):bool {
    if (!unit_normal.setNormalize(vec.x, vec.y)) {
        return false;
    }

    unit_normal.rotateCCW();
    normal.copy( unit_normal.multiplyScalar(radius));
    return true
}


const miter_clip_joiner: JoinProc = (before_unit_normal: Vector2,
    pivot: Vector2,
    after_unit_normal: Vector2,
    radius: f32,
    inv_miter_limit: f32,
    prev_is_line: bool,
    curr_is_line: bool,
    builders: SwappableBuilders) => {
        miter_joiner_inner(
            before_unit_normal,
            pivot,
            after_unit_normal,
            radius,
            inv_miter_limit,
            true,
            prev_is_line,
            curr_is_line,
            builders,
        );
}


const round_joiner: JoinProc = (before_unit_normal: Vector2,
    pivot: Vector2,
    after_unit_normal: Vector2,
    radius: f32,
    inv_miter_limit: f32,
    prev_is_line: bool,
    curr_is_line: bool,
    builders: SwappableBuilders) => {
        let dot_prod = before_unit_normal.dot(after_unit_normal);
        let angle_type = dot_to_angle_type(dot_prod);
    
        if(angle_type == AngleType.NearlyLine){
            return;
        }
    
        let  before = before_unit_normal;
        let  after = after_unit_normal;
        let  dir = PathDirection.CW;
    
        if (!(before.isClockwise(after))) {
            builders.swap();
            before.negate()
            after.negate()
            dir = PathDirection.CCW;
        }
    
        let ts = Matrix2D.fromRows(radius, 0.0, 0.0, radius, pivot.x, pivot.y);
    
        let  conics =SkConic.make(5);
        let conics_count= SkConic.BuildUnitArc(before, after, dir as any, ts,conics);
        if (conics) {
            for(let i=0;i<conics_count;i++){
                let conic=conics[i]
                builders
                    .outer
                    .conicTo(conic.fPts[1].x,conic.fPts[1].y, conic.fPts[2].x,conic.fPts[2].y, conic.fW);
            }
    
            after.multiplyScalar(radius);
            handle_inner_join(pivot, after, builders.inner);
        }
}


const bevel_joiner: JoinProc = (before_unit_normal: Vector2,
    pivot: Vector2,
    after_unit_normal: Vector2,
    radius: f32,
    inv_miter_limit: f32,
    prev_is_line: bool,
    curr_is_line: bool,
    builders: SwappableBuilders) => {
    let  after = after_unit_normal.clone().multiplyScalar(radius);

    if (!(before_unit_normal.isClockwise(after_unit_normal))) {
        builders.swap();
        after.negate();
    }

    builders.outer.lineTo(pivot.x + after.x, pivot.y + after.y);
    handle_inner_join(pivot, after, builders.inner);
}
function handle_inner_join(pivot: Vector2, after: Vector2, inner: Path) {
    // In the degenerate case that the stroke radius is larger than our segments
    // just connecting the two inner segments may "show through" as a funny
    // diagonal. To pseudo-fix this, we go through the pivot Vector2. This adds
    // an extra Vector2/edge, but I can't see a cheap way to know when this is
    // not needed :(
    inner.lineTo(pivot.x, pivot.y);

    inner.lineTo(pivot.x - after.x, pivot.y - after.y);
}

enum LineCap {
    /// No stroke extension.
    Butt,
    /// Adds circle.
    Round,
    /// Adds square.
    Square,
}
enum LineJoin {
    /// Extends to miter limit, then switches to bevel.
    Miter,
    /// Extends to miter limit, then clips the corner.
    MiterClip,
    /// Adds circle.
    Round,
    /// Connects outside edges.
    Bevel,
}
enum StrokeType {
    Outer = 1, // use sign-opposite values later to flip perpendicular axis
    Inner = -1,
}
type CapProc = (
    pivot: Vector2,
    normal: Vector2,
    stop: Vector2,
    other_path: Path|undefined,
    path: Path,
) => void
type JoinProc = (
    before_unit_normal: Vector2,
    pivot: Vector2,
    after_unit_normal: Vector2,
    radius: number,
    inv_miter_limit: number,
    prev_is_line: boolean,
    curr_is_line: bool,
    builders: SwappableBuilders,
) => void

class SwappableBuilders {
    static default() {
        return new this()
    }
    inner: Path = Path.default()
    outer: Path = Path.default()

    swap(): void {
        const tmp = this.inner
        this.inner = this.outer
        this.outer = tmp
    }

}
export class Stroke {
    static default() {
        return new Stroke()
    }
    /// A stroke thickness.
    ///
    /// Must be >= 0.
    ///
    /// When set to 0, a hairline stroking will be used.
    ///
    /// Default: 1.0
    width: number = 1

    /// The limit at which a sharp corner is drawn beveled.
    ///
    /// Default: 4.0
    miter_limit: number = 4

    /// A stroke line cap.
    ///
    /// Default: Butt
    line_cap: LineCap = LineCap.Butt

    /// A stroke line join.
    ///
    /// Default: Miter
    line_join: LineJoin = LineJoin.Miter

    /// A stroke dashing properties.
    ///
    /// Default: None
    //  dash: Option<StrokeDash>,
    constructor() {

    }
}
function cap_factory(cap: LineCap): CapProc {
    const cap_map = {
        [LineCap.Butt]: butt_capper,
        [LineCap.Round]: round_capper,
        [LineCap.Square]: square_capper,
    }
    return cap_map[cap]
}
function join_factory(join: LineJoin): JoinProc {
    const join_map = {
        [LineJoin.Miter]: miter_joiner,
        [LineJoin.MiterClip]: miter_clip_joiner,
        [LineJoin.Round]: round_joiner,
        [LineJoin.Bevel]: bevel_joiner,
    }
    return join_map[join]
}

export class PathStroker {
    static default() {
        return new this()
    }
    radius = 0
    inv_miter_limit = 0
    res_scale = 1
    inv_res_scale = 1
    inv_res_scale_squared = 1

    first_normal = Vector2.zero()
    prev_normal = Vector2.zero()
    first_unit_normal = Vector2.zero()
    prev_unit_normal = Vector2.zero()

    first_pt = Vector2.zero()
    prev_pt = Vector2.zero()

    first_outer_pt = Vector2.zero()
    first_outer_pt_index_in_contour = 0
    segment_count = -1
    prev_is_line = false

    capper = butt_capper
    joiner = miter_joiner

    inner = Path.default()
    outer = Path.default()
    cusper = Path.default()

    stroke_type = StrokeType.Outer

    recursion_depth = 0
    found_tangents = false
    join_completed = false

    compute_resolution_scale(ts: Matrix2D): number {
        let sx = Vector2.create(ts.a, ts.c).length();
        let sy = Vector2.create(ts.b, ts.d).length();
        if (Number.isFinite(sx) && Number.isFinite(sy)) {
            let scale = Math.max(sx, sy);
            if (scale > 0.0) {
                return scale;
            }
        }
        return 1
    }
    stroke(path: Path, stroke: Stroke, resolution_scale: f32) {
        let width = stroke.width
        return this.stroke_inner(
            path,
            width,
            stroke.miter_limit,
            stroke.line_cap,
            stroke.line_join,
            resolution_scale,
        )
    }
    stroke_inner(
        path: Path,
        width: NonZeroPositiveF32,
        miter_limit: f32,
        line_cap: LineCap,
        line_join: LineJoin,
        res_scale: f32,
    ) {
        // TODO: stroke_rect optimization
        const self = this
        let inv_miter_limit = 0.0;

        if (line_join == LineJoin.Miter) {
            if (miter_limit <= 1.0) {
                line_join = LineJoin.Bevel;
            } else {
                inv_miter_limit = 1 / miter_limit;
            }
        }

        if (line_join == LineJoin.MiterClip) {
            inv_miter_limit = 1 / miter_limit
        }

        self.res_scale = res_scale;
        // The '4' below matches the fill scan converter's error term.
        self.inv_res_scale = 1 / (res_scale * 4.0);
        self.inv_res_scale_squared = Math.sqrt(self.inv_res_scale)

        self.radius = width * 0.5;
        self.inv_miter_limit = inv_miter_limit;

        self.first_normal = Vector2.zero();
        self.prev_normal = Vector2.zero();
        self.first_unit_normal = Vector2.zero();
        self.prev_unit_normal = Vector2.zero();

        self.first_pt = Vector2.zero();
        self.prev_pt = Vector2.zero();

        self.first_outer_pt = Vector2.zero();
        self.first_outer_pt_index_in_contour = 0;
        self.segment_count = -1;
        self.prev_is_line = false;

        self.capper = cap_factory(line_cap);
        self.joiner = join_factory(line_join);

        // Need some estimate of how large our final result (fOuter)
        // and our per-contour temp (fInner) will be, so we don't spend
        // extra time repeatedly growing these arrays.
        //
        // 1x for inner == 'wag' (worst contour length would be better guess)
        self.inner.reset();
        //self.inner.reserve(path.verbs.len(), path.Vector2s.len());

        // 3x for result == inner + outer + join (swag)
        self.outer.reset();
        // self.outer
        //     .reserve(path.verbs.len() * 3, path.Vector2s.len() * 3);

        self.cusper.reset();

        self.stroke_type = StrokeType.Outer;

        self.recursion_depth = 0;
        self.found_tangents = false;
        self.join_completed = false;

        let last_segment_is_line = false;
        // let  iter = path.segments();
        //  iter.set_auto_close(true);
        path.visit({
            moveTo: (d) => {
                self.move_to(d.p0);
            },
            lineTo: (d) => {
                self.line_to(d.p0, path);
                last_segment_is_line = true;
            },
            quadraticCurveTo: (d) => {
                self.quad_to(d.p1, d.p2);
                last_segment_is_line = false;
            },
            bezierCurveTo: (d) => {
                self.cubic_to(d.p1, d.p2, d.p3);
                last_segment_is_line = false
            },
            closePath: () => {
                if (line_cap != LineCap.Butt) {
                    // If the stroke consists of a moveTo followed by a close, treat it
                    // as if it were followed by a zero-length line. Lines without length
                    // can have square and round end caps.
                    if (self.has_only_move_to()) {
                        self.line_to(self.move_to_pt());
                        last_segment_is_line = true;
                     //   continue;
                    }

                    // If the stroke consists of a moveTo followed by one or more zero-length
                    // verbs, then followed by a close, treat is as if it were followed by a
                    // zero-length line. Lines without length can have square & round end caps.
                    if (self.is_current_contour_empty()) {
                        last_segment_is_line = true;
                      //  continue;
                    }
                }

                self.close(last_segment_is_line);
            }
        })

        return self.finish(last_segment_is_line)
    }

     finish(is_line: bool) {
        this.finish_contour(false, is_line);

        // Swap out the outer builder.
        let buf = Path.default()
        let tmp=this.outer
        this.outer=this.inner
        this.inner=tmp
        //swap(&mut self.outer, &mut buf);

        return {
            verbs:buf.verbs,
            points:buf.verbs,
            bounds:buf.getBounds()
        }
    }

     has_only_move_to() {
        return this.segment_count == 0
    }
     is_current_contour_empty():bool {
       return this.inner.isZeroLengthSincePoint(0)
            && this
                .outer
                .isZeroLengthSincePoint(this.first_outer_pt_index_in_contour)
    }

    builders(): SwappableBuilders {
        const p = SwappableBuilders.default()
        p.inner.copy(this.inner)
        p.outer.copy(this.outer)

        return p
    }

    move_to_pt(): Vector2 {
        return this.first_pt
    }

    move_to(p: Vector2) {
        const self = this;
        if (self.segment_count > 0) {
            self.finish_contour(false, false);
        }

        self.segment_count = 0;
        self.first_pt = p;
        self.prev_pt = p;
        self.join_completed = false;
    }

    line_to(p: Vector2, iter?: any) {
        const self = this
        let teeny_line = self
            .prev_pt
            .equalsEpsilon(p, SCALAR_NEARLY_ZERO * self.inv_res_scale);
        if (self.capper == butt_capper && teeny_line) {
            return;
        }

        if (teeny_line && self.join_completed) {
            return;
        }

        let normal = Vector2.zero();
        let unit_normal = Vector2.zero();
        if (!self.pre_join_to(p, true, normal, unit_normal)) {
            return;
        }

        self.outer.lineTo(p.x + normal.x, p.y + normal.y);
        self.inner.lineTo(p.x - normal.x, p.y - normal.y);

        self.post_join_to(p, normal, unit_normal);
    }
    quad_to(p1: Vector2, p2: Vector2) {
    //     const self=this
    //     let quad = [self.prev_pt, p1, p2];
    //     let [reduction, reduction_type] = check_quad_linear(&quad);
    //     if (reduction_type == ReductionType.Point ){
    //         // If the stroke consists of a moveTo followed by a degenerate curve, treat it
    //         // as if it were followed by a zero-length line. Lines without length
    //         // can have square and round end caps.
    //         self.line_to(p2);
    //         return;
    //     }

    //     if (reduction_type == ReductionType.Line) {
    //         self.line_to(p2);
    //         return;
    //     }

    //     if (reduction_type == ReductionType.Degenerate) {
    //         self.line_to(reduction);
    //         let save_joiner = self.joiner;
    //         self.joiner = round_joiner;
    //         self.line_to(p2);
    //         self.joiner = save_joiner;
    //         return;
    //     }

    //   //  debug_assert_eq!(reduction_type, ReductionType.Quad);

    //     let  normal_ab = Vector2.zero();
    //     let  unit_ab = Vector2.zero();
    //     let  normal_bc = Vector2.zero();
    //     let  unit_bc = Vector2.zero();
    //     if (!self.pre_join_to(p1, false,normal_ab, unit_ab)) {
    //         self.line_to(p2,);
    //         return;
    //     }

    //     let  quad_Vector2s = QuadConstruct.default();
    //     self.init_quad(
    //         StrokeType.Outer,
    //         0,
    //         1,
    //         quad_Vector2s,
    //     );
    //     self.quad_stroke(quad,quad_Vector2s);
    //     self.init_quad(
    //         StrokeType.Inner,
    //         0,
    //         1,
    //         quad_Vector2s,
    //     );
    //     self.quad_stroke(quad,quad_Vector2s);

    //     let ok = set_normal_unit_normal(
    //         quad[1],
    //         quad[2],
    //         self.res_scale,
    //         self.radius,
    //         normal_bc,
    //          unit_bc,
    //     );
    //     if(!ok) {
    //         normal_bc = normal_ab;
    //         unit_bc = unit_ab;
    //     }

    //     self.post_join_to(p2, normal_bc, unit_bc);
    }

    cubic_to(pt1: Vector2, pt2: Vector2, pt3: Vector2) {
    //     const self=this
    //     let cubic = [self.prev_pt, pt1, pt2, pt3];
    //     let  reduction =Vector2.makeZeroArray(3)
    //     let  tangent_pt = Vector2.zero();
    //     let reduction_type = check_cubic_linear(cubic, reduction,tangent_pt);
    //     if (reduction_type == ReductionType.Point ){
    //         // If the stroke consists of a moveTo followed by a degenerate curve, treat it
    //         // as if it were followed by a zero-length line. Lines without length
    //         // can have square and round end caps.
    //         self.line_to(pt3);
    //         return;
    //     }

    //     if (reduction_type == ReductionType.Line) {
    //         self.line_to(pt3);
    //         return;
    //     }

    //     if (ReductionType.Degenerate <= reduction_type
    //         && ReductionType.Degenerate3 >= reduction_type)
    //     {
    //         self.line_to(reduction[0]);
    //         let save_joiner = self.joiner;
    //         self.joiner = round_joiner;
    //         if (ReductionType.Degenerate2 <= reduction_type){
    //             self.line_to(reduction[1],);
    //         }

    //         if (ReductionType.Degenerate3 == reduction_type) {
    //             self.line_to(reduction[2],);
    //         }

    //         self.line_to(pt3);
    //         self.joiner = save_joiner;
    //         return;
    //     }

    //   //  debug_assert_eq!(reduction_type, ReductionType.Quad);
    //     let  normal_ab = Vector2.zero();
    //     let  unit_ab = Vector2.zero();
    //     let  normal_cd = Vector2.zero();
    //     let  unit_cd = Vector2.zero();
    //     if (!self.pre_join_to(tangent_pt, false,normal_ab,unit_ab)) {
    //         self.line_to(pt3);
    //         return;
    //     }

    //     let t_values = [0.5,0.5,0.5],t_values_index=0;
    //     t_values_index= findCubicInflections(cubic, t_values);
    //     t_values=t_values.slice(t_values_index)
    //     let  last_t = 0;
    //     for (let index=0;index<t_values.length;index++ ){
    //         let next_t = t_values[index].unwrap_or(NormalizedF32.ONE);

    //         let mut quad_Vector2s = QuadConstruct.default();
    //         self.init_quad(StrokeType.Outer, last_t, next_t, &mut quad_Vector2s);
    //         self.cubic_stroke(&cubic, &mut quad_Vector2s);
    //         self.init_quad(StrokeType.Inner, last_t, next_t, &mut quad_Vector2s);
    //         self.cubic_stroke(&cubic, &mut quad_Vector2s);
    //         last_t = next_t;
    //     }

    //     if  Some(cusp) = path_geometry.find_cubic_cusp(&cubic) {
    //         let cusp_loc = path_geometry.eval_cubic_pos_at(&cubic, cusp.to_normalized());
    //         self.cusper.push_circle(cusp_loc.x, cusp_loc.y, self.radius);
    //     }

    //     // emit the join even if one stroke succeeded but the last one failed
    //     // this avoids reversing an inner stroke with a partial path followed by another moveto
    //     self.set_cubic_end_normal(&cubic, normal_ab, unit_ab, &mut normal_cd, &mut unit_cd);

    //     self.post_join_to(pt3, normal_cd, unit_cd);
    }
     close( is_line: bool) {
        this.finish_contour(true, is_line);
    }

     finish_contour( close: bool, curr_is_line: bool) {
        const self=this
        if( self.segment_count > 0) {
            if (close) {
                self.joiner(
                    self.prev_unit_normal,
                    self.prev_pt,
                    self.first_unit_normal,
                    self.radius,
                    self.inv_miter_limit,
                    self.prev_is_line,
                    curr_is_line,
                    self.builders(),
                );
                self.outer.closePath();

                // now add inner as its own contour
                let pt = self.inner.lastPoint.clone();
                self.outer.moveTo(pt.x, pt.y);
                self.outer.addReversePath(self.inner);
                self.outer.closePath();
            } else {
                // add caps to start and end

                // cap the end
                let pt = self.inner.lastPoint;
                {
                    let other_path = curr_is_line?self.inner:undefined
                    self.capper(
                        self.prev_pt,
                        self.prev_normal,
                        pt,
                        other_path,
                        self.outer,
                    );
                    self.outer.addReversePath(self.inner);
    
                }
                // cap the start
              {
                let other_path =  self.prev_is_line ?self.inner:undefined
                self.capper(
                    self.first_pt,
                    self.first_normal.clone().negate(),
                    self.first_outer_pt,
                    other_path,
                    self.outer,
                );
                self.outer.closePath();
              }
            }

            if (!self.cusper.isEmpty){
                self.outer.addPath(self.cusper,0);
                self.cusper.reset();
            }
        }

        // since we may re-use `inner`, we rewind instead of reset, to save on
        // reallocating its internal storage.
        self.inner.reset();
        self.segment_count = -1;
        self.first_outer_pt_index_in_contour = self.outer.points.length;
    }

     pre_join_to(
        p: Vector2,
        curr_is_line: bool,
        normal: Vector2,
        unit_normal: Vector2,
    ) {
        const self=this

        let prev_x = self.prev_pt.x;
        let prev_y = self.prev_pt.y;

        let normal_set = set_normal_unit_normal(
            self.prev_pt,
            p,
            self.res_scale,
            self.radius,
            normal,
            unit_normal,
        );
        if (!normal_set) {
            if (self.capper==butt_capper) {
                return false;
            }

            // Square caps and round caps draw even if the segment length is zero.
            // Since the zero length segment has no direction, set the orientation
            // to upright as the default orientation.
            normal.set(self.radius, 0.0);
            unit_normal.set(1.0, 0.0);
        }

        if (self.segment_count == 0) {
            self.first_normal.copy(normal);
            self.first_unit_normal.copy(unit_normal);
            self.first_outer_pt = Vector2.create(prev_x + normal.x, prev_y + normal.y);

            self.outer
                .moveTo(self.first_outer_pt.x, self.first_outer_pt.y);
            self.inner.moveTo(prev_x - normal.x, prev_y - normal.y);
        } else {
            // we have a previous segment
            self.joiner(
                self.prev_unit_normal,
                self.prev_pt,
                unit_normal,
                self.radius,
                self.inv_miter_limit,
                self.prev_is_line,
                curr_is_line,
                self.builders(),
            );
        }
        self.prev_is_line = curr_is_line;
       return true
    }

    post_join_to(p: Vector2, normal: Vector2, unit_normal: Vector2) {
        const self=this
        self.join_completed = true;
        self.prev_pt = p;
        self.prev_unit_normal = unit_normal;
        self.prev_normal = normal;
        self.segment_count += 1;
    }

}





class QuadConstruct {
    static default(){
        return new this()
    }
    // The state of the quad stroke under construction.
    quad=Vector2.makeZeroArray(3)       // the stroked quad parallel to the original curve
    tangent_start=Vector2.zero()   // a point tangent to quad[0]
    tangent_end=Vector2.zero()     // a point tangent to quad[2]
    start_t: NormalizedF32=0 // a segment of the original curve
    mid_t: NormalizedF32=0
    end_t: NormalizedF32=0
    start_set: bool=false // state to share common points across structs
    end_set: bool=false
    opposite_tangents: bool=false // set if coincident tangents have opposite directions
}