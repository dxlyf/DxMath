
export class Color {
    static fromRGBA(r: float64, g: float64, b: float64, a: float64 = 1) {
        return new Color().set(r, g, b, a);
    }
    r: float64 = 0;
    g: float64 = 0;
    b: float64 = 0;
    a: float64 = 1;
    set(r: float64, g: float64, b: float64, a: float64 = 1) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
        return this
    }
    copy(c: Color) {
        this.r = c.r;
        this.g = c.g;
        this.b = c.b;
        this.a = c.a;
        return this;
    }
    clone() {
        return new Color().copy(this);
    }

}
