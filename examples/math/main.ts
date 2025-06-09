import { Context } from 'math/cg/ts/ctx'
import { LineCap, LineJoin } from 'math/cg/ts/paint';
import {Surface} from 'math/cg/ts/surface'

const canvas=document.getElementById('canvas') as HTMLCanvasElement;

const surface=Surface.create(500,500)

canvas.width=surface.width
canvas.height=surface.height

const nativeCtx=canvas.getContext('2d')!

const ctx=Context.create(surface)


ctx.setSourceRGB(1,0,0)
ctx.setLineWidth(10)
//ctx.setSourceLinearGradient(100,100)
ctx.setLineJoin(LineJoin.MITER)
//ctx.setLineCap(LineCap.ROUND)
// ctx.moveTo(100,100)
// ctx.lineTo(200,100)
// ctx.lineTo(100,200)
//ctx.rectangle(100,100,100,100)
ctx.arc(100,100,50,0,Math.PI*2)

ctx.fill()
ctx.newPath()

ctx.rectangle(200,200,100,100)
ctx.stroke()

nativeCtx.putImageData(new ImageData(surface.pixels!,surface.width,surface.height),0,0)