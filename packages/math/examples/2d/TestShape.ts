
import { CanvasRenderer } from 'math/2d_graphics/renderer/canvas';


import { GUI } from 'lil-gui'

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

export class TestMain {
    static examples: any[] = []
    examples = new Map<string, TestBase>()
    renderer!: CanvasRenderer
    gui!: GUI
    _example = ''

    curGui: GUI | null = null
    _dirty = false
  
    constructor() {
        const renderer = new CanvasRenderer({ width: 500, height: 500, devicePixelRatio: window.devicePixelRatio });
        document.body.appendChild(renderer.domElement)
        this.renderer = renderer
        const gui = new GUI()
        renderer.domElement.addEventListener('pointerdown',e=>{
            let path=this.curExample?.buildPathBuilder()
            if(path){
                const x=e.offsetX
                const y=e.offsetY


            }
        })
        this.gui = gui
        TestMain.examples.forEach(Type => {
            let d = new Type(this)
            this.examples.set(d.name, d)
        })

        this.gui.add(this, 'example', [...this.examples.keys()])
  
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
     
    }
};
