import { AAMaskCtx, Context, MaskCtx } from ".";
import { PixmapRef, SubPixmapMut } from "../pixmap";
import {F32x8} from '../wide/f32x8'
export type Stagefunction = (p:Pipeline)=>void;


export class Pipeline{
    index:usize=0
    functions:StageFn[]=[]
    pixmap_src!: PixmapRef
    pixmap_dst!: SubPixmapMut
    ctx!:Context
    mask_ctx!: MaskCtx
    aa_mask_ctx!:AAMaskCtx
    r: F32x8=F32x8.default()
    g: F32x8=F32x8.default()
    b: F32x8=F32x8.default()
    a: F32x8=F32x8.default()
    dr: F32x8=F32x8.default()
    dg: F32x8=F32x8.default()
    db: F32x8=F32x8.default()
    da: F32x8=F32x8.default()
    tail: usize=0
    dx: usize=0
    dy: usize=0
    next_stage(){
        let next=this.functions[this.index]
        this.index+=1
        next(this)
    }
}
 export type StageFn = (p:Pipeline)=>void

// Must be in the same order as raster_pipeline.Stage
export const STAGES:StageFn[]= [
    move_source_to_destination,
    move_destination_to_source,
    clamp_0,
    clamp_a,
    premultiply,
    uniform_color,
    seed_shader,
    load_dst,
    store,
    load_dst_u8,
    store_u8,
    gather,
    load_mask_u8,
    mask_u8,
    scale_u8,
    lerp_u8,
    scale_1_float,
    lerp_1_float,
    // destination_atop,
    // destination_in,
    // destination_out,
    // destination_over,
    // source_atop,
    // source_in,
    // source_out,
    // source_over,
    // clear,
    // modulate,
    // multiply,
    // plus,
    // screen,
    // xor,
    // color_burn,
    // color_dodge,
    // darken,
    // difference,
    // exclusion,
    // hard_light,
    // lighten,
    // overlay,
    // soft_light,
    // hue,
    // saturation,
    // color,
    // luminosity,
    // source_over_rgba,
    // transform,
    // reflect,
    // repeat,
    // bilinear,
    // bicubic,
    // pad_x1,
    // reflect_x1,
    // repeat_x1,
    // gradient,
    // evenly_spaced_2_stop_gradient,
    // xy_to_radius,
    // xy_to_2pt_conical_focal_on_circle,
    // xy_to_2pt_conical_well_behaved,
    // xy_to_2pt_conical_greater,
    // mask_2pt_conical_degenerates,
    // apply_vector_mask,
    // gamma_expand_2,
    // gamma_expand_dst_2,
    // gamma_compress_2,
    // gamma_expand_22,
    // gamma_expand_dst_22,
    // gamma_compress_22,
    // gamma_expand_srgb,
    // gamma_expand_dst_srgb,
    // gamma_compress_srgb,
];




function move_source_to_destination(p:Pipeline) {
    p.dr = p.r;
    p.dg = p.g;
    p.db = p.b;
    p.da = p.a;

     p.next_stage();
}

function premultiply(p:Pipeline) {
    p.r *= p.a;
    p.g *= p.a;
    p.b *= p.a;

    p.next_stage();
}

function move_destination_to_source(p:Pipeline) {
    p.r = p.dr;
    p.g = p.dg;
    p.b = p.db;
    p.a = p.da;

    p.next_stage();
}

function clamp_0(p:Pipeline) {
    p.r = p.r.max(F32x8.default());
    p.g = p.g.max(F32x8.default());
    p.b = p.b.max(F32x8.default());
    p.a = p.a.max(F32x8.default());

    p.next_stage();
}

function clamp_a(p:Pipeline) {
    p.r = p.r.min(F32x8.splat(1.0));
    p.g = p.g.min(F32x8.splat(1.0));
    p.b = p.b.min(F32x8.splat(1.0));
    p.a = p.a.min(F32x8.splat(1.0));

    p.next_stage();
}

function uniform_color(p:Pipeline) {
    let ctx = p.ctx.uniform_color;
    p.r = F32x8.splat(ctx.r);
    p.g = F32x8.splat(ctx.g);
    p.b = F32x8.splat(ctx.b);
    p.a = F32x8.splat(ctx.a);

    p.next_stage();
}

function seed_shader(p:Pipeline) {
    // let iota = F32x8.from([0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5]);

    // p.r = F32x8.splat(p.dx as f32) + iota;
    // p.g = F32x8.splat(p.dy as f32 + 0.5);
    // p.b = F32x8.splat(1.0);
    // p.a = F32x8.default();

    // p.dr = F32x8.default();
    // p.dg = F32x8.default();
    // p.db = F32x8.default();
    // p.da = F32x8.default();

    p.next_stage();
}

 function load_dst(p:Pipeline) {
   // load_8888(p.pixmap_dst.slice4_at_xy(p.dx, p.dy),p.dr,p.dg,p.db,p.da);
    p.next_stage();
}

 function load_dst_tail(p:Pipeline) {
   // load_8888_tail(p.tail, p.pixmap_dst.slice_at_xy(p.dx, p.dy),p.dr,p.dg,p.db,p.da);
    p.next_stage();
}

 function store(p:Pipeline) {
   // store_8888(p.r, p.g, p.b, p.a, p.pixmap_dst.slice4_at_xy(p.dx, p.dy));
    p.next_stage();
}

 function store_tail(p:Pipeline) {
    //store_8888_tail(p.r, p.g, p.b, p.a, p.tail, p.pixmap_dst.slice_at_xy(p.dx, p.dy));
    p.next_stage();
}

// Currently, all mask/A8 pixmaps are handled by lowp.
 function load_dst_u8(_:Pipeline) {
    // unreachable
}

 function load_dst_u8_tail(_:Pipeline) {
    // unreachable
}

 function store_u8(_:Pipeline) {
    // unreachable
}

 function store_u8_tail(_:Pipeline) {
    // unreachable
}

 function gather(p:Pipeline) {
  //  let ix = gather_ix(p.pixmap_src, p.r, p.g);
   // load_8888(p.pixmap_src.gather(ix),p.r,p.g,p.b,p.a);

    p.next_stage();
}


function gather_ix(pixmap: PixmapRef,x: F32x8,y: F32x8): F32x8 {
    // Exclusive: inclusive.
    let w = ulp_sub(pixmap.width as f32);
    let h = ulp_sub(pixmap.height as f32);
    x = x.max(F32x8.default()).min(F32x8.splat(w));
    y = y.max(F32x8.default()).min(F32x8.splat(h));

  //  return (y.trunc_int() * i32x8.splat(pixmap.width() as i32) + x.trunc_int()).to_u32x8_bitcast()
}

function ulp_sub(v: f32): f32 {
    // Somewhat similar to v - f32.EPSILON
   // bytemuck.cast.<u32, f32>(bytemuck.cast.<f32, u32>(v) - 1)
}

function load_mask_u8(_:Pipeline) {
    // unreachable
}

function mask_u8(p:Pipeline) {
    let offset = p.mask_ctx.offset(p.dx, p.dy);
    let c = Array.from({length:8},()=>0);
    // for i in 0..p.tail {
    //     c[i] = p.mask_ctx.data[offset + i] as f32;
    // }
    // let c = F32x8.from(c) / F32x8.splat(255.0);

    // if c == F32x8.default() {
    //     return;
    // }

    // p.r *= c;
    // p.g *= c;
    // p.b *= c;
    // p.a *= c;

    p.next_stage();
}

function scale_u8(p:Pipeline) {
    // Load u8xTail and cast it to F32x8.
    // let data = p.aa_mask_ctx.copy_at_xy(p.dx, p.dy, p.tail);
    // let c = F32x8.from([data[0] as f32, data[1] as f32, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]);
    // let c = c / F32x8.splat(255.0);

    // p.r *= c;
    // p.g *= c;
    // p.b *= c;
    // p.a *= c;

    p.next_stage();
}

function lerp_u8(p:Pipeline) {
    // Load u8xTail and cast it to F32x8.
    // let data = p.aa_mask_ctx.copy_at_xy(p.dx, p.dy, p.tail);
    // let c = F32x8.from([data[0] as f32, data[1] as f32, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]);
    // let c = c / F32x8.splat(255.0);

    // p.r = lerp(p.dr, p.r, c);
    // p.g = lerp(p.dg, p.g, c);
    // p.b = lerp(p.db, p.b, c);
    // p.a = lerp(p.da, p.a, c);

    p.next_stage();
}

function scale_1_float(p:Pipeline) {
    // let c = F32x8.splat(p.ctx.current_coverage);
    // p.r *= c;
    // p.g *= c;
    // p.b *= c;
    // p.a *= c;

    p.next_stage();
}

function lerp_1_float(p:Pipeline) {
    let c = F32x8.splat(p.ctx.current_coverage);
    p.r = lerp(p.dr, p.r, c);
    p.g = lerp(p.dg, p.g, c);
    p.b = lerp(p.db, p.b, c);
    p.a = lerp(p.da, p.a, c);

    p.next_stage();
}

// macro_rules! blend_function {
//     ($name:ident, $f:expr) => {
//         function $name(p:Pipeline) {
//             p.r = $f(p.r, p.dr, p.a, p.da);
//             p.g = $f(p.g, p.dg, p.a, p.da);
//             p.b = $f(p.b, p.db, p.a, p.da);
//             p.a = $f(p.a, p.da, p.a, p.da);

//             p.next_stage();
//         }
//     };
// }

// blend_fn!(clear,            |_, _,  _,  _| F32x8.default());
// blend_fn!(source_atop,      |s, d, sa, da| s * da + d * inv(sa));
// blend_fn!(destination_atop, |s, d, sa, da| d * sa + s * inv(da));
// blend_fn!(source_in,        |s, _,  _, da| s * da);
// blend_fn!(destination_in,   |_, d, sa,  _| d * sa);
// blend_fn!(source_out,       |s, _,  _, da| s * inv(da));
// blend_fn!(destination_out,  |_, d, sa,  _| d * inv(sa));
// blend_fn!(source_over,      |s, d, sa,  _| mad(d, inv(sa), s));
// blend_fn!(destination_over, |s, d,  _, da| mad(s, inv(da), d));
// blend_fn!(modulate,         |s, d,  _,  _| s * d);
// blend_fn!(multiply,         |s, d, sa, da| s * inv(da) + d * inv(sa) + s * d);
// blend_fn!(screen,           |s, d,  _,  _| s + d - s * d);
// blend_fn!(xor,              |s, d, sa, da| s * inv(da) + d * inv(sa));

// Wants a type for some reason.
//blend_fn!(plus, |s: F32x8, d: F32x8, _, _| (s + d).min(F32x8.splat(1.0)));

macro_rules! blend_fn2 {
    ($name:ident, $f:expr) => {
        function $name(p:Pipeline) {
            // The same logic applied to color, and source_over for alpha.
            p.r = $f(p.r, p.dr, p.a, p.da);
            p.g = $f(p.g, p.dg, p.a, p.da);
            p.b = $f(p.b, p.db, p.a, p.da);
            p.a = mad(p.da, inv(p.a), p.a);

            p.next_stage();
        }
    };
}

blend_fn2!(darken,      |s: F32x8, d, sa, da: F32x8| s + d - (s * da).max(d * sa));
blend_fn2!(lighten,     |s: F32x8, d, sa, da: F32x8| s + d - (s * da).min(d * sa));
blend_fn2!(difference,  |s: F32x8, d, sa, da: F32x8| s + d - two((s * da).min(d * sa)));
blend_fn2!(exclusion,   |s: F32x8, d,  _,  _| s + d - two(s * d));

blend_fn2!(color_burn, |s: F32x8, d: F32x8, sa: F32x8, da: F32x8|
    d.cmp_eq(da).blend(
        d + s * inv(da),
        s.cmp_eq(F32x8.default()).blend(
            d * inv(sa),
            sa * (da - da.min((da - d) * sa * s.recip_fast())) + s * inv(da) + d * inv(sa)
        )
    )
);

blend_fn2!(color_dodge, |s: F32x8, d: F32x8, sa: F32x8, da: F32x8|
    d.cmp_eq(F32x8.default()).blend(
        s * inv(da),
        s.cmp_eq(sa).blend(
            s + d * inv(sa),
            sa * da.min((d * sa) * (sa - s).recip_fast()) + s * inv(da) + d * inv(sa)
        )
    )
);

blend_fn2!(hard_light, |s: F32x8, d: F32x8, sa, da|
    s * inv(da) + d * inv(sa) + two(s).cmp_le(sa).blend(
        two(s * d),
        sa * da - two((da - d) * (sa - s))
    )
);

blend_fn2!(overlay, |s: F32x8, d: F32x8, sa, da|
    s * inv(da) + d * inv(sa) + two(d).cmp_le(da).blend(
        two(s * d),
        sa * da - two((da - d) * (sa - s))
    )
);

blend_fn2!(soft_light, |s: F32x8, d: F32x8, sa: F32x8, da: F32x8| {
    let m  = da.cmp_gt(F32x8.default()).blend(d / da, F32x8.default());
    let s2 = two(s);
    let m4 = two(two(m));

    // The logic forks three ways:
    //    1. dark src?
    //    2. light src, dark dst?
    //    3. light src, light dst?
    let dark_src = d * (sa + (s2 - sa) * (F32x8.splat(1.0) - m));
    let dark_dst = (m4 * m4 + m4) * (m - F32x8.splat(1.0)) + F32x8.splat(7.0) * m;
    let lite_dst = m.sqrt() - m;
    let lite_src = d * sa + da * (s2 - sa)
        * two(two(d)).cmp_le(da).blend(dark_dst, lite_dst); // 2 or 3?

    s * inv(da) + d * inv(sa) + s2.cmp_le(sa).blend(dark_src, lite_src) // 1 or (2 or 3)?
});

// We're basing our implementation of non-separable blend modes on
//   https://www.w3.org/TR/compositing-1/#blendingnonseparable.
// and
//   https://www.khronos.org/registry/OpenGL/specs/es/3.2/es_spec_3.2.pdf
// They're equivalent, but ES' math has been better simplified.
//
// Anything extra we add beyond that is to make the math work with premul inputs.

// macro_rules! blend_fn3 {
//     ($name:ident, $f:expr) => {
//         function $name(p:Pipeline) {
//             let (tr, tg, tb, ta) = $f(p.r, p.g, p.b, p.a, p.dr, p.dg, p.db, p.da);
//             p.r = tr;
//             p.g = tg;
//             p.b = tb;
//             p.a = ta;

//             p.next_stage();
//         }
//     };
// }

// blend_fn3!(hue, hue_k);

// #[inline(always)]
// function hue_k(
//     r: F32x8, g: F32x8, b: F32x8, a: F32x8,
//     dr: F32x8, dg: F32x8, db: F32x8, da: F32x8,
// ): (F32x8, F32x8, F32x8, F32x8) {
//     let rr =(r * a);
//     let gg =(g * a);
//     let bb =(b * a);

//     set_sat(rr, gg, bb, sat(dr, dg, db) * a);
//     set_lum(rr, gg, bb, lum(dr, dg, db) * a);
//     clip_color(rr, gg, bb, a * da);

//     let r = r * inv(da) + dr * inv(a) + *rr;
//     let g = g * inv(da) + dg * inv(a) + *gg;
//     let b = b * inv(da) + db * inv(a) + *bb;
//     let a = a + da - a * da;

//     (r, g, b, a)
// }

// blend_fn3!(saturation, saturation_k);

// #[inline(always)]
// function saturation_k(
//     r: F32x8, g: F32x8, b: F32x8, a: F32x8,
//     dr: F32x8, dg: F32x8, db: F32x8, da: F32x8,
// ): (F32x8, F32x8, F32x8, F32x8) {
//     let rr =(dr * a);
//     let gg =(dg * a);
//     let bb =(db * a);

//     set_sat(rr, gg, bb, sat(r, g, b) * da);
//     set_lum(rr, gg, bb, lum(dr, dg, db) * a); // (This is not redundant.)
//     clip_color(rr, gg, bb, a * da);

//     let r = r * inv(da) + dr * inv(a) + *rr;
//     let g = g * inv(da) + dg * inv(a) + *gg;
//     let b = b * inv(da) + db * inv(a) + *bb;
//     let a = a + da - a * da;

//     (r, g, b, a)
// }

// blend_fn3!(color, color_k);

// #[inline(always)]
// function color_k(
//     r: F32x8, g: F32x8, b: F32x8, a: F32x8,
//     dr: F32x8, dg: F32x8, db: F32x8, da: F32x8,
// ): (F32x8, F32x8, F32x8, F32x8) {
//     let rr =(r * da);
//     let gg =(g * da);
//     let bb =(b * da);

//     set_lum(rr, gg, bb, lum(dr, dg, db) * a);
//     clip_color(rr, gg, bb, a * da);

//     let r = r * inv(da) + dr * inv(a) + *rr;
//     let g = g * inv(da) + dg * inv(a) + *gg;
//     let b = b * inv(da) + db * inv(a) + *bb;
//     let a = a + da - a * da;

//     (r, g, b, a)
// }

// blend_fn3!(luminosity, luminosity_k);

// #[inline(always)]
// function luminosity_k(
//     r: F32x8, g: F32x8, b: F32x8, a: F32x8,
//     dr: F32x8, dg: F32x8, db: F32x8, da: F32x8,
// ): (F32x8, F32x8, F32x8, F32x8) {
//     let rr =(dr * a);
//     let gg =(dg * a);
//     let bb =(db * a);

//     set_lum(rr, gg, bb, lum(r, g, b) * da);
//     clip_color(rr, gg, bb, a * da);

//     let r = r * inv(da) + dr * inv(a) + *rr;
//     let g = g * inv(da) + dg * inv(a) + *gg;
//     let b = b * inv(da) + db * inv(a) + *bb;
//     let a = a + da - a * da;

//     (r, g, b, a)
// }

// #[inline(always)]
// function sat(r: F32x8, g: F32x8, b: F32x8): F32x8 {
//     r.max(g.max(b)) - r.min(g.min(b))
// }

// #[inline(always)]
// function lum(r: F32x8, g: F32x8, b: F32x8): F32x8 {
//     r * F32x8.splat(0.30) + g * F32x8.splat(0.59) + b * F32x8.splat(0.11)
// }

// #[inline(always)]
// function set_sat(r:F32x8, g:F32x8, b:F32x8, s: F32x8) {
//     let mn  = r.min(g.min(*b));
//     let mx  = r.max(g.max(*b));
//     let sat = mx - mn;

//     // Map min channel to 0, max channel to s, and scale the middle proportionally.
//     let scale = |c| sat.cmp_eq(F32x8.default())
//                        .blend(F32x8.default(), (c - mn) * s / sat);

//     *r = scale(*r);
//     *g = scale(*g);
//     *b = scale(*b);
// }

// #[inline(always)]
// function set_lum(r:F32x8, g:F32x8, b:F32x8, l: F32x8) {
//     let diff = l - lum(*r, *g, *b);
//     *r += diff;
//     *g += diff;
//     *b += diff;
// }

// #[inline(always)]
// function clip_color(r:F32x8, g:F32x8, b:F32x8, a: F32x8) {
//     let mn = r.min(g.min(*b));
//     let mx = r.max(g.max(*b));
//     let l  = lum(*r, *g, *b);

//     let clip = |mut c| {
//         c = mx.cmp_ge(F32x8.default()).blend(c, l + (c - l) * l / (l - mn));
//         c = mx.cmp_gt(a).blend(l + (c - l) * (a - l) / (mx - l), c);
//         c = c.max(F32x8.default()); // Sometimes without this we may dip just a little negative.
//         c
//     };

//     *r = clip(*r);
//     *g = clip(*g);
//     *b = clip(*b);
// }

//  function source_over_rgba(p:Pipeline) {
//     let pixels = p.pixmap_dst.slice4_at_xy(p.dx, p.dy);
//     load_8888(pixels,p.dr,p.dg,p.db,p.da);
//     p.r = mad(p.dr, inv(p.a), p.r);
//     p.g = mad(p.dg, inv(p.a), p.g);
//     p.b = mad(p.db, inv(p.a), p.b);
//     p.a = mad(p.da, inv(p.a), p.a);
//     store_8888(p.r, p.g, p.b, p.a, pixels);

//     p.next_stage();
// }

//  function source_over_rgba_tail(p:Pipeline) {
//     let pixels = p.pixmap_dst.slice_at_xy(p.dx, p.dy);
//     load_8888_tail(p.tail, pixels,p.dr,p.dg,p.db,p.da);
//     p.r = mad(p.dr, inv(p.a), p.r);
//     p.g = mad(p.dg, inv(p.a), p.g);
//     p.b = mad(p.db, inv(p.a), p.b);
//     p.a = mad(p.da, inv(p.a), p.a);
//     store_8888_tail(p.r, p.g, p.b, p.a, p.tail, pixels);

//     p.next_stage();
// }

// function transform(p:Pipeline) {
//     let ts = p.ctx.transform;

//     let tr = mad(p.r, F32x8.splat(ts.sx), mad(p.g, F32x8.splat(ts.kx), F32x8.splat(ts.tx)));
//     let tg = mad(p.r, F32x8.splat(ts.ky), mad(p.g, F32x8.splat(ts.sy), F32x8.splat(ts.ty)));
//     p.r = tr;
//     p.g = tg;

//     p.next_stage();
// }

// // Tile x or y to [0,limit) == [0,limit - 1 ulp] (think, sampling from images).
// // The gather stages will hard clamp the output of these stages to [0,limit)...
// // we just need to do the basic repeat or mirroring.

// function reflect(p:Pipeline) {
//     let ctx = p.ctx.limit_x;
//     p.r = exclusive_reflect(p.r, ctx.scale, ctx.inv_scale);

//     let ctx = p.ctx.limit_y;
//     p.g = exclusive_reflect(p.g, ctx.scale, ctx.inv_scale);

//     p.next_stage();
// }

// #[inline(always)]
// function exclusive_reflect(v: F32x8, limit: f32, inv_limit: f32): F32x8 {
//     let limit = F32x8.splat(limit);
//     let inv_limit = F32x8.splat(inv_limit);
//     ((v - limit) - (limit + limit)
//         * ((v - limit) * (inv_limit * F32x8.splat(0.5))).floor() - limit).abs()
// }

// function repeat(p:Pipeline) {
//     let ctx = p.ctx.limit_x;
//     p.r = exclusive_repeat(p.r, ctx.scale, ctx.inv_scale);

//     let ctx = p.ctx.limit_y;
//     p.g = exclusive_repeat(p.g, ctx.scale, ctx.inv_scale);

//     p.next_stage();
// }

// #[inline(always)]
// function exclusive_repeat(v: F32x8, limit: f32, inv_limit: f32): F32x8 {
//     v - (v * F32x8.splat(inv_limit)).floor() * F32x8.splat(limit)
// }

// function bilinear(p:Pipeline) {
//     let x = p.r;
//     let fx = (x + F32x8.splat(0.5)).fract();
//     let y = p.g;
//     let fy = (y + F32x8.splat(0.5)).fract();
//     let one = F32x8.splat(1.0);
//     let wx = [one - fx, fx];
//     let wy = [one - fy, fy];

//     sampler_2x2(p.pixmap_src, p.ctx.sampler, x, y, &wx, &wy,p.r,p.g,p.b,p.a);

//     p.next_stage();
// }

// function bicubic(p:Pipeline) {
//     let x = p.r;
//     let fx = (x + F32x8.splat(0.5)).fract();
//     let y = p.g;
//     let fy = (y + F32x8.splat(0.5)).fract();
//     let one = F32x8.splat(1.0);
//     let wx = [bicubic_far(one - fx), bicubic_near(one - fx), bicubic_near(fx), bicubic_far(fx)];
//     let wy = [bicubic_far(one - fy), bicubic_near(one - fy), bicubic_near(fy), bicubic_far(fy)];

//     sampler_4x4(p.pixmap_src, p.ctx.sampler, x, y, &wx, &wy,p.r,p.g,p.b,p.a);

//     p.next_stage();
// }

// // In bicubic interpolation, the 16 pixels and +/- 0.5 and +/- 1.5 offsets from the sample
// // pixel center are combined with a non-uniform cubic filter, with higher values near the center.
// //
// // We break this function into two parts, one for near 0.5 offsets and one for far 1.5 offsets.

// #[inline(always)]
// function bicubic_near(t: F32x8): F32x8 {
//     // 1/18 + 9/18t + 27/18t^2 - 21/18t^3 == t ( t ( -21/18t + 27/18) + 9/18) + 1/18
//     mad(
//         t,
//         mad(t,
//             mad(
//                 F32x8.splat(-21.0/18.0),
//                 t,
//                 F32x8.splat(27.0/18.0),
//             ),
//             F32x8.splat(9.0/18.0),
//         ),
//         F32x8.splat(1.0/18.0),
//     )
// }

// #[inline(always)]
// function bicubic_far(t: F32x8): F32x8 {
//     // 0/18 + 0/18*t - 6/18t^2 + 7/18t^3 == t^2 (7/18t - 6/18)
//     (t * t) * mad(F32x8.splat(7.0/18.0), t, F32x8.splat(-6.0/18.0))
// }

// #[inline(always)]
// function sampler_2x2(
//     pixmap: PixmapRef,
//     ctx: &super.SamplerCtx,
//     cx: F32x8, cy: F32x8,
//     wx: &[F32x8; 2], wy: &[F32x8; 2],
//     r:F32x8, g:F32x8, b:F32x8, a:F32x8,
// ) {
//     *r = F32x8.default();
//     *g = F32x8.default();
//     *b = F32x8.default();
//     *a = F32x8.default();

//     let one = F32x8.splat(1.0);
//     let start = -0.5;
//     lety = cy + F32x8.splat(start);
//     for j in 0..2 {
//         letx = cx + F32x8.splat(start);
//         for i in 0..2 {
//             letrr = F32x8.default();
//             letgg = F32x8.default();
//             letbb = F32x8.default();
//             letaa = F32x8.default();
//             sample(pixmap, ctx, x,y,rr,gg,bb,aa);

//             let w = wx[i] * wy[j];
//             *r = mad(w, rr, *r);
//             *g = mad(w, gg, *g);
//             *b = mad(w, bb, *b);
//             *a = mad(w, aa, *a);

//             x += one;
//         }

//         y += one;
//     }
// }

// #[inline(always)]
// function sampler_4x4(
//     pixmap: PixmapRef,
//     ctx: &super.SamplerCtx,
//     cx: F32x8, cy: F32x8,
//     wx: &[F32x8; 4], wy: &[F32x8; 4],
//     r:F32x8, g:F32x8, b:F32x8, a:F32x8,
// ) {
//     *r = F32x8.default();
//     *g = F32x8.default();
//     *b = F32x8.default();
//     *a = F32x8.default();

//     let one = F32x8.splat(1.0);
//     let start = -1.5;
//     lety = cy + F32x8.splat(start);
//     for j in 0..4 {
//         letx = cx + F32x8.splat(start);
//         for i in 0..4 {
//             letrr = F32x8.default();
//             letgg = F32x8.default();
//             letbb = F32x8.default();
//             letaa = F32x8.default();
//             sample(pixmap, ctx, x,y,rr,gg,bb,aa);

//             let w = wx[i] * wy[j];
//             *r = mad(w, rr, *r);
//             *g = mad(w, gg, *g);
//             *b = mad(w, bb, *b);
//             *a = mad(w, aa, *a);

//             x += one;
//         }

//         y += one;
//     }
// }

// #[inline(always)]
// function sample(
//     pixmap: PixmapRef, ctx: &super.SamplerCtx,x: F32x8,y: F32x8,
//     r:F32x8, g:F32x8, b:F32x8, a:F32x8,
// ) {
//     x = tile(x, ctx.spread_mode, pixmap.width() as f32, ctx.inv_width);
//     y = tile(y, ctx.spread_mode, pixmap.height() as f32, ctx.inv_height);

//     let ix = gather_ix(pixmap, x, y);
//     load_8888(pixmap.gather(ix), r, g, b, a);
// }

// #[inline(always)]
// function tile(v: F32x8, mode: SpreadMode, limit: f32, inv_limit: f32): F32x8 {
//     match mode {
//         SpreadMode.Pad => v,
//         SpreadMode.Repeat => exclusive_repeat(v, limit, inv_limit),
//         SpreadMode.Reflect => exclusive_reflect(v, limit, inv_limit),
//     }
// }

// function pad_x1(p:Pipeline) {
//     p.r = p.r.normalize();

//     p.next_stage();
// }

// function reflect_x1(p:Pipeline) {
//     p.r = (
//         (p.r - F32x8.splat(1.0))
//             - two(((p.r - F32x8.splat(1.0)) * F32x8.splat(0.5)).floor())
//             - F32x8.splat(1.0)
//     ).abs().normalize();

//     p.next_stage();
// }

// function repeat_x1(p:Pipeline) {
//     p.r = (p.r - p.r.floor()).normalize();

//     p.next_stage();
// }

// function gradient(p:Pipeline) {
//     let ctx = p.ctx.gradient;

//     // N.B. The loop starts at 1 because idx 0 is the color to use before the first stop.
//     let t: [f32; 8] = p.r.into();
//     letidx = u32x8.default();
//     for i in 1..ctx.len {
//         let tt = ctx.t_values[i].get();
//         let n: u32x8 = bytemuck.cast([
//             (t[0] >= tt) as u32,
//             (t[1] >= tt) as u32,
//             (t[2] >= tt) as u32,
//             (t[3] >= tt) as u32,
//             (t[4] >= tt) as u32,
//             (t[5] >= tt) as u32,
//             (t[6] >= tt) as u32,
//             (t[7] >= tt) as u32,
//         ]);
//         idx = idx + n;
//     }
//     gradient_lookup(ctx, &idx, p.r,p.r,p.g,p.b,p.a);

//     p.next_stage();
// }

// function gradient_lookup(
//     ctx: &super.GradientCtx, idx: &u32x8, t: F32x8,
//     r:F32x8, g:F32x8, b:F32x8, a:F32x8,
// ) {
//     let idx: [u32; 8] = bytemuck.cast(*idx);

//     macro_rules! gather {
//         ($d:expr, $c:ident) => {
//             // Surprisingly, but bound checking doesn't affect the performance.
//             // And since `idx` can contain any number, we should leave it in place.
//             F32x8.from([
//                 $d[idx[0] as usize].$c,
//                 $d[idx[1] as usize].$c,
//                 $d[idx[2] as usize].$c,
//                 $d[idx[3] as usize].$c,
//                 $d[idx[4] as usize].$c,
//                 $d[idx[5] as usize].$c,
//                 $d[idx[6] as usize].$c,
//                 $d[idx[7] as usize].$c,
//             ])
//         };
//     }

//     let fr = gather!(&ctx.factors, r);
//     let fg = gather!(&ctx.factors, g);
//     let fb = gather!(&ctx.factors, b);
//     let fa = gather!(&ctx.factors, a);

//     let br = gather!(&ctx.biases, r);
//     let bg = gather!(&ctx.biases, g);
//     let bb = gather!(&ctx.biases, b);
//     let ba = gather!(&ctx.biases, a);

//     *r = mad(t, fr, br);
//     *g = mad(t, fg, bg);
//     *b = mad(t, fb, bb);
//     *a = mad(t, fa, ba);
// }

// function evenly_spaced_2_stop_gradient(p:Pipeline) {
//     let ctx = p.ctx.evenly_spaced_2_stop_gradient;

//     let t = p.r;
//     p.r = mad(t, F32x8.splat(ctx.factor.r), F32x8.splat(ctx.bias.r));
//     p.g = mad(t, F32x8.splat(ctx.factor.g), F32x8.splat(ctx.bias.g));
//     p.b = mad(t, F32x8.splat(ctx.factor.b), F32x8.splat(ctx.bias.b));
//     p.a = mad(t, F32x8.splat(ctx.factor.a), F32x8.splat(ctx.bias.a));

//     p.next_stage();
// }

// function xy_to_radius(p:Pipeline) {
//     let x2 = p.r * p.r;
//     let y2 = p.g * p.g;
//     p.r = (x2 + y2).sqrt();

//     p.next_stage();
// }

// function xy_to_2pt_conical_focal_on_circle(p:Pipeline) {
//     let x = p.r;
//     let y = p.g;
//     p.r = x + y * y / x;

//     p.next_stage();
// }

// function xy_to_2pt_conical_well_behaved(p:Pipeline) {
//     let ctx = p.ctx.two_point_conical_gradient;

//     let x = p.r;
//     let y = p.g;
//     p.r = (x * x + y * y).sqrt() - x * F32x8.splat(ctx.p0);

//     p.next_stage();
// }

// function xy_to_2pt_conical_greater(p:Pipeline) {
//     let ctx = p.ctx.two_point_conical_gradient;

//     let x = p.r;
//     let y = p.g;
//     p.r = (x * x - y * y).sqrt() - x * F32x8.splat(ctx.p0);

//     p.next_stage();
// }

// function mask_2pt_conical_degenerates(p:Pipeline) {
//     let ctx =p.ctx.two_point_conical_gradient;

//     let t = p.r;
//     let is_degenerate = t.cmp_le(F32x8.default()) | t.cmp_ne(t);
//     p.r = is_degenerate.blend(F32x8.default(), t);

//     let is_not_degenerate = !is_degenerate.to_u32x8_bitcast();
//     let is_not_degenerate: [u32; 8] = bytemuck.cast(is_not_degenerate);
//     ctx.mask = bytemuck.cast([
//         if is_not_degenerate[0] != 0 { !0 } else { 0 },
//         if is_not_degenerate[1] != 0 { !0 } else { 0 },
//         if is_not_degenerate[2] != 0 { !0 } else { 0 },
//         if is_not_degenerate[3] != 0 { !0 } else { 0 },
//         if is_not_degenerate[4] != 0 { !0 } else { 0 },
//         if is_not_degenerate[5] != 0 { !0 } else { 0 },
//         if is_not_degenerate[6] != 0 { !0 } else { 0 },
//         if is_not_degenerate[7] != 0 { !0 } else { 0 },
//     ]);

//     p.next_stage();
// }

// function apply_vector_mask(p:Pipeline) {
//     let ctx = p.ctx.two_point_conical_gradient;

//     p.r = (p.r.to_u32x8_bitcast() & ctx.mask).to_F32x8_bitcast();
//     p.g = (p.g.to_u32x8_bitcast() & ctx.mask).to_F32x8_bitcast();
//     p.b = (p.b.to_u32x8_bitcast() & ctx.mask).to_F32x8_bitcast();
//     p.a = (p.a.to_u32x8_bitcast() & ctx.mask).to_F32x8_bitcast();

//     p.next_stage();
// }

// function gamma_expand_2(p:Pipeline) {
//     p.r = p.r * p.r;
//     p.g = p.g * p.g;
//     p.b = p.b * p.b;

//     p.next_stage();
// }

// function gamma_expand_dst_2(p:Pipeline) {
//     p.dr = p.dr * p.dr;
//     p.dg = p.dg * p.dg;
//     p.db = p.db * p.db;

//     p.next_stage();
// }

// function gamma_compress_2(p:Pipeline) {
//     p.r = p.r.sqrt();
//     p.g = p.g.sqrt();
//     p.b = p.b.sqrt();

//     p.next_stage();
// }

// function gamma_expand_22(p:Pipeline) {
//     p.r = p.r.powf(2.2);
//     p.g = p.g.powf(2.2);
//     p.b = p.b.powf(2.2);

//     p.next_stage();
// }

// function gamma_expand_dst_22(p:Pipeline) {
//     p.dr = p.dr.powf(2.2);
//     p.dg = p.dg.powf(2.2);
//     p.db = p.db.powf(2.2);

//     p.next_stage();
// }

// function gamma_compress_22(p:Pipeline) {
//     p.r = p.r.powf(0.45454545);
//     p.g = p.g.powf(0.45454545);
//     p.b = p.b.powf(0.45454545);

//     p.next_stage();
// }

// function srgb_expand(x: F32x8): F32x8 {
//     let small = x.cmp_le(F32x8.splat(0.04045));
//     let linear = x / F32x8.splat(12.92);
//     let exp = ((x + F32x8.splat(0.055)) / F32x8.splat(1.055)).powf(2.4);
//     small.blend(linear, exp)
// }

// function srgb_compress(x: F32x8): F32x8 {
//     let small = x.cmp_le(F32x8.splat(0.0031308));
//     let linear = x * F32x8.splat(12.92);
//     let exp = x.powf(0.416666666) * F32x8.splat(1.055) - F32x8.splat(0.055);
//     small.blend(linear, exp)
// }

// function gamma_expand_srgb(p:Pipeline) {
//     p.r = srgb_expand(p.r);
//     p.g = srgb_expand(p.g);
//     p.b = srgb_expand(p.b);

//     p.next_stage();
// }

// function gamma_expand_dst_srgb(p:Pipeline) {
//     p.dr = srgb_expand(p.dr);
//     p.dg = srgb_expand(p.dg);
//     p.db = srgb_expand(p.db);

//     p.next_stage();
// }

// function gamma_compress_srgb(p:Pipeline) {
//     p.r = srgb_compress(p.r);
//     p.g = srgb_compress(p.g);
//     p.b = srgb_compress(p.b);

//     p.next_stage();
// }

//  function just_return(_:Pipeline) {
//     // Ends the loop.
// }

// #[inline(always)]
// function load_8888(
//     data: &[PremultipliedColorU8; STAGE_WIDTH],
//     r:F32x8, g:F32x8, b:F32x8, a:F32x8,
// ) {
//     // Surprisingly, `f32 * FACTOR` is way faster than `F32x8 * F32x8.splat(FACTOR)`.

//     const FACTOR: f32 = 1.0 / 255.0;

//     *r = F32x8.from([
//         data[0].red() as f32 * FACTOR, data[1].red() as f32 * FACTOR,
//         data[2].red() as f32 * FACTOR, data[3].red() as f32 * FACTOR,
//         data[4].red() as f32 * FACTOR, data[5].red() as f32 * FACTOR,
//         data[6].red() as f32 * FACTOR, data[7].red() as f32 * FACTOR,
//     ]);

//     *g = F32x8.from([
//         data[0].green() as f32 * FACTOR, data[1].green() as f32 * FACTOR,
//         data[2].green() as f32 * FACTOR, data[3].green() as f32 * FACTOR,
//         data[4].green() as f32 * FACTOR, data[5].green() as f32 * FACTOR,
//         data[6].green() as f32 * FACTOR, data[7].green() as f32 * FACTOR,
//     ]);

//     *b = F32x8.from([
//         data[0].blue() as f32 * FACTOR, data[1].blue() as f32 * FACTOR,
//         data[2].blue() as f32 * FACTOR, data[3].blue() as f32 * FACTOR,
//         data[4].blue() as f32 * FACTOR, data[5].blue() as f32 * FACTOR,
//         data[6].blue() as f32 * FACTOR, data[7].blue() as f32 * FACTOR,
//     ]);

//     *a = F32x8.from([
//         data[0].alpha() as f32 * FACTOR, data[1].alpha() as f32 * FACTOR,
//         data[2].alpha() as f32 * FACTOR, data[3].alpha() as f32 * FACTOR,
//         data[4].alpha() as f32 * FACTOR, data[5].alpha() as f32 * FACTOR,
//         data[6].alpha() as f32 * FACTOR, data[7].alpha() as f32 * FACTOR,
//     ]);
// }

// #[inline(always)]
// function load_8888_tail(
//     tail: usize, data: &[PremultipliedColorU8],
//     r:F32x8, g:F32x8, b:F32x8, a:F32x8,
// ) {
//     // Fill a dummy array with `tail` values. `tail` is always in a 1..STAGE_WIDTH-1 range.
//     // This way we can reuse the `load_8888_` method and remove any branches.
//     lettmp = [PremultipliedColorU8.TRANSPARENT; STAGE_WIDTH];
//     tmp[0..tail].copy_from_slice(&data[0..tail]);
//     load_8888(&tmp, r, g, b, a);
// }

// #[inline(always)]
// function store_8888(
//     r: &F32x8, g: &F32x8, b: &F32x8, a: &F32x8,
//     data:[PremultipliedColorU8; STAGE_WIDTH],
// ) {
//     let r: [i32; 8] = unnorm(r).into();
//     let g: [i32; 8] = unnorm(g).into();
//     let b: [i32; 8] = unnorm(b).into();
//     let a: [i32; 8] = unnorm(a).into();

//     let conv = |rr, gg, bb, aa|
//         PremultipliedColorU8.from_rgba_unchecked(rr as u8, gg as u8, bb as u8, aa as u8);

//     data[0] = conv(r[0], g[0], b[0], a[0]);
//     data[1] = conv(r[1], g[1], b[1], a[1]);
//     data[2] = conv(r[2], g[2], b[2], a[2]);
//     data[3] = conv(r[3], g[3], b[3], a[3]);
//     data[4] = conv(r[4], g[4], b[4], a[4]);
//     data[5] = conv(r[5], g[5], b[5], a[5]);
//     data[6] = conv(r[6], g[6], b[6], a[6]);
//     data[7] = conv(r[7], g[7], b[7], a[7]);
// }

// #[inline(always)]
// function store_8888_tail(
//     r: &F32x8, g: &F32x8, b: &F32x8, a: &F32x8,
//     tail: usize, data:[PremultipliedColorU8],
// ) {
//     let r: [i32; 8] = unnorm(r).into();
//     let g: [i32; 8] = unnorm(g).into();
//     let b: [i32; 8] = unnorm(b).into();
//     let a: [i32; 8] = unnorm(a).into();

//     // This is better than `for i in 0..tail`, because this way the compiler
//     // knows that we have only 4 steps and slices access is guarantee to be valid.
//     // This removes bounds checking and a possible panic call.
//     for i in 0..STAGE_WIDTH {
//         data[i] = PremultipliedColorU8.from_rgba_unchecked(
//             r[i] as u8, g[i] as u8, b[i] as u8, a[i] as u8,
//         );

//         if i + 1 == tail {
//             break;
//         }
//     }
// }

// #[inline(always)]
// function unnorm(v: &F32x8): i32x8 {
//     (v.max(F32x8.default()).min(F32x8.splat(1.0)) * F32x8.splat(255.0)).round_int()
// }

// #[inline(always)]
// function inv(v: F32x8): F32x8 {
//     F32x8.splat(1.0) - v
// }

// #[inline(always)]
// function two(v: F32x8): F32x8 {
//     v + v
// }

// #[inline(always)]
// function mad(f: F32x8, m: F32x8, a: F32x8): F32x8 {
//     f * m + a
// }

// #[inline(always)]
// function lerp(from: F32x8, to: F32x8, t: F32x8): F32x8 {
//     mad(to - from, t, from)
// }
