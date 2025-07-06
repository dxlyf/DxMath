import Canvas, { CanvasExpose } from "../../components/Canvas"
import { Path } from 'math/2d_path/path'
import { Vector2 } from 'math/math/vec2'
import { SKPath2D } from 'math/skia_path/SKPath2D'
import { PathBuilder, PathStroker, Point, Paint, LineCap, LineJoin } from 'math/2d_raster/soft2d'
import { PixelRenderer } from 'math/computer_graphic/scanning_algorithm/pixel'
// import { drawPolygon,scanFillPolygonInt,scanFillPolygonFloat,scanFillPolygonIntAntialias,scanFillPolygon2WithFillRule, polygonScanFill,polygonScanFill4,polygonScanFillAntialias4, polygonScanFill3,polygonScanFillAntialias3, polygonScanFillDeepseek, polygonScanFillAntialias, polygonScanFill2, polygonScanFillAntialias2 } from 'math/computer_graphic/scanning_algorithm/polygon'
// import {sutherlandHodgmanClip,sutherlandHodgmanClip2,weilerAthertonClipper,buildClipRect} from 'math/computer_graphic/scanning_algorithm/polygon_clip'
import { fillPath } from 'math/computer_graphic/scanning_algorithm/polygon4'

import { fract,getGridRays } from 'math/math/math'

function testDDA(ctx: CanvasRenderingContext2D) {
    const pixel = new PixelRenderer({ ctx: ctx, width: ctx.canvas.width/64 , height: ctx.canvas.height/64  })
    const path = PathBuilder.default()

    path.moveTo(5, 1)
    path.lineTo(9, 7)
    path.lineTo(1, 7)
    path.closePath()
    path.points.forEach(d=>{
      //  d.translate(0.5,0.5)
      // d.multiplyScalar(64)
    })
    // let a=new PathStroker()
    // let paint=new Paint()
    // paint.strokeWidth=20
    // paint.lineJoin=LineJoin.Round
    // paint.lineCap=LineCap.Round
    // let path2=   a.stroke(path,paint)
    fillPath(path, (x: number, y: number, coverage: number) => {
        pixel.setPixel(x, y, [255, 0, 0, coverage])
    })

    pixel.flush()
    ctx.beginPath()
    ctx.strokeStyle = '#0000ff'
    path.visit({
        moveTo: d => {
            ctx.moveTo(d.p0.x * 64, d.p0.y * 64)
        },
        lineTo: d => {
            ctx.lineTo(d.p0.x * 64, d.p0.y * 64)
        },
        closePath:d=>{
            ctx.lineTo(d.lastMovePoint.x * 64, d.lastMovePoint.y * 64)
        }
    })
    ctx.stroke()

    let points=path.points
   
    let p0=points[0].clone()
    let p1=points[1].clone()
    let d0=p1.clone().sub(p0)
    let n0=d0.clone().normalize()

    let sign=n0.clone().sign(true)
    
    

    points.forEach(d => {
        ctx.beginPath()
        ctx.fillStyle = '#0000ff'
        ctx.arc(d.x * 64, d.y * 64, 5, 0, Math.PI * 2)
        ctx.fill()
    })
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;

}
function lerpColor(a: number[], b: number[], t: number) {
    return a.map((value, index) => lerp(value, b[index], t));
}
export default () => {

    const onInit = (ctx: CanvasExpose) => {



        ctx.drawOnce((ctx) => {
            testDDA(ctx)
        })

    }
    return <Canvas width={768} height={640} dpr={1} onInit={onInit}></Canvas>
}