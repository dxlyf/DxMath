
import { Point } from '../point';
import {Path,PathSegmentsIter} from './path'
import { PathBuilder } from './path_builder';
declare module './path'{
     interface Path{
         dash(dash:StrokeDash,resolution_scale:f32):Option<Path>
     }
}

export class StrokeDash{
    static new(dash_array:f32[], dash_offset:f32){
        // 计算dash_array中所有元素的总和，作为间隔长度
        let interval_len:f32 = dash_array.reduce((a, b) => a + b, 0);
        // 调整dash_offset，确保其在合法范围内
         dash_offset = adjust_dash_offset(dash_offset, interval_len);
    
        // 找到第一个间隔的长度和索引
         let [first_len, first_index] = find_first_interval(dash_array, dash_offset);
        // 创建一个新的实例
        const dash = new this();
        // 设置dash的属性
        dash.array = dash_array;
        dash.offset = dash_offset;
        dash.interval_len = interval_len;
        dash.first_len = first_len;
        dash.first_index = first_index;

        return dash;
    }
    array:f32[]=[]
    offset:number=0
    interval_len:number=0
    first_len:number=0
    first_index:number=0   
}

function adjust_dash_offset(offset: f32, len: f32):f32 {
    if(offset < 0.0 ){
        offset = -offset;
        if(offset > len) {
            offset %= len;
        }

        offset = len - offset;

        // Due to finite precision, it's possible that phase == len,
        // even after the subtract (if len >>> phase), so fix that here.
       
        if(offset == len ){
            offset = 0.0;
        }

    } else if( offset >= len) {
        offset=offset % len
    }
    return offset
}

function find_first_interval(dash_array: f32[],dash_offset: f32):[f32, usize] {
    for(let [i,gap] of dash_array.entries()) {
        if( dash_offset > gap || (dash_offset == gap && gap != 0.0)) {
            dash_offset -= gap;
        } else {
            return [gap - dash_offset, i];
        }
    }

    // If we get here, phase "appears" to be larger than our length. This
    // shouldn't happen with perfect precision, but we can accumulate errors
    // during the initial length computation (rounding can make our sum be too
    // big or too small. In that event, we just have to eat the error here.
    return [dash_array[0], 0]
}


Path.prototype.dash=function(dash:StrokeDash,resolution_scale:f32):Option<Path>{

}
function dash_impl(src: Path, dash: StrokeDash, res_scale: f32):Option<Path> {
    // We do not support the `cull_path` branch here.
    // Skia has a lot of code for cases when a path contains only a single zero-length line
    // or when a path is a rect. Not sure why.
    // We simply ignoring it for the sake of simplicity.

    // We also doesn't support the `SpecialLineRec` case.
    // I have no idea what the point in it.

    const is_even=(x: usize):bool=> {
        return x % 2 == 0
    }

    let  pb = PathBuilder.new();
    let  dash_count = 0.0;
    let contours=ContourMeasureIter.new(src, res_scale)
    for contour in ContourMeasureIter::new(src, res_scale) {
        let mut skip_first_segment = contour.is_closed;
        let mut added_segment = false;
        let length = contour.length;
        let mut index = dash.first_index;

      //由于路径长度/虚线长度之比可能是任意大，我们可以施加
        //尝试构建过滤路径时内存压力很大。为了避免这种情况，
        //超过某个阈值我们就放弃冲刺。
        //
        //原始错误报告（http://crbug.com/165432）基于产生超过
        //9000 万个破折号段导致内存分配器崩溃。限额100万
//段似乎是合理的：每个段 2 个动词 *每个动词 9 个字节，这限制了
        //每个路径的最大破折号内存开销约为 17MB。
        const MAX_DASH_COUNT: usize = 1000000;
        dash_count += length * (dash.array.len() >> 1) as f32 / dash.interval_len.get();
        if dash_count > MAX_DASH_COUNT as f32 {
            return None;
        }

        // Using double precision to avoid looping indefinitely due to single precision rounding
        // (for extreme path_length/dash_length ratios). See test_infinite_dash() unittest.
        let mut distance = 0.0;
        let mut d_len = dash.first_len;

        while distance < length {
            debug_assert!(d_len >= 0.0);
            added_segment = false;
            if is_even(index) && !skip_first_segment {
                added_segment = true;
                contour.push_segment(distance, distance + d_len, true, &mut pb);
            }

            distance += d_len;

            // clear this so we only respect it the first time around
            skip_first_segment = false;

            // wrap around our intervals array if necessary
            index += 1;
            debug_assert!(index <= dash.array.len());
            if index == dash.array.len() {
                index = 0;
            }

            // fetch our next d_len
            d_len = dash.array[index];
        }

        // extend if we ended on a segment and we need to join up with the (skipped) initial segment
        if contour.is_closed && is_even(dash.first_index) && dash.first_len >= 0.0 {
            contour.push_segment(0.0, dash.first_len, !added_segment, &mut pb);
        }
    }

    pb.finish()
}
const MAX_T_VALUE:u32=0x3FFFFFFF
class ContourMeasureIter{
    static new(path:Path,res_scale:f32){
        const CHEAP_DIST_LIMIT: f32 = 0.5; // just made this value up

        return new ContourMeasureIter({
            iter: path.segments(),
            tolerance: CHEAP_DIST_LIMIT * (1/res_scale),
        })
    }
    iter!:PathSegmentsIter
    tolerance:f32=0
    constructor(opts:any){
        Object.assign(this,opts)
    }
    *[Symbol.iterator](){
        let contour=ContourMeasure.default()
    }
}
enum SegmentType {
    Line,
    Quad,
    Cubic,
}

class Segment{
    distance:f32=0
    point_index:usize=0
    t_value:u32=0
    kind:SegmentType=SegmentType.Line

    scalar_t(){
        const MAX_T_RECIPROCAL: f32 = 1.0 / MAX_T_VALUE as f32;
        this.t_value*MAX_T_RECIPROCAL
    }

}
class ContourMeasure{
    segments:Segment[]=[]
    points:Point[]=[]
    length:f32=0
    is_closed:bool=false

     push_segment(
         start_d: f32,
         stop_d: f32,
        start_with_move_to: bool,
        pb:PathBuilder,
    ) {
        const selft=this
        if (start_d < 0.0) {
            start_d = 0.0;
        }

        if stop_d > self.length {
            stop_d = self.length;
        }

        if !(start_d <= stop_d) {
            // catch NaN values as well
            return;
        }

        if self.segments.is_empty() {
            return;
        }

        let (seg_index, mut start_t) = match self.distance_to_segment(start_d) {
            Some(v) => v,
            None => return,
        };
        let mut seg = self.segments[seg_index];

        let (stop_seg_index, stop_t) = match self.distance_to_segment(stop_d) {
            Some(v) => v,
            None => return,
        };
        let stop_seg = self.segments[stop_seg_index];

        debug_assert!(stop_seg_index <= stop_seg_index);
        let mut p = Point::zero();
        if start_with_move_to {
            compute_pos_tan(
                &self.points[seg.point_index..],
                seg.kind,
                start_t,
                Some(&mut p),
                None,
            );
            pb.move_to(p.x, p.y);
        }

        if seg.point_index == stop_seg.point_index {
            segment_to(
                &self.points[seg.point_index..],
                seg.kind,
                start_t,
                stop_t,
                pb,
            );
        } else {
            let mut new_seg_index = seg_index;
            loop {
                segment_to(
                    &self.points[seg.point_index..],
                    seg.kind,
                    start_t,
                    NormalizedF32::ONE,
                    pb,
                );

                let old_point_index = seg.point_index;
                loop {
                    new_seg_index += 1;
                    if self.segments[new_seg_index].point_index != old_point_index {
                        break;
                    }
                }
                seg = self.segments[new_seg_index];

                start_t = NormalizedF32::ZERO;

                if seg.point_index >= stop_seg.point_index {
                    break;
                }
            }

            segment_to(
                &self.points[seg.point_index..],
                seg.kind,
                NormalizedF32::ZERO,
                stop_t,
                pb,
            );
        }
    }

    fn distance_to_segment(&self, distance: f32) -> Option<(usize, NormalizedF32)> {
        debug_assert!(distance >= 0.0 && distance <= self.length);

        let mut index = find_segment(&self.segments, distance);
        // don't care if we hit an exact match or not, so we xor index if it is negative
        index ^= index >> 31;
        let index = index as usize;
        let seg = self.segments[index];

        // now interpolate t-values with the prev segment (if possible)
        let mut start_t = 0.0;
        let mut start_d = 0.0;
        // check if the prev segment is legal, and references the same set of points
        if index > 0 {
            start_d = self.segments[index - 1].distance;
            if self.segments[index - 1].point_index == seg.point_index {
                debug_assert!(self.segments[index - 1].kind == seg.kind);
                start_t = self.segments[index - 1].scalar_t();
            }
        }

        debug_assert!(seg.scalar_t() > start_t);
        debug_assert!(distance >= start_d);
        debug_assert!(seg.distance > start_d);

        let t =
            start_t + (seg.scalar_t() - start_t) * (distance - start_d) / (seg.distance - start_d);
        let t = NormalizedF32::new(t)?;
        Some((index, t))
    }

    fn compute_line_seg(
        &mut self,
        p0: Point,
        p1: Point,
        mut distance: f32,
        point_index: usize,
    ) -> f32 {
        let d = p0.distance(p1);
        debug_assert!(d >= 0.0);
        let prev_d = distance;
        distance += d;
        if distance > prev_d {
            debug_assert!(point_index < self.points.len());
            self.segments.push(Segment {
                distance,
                point_index,
                t_value: MAX_T_VALUE,
                kind: SegmentType::Line,
            });
        }

        distance
    }

    fn compute_quad_segs(
        &mut self,
        p0: Point,
        p1: Point,
        p2: Point,
        mut distance: f32,
        min_t: u32,
        max_t: u32,
        point_index: usize,
        tolerance: f32,
    ) -> f32 {
        if t_span_big_enough(max_t - min_t) != 0 && quad_too_curvy(p0, p1, p2, tolerance) {
            let mut tmp = [Point::zero(); 5];
            let half_t = (min_t + max_t) >> 1;

            path_geometry::chop_quad_at(&[p0, p1, p2], NormalizedF32Exclusive::HALF, &mut tmp);
            distance = self.compute_quad_segs(
                tmp[0],
                tmp[1],
                tmp[2],
                distance,
                min_t,
                half_t,
                point_index,
                tolerance,
            );
            distance = self.compute_quad_segs(
                tmp[2],
                tmp[3],
                tmp[4],
                distance,
                half_t,
                max_t,
                point_index,
                tolerance,
            );
        } else {
            let d = p0.distance(p2);
            let prev_d = distance;
            distance += d;
            if distance > prev_d {
                debug_assert!(point_index < self.points.len());
                self.segments.push(Segment {
                    distance,
                    point_index,
                    t_value: max_t,
                    kind: SegmentType::Quad,
                });
            }
        }

        distance
    }

    fn compute_cubic_segs(
        &mut self,
        p0: Point,
        p1: Point,
        p2: Point,
        p3: Point,
        mut distance: f32,
        min_t: u32,
        max_t: u32,
        point_index: usize,
        tolerance: f32,
    ) -> f32 {
        if t_span_big_enough(max_t - min_t) != 0 && cubic_too_curvy(p0, p1, p2, p3, tolerance) {
            let mut tmp = [Point::zero(); 7];
            let half_t = (min_t + max_t) >> 1;

            path_geometry::chop_cubic_at2(
                &[p0, p1, p2, p3],
                NormalizedF32Exclusive::HALF,
                &mut tmp,
            );
            distance = self.compute_cubic_segs(
                tmp[0],
                tmp[1],
                tmp[2],
                tmp[3],
                distance,
                min_t,
                half_t,
                point_index,
                tolerance,
            );
            distance = self.compute_cubic_segs(
                tmp[3],
                tmp[4],
                tmp[5],
                tmp[6],
                distance,
                half_t,
                max_t,
                point_index,
                tolerance,
            );
        } else {
            let d = p0.distance(p3);
            let prev_d = distance;
            distance += d;
            if distance > prev_d {
                debug_assert!(point_index < self.points.len());
                self.segments.push(Segment {
                    distance,
                    point_index,
                    t_value: max_t,
                    kind: SegmentType::Cubic,
                });
            }
        }

        distance
    }
}