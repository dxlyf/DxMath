import { PathBuilder, Point, PathVerb } from "math/2d_raster/soft2d";
import { subdivideCubic, subdivideQuadratic } from "./Bezier";
import { Paint } from "./Paint";

export class Stroker {

    outerPath = PathBuilder.default()
    innerPath = PathBuilder.default()

    stroke(path: PathBuilder, paint: Paint) {

        path.visit({
            moveTo: (d) => {
            },
            lineTo: (d) => {

            },
            closePath: (d) => {

            }
        })
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