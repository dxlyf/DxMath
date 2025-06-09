import Canvas, { CanvasExpose } from "src/components/Canvas"
// import {rasterize,Document,Path,Style,ColorPaintServer,Color} from 'math/2d_path/rasterizer'

import {PathBuilder} from 'math/2d_raster/soft2d'
import {Path} from 'math/2d_raster/geom'
import {NewRasterizer} from 'math/2d_raster/raster'
import {RoundJoiner,ButtCapper,BevelJoiner} from 'math/2d_raster/stroke'
import {RGBAPainter,Image,RGBA} from 'math/2d_raster/paint'
import {Point26_6,Int26_6} from 'math/2d_raster/fixed'
// function testDDA(ctx: CanvasRenderingContext2D) {
    
//     const path=new Path()

//     path.moveTo(100,100)
//     path.lineTo(200,200)
//    // path.rect(100,100,100,100)
//   //  path.addReversePath(    Path.default().rect(120,120,60,60))
//     //path.closePath()
//     let doc=new Document(ctx.canvas.width,ctx.canvas.height)

//     let style=new Style()
//     style.stroke_width=10
//     style.stroke=new ColorPaintServer(Color.rgb(255,0,0))
//   //  style.fill=new ColorPaintServer(Color.rgb(0,255,0))
 
//     doc.draw(path,style)
//     let pixmap=rasterize(doc.shapes,doc.width,doc.height)

//     ctx.putImageData(new ImageData(pixmap.pixels,doc.width,doc.height),0,0)
// }

function testNewRasterizer(ctx:CanvasExpose){
    const r=NewRasterizer(ctx.canvasWidth,ctx.canvasHeight)

    let pathBuilder=new PathBuilder()
   
    pathBuilder.moveTo(100,100)
    pathBuilder.lineTo(400,100)
    pathBuilder.lineTo(300,400)
   // pathBuilder.rect(100,100,200,200)
    pathBuilder.quadraticCurveTo(200,200,300,200)
    //pathBuilder.transform([2,0,0,2,0,0])


   // pathBuilder.transform([64,0,0,64,0,0])
  
    let path=new Path()

    pathBuilder.fatten().visit({
        moveTo:(d)=>{
            path.Start(Point26_6.fromF32(d.p0.x,d.p0.y))
        },
        lineTo:(d)=>{
            path.Add1(Point26_6.fromF32(d.p0.x,d.p0.y))
        },
        quadraticCurveTo:(d)=>{
            path.Add2(Point26_6.fromF32(d.p1.x,d.p1.y),Point26_6.fromF32(d.p2.x,d.p2.y))
        },
        bezierCurveTo:(d)=>{
            path.Add3(Point26_6.fromF32(d.p1.x,d.p1.y),Point26_6.fromF32(d.p2.x,d.p2.y),Point26_6.fromF32(d.p3.x,d.p3.y))
        },
        closePath:(d)=>{
            path.Add1(Point26_6.fromF32(d.lastMovePoint.x,d.lastMovePoint.y));
        }
    })
    let paint=new RGBAPainter(new Image(ctx.canvasWidth,ctx.canvasHeight))
    paint.setColor(RGBA.fromRGBA(255,0,0,255))
    r.UseNonZeroWinding=true
  //  r.AddPath(path)
    r.Clear()
    //r.AddPath(path)
    r.AddStroke(path,10<<6,new ButtCapper(),new RoundJoiner())
   // r.AddPath(path)
    r.Rasterize(paint)

    ctx.ctx?.putImageData(paint.image.imageData,0,0)


    ctx.ctx?.beginPath()
    ctx.ctx!.lineWidth=10
    pathBuilder.toCanvas(ctx.ctx!)
  //  ctx.ctx!.stroke()
}
export default () => {

    const onInit = (ctx: CanvasExpose) => {

   

        ctx.drawOnce(() => {
            testNewRasterizer(ctx)
        })

    }
    return <Canvas width={500} height={500} dpr={1} onInit={onInit}></Canvas>
}