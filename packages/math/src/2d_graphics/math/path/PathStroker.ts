import { PathBuilder, PathDirection, PathVerb } from "./PathBuilder";
import { Vector2 } from '../../../math/vec2'
import { Matrix2D } from '../../../math/mat2d'
import { Conic,find_cubic_inflections, chop_cubic_at2, eval_cubic_tangent_at, find_cubic_cusp, find_unit_quad_roots, eval_quad_tangent_at, find_cubic_max_curvature, find_quad_max_curvature, eval_quad_at, eval_cubic_pos_at } from '../../../curve/path_geomtry'
import { scalarNearlyZero } from '../../../math/math'

const PI_2 = Math.PI * 2
const twoPi = PI_2


export type PathVerbData = {
    type: PathVerb
    p0?: Vector2,
    p1?: Vector2,
    p2?: Vector2
    p3?: Vector2
}
export enum LineJoin {
    Miter = 'miter',
    Round = 'round',
    Bevel = 'bevel',
    MiterClip = 'miter-clip',
}
export enum LineCap {
    Butt = 'butt',
    Round = 'round',
    Square = 'square',
}
export enum FillRule {
    NonZero = 'nonzero',
    EvenOdd = 'evenodd',
}


export class PathSegmentsIter {
    isAutoClose = false;
    path!: PathBuilder
    verbIndex!: number
    pointsIndex!: number
    lastMoveTo = Vector2.default()
    lastPoint = Vector2.default()
    constructor(options: {
        isAutoClose?: boolean
        path: PathBuilder
        verbIndex: number
        pointsIndex: number
        lastMoveTo?: Vector2
        lastPoint?: Vector2
    }) {
        this.isAutoClose = options.isAutoClose ?? false
        this.verbIndex = options.verbIndex
        this.pointsIndex = options.pointsIndex
        this.path = options.path
        if (options.lastMoveTo) {
            this.lastMoveTo.copy(options.lastMoveTo)
        }
        if (options.lastPoint) {
            this.lastPoint.copy(options.lastPoint)
        }
    }
    get curVerb() {
        return this.path.verbs[this.verbIndex - 1]
    }
    get nextVerb() {
        return this.path.verbs[this.verbIndex]
    }
    copy(source: PathSegmentsIter) {
        this.isAutoClose = source.isAutoClose
        this.verbIndex = source.verbIndex
        this.pointsIndex = source.pointsIndex
        this.lastMoveTo.copy(source.lastMoveTo)
        this.lastPoint.copy(source.lastPoint)
        return this
    }
    clone() {
        return new PathSegmentsIter({
            isAutoClose: this.isAutoClose,
            path: this.path,
            verbIndex: this.verbIndex,
            pointsIndex: this.pointsIndex,
            lastMoveTo: this.lastMoveTo,
            lastPoint: this.lastPoint
        })
    }
    *[Symbol.iterator](): Iterator<PathVerbData> {
        const points = Array.from({length:this.path.points.length/2},(v,i)=>{
            return Vector2.create(this.path.points[i*2],this.path.points[i*2+1])
        })
        const verbs = this.path.verbs
        let lastMovePoint: Vector2 | null = null
        
        while (this.verbIndex < verbs.length) {
            const verb = verbs[this.verbIndex++]
            switch (verb) {
                case PathVerb.MoveTo:
                    this.pointsIndex += 1
                    lastMovePoint = points[this.pointsIndex - 1]
                    this.lastMoveTo.copy(lastMovePoint)
                    this.lastPoint.copy(this.lastMoveTo)
                    yield { type: verb, p0: points[this.pointsIndex - 1] }
                    break;
                case PathVerb.LineTo:
                    this.pointsIndex += 1
                    this.lastPoint.copy(points[this.pointsIndex - 1])
                    yield { type: verb, p0: points[this.pointsIndex - 1] }
                    break;
                case PathVerb.QuadCurveTo:
                    this.pointsIndex += 2
                    this.lastPoint.copy(points[this.pointsIndex - 1])
                    yield { type: verb, p0: points[this.pointsIndex - 3], p1: points[this.pointsIndex - 2], p2: points[this.pointsIndex - 1] }
                    break;
                case PathVerb.CubicCurveTo:
                    this.pointsIndex += 3
                    this.lastPoint.copy(points[this.pointsIndex - 1])
                    yield { type: verb, p0: points[this.pointsIndex - 4], p1: points[this.pointsIndex - 3], p2: points[this.pointsIndex - 2], p3: points[this.pointsIndex - 1] }
                    break;
                case PathVerb.Close:
                    const seg = this.autoClose()
                    this.lastPoint.copy(this.lastMoveTo)
                    yield seg
                    break;
            }
        }
    }
    hasValidTangent() {
        let iter = this.clone();
        for (let d of iter) {

            switch (d.type) {
                case PathVerb.MoveTo: {
                    return false;
                }
                case PathVerb.LineTo: {
                    if (iter.lastPoint.equals(d.p0!)) {
                        continue;
                    }
                    return true;
                }
                case PathVerb.QuadCurveTo: {
                    if (iter.lastPoint.equals(d.p1!) && iter.lastPoint.equals(d.p2!)) {
                        continue
                    }
                    return true
                }
                case PathVerb.CubicCurveTo: {
                    if (iter.lastPoint.equals(d.p1!) && iter.lastPoint.equals(d.p2!) && iter.lastPoint.equals(d.p3!)) {
                        continue
                    }
                    return true
                }
                case PathVerb.Close: {
                    return false;
                }
            }
        }
        return false;
    }

    setAutoClose(value: boolean) {
        this.isAutoClose = value
    }
    autoClose(): PathVerbData {
        if (this.isAutoClose && !this.lastPoint.equals(this.lastMoveTo)) {
            this.verbIndex -= 1;
            return {
                type: PathVerb.LineTo,
                p0: this.lastMoveTo
            }
        } else {
            return {
                type: PathVerb.Close,
                p0: this.lastPoint,
                p1: this.lastMoveTo
            }
        }
    }
}

class SwappableBuilders {
    constructor(public inner: PathBuilder, public outer: PathBuilder) {

    }
    swap() {
        [this.inner, this.outer] = [this.outer, this.inner]
    }

}
type CapProc = (
    pivot: Vector2, // 上一个点
    normal: Vector2,
    stop: Vector2,
    other_path: PathBuilder | null | undefined,
    path: PathBuilder,
) => void;

type JoinProc = (
    before_unit_normal: Vector2, //l0->l1 线段的，旋转-90度的单位法向量
    pivot: Vector2,// 上一个lineTo点
    after_unit_normal: Vector2, // l1->l2 线段的，旋转-90度的单位法向量
    radius: number, // 线段宽的一半
    inv_miter_limit: number,// 1/miter_limit   
    prev_is_line: boolean, // 上一个绘制命令是否是lineTo
    curr_is_line: boolean, // 当前绘制命令是否是lineTo
    builders: SwappableBuilders,
) => void

const SCALAR_ROOT_2_OVER_2 = 0.707106781;// sqrt(2)/2
const lineCapButt: CapProc = (pivot, normal, stop, other_path, path) => {
    path.lineTo(stop.x, stop.y);
}
const lineCapRound: CapProc = (pivot, normal, stop, other_path, path) => {
    let parallel = normal.clone();
    parallel.cw();

    let projected_center = pivot.clone().add(parallel);
    let projected_center_normal = projected_center.clone().add(normal)
    path.conicTo(projected_center_normal.x,
        projected_center_normal.y,
        projected_center.x,
        projected_center.y,
        SCALAR_ROOT_2_OVER_2,
    );
    projected_center_normal.copy(projected_center).sub(normal)
    path.conicTo(projected_center_normal.x,
        projected_center_normal.y,
        stop.x,
        stop.y,
        SCALAR_ROOT_2_OVER_2,
    );
}

const lineCapSquare: CapProc = (pivot, normal, stop, other_path, path) => {
    let parallel = normal.clone();
    parallel.cw();

    if (other_path) {
        path.setLastPoint(
            pivot.x + normal.x + parallel.x,
            pivot.y + normal.y + parallel.y,
        );
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

enum AngleType {
    Nearly180,
    Sharp,
    Shallow,
    NearlyLine,
}
function isNearlyZero(value: number) {
    return Math.abs(value) <= SCALAR_NEARLY_ZERO
}
function dotToAngleType(dot: number): AngleType {
    if (dot >= 0.0) {
        // shallow or line
        if (isNearlyZero(1.0 - dot)) {
            return AngleType.NearlyLine
        } else {
            return AngleType.Shallow
        }
    } else {
        // sharp or 180
        if (isNearlyZero(1.0 + dot)) {
            return AngleType.Nearly180
        } else {
            return AngleType.Sharp
        }
    }
}
function isClockwise(before: Vector2, after: Vector2): boolean {
    return before.x * after.y > before.y * after.x
}
function handleInnerJoin(pivot: Vector2, after: Vector2, inner: PathBuilder) {
    // In the degenerate case that the stroke radius is larger than our segments
    // just connecting the two inner segments may "show through" as a funny
    // diagonal. To pseudo-fix this, we go through the pivot point. This adds
    // an extra point/edge, but I can't see a cheap way to know when this is
    // not needed :(
    inner.lineTo(pivot.x, pivot.y);

    inner.lineTo(pivot.x - after.x, pivot.y - after.y);
}
const lineJoinMiterInner = (
    before_unit_normal: Vector2, //l0->l1 线段的，旋转-90度的单位法向量
    pivot: Vector2,// 上一个lineTo点
    after_unit_normal: Vector2, // l1->l2 线段的，旋转-90度的单位法向量
    radius: number, // 线段宽的一半
    inv_miter_limit: number,// 1/miter_limit
    miter_clip: boolean,
    prev_is_line: boolean, // 上一个绘制命令是否是lineTo
    curr_is_line: boolean, // 当前绘制命令是否是lineTo
    builders: SwappableBuilders) => {
    function do_blunt_or_clipped(
        builders: SwappableBuilders,
        pivot: Vector2,
        radius: number,
        prev_is_line: boolean,
        curr_is_line: boolean,
        before: Vector2,
        mid: Vector2,
        after: Vector2,
        inv_miter_limit: number,
        miter_clip: boolean,
    ) {
        after = after.clone()
        after.multiplyScalar(radius);

        mid = mid.clone()
        before = before.clone()

        if (miter_clip) {
            mid.normalize();

            let cos_beta = before.dot(mid);
            let sin_beta = before.cross(mid);
            let x = 0
            if (Math.abs(sin_beta) <= SCALAR_NEARLY_ZERO) {
                x = 1.0 / inv_miter_limit
            } else {
                x = ((1.0 / inv_miter_limit) - cos_beta) / sin_beta
            };

            before.multiplyScalar(radius);

            let before_tangent = before.clone();
            before_tangent.cw();

            let after_tangent = after.clone();
            after_tangent.ccw();

            let c1 = Vector2.default()
            c1.addVectors(pivot, before).add(before_tangent.clone().multiplyScalar(x))
            let c2 = Vector2.default()
            c1.addVectors(pivot, after).add(after_tangent.clone().multiplyScalar(x))


            if (prev_is_line) {
                builders.outer.setLastPoint(c1.x, c1.y);
            } else {
                builders.outer.lineTo(c1.x, c1.y);
            }

            builders.outer.lineTo(c2.x, c2.y);
        }

        if (!curr_is_line) {
            builders.outer.lineTo(pivot.x + after.x, pivot.y + after.y);
        }

        handleInnerJoin(pivot, after, builders.inner);
    }

    function do_miter(
        builders: SwappableBuilders,
        pivot: Vector2,
        radius: number,
        prev_is_line: boolean,
        curr_is_line: boolean,
        mid: Vector2,
        after: Vector2,
    ) {
        after = after.clone();
        after.multiplyScalar(radius);

        if (prev_is_line) {
            builders
                .outer
                .setLastPoint(pivot.x + mid.x, pivot.y + mid.y);
        } else {
            builders.outer.lineTo(pivot.x + mid.x, pivot.y + mid.y);
        }

        if (!curr_is_line) {
            builders.outer.lineTo(pivot.x + after.x, pivot.y + after.y);
        }

        handleInnerJoin(pivot, after, builders.inner);
    }

    // negate the dot since we're using normals instead of tangents
    let dot_prod = before_unit_normal.dot(after_unit_normal);
    let angle_type = dotToAngleType(dot_prod);
    let before = before_unit_normal.clone();
    let after = after_unit_normal.clone();
    let mid = Vector2.default();

    if (angle_type == AngleType.NearlyLine) {
        return;
    }

    if (angle_type == AngleType.Nearly180) {
        curr_is_line = false;
        mid.subVectors(after, before).multiplyScalar(radius / 2.0);
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

    let ccw = !isClockwise(before, after);
    if (ccw) {
        builders.swap();
        before.negate();
        after.negate()
    }

    // Before we enter the world of square-roots and divides,
    // check if we're trying to join an upright right angle
    // (common case for stroking rectangles). If so, special case
    // that (for speed an accuracy).
    // Note: we only need to check one normal if dot==0
    if (dot_prod == 0.0 && inv_miter_limit <= SCALAR_ROOT_2_OVER_2) {
        mid.addVectors(before, after).multiplyScalar(radius)
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
        if (ccw) {
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
    let sin_half_angle = Math.sqrt((1.0 + dot_prod) / 2);
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

const lineJoinBevel: JoinProc = (before_unit_normal, pivot, after_unit_normal, radius, inv_miter_limit, prev_is_line, curr_is_line, builders) => {
    let after = after_unit_normal.clone().multiplyScalar(radius);

    if (!isClockwise(before_unit_normal, after_unit_normal)) {
        builders.swap();
        after.negate();
    }

    builders.outer.lineTo(pivot.x + after.x, pivot.y + after.y);
    handleInnerJoin(pivot, after, builders.inner);
}
const lineJoinMiter: JoinProc = (before_unit_normal, pivot, after_unit_normal, radius, inv_miter_limit, prev_is_line, curr_is_line, builders) => {
    return lineJoinMiterInner(before_unit_normal, pivot, after_unit_normal, radius, inv_miter_limit, false, prev_is_line, curr_is_line, builders)
}
const lineJoinMiterClip: JoinProc = (before_unit_normal, pivot, after_unit_normal, radius, inv_miter_limit, prev_is_line, curr_is_line, builders) => {
    lineJoinMiterInner(
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
const lineJoinRound: JoinProc = (before_unit_normal, pivot, after_unit_normal, radius, inv_miter_limit, prev_is_line, curr_is_line, builders) => {
    let dot_prod = before_unit_normal.dot(after_unit_normal);
    let angle_type = dotToAngleType(dot_prod);

    if (angle_type == AngleType.NearlyLine) {
        return;
    }

    let before = before_unit_normal.clone();
    let after = after_unit_normal.clone();
    let dir = PathDirection.CW;

    if (!isClockwise(before, after)) {
        builders.swap();
        before.negate();
        after.negate();
        dir = PathDirection.CCW;
    }

    let ts = Matrix2D.fromRows(radius, 0.0, 0.0, radius, pivot.x, pivot.y);

    let _conics = new Array(5).fill(0).map(() => new Conic())
    let conics = Conic.build_unit_arc(before as any, after as any, dir as any, ts, _conics);
    if (conics) {
        for (let conic of conics) {
            builders
                .outer
                .conicTo(conic.points[1].x, conic.points[1].y,
                    conic.points[2].x, conic.points[2].y, conic.weight);
        }

        after.multiplyScalar(radius);
        handleInnerJoin(pivot, after, builders.inner);
    }
}



function setNormalUnitNormal(
    before: Vector2,
    after: Vector2,
    scale: number,
    radius: number,
    normal: Vector2,
    unit_normal: Vector2,
): boolean {
    if (!unit_normal.setLengthFrom((after.x - before.x) * scale, (after.y - before.y) * scale, 1)) {
        return false;
    }

    unit_normal.ccw();
    normal.copy(unit_normal).multiplyScalar(radius);
    return true
}

function setNormalUnitNormal2(
    vec: Vector2,
    radius: number,
    normal: Vector2,
    unit_normal: Vector2,
): boolean {
    if (!unit_normal.setLengthFrom(vec.x, vec.y, 1)) {
        return false;
    }
    unit_normal.ccw();
    normal.copy(unit_normal).multiplyScalar(radius);
    return true
}

class QuadConstruct {
    static default() {
        return new this()
    }
    // The state of the quad stroke under construction.
    quad = [Vector2.default(), Vector2.default(), Vector2.default()]       // the stroked quad parallel to the original curve
    tangent_start = Vector2.default()   // a point tangent to quad[0]
    tangent_end = Vector2.default()     // a point tangent to quad[2]
    start_t: number = 0 // a segment of the original curve
    mid_t: number = 0
    end_t: number = 0
    start_set: boolean = false // state to share common points across structs
    end_set: boolean = false
    opposite_tangents: boolean = false // set if coincident tangents have opposite directions

    init(start: number, end: number): boolean {
        this.start_t = start;
        this.mid_t = Math.min(1, Math.max(0, (start + end) / 2));
        this.end_t = end;
        this.start_set = false; // state to share common points across structs
        this.end_set = false;
        return this.start_t < this.mid_t && this.mid_t < this.end_t;
    }
    initWithStart(parent: QuadConstruct): boolean {
        const self = this
        if (!self.init(parent.start_t, parent.mid_t)) {
            return false;
        }

        self.quad[0].copy(parent.quad[0]);
        self.tangent_start.copy(parent.tangent_start);
        self.start_set = true;
        return true

    }
    initWithEnd(parent: QuadConstruct): boolean {
        const self = this
        if (!self.init(parent.mid_t, parent.end_t)) {
            return false;
        }
        self.quad[2].copy(parent.quad[2]);
        self.tangent_end.copy(parent.tangent_end);
        self.end_set = true;
        return true
    }
}



function check_quad_linear(quad: Vector2[]): [Vector2, ReductionType] {
    let degenerate_ab = degenerateVector(quad[1].clone().sub(quad[0]));
    let degenerate_bc = degenerateVector(quad[2].clone().sub(quad[1]));
    if (degenerate_ab & degenerate_bc) {
        return [Vector2.default(), ReductionType.Point]
    }

    if (degenerate_ab | degenerate_bc) {
        return [Vector2.default(), ReductionType.Line];
    }

    if (!quadInLine(quad)) {
        return [Vector2.default(), ReductionType.Quad];
    }

    let t = find_quad_max_curvature(quad);
    if (t == 0 || t == 1) {
        return [Vector2.default(), ReductionType.Line];
    }

    let v = eval_quad_at(quad, t)
    return [Vector2.create(v.x, v.y), ReductionType.Degenerate]
}

function degenerateVector(v: Vector2) {
    return Number(!v.canNormalize())
}

/// Given quad, see if all there points are in a line.
/// Return true if the inside point is close to a line connecting the outermost points.
///
/// Find the outermost point by looking for the largest difference in X or Y.
/// Since the XOR of the indices is 3  (0 ^ 1 ^ 2)
/// the missing index equals: outer_1 ^ outer_2 ^ 3.
function quadInLine(quad: Vector2[]): boolean {
    let pt_max = -1.0;
    let outer1 = 0;
    let outer2 = 0;
    for (let index = 0; index < 2; index++) {
        for (let inner = index + 1; inner < 3; inner++) {
            let test_diff = quad[inner].clone().sub(quad[index]);
            let test_max = Math.max(Math.abs(test_diff.x), Math.abs(test_diff.y))
            if (pt_max < test_max) {
                outer1 = index;
                outer2 = inner;
                pt_max = test_max;
            }
        }
    }

    console.assert(outer1 <= 1);
    console.assert(outer2 >= 1 && outer2 <= 2);
    console.assert(outer1 < outer2);

    let mid = outer1 ^ outer2 ^ 3;
    const CURVATURE_SLOP: number = 0.000005; // this multiplier is pulled out of the air
    let line_slop = pt_max * pt_max * CURVATURE_SLOP;
    return ptToLine(quad[mid], quad[outer1], quad[outer2]) <= line_slop
}

// returns the distance squared from the point to the line
function ptToLine(pt: Vector2, line_start: Vector2, line_end: Vector2): number {
    let dxy = line_end.clone().sub(line_start);
    let ab0 = pt.clone().sub(line_start);
    let numer = dxy.dot(ab0);
    let denom = dxy.dot(dxy);
    let t = numer / denom;
    if (t >= 0.0 && t <= 1.0) {
        let hit = Vector2.create(
            line_start.x * (1.0 - t) + line_end.x * t,
            line_start.y * (1.0 - t) + line_end.y * t,
        );
        return hit.distanceToSquared(pt)
    } else {
        return pt.distanceToSquared(line_start)
    }
}

// Intersect the line with the quad and return the t values on the quad where the line crosses.
function intersect_quad_ray(
    line: Vector2[],
    quad: Vector2[],
    roots: number[]
): number[] {
    let vec = line[1].clone().sub(line[0]);
    let r = [0, 0, 0];
    for (let n = 0; n < 3; n++) {
        r[n] = (quad[n].y - line[0].y) * vec.x - (quad[n].x - line[0].x) * vec.y;
    }
    let a = r[2];
    let b = r[1];
    let c = r[0];
    a += c - 2.0 * b; // A = a - 2*b + c
    b -= c; // B = -(b - c)

    let len = find_unit_quad_roots(a, 2.0 * b, c, roots);
    return roots.slice(0, len)
}

function pointsWithinDist(near_pt: Vector2, far_pt: Vector2, limit: number): boolean {
    return near_pt.distanceToSquared(far_pt) <= limit * limit
}

function sharp_angle(quad: Vector2[]): boolean {
    let smaller = quad[1].clone().sub(quad[0]);
    let larger = quad[1].clone().sub(quad[2]);
    let smaller_len = smaller.lengthSquared();
    let larger_len = larger.lengthSquared();
    if (smaller_len > larger_len) {
        [smaller, larger] = [larger, smaller]
        larger_len = smaller_len;
    }

    if (!smaller.setLength(larger_len)) {
        return false;
    }

    let dot = smaller.dot(larger);
    return dot > 0.0
}

// Return true if the point is close to the bounds of the quad. This is used as a quick reject.
function ptInQuadBounds(quad: Vector2[], pt: Vector2, inv_res_scale: number): boolean {
    let x_min = Math.min(quad[0].x, quad[1].x, quad[2].x);
    if (pt.x + inv_res_scale < x_min) {
        return false;
    }

    let x_max = Math.max(quad[0].x, quad[1].x, quad[2].x);
    if (pt.x - inv_res_scale > x_max) {
        return false;
    }

    let y_min = Math.min(quad[0].y, quad[1].y, quad[2].y);
    if (pt.y + inv_res_scale < y_min) {
        return false;
    }

    let y_max = Math.max(quad[0].y, quad[1].y, quad[2].y);
    if (pt.y - inv_res_scale > y_max) {
        return false;
    }
    return true
}

function checkCubicLinear(
    cubic: Vector2[],
    reduction: Vector2[],
    tangent_pt?: Vector2,
): ReductionType | -1 {
    let degenerate_ab = degenerateVector(cubic[1].clone().sub(cubic[0]));
    let degenerate_bc = degenerateVector(cubic[2].clone().sub(cubic[1]));
    let degenerate_cd = degenerateVector(cubic[3].clone().sub(cubic[2]));
    if (degenerate_ab & degenerate_bc & degenerate_cd) {
        return ReductionType.Point;
    }

    if (degenerate_ab + degenerate_bc + degenerate_cd == 2) {
        return ReductionType.Line;
    }

    if (!cubic_in_line(cubic)) {
        if (tangent_pt) {
            if (degenerate_ab) {
                tangent_pt.copy(cubic[2])
            } else {
                tangent_pt.copy(cubic[1])
            }
        }

        return ReductionType.Quad;
    }

    let t_values = [0, 0, 0];
    t_values = find_cubic_max_curvature(cubic as any[], t_values);
    let r_count = 0;
    // Now loop over the t-values, and reject any that evaluate to either end-point
    for (let t of t_values) {
        if (0.0 >= t || t >= 1.0) {
            continue;
        }
        let v = eval_cubic_pos_at(cubic, t)
        reduction[r_count] = Vector2.create(v.x, v.y);
        if (!reduction[r_count].equals(cubic[0]) && !reduction[r_count].equals(cubic[3])) {
            r_count += 1;
        }
    }

    switch (r_count) {
        case 0: return ReductionType.Line
        case 1: return ReductionType.Line
        case 2: return ReductionType.Degenerate2
        case 3: return ReductionType.Degenerate3
        default: return -1
    }
}

/// Given a cubic, determine if all four points are in a line.
///
/// Return true if the inner points is close to a line connecting the outermost points.
///
/// Find the outermost point by looking for the largest difference in X or Y.
/// Given the indices of the outermost points, and that outer_1 is greater than outer_2,
/// this table shows the index of the smaller of the remaining points:
///
/// ```text
///                   outer_2
///               0    1    2    3
///   outer_1     ----------------
///      0     |  -    2    1    1
///      1     |  -    -    0    0
///      2     |  -    -    -    0
///      3     |  -    -    -    -
/// ```
///
/// If outer_1 == 0 and outer_2 == 1, the smaller of the remaining indices (2 and 3) is 2.
///
/// This table can be collapsed to: (1 + (2 >> outer_2)) >> outer_1
///
/// Given three indices (outer_1 outer_2 mid_1) from 0..3, the remaining index is:
///
/// ```text
/// mid_2 == (outer_1 ^ outer_2 ^ mid_1)
/// ```
function cubic_in_line(cubic: Vector2[]): boolean {
    let pt_max = -1.0;
    let outer1 = 0;
    let outer2 = 0;
    for (let index = 0; index < 3; index++) {
        for (let inner = index + 1; inner < 4; inner++) {
            let test_diff = cubic[inner].clone().sub(cubic[index]);
            let test_max = Math.max(Math.abs(test_diff.x), Math.abs(test_diff.y));
            if (pt_max < test_max) {
                outer1 = index;
                outer2 = inner;
                pt_max = test_max;
            }
        }
    }

    let mid1 = (1 + (2 >> outer2)) >> outer1;

    let mid2 = outer1 ^ outer2 ^ mid1;

    let line_slop = pt_max * pt_max * 0.00001; // this multiplier is pulled out of the air

    return ptToLine(cubic[mid1], cubic[outer1], cubic[outer2]) <= line_slop
        && ptToLine(cubic[mid2], cubic[outer1], cubic[outer2]) <= line_slop
}

const joinFactory: {
    [K in LineJoin]: JoinProc
} = {
    [LineJoin.Bevel]: lineJoinBevel,
    [LineJoin.Miter]: lineJoinMiter,
    [LineJoin.MiterClip]: lineJoinMiterClip,
    [LineJoin.Round]: lineJoinRound
}
const capFactory: {
    [K in LineCap]: CapProc
} = {
    [LineCap.Butt]: lineCapButt,
    [LineCap.Round]: lineCapRound,
    [LineCap.Square]: lineCapSquare
}

enum StrokeType {
    Outer = 1, // use sign-opposite values later to flip perpendicular axis
    Inner = -1,
}
enum ReductionType {
    Point,       // all curve points are practically identical
    Line,        // the control point is on the line between the ends
    Quad,        // the control point is outside the line between the ends
    Degenerate,  // the control point is on the line but outside the ends
    Degenerate2, // two control points are on the line but outside ends (cubic)
    Degenerate3, // three areas of max curvature found (for cubic)
}
const QUAD_RECURSIVE_LIMIT: number = 3;

// quads with extreme widths (e.g. (0,1) (1,6) (0,3) width=5e7) recurse to point of failure
// largest seen for normal cubics: 5, 26
// largest seen for normal quads: 11
const RECURSIVE_LIMITS: number[] = [5 * 3, 26 * 3, 11 * 3, 11 * 3]; // 3x limits seen in practice
const SCALAR_NEARLY_ZERO = 1 / (1 << 12)

enum ResultType {
    Split,      // the caller should split the quad stroke in two
    Degenerate, // the caller should add a line
    Quad,       // the caller should (continue to try to) add a quad stroke
}
enum IntersectRayType {
    CtrlPt,
    ResultType,
}
export class PathStroker {
    static computeResolutionScale(ts: Matrix2D) {
        let sx = Vector2.create(ts.a, ts.b).length();
        let sy = Vector2.create(ts.c, ts.d).length();
        if (Number.isFinite(sx) && Number.isFinite(sy)) {
            let scale = Math.max(sx, sy);
            if (scale > 0) {
                return scale;
            }
        }
        return 1
    }
    radius = 0 // 线段宽的一半
    inv_miter_limit = 0 // 1/miter_limit
    res_scale = 1 // 分辨率缩放因子
    inv_res_scale = 1 // 分辨率缩放因子的倒数
    inv_res_scale_squared = 1 // 分辨率缩放因子的倒数平方

    first_normal = Vector2.default() // Move->LineTo 旋转-90法向量剩以radius
    prev_normal = Vector2.default() // 上一个LineTo->lineTo点旋转-90法向量剩以radius
    first_unit_normal = Vector2.default() // Move->LineTo 线段的，旋转-90度的单位法向量
    prev_unit_normal = Vector2.default() // 上一个lineTo->LineTo点旋转-90度的单位法向量

    first_pt = Vector2.default() // moveTo点
    prev_pt = Vector2.default()// 上一个lineTo点

    first_outer_pt = Vector2.default()  // 第一个线段的外侧点

    first_outer_pt_index_in_contour = 0 // 第一个线段的外侧点在轮廓中的索引

    segment_count = -1 // 从MoveTo线段计数

    prev_is_line = false // 上一个绘制命令是否是lineTo


    capper!: CapProc
    joiner!: JoinProc

    inner = PathBuilder.default()
    outer = PathBuilder.default()
    cusper = PathBuilder.default()
    stroke_type = StrokeType.Outer // 线段类型
    recursion_depth = 0 // 递归深度
    found_tangents = false // 是否找到切线
    join_completed = false // 是否完成连接
    get moveToPt() {
        return this.first_pt
    }
    builders() {
        return new SwappableBuilders(this.inner, this.outer)
    }
    close(is_line: boolean) {
        this.finishContour(true, is_line);
    }
    moveTo(p: Vector2) {
        if (this.segment_count > 0) {
            this.finishContour(false, false);
        }

        this.segment_count = 0;
        this.first_pt.copy(p);
        this.prev_pt.copy(p);
        this.join_completed = false;
    }
    finishContour(close: boolean, curr_is_line: boolean) {
        const self = this
        if (self.segment_count > 0) {
            if (close) {
                (self.joiner)(
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
                let pt = self.inner.lastPoint ?? Vector2.create(0, 0);
                self.outer.moveTo(pt.x, pt.y);
                self.outer.reversePathTo(self.inner);
                self.outer.closePath();
            } else {
                // add caps to start and end

                // cap the end
                let pt = self.inner.lastPoint ?Vector2.fromPoint(self.inner.lastPoint) :Vector2.create(0, 0);
                let other_path = curr_is_line ? self.inner : null;
                (self.capper)(
                    self.prev_pt,
                    self.prev_normal,
                    pt as any,
                    other_path,
                    self.outer,
                );
                self.outer.reversePathTo(self.inner);

                // cap the start
                other_path = self.prev_is_line ? self.inner : null;
                (self.capper)(
                    self.first_pt,
                    self.first_normal.clone().negate(),
                    self.first_outer_pt,
                    other_path,
                    self.outer,
                );
                self.outer.closePath();
            }

            if (!self.cusper.isEmpty) {
                self.outer.addPath(self.cusper);
                self.cusper.clear();
            }
        }

        // since we may re-use `inner`, we rewind instead of reset, to save on
        // reallocating its internal storage.
        self.inner.clear();
        self.segment_count = -1;
        self.first_outer_pt_index_in_contour = self.outer.points.length;
    }

    preJoinTo(p: Vector2, curr_is_line: boolean, normal: Vector2, unit_normal: Vector2) {
        const self = this
        let prev_x = self.prev_pt.x;
        let prev_y = self.prev_pt.y;

        let normal_set = setNormalUnitNormal(
            self.prev_pt,
            p,
            self.res_scale,
            self.radius,
            normal,
            unit_normal,
        );
        if (!normal_set) {
            if (self.capper === lineCapButt) {
                return false;
            }
            // Square caps and round caps draw even if the segment length is zero.
            // Since the zero length segment has no direction, set the orientation
            // to upright as the default orientation.
            normal.set(self.radius, 0.0)
            unit_normal.set(1, 0)
        }

        if (self.segment_count == 0) {
            self.first_normal.copy(normal);
            self.first_unit_normal.copy(unit_normal);
            self.first_outer_pt = Vector2.create(prev_x + normal.x, prev_y + normal.y);

            self.outer.moveTo(self.first_outer_pt.x, self.first_outer_pt.y);
            self.inner.moveTo(prev_x - normal.x, prev_y - normal.y);
        } else {
            // we have a previous segment
            (self.joiner)(
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
    postJoinTo(p: Vector2, normal: Vector2, unit_normal: Vector2) {
        this.join_completed = true;
        this.prev_pt.copy(p);
        this.prev_unit_normal.copy(unit_normal);
        this.prev_normal.copy(normal);
        this.segment_count += 1;
    }
    initQuad(
        stroke_type: StrokeType,
        start: number,
        end: number,
        quad_points: QuadConstruct,
    ) {
        this.stroke_type = stroke_type;
        this.found_tangents = false;
        quad_points.init(start, end);
    }
    quadStroke(quad: Vector2[], quad_points: QuadConstruct): boolean {
        let self = this
        let result_type = self.compareQuadQuad(quad, quad_points);
        if (result_type == ResultType.Quad) {
            let path = self.stroke_type == StrokeType.Outer ? self.outer : self.inner

            path.quadraticCurveTo(
                quad_points.quad[1].x,
                quad_points.quad[1].y,
                quad_points.quad[2].x,
                quad_points.quad[2].y,
            );

            return true;
        }

        if (result_type == ResultType.Degenerate) {
            self.addDegenerateLine(quad_points);
            return true;
        }

        self.recursion_depth += 1;
        if (self.recursion_depth > RECURSIVE_LIMITS[QUAD_RECURSIVE_LIMIT]) {
            return false; // just abort if projected quad isn't representable
        }

        let half = QuadConstruct.default();
        half.initWithStart(quad_points);
        if (!self.quadStroke(quad, half)) {
            return false;
        }

        half.initWithEnd(quad_points);
        if (!self.quadStroke(quad, half)) {
            return false;
        }

        self.recursion_depth -= 1;
        return true
    }

    compareQuadQuad(
        quad: Vector2[],
        quad_points: QuadConstruct,
    ): ResultType {
        const self = this
        // get the quadratic approximation of the stroke
        if (!quad_points.start_set) {
            let quad_start_pt = Vector2.zero();
            self.quadPerpRay(
                quad,
                quad_points.start_t,
                quad_start_pt,
                quad_points.quad[0],
                quad_points.tangent_start,
            );
            quad_points.start_set = true;
        }

        if (!quad_points.end_set) {
            let quad_end_pt = Vector2.zero();
            self.quadPerpRay(
                quad,
                quad_points.end_t,
                quad_end_pt,
                quad_points.quad[2],
                quad_points.tangent_end,
            );
            quad_points.end_set = true;
        }

        let result_type = self.intersectRay(IntersectRayType.CtrlPt, quad_points);
        if (result_type != ResultType.Quad) {
            return result_type;
        }

        // project a ray from the curve to the stroke
        let ray0 = Vector2.zero();
        let ray1 = Vector2.zero();
        self.quadPerpRay(quad, quad_points.mid_t, ray1, ray0);
        return self.strokeCloseEnough(quad_points.quad.slice(), [ray0, ray1], quad_points)
    }
    // Given a point on the curve and its derivative, scale the derivative by the radius, and
    // compute the perpendicular point and its tangent.
    setRayPoints(
        tp: Vector2,
        dxy: Vector2,
        on_p: Vector2,
        tangent?: Vector2,
    ) {
        const self = this
        if (!dxy.setLength(self.radius)) {
            //*dxy = Vector2.create_xy(self.radius, 0.0);
            dxy.copy(Vector2.create(self.radius, 0.0))
        }

        let axis_flip = self.stroke_type as number; // go opposite ways for outer, inner
        on_p.x = tp.x + axis_flip * dxy.y;
        on_p.y = tp.y - axis_flip * dxy.x;

        if (tangent) {
            tangent.x = on_p.x + dxy.x;
            tangent.y = on_p.y + dxy.y;
        }
    }
    // Given a quad and t, return the point on curve,
    // its perpendicular, and the perpendicular tangent.
    quadPerpRay(
        quad: Vector2[],
        t: number,
        tp: Vector2,
        on_p: Vector2,
        tangent?: Vector2
    ) {
        let self = this
        let v1 = eval_quad_at(quad, t)
        // *tp = path_geometry.eval_quad_at(quad, t);
        tp.set(v1.x, v1.y)
        v1 = eval_quad_tangent_at(quad, t)
        let dxy = Vector2.create(v1.x, v1.y);

        if (dxy.isZero()) {
            dxy = quad[2].sub(quad[0]);
        }

        self.setRayPoints(tp, dxy, on_p, tangent);
    }
    strokeCloseEnough(
        stroke: Vector2[],
        ray: Vector2[],
        quad_points: QuadConstruct,
    ): ResultType {
        const self = this
        let half = 0.5;
        let stroke_mid = eval_quad_at(stroke, half);
        // measure the distance from the curve to the quad-stroke midpoint, compare to radius
        if (pointsWithinDist(ray[0], Vector2.create(stroke_mid.x, stroke_mid.y), self.inv_res_scale)) {
            // if the difference is small
            if (sharp_angle(quad_points.quad)) {
                return ResultType.Split;
            }

            return ResultType.Quad;
        }

        // measure the distance to quad's bounds (quick reject)
        // an alternative : look for point in triangle
        if (!ptInQuadBounds(stroke, ray[0], self.inv_res_scale)) {
            // if far, subdivide
            return ResultType.Split;
        }

        // measure the curve ray distance to the quad-stroke
        let roots = new Array(3).fill(0.5)
        roots = intersect_quad_ray(ray, stroke, roots);
        if (roots.length != 1) {
            return ResultType.Split;
        }

        let quad_pt = eval_quad_at(stroke, roots[0]);
        let error = self.inv_res_scale * (1.0 - Math.abs((roots[0] - 0.5)) * 2.0);
        if (pointsWithinDist(ray[0], Vector2.create(quad_pt.x, quad_pt.y), error)) {
            // if the difference is small, we're done
            if (sharp_angle(quad_points.quad)) {
                return ResultType.Split;
            }

            return ResultType.Quad;
        }

        // otherwise, subdivide
        return ResultType.Split
    }
    // Find the intersection of the stroke tangents to construct a stroke quad.
    // Return whether the stroke is a degenerate (a line), a quad, or must be split.
    // Optionally compute the quad's control point.
    intersectRay(
        intersect_ray_type: IntersectRayType,
        quad_points: QuadConstruct,
    ): ResultType {
        const self = this;
        let start = quad_points.quad[0];
        let end = quad_points.quad[2];
        let a_len = quad_points.tangent_start.clone().sub(start);
        let b_len = quad_points.tangent_end.clone().sub(end);

        // Slopes match when denom goes to zero:
        //                   axLen / ayLen ==                   bxLen / byLen
        // (ayLen * byLen) * axLen / ayLen == (ayLen * byLen) * bxLen / byLen
        //          byLen  * axLen         ==  ayLen          * bxLen
        //          byLen  * axLen         -   ayLen          * bxLen         ( == denom )
        let denom = a_len.cross(b_len);
        if (denom == 0.0 || !Number.isFinite(denom)) {
            quad_points.opposite_tangents = a_len.dot(b_len) < 0.0;
            return ResultType.Degenerate;
        }

        quad_points.opposite_tangents = false;
        let ab0 = start.clone().sub(end);
        let numer_a = b_len.cross(ab0);
        let numer_b = a_len.cross(ab0);
        if ((numer_a >= 0.0) == (numer_b >= 0.0)) {
            // if the control point is outside the quad ends

            // if the perpendicular distances from the quad points to the opposite tangent line
            // are small, a straight line is good enough
            let dist1 = ptToLine(start, end, quad_points.tangent_end);
            let dist2 = ptToLine(end, start, quad_points.tangent_start);
            if (Math.max(dist1, dist2) <= self.inv_res_scale_squared) {
                return ResultType.Degenerate;
            }

            return ResultType.Split;
        }

        // check to see if the denominator is teeny relative to the numerator
        // if the offset by one will be lost, the ratio is too large
        numer_a /= denom;
        let valid_divide = numer_a > numer_a - 1.0;
        if (valid_divide) {
            if (intersect_ray_type == IntersectRayType.CtrlPt) {
                // the intersection of the tangents need not be on the tangent segment
                // so 0 <= numerA <= 1 is not necessarily true
                quad_points.quad[1].x =
                    start.x * (1.0 - numer_a) + quad_points.tangent_start.x * numer_a;
                quad_points.quad[1].y =
                    start.y * (1.0 - numer_a) + quad_points.tangent_start.y * numer_a;
            }

            return ResultType.Quad;
        }

        quad_points.opposite_tangents = a_len.dot(b_len) < 0.0;

        // if the lines are parallel, straight line is good enough
        return ResultType.Degenerate
    }
    addDegenerateLine(quad_points: & QuadConstruct) {
        const self = this
        if (self.stroke_type == StrokeType.Outer) {
            self.outer
                .lineTo(quad_points.quad[2].x, quad_points.quad[2].y);
        } else {
            self.inner
                .lineTo(quad_points.quad[2].x, quad_points.quad[2].y);
        }
    }

    setCubicEndNormal(
        cubic: Vector2[],
        normal_ab: Vector2,
        unit_normal_ab: Vector2,
        normal_cd: Vector2,
        unit_normal_cd: Vector2,
    ) {
        let self = this
        let ab = cubic[1].clone().sub(cubic[0]);
        let cd = cubic[3].clone().sub(cubic[2]);

        let degenerate_ab = degenerateVector(ab);
        let degenerate_cb = degenerateVector(cd);

        if (degenerate_ab && degenerate_cb) {
            normal_cd.copy(normal_ab)
            unit_normal_cd.copy(unit_normal_ab)
            return;
        }

        if (degenerate_ab) {
            ab = cubic[2].clone().sub(cubic[0]);
            degenerate_ab = degenerateVector(ab);
        }

        if (degenerate_cb) {
            cd = cubic[3].clone().sub(cubic[1])
            degenerate_cb = degenerateVector(cd);
        }

        if (degenerate_ab || degenerate_cb) {
            // *normal_cd = normal_ab;
            //*unit_normal_cd = unit_normal_ab;
            normal_cd.copy(normal_ab)
            unit_normal_cd.copy(unit_normal_ab)
            return;
        }

        let res = setNormalUnitNormal2(cd, self.radius, normal_cd, unit_normal_cd);
        //debug_assert!(res);
        return res
    }

    lineTo(p: Vector2, iter?: PathSegmentsIter) {
        const self = this
        let teeny_line = self
            .prev_pt
            .equalsEpsilon(p, SCALAR_NEARLY_ZERO * self.inv_res_scale);
        if ((self.capper, lineCapButt) && teeny_line) {
            return;
        }

        if (teeny_line && (self.join_completed || iter && iter.hasValidTangent())) {
            return;
        }

        let normal = Vector2.default();
        let unit_normal = Vector2.default();
        if (!self.preJoinTo(p, true, normal, unit_normal)) {
            return;
        }

        self.outer.lineTo(p.x + normal.x, p.y + normal.y);
        self.inner.lineTo(p.x - normal.x, p.y - normal.y);

        self.postJoinTo(p, normal, unit_normal);
    }
    quadraticCurveTo(p1: Vector2, p2: Vector2) {
        const self = this
        let quad = [self.prev_pt, p1, p2];
        let [reduction, reduction_type] = check_quad_linear(quad);
        if (reduction_type == ReductionType.Point) {
            // If the stroke consists of a moveTo followed by a degenerate curve, treat it
            // as if it were followed by a zero-length line. Lines without length
            // can have square and round end caps.
            self.lineTo(p2);
            return;
        }

        if (reduction_type == ReductionType.Line) {
            self.lineTo(p2);
            return;
        }

        if (reduction_type == ReductionType.Degenerate) {
            self.lineTo(reduction);
            let save_joiner = self.joiner;
            self.joiner = lineJoinRound;
            self.lineTo(p2);
            self.joiner = save_joiner;
            return;
        }
        let normal_ab = Vector2.default();
        let unit_ab = Vector2.default()
        let normal_bc = Vector2.default()
        let unit_bc = Vector2.default()
        if (!self.preJoinTo(p1, false, normal_ab, unit_ab)) {
            self.lineTo(p2);
            return;
        }

        let quad_points = QuadConstruct.default();
        self.initQuad(
            StrokeType.Outer,
            0,
            1,
            quad_points,
        );
        self.quadStroke(quad, quad_points);
        self.initQuad(
            StrokeType.Inner,
            0,
            1,
            quad_points,
        );
        self.quadStroke(quad, quad_points);

        let ok = setNormalUnitNormal(
            quad[1],
            quad[2],
            self.res_scale,
            self.radius,
            normal_bc,
            unit_bc,
        );
        if (!ok) {
            normal_bc = normal_ab;
            unit_bc = unit_ab;
        }

        self.postJoinTo(p2, normal_bc, unit_bc);

    }
    bezierCurveTo(pt1: Vector2, pt2: Vector2, pt3: Vector2) {
        const self = this;
        let cubic = [self.prev_pt, pt1, pt2, pt3];
        let reduction = Array.from({ length: 3 }, () => Vector2.zero())
        let tangent_pt = Vector2.zero();

        let reduction_type = checkCubicLinear(cubic, reduction, tangent_pt);
        if ((reduction_type == ReductionType.Point)) {
            // If the stroke consists of a moveTo followed by a degenerate curve, treat it
            // as if it were followed by a zero-length line. Lines without length
            // can have square and round end caps.
            self.lineTo(pt3);
            return;
        }

        if ((reduction_type == ReductionType.Line)) {
            self.lineTo(pt3);
            return;
        }

        if (ReductionType.Degenerate <= reduction_type
            && ReductionType.Degenerate3 >= reduction_type) {
            self.lineTo(reduction[0]);
            let save_joiner = self.joiner;
            self.joiner = lineJoinRound;
            if ((ReductionType.Degenerate2 <= reduction_type)) {
                self.lineTo(reduction[1]);
            }

            if ((ReductionType.Degenerate3 == reduction_type)) {
                self.lineTo(reduction[2]);
            }

            self.lineTo(pt3);
            self.joiner = save_joiner;
            return;
        }

        //  debug_assert_eq!(reduction_type, ReductionType.Quad);
        let normal_ab = Vector2.zero();
        let unit_ab = Vector2.zero();
        let normal_cd = Vector2.zero();
        let unit_cd = Vector2.zero();
        if ((!self.preJoinTo(tangent_pt, false, normal_ab, unit_ab))) {
            self.lineTo(pt3);
            return;
        }

        let t_values = new Array(3).fill(0.5);
        t_values = find_cubic_inflections(cubic, t_values);
        let last_t = 0;
        for (let index = 0, len = t_values.length; index <= len; index++) {
            let next_t = Number.isFinite(t_values[index]) ? t_values[index] : 1


            let quad_points = QuadConstruct.default();
            self.initQuad(StrokeType.Outer, last_t, next_t, quad_points);
            self.cubicStroke(cubic, quad_points);
            self.initQuad(StrokeType.Inner, last_t, next_t, quad_points);
            self.cubicStroke(cubic, quad_points);
            last_t = next_t;
        }
        let cusp = find_cubic_cusp(cubic)
        if ((cusp)) {
            let cusp_loc = eval_cubic_pos_at(cubic, cusp);
            self.cusper.addCircle(cusp_loc.x, cusp_loc.y, self.radius);
        }

        // emit the join even if one stroke succeeded but the last one failed
        // this avoids reversing an inner stroke with a partial path followed by another moveto
        self.setCubicEndNormal(cubic, normal_ab, unit_ab, normal_cd, unit_cd);

        self.postJoinTo(pt3, normal_cd, unit_cd);
    }

    cubicStroke(cubic: Vector2[], quad_points: QuadConstruct): boolean {
        const self = this;
        if ((!self.found_tangents)) {
            let result_type = self.tangentsMeet(cubic, quad_points);
            if ((result_type != ResultType.Quad)) {
                let ok = pointsWithinDist(
                    quad_points.quad[0],
                    quad_points.quad[2],
                    self.inv_res_scale,
                );
                if ((result_type == ResultType.Degenerate || ok)
                    && self.cubicMidOnLine(cubic, quad_points)) {
                    self.addDegenerateLine(quad_points);
                    return true;
                }
            } else {
                self.found_tangents = true;
            }
        }

        if ((self.found_tangents)) {
            let result_type = self.compareQuadCubic(cubic, quad_points);
            if ((result_type == ResultType.Quad)) {
                let stroke = quad_points.quad;
                if ((self.stroke_type == StrokeType.Outer)) {
                    self.outer
                        .quadraticCurveTo(stroke[1].x, stroke[1].y, stroke[2].x, stroke[2].y);
                } else {
                    self.inner
                        .quadraticCurveTo(stroke[1].x, stroke[1].y, stroke[2].x, stroke[2].y);
                }

                return true;
            }

            if ((result_type == ResultType.Degenerate)) {
                if ((!quad_points.opposite_tangents)) {
                    self.addDegenerateLine(quad_points);
                    return true;
                }
            }
        }

        if ((!Number.isFinite(quad_points.quad[2].x) || !Number.isFinite(quad_points.quad[2].x))) {
            return false; // just abort if projected quad isn't representable
        }

        self.recursion_depth += 1;

        if ((self.recursion_depth > RECURSIVE_LIMITS[Number(self.found_tangents)])) {
            return false; // just abort if projected quad isn't representable
        }

        let half = QuadConstruct.default();
        if ((!half.initWithStart(quad_points))) {
            self.addDegenerateLine(quad_points);
            self.recursion_depth -= 1;
            return true;
        }

        if ((!self.cubicStroke(cubic, half))) {
            return false;
        }

        if ((!half.initWithEnd(quad_points))) {
            self.addDegenerateLine(quad_points);
            self.recursion_depth -= 1;
            return true;
        }

        if ((!self.cubicStroke(cubic, half))) {
            return false;
        }

        self.recursion_depth -= 1;
        return true
    }
    cubicMidOnLine(cubic: Vector2[], quad_points: QuadConstruct): boolean {
        let self = this
        let stroke_mid = Vector2.zero();
        self.cubicQuadMid(cubic, quad_points, stroke_mid);
        let dist = ptToLine(stroke_mid, quad_points.quad[0], quad_points.quad[2]);
        return dist < self.inv_res_scale_squared
    }

    cubicQuadMid(cubic: Vector2[], quad_points: QuadConstruct, mid: Vector2) {
        let cubic_mid_pt = Vector2.zero();
        this.cubicPerpRay(cubic, quad_points.mid_t, cubic_mid_pt, mid);
    }

    compareQuadCubic(
        cubic: Vector2[],
        quad_points: QuadConstruct,
    ): ResultType {
        let self = this
        // get the quadratic approximation of the stroke
        self.cubicQuadEnds(cubic, quad_points);
        let result_type = self.intersectRay(IntersectRayType.CtrlPt, quad_points);
        if (result_type != ResultType.Quad) {
            return result_type;
        }

        // project a ray from the curve to the stroke
        // points near midpoint on quad, midpoint on cubic
        let ray0 = Vector2.zero();
        let ray1 = Vector2.zero();
        self.cubicPerpRay(cubic, quad_points.mid_t, ray1, ray0);
        return self.strokeCloseEnough(quad_points.quad.slice(), [ray0, ray1], quad_points)
    }

    // Given a cubic and a t range, find the start and end if they haven't been found already.
    cubicQuadEnds(cubic: Vector2[], quad_points: QuadConstruct) {
        const self = this;
        if (!quad_points.start_set) {
            let cubic_start_pt = Vector2.zero();
            self.cubicPerpRay(
                cubic,
                quad_points.start_t,
                cubic_start_pt,
                quad_points.quad[0],
                quad_points.tangent_start,
            );
            quad_points.start_set = true;
        }

        if (!quad_points.end_set) {
            let cubic_end_pt = Vector2.zero();
            self.cubicPerpRay(
                cubic,
                quad_points.end_t,
                cubic_end_pt,
                quad_points.quad[2],
                quad_points.tangent_end,
            );
            quad_points.end_set = true;
        }
    }
    tangentsMeet(cubic: Vector2[], quad_points: QuadConstruct): ResultType {
        this.cubicQuadEnds(cubic, quad_points);
        return this.intersectRay(IntersectRayType.ResultType, quad_points)
    }
    // Given a cubic and t, return the point on curve,
    // its perpendicular, and the perpendicular tangent.
    cubicPerpRay(
        cubic: Vector2[],
        t: number,
        t_pt: Vector2,
        on_pt: Vector2,
        tangent?: Vector2
    ) {
        let self = this

        //*t_pt = path_geometry.eval_cubic_pos_at(cubic, t);
        t_pt.copy(eval_cubic_pos_at(cubic, t))
        let dxy = eval_cubic_tangent_at(cubic, t);

        let chopped = Array.from({ length: 7 }, () => Vector2.zero());
        if (dxy.x == 0.0 && dxy.y == 0.0) {
            let c_points: Vector2[] = cubic;
            if (scalarNearlyZero(t)) {
                dxy = cubic[2].clone().sub(cubic[0]);
            } else if (scalarNearlyZero(1.0 - t)) {
                dxy = cubic[3].clone().sub(cubic[1]);
            } else {
                // If the cubic inflection falls on the cusp, subdivide the cubic
                // to find the tangent at that point.
                //
                // Unwrap never fails, because we already checked that `t` is not 0/1,;

                chop_cubic_at2(cubic, t, chopped);
                dxy = chopped[3].clone().sub(chopped[2]);
                if (dxy.x == 0.0 && dxy.y == 0.0) {
                    dxy = chopped[3].clone().sub(chopped[1]);
                    c_points = chopped;
                }
            }

            if (dxy.x == 0.0 && dxy.y == 0.0) {
                dxy = c_points[3].clone().sub(c_points[0]);
            }
        }

        self.setRayPoints(t_pt, dxy, on_pt, tangent);
    }



    stroke(path: PathBuilder, paint: { strokeWidth: number; miterLimit: number; lineCap: LineCap; lineJoin: LineJoin }) {
        return this.strokeInner(path, paint.strokeWidth, paint.miterLimit, paint.lineCap, paint.lineJoin, this.res_scale)
    }
    strokeInner(path: PathBuilder,
        width: number,
        miterLimit: number,
        lineCap: LineCap,
        lineJoin: LineJoin,
        resScale: number) {
        const self = this;
        
        let inv_miter_limit = 0.0;
        if (lineJoin == LineJoin.Miter) {
            if (miterLimit <= 1) {
                lineJoin = LineJoin.Bevel;
            } else {
                inv_miter_limit = 1 / miterLimit;
            }
        }

        if (lineJoin == LineJoin.MiterClip) {
            inv_miter_limit = 1 / miterLimit
        }

        self.res_scale = resScale;
        // The '4' below matches the fill scan converter's error term.
        self.inv_res_scale = 1 / (resScale * 4.0);
        self.inv_res_scale_squared = (self.inv_res_scale ** 2);

        self.radius = width * 0.5;
        self.inv_miter_limit = inv_miter_limit;

        self.first_normal = Vector2.default();
        self.prev_normal = Vector2.default();
        self.first_unit_normal = Vector2.default();
        self.prev_unit_normal = Vector2.default();

        self.first_pt = Vector2.default();
        self.prev_pt = Vector2.default();

        self.first_outer_pt = Vector2.default();
        self.first_outer_pt_index_in_contour = 0;
        self.segment_count = -1;
        self.prev_is_line = false;

        self.capper = capFactory[lineCap];
        self.joiner = joinFactory[lineJoin];

        // Need some estimate of how large our final result (fOuter)
        // and our per-contour temp (fInner) will be, so we don't spend
        // extra time repeatedly growing these arrays.
        //
        // 1x for inner == 'wag' (worst contour length would be better guess)
        self.inner.clear();
        // self.inner.reserve(path.verbs.len(), path.points.len());

        // 3x for result == inner + outer + join (swag)
        self.outer.clear();
        // self.outer
        //     .reserve(path.verbs.len() * 3, path.points.len() * 3);

        self.cusper.clear();

        self.stroke_type = StrokeType.Outer;

        self.recursion_depth = 0;
        self.found_tangents = false;
        self.join_completed = false;

        let last_segment_is_line = false;
        let iter = new PathSegmentsIter({
            path: path,
            verbIndex: 0,
            pointsIndex: 0,
            isAutoClose: true
        })
        iter.setAutoClose(true);
        for (let d of iter) {
            switch (d.type) {
                case PathVerb.MoveTo:
                    self.moveTo(d.p0!);
                    break;
                case PathVerb.LineTo:
                    self.lineTo(d.p0!, iter);
                    last_segment_is_line = true;
                    break;
                case PathVerb.QuadCurveTo:
                    self.quadraticCurveTo(d.p1!, d.p2!);
                    last_segment_is_line = false;
                    break;
                case PathVerb.CubicCurveTo:
                    self.bezierCurveTo(d.p1!, d.p2!, d.p3!);
                    last_segment_is_line = false;
                    break;
                case PathVerb.Close:
                    if (lineCap != LineCap.Butt) {
                        // If the stroke consists of a moveTo followed by a close, treat it
                        // as if it were followed by a zero-length line. Lines without length
                        // can have square and round end caps.
                        if (self.hasOnlyMoveTo()) {
                            self.lineTo(self.moveToPt);
                            last_segment_is_line = true;
                            continue;
                        }

                        // If the stroke consists of a moveTo followed by one or more zero-length
                        // verbs, then followed by a close, treat is as if it were followed by a
                        // zero-length line. Lines without length can have square & round end caps.
                        if (self.isCurrentContourEmpty()) {
                            last_segment_is_line = true;
                            continue;
                        }
                    }

                    self.close(last_segment_is_line);
                    break;

            }
        }

        return self.finish(last_segment_is_line)
    }
    finish(is_line: boolean) {
        this.finishContour(false, is_line);

        // Swap out the outer builder.
        let buf = this.outer.clone()
        return buf
    }

    hasOnlyMoveTo() {
        return this.segment_count == 0
    }

    isCurrentContourEmpty() {
        return this.inner.isZeroLengthSincePoint(0)
            && this
                .outer
                .isZeroLengthSincePoint(this.first_outer_pt_index_in_contour)
    }


}
