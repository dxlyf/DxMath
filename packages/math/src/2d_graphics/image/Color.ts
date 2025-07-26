// math/2d_graphics/utils/color.ts

import { clamp } from "../math/util";
export type ColorValue=string|number|RGBColor|HSLColor;
export interface RGBColor {
    r: number;
    g: number;
    b: number;
}
export interface HSLColor {
    h: number; // 色相
    s: number; // 饱和度
    l: number; // 亮度
}
export interface HSVColor {
    h: number; // 色相
    s: number; // 饱和度
    v: number; // 明度
}
// RGB 转 HSL
export function rgbToHsl(r: number, g: number, b: number): HSLColor {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;

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
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return { r: r * 255, g: g * 255, b: b * 255 };
}

// RGB 转 HSV
export function rgbToHsv(r: number, g: number, b: number): HSVColor {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, v = max;

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
    let r = 0, g = 0, b = 0;

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
export function hslToHsv(h: number, s: number, l: number): HSVColor {
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
export function hexToRgb(hex: string | number): RGBColor {
    if (typeof hex === 'string') {
        hex = hex.replace('#', '')
        hex = hex.length === 3 ? hex.replace(/(\w)/g, '$1$1') : hex;
        hex = parseInt('0x' + hex, 16);
    }
    const value = hex as number
    const r = (value >> 16) & 0xff;
    const g = (value >> 8) & 0xff;
    const b = value & 0xff;
    return { r, g, b };
}

export function lerpColor(start: RGBColor, end: RGBColor, t: number): RGBColor {
    const r = start.r + (end.r - start.r) * t;
    const g = start.g + (end.g - start.g) * t;
    const b = start.b + (end.b - start.b) * t;
    return { r, g, b };
}

var colorMap = {
    'aliceblue': Float32Array.of(0.941, 0.973, 1.000, 1.000),
    'antiquewhite': Float32Array.of(0.980, 0.922, 0.843, 1.000),
    'aqua': Float32Array.of(0.000, 1.000, 1.000, 1.000),
    'aquamarine': Float32Array.of(0.498, 1.000, 0.831, 1.000),
    'azure': Float32Array.of(0.941, 1.000, 1.000, 1.000),
    'beige': Float32Array.of(0.961, 0.961, 0.863, 1.000),
    'bisque': Float32Array.of(1.000, 0.894, 0.769, 1.000),
    'black': Float32Array.of(0.000, 0.000, 0.000, 1.000),
    'blanchedalmond': Float32Array.of(1.000, 0.922, 0.804, 1.000),
    'blue': Float32Array.of(0.000, 0.000, 1.000, 1.000),
    'blueviolet': Float32Array.of(0.541, 0.169, 0.886, 1.000),
    'brown': Float32Array.of(0.647, 0.165, 0.165, 1.000),
    'burlywood': Float32Array.of(0.871, 0.722, 0.529, 1.000),
    'cadetblue': Float32Array.of(0.373, 0.620, 0.627, 1.000),
    'chartreuse': Float32Array.of(0.498, 1.000, 0.000, 1.000),
    'chocolate': Float32Array.of(0.824, 0.412, 0.118, 1.000),
    'coral': Float32Array.of(1.000, 0.498, 0.314, 1.000),
    'cornflowerblue': Float32Array.of(0.392, 0.584, 0.929, 1.000),
    'cornsilk': Float32Array.of(1.000, 0.973, 0.863, 1.000),
    'crimson': Float32Array.of(0.863, 0.078, 0.235, 1.000),
    'cyan': Float32Array.of(0.000, 1.000, 1.000, 1.000),
    'darkblue': Float32Array.of(0.000, 0.000, 0.545, 1.000),
    'darkcyan': Float32Array.of(0.000, 0.545, 0.545, 1.000),
    'darkgoldenrod': Float32Array.of(0.722, 0.525, 0.043, 1.000),
    'darkgray': Float32Array.of(0.663, 0.663, 0.663, 1.000),
    'darkgreen': Float32Array.of(0.000, 0.392, 0.000, 1.000),
    'darkgrey': Float32Array.of(0.663, 0.663, 0.663, 1.000),
    'darkkhaki': Float32Array.of(0.741, 0.718, 0.420, 1.000),
    'darkmagenta': Float32Array.of(0.545, 0.000, 0.545, 1.000),
    'darkolivegreen': Float32Array.of(0.333, 0.420, 0.184, 1.000),
    'darkorange': Float32Array.of(1.000, 0.549, 0.000, 1.000),
    'darkorchid': Float32Array.of(0.600, 0.196, 0.800, 1.000),
    'darkred': Float32Array.of(0.545, 0.000, 0.000, 1.000),
    'darksalmon': Float32Array.of(0.914, 0.588, 0.478, 1.000),
    'darkseagreen': Float32Array.of(0.561, 0.737, 0.561, 1.000),
    'darkslateblue': Float32Array.of(0.282, 0.239, 0.545, 1.000),
    'darkslategray': Float32Array.of(0.184, 0.310, 0.310, 1.000),
    'darkslategrey': Float32Array.of(0.184, 0.310, 0.310, 1.000),
    'darkturquoise': Float32Array.of(0.000, 0.808, 0.820, 1.000),
    'darkviolet': Float32Array.of(0.580, 0.000, 0.827, 1.000),
    'deeppink': Float32Array.of(1.000, 0.078, 0.576, 1.000),
    'deepskyblue': Float32Array.of(0.000, 0.749, 1.000, 1.000),
    'dimgray': Float32Array.of(0.412, 0.412, 0.412, 1.000),
    'dimgrey': Float32Array.of(0.412, 0.412, 0.412, 1.000),
    'dodgerblue': Float32Array.of(0.118, 0.565, 1.000, 1.000),
    'firebrick': Float32Array.of(0.698, 0.133, 0.133, 1.000),
    'floralwhite': Float32Array.of(1.000, 0.980, 0.941, 1.000),
    'forestgreen': Float32Array.of(0.133, 0.545, 0.133, 1.000),
    'fuchsia': Float32Array.of(1.000, 0.000, 1.000, 1.000),
    'gainsboro': Float32Array.of(0.863, 0.863, 0.863, 1.000),
    'ghostwhite': Float32Array.of(0.973, 0.973, 1.000, 1.000),
    'gold': Float32Array.of(1.000, 0.843, 0.000, 1.000),
    'goldenrod': Float32Array.of(0.855, 0.647, 0.125, 1.000),
    'gray': Float32Array.of(0.502, 0.502, 0.502, 1.000),
    'green': Float32Array.of(0.000, 0.502, 0.000, 1.000),
    'greenyellow': Float32Array.of(0.678, 1.000, 0.184, 1.000),
    'grey': Float32Array.of(0.502, 0.502, 0.502, 1.000),
    'honeydew': Float32Array.of(0.941, 1.000, 0.941, 1.000),
    'hotpink': Float32Array.of(1.000, 0.412, 0.706, 1.000),
    'indianred': Float32Array.of(0.804, 0.361, 0.361, 1.000),
    'indigo': Float32Array.of(0.294, 0.000, 0.510, 1.000),
    'ivory': Float32Array.of(1.000, 1.000, 0.941, 1.000),
    'khaki': Float32Array.of(0.941, 0.902, 0.549, 1.000),
    'lavender': Float32Array.of(0.902, 0.902, 0.980, 1.000),
    'lavenderblush': Float32Array.of(1.000, 0.941, 0.961, 1.000),
    'lawngreen': Float32Array.of(0.486, 0.988, 0.000, 1.000),
    'lemonchiffon': Float32Array.of(1.000, 0.980, 0.804, 1.000),
    'lightblue': Float32Array.of(0.678, 0.847, 0.902, 1.000),
    'lightcoral': Float32Array.of(0.941, 0.502, 0.502, 1.000),
    'lightcyan': Float32Array.of(0.878, 1.000, 1.000, 1.000),
    'lightgoldenrodyellow': Float32Array.of(0.980, 0.980, 0.824, 1.000),
    'lightgray': Float32Array.of(0.827, 0.827, 0.827, 1.000),
    'lightgreen': Float32Array.of(0.565, 0.933, 0.565, 1.000),
    'lightgrey': Float32Array.of(0.827, 0.827, 0.827, 1.000),
    'lightpink': Float32Array.of(1.000, 0.714, 0.757, 1.000),
    'lightsalmon': Float32Array.of(1.000, 0.627, 0.478, 1.000),
    'lightseagreen': Float32Array.of(0.125, 0.698, 0.667, 1.000),
    'lightskyblue': Float32Array.of(0.529, 0.808, 0.980, 1.000),
    'lightslategray': Float32Array.of(0.467, 0.533, 0.600, 1.000),
    'lightslategrey': Float32Array.of(0.467, 0.533, 0.600, 1.000),
    'lightsteelblue': Float32Array.of(0.690, 0.769, 0.871, 1.000),
    'lightyellow': Float32Array.of(1.000, 1.000, 0.878, 1.000),
    'lime': Float32Array.of(0.000, 1.000, 0.000, 1.000),
    'limegreen': Float32Array.of(0.196, 0.804, 0.196, 1.000),
    'linen': Float32Array.of(0.980, 0.941, 0.902, 1.000),
    'magenta': Float32Array.of(1.000, 0.000, 1.000, 1.000),
    'maroon': Float32Array.of(0.502, 0.000, 0.000, 1.000),
    'mediumaquamarine': Float32Array.of(0.400, 0.804, 0.667, 1.000),
    'mediumblue': Float32Array.of(0.000, 0.000, 0.804, 1.000),
    'mediumorchid': Float32Array.of(0.729, 0.333, 0.827, 1.000),
    'mediumpurple': Float32Array.of(0.576, 0.439, 0.859, 1.000),
    'mediumseagreen': Float32Array.of(0.235, 0.702, 0.443, 1.000),
    'mediumslateblue': Float32Array.of(0.482, 0.408, 0.933, 1.000),
    'mediumspringgreen': Float32Array.of(0.000, 0.980, 0.604, 1.000),
    'mediumturquoise': Float32Array.of(0.282, 0.820, 0.800, 1.000),
    'mediumvioletred': Float32Array.of(0.780, 0.082, 0.522, 1.000),
    'midnightblue': Float32Array.of(0.098, 0.098, 0.439, 1.000),
    'mintcream': Float32Array.of(0.961, 1.000, 0.980, 1.000),
    'mistyrose': Float32Array.of(1.000, 0.894, 0.882, 1.000),
    'moccasin': Float32Array.of(1.000, 0.894, 0.710, 1.000),
    'navajowhite': Float32Array.of(1.000, 0.871, 0.678, 1.000),
    'navy': Float32Array.of(0.000, 0.000, 0.502, 1.000),
    'oldlace': Float32Array.of(0.992, 0.961, 0.902, 1.000),
    'olive': Float32Array.of(0.502, 0.502, 0.000, 1.000),
    'olivedrab': Float32Array.of(0.420, 0.557, 0.137, 1.000),
    'orange': Float32Array.of(1.000, 0.647, 0.000, 1.000),
    'orangered': Float32Array.of(1.000, 0.271, 0.000, 1.000),
    'orchid': Float32Array.of(0.855, 0.439, 0.839, 1.000),
    'palegoldenrod': Float32Array.of(0.933, 0.910, 0.667, 1.000),
    'palegreen': Float32Array.of(0.596, 0.984, 0.596, 1.000),
    'paleturquoise': Float32Array.of(0.686, 0.933, 0.933, 1.000),
    'palevioletred': Float32Array.of(0.859, 0.439, 0.576, 1.000),
    'papayawhip': Float32Array.of(1.000, 0.937, 0.835, 1.000),
    'peachpuff': Float32Array.of(1.000, 0.855, 0.725, 1.000),
    'peru': Float32Array.of(0.804, 0.522, 0.247, 1.000),
    'pink': Float32Array.of(1.000, 0.753, 0.796, 1.000),
    'plum': Float32Array.of(0.867, 0.627, 0.867, 1.000),
    'powderblue': Float32Array.of(0.690, 0.878, 0.902, 1.000),
    'purple': Float32Array.of(0.502, 0.000, 0.502, 1.000),
    'rebeccapurple': Float32Array.of(0.400, 0.200, 0.600, 1.000),
    'red': Float32Array.of(1.000, 0.000, 0.000, 1.000),
    'rosybrown': Float32Array.of(0.737, 0.561, 0.561, 1.000),
    'royalblue': Float32Array.of(0.255, 0.412, 0.882, 1.000),
    'saddlebrown': Float32Array.of(0.545, 0.271, 0.075, 1.000),
    'salmon': Float32Array.of(0.980, 0.502, 0.447, 1.000),
    'sandybrown': Float32Array.of(0.957, 0.643, 0.376, 1.000),
    'seagreen': Float32Array.of(0.180, 0.545, 0.341, 1.000),
    'seashell': Float32Array.of(1.000, 0.961, 0.933, 1.000),
    'sienna': Float32Array.of(0.627, 0.322, 0.176, 1.000),
    'silver': Float32Array.of(0.753, 0.753, 0.753, 1.000),
    'skyblue': Float32Array.of(0.529, 0.808, 0.922, 1.000),
    'slateblue': Float32Array.of(0.416, 0.353, 0.804, 1.000),
    'slategray': Float32Array.of(0.439, 0.502, 0.565, 1.000),
    'slategrey': Float32Array.of(0.439, 0.502, 0.565, 1.000),
    'snow': Float32Array.of(1.000, 0.980, 0.980, 1.000),
    'springgreen': Float32Array.of(0.000, 1.000, 0.498, 1.000),
    'steelblue': Float32Array.of(0.275, 0.510, 0.706, 1.000),
    'tan': Float32Array.of(0.824, 0.706, 0.549, 1.000),
    'teal': Float32Array.of(0.000, 0.502, 0.502, 1.000),
    'thistle': Float32Array.of(0.847, 0.749, 0.847, 1.000),
    'tomato': Float32Array.of(1.000, 0.388, 0.278, 1.000),
    'transparent': Float32Array.of(0.000, 0.000, 0.000, 0.000),
    'turquoise': Float32Array.of(0.251, 0.878, 0.816, 1.000),
    'violet': Float32Array.of(0.933, 0.510, 0.933, 1.000),
    'wheat': Float32Array.of(0.961, 0.871, 0.702, 1.000),
    'white': Float32Array.of(1.000, 1.000, 1.000, 1.000),
    'whitesmoke': Float32Array.of(0.961, 0.961, 0.961, 1.000),
    'yellow': Float32Array.of(1.000, 1.000, 0.000, 1.000),
    'yellowgreen': Float32Array.of(0.604, 0.804, 0.196, 1.000),
} as const;
export class Color {
    static BLACK=Color.fromRGB(0, 0, 0);
    static WHITE=Color.fromRGB(255, 255, 255);
    static parse(color: string | Color | number): Color {
        if (typeof color === 'string' && color.startsWith('#') || typeof color === 'number') {
            return this.fromRGB(hexToRgb(color));
        } if (typeof color === 'string' && colorMap[color as keyof typeof colorMap]) {
            const value= colorMap[color as keyof typeof colorMap];
            return this.fromRGB(value[0]*255>>0,value[1]*255>>0,value[2]*255>>0);
        } else if (typeof color === 'object') {
            return this.fromRGB(color)
        }
        return this.fromRGB(0, 0, 0)
    }
    static fromRGB(r: RGBColor): Color
    static fromRGB(r: number, g: number, b: number): Color
    static fromRGB(r: number | RGBColor, g?: number, b?: number): Color {
        if (r !== null && typeof r === 'object') {
            return new Color(r.r, r.g, r.b);
        } else {
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
    private _r: number = 0;
    private _g: number = 0;
    private _b: number = 0;
    private _a: number = 1;
    // 构造函数，支持RGB、HSL和HSV初始化
    constructor(r: number = 0, g: number = 0, b: number = 0) {
        this._r = r;
        this._g = g;
        this._b = b;
    }
    copy(source:Color){
        this._r=source.r;
        this._g=source.g;
        this._b=source.b;
        this.alpha=source.alpha;
        return this
    }
    clone(){
        return Color.fromRGB(0,0,0).copy(this)
    }
    setRGB(r: number, g: number, b: number) {
        this._r = r;
        this._g = g;
        this._b = b;
        return this;
    }
    normalize() {
        this.r = clamp(this._r / 255, 0, 1);
        this.g = clamp(this._g / 255, 0, 1);
        this.b = clamp(this._b / 255, 0, 1);
        return this;
    }
    set r(r: number) {
        this._r = r
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
    setOpacity(opacity: number) {
        this.alpha = opacity;
        return this;
    }
    // 颜色混合
    public mix(dst: Color, src: Color, t: number = 0.5): Color {
        const { r, g, b } = lerpColor(dst, src, t)
        return new Color(r, g, b);
    }
    setRBG(r: number, g: number, b: number) {
        this.r = r;
        this.g = g;
        this.b = b;
        return this
    }
    setRGBColor(rgb: RGBColor) {
        this.r = rgb.r;
        this.g = rgb.g;
        this.b = rgb.b;
        return this
    }

    // 变亮
    brighten(amount: number) {
        const {h,s,l}=rgbToHsl(this.r, this.g, this.b);
        return this.setRGBColor(hslToRgb(h,s,l*(1+amount)))
    }
    multiplyScalar(s: number) {
        this.r *= s;
        this.g *= s;
        this.b *= s;
        return this
    }
    multiply(s: Color) {
        this.r *= s.r;
        this.g *= s.g;
        this.b *= s.b;
        return this
    }
    add(s: Color) {
        this.r += s.r;
        this.g += s.g;
        this.b += s.b;
        return this
    }
    round(){
        this.r = Math.round(this.r)
        this.g = Math.round(this.g)
        this.b = Math.round(this.b)
        return this
    }
    floor(){
        this.r = Math.floor(this.r)
        this.g = Math.floor(this.g)
        this.b = Math.floor(this.b)
        return this
    }
    clamp(min: number = 0, max: number = 1) {
        this.r = clamp(this.r, min, max)
        this.g = clamp(this.g, min, max)
        this.b = clamp(this.b, min, max)
        return this
    }
    toCssRGB(){
        return `rgb(${Math.round(this.r)},${Math.round(this.g)},${Math.round(this.b)})`
    }


}

