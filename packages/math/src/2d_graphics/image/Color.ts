// math/2d_graphics/utils/color.ts

import { clamp } from "../math/util";

export interface RGBColor{
    r: number;
    g: number;
    b: number;
}
export interface HSLColor{
    h: number; // 色相
    s: number; // 饱和度
    l: number; // 亮度
}
export interface HSVColor{
    h: number; // 色相
    s: number; // 饱和度
    v: number; // 明度
}
   // RGB 转 HSL
export function rgbToHsl(r: number, g: number, b: number): HSLColor {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h=0, s, l = (max + min) / 2;

    if (max == min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return { h, s, l };
}
// HSL 转 RGB
export function hslToRgb(h: number, s: number, l: number): RGBColor {
    let r, g, b;

    if (s == 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p:number, q:number, t:number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return { r: r * 255, g: g * 255, b: b * 255 };
}

// RGB 转 HSV
export function rgbToHsv(r: number, g: number, b: number): HSVColor{
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h=0, s, v = max;

    const d = max - min;
    s = max == 0 ? 0 : d / max;

    if (max == min) {
        h = 0; // achromatic
    } else {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return { h, s, v };
}

// HSV 转 RGB
export function hsvToRgb(h: number, s: number, v: number): RGBColor {
    let r=0, g=0, b=0;

    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }

    return { r: r * 255, g: g * 255, b: b * 255 };
}

// HSL 转 HSV
export function hslToHsv(h: number, s: number, l: number):HSVColor {
    const v = l + s * Math.min(l, 1 - l);
    const sv = v === 0 ? 0 : 2 * (1 - l / v);
    return { h, s: sv, v };
}

// HSV 转 HSL
export function hsvToHsl(h: number, s: number, v: number): HSLColor {
    const l = (2 - s) * v / 2;
    const sl = s === 0 ? s : (l <= 1) ? s * v / (2 - s * v) : s * v / (2 - s);
    return { h, s: sl, l };
}

// Hex 转 RGB
export function hexToRgb(hex: string|number): RGBColor {
    if(typeof hex==='string'){
        hex=hex.replace('#','')
        hex=hex.length===3?hex.replace(/(\w)/g,'$1$1'):hex;
        hex=parseInt('0x'+hex, 16);
    }
    const value=hex as number
    const r=(value >> 16) & 0xff;
    const g=(value >> 8) & 0xff;
    const b=value & 0xff;
    return { r, g, b };
}
 
export function lerpColor(start: RGBColor, end: RGBColor, t: number): RGBColor {
    const r = start.r + (end.r - start.r) * t;
    const g = start.g + (end.g - start.g) * t;
    const b = start.b + (end.b - start.b) * t;
    return { r, g, b };
}
export class Color {
    static parse(color: string|Color|number): Color {
        if (typeof color==='string'||typeof color==='number') {
            return this.fromRGB(hexToRgb(color));
        }else{
            return this.fromRGB(color)
        }
    }
    static fromRGB(r: RGBColor): Color
    static fromRGB(r: number, g: number, b: number): Color 
    static fromRGB(r: number|RGBColor, g?: number, b?: number): Color {
        if(r!==null&&typeof r==='object'){
            return new Color(r.r, r.g, r.b);
        }else{
            return new Color(r, g, b);
        }
    }
    static fromHSL(h: number, s: number, l: number): Color {
        const { r, g, b } = hslToRgb(h, s, l);
        return new Color(r, g, b);
    }
    static fromHSV(h: number, s: number, v: number): Color {
        const { r, g, b } = hsvToRgb(h, s, v);
        return new Color(r, g, b);
    }
    private _r: number=0;
    private _g: number=0;
    private _b: number=0;
    private _a: number=1;
    // 构造函数，支持RGB、HSL和HSV初始化
    constructor(r: number=0, g: number=0, b: number=0) {
        this._r = r;
        this._g = g;
        this._b = b;
    }
    setRGB(r: number, g: number, b: number) {
        this._r = r;
        this._g = g;
        this._b = b;
        return this;
    }
    normalize(){
        this.r=clamp(this._r/255,0,1);
        this.g=clamp(this._g/255,0,1);
        this.b=clamp(this._b/255,0,1);
        return this;
    }
    set r(r: number) {
        this._r =r
    }
    get r(): number {
        return this._r;
    }
    set g(g: number) {
        this._g = g;
    }
    get g(): number {
        return this._g;
    }
    set b(b: number) {
        this._b = b;
    }
    get b(): number {
        return this._b;
    }
    set alpha(alpha: number) {
        this._a = Math.max(0, Math.min(1, alpha)); // 确保alpha在0到1之间
    }   
    get alpha(): number {
        return this._a;
    }
    // 颜色混合
    public mix(dst:Color,src: Color, t: number = 0.5): Color {
        const {r,g,b}=lerpColor(dst,src,t)
        return new Color(r, g, b);
    }
}

