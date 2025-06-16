import { Color } from "./color";
import { combine_opacity, comp_map, comp_solid_map, interpolate_pixel, premultiply_color, premultiply_pixel } from "./color_composite";
import { Context } from "./ctx";
import { fetch_linear_gradient, fetch_radial_gradient, Gradient, GradientData, GradientType, LinearGradientValues, RadialGradientValues } from "./gradient";
import { Operator, PaintType } from "./paint";
import { Rle } from "./rle";
import { Surface } from "./surface";
import { Texture, TextureData, TextureType } from "./texture";
import { FIXED_SCALE, getAlpha, min } from "./util";


export function blend_solid(surface: Surface, op: Operator, rle: Rle, solid: uint32) {
    let func = comp_solid_map[op];
    let count = rle.spans.length;
    let index = 0
    while (index < count) {
        let spans = rle.spans[index];
        let target = new Uint32Array(surface.pixels!.buffer, spans.y * surface.stride).subarray(spans.x)
        func(target, spans.len, solid, spans.coverage);
        ++index;
    }
}

export function blend_linear_gradient(surface: Surface, op: Operator, rle: Rle, gradient: GradientData) {
    let func = comp_map[op];
    let buffer = new Uint32Array(1024);

    let v = new LinearGradientValues();
    v.dx = gradient.linear.x2 - gradient.linear.x1;
    v.dy = gradient.linear.y2 - gradient.linear.y1;
    v.l = v.dx * v.dx + v.dy * v.dy;
    v.off = 0.0;
    if (v.l != 0.0) {
        v.dx /= v.l;
        v.dy /= v.l;
        v.off = -v.dx * gradient.linear.x1 - v.dy * gradient.linear.y1;
    }

    let count = rle.spans.length;
    let spans;
    let spansIndex = 0
    while (spansIndex < count) {
        spans = rle.spans[spansIndex];
        let length = spans.len;
        let x = spans.x;
        while (length) {
            let l = min(length, 1024);
            fetch_linear_gradient(buffer, v, gradient, spans.y, x, l);
            let target = new Uint32Array(surface.pixels!.buffer, spans.y * surface.stride).subarray(x)
            func(target, l, buffer, spans.coverage);
            x += l;
            length -= l;
        }
        ++spansIndex;
    }
}



export function blend_radial_gradient(surface: Surface, op: Operator, rle: Rle, gradient: GradientData) {
    let func = comp_map[op];
    let buffer = new Uint32Array(1024);

    let v = new RadialGradientValues();
    v.dx = gradient.radial.cx - gradient.radial.fx;
    v.dy = gradient.radial.cy - gradient.radial.fy;
    v.dr = gradient.radial.cr - gradient.radial.fr;
    v.sqrfr = gradient.radial.fr * gradient.radial.fr;
    v.a = v.dr * v.dr - v.dx * v.dx - v.dy * v.dy;
    v.inv2a = 1.0 / (2.0 * v.a);
    v.extended = Number(gradient.radial.fr != 0.0 || v.a <= 0.0);

    let count = rle.spans.length;
    let spans;
    let spansIndex = 0
    while (spansIndex < count) {
        spans = rle.spans[spansIndex];
        let length = spans.len;
        let x = spans.x;
        while (length) {
            let l = min(length, 1024);
            fetch_radial_gradient(buffer, v, gradient, spans.y, x, l);
            let target = new Uint32Array(surface.pixels!.buffer, spans.y * surface.stride).subarray(x)
            func(target, l, buffer, spans.coverage);
            x += l;
            length -= l;
        }
        ++spansIndex;
    }
}


export function blend_untransformed_argb(surface: Surface, op: Operator, rle: Rle, texture: TextureData) {
    let func = comp_map[op];

    let image_width = texture.width;
    let image_height = texture.height;
    let xoff = Math.trunc(texture.matrix.tx);
    let yoff = Math.trunc(texture.matrix.ty);
    let count = rle.spans.length;
    let spans, spansIndex = 0
    while (spansIndex < count) {
        spans = rle.spans[spansIndex];
        let x = spans.x;
        let length = spans.len;
        let sx = xoff + x;
        let sy = yoff + spans.y;
        if (sy >= 0 && sy < image_height && sx < image_width) {
            if (sx < 0) {
                x -= sx;
                length += sx;
                sx = 0;
            }
            if (sx + length > image_width)
                length = image_width - sx;
            if (length > 0) {
                let coverage = (spans.coverage * texture.alpha) >> 8;
                let src = new Uint32Array(texture.pixels!.buffer, sy * texture.stride).subarray(sx)
                let dst = new Uint32Array(surface.pixels!.buffer, spans.y * surface.stride).subarray(x)
                func(dst, length, src, coverage);
            }
        }
        ++spansIndex;
    }
}


export function blend_transformed_argb(surface: Surface, op: Operator, rle: Rle, texture: TextureData) {
    let func = comp_map[op];
    let buffers = new Uint32Array(1024), bufferIndex = 0, buffer;

    let image_width = texture.width;
    let image_height = texture.height;
    let fdx = Math.trunc(texture.matrix.a * FIXED_SCALE);
    let fdy = Math.trunc(texture.matrix.b * FIXED_SCALE);
    let count = rle.spans.length;
    let spans, spansIndex = 0
    while (spansIndex < count) {
        spans = rle.spans[spansIndex];
        let target = new Uint32Array(surface.pixels!.buffer, spans.y * surface.stride + spans.x)
        let targetIndex = 0
        let cx = spans.x + 0.5;
        let cy = spans.y + 0.5;
        let x = Math.trunc((texture.matrix.c * cy + texture.matrix.a * cx + texture.matrix.tx) * FIXED_SCALE);
        let y = Math.trunc((texture.matrix.d * cy + texture.matrix.b * cx + texture.matrix.ty) * FIXED_SCALE);
        let length = spans.len;
        let coverage = (spans.coverage * texture.alpha) >> 8;
        while (length) {

            let l = min(length, 1024);
            let end = bufferIndex + l;
            let b = 0;
            let start = 0;
            let clen = 0;
            while (b < end) {
                let px = (x >> 16) >>> 0;
                let py = (y >> 16) >>> 0;
                if ((px < image_width) && (py < image_height)) {

                    buffers[b] = new Uint32Array(texture.pixels!.buffer, py * texture.stride)[px]
                    // b =texture.pixels
                    //((uint32_t *)(texture.pixels + py * texture.stride))[px];
                    clen++;
                }
                x += fdx;
                y += fdy;
                ++b;
                if (clen == 0) {
                    start++;
                }
            }
            func(target.subarray(targetIndex + start), clen, buffers.subarray(start), coverage);
            targetIndex += l;
            length -= l;
        }
        ++spansIndex;
    }
}


export function blend_untransformed_tiled_argb(surface: Surface, op: Operator, rle: Rle, texture: TextureData) {
    let func = comp_map[op];

    let image_width = texture.width;
    let image_height = texture.height;
    let xoff = Math.trunc(texture.matrix.tx) % image_width;
    let yoff = Math.trunc(texture.matrix.ty) % image_height;
    if (xoff < 0) {
        xoff += image_width;
    }
    if (yoff < 0) {
        yoff += image_height;
    }
    let count = rle.spans.length;
    let spans, spansIndex = 0
    while (spansIndex < count) {
        spans = rle.spans[spansIndex];
        let x = spans.x;
        let length = spans.len;
        let sx = (xoff + spans.x) % image_width;
        let sy = (spans.y + yoff) % image_height;
        if (sx < 0) {
            sx += image_width;
        }
        if (sy < 0) {
            sy += image_height;
        }
        let coverage = (spans.coverage * texture.alpha) >> 8;
        while (length) {
            let l = min(image_width - sx, length);
            if (1024 < l) {
                l = 1024;
            }
            let src = new Uint32Array(texture.pixels!.buffer, sy * texture.stride + sx)
            let dst = new Uint32Array(surface.pixels!.buffer, spans.y * surface.stride + x)
            func(dst, l, src, coverage);
            x += l;
            length -= l;
            sx = 0;
        }
        ++spansIndex;
    }
}


export function blend_transformed_tiled_argb(surface: Surface, op: Operator, rle: Rle, texture: TextureData) {
    let func = comp_map[op];
    let buffers = new Uint32Array(1024), bufferIndex = 0, buffer;

    let image_width = texture.width;
    let image_height = texture.height;
    let scanline_offset = texture.stride / 4;
    let fdx = Math.trunc(texture.matrix.a * FIXED_SCALE);
    let fdy = Math.trunc(texture.matrix.b * FIXED_SCALE);

    let count = rle.spans.length;
    let spans, spansIndex = 0
    while (spansIndex < count) {
        spans = rle.spans[spansIndex];
        let target = new Uint32Array(surface.pixels!.buffer, spans.y * surface.stride + spans.x)
        let image_bits = new Uint32Array(texture.pixels!.buffer)
        let cx = spans.x + 0.5;
        let cy = spans.y + 0.5;
        let x = Math.trunc((texture.matrix.c * cy + texture.matrix.a * cx + texture.matrix.tx) * FIXED_SCALE);
        let y = Math.trunc((texture.matrix.d * cy + texture.matrix.b * cx + texture.matrix.ty) * FIXED_SCALE);
        let coverage = (spans.coverage * texture.alpha) >> 8;
        let length = spans.len;
        while (length) {
            let l = min(length, 1024);
            let end = bufferIndex + l;
            let b = bufferIndex;
            let px16 = x % (image_width << 16);
            let py16 = y % (image_height << 16);
            let px_delta = fdx % (image_width << 16);
            let py_delta = fdy % (image_height << 16);
            while (b < end) {
                if (px16 < 0) {
                    px16 += image_width << 16;
                }
                if (py16 < 0) {
                    py16 += image_height << 16;
                }
                let px = px16 >> 16;
                let py = py16 >> 16;
                let y_offset = py * scanline_offset;

                buffers[b] = image_bits[y_offset + px];
                x += fdx;
                y += fdy;
                px16 += px_delta;
                if (px16 >= image_width << 16) {
                    px16 -= image_width << 16;
                }
                py16 += py_delta;
                if (py16 >= image_height << 16) {
                    py16 -= image_height << 16;
                }
                ++b;
            }
            func(target, l, buffers, coverage);
            target = target.subarray(l);
            length -= l;
        }
        ++spansIndex;
    }
}


export function blend_color(ctx: Context, rle: Rle, color?: Color | null) {
    if (color) {
        let state = ctx.state!;
        let solid = premultiply_color(color, state.opacity);
        if ((getAlpha(solid) == 255) && (state.op == Operator.SRC_OVER)) {
            blend_solid(ctx.surface!, Operator.SRC, rle, solid);
        }
        else {
            blend_solid(ctx.surface!, state.op, rle, solid);
        }
    }
}


export function blend_gradient(ctx: Context, rle: Rle, gradient?: Gradient | null) {
    if (gradient && (gradient.stops.length > 0)) {
        let state = ctx.state!;
        let stops = gradient.stops;
        let data = new GradientData();
        let i, pos = 0, nstop = gradient.stops.length;
        let curr, next, start, last;
        let curr_color, next_color, last_color;
        let dist, idist;
        let delta, t, incr, fpos;
        let opacity = state.opacity * gradient.opacity;

        start = 0;
        curr = start;
        curr_color = combine_opacity(stops[curr].color, opacity);

        data.colortable[pos] = premultiply_pixel(curr_color);
        ++pos;
        incr = 1.0 / 1024;
        fpos = 1.5 * incr;

        while (fpos <= stops[curr].offset) {
            data.colortable[pos] = data.colortable[pos - 1];
            ++pos;
            fpos += incr;
        }
        for (i = 0; i < nstop - 1; i++) {
            curr = (start + i);
            next = (start + i + 1);
            delta = 1.0 / (stops[next].offset - stops[curr].offset);
            next_color = combine_opacity(stops[next].color, opacity);
            while (fpos < stops[next].offset && pos < 1024) {
                t = (fpos - stops[curr].offset) * delta;
                dist = (255 * t) >>> 0;
                idist = 255 - dist;
                data.colortable[pos] = premultiply_pixel(interpolate_pixel(curr_color, idist, next_color, dist));
                ++pos;
                fpos += incr;
            }
            curr_color = next_color;
        }

        last = start + nstop - 1;
        last_color = premultiply_color(stops[last].color, opacity);
        for (; pos < 1024; ++pos)
            data.colortable[pos] = last_color;

        data.spread = gradient.spread;
        data.matrix = gradient.matrix!;
        data.matrix.preMultiply(state.matrix)
        data.matrix.invert()
        //cg_matrix_multiply(&data.matrix, &data.matrix, &state.matrix);
        //cg_matrix_invert(&data.matrix);

        if (gradient.type == GradientType.LINEAR) {
            data.linear.x1 = gradient.values[0];
            data.linear.y1 = gradient.values[1];
            data.linear.x2 = gradient.values[2];
            data.linear.y2 = gradient.values[3];
            blend_linear_gradient(ctx.surface!, state.op, rle, data);
        }
        else {
            data.radial.cx = gradient.values[0];
            data.radial.cy = gradient.values[1];
            data.radial.cr = gradient.values[2];
            data.radial.fx = gradient.values[3];
            data.radial.fy = gradient.values[4];
            data.radial.fr = gradient.values[5];
            blend_radial_gradient(ctx.surface!, state.op, rle, data);
        }
    }
}



export function blend_texture(ctx: Context, rle: Rle, texture?: Texture | null) {
    if (texture) {
        let state = ctx.state!;
        let data = new TextureData();
        data.width = texture.surface!.width;
        data.height = texture.surface!.height;
        data.stride = texture.surface!.stride;
        data.alpha = Math.trunc(state.opacity * texture.opacity * 256.0);
        data.pixels = texture.surface!.pixels;
        data.matrix = texture.matrix;

        data.matrix.preMultiply(state.matrix)
        data.matrix.invert()
        //	cg_matrix_multiply(&data.matrix, &data.matrix, &state.matrix);
        //cg_matrix_invert(&data.matrix);
        let m = data.matrix;
        if ((m.a == 1.0) && (m.b == 0.0) && (m.c == 0.0) && (m.d == 1.0)) {
            if (texture.type == TextureType.PLAIN) {
                blend_untransformed_argb(ctx.surface!, state.op, rle, data);
            }
            else {
                blend_untransformed_tiled_argb(ctx.surface!, state.op, rle, data);
            }
        }
        else {
            if (texture.type == TextureType.PLAIN) {
                blend_transformed_argb(ctx.surface!, state.op, rle, data);
            }
            else {
                blend_transformed_tiled_argb(ctx.surface!, state.op, rle, data);
            }
        }
    }
}


export function blend(ctx: Context, rle: Rle) {
    if (rle && (rle.spans.length > 0)) {
        let source = ctx.state!.paint!;
        switch (source.type) {
            case PaintType.COLOR:
                blend_color(ctx, rle, source.color);
                break;
            case PaintType.GRADIENT:
                blend_gradient(ctx, rle, source.gradient);
                break;
            case PaintType.TEXTURE:
                blend_texture(ctx, rle, source.texture);
                break
            default:
                break;
        }
    }
}