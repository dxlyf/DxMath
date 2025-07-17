
import Canvas, { type CanvasExpose } from '../components/Canvas'
import { Path } from 'math/2d_path/path'
import { SKPath2D } from 'math/skia_path/SKPath2D'
import { PathBuilder, PathStroker, Paint, LineJoin, LineCap, endPointToCenter, centerToEndPoint } from 'math/2d_raster/soft2d'
import { GUI } from 'lil-gui'
import { Matrix2D } from 'math/math/mat2d'
import { Vector2 } from 'math/math/vec2'
import { ellipseArc, ellipseArcToCubicBezier } from 'math/curve/arc_to_bezier'
import { CanvasKit, initializeCanvasKit, CK } from 'math/canvaskit'


await SKPath2D.initializePathKit()
await initializeCanvasKit()

function radiansToDegrees(rad: number) {
    return (rad / Math.PI) * 180;
}

function degreesToRadians(deg: number) {
    return (deg / 180) * Math.PI;
}

function almostEqual(floata: number, floatb: number) {
    return Math.abs(floata - floatb) < 0.00001;
}

function allAreFinite(args: any[]) {
    for (var i = 0; i < args.length; i++) {
        if (args[i] !== undefined && !Number.isFinite(args[i])) {
            return false;
        }
    }
    return true;
}
function _ellipseHelper(skpath: CK.Path, x: number, y: number, radiusX: number, radiusY: number, startAngle: number, endAngle: number) {
    var sweepDegrees = radiansToDegrees(endAngle - startAngle);
    var startDegrees = radiansToDegrees(startAngle);

    var oval = CanvasKit!.LTRBRect(x - radiusX, y - radiusY, x + radiusX, y + radiusY);

    // draw in 2 180 degree segments because trying to draw all 360 degrees at once
    // draws nothing.
    if (almostEqual(Math.abs(sweepDegrees), 360)) {
        var halfSweep = sweepDegrees / 2;
        skpath.arcToOval(oval, startDegrees, halfSweep, false);
        skpath.arcToOval(oval, startDegrees + halfSweep, halfSweep, false);
        return;
    }
    skpath.arcToOval(oval, startDegrees, sweepDegrees, false);
}

function ellipse(skpath: CK.Path, x: number, y: number, radiusX: number, radiusY: number, rotation: number,
    startAngle: number, endAngle: number, ccw: boolean) {
    if (!allAreFinite([x, y, radiusX, radiusY, rotation, startAngle, endAngle])) {
        return;
    }
    if (radiusX < 0 || radiusY < 0) {
        throw 'radii cannot be negative';
    }

    // based off of CanonicalizeAngle in Chrome
    var tao = 2 * Math.PI;
    var newStartAngle = startAngle % tao;
    if (newStartAngle < 0) {
        newStartAngle += tao;
    }
    var delta = newStartAngle - startAngle;
    startAngle = newStartAngle;
    endAngle += delta;

    // Based off of AdjustEndAngle in Chrome.
    if (!ccw && (endAngle - startAngle) >= tao) {
        // Draw complete ellipse
        endAngle = startAngle + tao;
    } else if (ccw && (startAngle - endAngle) >= tao) {
        // Draw complete ellipse
        endAngle = startAngle - tao;
    } else if (!ccw && startAngle > endAngle) {
        endAngle = startAngle + (tao - (startAngle - endAngle) % tao);
    } else if (ccw && startAngle < endAngle) {
        endAngle = startAngle - (tao - (endAngle - startAngle) % tao);
    }

    // Based off of Chrome's implementation in
    // https://cs.chromium.org/chromium/src/third_party/blink/renderer/platform/graphics/path.cc
    // of note, can't use addArc or addOval because they close the arc, which
    // the spec says not to do (unless the user explicitly calls closePath).
    // This throws off points being in/out of the arc.
    if (!rotation) {
        _ellipseHelper(skpath, x, y, radiusX, radiusY, startAngle, endAngle);
        return;
    }
    var rotated = CanvasKit!.Matrix.rotated(rotation, x, y);
    var rotatedInvert = CanvasKit!.Matrix.rotated(-rotation, x, y);
    skpath.transform(rotatedInvert);
    _ellipseHelper(skpath, x, y, radiusX, radiusY, startAngle, endAngle);
    skpath.transform(rotated);
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
function testEllipse(ctx: CanvasRenderingContext2D, params: any, cx: number, cy: number, rx: number, ry: number, rotation: number, startAngle: number, endAngle: number, ccw = false) {
   
    const skPath =new SKPath2D()
    skPath.ellipse(cx, cy, rx, ry, rotation, startAngle, endAngle, ccw)

    const nativePath=new Path2D()
    nativePath.ellipse(cx, cy, rx, ry, rotation, startAngle, endAngle, ccw)

    const path2d = Path.default()

    path2d.ellipse3(cx, cy, rx, ry, rotation, startAngle, endAngle, ccw)

    const pathBuilder = PathBuilder.default()

    pathBuilder.ellipse(cx, cy, rx, ry, rotation, startAngle, endAngle, ccw)

    const ckPath = new CanvasKit!.Path() //PathBuilder.default()
    ckPath.toPath2D=function(){
        const p=new Path2D(this.toSVGString())
      
        return p;
    }
  //  path3.ellipse(cx, cy, rx, ry, rotation, startAngle, endAngle, ccw)
    ellipse(ckPath,cx, cy, rx, ry, rotation, startAngle, endAngle, ccw)
    ctx.textAlign='center'
    ctx.save()
    ctx.translate(120,100)
    if (params.showSkPath) {
        ctx.beginPath()
        ctx.stroke(skPath.toPath2D())
        ctx.fillText('SkPath',0,0)
    }
    ctx.translate(120,0)
    if (params.showPath2D) {
        ctx.beginPath()
        ctx.strokeStyle = 'red'

        ctx.stroke(nativePath)
        ctx.fillText('Path2D',0,0)
    }
    ctx.translate(120,0)
    if (params.showPathBuilder) {
        ctx.beginPath()
        ctx.strokeStyle = 'blue'
        ctx.stroke(pathBuilder.toPath2D())
        ctx.fillText('PathBuilder',0,0)
    }
    ctx.restore()
    ctx.translate(120,220)
    if (params.showCkPath) {
        ctx.beginPath()
        ctx.strokeStyle = 'blue'
        ctx.stroke(ckPath.toPath2D())
        ctx.fillText('CKPath',0,0)
    }
    ctx.translate(120,0)
    if (params.showPath) {
        ctx.beginPath()
        ctx.strokeStyle = 'blue'
        ctx.stroke(path2d.toPath2D())
        ctx.fillText('Path',0,0)
    }
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


    let points: number[] = [100, 200, 200, 50, 300, 200, .1]
    const path = new SKPath2D()
    path.moveTo(points[0], points[1])
    path.conicTo(...points.slice(2))

    const path2 = Path.default()
    path2.moveTo(points[0], points[1])
    path2.conicTo(...points.slice(2))

    const path3 = PathBuilder.default()
    path3.moveTo(points[0], points[1])
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


    let points: number[] = [100, 200, 200, 50, 300, 200, .1]
    const path = new SKPath2D()
    let path2 = PathBuilder.default()

    path.moveTo(100, 100)
    path.lineTo(200, 100)
    path.lineTo(200, 200)
    path.stroke({
        width: 10,
        miter_limit: 10,
        cap: SKPath2D.StrokeCap.ROUND,
        join: SKPath2D.StrokeJoin.ROUND,

    })

    // path2.moveTo(100,100)
    // path2.bezierCurveTo(200,50,300,50,400,100)
    // path2.lineTo(300,200)

    path2.ellipse(200, 200, 100, 100, 0, 0, Math.PI * 1.5, false)


    let paint = new Paint()
    paint.strokeWidth = 10
    paint.lineCap = LineCap.Round
    paint.lineJoin = LineJoin.Round

    let pathStroker = new PathStroker
    pathStroker.res_scale = PathStroker.computeResolutionScale(Matrix2D.default())
    let path2_ = pathStroker.stroke(path2, paint)

    //  ctx.stroke(path.toPath2D())
    path2_?.toCanvas(ctx)

    ctx.stroke()
}
export default () => {

    const onInit = (ctx: CanvasExpose) => {

        const svgPath = 'M100 100A50 50 0 1 1 150 300'
        const x0 = 100, y0 = 100

        const gui = new GUI()

        const params = {
            cx: 0,
            cy: 0,
            rx: 50,
            ry: 50,
            rotation: 0,
            startAngle: 0,
            endAngle: 360,
            ccw: false,
            showSkPath: true,
            showPath2D: true,
            showPathBuilder: true,
            showCkPath:true,
            showPath:true
        }
        const addGui = (params: any, ...args: any[]) => {
            gui.add(params, ...args).onChange(() => {
                draw()
            })
        }

        addGui(params, 'cx', 0, ctx.canvasWidth)
        addGui(params, 'cy', 0, ctx.canvasWidth)
        addGui(params, 'rx', 0, ctx.canvasWidth)
        addGui(params, 'ry', 0, ctx.canvasWidth)
        addGui(params, 'rotation', -720, 720, 1)
        addGui(params, 'startAngle', -720, 720, 1)
        addGui(params, 'endAngle', -720, 720, 1)
        addGui(params, 'ccw')
        addGui(params, 'showSkPath')
        addGui(params, 'showPath2D')
        addGui(params, 'showCkPath')
        addGui(params, 'showPath')
        addGui(params, 'showPathBuilder')
        function draw() {
            ctx.drawOnce((ctx) => {
                //testStroke(ctx)
                testEllipse(ctx, params, params.cx, params.cy, params.rx, params.ry, params.rotation / 180 * Math.PI, params.startAngle / 180 * Math.PI, params.endAngle / 180 * Math.PI, params.ccw)
            })
        }
        draw()

    }
    return <Canvas width={window.innerWidth} height={window.innerHeight} onInit={onInit} ></Canvas>
}