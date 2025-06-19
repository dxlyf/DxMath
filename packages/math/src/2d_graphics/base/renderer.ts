
export type IRendererOptions={
    width:number, // 画布宽度
    height:number,// 画布高度
    devicePixelRatio?:number,// 设备像素比
    canvas?:HTMLCanvasElement|OffscreenCanvas,
}
// 渲染抽象类，用于不同的渲染器实现
export interface IRenderer {
  

}