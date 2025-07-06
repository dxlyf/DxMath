import { Context } from 'math/2d_softrender/ctx'
import { FillRule, LineCap, LineJoin } from 'math/2d_softrender/paint';
import {Surface} from 'math/2d_softrender/surface'
import {FT_Cos,FT_Atan2,ft_trig_pseudo_rotate} from 'math/2d_softrender/ft/math'


console.log('FT_Cos',FT_Cos(40<<16),'FT_Atan2',FT_Atan2(1,1)/65536)
const surface=Surface.create(500,500)
const ctx=Context.create(surface)

const canvas=document.getElementById('canvas') as HTMLCanvasElement;
canvas.width=surface.width
canvas.height=surface.height
const nativeCtx=canvas.getContext('2d')!

ctx.save()
ctx.newPath()
ctx.setSourceRGB(1,0,0)
ctx.rectangle(100,100,100,100)
ctx.fill()


// ctx.save()
// ctx.newPath()
// ctx.setSourceRGB(1,0,0)
// var gradinet=ctx.setSourceRadialGradient(250,250,80,250,250,0)
// gradinet.addStopRgb(0,1,0,0)
// gradinet.addStopRgb(0.5,0,1,0)
// gradinet.addStopRgb(1,0,0,1)

// ctx.setLineWidth(10)
// ctx.setLineJoin(LineJoin.MITER)
// //ctx.setDash([10,5],0)
// ctx.rectangle(200,200,100,100)
// ctx.fill()
// ctx.restore()

// ctx.save()
// ctx.newPath()
// ctx.setLineJoin(LineJoin.ROUND)
// ctx.setLineCap(LineCap.ROUND)
// ctx.setLineWidth(10)
// ctx.setSourceRGB(1,0,0)
// ctx.moveTo(100,100)
// ctx.lineTo(200,100)
// ctx.lineTo(100,200)
// ctx.stroke()
// ctx.restore()

// ctx.save()
// ctx.newPath()
// ctx.setLineJoin(LineJoin.MITER)
// ctx.setLineCap(LineCap.SQUARE)
// ctx.setLineWidth(10)
// ctx.setSourceRGB(1,0,0)
// ctx.moveTo(40,300)
// ctx.lineTo(160,300)
// ctx.lineTo(40,400)
// ctx.stroke()
// ctx.restore()

// ctx.save()
// ctx.newPath()
// ctx.setLineJoin(LineJoin.MITER)
// ctx.setLineCap(LineCap.SQUARE)
// ctx.setLineWidth(10)
// ctx.setDash([10,25,10],0)
// ctx.setSourceRGB(1,0,0)
// ctx.moveTo(240,330)
// ctx.lineTo(460,330)

// ctx.stroke()
// ctx.restore()

// ctx.save()
// ctx.newPath()

// ctx.setSourceRGB(1,0,0)
// ctx.setLineWidth(10)
// ctx.setLineJoin(LineJoin.ROUND)
//  ctx.arc(300,100,50,0,Math.PI*2,false)
// ctx.clip()
//ctx.rectangle(100,100,100,100)
// ctx.stroke()
// ctx.restore()

nativeCtx.putImageData(new ImageData(surface.pixels!,surface.width,surface.height),0,0)