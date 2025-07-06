import Canvas, { CanvasExpose } from "../../components/Canvas"
import { Path } from 'math/2d_path/path'
import { IVector2 } from 'math/math/vec2'
import { SKPath2D } from 'math/skia_path/SKPath2D'
import { PathBuilder } from 'math/2d_raster/soft2d'
import {PixelRenderer} from 'math/computer_graphic/scanning_algorithm/pixel'
import {drawBresenhamLine,drawThickLine,drawBresenhamLineAntialias,drawDDALineAntialias} from 'math/computer_graphic/scanning_algorithm/line'

import {sutherlandHodgmanClip} from 'math/math/clipper/polygon'
function testDDA(ctx: CanvasRenderingContext2D) {
    
    const path=PathBuilder.default()
    const clipPath=PathBuilder.default()
    const result=PathBuilder.default()
    path.rect(100,100,100,100)
    clipPath.rect(120,120,100,100)

    ctx.beginPath()
    ctx.fillStyle='red'
    path.toCanvas(ctx)
    ctx.fill()
    ctx.beginPath()
    ctx.fillStyle='blue'
    clipPath.toCanvas(ctx)
    ctx.fill()

    const points=sutherlandHodgmanClip(path.toPolygons(false)[0],clipPath.toPolygons(false)[0])
   if(points.length){
    pathFromPolygon(result,points)
    //ctx.translate(200,0)
    ctx.beginPath()
    ctx.fillStyle='green'
    result.toCanvas(ctx)
    ctx.fill()
   }
}
function pathFromPolygon(path:PathBuilder,points:IVector2[]){
    path.moveTo(points[0].x,points[0].y)
    for(let i=1;i<points.length;i++){
        path.lineTo(points[i].x,points[i].y)
    }
}
export default () => {

    const onInit = (ctx: CanvasExpose) => {

   

        ctx.drawOnce((ctx) => {
            testDDA(ctx)
        })

    }
    return <Canvas width={window.innerWidth} height={window.innerHeight} onInit={onInit}></Canvas>
}