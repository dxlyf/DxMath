export interface RendererContext {
    // 渲染上下文
}
// 渲染抽象类，用于不同的渲染器实现
export abstract class Renderer<RenderContext> {
    createRenderContext():RenderContext;
    render(): void;
}