import { Point } from "./matrix"
import { Path } from "./path"

export class Bezier {
    x1: float64 = 0
    y1: float64 = 0
    x2: float64 = 0
    y2: float64 = 0
    x3: float64 = 0
    y3: float64 = 0
    x4: float64 = 0
    y4: float64 = 0

    split(b: Bezier, first: Bezier, second: Bezier) {
        let c = (b.x2 + b.x3) * 0.5;
        first.x2 = (b.x1 + b.x2) * 0.5;
        second.x3 = (b.x3 + b.x4) * 0.5;
        first.x1 = b.x1;
        second.x4 = b.x4;
        first.x3 = (first.x2 + c) * 0.5;
        second.x2 = (second.x3 + c) * 0.5;
        first.x4 = second.x1 = (first.x3 + second.x2) * 0.5;

        c = (b.y2 + b.y3) * 0.5;
        first.y2 = (b.y1 + b.y2) * 0.5;
        second.y3 = (b.y3 + b.y4) * 0.5;
        first.y1 = b.y1;
        second.y4 = b.y4;
        first.y3 = (first.y2 + c) * 0.5;
        second.y2 = (second.y3 + c) * 0.5;
        first.y4 = second.y1 = (first.y3 + second.y2) * 0.5;
    }
 
}


export function bezier_flatten(path: Path, p0: Point, p1: Point, p2: Point, p3: Point) {
    let beziers = new Array(32).fill(0).map(x => new Bezier());


    beziers[0].x1 = p0.x;
    beziers[0].y1 = p0.y;
    beziers[0].x2 = p1.x;
    beziers[0].y2 = p1.y;
    beziers[0].x3 = p2.x;
    beziers[0].y3 = p2.y;
    beziers[0].x4 = p3.x;
    beziers[0].y4 = p3.y;
    let i=0
    while (i>=0&&i<beziers.length) {
        let b=beziers[i];
        let y4y1 = b.y4 - b.y1;
        let x4x1 = b.x4 - b.x1;
        let l = Math.abs(x4x1) + Math.abs(y4y1);
        let d;
        if (l > 1.0) {
            d = Math.abs((x4x1) * (b.y1 - b.y2) - (y4y1) * (b.x1 - b.x2)) + Math.abs((x4x1) * (b.y1 - b.y3) - (y4y1) * (b.x1 - b.x3));
        }
        else {
            d = Math.abs(b.x1 - b.x2) + Math.abs(b.y1 - b.y2) + Math.abs(b.x1 - b.x3) + Math.abs(b.y1 - b.y3);
            l = 1.0;
        }
        if ((d < l * 0.25) || i===31) {
            path.lineTo(b.x4, b.y4);
            --i;
        }
        else {
            b.split(b, beziers[i+1], b);
            ++i;
        }
    }
}