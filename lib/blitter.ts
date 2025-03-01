import { BlendMode } from "./blend_mode";
import { PremultipliedColorU8 } from "./color";
import { Mask, SubMaskRef } from "./mask";
import { Paint } from "./painter";
import { Rect } from "./path/rect";
import { RasterPipeline } from "./pipeline";
import { PixmapRef, SubPixmapMut } from "./pixmap";

export interface Blitter{
    blit_h(x:u32,y:u32,width:u32):void
    blit_anti_h(x:u32,y:u32,_antialias:AlphaU8[],_runs:number[]):void
     blit_v(_x: u32, _y: u32, _height: u32, _alpha: AlphaU8):void

     blit_anti_h2( _x: u32, _y: u32, _alpha0: AlphaU8, _alpha1: AlphaU8):void

     blit_anti_v2( _x: u32, _y: u32, _alpha0: AlphaU8, _alpha1: AlphaU8):void

    /// Blits a solid rectangle one or more pixels wide.
     blit_rect(_rect: Rect):void

    /// Blits a pattern of pixels defined by a rectangle-clipped mask.
     blit_mask( _mask: Mask, _clip:Rect):void
}
