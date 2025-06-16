
import Canvas, { CanvasExpose } from '../components/Canvas'
import { Path } from '../../math/2d_path/path'
import { SKPath2D } from '../../math/skia_path/SKPath2D'
import { PathBuilder,PathStroker,Paint,LineJoin,LineCap, endPointToCenter,centerToEndPoint } from '../../math/2d_raster/soft2d'
import { GUI } from 'lil-gui'
import { Matrix2D } from 'math/math/mat2d'
import { Vector2 } from 'math/math/vec2'
import { ellipseArcToCubicBezier } from 'math/curve/arc_to_bezier'

await SKPath2D.initializePathKit()
PathBuilder.prototype.ellipse2 = function (
    cx: number, cy: number, rx: number, ry: number,
    rotation: number, startAngle: number, endAngle: number,
    anticlockwise: boolean = false
) {
    
    // var tao = 2 * Math.PI;
    // var newStartAngle = startAngle % tao;
    // if (newStartAngle < 0) {
    //   newStartAngle += tao;
    // }
    // var delta = newStartAngle - startAngle;
    // startAngle = newStartAngle;
    // endAngle += delta;
  
    // // Based off of AdjustEndAngle in Chrome.
    // if (!anticlockwise && (endAngle - startAngle) >= tao) {
    //   // Draw complete ellipse
    //   endAngle = startAngle + tao;
    // } else if (anticlockwise && (startAngle - endAngle) >= tao) {
    //   // Draw complete ellipse
    //   endAngle = startAngle - tao;
    // } else if (!anticlockwise && startAngle > endAngle) {
    //   endAngle = startAngle + (tao - (startAngle - endAngle) % tao);
    // } else if (anticlockwise && startAngle < endAngle) {
    //   endAngle = startAngle - (tao - (endAngle - startAngle) % tao);
    // }

    let deltaTheta = endAngle - startAngle

    if (anticlockwise && deltaTheta > 0) {
        while (deltaTheta > 0) {
            deltaTheta -= 2 * Math.PI;
        }
    } 
    if(!anticlockwise && deltaTheta < 0) {
        while (deltaTheta < 0) {
            deltaTheta += 2 * Math.PI;
        }
    }
    if(Math.abs(deltaTheta-Math.PI*2)<=1e-6){
        const halfSweep=deltaTheta/2
        this.arcToOval(cx,cy,rx,ry,rotation,startAngle,halfSweep,true)
        this.arcToOval(cx,cy,rx,ry,rotation,startAngle+halfSweep,halfSweep,false)
    }else{
        this.arcToOval(cx,cy,rx,ry,rotation,startAngle,deltaTheta,true)
    }
   
    return this
}

function testEllipseArcCust(ctx: CanvasRenderingContext2D) {

    const svgPath = 'M100 100A50 50 0 0 0 200 200'

    const path = SKPath2D.fromSvgPath(svgPath)
    path.moveTo(200, 200)
    const path2 = Path.fromSvgPath(svgPath)

    const path3 = PathBuilder.fromSvgPath(svgPath)
    const path4 = new Path2D(svgPath)

    ctx.beginPath()
    ctx.stroke(path.toPath2D())

    ctx.stroke(path2.toPath2D())
    ctx.beginPath()
    ctx.strokeStyle = '#ffff00'

    ctx.stroke(path4)

    ctx.beginPath()
    ctx.strokeStyle = 'red'

    ctx.stroke(path2.toPath2D())
    ctx.beginPath()
    ctx.strokeStyle = 'blue'

    ctx.stroke(path3.toPath2D())


}

function testEllipseArc(ctx: CanvasRenderingContext2D) {

    const svgPath = 'M100 100A50 50 0 0 0 200 200'

    const path = SKPath2D.fromSvgPath(svgPath)
    path.moveTo(200, 200)
    const path2 = Path.fromSvgPath(svgPath)
    const path3 = PathBuilder.fromSvgPath(svgPath)
    const path4 = new Path2D(svgPath)

    ctx.beginPath()
    ctx.stroke(path.toPath2D())

    ctx.stroke(path2.toPath2D())
    ctx.beginPath()
    ctx.strokeStyle = '#ffff00'

    ctx.stroke(path4)

    ctx.beginPath()
    ctx.strokeStyle = 'red'

    ctx.stroke(path2.toPath2D())
    ctx.beginPath()
    ctx.strokeStyle = 'blue'

    ctx.stroke(path3.toPath2D())


}
function testArcTo(ctx: CanvasRenderingContext2D) {
    const path = new SKPath2D()

    path.moveTo(200, 200)
    path.arcTo(300, 300, 400, 300, 50)
    const path2 = Path.default()
    path2.moveTo(200, 200)
    path2.arcTo(300, 300, 400, 300, 50)
    const path3 = PathBuilder.default()
    path3.moveTo(200, 200)
    path3.arcTo(300, 300, 400, 300, 50)
    ctx.beginPath()
    ctx.stroke(path.toPath2D())
    ctx.beginPath()
    ctx.strokeStyle = 'red'

    ctx.stroke(path2.toPath2D())
    ctx.beginPath()
    ctx.strokeStyle = 'blue'

    ctx.stroke(path3.fatten().toPath2D())
}
function testEllipse(ctx: CanvasRenderingContext2D) {
    const path = new SKPath2D()

    path.ellipse(300, 300, 100, 120, 0, 0, Math.PI*2, false)
    const path2 = Path.default()

    path2.ellipse(300, 300, 100, 120, 0, 0, Math.PI*2, false)

    const path3 = PathBuilder.default()

    path3.ellipse(300, 300, 100, 120, 0, 0, Math.PI*2, false)

    ctx.beginPath()
    ctx.stroke(path.toPath2D())
    ctx.beginPath()
    ctx.strokeStyle = 'red'

    ctx.stroke(path2.toPath2D())
    ctx.beginPath()
    ctx.strokeStyle = 'blue'

    ctx.stroke(path3.toPath2D())
}

function testArc(ctx: CanvasRenderingContext2D) {
    const path = new SKPath2D()

    path.arc(300, 300, 100, 0, Math.PI * 2, false)
    path.arc(300, 300, 80, Math.PI * 2, 0, true)
    const path2 = Path.default()

    path2.arc(300, 300, 100, 0, Math.PI * 2, false)
    path2.arc(300, 300, 80, Math.PI * 2, 0, true)
    const path3 = PathBuilder.default()

    path3.arc(300, 300, 100, 0, Math.PI * 2, false)
    path3.arc(300, 300, 80, Math.PI * 2, 0, true)
    ctx.beginPath()
    ctx.fill(path.toPath2D())
    ctx.beginPath()
    ctx.strokeStyle = 'red'
    ctx.fillStyle = 'red'
    ctx.fill(path2.toPath2D())
    ctx.beginPath()
    ctx.strokeStyle = 'blue'
    ctx.fillStyle = 'blue'
    ctx.fill(path3.toPath2D())
}



function testRect(ctx: CanvasRenderingContext2D) {
    const path = new SKPath2D()

    path.rect(300, 300, 100, 100)

    const path2 = Path.default()

    path2.rect(300, 300, 100, 100)
    const path3 = PathBuilder.default()

    path3.rect(300, 300, 100, 100)
    ctx.beginPath()
    ctx.stroke(path.toPath2D())
    ctx.beginPath()
    ctx.strokeStyle = 'red'
    ctx.fillStyle = 'red'
    ctx.stroke(path2.toPath2D())
    ctx.beginPath()
    ctx.strokeStyle = 'blue'
    ctx.fillStyle = 'blue'
    ctx.stroke(path3.toPath2D())
}


function testRoundRect(ctx: CanvasRenderingContext2D) {
    const path = new SKPath2D()

    path.roundRect(300, 300, 100, 100, 10)

    const path2 = Path.default()

    path2.roundRect(300, 300, 100, 100, 10)
    const path3 = PathBuilder.default()

    path3.roundRect(300, 300, 100, 100, 10)
    ctx.beginPath()
    ctx.stroke(path.toPath2D())
    ctx.beginPath()
    ctx.strokeStyle = 'red'
    ctx.fillStyle = 'red'
    ctx.stroke(path2.toPath2D())
    ctx.beginPath()
    ctx.strokeStyle = 'blue'
    ctx.fillStyle = 'blue'
    ctx.stroke(path3.toPath2D())
}

function testConic(ctx: CanvasRenderingContext2D) {

   
    let points:number[]=[100,200,200,50,300,200,.1]
    const path =new SKPath2D()
    path.moveTo(points[0],points[1])
    path.conicTo(...points.slice(2))

    const path2 = Path.default()
    path2.moveTo(points[0],points[1])
    path2.conicTo(...points.slice(2))

    const path3 = PathBuilder.default()
    path3.moveTo(points[0],points[1])
    path3.conicTo(...points.slice(2))
   // const path4 = new Path2D()

    ctx.beginPath()
    ctx.stroke(path.toPath2D())

    // ctx.beginPath()
    // ctx.strokeStyle = '#ffff00'
    //ctx.stroke(path4)

    ctx.beginPath()
    ctx.strokeStyle = 'red'

   // ctx.stroke(path2.toPath2D())
    ctx.beginPath()
    ctx.strokeStyle = 'blue'

    ctx.stroke(path3.toPath2D())


}


function testStroke(ctx: CanvasRenderingContext2D) {

   
    let points:number[]=[100,200,200,50,300,200,.1]
    const path =new SKPath2D()
    let path2 = PathBuilder.default()

    path.moveTo(100,100)
    path.lineTo(200,100)
    path.lineTo(200,200)
    path.stroke({
        width:10,
        miter_limit:10,
        cap:SKPath2D.StrokeCap.ROUND,
        join:SKPath2D.StrokeJoin.ROUND,

    })
    
    path2.moveTo(100,100)
    path2.lineTo(200,100)
    path2.lineTo(200,200)
    let paint=new Paint()
    paint.strokeWidth=10
    paint.lineCap=LineCap.Round
    paint.lineJoin=LineJoin.Round

    let pathStroker=new PathStroker
    pathStroker.res_scale=PathStroker.computeResolutionScale(Matrix2D.default())
    let path2_= pathStroker.stroke(path2,paint)

 //  ctx.stroke(path.toPath2D())
   path2_?.toCanvas(ctx)

    ctx.stroke()
}
export default () => {

    const onInit = (ctx: CanvasExpose) => {

        const svgPath = 'M100 100A50 50 0 1 1 150 300'
        const x0 = 100, y0 = 100


        ctx.drawOnce((ctx) => {
            testStroke(ctx)
            // testEllipseArc(ctx)
        })

    }
    return <Canvas width={window.innerWidth} height={window.innerHeight} onInit={onInit} ></Canvas>
}