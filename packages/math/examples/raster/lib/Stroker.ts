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
type SubPath = {
    segments: Edge[],
    closed: boolean
}

let delta = Point.default()
let dir = Point.default()
let norm = Point.default()
let offset = Point.default()

let delta2 = Point.default()
let dir2 = Point.default()
let norm2 = Point.default()
let offset2 = Point.default()

let leftStart = Point.default()
let leftEnd = Point.default()
let rightStart = Point.default()
let rightEnd = Point.default()
export class Stroker {

    outerPath = PathBuilder.default()
    innerPath = PathBuilder.default()

    stroke(path: PathBuilder, paint: Paint) {

        let lineWidth = paint.lineWidth * 0.5

        let strokePath = PathBuilder.default()
        let closed = false, i = 0
        // let tmpPath=PathBuilder.default()
        let startPoint = Point.default()
        let lastPoint: Point | null = null
        let currentPoint = Point.default()
        let lastLastPoint = Point.default()



        let outerPath: PathBuilder | null = PathBuilder.default()
        let innerPath: PathBuilder | null = PathBuilder.default()


        path.visit({
            moveTo: (d) => {
                // 路径开始
                outerPath = PathBuilder.default()
                innerPath = PathBuilder.default()
                startPoint.copy(d.p0)
                lastPoint = null
            },
            lineTo: (d) => {
                let isStart = false
                if (lastPoint === null) {
                    isStart = true
                    lastPoint = startPoint.clone()
                }
                currentPoint.copy(d.p0)

                // if (isStart) {
                //     leftStart.addVector(lastPoint, offset)
                //     rightStart.subVector(lastPoint, offset)

                // } else {
                //     leftStart.addVector(lastPoint, offset)
                //     rightStart.subVector(lastPoint, offset)
                // }
                // leftEnd.addVector(currentPoint, offset)
                // rightEnd.subVector(currentPoint, offset)
                if (!isStart) {
                    this.handleLineJoin(outerPath!, lastLastPoint, lastPoint, currentPoint, lineWidth, paint)
                    this.handleLineJoin(innerPath!, lastLastPoint, lastPoint, currentPoint, -lineWidth, paint)
                } else {
                    delta.subVector(currentPoint, lastPoint)
                    dir.copy(delta).normalize()
                    norm.copy(dir).cw() // left
                    offset.copy(norm).multiplyScalar(lineWidth)

                    leftStart.addVector(lastPoint, offset)
                    leftEnd.addVector(currentPoint, offset)

                    rightStart.subVector(lastPoint, offset)
                    rightEnd.subVector(currentPoint, offset)

                    outerPath!.moveTo(leftStart)
                    // outerPath!.lineTo(leftEnd)

                    innerPath!.moveTo(rightStart)
                    // innerPath!.lineTo(rightEnd)
                }
                lastLastPoint.copy(lastPoint)
                lastPoint.copy(d.p0)
            },
            closePath: (d) => {
                // 是闭合路径，如果是闭合径
                closed = true;
                outerPath = null
                innerPath = null
                //  nextPoint=null

            }
        })

        // 如果是开放路径
        if (!closed && outerPath) {
            //
            strokePath.addPath(outerPath)
            innerPath.toReversePath().visit({
                moveTo: (d) => {
                    this.handleLineCap(strokePath, outerPath!.lastPoint, d.p0, paint)
                },
                lineTo: (d) => {
                    strokePath.lineTo(d.p0)
                }
            })
            this.handleLineCap(strokePath, strokePath!.lastPoint, outerPath!.points[0], paint)
            strokePath.closePath()

        }
        return strokePath
    }
    handleLineJoin(path: PathBuilder, prev: Point, current: Point, next: Point, lineWidth: number, paint: Paint) {

        delta.subVector(current, prev)
        dir.copy(delta).normalize()
        norm.copy(dir).cw() // left
        offset.copy(norm).multiplyScalar(lineWidth)

        delta2.subVector(next, current)
        dir2.copy(delta2).normalize()
        norm2.copy(dir2).cw() // left
        offset2.copy(norm2).multiplyScalar(lineWidth)

        let cos=dir.dot(dir2)
        let sin=dir.cross(dir2)
       // let isInner = ((dir.cross(dir2) > 0 ? 1 : -1) * lineWidth) < 0
   
        console.log('cos', cos, 'sin', sin)
        // leftStart.cos(current, offset)
        // leftEnd.addVector(current, offset2)
        let shouldBevel = false
        if (paint.lineJoin === LineJoin.MITER) {
            let base = Point.default().addVector(dir, dir2).normalize()
            let mater_cos = Math.cos(Math.acos(dir.dot(dir2)) / 2)
            let mater_cos2 = Math.sqrt((1 + dir.dot(dir2)) / 2)
            let miterLimit = paint.miterLimit
            let r = (1 / mater_cos)
            let miterLength = lineWidth * r
        
            console.log('base',base,'miterLength', miterLength,'abs-miterLength',Math.abs(miterLength), 'r', r, 'mater_cos', mater_cos)

            if (Math.abs(miterLength) <= (miterLimit*miterLimit) && Math.abs(cos)!==1) {
                let miterOffset = base.multiplyScalar(miterLength).add(current)

                path.lineTo(miterOffset)
                path.lineTo(leftEnd.addVector(next, offset2))

            } else {
                shouldBevel = true
            }

        }
        if (paint.lineJoin === LineJoin.BEVEL||shouldBevel) {
            path.lineTo(leftStart.addVector(current, offset))
            if(Math.abs(cos)!==1){
                path.lineTo(leftStart.addVector(current, offset2))
            }
            path.lineTo(leftStart.addVector(next, offset2))

        }
        if (paint.lineJoin === LineJoin.ROUND) {

        }


    }
    handleLineCap(path: PathBuilder, start: Point, end: Point, paint: Paint) {
        if (paint.lineCap === LineCap.ROUND) {
            const lineWidth = paint.lineWidth * 0.5
            const cx = (start.x + end.x) * 0.5
            const cy = (start.y + end.y) * 0.5
            const startAngle = Math.atan2(start.y - cy, start.x - cx)
            const endAngle = startAngle + Math.PI
            path.arc(cx, cy, lineWidth, startAngle, endAngle, false)
        }
        if (paint.lineCap === LineCap.SQUARE) {
            const lineWidth = paint.lineWidth * 0.5

        }
    }



}