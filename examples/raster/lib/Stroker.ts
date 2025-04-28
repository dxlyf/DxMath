import { PathBuilder, Point } from "math/2d_raster/soft2d";
export enum LineJoin {
    MITER,
    ROUND,
    BEVEL,
}

export enum LineCap {
    BUTT,
    ROUND,
    SQUARE,
}



export class Stroker{
    inner=PathBuilder.default()
    outer=PathBuilder.default()

    stroke(path: PathBuilder, paint: Point) {
        
    }
    addLine(){

    }
    addQuadraticCurve(){

    }
    addBezierCurve(){

    }
}