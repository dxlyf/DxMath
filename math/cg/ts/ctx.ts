import { FillRule, LineCap, LineJoin, Operator, PaintType } from "./paint";
import { ContextState } from "./context_state";
import { Matrix, Rect } from "./matrix";
import { Path } from "./path";
import { Rle } from "./rle";
import { Surface } from "./surface";
import { Color } from "./color";
import { TextureType } from "./texture";
import { Dash } from "./dash";
import { blend } from "./blend";
import { rasterize } from "./outline";




export class Context {
    static create(surface: Surface) {
        const ctx = new this()
        ctx.surface = surface
        ctx.state = ContextState.create()
        ctx.path = Path.create()
        ctx.rle = Rle.create()
        ctx._clippath = null
        ctx._clip.x = 0
        ctx._clip.y = 0
        ctx._clip.w = surface.width
        ctx._clip.h = surface.height
        ctx.outline_data = null
        ctx.outline_size = 0

        return ctx;
    }
    surface: Surface | null = null
    state: ContextState | null = null
    path: Path | null = null
    rle: Rle =  Rle.create()
    _clippath: Rle | null = null
    _clip: Rect = new Rect()
    outline_data: Int8Array|null=null
    outline_size: int = 0

    save() {
        const state = ContextState.create()
        state.copy(this.state!)
        state.next = this.state
        this.state = state
    }
    restore() {
        const state = this.state
        this.state = state?.next ?? null
        state?.destroy()
    }
    setSourceRGB(r: float64, g: float64, b: float64) {
        return this.setSourceRGBA(r, g, b, 1.0)
    }
    setSourceRGBA(r: float64, g: float64, b: float64, a: float64) {
        const paint = this.state!.paint
        paint.type = PaintType.COLOR
        paint.color.set(r, g, b, a)
        return paint.color
    }
    setSourceColor(color: Color) {
        return this.setSourceRGBA(color.r, color.g, color.b, color.a)
    }
    setSourceLinearGradient(x0: float64, y0: float64, x1: float64, y1: float64) {
        const paint = this.state!.paint
        paint.type = PaintType.GRADIENT
        paint.gradient.initLinear(x0, y0, x1, y1)
        return paint.gradient

    }
    setSourceRadialGradient(cx: float64, cy: float64, cr: float64, fx: float64, fy: float64, fr: float64) {
        const paint = this.state!.paint
        paint.type = PaintType.GRADIENT
        paint.gradient.initRadial(cx, cy, cr, fx, fy, fr)
        return paint.gradient
    }
    setTexture(surface: Surface, type: TextureType) {
        const paint = this.state!.paint
        paint.type = PaintType.TEXTURE
        paint.texture.init(surface, type)
        return paint.texture
    }
    setSourceSurface(surface: Surface, x: float64, y: float64) {
        const texture = this.setTexture(surface, TextureType.PLAIN)
        texture.matrix.fromTranslate(x, y)
        return texture
    }
    setOperator(op: Operator) {
        this.state!.op = op
        return this
    }
    setOpacity(opacity: float64) {
        this.state!.opacity = opacity
        return this
    }
    setFillRule(fill_rule: FillRule) {
        this.state!.winding = fill_rule
        return this;
    }
    setLineWidth(width: float64) {
        this.state!.stroke.width = width
        return this;
    }
    setLineCap(cap: LineCap) {
        this.state!.stroke.cap = cap
    }
    setLineJoin(join: LineJoin) {
        this.state!.stroke.join = join
    }
    setMiterLimit(limit: float64) {
        this.state!.stroke.miterlimit = limit
    }
    setDash(dashes: float64[], offset: float64) {
        this.state!.stroke.dash = Dash.create(dashes, offset)
    }
    translate(x: float64, y: float64) {
        this.state!.matrix.translate(x, y)
        return this;
    }
    scale(x: float64, y: float64) {
        this.state!.matrix.scale(x, y)
        return this;
    }
    rotate(angle: float64) {
        this.state!.matrix.rotate(angle)
        return this;
    }
    transform(m: Matrix) {
        this.state!.matrix.postMultiply(m)
        return this;
    }
    setMatrix(m: Matrix) {
        this.state!.matrix.copy(m)
        return this;
    }
    identityMatirx() {
        this.state!.matrix.identity()
        return this;
    }
    moveTo(x: float64, y: float64) {
        this.path!.moveTo(x, y)
        return this;
    }
    lineTo(x: float64, y: float64) {
        this.path!.lineTo(x, y)
        return this;
    }
    curveTo(x1: float64, y1: float64, x2: float64, y2: float64, x3: float64, y3: float64) {
        this.path!.curveTo(x1, y1, x2, y2, x3, y3)
        return this;
    }
    quadTo(x1: float64, y1: float64, x2: float64, y2: float64) {
        this.path!.quadTo(x1, y1, x2, y2)
        return this;
    }
    relMoveTo(dx: float64, dy: float64) {
        this.path!.relMoveTo(dx, dy)
        return this;
    }
    relLineTo(dx: float64, dy: float64) {
        this.path!.relLineTo(dx, dy)
        return this;
    }
    relCurveTo(dx1: float64, dy1: float64, dx2: float64, dy2: float64, dx3: float64, dy3: float64) {
        this.path!.relCurveTo(dx1, dy1, dx2, dy2, dx3, dy3)
        return this;
    }
    relQuadTo(dx1: float64, dy1: float64, dx2: float64, dy2: float64) {
        this.path!.relQuadTo(dx1, dy1, dx2, dy2)
        return this;
    }
    rectangle(x: float64, y: float64, w: float64, h: float64) {
        this.path!.addRectangle(x, y, w, h)
        return this;
    }
    roundRectangle(x: float64, y: float64, w: float64, h: float64, rx: float64, ry: float64) {
        this.path!.addRoundRectangle(x, y, w, h, rx, ry)
        return this;
    }
    ellipse(cx: float64, cy: float64, rx: float64, ry: float64) {
        this.path!.addEllipse(cx, cy, rx, ry)
        return this;
    }
    circle(cx: float64, cy: float64, r: float64) {
        this.path!.addEllipse(cx, cy, r, r)
        return this;
    }

    arc(cx: float64, cy: float64, r: float64, a0: float64, a1: float64, ccw: boolean = false) {
        this.path!.arc(cx, cy, r, a0, a1, ccw)
        return this;
    }
    newPath() {
        this.path!.clear()
        return this;
    }
    closePath() {
        this.path!.close()
        return this;
    }
    resetClip() {
        this._clippath = null
        return this;
    }
    clip() {

        this.newPath()
    }
    clipPreserve() {
        const state = this.state!
        if (state.clipath) {
            this.rle?.clear()
            rasterize(this,this.rle!, this.path!, state!.matrix, this._clip, null, state!.winding)
            state.clipath.clipPath(this.rle!)
        } else {
            state.clipath = Rle.create()
            rasterize(this,state.clipath, this.path!, state!.matrix, this._clip, null, state!.winding)
        }
    }
    blend(rle?: Rle | null) {
        if (rle && rle.spans.length > 0) {
            const source = this.state!.paint
            switch (source.type) {
                case PaintType.COLOR:
                    break
                case PaintType.GRADIENT:
                    break
                case PaintType.TEXTURE:
                    break


            }

        }
    }
    fill() {
        this.fillPreserve()
        this.newPath()
    }
    fillPreserve() {
        const state = this.state!
        this.rle.clear()
        rasterize(this,this.rle!, this.path!, state!.matrix, this._clip, null, state!.winding)
        this.rle.clipPath(state.clipath)
        blend(this,this.rle!)

    }
    stroke(){
        this.strokePreserve()
        this.newPath()
    }
    strokePreserve(){
        const state = this.state!
        this.rle.clear()
        rasterize(this,this.rle!, this.path!, state!.matrix, this._clip, state.stroke, FillRule.NON_ZERO)
        this.rle.clipPath(state.clipath)
        blend(this,this.rle!)
    }
    paint(){
        const state=this.state!;
        if(state.clipath!==null&&this._clippath!==null){
            const path=Path.create()
            const clip=this._clip
            path.addRectangle(clip.x,clip.y,clip.w,clip.h)
            const m=Matrix.identity()
            this._clippath=Rle.create()
            rasterize(this,this._clippath,path,m,clip,null,FillRule.NON_ZERO)
        }
        const rle=state.clipath?state.clipath:this._clippath
        rle&&blend(this,rle)
    }
}