import { Transform } from "../path";
import { PixmapRef } from "../pixmap";
import { SpreadMode } from "./gradient";
import {Shader} from './index.ts'

enum FilterQuality{
 /// Nearest-neighbor. Low quality, but fastest.
 Nearest,
 /// Bilinear.
 Bilinear,
 /// Bicubic. High quality, but slow.
 Bicubic,
}

export class Pattern{
    static new(pixmap:PixmapRef,spread_mode:SpreadMode,quality:FilterQuality,opacity:f32,transform:Transform){
        const pattern=new Pattern()
        pattern.pixmap=pixmap
        pattern.spread_mode=spread_mode
        pattern.quality=quality
        pattern.opacity=opacity
        pattern.transform=transform

        return Shader.createPattern(pattern)
    }
    pixmap!:PixmapRef
    quality:FilterQuality=FilterQuality.Nearest
    spread_mode:SpreadMode=SpreadMode.Pad
    opacity:number=1
    transform:Transform=Transform.default()
}