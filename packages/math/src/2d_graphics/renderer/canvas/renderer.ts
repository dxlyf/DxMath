import { IRenderer } from "../../base/renderer";


export class CanvasRenderer  implements IRenderer{
     canvas!: HTMLCanvasElement;
     ctx!:CanvasRenderingContext2D
     constructor(){
        
     }
    setSize(width: number, height: number): this {
        this.canvas.width=width
        this.canvas.height=height
        this.canvas.style.width=`${width}px`
        this.canvas.style.height=`${height}px`
        return this;
    }
}