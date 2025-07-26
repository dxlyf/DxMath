import { Matrix2dLike } from "../math/Matrix2d";
import { isNumber } from "../utils/lang";
import { Paint } from "./Paint";

export enum RenderMode{
    None,
    Canvas,
    WebGL
}
export type BaseRendererOptions={
    canvas?:HTMLCanvasElement;
    width?:number, // 画布宽度
    height?:number,// 画布高度
    devicePixelRatio?:number,// 设备像素比

}
// 渲染抽象类，用于不同的渲染器实现
export interface IRenderer {
   renderMode:RenderMode;
   drawCircle(x:number,y:number,radius:number,ccw:boolean):void;
   drawRect(x:number,y:number,width:number,height:number):void;
}

export abstract class BaseRenderer<RenderingContext=CanvasRenderingContext2D,Opts extends BaseRendererOptions=BaseRendererOptions> implements IRenderer {
    renderMode:RenderMode=RenderMode.None;
    canvas:HTMLCanvasElement;
    ctx:RenderingContext;
    width:number=0;
    height:number=0;
    devicePixelRatio=1
    constructor(options:Opts){
        this.canvas = options.canvas || document.createElement('canvas');
        this.ctx = this.createRenderContext(this.canvas)
        if(isNumber(options.width)&& isNumber(options.height)){ 
            this.setSize(options.width!, options.height!);
        }   
        this.initialize(options)
    }
    get pixelWidth(){
        return this.canvas.width
    }
    get pixelHeight(){
        return this.canvas.height
    }
    initialize(options:Opts){
     
    }
    // 创建渲染上下文环境
    abstract createRenderContext(canvas:HTMLCanvasElement):RenderingContext
    
    setPixelRatio(dpr: number) {
        this.devicePixelRatio = dpr;
        this.setSize(this.width, this.height, false);
    }
    setSize(width: number, height: number,updateStyle=true){
        this.width = width;
        this.height = height;
        this.canvas.width = Math.floor(width * this.devicePixelRatio);
        this.canvas.height = Math.floor(height * this.devicePixelRatio);
        if(updateStyle){
            this.canvas.style.width = `${width}px`;
            this.canvas.style.height = `${height}px`;
        }
    }
    dispose(){

    }
    abstract clear():void;
    abstract save():void;
    abstract restore():void;
    abstract transform(matrix:Matrix2dLike):void
    abstract drawPaint(paint:Paint):void
    abstract drawCircle(x:number,y:number,radius:number,ccw:boolean):void;
    abstract drawRect(x:number,y:number,width:number,height:number):void;
}