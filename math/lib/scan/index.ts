import {Blitter} from '../blitter'
import { ScreenIntRect } from '../geom';
import { Rect } from '../path/rect';
import * as hairline_aa from './hairline_aa'

export function fill_rect(rect:Rect,clip:ScreenIntRect,blitter:Blitter){
    let _rect=rect.round()
    fill_int_rect(_rect,clip,blitter)
}


function fill_int_rect(rect:Rect, clip: ScreenIntRect, blitter:Blitter) {

    rect=rect.intersect(clip.to_int_rect())
    if(!rect){
        return 
    }

    blitter.blit_rect(rect);
}

export function fill_rect_aa(rect:Rect, clip:ScreenIntRect, blitter:Blitter) {
    hairline_aa.fill_rect(rect, clip, blitter);
}
