export abstract class Layer {
    // 图层抽象类，用于不同的图层实现
    private renderer: Renderer; // 渲染器，用于渲染图层
    constructor(renderer: Renderer) { // 构造函数，传入渲染器
        this.renderer = renderer; // 初始化渲染器
    }
    abstract render(): void;
}