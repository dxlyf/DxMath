import { Rect } from "../path/rect"
import {fdot16, FDot8, fdot8} from '../fixed_point'
import { Blitter } from "../blitter";
import { LineCap, Path } from "../path";
import { ScreenIntRect } from "../geom";

type AlphaU8 = u8;

export class FixedRect{
    static from_rect(src:Rect){
         const f=new this()
        f.left=fdot16.from_f32(src.left)
        f.top=fdot16.from_f32(src.top)
        f.right=fdot16.from_f32(src.right)
        f.bottom=fdot16.from_f32(src.bottom)
         return f
    }
    left:FDot16=0
    top:FDot16=0
    right:FDot16=0
    bottom:FDot16=0
    copy(source:FixedRect){
        
    }
}

function alpha_mul(value: AlphaU8, alpha256: i32):u8 {
    let a = ((value>>0) * alpha256) >> 8;

    return  a as u8
}
export function fill_rect(rect: Rect, clip: Rect, blitter:Blitter) {
     rect =  rect.intersect(clip)
    let fr = FixedRect.from_rect(rect);
    fill_fixed_rect(fr, blitter);
}

function fill_fixed_rect(rect: FixedRect, blitter:Blitter) {
    fill_dot8(
        fdot8.from_fdot16(rect.left),
        fdot8.from_fdot16(rect.top),
        fdot8.from_fdot16(rect.right),
        fdot8.from_fdot16(rect.bottom),
        true,
        blitter,
    )
}
const LENGTH_U32_ONE: number = 1; // Simulate LengthU32::new(1)

function fill_dot8(l: FDot8, t: FDot8, r: FDot8, b: FDot8, fill_inner: boolean, blitter: Blitter): void {
    function to_alpha(a: number): AlphaU8 {
        if (a < 0 || a > 255) {
            throw new Error("Alpha value out of range");
        }
        return a;
    }

    // Check for empty now that we're in our reduced precision space
    if (l >= r || t >= b) {
        return;
    }

    let top = t >> 8;
    if (top === ((b - 1) >> 8)) {
        // Just one scanline high
        do_scanline(l, top, r, to_alpha(b - t - 1), blitter);
        return;
    }

    if ((t & 0xFF) !== 0) {
        do_scanline(l, top, r, to_alpha(256 - (t & 0xFF)), blitter);
        top += 1;
    }

    const bottom = b >> 8;
    const height = bottom - top;
    if (height > 0) {
        let left = l >> 8;
        if (left === ((r - 1) >> 8)) {
            // Just 1-pixel wide
            if (left >= 0 && top >= 0) {
                blitter.blit_v(left, top, height, to_alpha(r - l - 1));
            } else {
                throw new Error("Invalid coordinates");
            }
        } else {
            if ((l & 0xFF) !== 0) {
                if (left >= 0 && top >= 0) {
                    blitter.blit_v(left, top, height, to_alpha(256 - (l & 0xFF)));
                } else {
                    throw new Error("Invalid coordinates");
                }
                left += 1;
            }

            const right = r >> 8;
            const width = right - left;
            if (fill_inner && width > 0) {
                if (left >= 0 && top >= 0) {
                    const rect =Rect.from_xywh(
                        left,
                        top,
                        width,
                        height,
                    );
                    blitter.blit_rect(rect);
                } else {
                    throw new Error("Invalid coordinates");
                }
            }

            if ((r & 0xFF) !== 0) {
                if (right >= 0 && top >= 0) {
                    blitter.blit_v(right, top, height, to_alpha(r & 0xFF));
                } else {
                    throw new Error("Invalid coordinates");
                }
            }
        }
    }

    if ((b & 0xFF) !== 0) {
        do_scanline(l, bottom, r, to_alpha(b & 0xFF), blitter);
    }
}

function do_scanline(l: FDot8, top: number, r: FDot8, alpha: AlphaU8, blitter: Blitter): void {
    if (l >= r) {
        throw new Error("Invalid scanline range");
    }

    const one_len = LENGTH_U32_ONE;
    if (top < 0) {
        return; // Invalid top coordinate
    }

    if ((l >> 8) === ((r - 1) >> 8)) {
        // 1x1 pixel
        const left = l >> 8;
        if (left >= 0) {
            blitter.blit_v(left, top, one_len, alpha_mul(alpha, r - l));
        }
        return;
    }

    let left = l >> 8;

    if ((l & 0xFF) !== 0) {
        if (left >= 0) {
            blitter.blit_v(left, top, one_len, alpha_mul(alpha, 256 - (l & 0xFF)));
        }
        left += 1;
    }

    const right = r >> 8;
    const width = right - left;
    if (width > 0 && left >= 0) {
        call_hline_blitter(left, top, width, alpha, blitter);
    }

    if ((r & 0xFF) !== 0) {
        if (right >= 0) {
            blitter.blit_v(right, top, one_len, alpha_mul(alpha, r & 0xFF));
        }
    }
}


function call_hline_blitter(x:u32,
    y:u32,
    count:number,
    alpha: AlphaU8,
    blitter:Blitter): void {
    const HLINE_STACK_BUFFER: usize = 100;
    let  runs = [];
    let  aa = Array.from({length:HLINE_STACK_BUFFER},()=>0);
    count=count>>0
    do {
        // In theory, we should be able to just do this once (outside of the loop),
        // since aa[] and runs[] are supposed" to be const when we call the blitter.
        // In reality, some wrapper-blitters (e.g. RgnClipBlitter) cast away that
        // constness, and modify the buffers in-place. Hence the need to be defensive
        // here and reseed the aa value.
        aa[0] = alpha;

        let  n = count;
        if(n > HLINE_STACK_BUFFER) {
            n = HLINE_STACK_BUFFER as u32;
        }

      //  debug_assert!(n <= u16::MAX as u32);
        runs[0] = n
        runs[n as usize] = undefined;
        if(y!==undefined) {
            blitter.blit_anti_h(x, y, aa,runs);
        }
        x += n;

        if( n >= count || count == 0) {
            break;
        }

        count -= n;
    }while(true)
}


export function stroke_path(
    path: Path,
    line_cap: LineCap,
    clip: ScreenIntRect,
    blitter: Blitter,
) {
    hairline.stroke_path_impl(path, line_cap, clip, anti_hair_line_rgn, blitter);
}
