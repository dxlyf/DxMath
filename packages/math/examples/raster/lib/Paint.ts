import { LineCap, LineJoin } from "./Stroker"
export enum PaintStyle{
    FILL,
    STROKE,
    FILL_STROKE,
}
export class Paint{
    lineWidth:number=1
    lineJoin:LineJoin=LineJoin.MITER
    miterLimit:number=10
    lineCap:LineCap=LineCap.BUTT
    color:[number,number,number,number]=[0,0,0,255]
    paintStyle:PaintStyle=PaintStyle.FILL

    setLineWidth(width:number){
        this.lineWidth=width
        return this
    }
    setLineJoin(join:LineJoin){
        this.lineJoin=join
        return this
    }
    setMiterLimit(limit:number){
        this.miterLimit=limit
        return this
    }
    setLineCap(cap:LineCap){
        this.lineCap=cap
        return this
    }
    setColor(color:[number,number,number,number]){
        this.color=color
        return this
    }
    setPaintStyle(style:PaintStyle){
        this.paintStyle=style
        return this
    }
    toCanvas(ctx:CanvasRenderingContext2D){
        ctx.lineJoin=this.lineJoin
        ctx.lineCap=this.lineCap
        ctx.miterLimit=this.miterLimit
        ctx.lineWidth=this.lineWidth




    }
}