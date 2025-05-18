
export type RenderOptions={
    width:number, // 画布宽度
    height:number,// 画布高度
    devicePixelRatio?:number,// 设备像素比
    canvas?:HTMLCanvasElement|OffscreenCanvas,
}
// 渲染抽象类，用于不同的渲染器实现
export abstract class Renderer {
  
    constructor(public options:RenderOptions){
        this.beforeInitialize();
    }
    abstract beforeInitialize(): void;
    abstract initialize(): void;
    abstract render(): void;
    
}