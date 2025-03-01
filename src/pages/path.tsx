
import Canvas, { CanvasExpose } from '../components/Canvas'
import { Path } from '../../math/2d_path/path'
import { SKPath2D } from '../../math/skia_path/SKPath2D'
import { PathBuilder } from '../../math/2d_raster/soft2d'
import {GUI} from 'lil-gui'


function testEllipseArc(ctx: CanvasRenderingContext2D) {

    const svgPath = 'M100 100A50 50 0 0 0 200 200'

    const path =  SKPath2D.fromSvgPath(svgPath)
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

    path.moveTo(200,200)
    path.arcTo(300, 300, 400, 300,50)
    const path2 = Path.default()
    path2.moveTo(200,200)
    path2.arcTo(300, 300, 400, 300,50)
    const path3 = PathBuilder.default()
    path3.moveTo(200,200)
    path3.arcTo(300, 300, 400, 300,50)
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

    path.ellipse(300, 300, 100, 120, 0, 0, Math.PI * 2, false)
    const path2 = Path.default()

    path2.ellipse(300, 300, 100, 120, 0, 0, Math.PI * 2, false)

    const path3 = PathBuilder.default()

    path3.ellipse(300, 300, 100, 120, 0, 0, Math.PI * 2, false)

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
    path.arc(300, 300, 80,  Math.PI * 2,0, true)
    const path2 = Path.default()

    path2.arc(300, 300, 100, 0, Math.PI * 2, false)
    path2.arc(300, 300, 80,  Math.PI * 2,0, true)
    const path3 = PathBuilder.default()

    path3.arc(300, 300, 100, 0, Math.PI * 2, false)
    path3.arc(300, 300, 80,  Math.PI * 2,0, true)
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

    path.rect(300, 300, 100,100)

    const path2 = Path.default()

    path2.rect(300, 300, 100,100)
    const path3 = PathBuilder.default()

    path3.rect(300, 300, 100,100)
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

    path.roundRect(300, 300, 100,100,10)

    const path2 = Path.default()

    path2.roundRect(300, 300, 100,100,10)
    const path3 = PathBuilder.default()

    path3.roundRect(300, 300, 100,100,10)
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
export default () => {

    const onInit = (ctx: CanvasExpose) => {

        const svgPath = 'M100 100A50 50 0 1 1 150 300'
        const x0 = 100, y0 = 100


        ctx.drawOnce((ctx) => {
            testArcTo(ctx)
           // testEllipseArc(ctx)
        })

    }
    return <Canvas width={window.innerWidth} height={window.innerHeight} onInit={onInit} ></Canvas>
}