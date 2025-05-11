import { PathBuilder, Point, PathVerb } from "math/2d_raster/soft2d";
import { subdivideCubic, subdivideQuadratic } from "./Bezier";
import { Paint } from "./Paint";
export enum LineJoin {
    MITER = 'miter',
    ROUND = 'round',
    BEVEL = 'bevel',
}

export enum LineCap {
    BUTT = 'butt',
    ROUND = 'round',
    SQUARE = 'square',
}


type Edge = {
    nromalize: Point
    offset: Point
    delta: Point
    start: Point
    end: Point

}
type SubPath={
    segments: Edge[],
    closed: boolean
}

export class Stroker {

    outerPath=PathBuilder.default()
    innerPath=PathBuilder.default()

    stroke(path: PathBuilder, paint: Paint) {
        let strokePath = PathBuilder.default()
        let closed=false,i=0
        path.visit({
            moveTo:(d)=> {
                this.outerPath.moveTo(d.p0)
                this.innerPath.moveTo(d.p0)
                i=0
            },
            lineTo:(d)=> {
                const outer = this.strokeLine(paint, d.p0, d.p1)
                this.outerPath.addPath(outer)
                const inner = this.strokeLine(paint, d.p1, d.p0)
                this.innerPath.addPath(inner)
            },
            closePath:(d)=>{
                closed=true;
            }
        })
        if(!closed){
            // 闭合路径
            
        }
        return strokePath
    }
    strokePath(subPath:SubPath){
         if(subPath.closed){
            for(let i=0;i<subPath.segments.length;i++){
                const segment=subPath.segments[i]
            }
         }else{
            for(let i=0;i<subPath.segments.length;i++){
                const segment=subPath.segments[i]
            }
         }
    }
    addSegment(segments:Edge,start: Point, end: Point){
        const delta=end.clone().sub(start)
        const normalize=delta.clone().normalize()
        const offset=normalize.clone().perp()
        return {
            delta,
            normalize,
            offset,
            start:start.clone(),
            end:end.clone()
        }
    }
    buildSegments(path: PathBuilder) {
        const result: SubPath[] = []
        let segments: Edge[] = [], 
        currentPoint = Point.default(),
        nextPoint = Point.default(), closed = false
        let lastMovePoint = Point.default()
        path.visit({
            moveTo(d) {
                if (segments.length > 0) {
                    result.push({ segments, closed: false })
                }
                segments = []
                closed = false
                lastMovePoint.copy(d.p0)
                currentPoint.copy(d.p0)
            },
            lineTo:(d)=>{
                nextPoint.copy(d.p0)
                this.addSegment(segments,currentPoint,nextPoint)
                currentPoint.copy(nextPoint)
                closed = false
            },
            quadraticCurveTo(d) {

            },
            bezierCurveTo(d) {

            },
            closePath(d) {

                if (segments.length > 0) {
                    nextPoint.copy(lastMovePoint)
                    this.addSegment(segments,currentPoint,nextPoint)
                    currentPoint.copy(nextPoint)
                    result.push({ segments, closed: true })
                    segments=[]
                }
                closed = true

            }
        })
        if(segments.length>0){
            result.push({ segments, closed })
        }
        return result
    }

    addLine() {

    }
    addQuadraticCurve() {

    }
    addBezierCurve() {

    }
}