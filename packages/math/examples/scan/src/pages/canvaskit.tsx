import {CanvasKit} from 'math/canvaskit'
import { useLayoutEffect, useRef } from 'react'

export default () => {
    const ref=useRef<HTMLCanvasElement>(null)
    useLayoutEffect(()=>{

        const surface= CanvasKit.MakeWebGLCanvasSurface(ref.current!)

        const canvas=surface?.getCanvas()
        const paint=new CanvasKit.Paint()
        paint.setColor(CanvasKit.Color(255,0,0))
        paint.setAntiAlias(true)
        paint.setStyle(CanvasKit.PaintStyle.Fill)
        canvas?.drawCircle(100,100,100,paint)
        paint.delete()
        surface?.flush()
    },[])

    return <canvas ref={ref} width={500} height={500}></canvas>
}