import { isNumber } from "../../utils/lang";
import { BaseRenderer,BaseRendererOptions } from "../../base/renderer";


export interface CanvasRendererOptions extends BaseRendererOptions{
    canvas?: HTMLCanvasElement; // 可选的画布参数
}
export class CanvasRenderer implements BaseRenderer {
    domElement: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    options: CanvasRendererOptions;
    constructor(options?:CanvasRendererOptions) {
        const newOpts=this.options = {devicePixelRatio:window.devicePixelRatio,...options};
        this.domElement = newOpts.canvas || document.createElement('canvas');
        this.ctx = this.domElement.getContext('2d')!;
        if(isNumber(newOpts.width)&& isNumber(newOpts.height)){ 
            this.setSize(newOpts.width!, newOpts.height!);
        }
    }
    get pixelWidth(){
        return this.domElement.width
    }
    get pixelHeight(){
        return this.domElement.height
    }
    get width(){
        return this.options.width!;
    }
    set width(width: number) {
        this.options.width = width;
    }
    get height(){
        return this.options.height!;
    }
    set height(height: number) {
        this.options.height = height;
    }
    get devicePixelRatio(){
        return this.options.devicePixelRatio!;
    }
    set devicePixelRatio(dpr: number) {
        this.options.devicePixelRatio = dpr;
        this.setSize(this.width, this.height, false);
    }
    setPixelRatio(dpr: number) {
        this.devicePixelRatio = dpr;
        this.setSize(this.width, this.height, false);
    }
    setSize(width: number, height: number,updateStyle=true): void {
        this.width = width;
        this.height = height;
        this.domElement.width = Math.floor(width * this.devicePixelRatio);
        this.domElement.height = Math.floor(height * this.devicePixelRatio);
        if(updateStyle){
            this.domElement.style.width = `${width}px`;
            this.domElement.style.height = `${height}px`;
        }
    }
}