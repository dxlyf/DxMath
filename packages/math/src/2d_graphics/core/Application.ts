import { RenderMode, BaseRenderer,BaseRendererOptions } from '../base/Renderer'
import { CanvasRenderer } from '../renderer/canvas'
export type ApplicationOptions={
    renderMode?: RenderMode;
}&BaseRendererOptions
export interface IApplication {
    renderer: BaseRenderer
}

export class Application implements IApplication {
    options:Partial<ApplicationOptions>={};
    renderer!: BaseRenderer
    constructor(options: ApplicationOptions) {
        this.options={...(options??{})}
        this.setupRenderer(this.options)
    }
    setupRenderer(options: ApplicationOptions): void {
        if(options.renderMode===RenderMode.Canvas){
            this.renderer=new CanvasRenderer(options)
        }else{
            throw new Error("暂不支持的渲染模式")
        }
    }
    add() {

    }
}