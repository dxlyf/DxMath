import Canvas, { CanvasExpose } from "src/components/Canvas"
import { Path } from 'math/2d_path/path'
import { SKPath2D } from 'math/skia_path/SKPath2D'
import { PathBuilder } from 'math/2d_raster/soft2d'
import {PixelRenderer} from 'math/computer_graphic/scanning_algorithm/pixel'
import {drawMidpointEllipse,drawBresenhamEllipse,drawMidpointEllipseAntialias,drawBresenhamEllipseAntialias} from 'math/computer_graphic/scanning_algorithm/ellipse'

function testDDA(ctx: CanvasRenderingContext2D) {
    const pixel=new PixelRenderer({ctx:ctx,width:ctx.canvas.width/10.1,height:ctx.canvas.height/10.1})
    drawMidpointEllipse(20,20,10,15,(x1,y1)=>{
            pixel.setPixel(x1,y1,[255,0,0])
    })

    drawBresenhamEllipse(50,20,10,15,(x1,y1)=>{
        pixel.setPixel(x1,y1,[255,0,0])
    })
    drawMidpointEllipseAntialias(20,60,10,15,(x1,y1,c)=>{
        pixel.setPixel(x1,y1,[255,0,0,c*255])
    })
    drawBresenhamEllipseAntialias(50,60,10,15,(x1,y1,c)=>{
        pixel.setPixel(x1,y1,[255,0,0,c*255])
    })
    pixel.flush()
}

export default () => {

    const onInit = (ctx: CanvasExpose) => {

   

        ctx.drawOnce((ctx) => {
            testDDA(ctx)
        })

    }
    return <Canvas width={window.innerWidth} height={window.innerHeight*1.5} onInit={onInit}></Canvas>
}