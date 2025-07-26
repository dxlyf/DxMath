

export class WebGL2Renderer{
    gl:WebGL2RenderingContext;
    constructor(canvas:HTMLCanvasElement){
        this.gl=canvas.getContext('webgl2')!;
    }
}