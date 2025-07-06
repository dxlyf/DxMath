import { clamp } from "./math";

export class Color {
    static zero() {
        return this.fromRGBA(0, 0, 0, 0)
    }
    /**
* 生成随机颜色
*/
    static random() {
        const r = Math.random();
        const g = Math.random();
        const b = Math.random();
        return this.fromRGB(r, g, b);
    }
    static fromRGB(r: number, g: number, b: number) {
        return this.fromRGBA(r, g, b, 1)
    }
    static fromRGBA(r: number, g: number, b: number, a: number) {
        return new this([r, g, b, a])
    }
    static fromHex(hex: number) {
        const r = hex << 16 & 0xff;
        const g = hex << 8 & 0xff;
        const b = hex & 0xff
        return this.fromRGB(r, g, b)
    }
    static fromHsl(h: number, s: number, l: number) {
        let v = l + s * Math.min(l, 1 - l);
        let newS = v > 0 ? 2 * (1 - l / v) : 0;

        return this.fromHsv(h, newS, v)
    }
    static fromHsv(h: number, s: number, v: number) {
        let r=0, g=0, b=0;
        let i = Math.floor(h / 60);
        let f = h / 60 - i;
        let p = v * (1 - s);
        let q = v * (1 - f * s);
        let t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0: r = v, g = t, b = p; break;
            case 1: r = q, g = v, b = p; break;
            case 2: r = p, g = v, b = t; break;
            case 3: r = p, g = q, b = v; break;
            case 4: r = t, g = p, b = v; break;
            case 5: r = v, g = p, b = q; break;
        }
        return this.fromRGB(r, g, b)
    }
    // r g b a {0-1}
    elements = new Float32Array(4)
    constructor(elements: number[] | Float32Array) {
        this.elements.set(elements)
    }
    get r() {
        return this.elements[0]
    }
    get r255() {
        return Math.round(this.r * 255)
    }

    set r(v) {
        this.elements[0] = v
    }
    get g() {
        return this.elements[1]
    }
    get g255() {
        return Math.round(this.g * 255)
    }
    set g(v) {
        this.elements[1] = v
    }
    get b() {
        return this.elements[2]
    }
    get b255() {
        return Math.round(this.b * 255)
    }
    set b(v) {
        this.elements[2] = v
    }
    get a() {
        return this.elements[3]
    }
    get a255() {
        return Math.round(this.a * 255)
    }
    set a(v) {
        this.elements[3] = v
    }
    copy(source: Color) {
        this.setElements(source.elements)
        return this;
    }
    clone() {
        return Color.fromRGBA(this.r, this.g, this.b, this.a)
    }
    /**
     * 克隆并应用方法
     * @param fn 应用的方法
     */
    cloneAndApply(fn: (color: Color) => void) {
        const newColor = this.clone();
        fn(newColor);
        return newColor;
    }
    setRGBA(r: number, g: number, b: number, a: number) {
        this.elements[0] = r;
        this.elements[1] = g;
        this.elements[2] = b;
        this.elements[3] = a;
        return this;
    }
    setRGB(r: number, g: number, b: number) {
        return this.setRGBA(r, g, b, this.a)
    }
    setElements(elements: number[] | Float32Array) {
        this.elements.set(elements)
        return this;
    }
    clamp(min: number, max: number) {
        return this.setElements(this.elements.map(v => Math.min(Math.max(min, v), max)))
    }
    floor() {
        return this.setElements(this.elements.map((a, i) => Math.floor(a)))
    }
    trunc() {
        return this.setElements(this.elements.map((a, i) => Math.trunc(a)))
    }
    ceil() {
        return this.setElements(this.elements.map((a, i) => Math.ceil(a)))
    }
    round() {
        return this.setElements(this.elements.map((a, i) => Math.round(a)))
    }
    add(b: Color) {
        return this.setElements(this.elements.map((a, i) => a + b.elements[i]))
    }
    sub(b: Color) {
        return this.setElements(this.elements.map((a, i) => a - b.elements[i]))
    }
    mul(b: Color) {
        return this.setElements(this.elements.map((a, i) => a * b.elements[i]))
    }
    multiply(b: Color) {
        return this.mul(b)
    }
    multiplyScalar(s: number) {
        return this.setElements(this.elements.map((a, i) => a * s))
    }
    divide(b: Color) {
        return this.setElements(this.elements.map((a, i) => a / b.elements[i]))
    }
    /**
     * 归一化颜色分量
     */
    normalize() {
        this.r = Math.min(1, Math.max(0, this.r));
        this.g = Math.min(1, Math.max(0, this.g));
        this.b = Math.min(1, Math.max(0, this.b));
        this.a = Math.min(1, Math.max(0, this.a));
        return this;
    }
    /**
 * 获取颜色分量的最大值
 */
    maxComponent() {
        return Math.max(this.r, this.g, this.b);
    }
    /**
 * 获取颜色分量的最小值
 */
    minComponent() {
        return Math.min(this.r, this.g, this.b);
    }
    /**
     * 获取颜色分量的平均值
     */
    averageComponent() {
        return (this.r + this.g + this.b) / 3;
    }
    /**
     * 获取颜色分量的乘积
     */
    productComponents() {
        return this.r * this.g * this.b;
    }
    /**
     * 获取颜色分量的和
     */
    sumComponents() {
        return this.r + this.g + this.b;
    }
    /**
     * 获取颜色分量的绝对值
     */
    absComponents() {
        const r = Math.abs(this.r);
        const g = Math.abs(this.g);
        const b = Math.abs(this.b);
        return this.setElements([r, g, b]);

    }
    /**
     * 颜色混合
     * @param color 要混合的颜色
     * @param t 混合比例 (0 到 1)
     */
    mix(color: Color, t: number) {
        const r = this.r + (color.r - this.r) * t;
        const g = this.g + (color.g - this.g) * t;
        const b = this.b + (color.b - this.b) * t;
        const a = this.a + (color.a - this.a) * t;
        return this.setElements([r, g, b, a]);
    }
    lerp(start: Color, end: Color, t: number) {
        const r = start.r + (end.r - start.r) * t;
        const g = start.g + (end.g - start.g) * t;
        const b = start.b + (end.b - start.b) * t;
        //const a = start.a + (end.a - start.a) * t;
        return this.setElements([r, g, b]);
    }
    /**
 * 调整饱和度
 * @param factor 饱和度因子 (0 到 1)
 */
    saturate(factor: number) {
        const gray = 0.2126 * this.r + 0.7152 * this.g + 0.0722 * this.b;
        this.r = gray + (this.r - gray) * factor;
        this.g = gray + (this.g - gray) * factor;
        this.b = gray + (this.b - gray) * factor;
        return this;
    }
    /**
     * 色调旋转
     * @param degrees 旋转角度 (0 到 360)
     */
    rotateHue(degrees: number) {
        const [h, s, v] = this.toHsv();
        const newH = (h + degrees) % 360;
        const newColor = Color.fromHsv(newH, s, v);
        this.setElements(newColor.elements);
        return this;
    }
    /**
 * 调整对比度
 * @param factor 对比度因子 (0 到 1)
 */
    contrast(factor: number) {
        const avg = (this.r + this.g + this.b) / 3;
        this.r = avg + (this.r - avg) * factor;
        this.g = avg + (this.g - avg) * factor;
        this.b = avg + (this.b - avg) * factor;
        return this;
    }
    /**
     * 透明度叠加
     * @param background 背景颜色
     */
    blend(background: Color) {
        const alpha = this.a;
        const invAlpha = 1 - alpha;
        this.r = this.r * alpha + background.r * invAlpha;
        this.g = this.g * alpha + background.g * invAlpha;
        this.b = this.b * alpha + background.b * invAlpha;
        this.a = 1; // 叠加后完全不透明
        return this;
    }
    /**
     * 转换为灰度
     */
    grayscale() {
        const gray = 0.2126 * this.r + 0.7152 * this.g + 0.0722 * this.b;
        this.r = gray;
        this.g = gray;
        this.b = gray;
        return this;
    }
    /**
 * 反色
 */
    invert() {
        this.r = 1 - this.r;
        this.g = 1 - this.g;
        this.b = 1 - this.b;
        return this;
    }
    /**
     * 预乘 Alpha
     */
    premultiplyAlpha() {
        const a = this.a;
        this.r *= a;
        this.g *= a;
        this.b *= a;
        return this;
    }
    /**
   * 变亮
   * @param factor 亮度因子 (0 到 1)
   */
    lighten(factor: number) {
        this.r += (1 - this.r) * factor;
        this.g += (1 - this.g) * factor;
        this.b += (1 - this.b) * factor;
        return this;
    }
    /**
   * 变暗
   * @param factor 暗度因子 (0 到 1)
   */
    darken(factor: number) {
        this.r *= (1 - factor);
        this.g *= (1 - factor);
        this.b *= (1 - factor);
        return this;
    }
    /**
 * 计算亮度
 */
    getBrightness() {
        return 0.2126 * this.r + 0.7152 * this.g + 0.0722 * this.b;
    }
    /**
 * 计算颜色差值
 * @param color 目标颜色
 */
    difference(color: Color) {
        return Math.abs(this.r - color.r) + Math.abs(this.g - color.g) + Math.abs(this.b - color.b);
    }
    /**
     * 计算颜色距离
     * @param color 目标颜色
     */
    distance(color: Color) {
        return Math.sqrt(
            Math.pow(this.r - color.r, 2) +
            Math.pow(this.g - color.g, 2) +
            Math.pow(this.b - color.b, 2)
        );
    }

    toHexStr() {
        return this.toHex().toString(16)
    }
    toHex() {
        return ((this.r << 16) | (this.g << 8) | this.b);
    }
    toHsl() {
        let r = this.r, g = this.g, b = this.b
        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h=0, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return [h, s, l];
    }
    toHsv() {
        let r = this.r, g = this.g, b = this.b
        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h=0, s, v = max;

        let d = max - min;
        s = max === 0 ? 0 : d / max;

        if (max === min) {
            h = 0; // achromatic
        } else {
            // 60*(g-b)/d+360 = ((g-b)/d+(360/60))*60
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return [h * 360, s, v];
    }
    /**
 * 转换为 CSS 格式
 */
    toCssString() {
        return `rgba(${Math.round(this.r255)}, ${Math.round(this.g255)}, ${Math.round(this.b255)}, ${this.a})`;
    }
}