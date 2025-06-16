import Canvas, { CanvasExpose } from "src/components/Canvas"
import { Path } from 'math/2d_path/path'
import {Vector2} from 'math/math/vec2'
import { SKPath2D } from 'math/skia_path/SKPath2D'
import { PathBuilder,Point } from 'math/2d_raster/soft2d'
import { PixelRenderer } from 'math/computer_graphic/scanning_algorithm/pixel'
// import { drawPolygon,scanFillPolygonInt,scanFillPolygonFloat,scanFillPolygonIntAntialias,scanFillPolygon2WithFillRule, polygonScanFill,polygonScanFill4,polygonScanFillAntialias4, polygonScanFill3,polygonScanFillAntialias3, polygonScanFillDeepseek, polygonScanFillAntialias, polygonScanFill2, polygonScanFillAntialias2 } from 'math/computer_graphic/scanning_algorithm/polygon'
// import {sutherlandHodgmanClip,sutherlandHodgmanClip2,weilerAthertonClipper,buildClipRect} from 'math/computer_graphic/scanning_algorithm/polygon_clip'
// import {fillPolygon} from 'math/computer_graphic/scanning_algorithm/polygon4'



function testDDA(ctx: CanvasRenderingContext2D) {
    const pixel = new PixelRenderer({ ctx: ctx, width: ctx.canvas.width/20, height: ctx.canvas.height/20 })
    const path = PathBuilder.default()
     path.moveTo(20,10)
     path.lineTo(10,2)
   //  path.lineTo(30,30)

    path.visit({
        lineTo:d=>{
            let last=path.points[d.index-1]
            let next=d.p0
            // drawLine(last,next,(x,y)=>{
            //     pixel.setPixel(x,y,[255,0,0])
            // })
        }
    })
     pixel.flush()
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
    return <Canvas width={window.innerWidth} height={window.innerHeight} onInit={onInit}></Canvas>
}