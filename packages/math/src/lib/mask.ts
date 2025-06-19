import { IntSize } from "./path"
import { Rect } from "./path/rect"
import { PixmapRef, SubPixmapMut } from "./pixmap"
export enum MaskType {
    /// Transfers only the Alpha channel from `Pixmap` to `Mask`.
    Alpha,
    /// Transfers RGB channels as luminance from `Pixmap` to `Mask`.
    ///
    /// Formula: `Y = 0.2126 * R + 0.7152 * G + 0.0722 * B`
    Luminance,
}
export class Mask{
    static new(width:number,height:number){
        let size=IntSize.from_wh(width,height)
        
        const mask=new this()
        mask.size=size
        mask.data=new Uint8Array(width*height)
        return mask
    }
    static from_pixmap(pixmap:PixmapRef,mask_type:MaskType){
        let data_len = pixmap.width as usize * pixmap.height as usize;
        let mask=new this()
        mask.data=new Uint8Array(data_len)
        mask.size=pixmap.size

        return mask
    }
    data!:Uint8Array
    size:IntSize=IntSize.default()
    get width(){
        return this.size.width
    }
    get height(){
        return this.size.height
    }
    submask(rect:Rect){
         rect=this.size.to_int_rect(0,0).intersect(rect)
         let row_bytes=this.width
         let offset=rect.top*row_bytes+rect.left
         let mask=new SubMaskRef()
        mask.data=this.data.slice(offset)
        mask.real_width=this.size.width
        mask.size=rect.size()
         return mask;
    }
    as_subpixmap(){
        const _sub=new SubPixmapMut()
        _sub.size=this.size
        _sub.real_width=this.size.width
        _sub.data=this.data
        return _sub
    }
}
export class SubMaskRef{
    data!:Uint8Array
    size!:IntSize
    real_width!:u32
    mask_ctx(){
        return 
    }
}