
import { Color } from "./color";
import { memfill32 } from "./color_composite";
import { Matrix } from "./matrix";
import { DBL_EPSILON, sqrt,clamp } from "./util";

export enum SpreadMethod {
    PAD = 0,
    REPEAT = 1,
    REFLECT = 2
}

export enum GradientType {
    LINEAR = 0,
    RADIAL = 1,
    CONIC = 2
}
export class LinearGradientValues {
    dx: float64 = 0
    dy: float64 = 0
    l: float64 = 0
    off: float64 = 0
}
export class RadialGradientValues {
    dx: float64 = 0
    dy: float64 = 0
    dr: float64 = 0
    sqrfr: float64 = 0
    a: float64 = 0
    inv2a: float64 = 0
    extended: int = 0
}
export class GradientStop {
    offset: float64 = 0
    color: Color = Color.fromRGBA(0, 0, 0, 1);
    clone(): GradientStop {
        return new GradientStop().copy(this)
    }
    copy(s: GradientStop) {
        this.offset = s.offset
        this.color = s.color?.clone()
        return this
    }
}
export class Gradient {
    type: GradientType = GradientType.LINEAR
    spread: SpreadMethod = SpreadMethod.PAD
    matrix?: Matrix | null = null
    values: float64[] = []
    opacity: float64 = 1.0
    stops: GradientStop[] = []
    initLinear(x0: float64, y0: float64, x1: float64, y1: float64) {

        this.type = GradientType.LINEAR
        this.spread = SpreadMethod.PAD
        this.opacity = 1
        this.stops = []
        this.matrix = Matrix.identity()
        this.setValuesLinear(x0, y0, x1, y1)
    }

    initRadial(cx: float64, cy: float64, cr: float64, fx: float64, fy: float64, fr: float64) {
        this.type = GradientType.RADIAL
        this.spread = SpreadMethod.PAD
        this.opacity = 1
        this.stops = []
        this.matrix = Matrix.identity()
        this.setValuesRadial(cx, cy, cr, fx, fy, fr)



    }
    destory() {
        this.stops = []
        this.values = []
        this.matrix = null
    }
    copy(g: Gradient) {
        this.type = g.type
        this.spread = g.spread
        this.matrix = g.matrix?.clone()
        this.values = g.values.slice()
        this.opacity = g.opacity
        this.stops = g.stops.map(d => d.clone())
        return this
    }
    clone() {
        return new Gradient().copy(this)
    }
    setValuesLinear(x0: float64, y0: float64, x1: float64, y1: float64) {
        this.values[0] = x0
        this.values[1] = y0
        this.values[2] = x1
        this.values[3] = y1
    }

    setValuesRadial(cx: float64, cy: float64, cr: float64, fx: float64, fy: float64, fr: float64) {
        this.values[0] = cx
        this.values[1] = cy
        this.values[2] = cr
        this.values[3] = fx
        this.values[4] = fy
        this.values[5] = fr
    }
    setSpread(spread: SpreadMethod = SpreadMethod.PAD) {
        this.spread = spread
    }
    setMatrix(m: Matrix | null = null) {
        this.matrix = m ? m.clone() : null
    }
    setOpacity(opacity: float64 = 1.0) {
        this.opacity = clamp(opacity, 0.0, 1.0)
    }
    addStopRgb(offset: float64, r: float64, g: float64, b: float64) {
        this.addStopRgba(offset, r, g, b, 1)
    }
    addStopRgba(offset: float64, r: float64, g: float64, b: float64, a: float64 = 1.0) {
        offset = clamp(offset, 0.0, 1.0)
        const nstops = this.stops.length
        const stops = this.stops
        let i = 0
        for (i = 0; i < nstops; i++) {
            if (offset < stops[i].offset) {
                break
            }

        }
        let stop = new GradientStop()
        stop.offset = offset
        stop.color.set(r, g, b, a)
        stops.splice(i, 0, stop)

    }
    addStop(stop: GradientStop) {

    }
}
export class GradientData {
    spread: SpreadMethod = SpreadMethod.PAD
    matrix = Matrix.identity()
    colortable = new Uint32Array(1024)
    linear: {
        x1: float64,
        y1: float64,
        x2: float64,
        y2: float64
    } = { x1: 0, y1: 0, x2: 0, y2: 0 }
    radial: {
        cx: float64,
        cy: float64,
        cr: float64,
        fx: float64,
        fy: float64,
        fr: float64
    } = { cx: 0, cy: 0, cr: 0, fx: 0, fy: 0, fr: 0 }

}

export function gradient_clamp(gradient: GradientData, ipos: int) {
    switch (gradient.spread) {
        case SpreadMethod.PAD:
            if (ipos < 0)
                ipos = 0;
            else if (ipos >= 1024)
                ipos = 1024 - 1;
            break;
        case SpreadMethod.REFLECT:
            ipos = ipos % 2048;
            ipos = ipos < 0 ? 2048 + ipos : ipos;
            ipos = ipos >= 1024 ? 2048 - 1 - ipos : ipos;
            break;
        case SpreadMethod.REPEAT:
            ipos = ipos % 1024;
            ipos = ipos < 0 ? 1024 + ipos : ipos;
            break;
        default:
            break;
    }
    return ipos;
}
// 定点数
export const FIXPT_BITS = 8
export const FIXPT_SIZE = 1 << FIXPT_BITS


export function gradient_pixel_fixed(gradient: GradientData, fixed_pos: int) {
    let ipos = (fixed_pos + (FIXPT_SIZE / 2)) >> FIXPT_BITS;
    return gradient.colortable[gradient_clamp(gradient, ipos)];
}
export function gradient_pixel(gradient: GradientData, pos: float64) {
    let ipos = Math.trunc((pos * (1024 - 1) + 0.5));
    return gradient.colortable[gradient_clamp(gradient, ipos)];
}

export function fetch_linear_gradient(buffer: Uint32Array, v: LinearGradientValues, gradient: GradientData, y: int, x: int, length: int) {
    let t, inc;
    let rx = 0, ry = 0;

    if (v.l == 0.0) {
        t = inc = 0;
    }
    else {
        rx = gradient.matrix.c * (y + 0.5) + gradient.matrix.a * (x + 0.5) + gradient.matrix.tx;
        ry = gradient.matrix.d * (y + 0.5) + gradient.matrix.b * (x + 0.5) + gradient.matrix.ty;
        t = v.dx * rx + v.dy * ry + v.off;
        inc = v.dx * gradient.matrix.a + v.dy * gradient.matrix.b;
        t *= (1024 - 1);
        inc *= (1024 - 1);
    }
    let end = length;
    let bufferIndex = 0
    if ((inc > -1e-5) && (inc < 1e-5)) {
        memfill32(buffer, gradient_pixel_fixed(gradient, (t * FIXPT_SIZE) >> 0), length);
    }
    else {
        if (t + inc * length < (Number.MAX_SAFE_INTEGER >> (FIXPT_BITS + 1)) && t + inc * length > (Number.MIN_SAFE_INTEGER >> (FIXPT_BITS + 1))) {
            let t_fixed = (t * FIXPT_SIZE) >> 0;
            let inc_fixed = (inc * FIXPT_SIZE) >> 0;
            while (bufferIndex < end) {
                buffer[bufferIndex] = gradient_pixel_fixed(gradient, t_fixed);
                t_fixed += inc_fixed;
                ++bufferIndex;
            }
        }
        else {
            while (bufferIndex < end) {
                buffer[bufferIndex] = gradient_pixel(gradient, t / 1024);
                t += inc;
                ++bufferIndex;
            }
        }
    }
}



export function fetch_radial_gradient(buffer: Uint32Array, v: RadialGradientValues, gradient: GradientData, y: int, x: int, length: int) {
    if (v.a == 0.0) {
        memfill32(buffer, 0, length);
        return;
    }

    let rx = gradient.matrix.c * (y + 0.5) + gradient.matrix.tx + gradient.matrix.a * (x + 0.5);
    let ry = gradient.matrix.d * (y + 0.5) + gradient.matrix.ty + gradient.matrix.b * (x + 0.5);
    rx -= gradient.radial.fx;
    ry -= gradient.radial.fy;

    let inv_a = 1.0 / (2.0 * v.a);
    let delta_rx = gradient.matrix.a;
    let delta_ry = gradient.matrix.b;

    let b = 2 * (v.dr * gradient.radial.fr + rx * v.dx + ry * v.dy);
    let delta_b = 2 * (delta_rx * v.dx + delta_ry * v.dy);
    let b_delta_b = 2 * b * delta_b;
    let delta_b_delta_b = 2 * delta_b * delta_b;

    let bb = b * b;
    let delta_bb = delta_b * delta_b;

    b *= inv_a;
    delta_b *= inv_a;

    let rxrxryry = rx * rx + ry * ry;
    let delta_rxrxryry = delta_rx * delta_rx + delta_ry * delta_ry;
    let rx_plus_ry = 2 * (rx * delta_rx + ry * delta_ry);
    let delta_rx_plus_ry = 2 * delta_rxrxryry;

    inv_a *= inv_a;

    let det = (bb - 4 * v.a * (v.sqrfr - rxrxryry)) * inv_a;
    let delta_det = (b_delta_b + delta_bb + 4 * v.a * (rx_plus_ry + delta_rxrxryry)) * inv_a;
    let delta_delta_det = (delta_b_delta_b + 4 * v.a * delta_rx_plus_ry) * inv_a;

    let end = length;
    let bufferIndex = 0
    if (v.extended) {
        while (bufferIndex < end) {
            let result = 0;
            det = Math.abs(det) < DBL_EPSILON ? 0.0 : det;
            if (det >= 0) {
                let w = sqrt(det) - b;
                if (gradient.radial.fr + v.dr * w >= 0)
                    result = gradient_pixel(gradient, w);
            }
            buffer[bufferIndex] = result;
            det += delta_det;
            delta_det += delta_delta_det;
            b += delta_b;
            ++bufferIndex;
        }
    }
    else {
        while (bufferIndex < end) {
            det = Math.abs(det) < DBL_EPSILON ? 0.0 : det;
            let result = 0;
            if (det >= 0) {
                result = gradient_pixel(gradient, sqrt(det) - b);
            }
            buffer[bufferIndex++] = result;
            det += delta_det;
            delta_det += delta_delta_det;
            b += delta_b;
        }
    }
}
