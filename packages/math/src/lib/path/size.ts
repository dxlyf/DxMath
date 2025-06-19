import { Rect } from "./rect"

export class IntSize {
    static from_wh_safe(width:i32,height:i32):IntSize{
        return new this(width,height)
    }
    static from_wh(width:i32,height:i32):IntSize{
        return new this(width,height)
    }

    static default(){
        return new this(0,0)
    }
    elements:Uint32Array=new Uint32Array(2)
    constructor( width: number,  height: number) {
        this.elements[0]=width
        this.elements[1]=height
    }
    get width() { return this.elements[0]}
    get height() { return this.elements[1]}

    to_int_rect(x:i32,y:i32){
        return Rect.from_xywh(x,y,this.width,this.height)
    }
    to_screen_int_rect(x:i32,y:i32){
        return Rect.from_xywh(x,y,this.width,this.height)
    }

}