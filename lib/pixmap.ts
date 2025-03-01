import {IntSize} from './path/size'
import {Path} from './path'
import { Rect } from './path/rect'
import { Num } from './number'

export const BYTES_PER_PIXEL=4
export class Pixmap {
    static from_vec(data:Uint8Array,size:IntSize){
         const pixmap=new Pixmap(size.width,size.height)
         pixmap.data=data
         return pixmap
    }
    data:Uint8Array
    size:IntSize=new IntSize(0,0)
    constructor(width:number,height:number){
        this.size=new IntSize(width,height)
        this.data=new Uint8Array(width*height*4)
    }
    as_ref(){
        const _PixmapRef=new PixmapRef()
        _PixmapRef.data=this.data
        _PixmapRef.size=this.size
        return _PixmapRef
    }
    as_mut(){
        const _PixmapMut=new PixmapMut()
        _PixmapMut.data=this.data
        _PixmapMut.size=this.size
        return _PixmapMut
    }
}
function min_row_bytes(size: IntSize) {
    let w =size.width
    w = w*BYTES_PER_PIXEL
    return w
}
function data_len_for_size(size: IntSize):Option<usize> {
    let row_bytes = min_row_bytes(size);
   return compute_data_len(size, row_bytes)
}
function compute_data_len(size: IntSize, row_bytes: usize): Option<usize> {
    let h = size.height-1
    h=h*row_bytes

    let w = size.width*BYTES_PER_PIXEL

    return h+w
}
export class PixmapRef{
    static from_bytes(data:Uint8Array,width:u32,height:u32):Option<PixmapRef>{
        let size = IntSize.from_wh(width, height);
        let data_len = data_len_for_size(size);
        if (data.length < data_len!) {
            return ;
        }
        let pixmapRef=new this()
        pixmapRef.data=data;
        pixmapRef.size=size
        return pixmapRef
    }
    data!:Uint8Array
    size!:IntSize
    constructor(){

    }
    get width(){
        return this.size.width
    }
    get height(){
        return this.size.height
    }
    get pixels(){
        return this.data
    }
    rect(){
        return this.size.to_screen_int_rect(0,0)
    }
    pixel(x:u32,y:u32){
        let idx=this.width*y+x
        return this.pixels[idx]
    }

}

export class PixmapMut{
    data!:Uint8Array
    size!:IntSize
    constructor(){

    }
    get width(){
        return this.size.width
    }
    get height(){
        return this.size.height
    }
    subpixmap(rect:Rect){
        const self=this;
         rect = self.size.to_int_rect(0, 0).intersect(rect);
        let row_bytes = self.width as usize * BYTES_PER_PIXEL;
        let offset = rect.top as usize * row_bytes + rect.left as usize * BYTES_PER_PIXEL;

        let _subPixmapMut=new SubPixmapMut()
        _subPixmapMut.size=rect.size()
        _subPixmapMut.real_width=this.width
        _subPixmapMut.data=self.data.slice(offset)
        return _subPixmapMut
    }
}


export class SubPixmapMut{
    data:Uint8Array=new Uint8Array()
    size:IntSize=IntSize.default()
    real_width:usize=0
    pixels_mut(){
        return this.data.slice()
    }
}