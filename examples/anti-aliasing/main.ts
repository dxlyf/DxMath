
import { Matrix2D } from 'math/math/mat2d'
import {useResize,use} from 'math/hooks'
const canvas = document.getElementById('canvas') as HTMLCanvasElement;





class PixelRender {
    ctx: CanvasRenderingContext2D;
    matrix: Matrix2D = Matrix2D.default();
    _viewport={
        x:0,
        y:0,
        width: 0,
        height: 0,
    }
    viewportMatirx: Matrix2D = Matrix2D.default();
    needRendered = false;
    rendering = false;
    started = false;
    offset={
        x:0,
        y:0
    }
    scale = 1000
    dpr: number = window.devicePixelRatio || 1;
    width: number = 500;
    height: number = 500;
    constructor(public canvas: HTMLCanvasElement) {
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.initEvents()
    }
    initEvents() {

        const canvas = this.canvas
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        })

        const handlePointer = (event: PointerEvent | WheelEvent) => {
            let e = event as PointerEvent
            const type = e.type

            if (type === 'wheel') {
                const ew = (event as WheelEvent)
                const scale = -(ew.deltaY * 0.01)

                this.zoom(this.scale + scale)
                return false;
            }

        }
        const pointerEvents = ['wheel', 'pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'pointerout', 'pointerover'] as const;

        pointerEvents.forEach(eventType => {
            canvas.removeEventListener(eventType, handlePointer, false);
            canvas.addEventListener(eventType, handlePointer, false)
        });

    }
    start() {
        if (this.started) {
            return
        }
        this.refresh()
        let start = performance.now()
        const animation = (time: number) => {
            let delta = time - start
            start = time
            this.onAnimation(delta)
            requestAnimationFrame(animation)
        }
        requestAnimationFrame(animation)
    }
    onAnimation = (delta: number) => {
        if (this.needRendered) {
            this.render()
            this.needRendered = false
        }
    }
    zoom(scale: number) {
        this.scale = Math.min(100)
        this.refresh()
    }
    setDpr(dpr: number) {
        this.dpr = dpr
        this.setSize(this.width, this.height, false)
    }
    setSize(width: number, height: number, updateStyle = true) {

        this.width = width;
        this.height = height;
        this.canvas.width =Math.floor(width * this.dpr) | 0;
        this.canvas.height = Math.floor(height * this.dpr) | 0;
        if (updateStyle) {
            this.canvas.style.width = width + 'px';
            this.canvas.style.height = height + 'px';
        }
        if(this._viewport.width===0||this._viewport.height===0){
            this._viewport.width=this.width
            this._viewport.height=this.height
        }
        this.updateViewport()
        this.refresh()

    }
    viewport(x: number, y: number, width: number, height: number) {
        this._viewport.x=x
        this._viewport.y=y
        this._viewport.width=width
        this._viewport.height=height
        this.updateViewport()
    }
    updateViewport(){
        const {x,y,width,height}=this._viewport
        this.viewportMatirx.set(
            width/this.width,
            0,
            0,
            height/this.height,
            x,y
        )

    }
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }
    render() {
        this.clear()
        const ctx = this.ctx
        ctx.save()
        ctx.scale(this.dpr, this.dpr)
        ctx.transform(this.viewportMatirx.a, this.viewportMatirx.b, this.viewportMatirx.c, this.viewportMatirx.d, this.viewportMatirx.e, this.viewportMatirx.f)
        ctx.fillStyle = '#efefef'
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
        const scale = this.scale

        const width = this.canvas.width
        const height = this.canvas.height
        const pixelWidth = scale
    
        //this.drawRect(this._viewport.x,this._viewport.y,this._viewport.width,this._viewport.height)
     
        this.drawGrid()
        this.drawAxes()
   

        ctx.restore()
    }
    drawRect(x:number,y:number,width:number,height:number){
        this.ctx.beginPath()
        this.ctx.strokeStyle='#0000ff'
        this.ctx.lineWidth=1
        this.ctx.rect(x,y,width,height)
        this.ctx.stroke()
    }
    get SpaceSize(){
        const scale=this.scale
        if(scale<=100){
            return 64;
        }
    }
    drawAxes(){
        const ctx=this.ctx
      
    }
    // 绘制笛卡尔网格线
    drawCartesianGrid(){

    }
    logicToScreen(x:number,y:number){
        return {
            x:(x+this.width*0.5)+this.offset.x,
            y:(this.height*0.5-y)+this.offset.y,
           // y:this.matrix.transformY(x,y)
        }
    }
    screenToLogic(x:number,y:number){
        return {
            x:x-this.width*0.5+this.offset.x,
            y:y-this.height*0.5-this.offset.y,
        }
    }
    refresh() {
        this.needRendered = true
    }
    dispose(){

    }
}
const renderer=new PixelRender(canvas)

const stop=use(()=>{
    const state=useResize()
    return ()=>{
        renderer.setSize(state.width,state.height)
    }
})

renderer.start()