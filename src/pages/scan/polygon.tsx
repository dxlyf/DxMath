import Canvas, { CanvasExpose } from "src/components/Canvas"
import { Path } from 'math/2d_path/path'
import { SKPath2D } from 'math/skia_path/SKPath2D'
import { PathBuilder } from 'math/2d_raster/soft2d'
import { PixelRenderer } from 'math/computer_graphic/scanning_algorithm/pixel'
import { drawPolygon, polygonScanFill,polygonScanFill4,polygonScanFillAntialias4, polygonScanFill3,polygonScanFillAntialias3, polygonScanFillDeepseek, polygonScanFillAntialias, polygonScanFill2, polygonScanFillAntialias2 } from 'math/computer_graphic/scanning_algorithm/polygon'
import {sutherlandHodgmanClip,sutherlandHodgmanClip2,weilerAtherton,buildClipRect} from 'math/computer_graphic/scanning_algorithm/polygon_clip'

function testDDA(ctx: CanvasRenderingContext2D) {
    const pixel = new PixelRenderer({ ctx: ctx, width: ctx.canvas.width / 10.1, height: ctx.canvas.height / 10.1 })
    const path = Path.default()
    path.moveTo(10, 10)
    path.lineTo(20, 10)
    path.lineTo(20, 30)
    //  path.closePath()
    const points = path.toPolygon().map(d => [d.x, d.y])
    const points2 = path.toPolygon().map(d => [d.x + 20, d.y])
    const points3 = path.toPolygon().map(d => [d.x, d.y + 25])
    const points4 = path.toPolygon().map(d => [d.x + 20, d.y + 25])
   // const clip_points=sutherlandHodgmanClip(points2.map(d=>({x:d[0],y:d[1]})),{min:{x:0,y:20},max:{x:100,y:100}})
    console.log(JSON.stringify(points2),JSON.stringify(buildClipRect(36,14,100,10)))
    debugger
    const clip_points=weilerAtherton(points2,buildClipRect(36,14,100,10));
    console.log('points', JSON.stringify(clip_points))
    polygonScanFill(points, (x1, y1) => {
        pixel.setPixel(x1, y1, [0, 0, 255])
    })
    polygonScanFill3([[40,14], [36,14], [36,24], [40,24], [40,14]], 'evenodd', (x1, y1) => {
        pixel.setPixel(x1, y1, [0, 0, 255])
    })
    polygonScanFillAntialias(points3, (x1, y1, c) => {

        pixel.setPixel(x1, y1, [255, 0, 0, c * 255])
    })
    polygonScanFillAntialias4(points4, 'evenodd', (x1, y1, c) => {

        pixel.setPixel(x1, y1, [255, 0, 0, c * 255])
    })

    pixel.flush()
}

export default () => {

    const onInit = (ctx: CanvasExpose) => {



        ctx.drawOnce((ctx) => {
            testDDA(ctx)
        })

    }
    return <Canvas width={window.innerWidth} height={window.innerHeight} onInit={onInit}></Canvas>
}