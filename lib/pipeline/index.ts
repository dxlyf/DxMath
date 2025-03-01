import { BlendMode } from "../blend_mode"
import { Color, PremultipliedColor, PremultipliedColorU8 } from "../color"
import { SubMaskRef } from "../mask"
import { Paint } from "../painter"
import { Transform } from "../path"
import { Rect } from "../path/rect"
import { PixmapRef, SubPixmapMut } from "../pixmap"
import { SpreadMode } from "../shader/gradient"
import { F32x8 } from "../wide/f32x8"
import { StageFn } from "./highp"

const MAX_STAGES=32
 enum Stage {
    MoveSourceToDestination = 0,
    MoveDestinationToSource,
    Clamp0,
    ClampA,
    Premultiply,
    UniformColor,
    SeedShader,
    LoadDestination,
    Store,
    LoadDestinationU8,
    StoreU8,
    Gather,
    LoadMaskU8,
    MaskU8,
    ScaleU8,
    LerpU8,
    Scale1Float,
    Lerp1Float,
    DestinationAtop,
    DestinationIn,
    DestinationOut,
    DestinationOver,
    SourceAtop,
    SourceIn,
    SourceOut,
    SourceOver,
    Clear,
    Modulate,
    Multiply,
    Plus,
    Screen,
    Xor,
    ColorBurn,
    ColorDodge,
    Darken,
    Difference,
    Exclusion,
    HardLight,
    Lighten,
    Overlay,
    SoftLight,
    Hue,
    Saturation,
    Color,
    Luminosity,
    SourceOverRgba,
    Transform,
    Reflect,
    Repeat,
    Bilinear,
    Bicubic,
    PadX1,
    ReflectX1,
    RepeatX1,
    Gradient,
    EvenlySpaced2StopGradient,
    XYToRadius,
    XYTo2PtConicalFocalOnCircle,
    XYTo2PtConicalWellBehaved,
    XYTo2PtConicalGreater,
    Mask2PtConicalDegenerates,
    ApplyVectorMask,
    GammaExpand2,
    GammaExpandDestination2,
    GammaCompress2,
    GammaExpand22,
    GammaExpandDestination22,
    GammaCompress22,
    GammaExpandSrgb,
    GammaExpandDestinationSrgb,
    GammaCompressSrgb,
}

export class MaskCtx{
    data!:Uint8Array
    real_width:u32=0
    offset(dx:usize,dy:usize):u32{
        return this.real_width*dy+dx
    }
}



export class RasterPipelineKind {
    static High_Type=1
    static Low_Type=2
    type:number
    functions:StageFn[]
    tailFunctions:StageFn[]
    constructor(type:number, functions:any[], tailFunctions:any[]) {
        this.type = type;
        this.functions = functions;
        this.tailFunctions = tailFunctions;
    }

    static High(functions:StageFn[], tailFunctions:StageFn[]) {
        return new RasterPipelineKind(this.High_Type, functions, tailFunctions);
    }

    static Low(functions:StageFn[], tailFunctions:StageFn[]) {
        return new RasterPipelineKind(this.Low_Type, functions, tailFunctions);
    }
}
export class SamplerCtx{
    static default(){
        return new this()
    }
     spread_mode: SpreadMode=SpreadMode.Pad
     inv_width: f32=0
     inv_height: f32=0
}
export class UniformColorCtx {
    static new(r: f32, g: f32, b: f32, a: f32,rgba:Uint16Array) {
        const ctx=new this()
        ctx.r=r
        ctx.g=g
        ctx.b=b
        ctx.a=a
        ctx.rgba=rgba
        return ctx
    }
    r: f32=0
    g: f32=0
    b: f32=0
    a: f32=0
    rgba: Uint16Array=new Uint16Array(4) // [0,255] in a 16-bit lane.
}
export class GradientColor {
    static new(r: f32, g: f32, b: f32, a: f32) {
        return new GradientColor(r, g, b, a);
    }
    static from(c:Color){
        return new GradientColor(c.r, c.g, c.b, c.a)
    }
     r!: f32
     g!: f32
     b!: f32
     a!: f32
     constructor(r: f32, g: f32, b: f32, a: f32) {
         this.r = r;
         this.g = g;
         this.b = b;
         this.a = a;
     }
}
export class EvenlySpaced2StopGradientCtx {
     factor!: GradientColor
     bias!: GradientColor
}
export class GradientCtx {
    /// This value stores the actual colors count.
    /// `factors` and `biases` must store at least 16 values,
    /// since this is the length of a lowp pipeline stage.
    /// So any any value past `len` is just zeros.
     len: usize=0
     factors:GradientColor[]=[]
     biases:GradientColor[]=[]
     t_values:NormalizedF32[]=[]
}
export class TwoPointConicalGradientCtx {
    // This context is used only in highp, where we use Tx4.
     mask!: F32x8
     p0!: f32
}
export class TileCtx {
     scale: f32=1
     inv_scale: f32=1 // cache of 1/scale
}

export class  Context {
    static default(){
        const ctx=new this()
        return ctx
    }
    current_coverage: f32=0
    sampler: SamplerCtx=SamplerCtx.default()
    uniform_color!: UniformColorCtx
    evenly_spaced_2_stop_gradient!: EvenlySpaced2StopGradientCtx
    gradient!: GradientCtx
    two_point_conical_gradient!: TwoPointConicalGradientCtx
    limit_x!: TileCtx
    limit_y!: TileCtx
    transform!: Transform
}
export class AAMaskCtx {
     pixels!:u8[]
     stride!: u32  // can be zero
     shift!: usize // mask offset/position in pixmap coordinates
}
export class RasterPipeline{
    kind!:RasterPipelineKind
    ctx!:Context

    run(rect:Rect,aa_mask_ctx:AAMaskCtx){

    }
}
export class RasterPipelineBuilder{
    static new(){
        return new this()
    }
    stages:Stage[]=[]
    force_hq_pipeline: bool=false
    ctx: Context=Context.default()
    set_force_hq_pipeline(hp:bool){
        this.force_hq_pipeline=hp
    }
    push(stage:Stage){
        this.stages.push(stage)
    }
    push_transform(ts: Transform) {
        const self=this;
        if( ts.is_finite() && !ts.is_identity()) {
            self.stages.push(Stage.Transform);
            self.ctx.transform = ts;
        }
    }
   push_uniform_color(c: PremultipliedColor) {
        const self=this;
        let r = c.red;
        let g = c.green;
        let b = c.blue;
        let a = c.alpha;
        let rgba = new Uint16Array([
            (r * 255.0 + 0.5) as u16,
            (g * 255.0 + 0.5) as u16,
            (b * 255.0 + 0.5) as u16,
            (a * 255.0 + 0.5) as u16,
        ]);

        let ctx = UniformColorCtx.new(r, g, b, a, rgba);

        self.stages.push(Stage.UniformColor);
        self.ctx.uniform_color = ctx;
    }
    compile():RasterPipeline{
        if(this.stages.length<=0){
            const rasterPipeline=new RasterPipeline()
            rasterPipeline.kind=RasterPipelineKind.High([],[])
            rasterPipeline.ctx=Context.default()
            return rasterPipeline
        }
        let is_lowp_compatible=this.stages.every(state=>!is_lowp_compatible.)
    }
}

export class RasterPipelineBlitter{
    static new(paint:Paint,pixmap:SubPixmapMut,mask?:SubMaskRef){
        if(mask){
            if(mask.size.width!=pixmap.size.width||mask.size.height!=pixmap.size.height){
                return
            }

        }
        if(paint.blend_mode===BlendMode.Destination){
            
        }else if(paint.blend_mode===BlendMode.DestinationIn&&paint.is__solid_color()){
            
        }
    }
    mask?:SubMaskRef
    pixmap_src!:PixmapRef
    pixmap!:SubPixmapMut
    memset2d_color?:PremultipliedColorU8
    blit_anti_h_rp!: RasterPipeline
    blit_rect_rp!: RasterPipeline
    blit_mask_rp!: RasterPipeline
    is_mask: bool=false
}