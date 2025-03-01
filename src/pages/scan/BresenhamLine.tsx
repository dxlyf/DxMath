import Canvas, { CanvasExpose } from "src/components/Canvas"
import { Path } from 'math/2d_path/path'
import { SKPath2D } from 'math/skia_path/SKPath2D'
import { PathBuilder } from 'math/2d_raster/soft2d'
import {PixelRenderer} from 'math/computer_graphic/scanning_algorithm/pixel'
import {drawBresenhamLine,drawThickLine,drawBresenhamLineAntialias,drawDDALineAntialias} from 'math/computer_graphic/scanning_algorithm/line'
import {cohenSutherland,liangBarsky,midpointSubdivision} from 'math/computer_graphic/scanning_algorithm/line_clip'
function testDDA(ctx: CanvasRenderingContext2D) {
    const pixel=new PixelRenderer({ctx:ctx,width:ctx.canvas.width/10.1,height:ctx.canvas.height/10.1})
  
    const points=[0,0,20,0]
    
    const p=cohenSutherland({x:points[0],y:points[1]},{x:points[2],y:points[3]},{xmin: 10, ymin: 0,xmax: 100,ymax: 5})
    if(p){
        points[0]=p[0].x
        points[1]=p[0].y
        points[2]=p[1].x
        points[3]=p[1].y
    }
    drawBresenhamLine(10,10,30,20,(x1,y1)=>{
            pixel.setPixel(x1,y1,[255,0,0])
    })
    drawBresenhamLine(points[0],points[1],points[2],points[3],(x1,y1)=>{
        pixel.setPixel(x1,y1,[255,0,0])
    })
    drawBresenhamLineAntialias(40,40,50,10,(x1,y1,coverageRate)=>{

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