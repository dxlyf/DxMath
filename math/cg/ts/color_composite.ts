
import { Color } from "./color";
import { getAlpha, byteMul, toBigInt } from "./util";
import { Operator } from "./paint";

export function premultiply_color(color: Color, opacity: float64) {
    let alpha = (color.a * opacity * 255)>>0;
    let pr = BigInt((color.r * alpha)>>0);
    let pg = BigInt((color.g * alpha)>>0);
    let pb = BigInt((color.b * alpha)>>0);
    return Number( (BigInt(alpha) << 24n) | (pb << 16n) | (pg << 8n) | (pr));
}
export function combine_opacity(color: Color, opacity: float64) {
    let a = (color.a * opacity * 255)>>0;
    let r = BigInt((color.r * 255)>>0);
    let g = BigInt((color.g * 255)>>0);
    let b = BigInt((color.b * 255)>>0);
    return Number((BigInt(a) << 24n) | (b << 16n) | (g << 8n) | (r));
}

export function premultiply_pixel(color: uint32) {
    let ccolor=toBigInt(color)
    let a =BigInt(getAlpha(color)>>0);
    let b = (ccolor >> 16n) & 0xffn;
    let g = (ccolor >> 8n) & 0xffn;
    let r = (ccolor >> 0n) & 0xffn;
    let pr = (r * a) / 255n;
    let pg = (g * a) / 255n;
    let pb = (b * a) / 255n;
    return Number((a << 24n) | (pb << 16n) | (pg << 8n) | (pr));
}

export function interpolate_pixel(src: any, srcAlpha: any, dst: any,dstAlpha: any) {
    src=toBigInt(src)
    srcAlpha=toBigInt(srcAlpha)
    dst=toBigInt(dst)
    dstAlpha=toBigInt(dstAlpha)
    let t = (src & 0xff00ffn) * srcAlpha + (dst & 0xff00ffn) * dstAlpha;
    t = (t + ((t >> 8n) & 0xff00ffn) + 0x800080n) >> 8n;
    t &= 0xff00ffn;
    src = ((src >> 8n) & 0xff00ffn) * srcAlpha + ((dst >> 8n) & 0xff00ffn) * dstAlpha;
    src = (src + ((src >> 8n) & 0xff00ffn) + 0x800080n);
    src &= 0xff00ff00n;
    src |= t;
    return Number(src);
}
export function memfill32(dst: uint32[] | Uint32Array, val: uint32, len: int) {
    for (let i = 0; i < len; i++) {
        dst[i] = val;
    }
}

export function comp_solid_source(dst: Uint32Array, len: int, color: uint32, alpha: uint32) {
    if (alpha == 255) {
        memfill32(dst, color, len);
    }
    else {
        let ialpha = 255 - alpha;
        color = byteMul(color, alpha);
        for (let i = 0; i < len; i++) {
            dst[i] = color + byteMul(dst[i] as any, ialpha);
        }
    }
}

export function comp_solid_source_over(dst: Uint32Array, len: int, color: uint32, alpha: uint32) {
    if ((alpha & getAlpha(color)) == 255) {
        memfill32(dst, color, len);
    }
    else {
        if (alpha != 255) {
            color = byteMul(color, alpha);
        }
        let ialpha = 255 - getAlpha(color);
        for (let i = 0; i < len; i++) {
            dst[i] = color + byteMul(dst[i], ialpha);
        }
    }
}

export function comp_solid_destination_in(dst: Uint32Array, len: int, color: uint32, alpha: uint32) {
    let a = getAlpha(color);
    if (alpha != 255) {
        a = byteMul(a, alpha) + 255 - alpha;
    }
    for (let i = 0; i < len; i++) {
        dst[i] = byteMul(dst[i], a);
    }
}

export function comp_solid_destination_out(dst: Uint32Array, len: int, color: uint32, alpha: uint32) {
    let a = getAlpha(~color);
    if (alpha != 255) {
        a = byteMul(a, alpha) + 255 - alpha;
    }
    for (let i = 0; i < len; i++) {
        dst[i] = byteMul(dst[i], a);
    }
}

export function comp_source(dst: Uint32Array, len: int, src: Uint32Array, alpha: uint32) {
    if (alpha == 255) {
        dst.set(src.subarray(0, len))
    }
    else {
        let ialpha = 255 - alpha;
        for (let i = 0; i < len; i++) {
            dst[i] = interpolate_pixel(src[i], alpha, dst[i], ialpha);
        }
    }
}

export function comp_source_over(dst: Uint32Array, len: int, src: Uint32Array, alpha: uint32) {
    let s, sia;
    if (alpha == 255) {
        for (let i = 0; i < len; i++) {
            s = src[i];
            if (s >= 0xff000000)
                dst[i] = s;
            else if (s != 0) {
                sia = getAlpha(~s);
                dst[i] = s + byteMul(dst[i], sia);
            }
        }
    }
    else {
        for (let i = 0; i < len; i++) {
            s = byteMul(src[i], alpha);
            sia = getAlpha(~s);
            dst[i] = s + byteMul(dst[i], sia);
        }
    }
}


export function comp_destination_in(dst: Uint32Array, len: int, src: Uint32Array, alpha: uint32) {
    if (alpha == 255) {
        for (let i = 0; i < len; i++)
            dst[i] = byteMul(dst[i], getAlpha(src[i]));
    }
    else {
        let cia = 255 - alpha;
        let a;
        for (let i = 0; i < len; i++) {
            a = byteMul(getAlpha(src[i]), alpha) + cia;
            dst[i] = byteMul(dst[i], a);
        }
    }
}

export function comp_destination_out(dst: Uint32Array, len: int, src: Uint32Array, alpha: uint32) {
    if (alpha == 255) {
        for (let i = 0; i < len; i++)
            dst[i] = byteMul(dst[i], getAlpha(~src[i]));
    }
    else {
        let cia = 255 - alpha;
        let sia;
        for (let i = 0; i < len; i++) {
            sia = byteMul(getAlpha(~src[i]), alpha) + cia;
            dst[i] = byteMul(dst[i], sia);
        }
    }
}
export type comp_solid_function = (dst: Uint32Array, len: int, color: uint32, alpha: uint32) => void;
export const comp_solid_map: comp_solid_function[] = [
    comp_solid_source,
    comp_solid_source_over,
    comp_solid_destination_in,
    comp_solid_destination_out,
];
export type comp_function = (dst: Uint32Array, len: int, src: Uint32Array, alpha: uint32) => void;
export const comp_map: comp_function[] = [
    comp_source,
    comp_source_over,
    comp_destination_in,
    comp_destination_out,
];


