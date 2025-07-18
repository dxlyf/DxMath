
import { CanvasRenderer } from 'math/2d_graphics/renderer/canvas';

import { PathBuilder } from 'math/2d_graphics/math/path/PathBuilder';
import { SKPath2D } from 'math/skia_path/SKPath2D'
import { GUI } from 'lil-gui'
import {pointInPath} from  'math/2d_graphics/math/path/intersection';


abstract class TestBase {
    name: string = ''
    constructor(public parent: TestMain) {

    }
    abstract createGui(gui: GUI): void
    abstract draw(ctx: Path2D | PathBuilder): void
    abstract dispose(): void
    abstract buildNativePath(): Path2D
    abstract buildPathBuilder(): PathBuilder

}
class TestEllipse extends TestBase {
    name = 'ellipse'
    x = 100
    y = 100
    rx = 60
    ry = 60
    rotation = 0
    _startAngle = 0
    get startAngle() { return Math.floor(this._startAngle / Math.PI * 180) }
    set startAngle(v) { this._startAngle = v / 180 * Math.PI }
    _endAngle = Math.PI * 2
    get endAngle() { return Math.floor(this._endAngle / Math.PI * 180) }
    set endAngle(v) { this._endAngle = v / 180 * Math.PI }
    ccw = false
    onChange = () => {
        this.parent.refresh()
    }
    createGui(gui: GUI): void {
        gui.add(this, 'x').onChange(this.onChange)
        gui.add(this, 'y').onChange(this.onChange)
        gui.add(this, 'rx').onChange(this.onChange)
        gui.add(this, 'ry').onChange(this.onChange)
        gui.add(this, 'rotation').onChange(this.onChange)
        gui.add(this, 'startAngle', -360, 360).onChange(this.onChange)
        gui.add(this, 'endAngle', -360, 360).onChange(this.onChange)
        gui.add(this, 'ccw').onChange(this.onChange)
    }
    draw(ctx: Path2D | PathBuilder) {

        ctx.ellipse(this.x, this.y, this.rx, this.ry, this.rotation / 180 * Math.PI, this._startAngle, this._endAngle, this.ccw)
        return ctx
    }
    buildNativePath() {
        const path = new Path2D()

        this.draw(path)
        return path
    }
    buildPathBuilder() {
        const path = new PathBuilder()

        this.draw(path)
        return path
    }
    dispose(): void {

    }

}
class TestEllipseArc extends TestBase {
    name = 'ellipseArc'
    x0 = 100
    y0 = 100
    rx = 60
    ry = 60
    xRotation = 0
    largeArcflag = false
    sweepFlag = false
    x1 = 200
    y1 = 100
    onChange = () => {
        this.parent.refresh()
    }
    createGui(gui: GUI): void {
        gui.add(this, 'x0').onChange(this.onChange)
        gui.add(this, 'y0').onChange(this.onChange)
        gui.add(this, 'rx').onChange(this.onChange)
        gui.add(this, 'ry').onChange(this.onChange)
        gui.add(this, 'largeArcflag').onChange(this.onChange)
        gui.add(this, 'sweepFlag').onChange(this.onChange)
        gui.add(this, 'xRotation').onChange(this.onChange)
        gui.add(this, 'x1').onChange(this.onChange)
        gui.add(this, 'y1').onChange(this.onChange)
    }
    draw(ctx: Path2D | PathBuilder) {


        return ctx
    }
    getSvgPath() {
        //A rx ry x-axis-rotation large-arc-flag sweep-flag x y
        return `M${this.x0} ${this.y0} A ${this.rx},${this.ry},${this.xRotation},${Number(this.largeArcflag)},${Number(this.sweepFlag)},${this.x1},${this.y1}`
    }
    buildNativePath() {
        const path = new Path2D(this.getSvgPath())
        return path
    }
    buildPathBuilder() {
        const path = new PathBuilder()

        path.ellipseArc(this.x0, this.y0, this.x1, this.y1, this.rx, this.ry, this.xRotation / 180 * Math.PI, this.largeArcflag, this.sweepFlag)

        return path
    }
    dispose(): void {

    }

}


class TestArc extends TestBase {
    name = 'arc'
    x = 200
    y = 200
    r = 100
    _startAngle = 0
    get startAngle() { return Math.floor(this._startAngle / Math.PI * 180) }
    set startAngle(v) { this._startAngle = v / 180 * Math.PI }
    _endAngle = Math.PI * 2
    get endAngle() { return Math.floor(this._endAngle / Math.PI * 180) }
    set endAngle(v) { this._endAngle = v / 180 * Math.PI }
    ccw = false
    onChange = () => {
        this.parent.refresh()
    }
    createGui(gui: GUI): void {
        gui.add(this, 'x').onChange(this.onChange)
        gui.add(this, 'y').onChange(this.onChange)
        gui.add(this, 'r').onChange(this.onChange)
        gui.add(this, 'startAngle', -360, 360).onChange(this.onChange)
        gui.add(this, 'endAngle', -360, 360).onChange(this.onChange)
        gui.add(this, 'ccw').onChange(this.onChange)
    }
    draw(ctx: Path2D | PathBuilder) {

        ctx.arc(this.x, this.y, this.r, this._startAngle, this._endAngle, this.ccw)
        return ctx
    }
    buildNativePath() {
        const path = new Path2D()

        this.draw(path)
        return path
    }
    buildPathBuilder() {
        const path = new PathBuilder()

        this.draw(path)
        return path
    }
    dispose(): void {

    }

}


class TestArcTo extends TestBase {
    name = 'arcTo'
    x = 100
    y = 200
    x0 = 200
    y0 = 200
    x1 = 200
    y1 = 300
    r = 50
    onChange = () => {
        this.parent.refresh()
    }
    createGui(gui: GUI): void {
        gui.add(this, 'x').onChange(this.onChange)
        gui.add(this, 'y').onChange(this.onChange)

        gui.add(this, 'x0').onChange(this.onChange)
        gui.add(this, 'y0').onChange(this.onChange)
        gui.add(this, 'x1').onChange(this.onChange)
        gui.add(this, 'y1').onChange(this.onChange)
        gui.add(this, 'r').onChange(this.onChange)

    }
    draw(ctx: Path2D | PathBuilder) {

        ctx.moveTo(this.x, this.y)
        ctx.lineTo(this.x0, this.y0)
        ctx.lineTo(this.x1, this.y1)

        ctx.moveTo(this.x, this.y)
        ctx.arcTo(this.x0, this.y0, this.x1, this.y1, this.r)

        return ctx
    }
    buildNativePath() {
        const path = new Path2D()

        this.draw(path)
        return path
    }
    buildPathBuilder() {
        const path = new PathBuilder()

        this.draw(path)
        return path
    }
    dispose(): void {

    }

}

class TestRoundRect extends TestBase {
    name = 'roundRect'
    x = 100
    y = 200
    w = 200
    h = 200
    x1 = 200
    y1 = 300
    //tl: number, tr: number, br: number, bl: number 
    tl=0
    tr=0
    br=0
    bl=0
    r=0
    useR=false
    onChange = () => {
        this.parent.refresh()
    }
    createGui(gui: GUI): void {
        gui.add(this, 'x').onChange(this.onChange)
        gui.add(this, 'y').onChange(this.onChange)

        gui.add(this, 'w').onChange(this.onChange)
        gui.add(this, 'h').onChange(this.onChange)
        gui.add(this, 'r').onChange(this.onChange)
        gui.add(this, 'useR').onChange(this.onChange)
        gui.add(this, 'tl').onChange(this.onChange)
        gui.add(this, 'tr').onChange(this.onChange)
        gui.add(this, 'br').onChange(this.onChange)
        gui.add(this, 'bl').onChange(this.onChange)
    }
    draw(ctx: Path2D | PathBuilder) {

        ctx.roundRect(this.x, this.y, this.w, this.h, this.useR?this.r:[this.tl,this.tr,this.br,this.bl])

        return ctx
    }
    buildNativePath() {
        const path = new Path2D()

        this.draw(path)
        return path
    }
    buildPathBuilder() {
        const path = new PathBuilder()

        this.draw(path)
        return path
    }
    dispose(): void {

    }

}
export class TestMain {
    static examples: any[] = [TestEllipse, TestEllipseArc, TestArc, TestArcTo,TestRoundRect]
    examples = new Map<string, TestBase>()
    renderer!: CanvasRenderer
    gui!: GUI
    _example = ''

    curGui: GUI | null = null
    _dirty = false
    constructor() {
        const renderer = new CanvasRenderer({ width: 500, height: 500, devicePixelRatio: 1 });
        document.body.appendChild(renderer.domElement)
        this.renderer = renderer
        const gui = new GUI()
        renderer.domElement.addEventListener('pointerdown',e=>{
            let path=this.curExample?.buildPathBuilder()
            if(path){
                const x=e.offsetX
                const y=e.offsetY
               // console.log('命中11')
                if(pointInPath(x,y,path,{fillRule:1})){
                    console.log('命中')
                }

            }
        })
        this.gui = gui
        TestMain.examples.forEach(Type => {
            let d = new Type(this)
            this.examples.set(d.name, d)
        })

        this.gui.add(this, 'example', [...this.examples.keys()])
        this.gui.add(this, 'showPathBuilder').onChange(() => {
            this.refresh()
        })
        this.gui.add(this, 'showPathBounds').onChange(() => {
            this.refresh()
        })
        if (this.examples.size) {
            this.example = Array.from(this.examples.keys())[0]
            this.gui.controllers[0].updateDisplay()
        }
        
        this.startLoop()
    }
    set example(v) {
        if (this._example !== v) {
            this.initExample(v)
            this._example = v;
        }

    }
    get example() { return this._example }
    get curExample() {
        return this.examples.get(this._example)
    }
    showPathBuilder = true
    showPathBounds=false

    initExample(newExampleID: string) {
        if (newExampleID === this._example) return

        let prevExample = this.examples.get(this._example)
        if (prevExample) {
            prevExample.dispose()
        }
        let example = this.examples.get(newExampleID)!
        if (this.curGui) {
            this.curGui.destroy()
        }
        const curGui = this.curGui = this.gui.addFolder(example.name)
        example.createGui(curGui)
        this.refresh()

    }
    refresh() {
        this._dirty = true
    }
    loop = () => {
        if (this._dirty) {
            this._dirty = false
            this.draw()
        }
        requestAnimationFrame(this.loop)
    }
    startLoop = () => {
        requestAnimationFrame(this.loop)

    }
    draw() {
        const ctx = this.renderer.ctx

        ctx.clearRect(0, 0, this.renderer.pixelWidth, this.renderer.pixelHeight)
        ctx.save()
        ctx.scale(this.renderer.devicePixelRatio, this.renderer.devicePixelRatio)
        if (this.curExample) {
            ctx.beginPath()

            ctx.stroke(this.curExample.buildNativePath())

            if (this.showPathBuilder) {
                ctx.beginPath()
                ctx.strokeStyle = 'red'
                let path=this.curExample.buildPathBuilder()
                ctx.stroke(path.toPath2D())

                if(this.showPathBounds){
                    const bounds=path.computeTightBounds()
                    ctx.beginPath()
                    ctx.strokeStyle = 'green'
                    ctx.beginPath()
                    ctx.rect(bounds.x,bounds.y,bounds.width,bounds.height)
                    ctx.stroke()
                }
            }
        }
        ctx.restore()
    }
};
