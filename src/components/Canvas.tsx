import React, { useEffect, useLayoutEffect, useMemo } from "react"
import { useState,useRef,useImperativeHandle} from "react"

export type CanvasExpose={
    canvasWidth:number,
    canvasHeight:number,
    height:number,
    width:number,
    dpr?:number,
    ctx:null|CanvasRenderingContext2D,
    clear:()=>void
    drawOnce:(callback:(ctx:CanvasRenderingContext2D)=>void)=>void
    animate:(callback:(ctx:CanvasRenderingContext2D)=>void)=>()=>void
}
type CanvasProps={
    width:number
    height:number
    dpr?:number
    onInit?:(ctx:CanvasExpose)=>void
    onDestroy?:()=>void

}
const Canvas=React.forwardRef<CanvasExpose,CanvasProps>((props,ref)=>{
    const {width,height,dpr=window.devicePixelRatio}=props;
    
    
    const stateRef=useRef<Partial<CanvasProps>>({
     
    })
    stateRef.current.onDestroy=props.onDestroy;
    const canvasRef=useRef<HTMLCanvasElement>(null)
    const [ctx,setContext]=useState<CanvasRenderingContext2D|null>(null);
    const state:CanvasExpose=useMemo(()=>{
        const instance:CanvasExpose={
            canvasWidth:width*dpr>>0,
            canvasHeight:height*dpr>>0,
            height,
            width,
            dpr:dpr,
            ctx:ctx,
            clear:()=>{
                ctx!.clearRect(0,0,instance.canvasWidth,instance.canvasHeight)
            },
            drawOnce:(callback)=>{
                ctx!.clearRect(0,0,instance.canvasWidth,instance.canvasHeight)
                ctx!.save()
                ctx!.scale(dpr,dpr)
                callback(ctx!)
                ctx!.restore()
            },
            animate:(callback)=>{
                const loop=()=>{
                    instance.drawOnce(callback)
                    animationId=requestAnimationFrame(loop)
                }
                let animationId=requestAnimationFrame(loop)
                return ()=>{
                    cancelAnimationFrame(animationId)
                }
            }

        }
        return instance;
    },[ctx,width,height,dpr])

    useLayoutEffect(()=>{
       if(state.ctx){
          props.onInit?.(state);
       }
    },[state.ctx])
    useLayoutEffect(()=>{
        setContext(canvasRef.current!.getContext("2d"))
        return ()=>{
            stateRef.current.onDestroy?.();
        }
    },[])
    useImperativeHandle(ref,()=>state,[state]); 

    return <canvas ref={canvasRef} style={{width:state.width,height:state.height}} width={state.canvasWidth} height={state.canvasHeight}></canvas>
})
export default Canvas