import Canvas, { CanvasExpose } from "src/components/Canvas"
import { Path } from 'math/2d_path/path'
import { SKPath2D } from 'math/skia_path/SKPath2D'
import { PathBuilder } from 'math/2d_raster/soft2d'
import {PixelRenderer} from 'math/computer_graphic/scanning_algorithm/pixel'
import {drawDDALine,drawThickLine,drawDDALineAntialias} from 'math/computer_graphic/scanning_algorithm/line'

function testDDA(ctx: CanvasRenderingContext2D) {
    const pixel=new PixelRenderer({ctx:ctx,width:ctx.canvas.width/10.1,height:ctx.canvas.height/10.1})
    drawDDALine(10,10,20,20,(x1,y1)=>{
            pixel.setPixel(x1,y1,[255,0,0])
    })
    drawDDALineAntialias(30,40,50,10,(x1,y1,coverageRate)=>{

        pixel.setPixel(x1,y1,[255,0,0,coverageRate*255])
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