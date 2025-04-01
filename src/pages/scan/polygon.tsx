import Canvas, { CanvasExpose } from "src/components/Canvas"
import { Path } from 'math/2d_path/path'
import {Vector2} from 'math/math/vec2'
import { SKPath2D } from 'math/skia_path/SKPath2D'
import { PathBuilder } from 'math/2d_raster/soft2d'
import { PixelRenderer } from 'math/computer_graphic/scanning_algorithm/pixel'
// import { drawPolygon,scanFillPolygonInt,scanFillPolygonFloat,scanFillPolygonIntAntialias,scanFillPolygon2WithFillRule, polygonScanFill,polygonScanFill4,polygonScanFillAntialias4, polygonScanFill3,polygonScanFillAntialias3, polygonScanFillDeepseek, polygonScanFillAntialias, polygonScanFill2, polygonScanFillAntialias2 } from 'math/computer_graphic/scanning_algorithm/polygon'
// import {sutherlandHodgmanClip,sutherlandHodgmanClip2,weilerAthertonClipper,buildClipRect} from 'math/computer_graphic/scanning_algorithm/polygon_clip'
import {fillPolygon,fillPolygon2,fillPolygonDeepSeek,fillPolygonGrok,CLAAFill} from 'math/computer_graphic/scanning_algorithm/polygon2'


function testDDA(ctx: CanvasRenderingContext2D) {
    const pixel = new PixelRenderer({ ctx: ctx, width: ctx.canvas.width / 10.1, height: ctx.canvas.height / 10.1 })
    const path = Path.default()
     path.moveTo(10,10.5)
     path.lineTo(30,10)
     path.lineTo(30,30)

    // path.moveTo(10,10)
    // path.lineTo(30,10)
    // path.lineTo(20,30)
   //  path.rect(10,10,40,40)
    // path.addReversePath(Path.default().rect(20,20,20,20),0)
    //  path.closePath()
    const polygons=path.toPolygons(true).flat()
    
    fillPolygon(polygons,(x,y,coverage)=>{
        const alpha = coverage; // 覆盖率作为透明度
        const color = lerpColor([255,255,255],[255,0,0], alpha!); // 线性插值混合颜色
      
        pixel.setPixel(x,y,color)
    },'nonzero')
 

    pixel.flush()
}

function testDDA2(ctx: CanvasRenderingContext2D) {
    const pixel = new PixelRenderer({ ctx: ctx, width: ctx.canvas.width / 10.1, height: ctx.canvas.height / 10.1 })
    const path = Path.default()
     path.moveTo(10,10.5)
     path.lineTo(30,10)
     path.lineTo(30,30)

    // path.moveTo(10,10)
    // path.lineTo(30,10)
    // path.lineTo(20,30)
   //  path.rect(10,10,40,40)
    // path.addReversePath(Path.default().rect(20,20,20,20),0)
    //  path.closePath()
    const polygons=path.toPolygons(true).flat()
    const caa=new CLAAFill()

    caa.fill(polygons,(x,y,coverage)=>{
        const alpha = coverage; // 覆盖率作为透明度
     //   const color = lerpColor([255,255,255],[255,0,0], alpha!); // 线性插值混合颜色
        
        pixel.setPixel(x,y,[255,0,0,coverage*255])
    },'nonzero')
 

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
            testDDA2(ctx)
        })

    }
    return <Canvas width={window.innerWidth} height={window.innerHeight} onInit={onInit}></Canvas>
}