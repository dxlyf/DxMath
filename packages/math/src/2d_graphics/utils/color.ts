// math/2d_graphics/utils/color.ts

class Color {
    private _r!: number;
    private _g!: number;
    private _b!: number;
    private _h!: number;
    private _s!: number;
    private _l!: number;
    private _v!: number;

    // 构造函数，支持RGB、HSL和HSV初始化
    constructor(r?: number, g?: number, b?: number) {
        if (r !== undefined && g !== undefined && b !== undefined) {
            this._r = r;
            this._g = g;
            this._b = b;
        } 
    }

    // RGB 转 HSL
    private rgbToHsl(r: number, g: number, b: number): { h: number, s: number, l: number } {
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
    private hslToRgb(h: number, s: number, l: number): { r: number, g: number, b: number } {
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
    private rgbToHsv(r: number, g: number, b: number): { h: number, s: number, v: number } {
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
    private hsvToRgb(h: number, s: number, v: number): { r: number, g: number, b: number } {
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
    private hslToHsv(h: number, s: number, l: number): { h: number, s: number, v: number } {
        const v = l + s * Math.min(l, 1 - l);
        const sv = v === 0 ? 0 : 2 * (1 - l / v);
        return { h, s: sv, v };
    }

    // HSV 转 HSL
    private hsvToHsl(h: number, s: number, v: number): { h: number, s: number, l: number } {
        const l = (2 - s) * v / 2;
        const sl = s === 0 ? s : (l <= 1) ? s * v / (2 - s * v) : s * v / (2 - s);
        return { h, s: sl, l };
    }

    // 获取RGB值
    public getRGB(): { r: number, g: number, b: number } {
        return { r: this._r, g: this._g, b: this._b };
    }

    // 获取HSL值
    public getHSL(): { h: number, s: number, l: number } {
        return { h: this._h, s: this._s, l: this._l };
    }

    // 获取HSV值
    public getHSV(): { h: number, s: number, v: number } {
        return { h: this._h, s: this._s, v: this._v };
    }

    // 颜色混合
    public mix(color: Color, weight: number = 0.5): Color {
        const r = this._r + (color._r - this._r) * weight;
        const g = this._g + (color._g - this._g) * weight;
        const b = this._b + (color._b - this._b) * weight;
        return new Color(r, g, b);
    }
}

