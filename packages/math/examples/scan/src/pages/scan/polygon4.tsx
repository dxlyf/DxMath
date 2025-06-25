import Canvas, { CanvasExpose } from "../../components/Canvas"
import { Path } from 'math/2d_path/path'
import {Vector2} from 'math/math/vec2'
import { SKPath2D } from 'math/skia_path/SKPath2D'
import { PathBuilder,PathStroker,Point,Paint,LineCap,LineJoin} from 'math/2d_raster/soft2d'
import { PixelRenderer } from 'math/computer_graphic/scanning_algorithm/pixel'
// import { drawPolygon,scanFillPolygonInt,scanFillPolygonFloat,scanFillPolygonIntAntialias,scanFillPolygon2WithFillRule, polygonScanFill,polygonScanFill4,polygonScanFillAntialias4, polygonScanFill3,polygonScanFillAntialias3, polygonScanFillDeepseek, polygonScanFillAntialias, polygonScanFill2, polygonScanFillAntialias2 } from 'math/computer_graphic/scanning_algorithm/polygon'
// import {sutherlandHodgmanClip,sutherlandHodgmanClip2,weilerAthertonClipper,buildClipRect} from 'math/computer_graphic/scanning_algorithm/polygon_clip'
import {fillPath} from 'math/computer_graphic/scanning_algorithm/polygon4'



function testDDA(ctx: CanvasRenderingContext2D) {
    const pixel = new PixelRenderer({ ctx: ctx, width: ctx.canvas.width, height: ctx.canvas.height })
    const path = PathBuilder.default()
    
    path.moveTo(100,100)
    path.lineTo(300,400)
    
    let a=new PathStroker()
    let paint=new Paint()
    paint.strokeWidth=20
    paint.lineJoin=LineJoin.Round
    paint.lineCap=LineCap.Round
    let path2=   a.stroke(path,paint)
    fillPath(path2.fatten(),(x:number,y:number,coverage:number)=>{
        pixel.setPixel(x, y, [255, 0, 0,coverage])
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
    return <Canvas width={640} height={640} onInit={onInit}></Canvas>
}