import { Color } from "./color";
import { Gradient } from "./gradient";
import { Matrix } from "./matrix";
import { Surface } from "./surface";
import { Texture } from "./texture";
import { clamp } from "./util";








export enum LineCap{
    BUTT=0,
    ROUND=1,
    SQUARE=2
}

export enum LineJoin{
    MITER=0,
    ROUND=1,
    BEVEL=2
}

export enum FillRule{
    NON_ZERO=0,
    EVEN_ODD=1
}

export enum PaintType{
    COLOR=0,
    GRADIENT=1,
    TEXTURE=2
}

export enum Operator {
	SRC				= 0, /* r = s * ca + d * cia */
	SRC_OVER		= 1, /* r = (s + d * sia) * ca + d * cia */
	DST_IN			= 2, /* r = d * sa * ca + d * cia */
	DST_OUT			= 3, /* r = d * sia * ca + d * cia */
};


export class Paint{
    static default(){
        const paint= new Paint();
        return paint
    }
    type:PaintType=PaintType.COLOR;
    color:Color=Color.fromRGBA(0,0,0,1);
    gradient:Gradient=new Gradient();
    texture:Texture=new Texture();
    constructor(){
        this.init()
    }
    init(){
        this.type=PaintType.COLOR;
        this.texture.surface=null
        this.gradient.stops=[]
        this.color.set(0,0,0,1)

    }
    destroy(){
        this.texture.destory()
        this.gradient.destory()
    }
    clone(){
        const paint=new Paint()
        paint.copy(this)
        return paint
    }
    copy(source:Paint){
        this.type=source.type;
        if(this.type==PaintType.COLOR){
            this.color.copy(source.color)
        }else if(this.type==PaintType.GRADIENT){
            this.gradient.copy(source.gradient)
        }else{
            this.texture.copy(source.texture)
        }
    }
}