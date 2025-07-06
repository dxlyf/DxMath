import { IVector2 } from "../vec2"


export class RasterizeLine {
    static from(m: number, p: IVector2) {
        return new this(m, p.x - m * p.y)
    }
    static fromPoint(p0: IVector2, p1: IVector2) {
        return this.from((p1.x - p0.x) / (p1.y - p0.y), p0)
    }
    static fromFloat(x: number) {
        return new this(0, x);
    }
    constructor(public m: number, public x0: number) {

    }
    getX(y: number) {
        return this.m * y + this.x0;
    }
};

export class Trapezoid {
    static fromLine(y0:number,y1:number,l0:RasterizeLine,l1:RasterizeLine){
        return new this(y0, y1, l0.getX(y0), l0.getX(y1), l1.getX(y0), l1.getX(y1))
    }
    //    y1    --------
    //         /       /
    //        /       /
    //       /       /
    //    y0 --------
    //      x0 x1   x2 x3

    y0 = 0
    y1 = 0
    x0 = 0
    x1 = 0
    x2 = 0
    x3 = 0
    constructor(y0: number, y1: number, x0: number, x1: number, x2: number, x3: number) {
        this.y0 = y0;
        this.y1 = y1;
        this.x0 = x0;
        this.x1 = x1;
        this.x2 = x2;
        this.x3 = x3;
    }
    getArea() {
        const { y0, y1, x2, x3, x0, x1 } = this;
        return (y1 - y0) * (x2 + x3 - x0 - x1) * 0.5;
    }
}