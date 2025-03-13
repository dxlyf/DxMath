import Canvas, { CanvasExpose } from "src/components/Canvas"
import {rasterize,Document,Path,Style,ColorPaintServer,Color} from 'math/2d_path/rasterizer'

function testDDA(ctx: CanvasRenderingContext2D) {
    
    const path=new Path()

    path.moveTo(100,100)
    path.lineTo(200,200)
   // path.rect(100,100,100,100)
  //  path.addReversePath(    Path.default().rect(120,120,60,60))
    //path.closePath()
    let doc=new Document(ctx.canvas.width,ctx.canvas.height)

    let style=new Style()
    style.stroke_width=10
    style.stroke=new ColorPaintServer(Color.rgb(255,0,0))
  //  style.fill=new ColorPaintServer(Color.rgb(0,255,0))
 
    doc.draw(path,style)
    let pixmap=rasterize(doc.shapes,doc.width,doc.height)

    ctx.putImageData(new ImageData(pixmap.pixels,doc.width,doc.height),0,0)
}

export default () => {

    const onInit = (ctx: CanvasExpose) => {

   

        ctx.drawOnce((ctx) => {
            testDDA(ctx)
        })

    }
    return <Canvas width={window.innerWidth} height={window.innerHeight} onInit={onInit}></Canvas>
}