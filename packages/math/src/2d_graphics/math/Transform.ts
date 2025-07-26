import {Vector2Like,Vector2Point,Vector2} from './Vector2'
import {Matrix2D} from './Matrix2d'
export class ObservablePoint extends Float32Array{
    static create(x:number,y:number){
        return new this(x,y)
    }

    constructor(x:number,y:number){
        super(2)
        this[0]=x;
        this[1]=y
    }
    get x(){
        return this[0]
    }
    get y(){
        return this[1]
    }
    set x(x:number){
        this[0]=x
        this._change(this)
    }
    set y(y:number){
        this[1]=y
        this._change(this)
    }
    _change(p:ObservablePoint){
    }
    onChange(callback:(p:ObservablePoint)=>void){
        this._change=callback
    }
    copy(o:Vector2Like){
        this[0]=o[0]
        this[1]=o[1]
        this._change(this)
    }
    setXY(x:number,y:number){
        this[0]=x
        this[1]=y
        this._change(this)
    }
}
export interface TransformProps{
    position:Vector2Point,
    rotation:number,
    scale:Vector2Point,
    origin:Vector2Point,
    pivot:Vector2Point,
    skew:Vector2Point
}
export interface ITransform{
    skew:ObservablePoint
    scale:ObservablePoint
    origin:ObservablePoint
    pivot:ObservablePoint
    rotation:number
    matrix:Matrix2D
    updateMatrix():void
}
export class Transform<Props extends TransformProps=TransformProps> implements ITransform{
    position=ObservablePoint.create(0,0)
    _rotation=0
    skew=ObservablePoint.create(0,0)
    scale=ObservablePoint.create(1,1)
    origin=ObservablePoint.create(0,0)
    pivot=ObservablePoint.create(0,0)
    _matrix=Matrix2D.default() // 本地矩阵
    _matrixWorld=Matrix2D.default() // 世界矩阵
    dirty=true
    constructor(props?:Partial<Props>){
        this.setOptions(props)
        this.position.onChange(this.onUpdate)
        this.scale.onChange(this.onUpdate)
        this.origin.onChange(this.onUpdate)
        this.pivot.onChange(this.onUpdate)
        this.skew.onChange(this.onUpdate)
    }
    get rotation(){
        return this._rotation
    }
    set rotation(rotation:number){
        this._rotation=rotation
        this.onUpdate()
    }
    get angle(){
        return this._rotation/Math.PI*180
    }
    set angle(angle:number){
        this._rotation=angle/180*Math.PI
    }
    get matrix(){
        if(this.dirty){
           this.updateMatrix() 
        }
        return this._matrix
    }
    setOptions(options?:Partial<Props>){
        if(!options){
            return
        }
        if(options.position){
            this.position.setXY(options.position.x,options.position.y)
        }
        if(options.rotation!==undefined){
            this.rotation=options.rotation
        }
        if(options.scale){
            this.scale.setXY(options.scale.x,options.scale.y)
        }
        if(options.origin){
            this.origin.setXY(options.origin.x,options.origin.y)
        }
        if(options.pivot){
            this.origin.setXY(options.pivot.x,options.pivot.y)
        }
        if(options.skew){
            this.origin.setXY(options.skew.x,options.skew.y)
        }
    }
    updateMatrix(){
        this.dirty=false
        this.matrix.makeTranslationSkewRotationScaleOriginPivot(this.position,this.skew,this._rotation,this.scale,this.origin,this.pivot)
    }
    onUpdate = (p?:ObservablePoint) => {

        this.dirty=true
    }
  

}