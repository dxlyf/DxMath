
import PathKitInit from './pathkit.js'
import type {PathKit as PathKitLib} from './pathkit.js'

export const PathKit=await PathKitInit({
    locateFile(file){
        return import.meta.resolve('./'+file,import.meta.url)
    }
})

type SkPath= PathKitLib.SkPath
type StrokeOptions= PathKitLib.StrokeOpts
type FillType= PathKitLib.FillType

export const CANVAS_LINE_JOIN_MAP={
    'round':PathKit.StrokeJoin.ROUND,
    'bevel':PathKit.StrokeJoin.BEVEL,
    'miter':PathKit.StrokeJoin.MITER,
}
export const CANVAS_LINE_CAP_MAP={
    'round':PathKit.StrokeCap.ROUND,
    'butt':PathKit.StrokeCap.BUTT,
    'square':PathKit.StrokeCap.SQUARE,
}
export class SKPath2D{
    static fromSvgPath(svgPath:string){
        return new this(svgPath)
    }
    /**@type {import('./pathkit.d.ts').PathKit.SkPath} */
    _path:PathKitLib.SkPath
    constructor(path?:SKPath2D|string){

        if(path instanceof SKPath2D){
            this._path=PathKit.NewPath(path._path)
        }else if(typeof path==='string'){
            this._path=PathKit.FromSVGString(path)
        }else{
            this._path=PathKit.NewPath()
        }
    }
    addPath(...args:Parameters<PathKitLib.SkPath['addPath']>){
        this._path.addPath(...args)
        return this
    }
    clone(){
        let a=new SKPath2D()
        a._path=this._path.copy()
        return a
    }
    moveTo(x:number,y:number){
        this._path.moveTo(x,y)
    }
    lineTo(x:number,y:number){
        this._path.lineTo(x,y)
    }
    quadraticCurveTo(cp1x:number, cp1y:number, x:number, y:number){
        this._path.quadraticCurveTo(cp1x, cp1y, x, y);
    }
    bezierCurveTo(cp1x:number, cp1y:number, cp2x:number, cp2y:number, x:number, y:number){
        this._path.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
    }
    arc(x:number,y:number,radius:number,startAngle:number,endAngle:number,ccw=false){
        this._path.arc(x,y,radius,startAngle,endAngle,ccw)
    }
    ellipse(x:number, y:number, radiusX:number, radiusY:number, rotation:number, startAngle:number, endAngle:number, ccw=false){
        this._path.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, ccw)
        return this
    }
    conicTo(x1:number,y1:number,x:number,y:number,w:number){
        this._path.conicTo(x1,y1,x,y,w)
    }
    arcTo(x1:number, y1:number, x2:number, y2:number, radius:number){
        this._path.arcTo(x1, y1, x2, y2, radius)
    }
    dash(on:number,off:number,phase:number){
        this._path.dash(on,off,phase)
    }
    rect(x:number,y:number,w:number,h:number){
        this._path.rect(x,y,w,h)
    }
    roundRect(x:number, y:number, width:number, height:number, radius:number|number|{tl:number,tr:number,br:number,bl:number}) {
        let ctx = this;
        // 如果 radius 是数字，统一处理为四个角的半径
        if (typeof radius === 'number') {
            radius = { tl: radius, tr: radius, br: radius, bl: radius };
        } else {
            radius = Object.assign({ tl: 0, tr: 0, br: 0, bl: 0 }, radius);
        }

        // 起点为左上角，移动到起始位置
        ctx.moveTo(x + radius.tl, y);

        // 上边
        ctx.lineTo(x + width - radius.tr, y);
        ctx.arcTo(x + width, y, x + width, y + radius.tr, radius.tr);

        // 右边
        ctx.lineTo(x + width, y + height - radius.br);
        ctx.arcTo(x + width, y + height, x + width - radius.br, y + height, radius.br);

        // 下边
        ctx.lineTo(x + radius.bl, y + height);
        ctx.arcTo(x, y + height, x, y + height - radius.bl, radius.bl);

        // 左边
        ctx.lineTo(x, y + radius.tl);
        ctx.arcTo(x, y, x + radius.tl, y, radius.tl);

        ctx.closePath(); // 闭合路径
    }
    closePath(){
        this._path.closePath()
    }
    getFillTypeString(){
        return this._path.getFillTypeString()
    }
    getFillType(){
        return this._path.getFillType()
    }
    /**
     * 
     * @param {import('./pathkit.d.ts').PathKit.FillType} fillType 
     * @returns 
     */
    setFillType(fillType:FillType){
        
        return this._path.setFillType(fillType)
    }
    /**
     * 
     * @param {import('./pathkit.d.ts').StrokeOptions} opts 
     */
    stroke(opts:StrokeOptions){
        this._path.stroke(opts)
    
    }
    /**
     * 
     * @param {SKPath2D} otherPath 
     * @param {import('./pathkit.d.ts').PathKit.PathOp} operation 
     */
    op(otherPath:SKPath2D, operation:PathKitLib.PathOp){
        this._path.op(otherPath._path,operation)
        return this
    }
    contains(x:number,y:number){
        return this._path.contains(x,y)
    }
    simplify(){
        this._path.simplify()
        return this
    }
    transform(...args:any[]){
        this._path.transform(...args)
        return this
    }
    toPath2D(){
        return this._path.toPath2D()
    }
    toSVGString(){
        return this._path.toSVGString()
    }
    getBounds(){
        return this._path.getBounds()
    }
    computeTightBounds(){
        return this._path.computeTightBounds()
    }
    toCanvas(ctx:CanvasRenderingContext2D){
        return this._path.toCanvas(ctx)
    }
} 